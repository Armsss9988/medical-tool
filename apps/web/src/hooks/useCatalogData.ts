import { useState, useEffect } from 'react';
import { 
  CatalogItem, 
  TestPackage, 
  TestGroup, 
  TestEquipment, 
  Doctor, 
  ClinicInfo, 
  CloudDbConfig, 
  ZaloZnsConfig,
  STORAGE_KEYS
} from '@domain';
import { 
  DEFAULT_CATALOG, 
  DEFAULT_TEST_PACKAGES, 
  DEFAULT_TEST_GROUPS, 
  DEFAULT_EQUIPMENTS, 
  DEFAULT_DOCTORS 
} from '@data/defaultCatalog';
import { autoResolveItemLinks } from '@data/referenceRangesCatalog';
import { loadState, saveState } from '@infra/storage';
import { 
  fetchCatalogFromSupabase, 
  fetchPackagesFromSupabase, 
  fetchGroupsFromSupabase, 
  fetchEquipmentsFromSupabase, 
  fetchDoctorsFromSupabase,
  fetchClinicInfoFromSupabase,
  syncCatalogToSupabase,
  syncPackagesToSupabase,
  syncGroupsToSupabase,
  syncEquipmentsToSupabase,
  syncDoctorsToSupabase,
  syncClinicInfoToSupabase,
  syncZaloConfigToSupabase
} from '@infra/cloudDbService';

const DEFAULT_CLINIC_INFO: ClinicInfo = {
  name: 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
  address: 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị',
  phone: '032.855.3773',
  website: 'golab.com.vn',
  defaultDoctor: 'Nguyễn Thị Thành Trung',
  bankId: 'VBA',
  bankName: 'Agribank',
  bankAccountNo: '8888876781225',
  bankAccountName: 'LE PHAN ANH',
  bankBranch: 'Agribank - Chi nhánh Lý Thái Tổ - Quảng Bình',
  cashierName: 'Lê Phan Anh',
  accountantName: 'Trần Thị Thanh Hương'
};

const DEFAULT_CLOUD_DB_CONFIG: CloudDbConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  enabled: true
};

const DEFAULT_ZALO_CONFIG: ZaloZnsConfig = {
  enabled: false,
  appId: '',
  secretKey: '',
  oaId: '',
  templateId: '',
  accessToken: '',
  autoSendOnExport: false
};

export function useCatalogData() {
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    const loaded = loadState(STORAGE_KEYS.CATALOG, DEFAULT_CATALOG);
    return Array.isArray(loaded) ? loaded.map(autoResolveItemLinks) : DEFAULT_CATALOG.map(autoResolveItemLinks);
  });

  const [testPackages, setTestPackages] = useState<TestPackage[]>(() => {
    const loaded = loadState(STORAGE_KEYS.TEST_PACKAGES, DEFAULT_TEST_PACKAGES);
    // Auto-merge missing default packages (e.g. di_nguyen_44) from DEFAULT_TEST_PACKAGES
    if (Array.isArray(loaded)) {
      const existingIds = new Set(loaded.map((p: TestPackage) => p.id));
      const missing = DEFAULT_TEST_PACKAGES.filter((p) => !existingIds.has(p.id));
      if (missing.length > 0) {
        return [...loaded, ...missing];
      }
      return loaded;
    }
    return DEFAULT_TEST_PACKAGES;
  });

  const [testGroups, setTestGroups] = useState<TestGroup[]>(() => {
    return loadState(STORAGE_KEYS.TEST_GROUPS, DEFAULT_TEST_GROUPS);
  });

  const [equipments, setEquipments] = useState<TestEquipment[]>(() => {
    return loadState(STORAGE_KEYS.EQUIPMENTS, DEFAULT_EQUIPMENTS);
  });

  const [doctorsList, setDoctorsList] = useState<Doctor[]>(() => {
    return loadState(STORAGE_KEYS.DOCTORS, DEFAULT_DOCTORS);
  });

  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(() => {
    return loadState(STORAGE_KEYS.CLINIC_INFO, DEFAULT_CLINIC_INFO);
  });

  const [cloudDbConfig, setCloudDbConfig] = useState<CloudDbConfig>(() => {
    return loadState(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
  });

  const [zaloConfig, setZaloConfig] = useState<ZaloZnsConfig>(() => {
    return loadState(STORAGE_KEYS.ZALO_CONFIG, DEFAULT_ZALO_CONFIG);
  });

  // Tự động lưu Local Storage và đồng bộ Supabase khi state thay đổi
  useEffect(() => {
    saveState(STORAGE_KEYS.CATALOG, catalog);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync && cloudDbConfig?.supabaseUrl) {
      syncCatalogToSupabase(catalog, cloudDbConfig).catch(() => {});
    }
  }, [catalog, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.TEST_PACKAGES, testPackages);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync && cloudDbConfig?.supabaseUrl) {
      syncPackagesToSupabase(testPackages, cloudDbConfig).catch(() => {});
    }
  }, [testPackages, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.TEST_GROUPS, testGroups);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync && cloudDbConfig?.supabaseUrl) {
      syncGroupsToSupabase(testGroups, cloudDbConfig).catch(() => {});
    }
  }, [testGroups, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.EQUIPMENTS, equipments);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync && cloudDbConfig?.supabaseUrl) {
      syncEquipmentsToSupabase(equipments, cloudDbConfig).catch(() => {});
    }
  }, [equipments, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.DOCTORS, doctorsList);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync && cloudDbConfig?.supabaseUrl) {
      syncDoctorsToSupabase(doctorsList, cloudDbConfig).catch(() => {});
    }
  }, [doctorsList, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.CLINIC_INFO, clinicInfo);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync && cloudDbConfig?.supabaseUrl) {
      syncClinicInfoToSupabase(clinicInfo, cloudDbConfig).catch(() => {});
    }
  }, [clinicInfo, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.CLOUD_DB, cloudDbConfig);
  }, [cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.ZALO_CONFIG, zaloConfig);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync && cloudDbConfig?.supabaseUrl) {
      syncZaloConfigToSupabase(zaloConfig, cloudDbConfig).catch(() => {});
    }
  }, [zaloConfig, cloudDbConfig]);

  // Tự động đồng bộ từ Supabase nếu bật cấu hình
  useEffect(() => {
    if (!cloudDbConfig.enabled || !cloudDbConfig.supabaseUrl || !cloudDbConfig.supabaseAnonKey) {
      return;
    }

    const syncCloudData = async () => {
      try {
        const [cloudCatalog, cloudPackages, cloudGroups, cloudEquip, cloudDocs, cloudClinic] = await Promise.all([
          fetchCatalogFromSupabase(cloudDbConfig),
          fetchPackagesFromSupabase(cloudDbConfig),
          fetchGroupsFromSupabase(cloudDbConfig),
          fetchEquipmentsFromSupabase(cloudDbConfig),
          fetchDoctorsFromSupabase(cloudDbConfig),
          fetchClinicInfoFromSupabase(cloudDbConfig)
        ]);

        if (cloudCatalog && cloudCatalog.length > 0) setCatalog(cloudCatalog.map(autoResolveItemLinks));
        if (cloudPackages && cloudPackages.length > 0) {
          const existingIds = new Set(cloudPackages.map((p: TestPackage) => p.id));
          const missing = DEFAULT_TEST_PACKAGES.filter((p) => !existingIds.has(p.id));
          setTestPackages(missing.length > 0 ? [...cloudPackages, ...missing] : cloudPackages);
        }
        if (cloudGroups && cloudGroups.length > 0) setTestGroups(cloudGroups);
        if (cloudEquip && cloudEquip.length > 0) setEquipments(cloudEquip);
        if (cloudDocs && cloudDocs.length > 0) setDoctorsList(cloudDocs);
        if (cloudClinic && cloudClinic.name) setClinicInfo(cloudClinic);
      } catch (err) {
        console.warn('Không thể đồng bộ tự động từ Supabase:', err);
      }
    };

    syncCloudData();
  }, [cloudDbConfig]);

  return {
    catalog,
    setCatalog,
    testPackages,
    setTestPackages,
    testGroups,
    setTestGroups,
    equipments,
    setEquipments,
    doctorsList,
    setDoctorsList,
    clinicInfo,
    setClinicInfo,
    cloudDbConfig,
    setCloudDbConfig,
    zaloConfig,
    setZaloConfig
  };
}
