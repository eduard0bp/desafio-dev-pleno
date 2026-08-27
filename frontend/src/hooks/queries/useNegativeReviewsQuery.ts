import { useQuery } from '@tanstack/react-query';
import { listReviews } from '../../api';

const NEGATIVE_REVIEWS_PAGE_SIZE = 5;
const NEGATIVE_REVIEWS_POLL_INTERVAL_MS = 30000;

export function useNegativeReviewsQuery() {
  return useQuery({
    queryKey: ['reviews', 'negative-alerts'],
    queryFn: () => listReviews({ page: 1, pageSize: NEGATIVE_REVIEWS_PAGE_SIZE, sentiment: 'negative' }),
    refetchInterval: NEGATIVE_REVIEWS_POLL_INTERVAL_MS,
  });
}
