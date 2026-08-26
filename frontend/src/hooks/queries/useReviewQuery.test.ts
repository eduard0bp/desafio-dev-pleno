import { describe, it, expect } from 'vitest';
import { getReviewRefetchInterval } from './useReviewQuery';
import { getMockCoreReviewDetail } from '../../testUtils';
import type { CoreReviewDetail } from '../../types';

function review(status: CoreReviewDetail['status']) {
  return getMockCoreReviewDetail({ status });
}

describe('getReviewRefetchInterval', () => {
  it('returns false when there is no data yet', () => {
    expect(getReviewRefetchInterval(undefined)).toBe(false);
  });

  it('returns 3000 while pending', () => {
    expect(getReviewRefetchInterval(review('pending'))).toBe(3000);
  });

  it('returns 3000 while processing', () => {
    expect(getReviewRefetchInterval(review('processing'))).toBe(3000);
  });

  it('returns false once completed', () => {
    expect(getReviewRefetchInterval(review('completed'))).toBe(false);
  });

  it('returns false once failed', () => {
    expect(getReviewRefetchInterval(review('failed'))).toBe(false);
  });
});
