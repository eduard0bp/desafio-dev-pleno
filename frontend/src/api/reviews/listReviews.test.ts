import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listReviews } from './listReviews';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('listReviews', () => {
  it('returns data/pagination/counts and sends filters as query params', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: '1',
            external_id: 'x',
            company_id: 'c',
            rating: 5,
            status: 'pending',
            analysis: null,
            created_at: '2026-01-01',
          },
        ],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
        counts: { all: 1, pending: 1, processing: 0, completed: 0, failed: 0 },
      }),
    } as Response);

    const result = await listReviews({ page: 1, pageSize: 10, status: 'pending', search: 'acme' });
    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('status=pending');
    expect(calledUrl).toContain('search=acme');
  });

  it('throws a friendly message when the connection itself fails (not just a non-2xx response)', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(listReviews({ page: 1, pageSize: 10 })).rejects.toThrow('Falha ao carregar avaliações');
  });
});
