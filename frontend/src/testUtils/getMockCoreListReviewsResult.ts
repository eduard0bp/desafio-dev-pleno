import type { CoreListReviewsResult, CoreReviewListItem } from '../types';
import { getMockCoreReviewListItem } from './getMockCoreReviewListItem';

function computeCounts(data: CoreReviewListItem[]): CoreListReviewsResult['counts'] {
  const counts = { all: 0, pending: 0, processing: 0, completed: 0, failed: 0 };
  for (const item of data) {
    counts.all += 1;
    counts[item.status] += 1;
  }
  return counts;
}

export function getMockCoreListReviewsResult(overrides: Partial<CoreListReviewsResult> = {}): CoreListReviewsResult {
  const data = overrides.data ?? [getMockCoreReviewListItem()];
  return {
    data,
    pagination: { page: 1, pageSize: 10, total: data.length, totalPages: 1, ...overrides.pagination },
    counts: { ...computeCounts(data), ...overrides.counts },
  };
}
