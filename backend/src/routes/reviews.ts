import { Router } from 'express';
import { createReviewSchema, listReviewsQuerySchema } from '../validation';
import { createReview, listReviews, getReviewById, retryReview, markReviewAsRead } from '../services/reviewService';
import { enqueueReviewJob, removeReviewJob } from '../queue/reviewQueue';
import { toListItem, toDetail } from '../mappers/reviewMapper';
import { ValidationError, NotFoundError, ConflictError } from '../errors';

export const reviewsRouter = Router();

const MOCK_SCENARIOS = new Set(['success', 'slow', 'server-error', 'rate-limit']);

reviewsRouter.post('/reviews', async (req, res, next) => {
  try {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Payload inválido', parsed.error.flatten());
    }

    const idempotencyKey = req.header('idempotency-key');
    if (idempotencyKey && idempotencyKey !== parsed.data.external_id) {
      throw new ValidationError('Idempotency-Key deve ser igual a external_id');
    }

    const mockScenario = req.header('x-mock-scenario') ?? undefined;
    if (mockScenario && !MOCK_SCENARIOS.has(mockScenario)) {
      throw new ValidationError('x-mock-scenario inválido: valores aceitos são success, slow, server-error, rate-limit');
    }

    const { review, created } = await createReview({
      externalId: parsed.data.external_id,
      companyId: parsed.data.company_id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    if (created) {
      await enqueueReviewJob({ reviewId: review.id, mockScenario, requestId: req.requestId });
    }

    res.status(202).json({ id: review.id, external_id: review.externalId, status: review.status });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.get('/reviews', async (req, res, next) => {
  try {
    const parsed = listReviewsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Parâmetros inválidos', parsed.error.flatten());
    }

    const result = await listReviews(parsed.data);
    res.json({
      data: result.data.map(toListItem),
      pagination: result.pagination,
      counts: result.counts,
    });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.get('/reviews/:id', async (req, res, next) => {
  try {
    const review = await getReviewById(req.params.id);
    if (!review) {
      throw new NotFoundError('Review não encontrada');
    }
    res.json(toDetail(review));
  } catch (err) {
    next(err);
  }
});

reviewsRouter.post('/reviews/:id/retry', async (req, res, next) => {
  try {
    const review = await getReviewById(req.params.id);
    if (!review) {
      throw new NotFoundError('Review não encontrada');
    }
    if (review.status !== 'failed') {
      throw new ConflictError('Só é possível reprocessar avaliações com status "failed"');
    }

    await removeReviewJob(review.id);
    const updated = await retryReview(review.id);
    await enqueueReviewJob({ reviewId: updated.id, requestId: req.requestId });

    res.status(202).json({ id: updated.id, external_id: updated.externalId, status: updated.status });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.post('/reviews/:id/read', async (req, res, next) => {
  try {
    const review = await getReviewById(req.params.id);
    if (!review) {
      throw new NotFoundError('Review não encontrada');
    }

    const updated = await markReviewAsRead(review.id);
    res.json({ id: updated.id, is_read: updated.isRead });
  } catch (err) {
    next(err);
  }
});
