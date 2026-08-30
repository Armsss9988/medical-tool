import { config } from 'dotenv';
config({ path: '../../.env' });
(process.env as Record<string, string>)['NODE_ENV'] = 'development';
import { serve } from '@hono/node-server';
import app from './index';

const port = Number(process.env.API_PORT ?? 3000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
