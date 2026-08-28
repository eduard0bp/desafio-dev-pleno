import { describe, it, expect } from 'vitest';
import type { Review } from '@prisma/client';
import { toListItem, toDetail } from './reviewMapper';

const baseReview: Review = {
  id: 'r1',
  externalId: 'review-order-123',
  companyId: 'company-456',
  rating: 2,
  comment: 'O pedido demorou muito e chegou frio.',
  status: 'completed',
  analysis: { sentiment: 'negative', category: 'delivery', confidence: 0.91 },
  isRead: false,
  attempts: 2,
  lastError: null,
  createdAt: new Date('2026-08-21T12:00:00.000Z'),
  processedAt: new Date('2026-08-21T12:00:04.000Z'),
};

describe('toListItem', () => {
  it('maps camelCase Prisma fields to the snake_case API contract', () => {
    expect(toListItem(baseReview)).toEqual({
      id: 'r1',
      external_id: 'review-order-123',
      company_id: 'company-456',
      rating: 2,
      comment: 'O pedido demorou muito e chegou frio.',
      status: 'completed',
      analysis: { sentiment: 'negative', category: 'delivery', confidence: 0.91 },
      is_read: false,
      created_at: baseReview.createdAt,
    });
  });

  it('does not include attempts, processed_at or last_error', () => {
    const item = toListItem(baseReview) as Record<string, unknown>;
    expect(item.attempts).toBeUndefined();
    expect(item.processed_at).toBeUndefined();
    expect(item.last_error).toBeUndefined();
  });
});

describe('toDetail', () => {
  it('extends the list item with attempts, processed_at and last_error', () => {
    expect(toDetail(baseReview)).toEqual({
      id: 'r1',
      external_id: 'review-order-123',
      company_id: 'company-456',
      rating: 2,
      comment: 'O pedido demorou muito e chegou frio.',
      status: 'completed',
      analysis: { sentiment: 'negative', category: 'delivery', confidence: 0.91 },
      is_read: false,
      created_at: baseReview.createdAt,
      attempts: 2,
      processed_at: baseReview.processedAt,
      last_error: null,
    });
  });

  it('surfaces a structured last_error for failed reviews', () => {
    const failed: Review = {
      ...baseReview,
      status: 'failed',
      analysis: null,
      lastError: { message: 'HTTP 503', code: 'RETRYABLE' },
    };

    expect(toDetail(failed).last_error).toEqual({ message: 'HTTP 503', code: 'RETRYABLE' });
  });
});
