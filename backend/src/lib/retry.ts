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

export function computeBackoffDelayMs(attempt: number, retryAfterSeconds?: number): number {
  const exponential = Math.min(1000 * 2 ** (attempt - 1), 30000);
  const retryAfterMs = retryAfterSeconds ? retryAfterSeconds * 1000 : 0;
  return Math.max(exponential, retryAfterMs);
}
