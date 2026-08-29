import { createMiddleware } from 'hono/factory';
import { timingSafeEqual } from 'node:crypto';
import type { AppEnv } from '../env';

const HEADER = 'x-app-password';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export const passwordGate = createMiddleware<AppEnv>(async (c, next) => {
  const expected = c.env?.APP_ACCESS_PASSWORD ?? process.env.APP_ACCESS_PASSWORD;
  if (!expected) {
    return c.json({ error: 'server not configured' }, 503);
  }
  const provided = c.req.header(HEADER) ?? '';
  if (!safeEqual(provided, expected)) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  await next();
  return;
});
