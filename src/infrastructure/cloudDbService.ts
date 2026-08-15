import { CatalogItem, CloudDbConfig } from '../domain/types';

export const DEFAULT_CLOUD_DB_CONFIG: CloudDbConfig = {
  enabled: true,
  supabaseUrl: import.meta.env?.VITE_SUPABASE_URL || 'https://zfpsgycfqybgqytjmeck.supabase.co',
  supabaseAnonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eUNn1NWvQhljdd2pirtZtw_sLFDHWy7',
  autoSync: true
};

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
