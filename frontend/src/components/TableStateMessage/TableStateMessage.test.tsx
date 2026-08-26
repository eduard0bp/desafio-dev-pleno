import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';
import { TableStateMessage } from './TableStateMessage';

function renderMessage(props: Partial<React.ComponentProps<typeof TableStateMessage>> = {}) {
  render(
    <MantineProvider>
      <TableStateMessage icon={<IconInbox />} title="Nenhum registro" {...props} />
    </MantineProvider>
  );
}

describe('TableStateMessage', () => {
  it('renders the title', () => {
    renderMessage();
    expect(screen.getByText('Nenhum registro')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    renderMessage({ description: 'Tente ajustar os filtros.' });
    expect(screen.getByText('Tente ajustar os filtros.')).toBeInTheDocument();
  });

  it('omits the description when not provided', () => {
    renderMessage();
    expect(screen.queryByText('Tente ajustar os filtros.')).not.toBeInTheDocument();
  });
});
