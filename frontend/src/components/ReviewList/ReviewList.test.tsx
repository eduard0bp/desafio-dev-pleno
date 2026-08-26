import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewList } from './ReviewList';
import { getMockCoreReviewListItem } from '../../testUtils';
import * as api from '../../api';

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

  it('shows the reviews returned by the API, including analysis', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue([
      getMockCoreReviewListItem({
        company_id: 'Acme Corp',
        status: 'completed',
        analysis: { sentiment: 'positive', category: 'delivery', confidence: 0.9, matched_keywords: [] },
      }),
    ]);
    renderList();
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('Positivo')).toBeInTheDocument();
    expect(screen.getByText('Entrega')).toBeInTheDocument();
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

  it('filters the table by status using the pill controls', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue([
      getMockCoreReviewListItem({ company_id: 'Acme', status: 'completed' }),
      getMockCoreReviewListItem({ company_id: 'Globex', status: 'failed' }),
    ]);
    renderList();
    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument());
    expect(screen.getByText('Globex')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Falhas (1)'));

    await waitFor(() => expect(screen.queryByText('Acme')).not.toBeInTheDocument());
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('filters the table by company search', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue([
      getMockCoreReviewListItem({ company_id: 'Acme Corp' }),
      getMockCoreReviewListItem({ company_id: 'Globex' }),
    ]);
    renderList();
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Buscar por empresa...'), { target: { value: 'globex' } });

    await waitFor(() => expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument());
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('paginates when there are more reviews than fit on one page', async () => {
    const reviews = Array.from({ length: 12 }, (_, i) => getMockCoreReviewListItem({ id: String(i), company_id: `Empresa ${i}` }));
    vi.spyOn(api, 'listReviews').mockResolvedValue(reviews);
    renderList();

    await waitFor(() => expect(screen.getByText('Empresa 0')).toBeInTheDocument());
    expect(screen.getByText('Mostrando 1-10 de 12 avaliações')).toBeInTheDocument();
    expect(screen.queryByText('Empresa 11')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => expect(screen.getByText('Empresa 11')).toBeInTheDocument());
  });
});
