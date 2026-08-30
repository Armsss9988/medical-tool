import {
  CloudDbConfig,
  CatalogItem,
  CatalogItemEquipmentLink,
  TestPackage,
  TestGroup,
  TestEquipment,
  Doctor,
  ClinicInfo,
  Invoice,
  MedicalReport,
  ZaloZnsConfig,
  ReferenceRangeItem,
  AllergenGradingScale
} from '@domain/types';
import { getTable, putTable, ApiAuthError } from './apiClient';

const LEGACY_KEY_TO_API: Record<string, string> = {
  'catalog_data': 'catalog',
  'test_packages': 'test-packages',
  'test_groups': 'test-groups',
  'equipments_catalog': 'equipments',
  'doctors_list': 'doctors',
  'clinic_info': 'clinic-info',
  'medical_reports': 'medical-reports',
  'invoices_data': 'invoices',
  'zalo_config': 'zalo-config',
  'recent_tests': 'recent_tests',
  'reference_ranges': 'reference-ranges',
  'catalog_item_equipments': 'catalog-item-equipments',
  'allergen_scales': 'allergen-scales'
};
const DOC_TABLES = new Set(['medical-reports', 'invoices']);
const SINGLE_OBJECT_TABLES = new Set(['clinic-info', 'zalo-config']);
function apiNameFor(key: string): string { return LEGACY_KEY_TO_API[key] ?? key; }

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
  reference_ranges?: ReferenceRangeItem[];
  medical_reports?: MedicalReport[];
  invoices_data: Invoice[];
  zalo_config?: ZaloZnsConfig | null;
}

export interface AllLocalDataPayload {
  catalog: CatalogItem[];
  testPackages: TestPackage[];
  testGroups: TestGroup[];
  equipments: TestEquipment[];
  doctorsList: Doctor[];
  clinicInfo: ClinicInfo | null;
  referenceRanges?: ReferenceRangeItem[];
  reports: MedicalReport[];
  invoices: Invoice[];
  zaloConfig?: ZaloZnsConfig | null;
}

export interface AllCloudDataResult {
  catalog: CatalogItem[] | null;
  testPackages: TestPackage[] | null;
  testGroups: TestGroup[] | null;
  equipments: TestEquipment[] | null;
  doctorsList: Doctor[] | null;
  clinicInfo: ClinicInfo | null;
  referenceRanges?: ReferenceRangeItem[] | null;
  reports: MedicalReport[] | null;
  invoices: Invoice[] | null;
  zaloConfig: ZaloZnsConfig | null;
}

export const DEFAULT_CLOUD_DB_CONFIG: CloudDbConfig = {
  enabled: true,
  supabaseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '',
  supabaseAnonKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '',
  autoSync: true
};

export async function testSupabaseConnection(config: CloudDbConfig): Promise<{ success: boolean; message: string }> {
  if (config.enabled === false) {
    return { success: false, message: 'Chưa bật cấu hình Cloud DB!' };
  }

  try {
    await getTable('catalog');
    return { success: true, message: 'Kết nối thành công tới GoLab API!' };
  } catch (e) {
    if (e instanceof ApiAuthError) {
      return { success: false, message: 'Sai mật khẩu API!' };
    }
    const errMsg = e instanceof Error ? e.message : 'lỗi';
    return { success: false, message: 'Không thể kết nối API: ' + errMsg };
  }
}

export async function syncTableToCloud<T>(
  key: string,
  data: T,
  config: CloudDbConfig
): Promise<boolean> {
  if (config && config.enabled === false) return false;

  const tableName = apiNameFor(key);

  let rows: unknown[];
  if (DOC_TABLES.has(tableName)) {
    // Send domain objects as-is; the Hono API repo wraps each into { id, data } (jsonb).
    rows = data as unknown[];
  } else if (Array.isArray(data)) {
    rows = data as unknown[];
  } else {
    rows = [data];
  }

  try {
    await putTable(tableName, rows);
    return true;
  } catch (err) {
    console.warn('[CloudDB] Không thể đồng bộ bảng ' + key + ':', err);
    return false;
  }
}

export async function fetchTableFromCloud<T>(
  key: string,
  config: CloudDbConfig
): Promise<T | null> {
  if (config.enabled === false) return null;

  const tableName = apiNameFor(key);

  try {
    const res = await getTable(tableName);
    if (DOC_TABLES.has(tableName)) {
      return res.rows.map((r) => (r as { data: T }).data) as T;
    }
    if (SINGLE_OBJECT_TABLES.has(tableName)) {
      return (res.rows[0] ?? null) as T;
    }
    return res.rows as T;
  } catch (err) {
    console.warn('[CloudDB] Không thể nạp bảng ' + key + ' từ Cloud:', err);
    return null;
  }
}

export async function seedAllDefaultDataToSupabase(config: CloudDbConfig): Promise<{ success: boolean; message: string }> {
  if (config && config.enabled === false) {
    return { success: false, message: 'Chưa bật cấu hình Supabase Cloud DB!' };
  }

  try {
    const conn = await testSupabaseConnection(config);
    if (!conn.success) {
      return { success: false, message: conn.message || 'Không thể kết nối Cloud DB!' };
    }
    return {
      success: true,
      message: 'Kết nối Cloud DB thành công! Để nạp dữ liệu gốc từ thư mục backup, vui lòng chạy lệnh `npm run db:seed` từ terminal.'
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { success: false, message: `Lỗi kết nối: ${errMsg}` };
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
  if (config.enabled === false) return null;
  const rows = await getTable('clinic-info').catch(() => null);
  return (rows?.rows?.[0] as ClinicInfo) ?? null;
}

export async function fetchInvoicesFromSupabase(config: CloudDbConfig): Promise<Invoice[] | null> {
  return fetchTableFromCloud<Invoice[]>('invoices_data', config);
}

export async function fetchReportsFromSupabase(config: CloudDbConfig): Promise<MedicalReport[] | null> {
  return fetchTableFromCloud<MedicalReport[]>('medical_reports', config);
}

export async function fetchZaloConfigFromSupabase(config: CloudDbConfig): Promise<ZaloZnsConfig | null> {
  if (config.enabled === false) return null;
  const rows = await getTable('zalo-config').catch(() => null);
  return (rows?.rows?.[0] as ZaloZnsConfig) ?? null;
}

export async function fetchRecentTestsFromSupabase(config: CloudDbConfig): Promise<string[] | null> {
  return fetchTableFromCloud<string[]>('recent_tests', config);
}

export async function syncReportsToSupabase(reports: MedicalReport[], config: CloudDbConfig): Promise<boolean> {
  return syncTableToCloud('medical_reports', reports, config);
}

export async function syncInvoicesToSupabase(invoices: Invoice[], config: CloudDbConfig): Promise<boolean> {
  return syncTableToCloud('invoices_data', invoices, config);
}

export async function syncCatalogToSupabase(catalog: CatalogItem[], config: CloudDbConfig): Promise<boolean> {
  return syncTableToCloud('catalog_data', catalog, config);
}

export async function syncPackagesToSupabase(packages: TestPackage[], config: CloudDbConfig): Promise<boolean> {
  return syncTableToCloud('test_packages', packages, config);
}

export async function syncGroupsToSupabase(groups: TestGroup[], config: CloudDbConfig): Promise<boolean> {
  return syncTableToCloud('test_groups', groups, config);
}

export async function syncEquipmentsToSupabase(equipments: TestEquipment[], config: CloudDbConfig): Promise<boolean> {
  return syncTableToCloud('equipments_catalog', equipments, config);
}

export async function syncDoctorsToSupabase(doctors: Doctor[], config: CloudDbConfig): Promise<boolean> {
  return syncTableToCloud('doctors_list', doctors, config);
}

export async function syncClinicInfoToSupabase(clinicInfo: ClinicInfo, config: CloudDbConfig): Promise<boolean> {
  return syncTableToCloud('clinic_info', clinicInfo, config);
}

export async function syncZaloConfigToSupabase(zaloConfig: ZaloZnsConfig, config: CloudDbConfig): Promise<boolean> {
  return syncTableToCloud('zalo_config', zaloConfig, config);
}

export async function fetchReferenceRangesFromSupabase(config: CloudDbConfig): Promise<ReferenceRangeItem[] | null> {
  return fetchTableFromCloud<ReferenceRangeItem[]>('reference_ranges', config);
}

export async function syncReferenceRangesToSupabase(ranges: ReferenceRangeItem[], config: CloudDbConfig): Promise<boolean> {
  return syncTableToCloud('reference_ranges', ranges, config);
}

export async function fetchCatalogItemEquipmentsFromSupabase(config: CloudDbConfig): Promise<CatalogItemEquipmentLink[] | null> {
  return fetchTableFromCloud<CatalogItemEquipmentLink[]>('catalog_item_equipments', config);
}

export async function syncCatalogItemEquipmentsToSupabase(links: CatalogItemEquipmentLink[], config: CloudDbConfig): Promise<boolean> {
  return syncTableToCloud('catalog_item_equipments', links, config);
}

export async function fetchScalesFromSupabase(config: CloudDbConfig): Promise<AllergenGradingScale[] | null> {
  return fetchTableFromCloud<AllergenGradingScale[]>('allergen_scales', config);
}

export async function syncScalesToSupabase(scales: AllergenGradingScale[], config: CloudDbConfig): Promise<boolean> {
  return syncTableToCloud('allergen_scales', scales, config);
}

/**
 * Upsert catalog items lên Supabase theo code — KHÔNG ghi đè dữ liệu cũ.
 * Logic: Fetch catalog hiện tại → merge newItems vào (add mới, update nếu trùng code) → ghi lại.
 */
export async function upsertCatalogItemsToSupabase(
  newItems: CatalogItem[],
  config: CloudDbConfig
): Promise<{ success: boolean; message: string; added: number; updated: number }> {
  if (config && config.enabled === false) {
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
  if (config && config.enabled === false) {
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
 * Đồng bộ toàn bộ dữ liệu Local lên Supabase Cloud Database (1-Click Full Migration).
 */
export async function syncAllLocalDataToSupabase(
  payload: AllLocalDataPayload,
  config: CloudDbConfig
): Promise<{ success: boolean; message: string; stats: Record<string, number> }> {
  if (config && config.enabled === false) {
    return {
      success: false,
      message: 'Chưa bật hoặc chưa cấu hình Supabase Cloud DB!',
      stats: {}
    };
  }

  try {
    const results = await Promise.all([
      payload.catalog ? syncTableToCloud('catalog_data', payload.catalog, config) : Promise.resolve(true),
      payload.testPackages ? syncTableToCloud('test_packages', payload.testPackages, config) : Promise.resolve(true),
      payload.testGroups ? syncTableToCloud('test_groups', payload.testGroups, config) : Promise.resolve(true),
      payload.equipments ? syncTableToCloud('equipments_catalog', payload.equipments, config) : Promise.resolve(true),
      payload.doctorsList ? syncTableToCloud('doctors_list', payload.doctorsList, config) : Promise.resolve(true),
      payload.clinicInfo ? syncTableToCloud('clinic_info', payload.clinicInfo, config) : Promise.resolve(true),
      payload.referenceRanges ? syncTableToCloud('reference_ranges', payload.referenceRanges, config) : Promise.resolve(true),
      payload.reports ? syncTableToCloud('medical_reports', payload.reports, config) : Promise.resolve(true),
      payload.invoices ? syncTableToCloud('invoices_data', payload.invoices, config) : Promise.resolve(true),
      payload.zaloConfig ? syncTableToCloud('zalo_config', payload.zaloConfig, config) : Promise.resolve(true),
    ]);

    const stats = {
      catalog: payload.catalog?.length ?? 0,
      testPackages: payload.testPackages?.length ?? 0,
      testGroups: payload.testGroups?.length ?? 0,
      equipments: payload.equipments?.length ?? 0,
      doctorsList: payload.doctorsList?.length ?? 0,
      referenceRanges: payload.referenceRanges?.length ?? 0,
      reports: payload.reports?.length ?? 0,
      invoices: payload.invoices?.length ?? 0,
    };

    const allOk = results.every(Boolean);
    return {
      success: allOk,
      message: allOk
        ? `Đã đồng bộ thành công toàn bộ 100% dữ liệu Local lên Cloud DB: ${stats.catalog} chỉ số, ${stats.testPackages} gói, ${stats.referenceRanges} bảng tham chiếu, ${stats.reports} phiếu xét nghiệm, ${stats.invoices} hóa đơn, ${stats.doctorsList} bác sĩ.`
        : 'Một số bảng chưa đồng bộ thành công. Vui lòng kiểm tra lại kết nối Supabase.',
      stats
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { success: false, message: `Lỗi đồng bộ dữ liệu: ${errMsg}`, stats: {} };
  }
}

/**
 * Kéo toàn bộ dữ liệu từ Cloud DB về Local.
 */
export async function fetchAllCloudDataToLocal(
  config: CloudDbConfig
): Promise<AllCloudDataResult | null> {
  if (!config.enabled || !config.supabaseUrl) return null;

  try {
    const [
      catalog,
      testPackages,
      testGroups,
      equipments,
      doctorsList,
      clinicInfo,
      referenceRanges,
      reports,
      invoices,
      zaloConfig
    ] = await Promise.all([
      fetchTableFromCloud<CatalogItem[]>('catalog_data', config),
      fetchTableFromCloud<TestPackage[]>('test_packages', config),
      fetchTableFromCloud<TestGroup[]>('test_groups', config),
      fetchTableFromCloud<TestEquipment[]>('equipments_catalog', config),
      fetchTableFromCloud<Doctor[]>('doctors_list', config),
      fetchTableFromCloud<ClinicInfo>('clinic_info', config),
      fetchTableFromCloud<ReferenceRangeItem[]>('reference_ranges', config),
      fetchTableFromCloud<MedicalReport[]>('medical_reports', config),
      fetchTableFromCloud<Invoice[]>('invoices_data', config),
      fetchTableFromCloud<ZaloZnsConfig>('zalo_config', config),
    ]);

    return {
      catalog,
      testPackages,
      testGroups,
      equipments,
      doctorsList,
      clinicInfo,
      referenceRanges,
      reports,
      invoices,
      zaloConfig
    };
  } catch (err) {
    console.error('[CloudDB] Lỗi tải toàn bộ dữ liệu từ Cloud:', err);
    return null;
  }
}

/**
 * Fetch TOÀN BỘ dữ liệu từ Supabase và download về máy dưới dạng file JSON backup.
 * Bao gồm: catalog_data, test_packages, test_groups, equipments_catalog, doctors_list, clinic_info, reference_ranges, medical_reports, invoices_data, zalo_config.
 */
export async function backupAllDataFromSupabase(
  config: CloudDbConfig
): Promise<{ success: boolean; message: string }> {
  if (config && config.enabled === false) {
    return { success: false, message: 'Chưa bật cấu hình Supabase Cloud DB!' };
  }

  try {
    const [catalog, packages, groups, equipments, doctors, clinic, referenceRanges, reports, invoices, zaloConfig] = await Promise.all([
      fetchTableFromCloud<CatalogItem[]>('catalog_data', config),
      fetchTableFromCloud<TestPackage[]>('test_packages', config),
      fetchTableFromCloud<TestGroup[]>('test_groups', config),
      fetchTableFromCloud<TestEquipment[]>('equipments_catalog', config),
      fetchTableFromCloud<Doctor[]>('doctors_list', config),
      fetchTableFromCloud<ClinicInfo>('clinic_info', config),
      fetchTableFromCloud<ReferenceRangeItem[]>('reference_ranges', config),
      fetchTableFromCloud<MedicalReport[]>('medical_reports', config),
      fetchTableFromCloud<Invoice[]>('invoices_data', config),
      fetchTableFromCloud<ZaloZnsConfig>('zalo_config', config),
    ]);

    const backup: DatabaseBackupFile = {
      _meta: {
        backup_at: new Date().toISOString(),
        supabase_url: config.supabaseUrl,
        version: '2.0',
        tables: ['catalog_data', 'test_packages', 'test_groups', 'equipments_catalog', 'doctors_list', 'clinic_info', 'reference_ranges', 'medical_reports', 'invoices_data', 'zalo_config']
      },
      catalog_data: catalog ?? [],
      test_packages: packages ?? [],
      test_groups: groups ?? [],
      equipments_catalog: equipments ?? [],
      doctors_list: doctors ?? [],
      clinic_info: clinic ?? null,
      reference_ranges: referenceRanges ?? [],
      medical_reports: reports ?? [],
      invoices_data: invoices ?? [],
      zalo_config: zaloConfig ?? null,
    };

    const stats = {
      catalog: (catalog ?? []).length,
      packages: (packages ?? []).length,
      groups: (groups ?? []).length,
      equipments: (equipments ?? []).length,
      doctors: (doctors ?? []).length,
      referenceRanges: (referenceRanges ?? []).length,
      reports: (reports ?? []).length,
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
      message: `Backup thành công! ${stats.catalog} chỉ số, ${stats.packages} gói, ${stats.groups} nhóm, ${stats.equipments} thiết bị, ${stats.doctors} bác sĩ, ${stats.referenceRanges} bảng tham chiếu, ${stats.reports} phiếu XN, ${stats.invoices} hóa đơn. File đã tải xuống.`
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
  if (config && config.enabled === false) {
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
      backup.reference_ranges?.length   ? syncTableToCloud('reference_ranges',    backup.reference_ranges,    config) : Promise.resolve(true),
      backup.medical_reports?.length    ? syncTableToCloud('medical_reports',     backup.medical_reports,     config) : Promise.resolve(true),
      backup.invoices_data?.length      ? syncTableToCloud('invoices_data',       backup.invoices_data,       config) : Promise.resolve(true),
      backup.zalo_config                ? syncTableToCloud('zalo_config',         backup.zalo_config,         config) : Promise.resolve(true),
    ]);

    const allOk = results.every(Boolean);
    const backedAt = backup._meta?.backup_at ? new Date(backup._meta.backup_at).toLocaleString('vi-VN') : 'không rõ';
    return {
      success: allOk,
      message: allOk
        ? `Restore thành công từ backup ngày ${backedAt}! ${backup.catalog_data?.length ?? 0} chỉ số, ${backup.medical_reports?.length ?? 0} phiếu XN & ${backup.invoices_data?.length ?? 0} hóa đơn đã được phục hồi.`
        : `Restore hoàn thành một phần. Vui lòng kiểm tra lại Supabase.`
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { success: false, message: `Lỗi restore: ${errMsg}` };
  }
}
