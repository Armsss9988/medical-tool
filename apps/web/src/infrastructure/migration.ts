import { loadData } from './storage';
import {
  syncAllLocalDataToSupabase,
  type AllLocalDataPayload,
  DEFAULT_CLOUD_DB_CONFIG
} from './cloudDbService';
import { STORAGE_KEYS } from '@domain/constants/storageKeys';
import type {
  CatalogItem,
  TestPackage,
  TestGroup,
  TestEquipment,
  Doctor,
  ClinicInfo,
  Invoice,
  MedicalReport,
  ZaloZnsConfig,
  CloudDbConfig
} from '@domain/types';

export async function migrateLocalToApi(
  config: CloudDbConfig = DEFAULT_CLOUD_DB_CONFIG
): Promise<{ success: boolean; message: string; stats: Record<string, number> }> {
  const catalog = await loadData<CatalogItem[]>(STORAGE_KEYS.CATALOG, []);
  const testPackages = await loadData<TestPackage[]>(STORAGE_KEYS.TEST_PACKAGES, []);
  const testGroups = await loadData<TestGroup[]>(STORAGE_KEYS.TEST_GROUPS, []);
  const equipments = await loadData<TestEquipment[]>(STORAGE_KEYS.EQUIPMENTS, []);
  const doctorsList = await loadData<Doctor[]>(STORAGE_KEYS.DOCTORS, []);
  const clinicInfo = await loadData<ClinicInfo | null>(STORAGE_KEYS.CLINIC_INFO, null);
  const reports = await loadData<MedicalReport[]>(STORAGE_KEYS.REPORTS, []);
  const invoices = await loadData<Invoice[]>(STORAGE_KEYS.INVOICES, []);
  const zaloConfig = await loadData<ZaloZnsConfig | null>(STORAGE_KEYS.ZALO_CONFIG, null);

  const payload: AllLocalDataPayload = {
    catalog,
    testPackages,
    testGroups,
    equipments,
    doctorsList,
    clinicInfo,
    reports,
    invoices,
    zaloConfig
  };

  return syncAllLocalDataToSupabase(payload, config);
}
