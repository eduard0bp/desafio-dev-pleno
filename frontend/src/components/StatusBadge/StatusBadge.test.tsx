import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { StatusBadge } from './StatusBadge';
import type { CoreReviewStatus } from '../../types';

function renderBadge(status: CoreReviewStatus) {
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

  it('shows "Processando" for processing', () => {
    renderBadge('processing');
    expect(screen.getByText('Processando')).toBeInTheDocument();
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
