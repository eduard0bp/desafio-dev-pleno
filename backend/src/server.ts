import 'dotenv/config';
import { createApp } from './app';
import { log } from './lib/logger';

const app = createApp();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(port, () => {
  log('info', 'api_started', { port });
});
