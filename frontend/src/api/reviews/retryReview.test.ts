import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retryReview } from './retryReview';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('retryReview', () => {
  it('sends a POST to the retry endpoint and returns the updated status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', external_id: 'x', status: 'pending' }),
    } as Response);

    const result = await retryReview('1');
    expect(result).toEqual({ id: '1', external_id: 'x', status: 'pending' });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/reviews/1/retry'), expect.objectContaining({ method: 'POST' }));
  });

  it('throws an error with the API message when it fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Avaliação não encontrada' } }),
    } as Response);

    await expect(retryReview('1')).rejects.toThrow('Avaliação não encontrada');
  });
});
