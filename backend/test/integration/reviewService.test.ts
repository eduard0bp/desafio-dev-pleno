import { describe, it, expect, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../src/lib/prisma';
import { createReview, listReviews, getReviewById } from '../../src/services/reviewService';

describe('reviewService', () => {
  afterEach(async () => {
    await prisma.review.deleteMany({ where: { externalId: { startsWith: 'test-' } } });
  });

  it('creates a new review and marks created: true', async () => {
    const externalId = `test-${randomUUID()}`;
    const { review, created } = await createReview({
      externalId, companyId: 'c1', rating: 5, comment: 'Excelente',
    });
    expect(created).toBe(true);
    expect(review.status).toBe('pending');
  });

  it('resubmitting the same external_id returns the existing record without creating another', async () => {
    const externalId = `test-${randomUUID()}`;
    const first = await createReview({ externalId, companyId: 'c1', rating: 5, comment: 'A' });
    const second = await createReview({ externalId, companyId: 'c1', rating: 5, comment: 'A' });

    expect(second.created).toBe(false);
    expect(second.review.id).toBe(first.review.id);

    const all = await prisma.review.findMany({ where: { externalId } });
    expect(all).toHaveLength(1);
  });

  it('lists reviews ordered by created_at desc', async () => {
    // createdAt is stored with millisecond precision, and two sequential
    // creates can land in the same millisecond (Postgres does not
    // guarantee tie order), so set explicit, clearly-separated createdAt
    // values directly rather than racing the wall clock.
    const idA = `test-${randomUUID()}`;
    const idB = `test-${randomUUID()}`;
    const { review: reviewA } = await createReview({ externalId: idA, companyId: 'c', rating: 1, comment: 'a' });
    const { review: reviewB } = await createReview({ externalId: idB, companyId: 'c', rating: 1, comment: 'b' });

    const earlier = new Date('2026-01-01T00:00:00.000Z');
    const later = new Date('2026-01-01T00:00:10.000Z');
    await prisma.review.update({ where: { id: reviewA.id }, data: { createdAt: earlier } });
    await prisma.review.update({ where: { id: reviewB.id }, data: { createdAt: later } });

    const reviews = await listReviews();
    const indexA = reviews.findIndex((r) => r.externalId === idA);
    const indexB = reviews.findIndex((r) => r.externalId === idB);

    expect(indexA).toBeGreaterThanOrEqual(0);
    expect(indexB).toBeGreaterThanOrEqual(0);
    // idB has the later createdAt, so in descending order it must appear first (lower index).
    expect(indexB).toBeLessThan(indexA);
  });

  it('getReviewById returns null for a nonexistent id', async () => {
    const result = await getReviewById(randomUUID());
    expect(result).toBeNull();
  });
});
