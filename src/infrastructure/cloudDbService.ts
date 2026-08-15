import { CloudDbConfig } from '../domain/types';

export const DEFAULT_CLOUD_DB_CONFIG: CloudDbConfig = {
  enabled: true,
  supabaseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '',
  supabaseAnonKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '',
  autoSync: true
};

export async function testSupabaseConnection(config: CloudDbConfig): Promise<{ success: boolean; message: string }> {
  if (!config.supabaseUrl) {
    return { success: false, message: 'Chưa cấu hình Supabase Project URL!' };
  }

  try {
    const cleanUrl = config.supabaseUrl.replace(/\/+$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (config.supabaseAnonKey) {
      headers['apikey'] = config.supabaseAnonKey.trim();
      headers['Authorization'] = 'Bearer ' + config.supabaseAnonKey.trim();
    }

    const response = await fetch(`${cleanUrl}/rest/v1/app_storage?select=key_name&limit=1`, {
      method: 'GET',
      headers
    });

    if (response.ok) {
      return { success: true, message: 'Kết nối Supabase Cloud DB thành công!' };
    } else {
      const errText = await response.text();
      return { success: false, message: `Lỗi Supabase (${response.status}): ${errText}` };
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Không thể kết nối Supabase: ${errMsg}` };
  }
}

export async function syncTableToCloud<T>(
  tableName: string,
  data: T,
  config: CloudDbConfig = DEFAULT_CLOUD_DB_CONFIG
): Promise<boolean> {
  if (!config.enabled || !config.supabaseUrl || !config.supabaseAnonKey) {
    return false;
  }

  try {
    const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/app_storage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.supabaseAnonKey,
        'Authorization': `Bearer ${config.supabaseAnonKey}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        key_name: tableName,
        data_json: data,
        updated_at: new Date().toISOString()
      })
    });

    return response.ok;
  } catch (err) {
    console.warn(`Lỗi đồng bộ bảng ${tableName} lên Supabase Cloud:`, err);
    return false;
  }
}

export async function fetchTableFromCloud<T>(
  tableName: string,
  config: CloudDbConfig = DEFAULT_CLOUD_DB_CONFIG
): Promise<T | null> {
  if (!config.enabled || !config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }

  try {
    const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/app_storage?key_name=eq.${tableName}&select=data_json`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': config.supabaseAnonKey,
        'Authorization': `Bearer ${config.supabaseAnonKey}`
      }
    });

    if (!response.ok) return null;

    const rows = await response.json();
    if (Array.isArray(rows) && rows.length > 0 && rows[0].data_json) {
      return rows[0].data_json as T;
    }
    return null;
  } catch (err) {
    console.warn(`Lỗi tải dữ liệu bảng ${tableName} từ Supabase Cloud:`, err);
    return null;
  }
}
