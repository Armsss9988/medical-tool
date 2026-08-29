// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getTable,
  putTable,
  getPassword,
  setPassword,
  ApiAuthError,
  TABLE_API_NAMES,
  getApiBase,
  setApiBase
} from '../apiClient';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

describe('apiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setPassword('');
  });

  it('exposes the storage-key -> api table-name map', () => {
    expect(TABLE_API_NAMES).toMatchObject({
      catalog: 'catalog',
      testPackages: 'test-packages',
      testGroups: 'test-groups',
      equipments: 'equipments',
      doctorsList: 'doctors',
      clinicInfo: 'clinic-info',
      zaloConfig: 'zalo-config',
      medical_reports: 'medical-reports',
      invoices: 'invoices'
    });
  });

  it('getTable calls the correct URL with the auth header and returns parsed data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ rows: [{ id: 1 }], count: 1, updatedAt: '2026-08-29T00:00:00Z' })
    );
    vi.stubGlobal('fetch', fetchMock);
    setPassword('secret');

    const result = await getTable('catalog');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tables/catalog');
    expect(init.headers).toMatchObject({ 'x-app-password': 'secret' });
    expect(result).toEqual({ rows: [{ id: 1 }], count: 1, updatedAt: '2026-08-29T00:00:00Z' });
  });

  it('putTable sends a PUT with body { rows } and the auth header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ replaced: 2 }));
    vi.stubGlobal('fetch', fetchMock);
    setPassword('secret');

    const rows = [{ id: 1 }, { id: 2 }];
    const result = await putTable('catalog', rows);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tables/catalog');
    expect(init.method).toBe('PUT');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      'x-app-password': 'secret'
    });
    expect(init.body).toBe(JSON.stringify({ rows }));
    expect(result).toEqual({ replaced: 2 });
  });

  it('throws ApiAuthError on a 401 response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'unauthorized' }, 401));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTable('catalog')).rejects.toBeInstanceOf(ApiAuthError);
  });

  it('throws a generic Error on other non-ok responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'boom' }, 503));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTable('catalog')).rejects.toBeInstanceOf(Error);
  });

  it('getPassword reflects setPassword and persists to sessionStorage', () => {
    setPassword('abc');
    expect(getPassword()).toBe('abc');
    expect(sessionStorage.getItem('golab_app_password')).toBe('abc');
    setPassword('');
    expect(getPassword()).toBe('');
    expect(sessionStorage.getItem('golab_app_password')).toBeNull();
  });
});

describe('apiClient api base url override', () => {
  afterEach(() => {
    setApiBase('');
  });

  it('defaults to /api', () => {
    expect(getApiBase()).toBe('/api');
  });

  it('setApiBase updates getApiBase and persists to localStorage', () => {
    setApiBase('https://example.com/api');
    expect(getApiBase()).toBe('https://example.com/api');
    expect(localStorage.getItem('golab_api_base')).toBe('https://example.com/api');
  });

  it('setApiBase empty resets to /api and clears localStorage', () => {
    setApiBase('https://example.com/api');
    setApiBase('');
    expect(getApiBase()).toBe('/api');
    expect(localStorage.getItem('golab_api_base')).toBeNull();
  });
});
