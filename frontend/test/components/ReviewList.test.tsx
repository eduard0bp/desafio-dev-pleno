import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewList } from '../../src/components/ReviewList';
import * as api from '../../src/api/reviews';

function renderList() {
  const queryClient = new QueryClient();
  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <ReviewList />
      </QueryClientProvider>
    </MantineProvider>
  );
}

describe('ReviewList', () => {
  it('shows an empty state when there are no reviews', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue([]);
    renderList();
    await waitFor(() => expect(screen.getByText('Nenhuma avaliação cadastrada ainda.')).toBeInTheDocument());
  });

  it('shows the reviews returned by the API', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue([
      { id: '1', external_id: 'review-1', rating: 5, status: 'completed', created_at: '2026-01-01T00:00:00.000Z' },
    ]);
    renderList();
    await waitFor(() => expect(screen.getByText('review-1')).toBeInTheDocument());
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  // TanStack Query retries failed queries by default (3 retries with backoff),
  // so the error state can take several seconds to surface. Both the test's own
  // timeout and the waitFor timeout are extended here rather than disabling
  // retries in the component (which would reduce production resilience to
  // transient network blips during polling).
  it('shows an error message when the API call fails', async () => {
    vi.spyOn(api, 'listReviews').mockRejectedValue(new Error('Falha ao carregar avaliações'));
    renderList();
    await waitFor(
      () => expect(screen.getByText('Falha ao carregar avaliações')).toBeInTheDocument(),
      { timeout: 10000 }
    );
  }, 15000);
});
