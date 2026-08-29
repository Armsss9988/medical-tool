import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { healthRoutes } from './routes/health';

const app = new Hono();

app.use('/api/*', logger());

app.route('/api', healthRoutes);

export default app;