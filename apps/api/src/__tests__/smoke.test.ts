import { describe, expect, it } from 'vitest';
import app from '../index';

describe('app smoke', () => {
  it('bootstraps without throwing', () => {
    expect(app).toBeDefined();
  });

  it('health is public, protected routes are gated without password', async () => {
    const health = await app.request('/api/health');
    expect(health.status).toBe(200);
    const protectedRoute = await app.request('/api/tables/catalog');
    expect([401, 503]).toContain(protectedRoute.status);
  });
});
