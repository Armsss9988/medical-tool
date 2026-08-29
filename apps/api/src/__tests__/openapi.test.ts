import { describe, expect, it } from 'vitest';
import app from '../index';

describe('GET /api/openapi.json', () => {
  it('returns 200 with openapi spec', async () => {
    const res = await app.request('/api/openapi.json');
    expect(res.status).toBe(200);
    const doc = (await res.json()) as {
      openapi: string;
      paths: Record<string, unknown>;
      components: { schemas: Record<string, unknown> };
    };
    expect(doc.openapi).toBe('3.0.3');
    expect(doc.paths['/api/tables/{name}']).toBeDefined();
    expect(doc.components.schemas.catalog).toBeDefined();
  });
});
