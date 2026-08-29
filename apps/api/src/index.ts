import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { healthRoutes } from './routes/health';
import { tableRoutes } from './routes/tables';
import { passwordGate } from './middleware/passwordGate';
import { withDb } from './middleware/withDb';

const app = new Hono();

app.use('/api/*', logger());
app.use('/api/*', passwordGate);
app.use('/api/*', withDb);

app.route('/api', healthRoutes);
app.route('/api', tableRoutes);

export default app;