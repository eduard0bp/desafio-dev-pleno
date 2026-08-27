import 'dotenv/config';
import { createApp } from './app';
import { config } from './config';
import { log } from './lib/logger';

const app = createApp();

const server = app.listen(config.PORT, () => {
  log('info', 'api_started', { port: config.PORT });
});

// Stops accepting new connections and waits for in-flight requests to
// finish before exiting, instead of cutting them off mid-response when the
// container is stopped/redeployed.
process.on('SIGTERM', () => {
  log('info', 'api_shutting_down', {});
  server.close(() => process.exit(0));
});
