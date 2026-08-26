import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { createReviewSchema } from '../validation';
import { createReview, listReviews, getReviewById } from '../services/reviewService';
import { enqueueReviewJob } from '../queue/reviewQueue';
import type { Review } from '@prisma/client';
import type { Request } from 'express';

export const reviewsRouter = Router();

const MOCK_SCENARIOS = new Set(['success', 'slow', 'server-error', 'rate-limit']);

function errorResponse(req: Request, code: string, message: string, retryable = false, details?: unknown) {
  return { error: { code, message, retryable, details }, request_id: req.requestId ?? randomUUID() };
}

reviewsRouter.post('/reviews', async (req, res, next) => {
  try {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json(errorResponse(req, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Payload inválido', false, parsed.error.flatten()));
    }

    const idempotencyKey = req.header('idempotency-key');
    if (idempotencyKey && idempotencyKey !== parsed.data.external_id) {
      return res.status(400).json(errorResponse(req, 'VALIDATION_ERROR', 'Idempotency-Key deve ser igual a external_id'));
    }

    const mockScenario = req.header('x-mock-scenario') ?? undefined;
    if (mockScenario && !MOCK_SCENARIOS.has(mockScenario)) {
      return res
        .status(400)
        .json(errorResponse(req, 'VALIDATION_ERROR', 'x-mock-scenario inválido: valores aceitos são success, slow, server-error, rate-limit'));
    }

    const { review, created } = await createReview({
      externalId: parsed.data.external_id,
      companyId: parsed.data.company_id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    if (created) {
      await enqueueReviewJob({ reviewId: review.id, mockScenario });
    }

    res.status(202).json({ id: review.id, external_id: review.externalId, status: review.status });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.get('/reviews', async (_req, res, next) => {
  try {
    const reviews = await listReviews();
    res.json({ data: reviews.map(toListItem) });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.get('/reviews/:id', async (req, res, next) => {
  try {
    const review = await getReviewById(req.params.id);
    if (!review) {
      return res.status(404).json(errorResponse(req, 'NOT_FOUND', 'Review não encontrada'));
    }
    res.json(toDetail(review));
  } catch (err) {
    next(err);
  }
});

function toListItem(review: Review) {
  return {
    id: review.id,
    external_id: review.externalId,
    rating: review.rating,
    status: review.status,
    created_at: review.createdAt,
  };
}

function toDetail(review: Review) {
  return {
    id: review.id,
    external_id: review.externalId,
    company_id: review.companyId,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    analysis: review.analysis,
    attempts: review.attempts,
    created_at: review.createdAt,
    processed_at: review.processedAt,
    last_error: review.lastError,
  };
}
