import { describe, it, expect } from 'vitest';
import { createReviewSchema, listReviewsQuerySchema } from '../../src/validation';

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

describe('listReviewsQuerySchema', () => {
  it('defaults page to 1 and pageSize to 10 when omitted', () => {
    const result = listReviewsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(10);
    }
  });

  it('coerces string query params to numbers', () => {
    const result = listReviewsQuerySchema.safeParse({ page: '3', pageSize: '25', minRating: '4' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.pageSize).toBe(25);
      expect(result.data.minRating).toBe(4);
    }
  });

  it('rejects a pageSize above 100', () => {
    const result = listReviewsQuerySchema.safeParse({ pageSize: '101' });
    expect(result.success).toBe(false);
  });

  it('rejects a page below 1', () => {
    const result = listReviewsQuerySchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid status', () => {
    const result = listReviewsQuerySchema.safeParse({ status: 'failed' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid status', () => {
    const result = listReviewsQuerySchema.safeParse({ status: 'archived' });
    expect(result.success).toBe(false);
  });

  it('rejects a minRating outside 1-5', () => {
    const result = listReviewsQuerySchema.safeParse({ minRating: '6' });
    expect(result.success).toBe(false);
  });

  it('coerces dateFrom/dateTo strings to Date instances', () => {
    const result = listReviewsQuerySchema.safeParse({ dateFrom: '2026-01-01', dateTo: '2026-01-31' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dateFrom).toBeInstanceOf(Date);
      expect(result.data.dateTo).toBeInstanceOf(Date);
    }
  });

  it('rejects an invalid dateFrom', () => {
    const result = listReviewsQuerySchema.safeParse({ dateFrom: 'not-a-date' });
    expect(result.success).toBe(false);
  });
});
