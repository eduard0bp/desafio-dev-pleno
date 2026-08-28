import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Worker } from 'bullmq';
import { prisma } from '../../src/lib/prisma';
import { reviewQueue, enqueueReviewJob, type ReviewJobData } from '../../src/queue/reviewQueue';
import { startWorker } from '../../src/worker';

async function waitForStatus(reviewId: string, status: string, timeoutMs = 10000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const review = await prisma.review.findUniqueOrThrow({ where: { id: reviewId } });
    if (review.status === status) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Timed out waiting for review ${reviewId} to reach status "${status}"`);
}

describe('async pipeline (real worker + real queue + real fake-analysis call)', () => {
  let worker: Worker<ReviewJobData>;

  beforeAll(() => {
    worker = startWorker();
  });

  afterAll(async () => {
    await worker.close();
    await reviewQueue.close();
  });

  it('processes a queued review end-to-end: pending -> processing -> completed with analysis saved', async () => {
    const review = await prisma.review.create({
      data: {
        externalId: `pipeline-${randomUUID()}`,
        companyId: 'c1',
        rating: 4,
        comment: 'Entrega rápida e produto de qualidade, recomendo.',
      },
    });

    await enqueueReviewJob({ reviewId: review.id, mockScenario: 'success' });

    await waitForStatus(review.id, 'completed');

    const completed = await prisma.review.findUniqueOrThrow({ where: { id: review.id } });
    expect(completed.status).toBe('completed');
    expect(completed.attempts).toBe(1);
    expect(completed.processedAt).not.toBeNull();
    expect(completed.analysis).toBeTruthy();

    await prisma.review.delete({ where: { id: review.id } });
  }, 15000);

  it('marks a review as failed once all retry attempts are exhausted (real worker "failed" handler)', async () => {
    const review = await prisma.review.create({
      data: {
        externalId: `pipeline-${randomUUID()}`,
        companyId: 'c1',
        rating: 1,
        comment: 'Vai falhar de propósito em todas as tentativas.',
      },
    });

    // Bypass enqueueReviewJob's default attempts so the test doesn't wait through 5 real backoffs.
    await reviewQueue.add(
      'process-review',
      { reviewId: review.id, mockScenario: 'server-error' },
      { jobId: review.id, attempts: 2, backoff: { type: 'custom' }, removeOnComplete: 100, removeOnFail: 100 },
    );

    await waitForStatus(review.id, 'failed', 20000);

    const failed = await prisma.review.findUniqueOrThrow({ where: { id: review.id } });
    expect(failed.status).toBe('failed');
    expect(failed.attempts).toBe(2);
    expect(failed.lastError).toBeTruthy();

    await prisma.review.delete({ where: { id: review.id } });
  }, 25000);

  it('recovers via real retries: fails against the real mock API, then completes once it stops failing', async () => {
    const review = await prisma.review.create({
      data: {
        externalId: `pipeline-${randomUUID()}`,
        companyId: 'c1',
        rating: 3,
        comment: 'Vai falhar uma vez de verdade e depois se recuperar.',
      },
    });

    // No function is mocked here: x-mock-scenario: server-error makes the *real* mock API
    // return a real 503 on the first attempt. Once BullMQ's real retry fires the 'failed'
    // event for that attempt, we flip the job's own data to mockScenario: 'success' via
    // BullMQ's public updateData API — same as an operator fixing the external condition
    // between retries — so the *next real attempt* hits the real API again and succeeds.
    function onFailed(job: { data: ReviewJobData; attemptsMade: number; updateData: (data: ReviewJobData) => Promise<void> }) {
      if (job.data.reviewId === review.id && job.attemptsMade === 1) {
        void job.updateData({ ...job.data, mockScenario: 'success' });
        worker.off('failed', onFailed);
      }
    }
    worker.on('failed', onFailed);

    await reviewQueue.add(
      'process-review',
      { reviewId: review.id, mockScenario: 'server-error' },
      { jobId: review.id, attempts: 3, backoff: { type: 'custom' }, removeOnComplete: 100, removeOnFail: 100 },
    );

    await waitForStatus(review.id, 'completed', 20000);

    const completed = await prisma.review.findUniqueOrThrow({ where: { id: review.id } });
    expect(completed.status).toBe('completed');
    expect(completed.attempts).toBe(2);
    expect(completed.analysis).toBeTruthy();

    await prisma.review.delete({ where: { id: review.id } });
  }, 25000);
});
