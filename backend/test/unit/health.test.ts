import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/healthService', () => ({
  checkHealth: vi.fn(),
}));

import { checkHealth } from '../../src/services/healthService';
import { createApp } from '../../src/app';

const mockedCheckHealth = vi.mocked(checkHealth);

describe('GET /health (degraded scenarios)', () => {
  it('returns 503 and status degraded when postgres is unreachable', async () => {
    mockedCheckHealth.mockResolvedValueOnce({ postgres: false, redis: true });

    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'degraded', postgres: false, redis: true });
  });

  it('returns 503 and status degraded when redis is unreachable', async () => {
    mockedCheckHealth.mockResolvedValueOnce({ postgres: true, redis: false });

    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'degraded', postgres: true, redis: false });
  });

  it('returns 200 and status ok when both are reachable', async () => {
    mockedCheckHealth.mockResolvedValueOnce({ postgres: true, redis: true });

    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', postgres: true, redis: true });
  });
});
