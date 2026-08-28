import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markReviewAsRead } from './markReviewAsRead';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('markReviewAsRead', () => {
  it('sends a POST to the read endpoint and returns the updated flag', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', is_read: true }),
    } as Response);

    const result = await markReviewAsRead('1');
    expect(result).toEqual({ id: '1', is_read: true });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/reviews/1/read'), expect.objectContaining({ method: 'POST' }));
  });

  it('throws an error with the API message when it fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Avaliação não encontrada' } }),
    } as Response);

    await expect(markReviewAsRead('1')).rejects.toThrow('Avaliação não encontrada');
  });
});
