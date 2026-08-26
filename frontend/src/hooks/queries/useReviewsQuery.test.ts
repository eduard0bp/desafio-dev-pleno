import { describe, it, expect } from 'vitest';
import { getReviewsRefetchInterval } from './useReviewsQuery';
import type { CoreReviewListItem } from '../../types';

function makeReview(status: CoreReviewListItem['status']): CoreReviewListItem {
  return {
    id: '1',
    external_id: 'x',
    company_id: 'c',
    rating: 5,
    status,
    analysis: null,
    created_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('getReviewsRefetchInterval', () => {
  it('returns false when there is no data yet', () => {
    expect(getReviewsRefetchInterval(undefined)).toBe(false);
  });

  it('returns false when the list is empty', () => {
    expect(getReviewsRefetchInterval([])).toBe(false);
  });

  it('returns 3000 when any review is pending', () => {
    expect(getReviewsRefetchInterval([makeReview('completed'), makeReview('pending')])).toBe(3000);
  });

  it('returns 3000 when any review is processing', () => {
    expect(getReviewsRefetchInterval([makeReview('processing')])).toBe(3000);
  });

  it('returns false when every review is in a terminal state', () => {
    expect(getReviewsRefetchInterval([makeReview('completed'), makeReview('failed')])).toBe(false);
  });
});
