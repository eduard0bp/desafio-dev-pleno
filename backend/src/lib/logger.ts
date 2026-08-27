type LogLevel = 'info' | 'warn' | 'error';

/**
 * A single structured (JSON, one line per entry) logger used across the API
 * and the worker, so every log — an HTTP request, a review moving through
 * the pipeline, an alert — can be grepped/parsed the same way and
 * correlated by request_id (API) or reviewId/externalId (worker).
 */
export function log(level: LogLevel, event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ level, event, ...fields, timestamp: new Date().toISOString() });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
