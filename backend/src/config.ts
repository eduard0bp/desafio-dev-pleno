import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number('PORT deve ser um número').int().positive().default(3000),
  WORKER_PORT: z.coerce.number('WORKER_PORT deve ser um número').int().positive().default(3001),
  REDIS_URL: z.string('REDIS_URL deve ser uma string').min(1).default('redis://localhost:6379'),
  MOCK_ANALYSIS_API_URL: z.string('MOCK_ANALYSIS_API_URL deve ser uma string').min(1).default('http://localhost:4000'),
});

function loadConfig() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Configuração inválida: ${details}`);
  }
  return parsed.data;
}

export const config = loadConfig();
