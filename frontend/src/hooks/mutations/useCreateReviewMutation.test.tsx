import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateReviewMutation } from './useCreateReviewMutation';
import * as api from '../../api';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <MantineProvider>
      <Notifications />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MantineProvider>
  );
}

describe('useCreateReviewMutation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls createReview with the submitted values and invokes onCreated', async () => {
    vi.spyOn(api, 'createReview').mockResolvedValue({ id: '1', external_id: 'x', status: 'pending' });
    const onCreated = vi.fn();

    const { result } = renderHook(() => useCreateReviewMutation(onCreated), { wrapper });

    act(() => {
      result.current.mutate({ external_id: 'x', company_id: 'c', rating: 5, comment: 'ótimo produto' });
    });

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  });

  it('surfaces the API error without throwing', async () => {
    vi.spyOn(api, 'createReview').mockRejectedValue(new Error('Falha ao enviar avaliação'));

    const { result } = renderHook(() => useCreateReviewMutation(), { wrapper });

    act(() => {
      result.current.mutate({ external_id: 'x', company_id: 'c', rating: 5, comment: 'ótimo produto' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
