import { describe, it, expect } from 'vitest';
import { createReviewSchema } from '../../src/validation';

describe('createReviewSchema', () => {
  it('accepts a valid payload', () => {
    const result = createReviewSchema.safeParse({
      external_id: 'review-order-123',
      company_id: 'company-456',
      rating: 2,
      comment: 'O pedido demorou muito e chegou frio.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects rating outside the 1-5 range', () => {
    const result = createReviewSchema.safeParse({
      external_id: 'x', company_id: 'y', rating: 6, comment: 'z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty comment', () => {
    const result = createReviewSchema.safeParse({
      external_id: 'x', company_id: 'y', rating: 3, comment: '',
    });
    expect(result.success).toBe(false);
  });
});
