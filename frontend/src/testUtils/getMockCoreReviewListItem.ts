import type { CoreReviewListItem } from '../types';

export function getMockCoreReviewListItem(overrides: Partial<CoreReviewListItem> = {}): CoreReviewListItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    external_id: 'review-1',
    company_id: 'Acme Corp',
    rating: 5,
    status: 'completed',
    analysis: null,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
