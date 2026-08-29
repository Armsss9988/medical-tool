import { describe, it, expect } from 'vitest';
import app from '../index';

describe('GET /api/health', () => {
  it('returns 200 with ok true', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; service: string };
    expect(body.ok).toBe(true);
    expect(body.service).toBe('golab-api');
  });
});