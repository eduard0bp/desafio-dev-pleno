import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewsPage } from './ReviewsPage';
import { SelectedReviewProvider } from '../../context/SelectedReviewContext';
import { getMockCoreListReviewsResult } from '../../testUtils';
import * as api from '../../api';

describe('ReviewsPage', () => {
  it('renders the reviews monitoring list', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue(
      getMockCoreListReviewsResult({ data: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } })
    );
    const queryClient = new QueryClient();
    render(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <SelectedReviewProvider>
            <ReviewsPage />
          </SelectedReviewProvider>
        </QueryClientProvider>
      </MantineProvider>
    );
    await waitFor(() => expect(screen.getByText('Nenhuma avaliação cadastrada ainda.')).toBeInTheDocument());
  });
});
