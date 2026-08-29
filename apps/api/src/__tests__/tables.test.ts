import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../index';

vi.mock('../db/client', () => ({ getDb: () => ({}) }));

const repoMock = vi.hoisted(() => ({
  getTableRows: vi.fn(),
  replaceTable: vi.fn()
}));

vi.mock('../db/repo', () => repoMock);

const AUTH = { 'x-app-password': 's3cret' };

describe('GET /api/tables/:name', () => {
  beforeEach(() => {
    process.env.APP_ACCESS_PASSWORD = 's3cret';
    process.env.DATABASE_URL = 'mock';
    vi.clearAllMocks();
  });

  it('401 without password', async () => {
    const res = await app.request('/api/tables/catalog');
    expect(res.status).toBe(401);
  });

  it('404 unknown table', async () => {
    const res = await app.request('/api/tables/users', { headers: AUTH });
    expect(res.status).toBe(404);
    expect(repoMock.getTableRows).not.toHaveBeenCalled();
  });

  it('returns rows from repo', async () => {
    repoMock.getTableRows.mockResolvedValue([{ code: 'GLU', name: 'Glucose' }]);
    const res = await app.request('/api/tables/catalog', { headers: AUTH });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { count: number; rows: unknown[] };
    expect(body.count).toBe(1);
    expect(body.rows).toEqual([{ code: 'GLU', name: 'Glucose' }]);
    expect(repoMock.getTableRows).toHaveBeenCalledWith(expect.anything(), 'catalog');
  });
});

describe('PUT /api/tables/:name', () => {
  beforeEach(() => {
    process.env.APP_ACCESS_PASSWORD = 's3cret';
    process.env.DATABASE_URL = 'mock';
    repoMock.replaceTable.mockResolvedValue(2);
  });

  it('400 invalid json body', async () => {
    const res = await app.request('/api/tables/catalog', {
      method: 'PUT',
      headers: { ...AUTH, 'content-type': 'application/json' },
      body: '{not json'
    });
    expect(res.status).toBe(400);
  });

  it('400 rows not matching row schema', async () => {
    const res = await app.request('/api/tables/catalog', {
      method: 'PUT',
      headers: { ...AUTH, 'content-type': 'application/json' },
      body: JSON.stringify({ rows: [{ name: 'no-code' }] })
    });
    expect(res.status).toBe(400);
    expect(repoMock.replaceTable).not.toHaveBeenCalled();
  });

  it('replaces valid rows and returns count', async () => {
    const res = await app.request('/api/tables/catalog', {
      method: 'PUT',
      headers: { ...AUTH, 'content-type': 'application/json' },
      body: JSON.stringify({ rows: [{ code: 'GLU', category: 'Sinh hóa', name: 'Glucose' }] })
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { replaced: number };
    expect(body.replaced).toBe(2);
    expect(repoMock.replaceTable).toHaveBeenCalledWith(
      expect.anything(),
      'catalog',
      expect.arrayContaining([expect.objectContaining({ code: 'GLU' })])
    );
  });

  it('accepts document rows with passthrough for medical-reports', async () => {
    const res = await app.request('/api/tables/medical-reports', {
      method: 'PUT',
      headers: { ...AUTH, 'content-type': 'application/json' },
      body: JSON.stringify({ rows: [{ id: 'r1', patient: { name: 'A' }, status: 'Chờ xét nghiệm' }] })
    });
    expect(res.status).toBe(200);
  });
});
