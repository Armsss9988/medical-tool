import { StorageResult } from '@domain/types';

function getLocalStorageItemWithFallback(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;

  const normalizedKey = key.startsWith('medical_') ? key : `medical_${key}`;

  // 1. Normalized key: e.g. 'medical_reports'
  const r1 = localStorage.getItem(normalizedKey);
  if (r1 !== null) return r1;

  // 2. Direct key fallback: e.g. 'reports'
  const r2 = localStorage.getItem(key);
  if (r2 !== null) return r2;

  // 3. Fallback for legacy double-prefixed key: e.g. 'medical_medical_reports'
  const r3 = localStorage.getItem(`medical_${key}`);
  if (r3 !== null) return r3;

  // 4. Strip prefix if key already started with 'medical_'
  if (key.startsWith('medical_')) {
    const stripped = key.replace(/^medical_/, '');
    const r4 = localStorage.getItem(stripped);
    if (r4 !== null) return r4;
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
    const lsKey = key.startsWith('medical_') ? key : `medical_${key}`;
    localStorage.setItem(lsKey, serialized);
    // Clean up legacy double-prefixed key if present
    if (key.startsWith('medical_')) {
      try {
        localStorage.removeItem(`medical_${key}`);
      } catch {
        // ignore
      }
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
        const lsKey = key.startsWith('medical_') ? key : `medical_${key}`;
        localStorage.setItem(lsKey, serialized);
        if (key.startsWith('medical_')) {
          try {
            localStorage.removeItem(`medical_${key}`);
          } catch {
            // ignore
          }
        }
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

export async function getDataDirPath(): Promise<string> {
  return 'localStorage (đang chạy trên trình duyệt)';
}

export function loadState<T>(key: string, defaultValue: T): T {
  return loadDataSync<T>(key, defaultValue);
}

export function saveState<T>(key: string, data: T): void {
  saveData<T>(key, data);
}
