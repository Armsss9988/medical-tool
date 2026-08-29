import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { passwordGate } from '../middleware/passwordGate';

function makeApp(): Hono {
  const app = new Hono();
  app.use('*', passwordGate);
  app.get('/api/ping', (c) => c.json({ ok: true }));
  return app;
}

describe('passwordGate', () => {
  beforeEach(() => {
    process.env.APP_ACCESS_PASSWORD = 's3cret';
  });
  afterEach(() => {
    delete process.env.APP_ACCESS_PASSWORD;
  });

  it('401 when header missing', async () => {
    const res = await makeApp().request('/api/ping');
    expect(res.status).toBe(401);
  });

  it('401 when header wrong', async () => {
    const res = await makeApp().request('/api/ping', {
      headers: { 'x-app-password': 'wrong' }
    });
    expect(res.status).toBe(401);
  });

  it('200 when header correct', async () => {
    const res = await makeApp().request('/api/ping', {
      headers: { 'x-app-password': 's3cret' }
    });
    expect(res.status).toBe(200);
  });

  it('503 when env unset (fail closed)', async () => {
    delete process.env.APP_ACCESS_PASSWORD;
    const res = await makeApp().request('/api/ping');
    expect(res.status).toBe(503);
  });
});
