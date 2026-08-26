import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { analyzeReview, RetryableAnalysisError } from '../../src/services/analysisClient';

const baseInput = { reviewId: `analysis-${randomUUID()}`, companyId: 'c1', rating: 2, text: 'Demorou muito e chegou frio.' };

describe('analyzeReview', () => {
  it('success scenario returns the analysis', async () => {
    const result = await analyzeReview({ ...baseInput, mockScenario: 'success' });
    expect(result.analysis.sentiment).toBeDefined();
    expect(result.analysis.category).toBeDefined();
  });

  it('slow scenario still resolves successfully', async () => {
    const result = await analyzeReview({ ...baseInput, mockScenario: 'slow' });
    expect(result.analysis).toBeDefined();
  }, 10000);

  it('server-error scenario throws RetryableAnalysisError with retryAfterSeconds', async () => {
    await expect(analyzeReview({ ...baseInput, mockScenario: 'server-error' })).rejects.toThrow(RetryableAnalysisError);
    try {
      await analyzeReview({ ...baseInput, mockScenario: 'server-error' });
    } catch (err) {
      expect(err).toBeInstanceOf(RetryableAnalysisError);
      expect((err as RetryableAnalysisError).retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('rate-limit scenario throws RetryableAnalysisError', async () => {
    await expect(
      analyzeReview({ ...baseInput, mockScenario: 'rate-limit' })
    ).rejects.toThrow(RetryableAnalysisError);
  });
});
