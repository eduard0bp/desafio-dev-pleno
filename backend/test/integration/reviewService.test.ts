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
      externalId,
      companyId: 'c1',
      rating: 5,
      comment: 'Excelente',
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

  it('two different companies using the same external_id are not treated as duplicates', async () => {
    const externalId = `test-${randomUUID()}`;
    const forCompanyA = await createReview({ externalId, companyId: `test-company-a-${randomUUID()}`, rating: 5, comment: 'A' });
    const forCompanyB = await createReview({ externalId, companyId: `test-company-b-${randomUUID()}`, rating: 1, comment: 'B' });

    expect(forCompanyA.created).toBe(true);
    expect(forCompanyB.created).toBe(true);
    expect(forCompanyB.review.id).not.toBe(forCompanyA.review.id);

    const all = await prisma.review.findMany({ where: { externalId } });
    expect(all).toHaveLength(2);
  });

  it('lists reviews ordered by created_at desc', async () => {
    const idA = `test-${randomUUID()}`;
    const idB = `test-${randomUUID()}`;
    const { review: reviewA } = await createReview({ externalId: idA, companyId: 'c', rating: 1, comment: 'a' });
    const { review: reviewB } = await createReview({ externalId: idB, companyId: 'c', rating: 1, comment: 'b' });

    const earlier = new Date('2026-01-01T00:00:00.000Z');
    const later = new Date('2026-01-01T00:00:10.000Z');
    await prisma.review.update({ where: { id: reviewA.id }, data: { createdAt: earlier } });
    await prisma.review.update({ where: { id: reviewB.id }, data: { createdAt: later } });

    const { data } = await listReviews({ page: 1, pageSize: 100 });
    const indexA = data.findIndex((r) => r.externalId === idA);
    const indexB = data.findIndex((r) => r.externalId === idB);

    expect(indexA).toBeGreaterThanOrEqual(0);
    expect(indexB).toBeGreaterThanOrEqual(0);
    expect(indexB).toBeLessThan(indexA);
  });

  it('filters by status', async () => {
    const idA = `test-${randomUUID()}`;
    const idB = `test-${randomUUID()}`;
    await createReview({ externalId: idA, companyId: 'c', rating: 3, comment: 'a' });
    const { review: reviewB } = await createReview({ externalId: idB, companyId: 'c', rating: 3, comment: 'b' });
    await prisma.review.update({ where: { id: reviewB.id }, data: { status: 'failed' } });

    const { data } = await listReviews({ page: 1, pageSize: 100, status: 'failed' });
    expect(data.every((r) => r.status === 'failed')).toBe(true);
    expect(data.some((r) => r.externalId === idB)).toBe(true);
    expect(data.some((r) => r.externalId === idA)).toBe(false);
  });

  it('filters by minimum rating', async () => {
    const idLow = `test-${randomUUID()}`;
    const idHigh = `test-${randomUUID()}`;
    await createReview({ externalId: idLow, companyId: 'c', rating: 2, comment: 'a' });
    await createReview({ externalId: idHigh, companyId: 'c', rating: 5, comment: 'b' });

    const { data } = await listReviews({ page: 1, pageSize: 100, minRating: 4 });
    expect(data.some((r) => r.externalId === idHigh)).toBe(true);
    expect(data.some((r) => r.externalId === idLow)).toBe(false);
  });

  it('filters by company search, case-insensitive', async () => {
    const marker = randomUUID();
    const idMatch = `test-${randomUUID()}`;
    const idOther = `test-${randomUUID()}`;
    await createReview({ externalId: idMatch, companyId: `AcmeCorp-${marker}`, rating: 3, comment: 'a' });
    await createReview({ externalId: idOther, companyId: `Globex-${marker}`, rating: 3, comment: 'b' });

    const { data } = await listReviews({ page: 1, pageSize: 100, search: `acmecorp-${marker}` });
    expect(data).toHaveLength(1);
    expect(data[0]?.externalId).toBe(idMatch);
  });

  it('filters by date range, inclusive of the end date', async () => {
    const idInRange = `test-${randomUUID()}`;
    const idOutOfRange = `test-${randomUUID()}`;
    const { review: inRange } = await createReview({ externalId: idInRange, companyId: 'c', rating: 3, comment: 'a' });
    const { review: outOfRange } = await createReview({
      externalId: idOutOfRange,
      companyId: 'c',
      rating: 3,
      comment: 'b',
    });

    await prisma.review.update({
      where: { id: inRange.id },
      data: { createdAt: new Date('2026-02-15T12:00:00.000Z') },
    });
    await prisma.review.update({
      where: { id: outOfRange.id },
      data: { createdAt: new Date('2026-03-01T00:00:00.000Z') },
    });

    const { data } = await listReviews({
      page: 1,
      pageSize: 100,
      dateFrom: new Date('2026-02-01T00:00:00.000Z'),
      dateTo: new Date('2026-02-15T00:00:00.000Z'),
    });

    expect(data.some((r) => r.externalId === idInRange)).toBe(true);
    expect(data.some((r) => r.externalId === idOutOfRange)).toBe(false);
  });

  it('paginates correctly and reports total/totalPages', async () => {
    const marker = randomUUID();
    for (let i = 0; i < 5; i += 1) {
      await createReview({
        externalId: `test-${marker}-${i}`,
        companyId: `PageCo-${marker}`,
        rating: 3,
        comment: `review ${i}`,
      });
    }

    const firstPage = await listReviews({ page: 1, pageSize: 2, search: `pageco-${marker}` });
    expect(firstPage.data).toHaveLength(2);
    expect(firstPage.pagination).toEqual({ page: 1, pageSize: 2, total: 5, totalPages: 3 });

    const lastPage = await listReviews({ page: 3, pageSize: 2, search: `pageco-${marker}` });
    expect(lastPage.data).toHaveLength(1);
  });

  it('counts reflect other filters but ignore the status filter itself', async () => {
    const marker = randomUUID();
    const idPending = `test-${marker}-pending`;
    const idFailed = `test-${marker}-failed`;
    await createReview({ externalId: idPending, companyId: `CountCo-${marker}`, rating: 3, comment: 'a' });
    const { review: failedReview } = await createReview({
      externalId: idFailed,
      companyId: `CountCo-${marker}`,
      rating: 3,
      comment: 'b',
    });
    await prisma.review.update({ where: { id: failedReview.id }, data: { status: 'failed' } });

    const { counts } = await listReviews({ page: 1, pageSize: 100, search: `countco-${marker}`, status: 'failed' });

    expect(counts).toEqual({ all: 2, pending: 1, processing: 0, completed: 0, failed: 1 });
  });

  it('getReviewById returns null for a nonexistent id', async () => {
    const result = await getReviewById(randomUUID());
    expect(result).toBeNull();
  });
});
