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
  ReferenceRangeItem,
  STORAGE_KEYS
} from '@domain';
import { autoResolveItemLinks } from '@data';
import { loadState, saveState } from '@infra/storage';
import { 
  fetchCatalogFromSupabase, 
  fetchPackagesFromSupabase, 
  fetchGroupsFromSupabase, 
  fetchEquipmentsFromSupabase, 
  fetchDoctorsFromSupabase,
  fetchClinicInfoFromSupabase,
  fetchReferenceRangesFromSupabase,
  syncCatalogToSupabase,
  syncPackagesToSupabase,
  syncGroupsToSupabase,
  syncEquipmentsToSupabase,
  syncDoctorsToSupabase,
  syncClinicInfoToSupabase,
  syncReferenceRangesToSupabase,
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
    const loaded = loadState<CatalogItem[]>(STORAGE_KEYS.CATALOG, []);
    return Array.isArray(loaded) ? loaded.map(autoResolveItemLinks) : [];
  });

  const [testPackages, setTestPackages] = useState<TestPackage[]>(() => {
    const loaded = loadState<TestPackage[]>(STORAGE_KEYS.TEST_PACKAGES, []);
    return Array.isArray(loaded) ? loaded : [];
  });

  const [testGroups, setTestGroups] = useState<TestGroup[]>(() => {
    return loadState<TestGroup[]>(STORAGE_KEYS.TEST_GROUPS, []);
  });

  const [equipments, setEquipments] = useState<TestEquipment[]>(() => {
    return loadState<TestEquipment[]>(STORAGE_KEYS.EQUIPMENTS, []);
  });

  const [doctorsList, setDoctorsList] = useState<Doctor[]>(() => {
    return loadState<Doctor[]>(STORAGE_KEYS.DOCTORS, []);
  });

  const [referenceRanges, setReferenceRanges] = useState<ReferenceRangeItem[]>(() => {
    return loadState<ReferenceRangeItem[]>(STORAGE_KEYS.REFERENCE_RANGES, []);
  });

  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(() => {
    return loadState<ClinicInfo>(STORAGE_KEYS.CLINIC_INFO, DEFAULT_CLINIC_INFO);
  });

  const [cloudDbConfig, setCloudDbConfig] = useState<CloudDbConfig>(() => {
    return loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
  });

  const [zaloConfig, setZaloConfig] = useState<ZaloZnsConfig>(() => {
    return loadState<ZaloZnsConfig>(STORAGE_KEYS.ZALO_CONFIG, DEFAULT_ZALO_CONFIG);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Tự động lưu Local Storage và đồng bộ Cloud khi state thay đổi
  useEffect(() => {
    saveState(STORAGE_KEYS.CATALOG, catalog);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncCatalogToSupabase(catalog, cloudDbConfig).catch(() => {});
    }
  }, [catalog, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.TEST_PACKAGES, testPackages);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncPackagesToSupabase(testPackages, cloudDbConfig).catch(() => {});
    }
  }, [testPackages, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.TEST_GROUPS, testGroups);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncGroupsToSupabase(testGroups, cloudDbConfig).catch(() => {});
    }
  }, [testGroups, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.EQUIPMENTS, equipments);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncEquipmentsToSupabase(equipments, cloudDbConfig).catch(() => {});
    }
  }, [equipments, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.DOCTORS, doctorsList);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncDoctorsToSupabase(doctorsList, cloudDbConfig).catch(() => {});
    }
  }, [doctorsList, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.REFERENCE_RANGES, referenceRanges);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncReferenceRangesToSupabase(referenceRanges, cloudDbConfig).catch(() => {});
    }
  }, [referenceRanges, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.CLINIC_INFO, clinicInfo);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncClinicInfoToSupabase(clinicInfo, cloudDbConfig).catch(() => {});
    }
  }, [clinicInfo, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.CLOUD_DB, cloudDbConfig);
  }, [cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.ZALO_CONFIG, zaloConfig);
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncZaloConfigToSupabase(zaloConfig, cloudDbConfig).catch(() => {});
    }
  }, [zaloConfig, cloudDbConfig]);

  // Tự động tải dữ liệu từ Cloud Database khi khởi động
  useEffect(() => {
    if (cloudDbConfig?.enabled === false) {
      setIsLoading(false);
      return;
    }

    const syncCloudData = async () => {
      try {
        setIsLoading(true);
        const [cloudCatalog, cloudPackages, cloudGroups, cloudEquip, cloudDocs, cloudClinic, cloudRefRanges] = await Promise.all([
          fetchCatalogFromSupabase(cloudDbConfig),
          fetchPackagesFromSupabase(cloudDbConfig),
          fetchGroupsFromSupabase(cloudDbConfig),
          fetchEquipmentsFromSupabase(cloudDbConfig),
          fetchDoctorsFromSupabase(cloudDbConfig),
          fetchClinicInfoFromSupabase(cloudDbConfig),
          fetchReferenceRangesFromSupabase(cloudDbConfig)
        ]);

        if (cloudCatalog && cloudCatalog.length > 0) {
          setCatalog(cloudCatalog.map(autoResolveItemLinks));
        }
        if (cloudPackages && cloudPackages.length > 0) {
          setTestPackages(cloudPackages);
        }
        if (cloudGroups && cloudGroups.length > 0) {
          setTestGroups(cloudGroups);
        }
        if (cloudEquip && cloudEquip.length > 0) {
          setEquipments(cloudEquip);
        }
        if (cloudDocs && cloudDocs.length > 0) {
          setDoctorsList(cloudDocs);
        }
        if (cloudClinic && cloudClinic.name) {
          setClinicInfo(cloudClinic);
        }
        if (cloudRefRanges && cloudRefRanges.length > 0) {
          setReferenceRanges(cloudRefRanges);
        }
      } catch (err) {
        console.warn('[CloudDB] Không thể tải dữ liệu từ Cloud:', err);
      } finally {
        setIsLoading(false);
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
    referenceRanges,
    setReferenceRanges,
    clinicInfo,
    setClinicInfo,
    cloudDbConfig,
    setCloudDbConfig,
    zaloConfig,
    setZaloConfig,
    isLoading
  };
}
