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
});
