import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMarkReviewAsReadMutation } from './useMarkReviewAsReadMutation';
import * as api from '../../api';

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useMarkReviewAsReadMutation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls markReviewAsRead and invalidates the reviews queries on success', async () => {
    vi.spyOn(api, 'markReviewAsRead').mockResolvedValue({ id: 'r1', is_read: true });
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMarkReviewAsReadMutation(), { wrapper: makeWrapper(queryClient) });

    act(() => {
      result.current.mutate('r1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reviews'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['review', 'r1'] });
  });

  it('surfaces the error without throwing when the API call fails', async () => {
    vi.spyOn(api, 'markReviewAsRead').mockRejectedValue(new Error('Falha ao marcar avaliação como lida'));
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useMarkReviewAsReadMutation(), { wrapper: makeWrapper(queryClient) });

    act(() => {
      result.current.mutate('r1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
