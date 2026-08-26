import type { CoreReviewDetail } from '../types';

export function getMockCoreReviewDetail(overrides: Partial<CoreReviewDetail> = {}): CoreReviewDetail {
  return {
    id: '1',
    external_id: 'review-1',
    company_id: 'company-1',
    rating: 5,
    status: 'pending',
    comment: 'Muito bom',
    analysis: null,
    attempts: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    processed_at: null,
    last_error: null,
    ...overrides,
  };
}
