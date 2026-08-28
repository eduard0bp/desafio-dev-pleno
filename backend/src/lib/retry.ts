export interface AnalyzeErrorBody {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
  request_id: string;
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 503;
}

export function shouldRetry(status: number, body?: AnalyzeErrorBody): boolean {
  if (body?.error?.retryable !== undefined) return body.error.retryable;
  return isRetryableStatus(status);
}

const MAX_EXPONENTIAL_DELAY_MS = 30_000;
// A misbehaving or malicious analysis API could send an arbitrarily large Retry-After;
// cap how long we honor it so one bad response can't stall a review indefinitely.
const MAX_RETRY_AFTER_DELAY_MS = 60_000;

export function computeBackoffDelayMs(attempt: number, retryAfterSeconds?: number): number {
  const exponential = Math.min(1000 * 2 ** (attempt - 1), MAX_EXPONENTIAL_DELAY_MS);
  const retryAfterMs = retryAfterSeconds ? Math.min(retryAfterSeconds * 1000, MAX_RETRY_AFTER_DELAY_MS) : 0;
  return Math.max(exponential, retryAfterMs);
}
