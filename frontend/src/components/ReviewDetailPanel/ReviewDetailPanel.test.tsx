import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewDetailPanel } from './ReviewDetailPanel';
import type { CoreReviewDetail } from '../../types';
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

function makeDetail(overrides: Partial<CoreReviewDetail>): CoreReviewDetail {
  return {
    id: '1',
    external_id: 'review-1',
    company_id: 'company-1',
    rating: 5,
    status: 'pending',
    comment: 'Muito bom',
    analysis: null,
    attempts: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    processed_at: null,
    last_error: null,
    ...overrides,
  };
}

describe('ReviewDetailPanel', () => {
  it('refreshes a processing review until it reaches a terminal state', async () => {
    const spy = vi
      .spyOn(api, 'getReview')
      .mockResolvedValueOnce(makeDetail({ status: 'processing' }))
      .mockResolvedValue(makeDetail({ status: 'completed', analysis: { sentiment: 'positive', category: 'general', confidence: 0.9, matched_keywords: [] } }));

    renderPanel();

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2), { timeout: 6000 });
    await waitFor(() => expect(screen.getByText('positive')).toBeInTheDocument());
  }, 10000);

  it('renders the last_error message when a review has failed', async () => {
    vi.spyOn(api, 'getReview').mockResolvedValue(
      makeDetail({ status: 'failed', last_error: { message: 'texto muito curto', code: 'VALIDATION_ERROR' } })
    );

    renderPanel();

    await waitFor(() => expect(screen.getByText('texto muito curto')).toBeInTheDocument());
  });
});
