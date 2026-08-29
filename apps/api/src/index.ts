import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { healthRoutes } from './routes/health';
import { passwordGate } from './middleware/passwordGate';

const app = new Hono();

app.use('/api/*', logger());
app.use('/api/*', passwordGate);

app.route('/api', healthRoutes);

export default app;