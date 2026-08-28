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
});
