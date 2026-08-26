import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReview, listReviews, getReview } from './reviewsApi';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('reviews api client', () => {
  it('createReview sends a POST and returns the body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', external_id: 'x', status: 'pending' }),
    } as Response);

    const result = await createReview({ external_id: 'x', company_id: 'c', rating: 5, comment: 'ótimo' });
    expect(result).toEqual({ id: '1', external_id: 'x', status: 'pending' });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/reviews'), expect.objectContaining({ method: 'POST' }));
  });

  it('createReview throws an error with the API message when it fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Payload inválido' } }),
    } as Response);

    await expect(createReview({ external_id: 'x', company_id: 'c', rating: 5, comment: '' })).rejects.toThrow('Payload inválido');
  });

  it('listReviews returns data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: '1', external_id: 'x', company_id: 'c', rating: 5, status: 'pending', analysis: null, created_at: '2026-01-01' }] }),
    } as Response);

    const result = await listReviews();
    expect(result).toHaveLength(1);
  });

  it('getReview returns the detail', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', external_id: 'x', status: 'completed', analysis: null }),
    } as Response);

    const result = await getReview('1');
    expect(result.status).toBe('completed');
  });
});
