import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewForm } from '../../src/components/ReviewForm';
import * as api from '../../src/api/reviews';

function renderForm() {
  const queryClient = new QueryClient();
  render(
    <MantineProvider>
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <ReviewForm />
      </QueryClientProvider>
    </MantineProvider>
  );
}

describe('ReviewForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('submits the filled-in data', async () => {
    const spy = vi.spyOn(api, 'createReview').mockResolvedValue({ id: '1', external_id: 'x', status: 'pending' });

    renderForm();
    fireEvent.change(screen.getByLabelText('Empresa'), { target: { value: 'company-1' } });
    fireEvent.change(screen.getByLabelText('Comentário'), { target: { value: 'Muito bom!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    await waitFor(() => expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ company_id: 'company-1', comment: 'Muito bom!' })
    ));
  });

  it('shows an error notification when the API call fails', async () => {
    vi.spyOn(api, 'createReview').mockRejectedValue(new Error('Falha ao enviar'));

    renderForm();
    fireEvent.change(screen.getByLabelText('Empresa'), { target: { value: 'company-1' } });
    fireEvent.change(screen.getByLabelText('Comentário'), { target: { value: 'Ruim' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    await waitFor(() => expect(screen.getByText('Falha ao enviar')).toBeInTheDocument());
  });
});
