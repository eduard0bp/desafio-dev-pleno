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

  it('rejects a comment shorter than 3 characters', () => {
    const result = createReviewSchema.safeParse({
      external_id: 'x', company_id: 'y', rating: 3, comment: 'ok',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a comment longer than 2000 characters', () => {
    const result = createReviewSchema.safeParse({
      external_id: 'x', company_id: 'y', rating: 3, comment: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts a comment at the 2000-character boundary', () => {
    const result = createReviewSchema.safeParse({
      external_id: 'x', company_id: 'y', rating: 3, comment: 'a'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('rejects an external_id longer than 100 characters', () => {
    const result = createReviewSchema.safeParse({
      external_id: 'x'.repeat(101), company_id: 'y', rating: 3, comment: 'comentário válido',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a company_id longer than 100 characters', () => {
    const result = createReviewSchema.safeParse({
      external_id: 'x', company_id: 'y'.repeat(101), rating: 3, comment: 'comentário válido',
    });
    expect(result.success).toBe(false);
  });
});
