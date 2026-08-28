import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeReview, RetryableAnalysisError } from './analysisClient';

describe('analyzeReview timeout handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('aborts a request that never responds and throws a retryable timeout error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        });
      }),
    );

    const promise = analyzeReview({ reviewId: 'r1', companyId: 'c1', rating: 2, text: 'Demorou muito.' });
    const typeAssertion = expect(promise).rejects.toBeInstanceOf(RetryableAnalysisError);
    const messageAssertion = expect(promise).rejects.toThrow('timeout while calling the analysis API');

    await vi.advanceTimersByTimeAsync(6000);
    await typeAssertion;
    await messageAssertion;
  });
});
