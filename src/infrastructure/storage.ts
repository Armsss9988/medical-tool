import { StorageResult } from '../domain/types';

export const isElectron = (): boolean =>
  typeof window !== 'undefined' &&
  window.electronAPI !== undefined &&
  typeof window.electronAPI.readLocalData === 'function';

export async function loadData<T>(key: string, defaultValue: T): Promise<T> {
  if (isElectron() && window.electronAPI) {
    try {
      const data = await window.electronAPI.readLocalData(key);
      return data !== null && data !== undefined ? (data as T) : defaultValue;
    } catch (err) {
      console.warn(`[GoLabStorage] Lỗi đọc file ${key}.json, dùng localStorage:`, err);
    }
  }
  try {
    const lsKey = `medical_${key}`;
    const raw = localStorage.getItem(lsKey);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function saveData<T>(key: string, data: T): Promise<StorageResult> {
  if (isElectron() && window.electronAPI) {
    try {
      const result = await window.electronAPI.writeLocalData(key, data);
      if (!result.success) throw new Error(result.message || 'Lỗi ghi file');
      return { success: true, path: result.path };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi ghi file';
      console.error(`[GoLabStorage] Lỗi ghi file ${key}.json:`, err);
      return { success: false, error: errMsg };
    }
  }
  try {
    const lsKey = `medical_${key}`;
    localStorage.setItem(lsKey, JSON.stringify(data));
    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi localStorage';
    return { success: false, error: errMsg };
  }
}

export function loadDataSync<T>(key: string, defaultValue: T): T {
  try {
    const lsKey = `medical_${key}`;
    const raw = localStorage.getItem(lsKey);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function openDataFolder(): Promise<string | null> {
  if (isElectron() && window.electronAPI) {
    return await window.electronAPI.openDataFolder();
  }
  return null;
}

export async function getDataDirPath(): Promise<string> {
  if (isElectron() && window.electronAPI) {
    return await window.electronAPI.getDataDirPath();
  }
  return 'localStorage (đang chạy trên trình duyệt)';
}

export function loadState<T>(key: string, defaultValue: T): T {
  return loadDataSync<T>(key, defaultValue);
}

export function saveState<T>(key: string, data: T): void {
  saveData<T>(key, data);
}
