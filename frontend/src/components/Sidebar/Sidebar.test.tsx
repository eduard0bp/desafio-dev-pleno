import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Sidebar } from './Sidebar';

function renderSidebar() {
  render(
    <MantineProvider>
      <Sidebar />
    </MantineProvider>
  );
}

describe('Sidebar', () => {
  it('shows the brand name', () => {
    renderSidebar();
    expect(screen.getByText('Falaê!')).toBeInTheDocument();
  });

  it('shows the Avaliações navigation item', () => {
    renderSidebar();
    expect(screen.getByText('Avaliações')).toBeInTheDocument();
  });
});
