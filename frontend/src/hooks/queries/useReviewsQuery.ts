import { useQuery } from '@tanstack/react-query';
import { listReviews } from '../../api';
import type { CoreReviewListItem } from '../../types';

const ACTIVE_STATUSES = new Set<CoreReviewListItem['status']>(['pending', 'processing']);

export function getReviewsRefetchInterval(reviews: CoreReviewListItem[] | undefined): number | false {
  if (!reviews) return false;
  return reviews.some((review) => ACTIVE_STATUSES.has(review.status)) ? 3000 : false;
}

export function useReviewsQuery() {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: listReviews,
    refetchInterval: (query) => getReviewsRefetchInterval(query.state.data),
  });
}
