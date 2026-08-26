import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { computeStatusCounts, filterReviews, paginate, useReviewFilters } from './useReviewFilters';
import type { CoreReviewListItem } from '../../../types';

function makeReview(overrides: Partial<CoreReviewListItem>): CoreReviewListItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    external_id: 'review-x',
    company_id: 'Acme',
    rating: 5,
    status: 'completed',
    analysis: null,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeStatusCounts', () => {
  it('counts each status and the total', () => {
    const reviews = [
      makeReview({ status: 'pending' }),
      makeReview({ status: 'pending' }),
      makeReview({ status: 'completed' }),
      makeReview({ status: 'failed' }),
    ];
    expect(computeStatusCounts(reviews)).toEqual({ all: 4, pending: 2, processing: 0, completed: 1, failed: 1 });
  });

  it('returns all zeros for an empty list', () => {
    expect(computeStatusCounts([])).toEqual({ all: 0, pending: 0, processing: 0, completed: 0, failed: 0 });
  });
});

describe('filterReviews', () => {
  const reviews = [
    makeReview({ id: '1', company_id: 'Acme Corp', rating: 5, status: 'completed', created_at: '2026-01-10T00:00:00.000Z' }),
    makeReview({ id: '2', company_id: 'Globex', rating: 2, status: 'failed', created_at: '2026-01-15T00:00:00.000Z' }),
    makeReview({ id: '3', company_id: 'acme foods', rating: 3, status: 'pending', created_at: '2026-01-20T00:00:00.000Z' }),
  ];

  it('returns everything with no filters applied', () => {
    expect(filterReviews(reviews, { search: '', status: 'all', minRating: null, dateRange: [null, null] })).toHaveLength(3);
  });

  it('filters by status', () => {
    const result = filterReviews(reviews, { search: '', status: 'failed', minRating: null, dateRange: [null, null] });
    expect(result.map((r) => r.id)).toEqual(['2']);
  });

  it('filters by minimum rating', () => {
    const result = filterReviews(reviews, { search: '', status: 'all', minRating: 3, dateRange: [null, null] });
    expect(result.map((r) => r.id).sort()).toEqual(['1', '3']);
  });

  it('filters by company search, case-insensitive', () => {
    const result = filterReviews(reviews, { search: 'acme', status: 'all', minRating: null, dateRange: [null, null] });
    expect(result.map((r) => r.id).sort()).toEqual(['1', '3']);
  });

  it('filters by date range, inclusive of the end date', () => {
    const result = filterReviews(reviews, {
      search: '',
      status: 'all',
      minRating: null,
      dateRange: [new Date('2026-01-12'), new Date('2026-01-15')],
    });
    expect(result.map((r) => r.id)).toEqual(['2']);
  });

  it('combines multiple filters', () => {
    const result = filterReviews(reviews, { search: 'acme', status: 'pending', minRating: null, dateRange: [null, null] });
    expect(result.map((r) => r.id)).toEqual(['3']);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i);

  it('returns the first page', () => {
    expect(paginate(items, 1, 10)).toEqual(items.slice(0, 10));
  });

  it('returns the last, partial page', () => {
    expect(paginate(items, 3, 10)).toEqual(items.slice(20, 25));
  });
});

describe('useReviewFilters', () => {
  it('paginates, filters, and resets to page 1 when a filter changes', () => {
    const reviews = Array.from({ length: 15 }, (_, i) =>
      makeReview({ id: String(i), status: i < 5 ? 'pending' : 'completed' })
    );

    const { result } = renderHook(() => useReviewFilters(reviews, 10));

    expect(result.current.reviews).toHaveLength(10);
    expect(result.current.totalPages).toBe(2);

    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);
    expect(result.current.reviews).toHaveLength(5);

    act(() => result.current.setStatus('pending'));
    expect(result.current.page).toBe(1);
    expect(result.current.filteredCount).toBe(5);
    expect(result.current.counts).toEqual({ all: 15, pending: 5, processing: 0, completed: 10, failed: 0 });
  });
});
