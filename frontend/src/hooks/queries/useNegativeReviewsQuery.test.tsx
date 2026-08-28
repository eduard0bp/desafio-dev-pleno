import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNegativeReviewsQuery } from './useNegativeReviewsQuery';
import * as api from '../../api';
import { getMockCoreListReviewsResult } from '../../testUtils';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useNegativeReviewsQuery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches only unread negative reviews, capped at 5 per page', async () => {
    const spy = vi.spyOn(api, 'listReviews').mockResolvedValue(
      getMockCoreListReviewsResult({ data: [], pagination: { page: 1, pageSize: 5, total: 0, totalPages: 1 } })
    );

    const { result } = renderHook(() => useNegativeReviewsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ page: 1, pageSize: 5, sentiment: 'negative', isRead: false });
  });
});
