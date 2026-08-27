import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { Sidebar } from './Sidebar';
import { getMockCoreListReviewsResult } from '../../testUtils';
import * as api from '../../api';

function renderSidebar(initialPath = '/') {
  vi.spyOn(api, 'listReviews').mockResolvedValue(getMockCoreListReviewsResult({ data: [] }));
  const queryClient = new QueryClient();
  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Sidebar />
        </MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>
  );
}

describe('Sidebar', () => {
  it('shows the brand logo', () => {
    renderSidebar();
    expect(screen.getByAltText('Falaê!')).toBeInTheDocument();
  });

  it('shows both section headings and their navigation items', () => {
    renderSidebar();
    expect(screen.getByText('Área do cliente')).toBeInTheDocument();
    expect(screen.getByText('Enviar Avaliação')).toBeInTheDocument();
    expect(screen.getByText('Painel interno')).toBeInTheDocument();
    expect(screen.getByText('Monitoramento')).toBeInTheDocument();
  });

  it('marks the item matching the current route as active', () => {
    renderSidebar('/avaliar');
    const activeLink = screen.getByText('Enviar Avaliação').closest('a');
    expect(activeLink).toHaveAttribute('data-active', 'true');
  });
});
