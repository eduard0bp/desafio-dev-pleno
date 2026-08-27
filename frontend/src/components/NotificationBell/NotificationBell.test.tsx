import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationBell } from './NotificationBell';
import { getMockCoreReviewListItem, getMockCoreListReviewsResult } from '../../testUtils';
import * as api from '../../api';

function renderBell() {
  const queryClient = new QueryClient();
  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>
    </MantineProvider>
  );
}

describe('NotificationBell', () => {
  it('requests only negative-sentiment reviews', async () => {
    const spy = vi.spyOn(api, 'listReviews').mockResolvedValue(getMockCoreListReviewsResult({ data: [] }));
    renderBell();
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ sentiment: 'negative', pageSize: 5 }))
    );
  });

  it('shows an empty message when there are no negative reviews', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue(getMockCoreListReviewsResult({ data: [] }));
    renderBell();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Avaliações negativas' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Avaliações negativas' }));

    await waitFor(() => expect(screen.getByText('Nenhuma avaliação negativa por enquanto.')).toBeInTheDocument());
  });

  it('shows the negative reviews and their count when clicked', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue(
      getMockCoreListReviewsResult({
        data: [getMockCoreReviewListItem({ company_id: 'Padaria Trigo Dourado', comment: 'Comida chegou fria.' })],
        pagination: { page: 1, pageSize: 5, total: 3, totalPages: 1 },
      })
    );
    renderBell();
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Avaliações negativas' }));

    await waitFor(() => expect(screen.getByText('Padaria Trigo Dourado')).toBeInTheDocument());
    expect(screen.getByText('Comida chegou fria.')).toBeInTheDocument();
  });
});
