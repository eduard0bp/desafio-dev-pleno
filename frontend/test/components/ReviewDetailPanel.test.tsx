import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewDetailPanel, getDetailRefetchInterval } from '../../src/components/ReviewDetailPanel';
import type { ReviewDetail } from '../../src/api/reviews';
import * as api from '../../src/api/reviews';

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

function makeDetail(overrides: Partial<ReviewDetail>): ReviewDetail {
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

describe('getDetailRefetchInterval', () => {
  it('returns a truthy interval while the review is pending', () => {
    expect(getDetailRefetchInterval(makeDetail({ status: 'pending' }))).toBe(3000);
  });

  it('returns a truthy interval while the review is processing', () => {
    expect(getDetailRefetchInterval(makeDetail({ status: 'processing' }))).toBe(3000);
  });

  it('stops polling once the review is completed', () => {
    expect(getDetailRefetchInterval(makeDetail({ status: 'completed' }))).toBe(false);
  });

  it('stops polling once the review is failed', () => {
    expect(getDetailRefetchInterval(makeDetail({ status: 'failed' }))).toBe(false);
  });

  it('stops polling when there is no data yet', () => {
    expect(getDetailRefetchInterval(undefined)).toBe(false);
  });
});

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
