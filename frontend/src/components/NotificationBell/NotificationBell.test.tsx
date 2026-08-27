import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationBell } from './NotificationBell';
import { SelectedReviewModal } from '../SelectedReviewModal/SelectedReviewModal';
import { SelectedReviewProvider } from '../../context/SelectedReviewContext';
import { getMockCoreReviewListItem, getMockCoreListReviewsResult, getMockCoreReviewDetail } from '../../testUtils';
import * as api from '../../api';

function renderBell() {
  const queryClient = new QueryClient();
  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <SelectedReviewProvider>
          <NotificationBell />
          <SelectedReviewModal />
        </SelectedReviewProvider>
      </QueryClientProvider>
    </MantineProvider>
  );
}

describe('NotificationBell', () => {
  it('requests only unread, negative-sentiment reviews', async () => {
    const spy = vi.spyOn(api, 'listReviews').mockResolvedValue(getMockCoreListReviewsResult({ data: [] }));
    renderBell();
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ sentiment: 'negative', isRead: false, pageSize: 5 })
      )
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

  it('opens the review detail modal and marks the review as read when a notification is clicked', async () => {
    vi.spyOn(api, 'listReviews')
      .mockResolvedValueOnce(
        getMockCoreListReviewsResult({
          data: [getMockCoreReviewListItem({ id: 'neg-1', company_id: 'Padaria Trigo Dourado' })],
          pagination: { page: 1, pageSize: 5, total: 3, totalPages: 1 },
        })
      )
      // Refetched after the review is marked as read — the backend now
      // excludes it from the unread/negative result.
      .mockResolvedValue(
        getMockCoreListReviewsResult({ data: [], pagination: { page: 1, pageSize: 5, total: 2, totalPages: 1 } })
      );
    const markReadSpy = vi.spyOn(api, 'markReviewAsRead').mockResolvedValue({ id: 'neg-1', is_read: true });
    vi.spyOn(api, 'getReview').mockResolvedValue(getMockCoreReviewDetail({ company_id: 'Padaria Trigo Dourado' }));
    renderBell();
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Avaliações negativas' }));
    fireEvent.click(await screen.findByRole('button', { name: /Padaria Trigo Dourado/ }));

    await waitFor(() => expect(markReadSpy).toHaveBeenCalledWith('neg-1'));

    const dialog = await screen.findByRole('dialog', { name: 'Detalhe da avaliação' });
    await waitFor(() => expect(within(dialog).getByText('Padaria Trigo Dourado')).toBeInTheDocument());

    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
  });
});
