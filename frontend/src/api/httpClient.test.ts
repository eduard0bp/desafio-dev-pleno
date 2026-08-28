import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestJson } from './httpClient';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('requestJson', () => {
  it('resolves with the parsed body on a successful response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    await expect(requestJson('/anything', undefined, 'fallback')).resolves.toEqual({ ok: true });
  });

  it('uses the fallback message when the error body has no error.message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    await expect(requestJson('/anything', undefined, 'Falha ao carregar avaliações')).rejects.toThrow(
      'Falha ao carregar avaliações'
    );
  });

  it('uses the fallback message when the error response has no JSON body at all', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Response);

    await expect(requestJson('/anything', undefined, 'Falha ao carregar avaliações')).rejects.toThrow(
      'Falha ao carregar avaliações'
    );
  });

  it('uses the fallback message when fetch itself rejects (network failure)', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(requestJson('/anything', undefined, 'Falha ao carregar avaliações')).rejects.toThrow(
      'Falha ao carregar avaliações'
    );
  });
});
