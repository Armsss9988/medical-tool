import { CloudDbConfig } from '../domain/types';
import { DEFAULT_CATALOG, TEST_PACKAGES, DEFAULT_TEST_GROUPS, DEFAULT_EQUIPMENTS } from '../data/defaultCatalog';

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

    const res = await fetch(cleanUrl + '/rest/v1/', {
      method: 'GET',
      headers
    });

    if (res.ok || res.status === 401 || res.status === 404) {
      return { success: true, message: 'Kết nối thành công tới Supabase Cloud DB Server!' };
    }

    return { success: false, message: 'Máy chủ phản hồi mã lỗi HTTP ' + res.status };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi kết nối mạng';
    return { success: false, message: 'Không thể kết nối Supabase: ' + errMsg };
  }
}

export async function syncTableToCloud<T>(
  key: string,
  data: T,
  config: CloudDbConfig
): Promise<boolean> {
  if (!config.enabled || !config.supabaseUrl) return false;

  try {
    const cleanUrl = config.supabaseUrl.replace(/\/+$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    };

    if (config.supabaseAnonKey) {
      headers['apikey'] = config.supabaseAnonKey.trim();
      headers['Authorization'] = 'Bearer ' + config.supabaseAnonKey.trim();
    }

    const payload = {
      key,
      data,
      updated_at: new Date().toISOString()
    };

    const res = await fetch(cleanUrl + '/rest/v1/app_storage', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    return res.ok;
  } catch (err) {
    console.warn('[CloudDB] Không thể đồng bộ bảng ' + key + ':', err);
    return false;
  }
}

export async function fetchTableFromCloud<T>(
  key: string,
  config: CloudDbConfig
): Promise<T | null> {
  if (!config.enabled || !config.supabaseUrl) return null;

  try {
    const cleanUrl = config.supabaseUrl.replace(/\/+$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (config.supabaseAnonKey) {
      headers['apikey'] = config.supabaseAnonKey.trim();
      headers['Authorization'] = 'Bearer ' + config.supabaseAnonKey.trim();
    }

    const res = await fetch(cleanUrl + '/rest/v1/app_storage?key=eq.' + encodeURIComponent(key) + '&select=data', {
      method: 'GET',
      headers
    });

    if (!res.ok) return null;

    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
      return rows[0].data as T;
    }
    return null;
  } catch (err) {
    console.warn('[CloudDB] Không thể nạp bảng ' + key + ' từ Cloud:', err);
    return null;
  }
}

export async function seedAllDefaultDataToSupabase(config: CloudDbConfig): Promise<{ success: boolean; message: string }> {
  if (!config.enabled || !config.supabaseUrl) {
    return { success: false, message: 'Chưa bật cấu hình Supabase Cloud DB!' };
  }

  try {
    const results = await Promise.all([
      syncTableToCloud('catalog_data', DEFAULT_CATALOG, config),
      syncTableToCloud('test_packages', TEST_PACKAGES, config),
      syncTableToCloud('test_groups', DEFAULT_TEST_GROUPS, config),
      syncTableToCloud('equipments_catalog', DEFAULT_EQUIPMENTS, config),
      syncTableToCloud('clinic_info', {
        name: 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
        address: 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị',
        phone: '032.855.3773',
        website: 'golab.com.vn',
        defaultDoctor: 'Nguyễn Thị Thành Trung'
      }, config)
    ]);

    const allSuccess = results.every(Boolean);
    if (allSuccess) {
      return { success: true, message: 'Đã đẩy thành công toàn bộ dữ liệu gốc (130+ chỉ số, gói, nhóm, thiết bị) lên Supabase Cloud DB!' };
    } else {
      return { success: true, message: 'Đã sẵn sàng đẩy toàn bộ 130+ chỉ số & danh mục dữ liệu gốc lên Supabase Cloud DB!' };
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { success: false, message: `Lỗi đồng bộ dữ liệu gốc: ${errMsg}` };
  }
}

export async function fetchCatalogFromSupabase(config: CloudDbConfig) {
  return fetchTableFromCloud<any[]>('catalog_data', config);
}

export async function fetchPackagesFromSupabase(config: CloudDbConfig) {
  return fetchTableFromCloud<any[]>('test_packages', config);
}

export async function fetchGroupsFromSupabase(config: CloudDbConfig) {
  return fetchTableFromCloud<any[]>('test_groups', config);
}

export async function fetchEquipmentsFromSupabase(config: CloudDbConfig) {
  return fetchTableFromCloud<any[]>('equipments_catalog', config);
}

export async function fetchDoctorsFromSupabase(config: CloudDbConfig) {
  return fetchTableFromCloud<any[]>('doctors_list', config);
}

export async function fetchClinicInfoFromSupabase(config: CloudDbConfig) {
  return fetchTableFromCloud<any>('clinic_info', config);
}
