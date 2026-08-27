import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/healthService', () => ({
  checkHealth: vi.fn().mockResolvedValue({ postgres: true, redis: true }),
}));

import { createApp } from '../../src/app';

function waitForLogs() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('request logging middleware', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs an http_request line with request_id, method, path and status', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const response = await request(createApp()).get('/this-route-does-not-exist');
    await waitForLogs();

    expect(response.status).toBe(404);
    const call = logSpy.mock.calls.find((c) => (c[0] as string).includes('http_request'));
    expect(call).toBeDefined();
    const logged = JSON.parse(call?.[0] as string);
    expect(logged).toMatchObject({ level: 'info', event: 'http_request', method: 'GET', path: '/this-route-does-not-exist', status: 404 });
    expect(logged.request_id).toBeTruthy();
    expect(typeof logged.duration_ms).toBe('number');
  });

  it('does not log requests to /health', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await request(createApp()).get('/health');
    await waitForLogs();

    const call = logSpy.mock.calls.find((c) => (c[0] as string).includes('http_request'));
    expect(call).toBeUndefined();
  });
});
