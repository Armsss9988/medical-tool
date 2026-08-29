import { createMiddleware } from 'hono/factory';
import { getDb } from '../db/client';
import type { AppEnv } from '../env';

export const withDb = createMiddleware<AppEnv>(async (c, next) => {
  if (process.env.DATABASE_URL) {
    c.set('db', getDb());
  }
  await next();
});
