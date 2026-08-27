import { prisma } from '../lib/prisma';
import { reviewQueue, enqueueReviewJob } from '../queue/reviewQueue';
import { log } from '../lib/logger';

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
    log('warn', 'review_reconciled', { reviewId: review.id, externalId: review.externalId });
  }

  return reconciled;
}

export function startReconciliationLoop(intervalMs = 60_000): NodeJS.Timeout {
  return setInterval(() => {
    reconcileStuckReviews().catch((err) =>
      log('error', 'review_reconciliation_error', { message: err instanceof Error ? err.message : String(err) })
    );
  }, intervalMs);
}
