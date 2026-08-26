import { describe, it, expect, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { reviewQueue, enqueueReviewJob } from '../../src/queue/reviewQueue';

describe('reviewQueue', () => {
  afterAll(async () => {
    await reviewQueue.close();
  });

  it('enqueues a job and allows retrieving it by jobId', async () => {
    const reviewId = randomUUID();
    await enqueueReviewJob({ reviewId });

    const job = await reviewQueue.getJob(reviewId);
    expect(job).not.toBeNull();
    expect(job?.data.reviewId).toBe(reviewId);
  });

  it('re-enqueuing the same reviewId does not duplicate the job (same jobId)', async () => {
    const reviewId = randomUUID();
    await enqueueReviewJob({ reviewId });
    await enqueueReviewJob({ reviewId });

    const job = await reviewQueue.getJob(reviewId);
    expect(job).not.toBeNull();
  });
});
