import { describe, expect, it } from 'vitest';
import app from '../index';

describe('app smoke', () => {
  it('bootstraps without throwing', () => {
    expect(app).toBeDefined();
  });

  it('responds (fail-closed: 401/503 without password)', async () => {
    const res = await app.request('/api/health');
    expect([401, 503]).toContain(res.status);
  });
});
