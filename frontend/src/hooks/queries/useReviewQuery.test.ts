import { describe, it, expect } from 'vitest';
import { getReviewRefetchInterval } from './useReviewQuery';
import type { CoreReviewDetail } from '../../types';

function makeReview(status: CoreReviewDetail['status']): CoreReviewDetail {
  return {
    id: '1',
    external_id: 'x',
    company_id: 'c',
    rating: 5,
    status,
    analysis: null,
    created_at: '2026-01-01T00:00:00.000Z',
    comment: 'ok comment',
    attempts: 0,
    processed_at: null,
    last_error: null,
  };
}

describe('getReviewRefetchInterval', () => {
  it('returns false when there is no data yet', () => {
    expect(getReviewRefetchInterval(undefined)).toBe(false);
  });

  it('returns 3000 while pending', () => {
    expect(getReviewRefetchInterval(makeReview('pending'))).toBe(3000);
  });

  it('returns 3000 while processing', () => {
    expect(getReviewRefetchInterval(makeReview('processing'))).toBe(3000);
  });

  it('returns false once completed', () => {
    expect(getReviewRefetchInterval(makeReview('completed'))).toBe(false);
  });

  it('returns false once failed', () => {
    expect(getReviewRefetchInterval(makeReview('failed'))).toBe(false);
  });
});
