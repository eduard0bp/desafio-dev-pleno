import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewList } from './ReviewList';
import { getMockCoreReviewListItem, getMockCoreListReviewsResult } from '../../testUtils';
import type { CoreListReviewsParams, CoreListReviewsResult, CoreReviewListItem } from '../../types';
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

/**
 * Stands in for the real backend: applies the same status/search/pagination
 * semantics GET /reviews implements, over an in-memory list, so component
 * interactions (clicking a status pill, typing a search, changing page)
 * exercise a real request/response round-trip instead of local slicing.
 */
function fakeListReviews(allReviews: CoreReviewListItem[]) {
  return async (params: CoreListReviewsParams): Promise<CoreListReviewsResult> => {
    const filtered = allReviews.filter((review) => {
      if (params.status && review.status !== params.status) return false;
      if (params.search && !review.company_id.toLowerCase().includes(params.search.toLowerCase())) return false;
      return true;
    });

    const start = (params.page - 1) * params.pageSize;
    const data = filtered.slice(start, start + params.pageSize);

    const counts = { all: 0, pending: 0, processing: 0, completed: 0, failed: 0 };
    for (const review of allReviews) {
      if (params.search && !review.company_id.toLowerCase().includes(params.search.toLowerCase())) continue;
      counts.all += 1;
      counts[review.status] += 1;
    }

    return {
      data,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / params.pageSize)),
      },
      counts,
    };
  };
}

describe('ReviewList', () => {
  it('shows an empty state when there are no reviews', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue(
      getMockCoreListReviewsResult({ data: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } })
    );
    renderList();
    await waitFor(() => expect(screen.getByText('Nenhuma avaliação cadastrada ainda.')).toBeInTheDocument());
  });

  it('shows the reviews returned by the API, including analysis', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue(
      getMockCoreListReviewsResult({
        data: [
          getMockCoreReviewListItem({
            company_id: 'Acme Corp',
            status: 'completed',
            analysis: { sentiment: 'positive', category: 'delivery', confidence: 0.9, matched_keywords: [] },
          }),
        ],
      })
    );
    renderList();
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    const row = screen.getByRole('row', { name: /Acme Corp/ });
    expect(within(row).getByText('Concluído')).toBeInTheDocument();
    expect(within(row).getByText('Positivo')).toBeInTheDocument();
    expect(within(row).getByText('Entrega')).toBeInTheDocument();
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

  it('sends the selected status as a query param when a pill is clicked', async () => {
    const reviews = [
      getMockCoreReviewListItem({ company_id: 'Acme', status: 'completed' }),
      getMockCoreReviewListItem({ company_id: 'Globex', status: 'failed' }),
    ];
    const spy = vi.spyOn(api, 'listReviews').mockImplementation(fakeListReviews(reviews));
    renderList();
    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument());
    expect(screen.getByText('Globex')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Falhas (1)'));

    await waitFor(() => expect(screen.queryByText('Acme')).not.toBeInTheDocument());
    expect(screen.getByText('Globex')).toBeInTheDocument();
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'failed', page: 1 }));
  });

  it('debounces the search input before sending it as a query param', async () => {
    const reviews = [
      getMockCoreReviewListItem({ company_id: 'Acme Corp' }),
      getMockCoreReviewListItem({ company_id: 'Globex' }),
    ];
    const spy = vi.spyOn(api, 'listReviews').mockImplementation(fakeListReviews(reviews));
    renderList();
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Buscar por empresa...'), { target: { value: 'globex' } });

    // Debounce delays the network call — search text updates immediately, but
    // the API isn't called with it right away.
    expect(spy).not.toHaveBeenLastCalledWith(expect.objectContaining({ search: 'globex' }));

    await waitFor(() => expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument(), { timeout: 1000 });
    expect(screen.getByText('Globex')).toBeInTheDocument();
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'globex' }));
  });

  it('paginates via the pagination control, requesting the next page from the API', async () => {
    const reviews = Array.from({ length: 12 }, (_, i) => getMockCoreReviewListItem({ id: String(i), company_id: `Empresa ${i}` }));
    const spy = vi.spyOn(api, 'listReviews').mockImplementation(fakeListReviews(reviews));
    renderList();

    await waitFor(() => expect(screen.getByText('Empresa 0')).toBeInTheDocument());
    expect(screen.getByText('Mostrando 1-10 de 12 avaliações')).toBeInTheDocument();
    expect(screen.queryByText('Empresa 11')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => expect(screen.getByText('Empresa 11')).toBeInTheDocument());
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('shows a retry button only for a failed review, and clicking it retries without opening the modal', async () => {
    const reviews = [
      getMockCoreReviewListItem({ id: 'ok-1', company_id: 'Acme', status: 'completed' }),
      getMockCoreReviewListItem({ id: 'fail-1', company_id: 'Globex', status: 'failed' }),
    ];
    vi.spyOn(api, 'listReviews').mockImplementation(fakeListReviews(reviews));
    const retrySpy = vi.spyOn(api, 'retryReview').mockResolvedValue({ id: 'fail-1', external_id: 'x', status: 'pending' });

    renderList();
    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument());

    const buttons = screen.getAllByRole('button', { name: 'Reprocessar avaliação' });
    expect(buttons).toHaveLength(1);

    fireEvent.click(buttons[0]);

    await waitFor(() => expect(retrySpy).toHaveBeenCalledWith('fail-1'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows an active-filter count on the mobile Filtros button and opens the drawer on click', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue(getMockCoreListReviewsResult({ data: [] }));
    renderList();
    await waitFor(() => expect(screen.getByText('Nenhuma avaliação cadastrada ainda.')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Buscar por empresa...'), { target: { value: 'acme' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Filtros (1)' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Filtros (1)' }));
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Filtros' })).toBeInTheDocument());
  });

  it('does not query with drawer field edits until "Aplicar filtros" is clicked', async () => {
    const spy = vi.spyOn(api, 'listReviews').mockResolvedValue(getMockCoreListReviewsResult({ data: [] }));
    renderList();
    await waitFor(() => expect(screen.getByText('Nenhuma avaliação cadastrada ainda.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    const dialog = await screen.findByRole('dialog', { name: 'Filtros' });

    const callsBeforeEdit = spy.mock.calls.length;
    fireEvent.change(within(dialog).getByPlaceholderText('Buscar por empresa...'), { target: { value: 'acme' } });
    expect(spy.mock.calls.length).toBe(callsBeforeEdit);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar filtros' }));
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'acme' })));
  });

  it('clears field filters via the drawer\'s "Limpar filtros" button, and "Aplicar filtros" closes it', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue(getMockCoreListReviewsResult({ data: [] }));
    renderList();
    await waitFor(() => expect(screen.getByText('Nenhuma avaliação cadastrada ainda.')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Buscar por empresa...'), { target: { value: 'acme' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Filtros (1)' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Filtros (1)' }));
    const dialog = await screen.findByRole('dialog', { name: 'Filtros' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Limpar filtros' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Filtros \(/ })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar filtros' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
