import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { reviewQueue } from '../../src/queue/reviewQueue';

const app = createApp();

describe('Reviews API', () => {
  afterEach(async () => {
    await prisma.review.deleteMany({ where: { externalId: { startsWith: 'test-' } } });
  });

  afterAll(async () => {
    await reviewQueue.close();
  });

  it('POST /reviews creates a review and responds 202 pending', async () => {
    const externalId = `test-${randomUUID()}`;
    const response = await request(app).post('/reviews').send({
      external_id: externalId,
      company_id: 'c1',
      rating: 4,
      comment: 'Bom atendimento',
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

  it('two concurrent POST /reviews with the same external_id only create one review and one job', async () => {
    const externalId = `test-${randomUUID()}`;
    const payload = { external_id: externalId, company_id: 'c1', rating: 4, comment: 'Bom' };

    const [first, second] = await Promise.all([
      request(app).post('/reviews').send(payload),
      request(app).post('/reviews').send(payload),
    ]);

    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(first.body.id).toBe(second.body.id);

    const all = await prisma.review.findMany({ where: { externalId } });
    expect(all).toHaveLength(1);

    const job = await reviewQueue.getJob(all[0]!.id);
    expect(job).not.toBeUndefined();
  });

  it('POST /reviews ignores an Idempotency-Key that differs from external_id (de-dup is via external_id alone)', async () => {
    const response = await request(app)
      .post('/reviews')
      .set('Idempotency-Key', 'outro-valor-qualquer')
      .send({ external_id: `test-${randomUUID()}`, company_id: 'c1', rating: 3, comment: 'comentário válido' });

    expect(response.status).toBe(202);
  });

  it('GET /reviews lists the created reviews with pagination and counts', async () => {
    const externalId = `test-${randomUUID()}`;
    await request(app).post('/reviews').send({
      external_id: externalId,
      company_id: 'c1',
      rating: 5,
      comment: 'top',
    });

    const response = await request(app).get('/reviews');
    expect(response.status).toBe(200);
    const item = response.body.data.find((r: { external_id: string }) => r.external_id === externalId);
    expect(item).toMatchObject({
      external_id: externalId,
      company_id: 'c1',
      rating: 5,
      status: 'pending',
      analysis: null,
    });
    expect(response.body.pagination).toMatchObject({ page: 1, pageSize: 10 });
    expect(typeof response.body.pagination.total).toBe('number');
    expect(typeof response.body.pagination.totalPages).toBe('number');
    expect(response.body.counts).toHaveProperty('all');
    expect(response.body.counts).toHaveProperty('pending');
  });

  it('GET /reviews filters by status via query param', async () => {
    const marker = randomUUID();
    const idFailed = `test-${marker}-failed`;
    const created = await request(app)
      .post('/reviews')
      .send({
        external_id: idFailed,
        company_id: `FilterCo-${marker}`,
        rating: 3,
        comment: 'vai falhar',
      });
    await prisma.review.update({ where: { id: created.body.id }, data: { status: 'failed' } });

    const response = await request(app)
      .get('/reviews')
      .query({ status: 'failed', search: `filterco-${marker}` });
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].external_id).toBe(idFailed);
  });

  it('GET /reviews filters by minRating and search via query params', async () => {
    const marker = randomUUID();
    await request(app)
      .post('/reviews')
      .send({
        external_id: `test-${marker}-low`,
        company_id: `RatingCo-${marker}`,
        rating: 2,
        comment: 'nota baixa',
      });
    await request(app)
      .post('/reviews')
      .send({
        external_id: `test-${marker}-high`,
        company_id: `RatingCo-${marker}`,
        rating: 5,
        comment: 'nota alta',
      });

    const response = await request(app)
      .get('/reviews')
      .query({ search: `ratingco-${marker}`, minRating: '4' });
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].external_id).toBe(`test-${marker}-high`);
  });

  it('GET /reviews filters by sentiment via query param', async () => {
    const marker = randomUUID();
    const negative = await request(app)
      .post('/reviews')
      .send({
        external_id: `test-${marker}-neg`,
        company_id: `SentimentCo-${marker}`,
        rating: 1,
        comment: 'ruim',
      });
    const positive = await request(app)
      .post('/reviews')
      .send({
        external_id: `test-${marker}-pos`,
        company_id: `SentimentCo-${marker}`,
        rating: 5,
        comment: 'bom',
      });
    await prisma.review.update({
      where: { id: negative.body.id },
      data: {
        status: 'completed',
        analysis: { sentiment: 'negative', category: 'general', confidence: 0.9, matched_keywords: [] },
      },
    });
    await prisma.review.update({
      where: { id: positive.body.id },
      data: {
        status: 'completed',
        analysis: { sentiment: 'positive', category: 'general', confidence: 0.9, matched_keywords: [] },
      },
    });

    const response = await request(app)
      .get('/reviews')
      .query({ search: `sentimentco-${marker}`, sentiment: 'negative' });
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].external_id).toBe(`test-${marker}-neg`);
  });

  it('GET /reviews with an invalid sentiment query param returns 400', async () => {
    const response = await request(app).get('/reviews').query({ sentiment: 'angry' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /reviews defaults new reviews to is_read: false and filters by isRead via query param', async () => {
    const marker = randomUUID();
    const created = await request(app)
      .post('/reviews')
      .send({
        external_id: `test-${marker}`,
        company_id: `ReadCo-${marker}`,
        rating: 1,
        comment: 'ruim',
      });
    expect(created.body).toMatchObject({ external_id: `test-${marker}` });

    const beforeRead = await request(app)
      .get('/reviews')
      .query({ search: `readco-${marker}`, isRead: 'false' });
    expect(beforeRead.body.data).toHaveLength(1);
    expect(beforeRead.body.data[0].is_read).toBe(false);

    await prisma.review.update({ where: { id: created.body.id }, data: { isRead: true } });

    const afterRead = await request(app)
      .get('/reviews')
      .query({ search: `readco-${marker}`, isRead: 'false' });
    expect(afterRead.body.data).toHaveLength(0);
  });

  it('GET /reviews with an invalid isRead query param returns 400', async () => {
    const response = await request(app).get('/reviews').query({ isRead: 'maybe' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /reviews paginates via page/pageSize query params', async () => {
    const marker = randomUUID();
    for (let i = 0; i < 3; i += 1) {
      await request(app)
        .post('/reviews')
        .send({
          external_id: `test-${marker}-${i}`,
          company_id: `PageCo-${marker}`,
          rating: 3,
          comment: `review ${i}`,
        });
    }

    const response = await request(app)
      .get('/reviews')
      .query({ search: `pageco-${marker}`, page: '2', pageSize: '2' });
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination).toEqual({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
  });

  it('GET /reviews with an invalid query param returns 400', async () => {
    const response = await request(app).get('/reviews').query({ status: 'not-a-real-status' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /reviews/:id returns 404 for a nonexistent id', async () => {
    const response = await request(app).get(`/reviews/${randomUUID()}`);
    expect(response.status).toBe(404);
  });

  it('GET /reviews/:id returns the review detail', async () => {
    const externalId = `test-${randomUUID()}`;
    const created = await request(app).post('/reviews').send({
      external_id: externalId,
      company_id: 'c1',
      rating: 2,
      comment: 'ruim',
    });

    const response = await request(app).get(`/reviews/${created.body.id}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ external_id: externalId, status: 'pending', attempts: 0, last_error: null });
  });

  it('POST /reviews with an unrecognized x-mock-scenario header returns 400', async () => {
    const response = await request(app)
      .post('/reviews')
      .set('x-mock-scenario', 'totally-invalid-scenario')
      .send({ external_id: `test-${randomUUID()}`, company_id: 'c1', rating: 3, comment: 'algo válido' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.request_id).toBeTruthy();
  });

  it('POST /reviews with a valid x-mock-scenario header is accepted', async () => {
    const response = await request(app)
      .post('/reviews')
      .set('x-mock-scenario', 'success')
      .send({ external_id: `test-${randomUUID()}`, company_id: 'c1', rating: 3, comment: 'algo válido' });

    expect(response.status).toBe(202);
  });

  it('every error response includes a request_id', async () => {
    const response = await request(app).post('/reviews').send({ external_id: 'x' });
    expect(response.body.request_id).toBeTruthy();
  });

  it('POST with malformed JSON body returns 400 VALIDATION_ERROR instead of 500', async () => {
    const response = await request(app)
      .post('/reviews')
      .set('Content-Type', 'application/json')
      .send('{"external_id": "broken", "company_id": ');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.request_id).toBeTruthy();
  });

  it('GET an unmatched route returns a JSON 404 envelope', async () => {
    const response = await request(app).get('/this-route-does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.request_id).toBeTruthy();
  });

  it('POST /reviews/:id/retry returns 404 for a nonexistent id', async () => {
    const response = await request(app).post(`/reviews/${randomUUID()}/retry`);
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /reviews/:id/retry returns 409 when the review is not failed', async () => {
    const created = await request(app)
      .post('/reviews')
      .send({
        external_id: `test-${randomUUID()}`,
        company_id: 'c1',
        rating: 3,
        comment: 'ainda pendente',
      });

    const response = await request(app).post(`/reviews/${created.body.id}/retry`);
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INVALID_STATE');
  });

  it('POST /reviews/:id/retry resets a failed review to pending and re-enqueues it', async () => {
    const created = await request(app)
      .post('/reviews')
      .send({
        external_id: `test-${randomUUID()}`,
        company_id: 'c1',
        rating: 1,
        comment: 'vai falhar de propósito',
      });
    await prisma.review.update({
      where: { id: created.body.id },
      data: { status: 'failed', attempts: 5, lastError: { message: 'esgotou as tentativas' } },
    });

    const response = await request(app).post(`/reviews/${created.body.id}/retry`);
    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ id: created.body.id, status: 'pending' });

    const updated = await prisma.review.findUniqueOrThrow({ where: { id: created.body.id } });
    expect(updated.status).toBe('pending');
    expect(updated.attempts).toBe(0);
    expect(updated.lastError).toBeNull();

    const job = await reviewQueue.getJob(created.body.id);
    expect(job).not.toBeUndefined();
  });

  it('POST /reviews/:id/read returns 404 for a nonexistent id', async () => {
    const response = await request(app).post(`/reviews/${randomUUID()}/read`);
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /reviews/:id/read marks the review as read', async () => {
    const created = await request(app)
      .post('/reviews')
      .send({
        external_id: `test-${randomUUID()}`,
        company_id: 'c1',
        rating: 1,
        comment: 'ruim',
      });

    const response = await request(app).post(`/reviews/${created.body.id}/read`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: created.body.id, is_read: true });

    const updated = await prisma.review.findUniqueOrThrow({ where: { id: created.body.id } });
    expect(updated.isRead).toBe(true);
  });
});
