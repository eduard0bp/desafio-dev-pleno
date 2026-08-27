import { describe, it, expect, vi, afterEach } from 'vitest';
import { alertNegativeReview } from '../../src/services/alertService';

describe('alertNegativeReview', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs a structured warning with the review and analysis details', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    alertNegativeReview({
      reviewId: 'r1',
      externalId: 'ext-1',
      companyId: 'company-456',
      rating: 1,
      sentiment: 'negative',
      category: 'delivery',
      confidence: 0.91,
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(warnSpy.mock.calls[0]?.[0] as string);
    expect(logged).toMatchObject({
      level: 'warn',
      event: 'negative_review_detected',
      reviewId: 'r1',
      externalId: 'ext-1',
      companyId: 'company-456',
      rating: 1,
      sentiment: 'negative',
      category: 'delivery',
      confidence: 0.91,
    });
    expect(typeof logged.timestamp).toBe('string');
  });
});
