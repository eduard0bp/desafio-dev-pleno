import { describe, it, expect } from 'vitest';
import { isRetryableStatus, shouldRetry, computeBackoffDelayMs } from '../../src/lib/retry';

describe('isRetryableStatus', () => {
  it('429 and 503 are retryable', () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
  });

  it('400 is not retryable', () => {
    expect(isRetryableStatus(400)).toBe(false);
  });
});

describe('shouldRetry', () => {
  it('uses body.error.retryable when present', () => {
    expect(shouldRetry(500, { error: { code: 'X', message: 'm', retryable: true }, request_id: 'r' })).toBe(true);
    expect(shouldRetry(429, { error: { code: 'X', message: 'm', retryable: false }, request_id: 'r' })).toBe(false);
  });

  it('falls back to status when there is no body', () => {
    expect(shouldRetry(503)).toBe(true);
    expect(shouldRetry(400)).toBe(false);
  });
});

describe('computeBackoffDelayMs', () => {
  it('grows exponentially with the attempt number', () => {
    expect(computeBackoffDelayMs(1)).toBe(1000);
    expect(computeBackoffDelayMs(2)).toBe(2000);
    expect(computeBackoffDelayMs(3)).toBe(4000);
  });

  it('respects retryAfterSeconds when greater than the computed backoff', () => {
    expect(computeBackoffDelayMs(1, 10)).toBe(10000);
  });

  it('caps at 30s', () => {
    expect(computeBackoffDelayMs(10)).toBe(30000);
  });
});
