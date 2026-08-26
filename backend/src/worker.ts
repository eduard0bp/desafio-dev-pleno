import 'dotenv/config';
import { Worker, UnrecoverableError, type Job } from 'bullmq';
import { connection } from './lib/redis';
import { REVIEW_QUEUE_NAME, type ReviewJobData } from './queue/reviewQueue';
import { prisma } from './lib/prisma';
import { analyzeReview, RetryableAnalysisError, NonRetryableAnalysisError } from './services/analysisClient';
import { computeBackoffDelayMs } from './lib/retry';

type JobLike = { data: ReviewJobData; attemptsMade: number };

export async function processReviewJob(job: JobLike): Promise<void> {
  const review = await prisma.review.findUniqueOrThrow({ where: { id: job.data.reviewId } });

  await prisma.review.update({
    where: { id: review.id },
    data: { status: 'processing', attempts: { increment: 1 } },
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
  } catch (err) {
    if (err instanceof NonRetryableAnalysisError) {
      await prisma.review.update({
        where: { id: review.id },
        data: { status: 'failed', lastError: { code: err.code, message: err.message } },
      });
      throw new UnrecoverableError(err.message);
    }

    if (err instanceof RetryableAnalysisError) {
      await prisma.review.update({
        where: { id: review.id },
        data: { lastError: { message: err.message } },
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
        .catch((updateErr) => console.error('Failed to mark review as failed', updateErr));
    }
  });

  return worker;
}

if (process.env.NODE_ENV !== 'test') {
  startWorker();
  console.log('Review processing worker started');
}
