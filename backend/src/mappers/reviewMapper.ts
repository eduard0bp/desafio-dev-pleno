import type { Review } from '@prisma/client';
import type { CoreReviewListItem, CoreReviewDetail } from '../types';

export function toListItem(review: Review): CoreReviewListItem {
  return {
    id: review.id,
    external_id: review.externalId,
    company_id: review.companyId,
    rating: review.rating,
    comment: review.comment,
    status: review.status as CoreReviewListItem['status'],
    analysis: review.analysis as CoreReviewListItem['analysis'],
    is_read: review.isRead,
    created_at: review.createdAt,
  };
}

export function toDetail(review: Review): CoreReviewDetail {
  return {
    ...toListItem(review),
    comment: review.comment,
    attempts: review.attempts,
    processed_at: review.processedAt,
    last_error: review.lastError as CoreReviewDetail['last_error'],
  };
}
