import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, screen, waitFor, act } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRetryReviewMutation } from './useRetryReviewMutation';
import * as api from '../../api';

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MantineProvider>
        <Notifications />
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MantineProvider>
    );
  };
}

describe('useRetryReviewMutation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a success notification and invalidates the reviews queries', async () => {
    vi.spyOn(api, 'retryReview').mockResolvedValue({ id: 'r1', external_id: 'x', status: 'pending' });
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRetryReviewMutation(), { wrapper: makeWrapper(queryClient) });

    act(() => {
      result.current.mutate('r1');
    });

    await waitFor(() => expect(screen.getByText('Avaliação enviada para reprocessamento')).toBeInTheDocument());
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reviews'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['review', 'r1'] });
  });

  it('shows an error notification with the API message on failure', async () => {
    vi.spyOn(api, 'retryReview').mockRejectedValue(new Error('Avaliação não encontrada'));
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useRetryReviewMutation(), { wrapper: makeWrapper(queryClient) });

    act(() => {
      result.current.mutate('r1');
    });

    await waitFor(() => expect(screen.getByText('Avaliação não encontrada')).toBeInTheDocument());
  });
});
