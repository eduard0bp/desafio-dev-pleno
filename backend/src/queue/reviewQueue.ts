import { Queue } from 'bullmq';
import { connection } from '../lib/redis';

export const REVIEW_QUEUE_NAME = 'review-processing';

export interface ReviewJobData {
  reviewId: string;
  mockScenario?: string;
  requestId?: string;
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

export async function removeReviewJob(reviewId: string): Promise<void> {
  const job = await reviewQueue.getJob(reviewId);
  if (job) await job.remove();
}
