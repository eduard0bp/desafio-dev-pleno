import { prisma } from '../lib/prisma';
import { connection } from '../lib/redis';

export interface HealthCheckResult {
  postgres: boolean;
  redis: boolean;
}

export async function checkHealth(): Promise<HealthCheckResult> {
  const [postgres, redis] = await Promise.all([
    prisma
      .$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
    connection
      .ping()
      .then((reply) => reply === 'PONG')
      .catch(() => false),
  ]);

  return { postgres, redis };
}
