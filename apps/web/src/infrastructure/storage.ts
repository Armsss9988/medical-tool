import { StorageResult } from '@domain/types';

function getLocalStorageItemWithFallback(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;

  // 1. Standard key: medical_${key}
  const k1 = `medical_${key}`;
  const r1 = localStorage.getItem(k1);
  if (r1 !== null) return r1;

  // 2. Exact key: e.g. 'medical_reports'
  const r2 = localStorage.getItem(key);
  if (r2 !== null) return r2;

  // 3. Strip prefix if key already started with 'medical_'
  if (key.startsWith('medical_')) {
    const stripped = key.replace(/^medical_/, '');
    const r3 = localStorage.getItem(stripped);
    if (r3 !== null) return r3;
  }

  return null;
}

export async function loadData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = getLocalStorageItemWithFallback(key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function saveData<T>(key: string, data: T): Promise<StorageResult> {
  try {
    const serialized = JSON.stringify(data);
    const lsKey = `medical_${key}`;
    localStorage.setItem(lsKey, serialized);
    // Also save under direct key if key already starts with medical_ for backward compatibility
    if (key.startsWith('medical_')) {
      localStorage.setItem(key, serialized);
    }
    return { success: true };
  } catch (err: unknown) {
    // If QuotaExceededError on browser localStorage, sanitize heavy fields and retry
    if (err instanceof Error && (err.name === 'QuotaExceededError' || err.message.includes('quota')) && Array.isArray(data)) {
      try {
        const sanitized = data.map((item: unknown) => {
          if (item && typeof item === 'object' && 'qrCodeDataUrl' in item) {
            const copy = { ...(item as Record<string, unknown>) };
            delete copy.qrCodeDataUrl;
            return copy;
          }
          return item;
        });
        const serialized = JSON.stringify(sanitized);
        const lsKey = `medical_${key}`;
        localStorage.setItem(lsKey, serialized);
        return { success: true };
      } catch (innerErr) {
        console.error('[GoLabStorage] LocalStorage quota exceeded even after sanitizing:', innerErr);
      }
    }
    const errMsg = err instanceof Error ? err.message : 'Lỗi localStorage';
    return { success: false, error: errMsg };
  }
}

export function loadDataSync<T>(key: string, defaultValue: T): T {
  try {
    const raw = getLocalStorageItemWithFallback(key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function openDataFolder(): Promise<string | null> {
  return null;
}

export async function getDataDirPath(): Promise<string> {
  return 'localStorage (đang chạy trên trình duyệt)';
}

export function loadState<T>(key: string, defaultValue: T): T {
  return loadDataSync<T>(key, defaultValue);
}

export function saveState<T>(key: string, data: T): void {
  saveData<T>(key, data);
}
