import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getReview } from './getReview';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('getReview', () => {
  it('returns the detail', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', external_id: 'x', status: 'completed', analysis: null }),
    } as Response);

    const result = await getReview('1');
    expect(result.status).toBe('completed');
  });
});
