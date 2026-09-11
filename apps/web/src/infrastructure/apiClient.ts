import { STORAGE_KEYS } from '@domain/constants/storageKeys';
import type { Invoice, MedicalReport } from '@domain';

export const TABLE_API_NAMES: Record<string, string> = {
  [STORAGE_KEYS.CATALOG]: 'catalog',
  [STORAGE_KEYS.TEST_PACKAGES]: 'test-packages',
  [STORAGE_KEYS.TEST_GROUPS]: 'test-groups',
  [STORAGE_KEYS.EQUIPMENTS]: 'equipments',
  [STORAGE_KEYS.DOCTORS]: 'doctors',
  [STORAGE_KEYS.CLINIC_INFO]: 'clinic-info',
  [STORAGE_KEYS.ZALO_CONFIG]: 'zalo-config',
  [STORAGE_KEYS.REFERENCE_RANGES]: 'reference-ranges',
  [STORAGE_KEYS.CATALOG_ITEM_EQUIPMENTS]: 'catalog-item-equipments',
  [STORAGE_KEYS.ALLERGEN_SCALES]: 'allergen-scales',
  [STORAGE_KEYS.REPORTS]: 'medical-reports',
  [STORAGE_KEYS.INVOICES]: 'invoices',
  [STORAGE_KEYS.REPORT_TEMPLATES]: 'report-templates'
};

let apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';

const savedApiBase = typeof localStorage !== 'undefined' ? localStorage.getItem('golab_api_base') : null;
if (savedApiBase) apiBase = savedApiBase;

const SESSION_PASSWORD_KEY = 'golab_app_password';

let password = typeof window !== 'undefined' ? (sessionStorage.getItem(SESSION_PASSWORD_KEY) ?? '') : '';

export function getPassword(): string {
  if (!password && typeof window !== 'undefined') {
    password = sessionStorage.getItem(SESSION_PASSWORD_KEY) ?? '';
  }
  return password;
}

export function setPassword(p: string): void {
  password = p;
  if (typeof window !== 'undefined') {
    if (p) {
      sessionStorage.setItem(SESSION_PASSWORD_KEY, p);
    } else {
      sessionStorage.removeItem(SESSION_PASSWORD_KEY);
    }
  }
}

export function getApiBase(): string {
  return apiBase;
}

export function setApiBase(url: string): void {
  apiBase = url || '/api';
  if (url) {
    localStorage.setItem('golab_api_base', url);
  } else {
    localStorage.removeItem('golab_api_base');
  }
}

export class ApiAuthError extends Error {}

export interface TableData {
  rows: unknown[];
  count: number;
  updatedAt: string;
}

export interface PutTableResult {
  replaced: number;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    throw new ApiAuthError('Unauthorized');
  }
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message =
      (errorBody as { error?: string; message?: string }).error ||
      (errorBody as { error?: string; message?: string }).message ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return (await res.json()) as T;
}

function resolveUrl(endpoint: string): string {
  const base = (apiBase || '/api').replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

export async function getTable(name: string): Promise<TableData> {
  const res = await fetch(resolveUrl(`/tables/${name}`), {
    headers: { 'x-app-password': getPassword() }
  });
  return handleResponse<TableData>(res);
}

export async function putTable(name: string, rows: unknown[]): Promise<PutTableResult> {
  const res = await fetch(resolveUrl(`/tables/${name}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': getPassword()
    },
    body: JSON.stringify({ rows })
  });
  return handleResponse<PutTableResult>(res);
}

export async function postReport(report: unknown): Promise<{ success: boolean; id: string }> {
  const res = await fetch(resolveUrl('/reports'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': getPassword()
    },
    body: JSON.stringify(report)
  });
  return handleResponse<{ success: boolean; id: string }>(res);
}

export async function deleteReportApi(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(resolveUrl(`/reports/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: { 'x-app-password': getPassword() }
  });
  return handleResponse<{ success: boolean; id: string }>(res);
}

export async function postInvoice(invoice: unknown): Promise<{ success: boolean; id: string }> {
  const res = await fetch(resolveUrl('/invoices'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': getPassword()
    },
    body: JSON.stringify(invoice)
  });
  return handleResponse<{ success: boolean; id: string }>(res);
}

export async function deleteInvoiceApi(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(resolveUrl(`/invoices/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: { 'x-app-password': getPassword() }
  });
  return handleResponse<{ success: boolean; id: string }>(res);
}

export async function postCatalogItem(item: unknown): Promise<{ success: boolean; code: string }> {
  const res = await fetch(resolveUrl('/catalog'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': getPassword()
    },
    body: JSON.stringify(item)
  });
  return handleResponse<{ success: boolean; code: string }>(res);
}

export async function deleteCatalogItemApi(code: string): Promise<{ success: boolean; code: string }> {
  const res = await fetch(resolveUrl(`/catalog/${encodeURIComponent(code)}`), {
    method: 'DELETE',
    headers: { 'x-app-password': getPassword() }
  });
  return handleResponse<{ success: boolean; code: string }>(res);
}

export async function postTestPackage(pkg: unknown): Promise<{ success: boolean; id: string }> {
  const res = await fetch(resolveUrl('/packages'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': getPassword()
    },
    body: JSON.stringify(pkg)
  });
  return handleResponse<{ success: boolean; id: string }>(res);
}

export async function deleteTestPackageApi(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(resolveUrl(`/packages/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: { 'x-app-password': getPassword() }
  });
  return handleResponse<{ success: boolean; id: string }>(res);
}

export async function payInvoice(
  id: string,
  paymentData: { paymentMethod?: string; cashier?: string; paidAt?: string; discount?: number; invoice?: Invoice }
): Promise<{ success: boolean; invoice?: Invoice; report?: MedicalReport }> {
  const res = await fetch(resolveUrl(`/invoices/${encodeURIComponent(id)}/pay`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': getPassword()
    },
    body: JSON.stringify(paymentData)
  });
  return handleResponse<{ success: boolean; invoice?: Invoice; report?: MedicalReport }>(res);
}

export async function cancelInvoice(
  id: string,
  cancelData: { reason?: string; cancelledBy?: string }
): Promise<{ success: boolean; invoice?: Invoice; report?: MedicalReport }> {
  const res = await fetch(resolveUrl(`/invoices/${encodeURIComponent(id)}/cancel`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': getPassword()
    },
    body: JSON.stringify(cancelData)
  });
  return handleResponse<{ success: boolean; invoice?: Invoice; report?: MedicalReport }>(res);
}

export async function recordPdfExportApi(
  reportId: string,
  data: {
    cloudPdfUrl: string;
    qrCodeDataUrl?: string;
    version?: number;
    report?: MedicalReport;
    note?: string;
  }
): Promise<{ success: boolean; report?: MedicalReport }> {
  const res = await fetch(resolveUrl(`/reports/${encodeURIComponent(reportId)}/export-pdf`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': getPassword()
    },
    body: JSON.stringify(data)
  });
  return handleResponse<{ success: boolean; report?: MedicalReport }>(res);
}

export async function putReportTemplatesApi(templates: unknown[]): Promise<PutTableResult> {
  return putTable('report-templates', templates);
}



