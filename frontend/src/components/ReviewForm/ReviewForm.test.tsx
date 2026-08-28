import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewForm } from './ReviewForm';
import * as api from '../../api';

function renderForm() {
  const queryClient = new QueryClient();
  render(
    <MantineProvider>
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <ReviewForm />
      </QueryClientProvider>
    </MantineProvider>,
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

    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ company_id: 'company-1', comment: 'Muito bom!' })),
    );
  });

  it('shows an error notification when the API call fails', async () => {
    vi.spyOn(api, 'createReview').mockRejectedValue(new Error('Falha ao enviar'));

    renderForm();
    fireEvent.change(screen.getByLabelText('Empresa'), { target: { value: 'company-1' } });
    fireEvent.change(screen.getByLabelText('Comentário'), { target: { value: 'Ruim' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    await waitFor(() => expect(screen.getByText('Falha ao enviar')).toBeInTheDocument());
  });

  it('shows an inline error when the comment is too short', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Empresa'), { target: { value: 'company-1' } });
    fireEvent.change(screen.getByLabelText('Comentário'), { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    await waitFor(() => expect(screen.getByText('O comentário deve ter pelo menos 3 caracteres')).toBeInTheDocument());
  });

  it('shows inline errors instead of submitting when required fields are empty', async () => {
    const spy = vi.spyOn(api, 'createReview');

    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    await waitFor(() => expect(screen.getByText('Informe a empresa')).toBeInTheDocument());
    expect(screen.getByText('O comentário deve ter pelo menos 3 caracteres')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('renders a star rating control', () => {
    renderForm();
    expect(screen.getByText('Nota')).toBeInTheDocument();
    expect(screen.getAllByRole('radio').length).toBeGreaterThanOrEqual(5);
  });

  it('shows a live character counter for the comment, capped at 2000', () => {
    renderForm();
    expect(screen.getByText('0/2000 caracteres')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Comentário'), { target: { value: 'Muito bom!' } });
    expect(screen.getByText('10/2000 caracteres')).toBeInTheDocument();

    expect(screen.getByLabelText('Comentário')).toHaveAttribute('maxLength', '2000');
  });

  it('shows an inline error when the comment exceeds 2000 characters', async () => {
    const spy = vi.spyOn(api, 'createReview');

    renderForm();
    fireEvent.change(screen.getByLabelText('Empresa'), { target: { value: 'company-1' } });
    fireEvent.change(screen.getByLabelText('Comentário'), { target: { value: 'a'.repeat(2001) } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    await waitFor(() =>
      expect(screen.getByText('O comentário deve ter no máximo 2000 caracteres')).toBeInTheDocument(),
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows an inline error when the company name exceeds 100 characters', async () => {
    const spy = vi.spyOn(api, 'createReview');

    renderForm();
    fireEvent.change(screen.getByLabelText('Empresa'), { target: { value: 'a'.repeat(101) } });
    fireEvent.change(screen.getByLabelText('Comentário'), { target: { value: 'comentário válido' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    await waitFor(() =>
      expect(screen.getByText('O nome da empresa deve ter no máximo 100 caracteres')).toBeInTheDocument(),
    );
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Empresa')).toHaveAttribute('maxLength', '100');
  });
});
