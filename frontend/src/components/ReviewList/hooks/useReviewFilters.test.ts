import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReviewFilters } from './useReviewFilters';

describe('useReviewFilters', () => {
  it('starts with no filters applied and page 1', () => {
    const { result } = renderHook(() => useReviewFilters());

    expect(result.current.search).toBe('');
    expect(result.current.status).toBe('all');
    expect(result.current.minRating).toBeNull();
    expect(result.current.dateFrom).toBeNull();
    expect(result.current.dateTo).toBeNull();
    expect(result.current.page).toBe(1);
  });

  it('debounces the search value', async () => {
    const { result } = renderHook(() => useReviewFilters());

    act(() => result.current.setSearch('acme'));
    expect(result.current.search).toBe('acme');

    await waitFor(() => expect(result.current.debouncedSearch).toBe('acme'), { timeout: 1000 });
  });

  it('resets page to 1 whenever a filter changes', () => {
    const { result } = renderHook(() => useReviewFilters());

    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);

    act(() => result.current.setStatus('failed'));
    expect(result.current.page).toBe(1);

    act(() => result.current.setPage(2));
    act(() => result.current.setMinRating(4));
    expect(result.current.page).toBe(1);

    act(() => result.current.setPage(2));
    act(() => result.current.setDateFrom(new Date('2026-01-01')));
    expect(result.current.page).toBe(1);

    act(() => result.current.setPage(2));
    act(() => result.current.setDateTo(new Date('2026-01-31')));
    expect(result.current.page).toBe(1);
  });

  it('clearFieldFilters resets search/rating/date but leaves status untouched', async () => {
    const { result } = renderHook(() => useReviewFilters());

    act(() => {
      result.current.setSearch('acme');
      result.current.setStatus('failed');
      result.current.setMinRating(4);
      result.current.setDateFrom(new Date('2026-01-01'));
      result.current.setDateTo(new Date('2026-01-31'));
    });

    act(() => result.current.clearFieldFilters());

    expect(result.current.search).toBe('');
    expect(result.current.minRating).toBeNull();
    expect(result.current.dateFrom).toBeNull();
    expect(result.current.dateTo).toBeNull();
    expect(result.current.status).toBe('failed');
    await waitFor(() => expect(result.current.debouncedSearch).toBe(''), { timeout: 1000 });
  });
});
