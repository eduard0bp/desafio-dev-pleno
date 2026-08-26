import { describe, it, expect } from 'vitest';
import { getReviewsRefetchInterval } from './useReviewsQuery';
import { getMockCoreReviewListItem } from '../../testUtils';
import type { CoreReviewListItem } from '../../types';

function review(status: CoreReviewListItem['status']) {
  return getMockCoreReviewListItem({ status });
}

describe('getReviewsRefetchInterval', () => {
  it('returns false when there is no data yet', () => {
    expect(getReviewsRefetchInterval(undefined)).toBe(false);
  });

  it('returns false when the list is empty', () => {
    expect(getReviewsRefetchInterval([])).toBe(false);
  });

  it('returns 3000 when any review is pending', () => {
    expect(getReviewsRefetchInterval([review('completed'), review('pending')])).toBe(3000);
  });

  it('returns 3000 when any review is processing', () => {
    expect(getReviewsRefetchInterval([review('processing')])).toBe(3000);
  });

  it('returns false when every review is in a terminal state', () => {
    expect(getReviewsRefetchInterval([review('completed'), review('failed')])).toBe(false);
  });
});
