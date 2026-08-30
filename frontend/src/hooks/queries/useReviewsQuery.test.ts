import { describe, it, expect } from 'vitest';
import { getReviewsRefetchInterval } from './useReviewsQuery';
import type { CoreListReviewsResult } from '../../types';

function result(counts: Partial<CoreListReviewsResult['counts']>): CoreListReviewsResult {
  return {
    data: [],
    pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    counts: { all: 0, pending: 0, processing: 0, completed: 0, failed: 0, ...counts },
  };
}

describe('getReviewsRefetchInterval', () => {
  it('returns false when there is no data yet', () => {
    expect(getReviewsRefetchInterval(undefined)).toBe(false);
  });

  it('falls back to a slower baseline poll when nothing is pending or processing, so newly created reviews are still picked up', () => {
    expect(getReviewsRefetchInterval(result({ completed: 3, failed: 1 }))).toBe(15000);
  });

  it('returns 3000 when something is pending', () => {
    expect(getReviewsRefetchInterval(result({ pending: 1 }))).toBe(3000);
  });

  it('returns 3000 when something is processing', () => {
    expect(getReviewsRefetchInterval(result({ processing: 1 }))).toBe(3000);
  });
});
