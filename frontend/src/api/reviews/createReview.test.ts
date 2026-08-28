import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReview } from './createReview';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('createReview', () => {
  it('sends a POST and returns the body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', external_id: 'x', status: 'pending' }),
    } as Response);

    const result = await createReview({ external_id: 'x', company_id: 'c', rating: 5, comment: 'ótimo' });
    expect(result).toEqual({ id: '1', external_id: 'x', status: 'pending' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reviews'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws an error with the API message when it fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Payload inválido' } }),
    } as Response);

    await expect(createReview({ external_id: 'x', company_id: 'c', rating: 5, comment: '' })).rejects.toThrow(
      'Payload inválido',
    );
  });
});
