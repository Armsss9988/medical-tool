export function isElectron(): boolean {
  return typeof window !== 'undefined' && Boolean((window as unknown as { electronAPI?: unknown }).electronAPI);
}

export async function loadData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = localStorage.getItem(`golab_${key}`);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (e) {
    console.warn(`Lỗi đọc localStorage key golab_${key}:`, e);
  }
  return defaultValue;
}

export function saveData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`golab_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`Lỗi ghi localStorage key golab_${key}:`, e);
  }
}

export async function openDataFolder(): Promise<string | null> {
  if (isElectron()) {
    try {
      const electronAPI = (window as unknown as { electronAPI: { openDataFolder: () => Promise<string> } }).electronAPI;
      return await electronAPI.openDataFolder();
    } catch (e) {
      console.error("Lỗi khi mở thư mục qua Electron:", e);
    }
  }
  return null;
}
