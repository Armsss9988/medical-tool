import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from '../index';

const HEADER = 'x-app-password';

describe('GET /api/health', () => {
  beforeEach(() => {
    process.env.APP_ACCESS_PASSWORD = 's3cret';
  });
  afterEach(() => {
    delete process.env.APP_ACCESS_PASSWORD;
  });

  it('returns 200 with ok true when correct password supplied', async () => {
    const res = await app.request('/api/health', {
      headers: { [HEADER]: 's3cret' }
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; service: string };
    expect(body.ok).toBe(true);
    expect(body.service).toBe('golab-api');
  });

  it('denies access without password (fail-closed)', async () => {
    const res = await app.request('/api/health');
    expect([401, 503]).toContain(res.status);
  });
});
