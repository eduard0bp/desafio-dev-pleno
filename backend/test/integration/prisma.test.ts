import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { randomUUID } from 'node:crypto';

describe('Prisma Review model', () => {
  afterEach(async () => {
    await prisma.review.deleteMany({ where: { externalId: { startsWith: 'test-' } } });
  });

  it('creates and reads a review with default pending status', async () => {
    const externalId = `test-${randomUUID()}`;
    const created = await prisma.review.create({
      data: { externalId, companyId: 'company-1', rating: 4, comment: 'Ótimo!' },
    });

    expect(created.status).toBe('pending');
    expect(created.attempts).toBe(0);

    const found = await prisma.review.findUnique({
      where: { companyId_externalId: { companyId: 'company-1', externalId } },
    });
    expect(found?.id).toBe(created.id);
  });

  it('prevents duplicate (company_id, external_id) pairs', async () => {
    const externalId = `test-${randomUUID()}`;
    await prisma.review.create({ data: { externalId, companyId: 'c', rating: 3, comment: 'x' } });

    await expect(
      prisma.review.create({ data: { externalId, companyId: 'c', rating: 3, comment: 'y' } }),
    ).rejects.toThrow();
  });

  it('allows the same external_id for two different companies', async () => {
    const externalId = `test-${randomUUID()}`;
    const companyA = await prisma.review.create({
      data: { externalId, companyId: 'company-a', rating: 3, comment: 'x' },
    });
    const companyB = await prisma.review.create({
      data: { externalId, companyId: 'company-b', rating: 3, comment: 'y' },
    });

    expect(companyB.id).not.toBe(companyA.id);
  });
});
