import { faker } from '@faker-js/faker';
import type { CoreReviewListItem } from '../types';

export function getMockCoreReviewListItem(overrides: Partial<CoreReviewListItem> = {}): CoreReviewListItem {
  return {
    id: faker.string.uuid(),
    external_id: `review-${faker.string.uuid()}`,
    company_id: faker.company.name(),
    rating: faker.number.int({ min: 1, max: 5 }),
    comment: faker.lorem.sentence(),
    status: 'completed',
    analysis: null,
    created_at: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}
