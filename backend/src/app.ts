import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { reviewsRouter } from './routes/reviews';
import { checkHealth } from './services/healthService';

export function createApp() {
  const app = express();
  app.use(cors());

  app.use((req, _res, next) => {
    req.requestId = randomUUID();
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

    console.error(err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno', retryable: false },
      request_id: requestId,
    });
  });

  return app;
}
