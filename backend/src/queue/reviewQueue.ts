import { Queue } from 'bullmq';
import { connection } from '../lib/redis';

export const REVIEW_QUEUE_NAME = 'review-processing';

export interface ReviewJobData {
  reviewId: string;
  mockScenario?: string;
}

export const reviewQueue = new Queue<ReviewJobData>(REVIEW_QUEUE_NAME, { connection });

export async function enqueueReviewJob(data: ReviewJobData): Promise<void> {
  await reviewQueue.add('process-review', data, {
    jobId: data.reviewId,
    attempts: 5,
    backoff: { type: 'custom' },
    removeOnComplete: 100,
    removeOnFail: 100,
  });
}

/**
 * A job's BullMQ id is stable (the review id), so a terminal (failed) job
 * from a previous attempt must be removed before enqueueing a fresh one —
 * otherwise add() is a no-op against the already-existing job.
 */
export async function removeReviewJob(reviewId: string): Promise<void> {
  const job = await reviewQueue.getJob(reviewId);
  if (job) await job.remove();
}
