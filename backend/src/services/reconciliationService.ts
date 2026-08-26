import { prisma } from '../lib/prisma';
import { reviewQueue, enqueueReviewJob } from '../queue/reviewQueue';

/**
 * A review can be persisted but never get a job published if the process
 * crashes between the two steps (no transaction spans Postgres + Redis).
 * A review still "pending" after this long has no queued/active job
 * backing it, so it is safe to assume it was orphaned and re-enqueue it.
 */
export const STUCK_PENDING_THRESHOLD_MS = 2 * 60 * 1000;

export async function reconcileStuckReviews(thresholdMs = STUCK_PENDING_THRESHOLD_MS): Promise<number> {
  const cutoff = new Date(Date.now() - thresholdMs);
  const stuckReviews = await prisma.review.findMany({
    where: { status: 'pending', createdAt: { lt: cutoff } },
  });

  let reconciled = 0;
  for (const review of stuckReviews) {
    const existingJob = await reviewQueue.getJob(review.id);
    if (existingJob) continue;

    await enqueueReviewJob({ reviewId: review.id });
    reconciled += 1;
  }

  return reconciled;
}

export function startReconciliationLoop(intervalMs = 60_000): NodeJS.Timeout {
  return setInterval(() => {
    reconcileStuckReviews().catch((err) => console.error('Review reconciliation failed', err));
  }, intervalMs);
}
