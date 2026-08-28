import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NewReviewPage } from './NewReviewPage';

describe('NewReviewPage', () => {
  it('renders the review submission form', () => {
    const queryClient = new QueryClient();
    render(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <NewReviewPage />
        </QueryClientProvider>
      </MantineProvider>
    );
    expect(screen.getByRole('button', { name: 'Enviar avaliação' })).toBeInTheDocument();
  });
});
