import { describe, it, expect, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

const app = createApp();

describe('Reviews API', () => {
  afterEach(async () => {
    await prisma.review.deleteMany({ where: { externalId: { startsWith: 'test-' } } });
  });

  it('POST /reviews creates a review and responds 202 pending', async () => {
    const externalId = `test-${randomUUID()}`;
    const response = await request(app).post('/reviews').send({
      external_id: externalId, company_id: 'c1', rating: 4, comment: 'Bom atendimento',
    });

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ external_id: externalId, status: 'pending' });
  });

  it('POST /reviews with invalid payload returns 400', async () => {
    const response = await request(app).post('/reviews').send({ external_id: 'x' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('repeated POST /reviews with the same external_id does not create a duplicate', async () => {
    const externalId = `test-${randomUUID()}`;
    const payload = { external_id: externalId, company_id: 'c1', rating: 4, comment: 'Bom' };

    const first = await request(app).post('/reviews').send(payload);
    const second = await request(app).post('/reviews').send(payload);

    expect(second.status).toBe(202);
    expect(second.body.id).toBe(first.body.id);

    const all = await prisma.review.findMany({ where: { externalId } });
    expect(all).toHaveLength(1);
  });

  it('POST /reviews with Idempotency-Key different from external_id returns 400', async () => {
    const response = await request(app)
      .post('/reviews')
      .set('Idempotency-Key', 'outro-valor')
      .send({ external_id: `test-${randomUUID()}`, company_id: 'c1', rating: 3, comment: 'ok' });

    expect(response.status).toBe(400);
  });

  it('GET /reviews lists the created reviews', async () => {
    const externalId = `test-${randomUUID()}`;
    await request(app).post('/reviews').send({
      external_id: externalId, company_id: 'c1', rating: 5, comment: 'top',
    });

    const response = await request(app).get('/reviews');
    expect(response.status).toBe(200);
    expect(response.body.data.some((r: { external_id: string }) => r.external_id === externalId)).toBe(true);
  });

  it('GET /reviews/:id returns 404 for a nonexistent id', async () => {
    const response = await request(app).get(`/reviews/${randomUUID()}`);
    expect(response.status).toBe(404);
  });

  it('GET /reviews/:id returns the review detail', async () => {
    const externalId = `test-${randomUUID()}`;
    const created = await request(app).post('/reviews').send({
      external_id: externalId, company_id: 'c1', rating: 2, comment: 'ruim',
    });

    const response = await request(app).get(`/reviews/${created.body.id}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ external_id: externalId, status: 'pending', attempts: 0 });
  });
});
