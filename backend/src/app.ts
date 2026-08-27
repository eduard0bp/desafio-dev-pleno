import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { reviewsRouter } from './routes/reviews';
import { checkHealth } from './lib/health';
import { HttpError } from './errors';
import { log } from './lib/logger';

export function createApp() {
  const app = express();
  app.use(cors());

  app.use((req, _res, next) => {
    req.requestId = randomUUID();
    next();
  });

  app.use((req, res, next) => {
    if (req.path === '/health') return next();
    const start = Date.now();
    res.on('finish', () => {
      log(res.statusCode >= 500 ? 'error' : 'info', 'http_request', {
        request_id: req.requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration_ms: Date.now() - start,
      });
    });
    next();
  });

  app.use(express.json());

  app.get('/health', async (_req, res) => {
    const { postgres, redis } = await checkHealth();
    const healthy = postgres && redis;
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', postgres, redis });
  });

  app.use(reviewsRouter);

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Rota não encontrada', retryable: false },
      request_id: _req.requestId ?? randomUUID(),
    });
  });

  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const requestId = req.requestId ?? randomUUID();

    const isBodyParseError =
      err instanceof SyntaxError &&
      (err as SyntaxError & { type?: string; status?: number; statusCode?: number }).type === 'entity.parse.failed';

    if (isBodyParseError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'JSON inválido no corpo da requisição', retryable: false },
        request_id: requestId,
      });
    }

    if (err instanceof HttpError) {
      if (err.status >= 500) {
        log('error', 'unhandled_error', { request_id: requestId, message: err.message, stack: err.stack });
      }
      return res.status(err.status).json({
        error: { code: err.code, message: err.message, retryable: err.retryable, details: err.details },
        request_id: requestId,
      });
    }

    log('error', 'unhandled_error', {
      request_id: requestId,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno', retryable: false },
      request_id: requestId,
    });
  });

  return app;
}
