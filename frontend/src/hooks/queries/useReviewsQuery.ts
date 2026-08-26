import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listReviews } from '../../api';
import type { CoreListReviewsParams, CoreListReviewsResult } from '../../types';

export function getReviewsRefetchInterval(result: CoreListReviewsResult | undefined): number | false {
  if (!result) return false;
  return result.counts.pending + result.counts.processing > 0 ? 3000 : false;
}

export function useReviewsQuery(params: CoreListReviewsParams) {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => listReviews(params),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => getReviewsRefetchInterval(query.state.data),
  });
}
