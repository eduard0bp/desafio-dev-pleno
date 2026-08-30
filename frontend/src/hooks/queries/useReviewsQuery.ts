import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listReviews } from '../../api';
import type { CoreListReviewsParams, CoreListReviewsResult } from '../../types';

const IDLE_REFETCH_INTERVAL_MS = 15000;

export function getReviewsRefetchInterval(result: CoreListReviewsResult | undefined): number | false {
  if (!result) return false;
  return result.counts.pending + result.counts.processing > 0 ? 3000 : IDLE_REFETCH_INTERVAL_MS;
}

export function useReviewsQuery(params: CoreListReviewsParams) {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => listReviews(params),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => getReviewsRefetchInterval(query.state.data),
  });
}
