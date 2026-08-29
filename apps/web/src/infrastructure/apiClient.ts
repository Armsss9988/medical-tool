import { STORAGE_KEYS } from '@domain/constants/storageKeys';

export const TABLE_API_NAMES: Record<string, string> = {
  [STORAGE_KEYS.CATALOG]: 'catalog',
  [STORAGE_KEYS.TEST_PACKAGES]: 'test-packages',
  [STORAGE_KEYS.TEST_GROUPS]: 'test-groups',
  [STORAGE_KEYS.EQUIPMENTS]: 'equipments',
  [STORAGE_KEYS.DOCTORS]: 'doctors',
  [STORAGE_KEYS.CLINIC_INFO]: 'clinic-info',
  [STORAGE_KEYS.ZALO_CONFIG]: 'zalo-config',
  [STORAGE_KEYS.REPORTS]: 'medical-reports',
  [STORAGE_KEYS.INVOICES]: 'invoices'
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';

const SESSION_PASSWORD_KEY = 'golab_app_password';

let password = sessionStorage.getItem(SESSION_PASSWORD_KEY) ?? '';

export function getPassword(): string {
  return password;
}

export function setPassword(p: string): void {
  password = p;
  if (p) {
    sessionStorage.setItem(SESSION_PASSWORD_KEY, p);
  } else {
    sessionStorage.removeItem(SESSION_PASSWORD_KEY);
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
    throw new Error(`Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function getTable(name: string): Promise<TableData> {
  const res = await fetch(`${API_BASE}/tables/${name}`, {
    headers: { 'x-app-password': getPassword() }
  });
  return handleResponse<TableData>(res);
}

export async function putTable(name: string, rows: unknown[]): Promise<PutTableResult> {
  const res = await fetch(`${API_BASE}/tables/${name}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': getPassword()
    },
    body: JSON.stringify({ rows })
  });
  return handleResponse<PutTableResult>(res);
}
