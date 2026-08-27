import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { ReviewStatus } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';
import { reviewQueue, enqueueReviewJob } from '../../src/queue/reviewQueue';
import { reconcileStuckReviews } from '../../src/jobs/reconciliationService';

const THRESHOLD_MS = 5 * 60 * 1000;

async function createReview(status: ReviewStatus, createdAt: Date) {
  return prisma.review.create({
    data: {
      externalId: `reconcile-${randomUUID()}`,
      companyId: 'c1',
      rating: 3,
      comment: 'a review stuck in a bad state',
      status,
      createdAt,
    },
  });
}

describe('reconcileStuckReviews', () => {
  afterEach(async () => {
    await prisma.review.deleteMany({ where: { externalId: { startsWith: 'reconcile-' } } });
  });

  afterAll(async () => {
    await reviewQueue.close();
  });

  it('re-enqueues a pending review older than the threshold that has no job', async () => {
    const review = await createReview('pending', new Date(Date.now() - 10 * 60 * 1000));

    const reconciled = await reconcileStuckReviews(THRESHOLD_MS);

    expect(reconciled).toBe(1);
    const job = await reviewQueue.getJob(review.id);
    expect(job).not.toBeNull();
  });

  it('does not touch a pending review still within the threshold (still in-flight)', async () => {
    const review = await createReview('pending', new Date());

    const reconciled = await reconcileStuckReviews(THRESHOLD_MS);

    expect(reconciled).toBe(0);
    const job = await reviewQueue.getJob(review.id);
    expect(job).toBeUndefined();
  });

  it('does not re-enqueue an old pending review that already has a job', async () => {
    const review = await createReview('pending', new Date(Date.now() - 10 * 60 * 1000));
    await enqueueReviewJob({ reviewId: review.id });

    const reconciled = await reconcileStuckReviews(THRESHOLD_MS);

    expect(reconciled).toBe(0);
  });

  it('does not touch reviews that are processing, completed, or failed', async () => {
    const old = new Date(Date.now() - 10 * 60 * 1000);
    await createReview('processing', old);
    await createReview('completed', old);
    await createReview('failed', old);

    const reconciled = await reconcileStuckReviews(THRESHOLD_MS);

    expect(reconciled).toBe(0);
  });
});
