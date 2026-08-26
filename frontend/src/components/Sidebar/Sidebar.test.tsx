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

  it('shows both navigation items', () => {
    renderSidebar();
    expect(screen.getByText('Avaliações')).toBeInTheDocument();
    expect(screen.getByText('Nova Avaliação')).toBeInTheDocument();
  });

  it('marks the item matching the current route as active', () => {
    renderSidebar('/nova-avaliacao');
    const activeLink = screen.getByText('Nova Avaliação').closest('a');
    expect(activeLink).toHaveAttribute('data-active', 'true');
  });
});
