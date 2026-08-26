import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AvaliacoesPage } from './AvaliacoesPage';
import * as api from '../../api';

describe('AvaliacoesPage', () => {
  it('renders the reviews monitoring list', async () => {
    vi.spyOn(api, 'listReviews').mockResolvedValue([]);
    const queryClient = new QueryClient();
    render(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <AvaliacoesPage />
        </QueryClientProvider>
      </MantineProvider>
    );
    await waitFor(() => expect(screen.getByText('Nenhuma avaliação cadastrada ainda.')).toBeInTheDocument());
  });
});
