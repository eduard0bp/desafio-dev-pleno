// Runs before src/config.ts is imported by any integration test, so it can still
// override REDIS_URL. Integration tests enqueue real jobs on the real queue name
// (review-processing) to exercise the real worker — if this suite runs while
// `docker compose up` is also live, its worker container consumes the same Redis
// instance and steals test jobs before the in-process test worker sees them.
// Redirecting the suite to a different logical Redis database keeps it isolated
// without changing how the app itself connects in dev/prod.
const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
url.pathname = '/1';
process.env.REDIS_URL = url.toString();
