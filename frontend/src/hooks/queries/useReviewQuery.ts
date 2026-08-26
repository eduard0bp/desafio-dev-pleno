import { useQuery } from '@tanstack/react-query';
import { getReview } from '../../api';
import type { CoreReviewDetail } from '../../types';

const ACTIVE_STATUSES = new Set<CoreReviewDetail['status']>(['pending', 'processing']);

export function getReviewRefetchInterval(review: CoreReviewDetail | undefined): number | false {
  if (!review) return false;
  return ACTIVE_STATUSES.has(review.status) ? 3000 : false;
}

export function useReviewQuery(reviewId: string) {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: () => getReview(reviewId),
    refetchInterval: (query) => getReviewRefetchInterval(query.state.data),
  });
}
