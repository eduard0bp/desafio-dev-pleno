import { describe, it, expect, vi, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../src/lib/prisma';

vi.mock('../../src/services/analysisClient', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/analysisClient')>(
    '../../src/services/analysisClient'
  );
  return { ...actual, analyzeReview: vi.fn() };
});

import { analyzeReview, RetryableAnalysisError, NonRetryableAnalysisError } from '../../src/services/analysisClient';
import { processReviewJob } from '../../src/worker';

const mockedAnalyzeReview = vi.mocked(analyzeReview);

async function createTestReview() {
  return prisma.review.create({
    data: { externalId: `test-${randomUUID()}`, companyId: 'c1', rating: 2, comment: 'bad' },
  });
}

describe('processReviewJob', () => {
  afterEach(async () => {
    vi.clearAllMocks();
    await prisma.review.deleteMany({ where: { externalId: { startsWith: 'test-' } } });
  });

  it('marks the review as completed when the analysis succeeds', async () => {
    const review = await createTestReview();
    mockedAnalyzeReview.mockResolvedValueOnce({
      request_id: 'r1',
      review_id: review.externalId,
      analysis: { sentiment: 'negative', category: 'delivery', confidence: 0.9, matched_keywords: ['bad'] },
      processing_time_ms: 100,
      processed_at: new Date().toISOString(),
    });

    await processReviewJob({ data: { reviewId: review.id }, attemptsMade: 0 });

    const updated = await prisma.review.findUniqueOrThrow({ where: { id: review.id } });
    expect(updated.status).toBe('completed');
    expect(updated.analysis).toMatchObject({ sentiment: 'negative' });
    expect(updated.attempts).toBe(1);
  });

  it('marks the review as failed and does not allow retry on a non-retryable error', async () => {
    const review = await createTestReview();
    mockedAnalyzeReview.mockRejectedValueOnce(new NonRetryableAnalysisError('invalid', 'VALIDATION_ERROR'));

    await expect(processReviewJob({ data: { reviewId: review.id }, attemptsMade: 0 })).rejects.toThrow();

    const updated = await prisma.review.findUniqueOrThrow({ where: { id: review.id } });
    expect(updated.status).toBe('failed');
  });

  it('keeps status processing and rethrows a retryable error (BullMQ decides the retry)', async () => {
    const review = await createTestReview();
    mockedAnalyzeReview.mockRejectedValueOnce(new RetryableAnalysisError('unstable', 2));

    await expect(processReviewJob({ data: { reviewId: review.id }, attemptsMade: 0 })).rejects.toThrow(RetryableAnalysisError);

    const updated = await prisma.review.findUniqueOrThrow({ where: { id: review.id } });
    expect(updated.status).toBe('processing');
    expect(updated.lastError).toMatchObject({ message: 'unstable' });
  });
});
