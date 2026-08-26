import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { StatusBadge } from '../../src/components/StatusBadge';

function renderBadge(status: 'pending' | 'processing' | 'completed' | 'failed') {
  render(
    <MantineProvider>
      <StatusBadge status={status} />
    </MantineProvider>
  );
}

describe('StatusBadge', () => {
  it('shows "Pendente" for pending', () => {
    renderBadge('pending');
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('shows "Concluído" for completed', () => {
    renderBadge('completed');
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('shows "Falhou" for failed', () => {
    renderBadge('failed');
    expect(screen.getByText('Falhou')).toBeInTheDocument();
  });
});
