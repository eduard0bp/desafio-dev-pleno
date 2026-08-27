import { faker } from '@faker-js/faker';
import type { CoreReviewDetail } from '../types';

export function getMockCoreReviewDetail(overrides: Partial<CoreReviewDetail> = {}): CoreReviewDetail {
  return {
    id: faker.string.uuid(),
    external_id: `review-${faker.string.uuid()}`,
    company_id: faker.company.name(),
    rating: faker.number.int({ min: 1, max: 5 }),
    status: 'pending',
    comment: faker.lorem.sentence(),
    analysis: null,
    is_read: false,
    attempts: 0,
    created_at: faker.date.recent({ days: 30 }).toISOString(),
    processed_at: null,
    last_error: null,
    ...overrides,
  };
}
