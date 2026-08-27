import 'dotenv/config';
import { createServer } from 'node:http';
import { Worker, UnrecoverableError, type Job } from 'bullmq';
import { connection } from './lib/redis';
import { REVIEW_QUEUE_NAME, type ReviewJobData } from './queue/reviewQueue';
import { prisma } from './lib/prisma';
import { analyzeReview, RetryableAnalysisError, NonRetryableAnalysisError } from './services/analysisClient';
import { computeBackoffDelayMs } from './lib/retry';
import { startReconciliationLoop } from './jobs/reconciliationService';
import { alertNegativeReview } from './services/alertService';
import { checkHealth } from './lib/health';
import { config } from './config';
import { log } from './lib/logger';

type JobLike = { data: ReviewJobData; attemptsMade: number };

export async function processReviewJob(job: JobLike): Promise<void> {
  const review = await prisma.review.findUniqueOrThrow({ where: { id: job.data.reviewId } });
  const requestId = job.data.requestId;

  await prisma.review.update({
    where: { id: review.id },
    data: { status: 'processing', attempts: { increment: 1 } },
  });

  log('info', 'review_processing_started', {
    reviewId: review.id,
    externalId: review.externalId,
    attempt: review.attempts + 1,
    requestId,
  });

  try {
    const result = await analyzeReview({
      reviewId: review.externalId,
      companyId: review.companyId,
      rating: review.rating,
      text: review.comment,
      mockScenario: job.data.mockScenario,
    });

    await prisma.review.update({
      where: { id: review.id },
      data: { status: 'completed', analysis: result.analysis, processedAt: new Date() },
    });

    log('info', 'review_processing_completed', {
      reviewId: review.id,
      externalId: review.externalId,
      sentiment: result.analysis.sentiment,
      category: result.analysis.category,
      requestId,
    });

    if (result.analysis.sentiment === 'negative') {
      alertNegativeReview({
        reviewId: review.id,
        externalId: review.externalId,
        companyId: review.companyId,
        rating: review.rating,
        sentiment: result.analysis.sentiment,
        category: result.analysis.category,
        confidence: result.analysis.confidence,
      });
    }
  } catch (err) {
    if (err instanceof NonRetryableAnalysisError) {
      await prisma.review.update({
        where: { id: review.id },
        data: { status: 'failed', lastError: { code: err.code, message: err.message } },
      });
      log('warn', 'review_processing_failed_permanently', {
        reviewId: review.id,
        externalId: review.externalId,
        code: err.code,
        message: err.message,
        requestId,
      });
      throw new UnrecoverableError(err.message);
    }

    if (err instanceof RetryableAnalysisError) {
      await prisma.review.update({
        where: { id: review.id },
        data: { lastError: { message: err.message } },
      });
      log('warn', 'review_processing_retry_scheduled', {
        reviewId: review.id,
        externalId: review.externalId,
        message: err.message,
        requestId,
      });
    }

    throw err;
  }
}

export function startWorker(): Worker<ReviewJobData> {
  const worker = new Worker<ReviewJobData>(
    REVIEW_QUEUE_NAME,
    (job: Job<ReviewJobData>) => processReviewJob(job),
    {
      connection,
      settings: {
        backoffStrategy: (attemptsMade: number, _type?: string, err?: Error) => {
          const retryAfterSeconds = err instanceof RetryableAnalysisError ? err.retryAfterSeconds : undefined;
          return computeBackoffDelayMs(attemptsMade, retryAfterSeconds);
        },
      },
    }
  );

  worker.on('failed', async (job, err) => {
    if (!job) return;
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade >= maxAttempts) {
      await prisma.review
        .update({ where: { id: job.data.reviewId }, data: { status: 'failed', lastError: { message: err.message } } })
        .then(() =>
          log('warn', 'review_processing_attempts_exhausted', {
            reviewId: job.data.reviewId,
            attemptsMade: job.attemptsMade,
            message: err.message,
            requestId: job.data.requestId,
          })
        )
        .catch((updateErr) =>
          log('error', 'review_mark_failed_error', {
            reviewId: job.data.reviewId,
            message: updateErr instanceof Error ? updateErr.message : String(updateErr),
          })
        );
    }
  });

  return worker;
}

function startHealthServer() {
  const server = createServer((req, res) => {
    if (req.url !== '/health') {
      res.writeHead(404);
      return res.end();
    }

    checkHealth().then(({ postgres, redis }) => {
      const healthy = postgres && redis;
      res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: healthy ? 'ok' : 'degraded', postgres, redis }));
    });
  });

  server.listen(config.WORKER_PORT, () => {
    log('info', 'worker_health_server_started', { port: config.WORKER_PORT });
  });

  return server;
}

if (process.env.NODE_ENV !== 'test') {
  const worker = startWorker();
  const reconciliationInterval = startReconciliationLoop();
  const healthServer = startHealthServer();
  log('info', 'worker_started');

  process.on('SIGTERM', async () => {
    log('info', 'worker_shutting_down', {});
    clearInterval(reconciliationInterval);
    healthServer.close();
    await worker.close();
    process.exit(0);
  });
}
