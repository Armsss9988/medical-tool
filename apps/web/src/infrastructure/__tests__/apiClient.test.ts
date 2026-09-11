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
  setApiBase,
  postCatalogItem,
  deleteCatalogItemApi,
  postTestPackage,
  deleteTestPackageApi,
  payInvoice,
  cancelInvoice,
  recordPdfExportApi,
  putReportTemplatesApi
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

  it('postCatalogItem sends POST /api/catalog with payload and auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, code: 'TEST_01' }));
    vi.stubGlobal('fetch', fetchMock);
    setPassword('secret');

    const item = { code: 'TEST_01', name: 'Test Indicator', category: 'Huyết học', unit: 'g/L', refText: '' };
    const result = await postCatalogItem(item);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/catalog');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      'x-app-password': 'secret'
    });
    expect(init.body).toBe(JSON.stringify(item));
    expect(result).toEqual({ success: true, code: 'TEST_01' });
  });

  it('deleteCatalogItemApi sends DELETE /api/catalog/[code]', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, code: 'TEST_01' }));
    vi.stubGlobal('fetch', fetchMock);
    setPassword('secret');

    const result = await deleteCatalogItemApi('TEST_01');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/catalog/TEST_01');
    expect(init.method).toBe('DELETE');
    expect(result).toEqual({ success: true, code: 'TEST_01' });
  });

  it('postTestPackage sends POST /api/packages with payload and auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, id: 'PKG_01' }));
    vi.stubGlobal('fetch', fetchMock);
    setPassword('secret');

    const pkg = { id: 'PKG_01', name: 'Gói Tổng Quát', price: 500000, items: [] };
    const result = await postTestPackage(pkg);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/packages');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      'x-app-password': 'secret'
    });
    expect(init.body).toBe(JSON.stringify(pkg));
    expect(result).toEqual({ success: true, id: 'PKG_01' });
  });

  it('deleteTestPackageApi sends DELETE /api/packages/[id]', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, id: 'PKG_01' }));
    vi.stubGlobal('fetch', fetchMock);
    setPassword('secret');

    const result = await deleteTestPackageApi('PKG_01');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/packages/PKG_01');
    expect(init.method).toBe('DELETE');
    expect(result).toEqual({ success: true, id: 'PKG_01' });
  });

  it('getPassword reflects setPassword and persists to sessionStorage', () => {
    setPassword('abc');
    expect(getPassword()).toBe('abc');
    expect(sessionStorage.getItem('golab_app_password')).toBe('abc');
    setPassword('');
    expect(getPassword()).toBe('');
    expect(sessionStorage.getItem('golab_app_password')).toBeNull();
  });

  it('payInvoice sends a POST to /api/invoices/:id/pay with body and auth header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);
    setPassword('secret');

    const result = await payInvoice('inv-123', { paymentMethod: 'Tiền mặt', cashier: 'Thu ngân' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/invoices/inv-123/pay');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'x-app-password': 'secret' });
    expect(JSON.parse(init.body as string)).toEqual({ paymentMethod: 'Tiền mặt', cashier: 'Thu ngân' });
    expect(result).toEqual({ success: true });
  });

  it('cancelInvoice sends a POST to /api/invoices/:id/cancel with body and auth header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);
    setPassword('secret');

    const result = await cancelInvoice('inv-123', { reason: 'Sai thông tin' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/invoices/inv-123/cancel');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'x-app-password': 'secret' });
    expect(JSON.parse(init.body as string)).toEqual({ reason: 'Sai thông tin' });
    expect(result).toEqual({ success: true });
  });

  it('recordPdfExportApi sends a POST to /api/reports/:id/export-pdf with body and auth header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);
    setPassword('secret');

    const result = await recordPdfExportApi('rep-123', {
      cloudPdfUrl: 'https://cdn.example.com/rep.pdf',
      version: 2,
      report: { id: 'rep-123', patientName: 'Nguyen Van A' } as any
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/reports/rep-123/export-pdf');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'x-app-password': 'secret' });
    expect(JSON.parse(init.body as string)).toEqual({
      cloudPdfUrl: 'https://cdn.example.com/rep.pdf',
      version: 2,
      report: { id: 'rep-123', patientName: 'Nguyen Van A' }
    });
    expect(result).toEqual({ success: true });
  });

  it('payInvoice passes invoice fallback object in payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);
    setPassword('secret');

    const fallbackInv = { id: 'inv-123', code: 'HD01' } as any;
    await payInvoice('inv-123', { paymentMethod: 'Tiền mặt', invoice: fallbackInv });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({
      paymentMethod: 'Tiền mặt',
      invoice: fallbackInv
    });
  });

  it('putReportTemplatesApi sends a PUT to /api/tables/report-templates with rows array', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, count: 1 }));
    vi.stubGlobal('fetch', fetchMock);
    setPassword('secret');

    const templates = [{ id: 'tpl-1', name: 'Mẫu test' }] as any;
    const res = await putReportTemplatesApi(templates);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tables/report-templates');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ rows: templates });
    expect(res).toEqual({ success: true, count: 1 });
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
