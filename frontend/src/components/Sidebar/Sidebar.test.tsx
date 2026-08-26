import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import { Sidebar } from './Sidebar';

function renderSidebar(initialPath = '/') {
  render(
    <MantineProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Sidebar />
      </MemoryRouter>
    </MantineProvider>
  );
}

describe('Sidebar', () => {
  it('shows the brand name', () => {
    renderSidebar();
    expect(screen.getByText('Falaê!')).toBeInTheDocument();
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
