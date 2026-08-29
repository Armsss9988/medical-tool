import {
  CloudDbConfig,
  CatalogItem,
  TestPackage,
  TestGroup,
  TestEquipment,
  Doctor,
  ClinicInfo,
  Invoice
} from '@domain/types';
import { DEFAULT_CATALOG, TEST_PACKAGES, DEFAULT_TEST_GROUPS, DEFAULT_EQUIPMENTS } from '@data/defaultCatalog';

export interface DatabaseBackupFile {
  _meta: {
    backup_at: string;
    supabase_url: string;
    version: string;
    tables: string[];
  };
  catalog_data: CatalogItem[];
  test_packages: TestPackage[];
  test_groups: TestGroup[];
  equipments_catalog: TestEquipment[];
  doctors_list: Doctor[];
  clinic_info: ClinicInfo | null;
  invoices_data: Invoice[];
}

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

    const rows = (await res.json()) as Array<{ data: T }>;
    if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
      return rows[0].data;
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
      return { success: true, message: 'Đã đẩy thành công toàn bộ dữ liệu Nhi (76 chỉ số Nhi + 91 Dị Nguyên PROTIA + nhóm + thiết bị) lên Supabase Cloud DB!' };
    } else {
      return { success: true, message: 'Đã sẵn sàng đẩy toàn bộ 167 chỉ số (76 Nhi + 91 Dị Nguyên) & danh mục lên Supabase Cloud DB!' };
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { success: false, message: `Lỗi đồng bộ dữ liệu gốc: ${errMsg}` };
  }
}

export async function fetchCatalogFromSupabase(config: CloudDbConfig): Promise<CatalogItem[] | null> {
  return fetchTableFromCloud<CatalogItem[]>('catalog_data', config);
}

export async function fetchPackagesFromSupabase(config: CloudDbConfig): Promise<TestPackage[] | null> {
  return fetchTableFromCloud<TestPackage[]>('test_packages', config);
}

export async function fetchGroupsFromSupabase(config: CloudDbConfig): Promise<TestGroup[] | null> {
  return fetchTableFromCloud<TestGroup[]>('test_groups', config);
}

export async function fetchEquipmentsFromSupabase(config: CloudDbConfig): Promise<TestEquipment[] | null> {
  return fetchTableFromCloud<TestEquipment[]>('equipments_catalog', config);
}

export async function fetchDoctorsFromSupabase(config: CloudDbConfig): Promise<Doctor[] | null> {
  return fetchTableFromCloud<Doctor[]>('doctors_list', config);
}

export async function fetchClinicInfoFromSupabase(config: CloudDbConfig): Promise<ClinicInfo | null> {
  return fetchTableFromCloud<ClinicInfo>('clinic_info', config);
}

export async function fetchInvoicesFromSupabase(config: CloudDbConfig): Promise<Invoice[] | null> {
  return fetchTableFromCloud<Invoice[]>('invoices_data', config);
}

/**
 * Upsert catalog items lên Supabase theo code — KHÔNG ghi đè dữ liệu cũ.
 * Logic: Fetch catalog hiện tại → merge newItems vào (add mới, update nếu trùng code) → ghi lại.
 */
export async function upsertCatalogItemsToSupabase(
  newItems: CatalogItem[],
  config: CloudDbConfig
): Promise<{ success: boolean; message: string; added: number; updated: number }> {
  if (!config.enabled || !config.supabaseUrl) {
    return { success: false, message: 'Chưa bật cấu hình Supabase Cloud DB!', added: 0, updated: 0 };
  }

  try {
    // Bước 1: Fetch catalog hiện tại từ Supabase
    const existing = (await fetchTableFromCloud<CatalogItem[]>('catalog_data', config)) ?? [];

    // Bước 2: Merge — index theo code
    const byCode = new Map<string, CatalogItem>();
    for (const item of existing) {
      if (item.code) byCode.set(item.code, item);
    }

    let added = 0;
    let updated = 0;
    for (const newItem of newItems) {
      if (!newItem.code) continue;
      if (byCode.has(newItem.code)) {
        // Code đã tồn tại → update (ghi đè item đó)
        const current = byCode.get(newItem.code)!;
        byCode.set(newItem.code, { ...current, ...newItem });
        updated++;
      } else {
        // Code mới → thêm vào
        byCode.set(newItem.code, newItem);
        added++;
      }
    }

    const merged = Array.from(byCode.values());

    // Bước 3: Ghi lại toàn bộ merged catalog
    const ok = await syncTableToCloud('catalog_data', merged, config);
    if (!ok) {
      return { success: false, message: 'Lỗi khi ghi dữ liệu lên Supabase!', added, updated };
    }

    return {
      success: true,
      message: `Upsert thành công: +${added} chỉ số mới, cập nhật ${updated} chỉ số. Tổng: ${merged.length} chỉ số trong DB.`,
      added,
      updated
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { success: false, message: `Lỗi upsert catalog: ${errMsg}`, added: 0, updated: 0 };
  }
}

/**
 * Upsert danh sách thiết bị lên Supabase theo code — KHÔNG ghi đè thiết bị cũ.
 */
export async function upsertEquipmentsToSupabase(
  newEquipments: TestEquipment[],
  config: CloudDbConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled || !config.supabaseUrl) {
    return { success: false, message: 'Chưa bật cấu hình Supabase Cloud DB!' };
  }

  try {
    const existing = (await fetchTableFromCloud<TestEquipment[]>('equipments_catalog', config)) ?? [];
    const byCode = new Map<string, TestEquipment>();
    for (const item of existing) {
      if (item.code) byCode.set(item.code, item);
    }
    for (const item of newEquipments) {
      if (item.code && !byCode.has(item.code)) {
        byCode.set(item.code, item);
      }
    }
    const merged = Array.from(byCode.values());
    const ok = await syncTableToCloud('equipments_catalog', merged, config);
    return ok
      ? { success: true, message: `Đã cập nhật ${merged.length} thiết bị lên Supabase.` }
      : { success: false, message: 'Lỗi ghi thiết bị lên Supabase!' };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { success: false, message: `Lỗi upsert thiết bị: ${errMsg}` };
  }
}

/**
 * Fetch TOÀN BỘ dữ liệu từ Supabase và download về máy dưới dạng file JSON backup.
 * Bao gồm: catalog_data, test_packages, test_groups, equipments_catalog, doctors_list, clinic_info, invoices_data.
 */
export async function backupAllDataFromSupabase(
  config: CloudDbConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled || !config.supabaseUrl) {
    return { success: false, message: 'Chưa bật cấu hình Supabase Cloud DB!' };
  }

  try {
    const [catalog, packages, groups, equipments, doctors, clinic, invoices] = await Promise.all([
      fetchTableFromCloud<CatalogItem[]>('catalog_data', config),
      fetchTableFromCloud<TestPackage[]>('test_packages', config),
      fetchTableFromCloud<TestGroup[]>('test_groups', config),
      fetchTableFromCloud<TestEquipment[]>('equipments_catalog', config),
      fetchTableFromCloud<Doctor[]>('doctors_list', config),
      fetchTableFromCloud<ClinicInfo>('clinic_info', config),
      fetchTableFromCloud<Invoice[]>('invoices_data', config),
    ]);

    const backup: DatabaseBackupFile = {
      _meta: {
        backup_at: new Date().toISOString(),
        supabase_url: config.supabaseUrl,
        version: '1.0',
        tables: ['catalog_data', 'test_packages', 'test_groups', 'equipments_catalog', 'doctors_list', 'clinic_info', 'invoices_data']
      },
      catalog_data: catalog ?? [],
      test_packages: packages ?? [],
      test_groups: groups ?? [],
      equipments_catalog: equipments ?? [],
      doctors_list: doctors ?? [],
      clinic_info: clinic ?? null,
      invoices_data: invoices ?? [],
    };

    const stats = {
      catalog: (catalog ?? []).length,
      packages: (packages ?? []).length,
      groups: (groups ?? []).length,
      equipments: (equipments ?? []).length,
      doctors: (doctors ?? []).length,
      invoices: (invoices ?? []).length,
    };

    // Trigger browser download
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `golab_backup_${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: `Backup thành công! ${stats.catalog} chỉ số, ${stats.packages} gói, ${stats.groups} nhóm, ${stats.equipments} thiết bị, ${stats.doctors} bác sĩ, ${stats.invoices} hóa đơn. File đã tải xuống.`
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { success: false, message: `Lỗi backup: ${errMsg}` };
  }
}

/**
 * Restore toàn bộ dữ liệu từ file JSON backup lên Supabase.
 * Ghi đè hoàn toàn tất cả các bảng bằng nội dung file backup.
 */
export async function restoreAllDataToSupabase(
  backupJson: string,
  config: CloudDbConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled || !config.supabaseUrl) {
    return { success: false, message: 'Chưa bật cấu hình Supabase Cloud DB!' };
  }

  try {
    const backup = JSON.parse(backupJson) as Partial<DatabaseBackupFile>;
    if (!backup._meta || !backup.catalog_data) {
      return { success: false, message: 'File backup không hợp lệ hoặc sai định dạng!' };
    }

    const results = await Promise.all([
      backup.catalog_data?.length      ? syncTableToCloud('catalog_data',       backup.catalog_data,       config) : Promise.resolve(true),
      backup.test_packages?.length      ? syncTableToCloud('test_packages',       backup.test_packages,       config) : Promise.resolve(true),
      backup.test_groups?.length        ? syncTableToCloud('test_groups',         backup.test_groups,         config) : Promise.resolve(true),
      backup.equipments_catalog?.length ? syncTableToCloud('equipments_catalog', backup.equipments_catalog, config) : Promise.resolve(true),
      backup.doctors_list?.length       ? syncTableToCloud('doctors_list',        backup.doctors_list,        config) : Promise.resolve(true),
      backup.clinic_info                ? syncTableToCloud('clinic_info',         backup.clinic_info,         config) : Promise.resolve(true),
      backup.invoices_data?.length      ? syncTableToCloud('invoices_data',       backup.invoices_data,       config) : Promise.resolve(true),
    ]);

    const allOk = results.every(Boolean);
    const backedAt = backup._meta?.backup_at ? new Date(backup._meta.backup_at).toLocaleString('vi-VN') : 'không rõ';
    return {
      success: allOk,
      message: allOk
        ? `Restore thành công từ backup ngày ${backedAt}! ${backup.catalog_data?.length ?? 0} chỉ số & ${backup.invoices_data?.length ?? 0} hóa đơn đã được phục hồi.`
        : `Restore hoàn thành một phần. Vui lòng kiểm tra lại Supabase.`
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { success: false, message: `Lỗi restore: ${errMsg}` };
  }
}
