import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewDetailPanel } from './ReviewDetailPanel';
import { getMockCoreReviewDetail } from '../../testUtils';
import * as api from '../../api';

function renderPanel(reviewId = '1') {
  const queryClient = new QueryClient();
  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <ReviewDetailPanel reviewId={reviewId} />
      </QueryClientProvider>
    </MantineProvider>
  );
}

describe('ReviewDetailPanel', () => {
  it('refreshes a processing review until it reaches a terminal state', async () => {
    const spy = vi
      .spyOn(api, 'getReview')
      .mockResolvedValueOnce(getMockCoreReviewDetail({ status: 'processing' }))
      .mockResolvedValue(
        getMockCoreReviewDetail({
          status: 'completed',
          analysis: { sentiment: 'positive', category: 'general', confidence: 0.9, matched_keywords: [] },
        })
      );

    renderPanel();

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2), { timeout: 6000 });
    await waitFor(() => expect(screen.getByText('Positivo')).toBeInTheDocument());
  }, 10000);

  it('renders the last_error message when a review has failed', async () => {
    vi.spyOn(api, 'getReview').mockResolvedValue(
      getMockCoreReviewDetail({ status: 'failed', last_error: { message: 'texto muito curto', code: 'VALIDATION_ERROR' } })
    );

    renderPanel();

    await waitFor(() => expect(screen.getByText('texto muito curto')).toBeInTheDocument());
  });
});
