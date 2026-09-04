import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CatalogItem, 
  CatalogItemEquipmentLink,
  TestPackage, 
  TestGroup, 
  TestEquipment, 
  Doctor, 
  ClinicInfo, 
  CloudDbConfig, 
  ZaloZnsConfig,
  ReferenceRangeItem,
  AllergenGradingScale,
  STORAGE_KEYS,
  normalizeTestPackage,
  DEFAULT_CLINIC_INFO,
  getSafeClinicInfo,
  isCorruptedClinicInfo
} from '@domain';
import { autoResolveItemLinks, DEFAULT_DOCTORS } from '@data';
import { loadState, saveState } from '@infra/storage';
import { 
  fetchCatalogFromSupabase, 
  fetchPackagesFromSupabase, 
  fetchGroupsFromSupabase, 
  fetchEquipmentsFromSupabase, 
  fetchDoctorsFromSupabase,
  fetchClinicInfoFromSupabase,
  fetchReferenceRangesFromSupabase,
  fetchCatalogItemEquipmentsFromSupabase,
  fetchScalesFromSupabase,
  syncCatalogToSupabase,
  syncPackagesToSupabase,
  syncGroupsToSupabase,
  syncEquipmentsToSupabase,
  syncDoctorsToSupabase,
  syncClinicInfoToSupabase,
  syncReferenceRangesToSupabase,
  syncCatalogItemEquipmentsToSupabase,
  syncScalesToSupabase,
  syncZaloConfigToSupabase
} from '@infra/cloudDbService';


const DEFAULT_CLOUD_DB_CONFIG: CloudDbConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  enabled: true,
  autoSync: true
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
    return Array.isArray(loaded) ? loaded.map(normalizeTestPackage) : [];
  });

  const [testGroups, setTestGroups] = useState<TestGroup[]>(() => {
    return loadState<TestGroup[]>(STORAGE_KEYS.TEST_GROUPS, []);
  });

  const [equipments, setEquipments] = useState<TestEquipment[]>(() => {
    return loadState<TestEquipment[]>(STORAGE_KEYS.EQUIPMENTS, []);
  });

  const [doctorsList, setDoctorsList] = useState<Doctor[]>(() => {
    const loaded = loadState<Doctor[]>(STORAGE_KEYS.DOCTORS, []);
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : DEFAULT_DOCTORS;
  });

  const [referenceRanges, setReferenceRanges] = useState<ReferenceRangeItem[]>(() => {
    return loadState<ReferenceRangeItem[]>(STORAGE_KEYS.REFERENCE_RANGES, []);
  });

  const [catalogItemEquipments, setCatalogItemEquipments] = useState<CatalogItemEquipmentLink[]>(() => {
    return loadState<CatalogItemEquipmentLink[]>(STORAGE_KEYS.CATALOG_ITEM_EQUIPMENTS, []);
  });

  const [allergenScales, setAllergenScales] = useState<AllergenGradingScale[]>(() => {
    const loaded = loadState<AllergenGradingScale[]>(STORAGE_KEYS.ALLERGEN_SCALES, []);
    return Array.isArray(loaded) ? loaded : [];
  });

  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(() => {
    return getSafeClinicInfo(loadState<ClinicInfo>(STORAGE_KEYS.CLINIC_INFO, DEFAULT_CLINIC_INFO));
  });

  const [cloudDbConfig, setCloudDbConfig] = useState<CloudDbConfig>(() => {
    const loaded = loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
    return {
      ...DEFAULT_CLOUD_DB_CONFIG,
      ...loaded,
      enabled: loaded?.enabled ?? true,
      autoSync: loaded?.autoSync ?? true
    };
  });

  const [zaloConfig, setZaloConfig] = useState<ZaloZnsConfig>(() => {
    return loadState<ZaloZnsConfig>(STORAGE_KEYS.ZALO_CONFIG, DEFAULT_ZALO_CONFIG);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isManualSavingRef = useRef<boolean>(false);
  const isInitialSyncDoneRef = useRef<boolean>(false);

  // Tự động lưu Local Storage và đồng bộ Cloud khi state thay đổi (CHỈ sau khi đã nạp xong từ Cloud)
  useEffect(() => {
    saveState(STORAGE_KEYS.CATALOG, catalog);
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncCatalogToSupabase(catalog, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ danh mục:', err);
      });
    }
  }, [catalog, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.TEST_PACKAGES, testPackages);
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncPackagesToSupabase(testPackages, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ gói:', err);
      });
    }
  }, [testPackages, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.TEST_GROUPS, testGroups);
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncGroupsToSupabase(testGroups, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ nhóm:', err);
      });
    }
  }, [testGroups, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.EQUIPMENTS, equipments);
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncEquipmentsToSupabase(equipments, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ thiết bị:', err);
      });
    }
  }, [equipments, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.DOCTORS, doctorsList);
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncDoctorsToSupabase(doctorsList, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ bác sĩ:', err);
      });
    }
  }, [doctorsList, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.REFERENCE_RANGES, referenceRanges);
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncReferenceRangesToSupabase(referenceRanges, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ tham chiếu:', err);
      });
    }
  }, [referenceRanges, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.CATALOG_ITEM_EQUIPMENTS, catalogItemEquipments);
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncCatalogItemEquipmentsToSupabase(catalogItemEquipments, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ liên kết máy:', err);
      });
    }
  }, [catalogItemEquipments, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.ALLERGEN_SCALES, allergenScales);
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncScalesToSupabase(allergenScales, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ thang dị ứng:', err);
      });
    }
  }, [allergenScales, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.CLINIC_INFO, clinicInfo);
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncClinicInfoToSupabase(clinicInfo, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ phòng khám:', err);
      });
    }
  }, [clinicInfo, cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.CLOUD_DB, cloudDbConfig);
  }, [cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.ZALO_CONFIG, zaloConfig);
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncZaloConfigToSupabase(zaloConfig, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ Zalo config:', err);
      });
    }
  }, [zaloConfig, cloudDbConfig]);

  // Lưu trực tiếp toàn bộ dữ liệu danh mục xuống Cloud DB có thể await
  const saveAllCatalogData = useCallback(async (data: {
    catalog?: CatalogItem[];
    testPackages?: TestPackage[];
    testGroups?: TestGroup[];
    equipments?: TestEquipment[];
    doctorsList?: Doctor[];
    catalogItemEquipments?: CatalogItemEquipmentLink[];
    allergenScales?: AllergenGradingScale[];
    referenceRanges?: ReferenceRangeItem[];
  }) => {
    isManualSavingRef.current = true;
    try {
      if (data.catalog) {
        setCatalog(data.catalog);
        saveState(STORAGE_KEYS.CATALOG, data.catalog);
      }
      if (data.testPackages) {
        setTestPackages(data.testPackages);
        saveState(STORAGE_KEYS.TEST_PACKAGES, data.testPackages);
      }
      if (data.testGroups) {
        setTestGroups(data.testGroups);
        saveState(STORAGE_KEYS.TEST_GROUPS, data.testGroups);
      }
      if (data.equipments) {
        setEquipments(data.equipments);
        saveState(STORAGE_KEYS.EQUIPMENTS, data.equipments);
      }
      if (data.doctorsList) {
        setDoctorsList(data.doctorsList);
        saveState(STORAGE_KEYS.DOCTORS, data.doctorsList);
      }
      if (data.catalogItemEquipments) {
        setCatalogItemEquipments(data.catalogItemEquipments);
        saveState(STORAGE_KEYS.CATALOG_ITEM_EQUIPMENTS, data.catalogItemEquipments);
      }
      if (data.allergenScales) {
        setAllergenScales(data.allergenScales);
        saveState(STORAGE_KEYS.ALLERGEN_SCALES, data.allergenScales);
      }
      if (data.referenceRanges) {
        setReferenceRanges(data.referenceRanges);
        saveState(STORAGE_KEYS.REFERENCE_RANGES, data.referenceRanges);
      }

      if (cloudDbConfig?.enabled) {
        // Thực thi tuần tự các bảng cần đồng bộ để tránh tràn transaction pooler / khóa hàng Postgres
        const tasks: (() => Promise<unknown>)[] = [];
        if (data.testGroups) tasks.push(() => syncGroupsToSupabase(data.testGroups!, cloudDbConfig));
        if (data.equipments) tasks.push(() => syncEquipmentsToSupabase(data.equipments!, cloudDbConfig));
        if (data.catalog) tasks.push(() => syncCatalogToSupabase(data.catalog!, cloudDbConfig));
        if (data.testPackages) tasks.push(() => syncPackagesToSupabase(data.testPackages!, cloudDbConfig));
        if (data.doctorsList) tasks.push(() => syncDoctorsToSupabase(data.doctorsList!, cloudDbConfig));
        if (data.catalogItemEquipments) tasks.push(() => syncCatalogItemEquipmentsToSupabase(data.catalogItemEquipments!, cloudDbConfig));
        if (data.allergenScales) tasks.push(() => syncScalesToSupabase(data.allergenScales!, cloudDbConfig));
        if (data.referenceRanges) tasks.push(() => syncReferenceRangesToSupabase(data.referenceRanges!, cloudDbConfig));

        for (const task of tasks) {
          await task().catch((err) => {
            console.warn('[CloudDB] Lỗi đồng bộ thành phần danh mục:', err);
          });
        }
      }
    } finally {
      setTimeout(() => {
        isManualSavingRef.current = false;
      }, 500);
    }
  }, [cloudDbConfig]);

  // Tự động tải dữ liệu từ Cloud Database khi khởi động
  const syncCloudData = useCallback(async () => {
    if (cloudDbConfig?.enabled === false) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [
        cloudCatalog, 
        cloudPackages, 
        cloudGroups, 
        cloudEquip, 
        cloudDocs, 
        cloudClinic, 
        cloudRefRanges,
        cloudItemEquipLinks,
        cloudScales
      ] = await Promise.all([
        fetchCatalogFromSupabase(cloudDbConfig),
        fetchPackagesFromSupabase(cloudDbConfig),
        fetchGroupsFromSupabase(cloudDbConfig),
        fetchEquipmentsFromSupabase(cloudDbConfig),
        fetchDoctorsFromSupabase(cloudDbConfig),
        fetchClinicInfoFromSupabase(cloudDbConfig),
        fetchReferenceRangesFromSupabase(cloudDbConfig),
        fetchCatalogItemEquipmentsFromSupabase(cloudDbConfig),
        fetchScalesFromSupabase(cloudDbConfig)
      ]);

      if (cloudCatalog && cloudCatalog.length > 0) {
        const resolved = cloudCatalog.map(autoResolveItemLinks);
        setCatalog(resolved);
        saveState(STORAGE_KEYS.CATALOG, resolved);
      }
      if (cloudPackages && cloudPackages.length > 0) {
        const normalized = cloudPackages.map(normalizeTestPackage);
        setTestPackages(normalized);
        saveState(STORAGE_KEYS.TEST_PACKAGES, normalized);
      }
      if (cloudGroups && cloudGroups.length > 0) {
        setTestGroups(cloudGroups);
        saveState(STORAGE_KEYS.TEST_GROUPS, cloudGroups);
      }
      if (cloudEquip && cloudEquip.length > 0) {
        setEquipments(cloudEquip);
        saveState(STORAGE_KEYS.EQUIPMENTS, cloudEquip);
      }
      if (cloudDocs && cloudDocs.length > 0) {
        setDoctorsList(cloudDocs);
        saveState(STORAGE_KEYS.DOCTORS, cloudDocs);
      } else if (!cloudDocs || cloudDocs.length === 0) {
        const defaultDocs = DEFAULT_DOCTORS;
        setDoctorsList(defaultDocs);
        saveState(STORAGE_KEYS.DOCTORS, defaultDocs);
        if (cloudDbConfig?.enabled) {
          syncDoctorsToSupabase(defaultDocs, cloudDbConfig).catch(console.warn);
        }
      }
      if (cloudClinic && cloudClinic.name && !isCorruptedClinicInfo(cloudClinic)) {
        const safeClinic = getSafeClinicInfo(cloudClinic);
        setClinicInfo(safeClinic);
        saveState(STORAGE_KEYS.CLINIC_INFO, safeClinic);
      }
      if (cloudRefRanges && cloudRefRanges.length > 0) {
        setReferenceRanges(cloudRefRanges);
        saveState(STORAGE_KEYS.REFERENCE_RANGES, cloudRefRanges);
      }
      if (cloudItemEquipLinks && cloudItemEquipLinks.length > 0) {
        setCatalogItemEquipments(cloudItemEquipLinks);
        saveState(STORAGE_KEYS.CATALOG_ITEM_EQUIPMENTS, cloudItemEquipLinks);
      }
      if (cloudScales && cloudScales.length > 0) {
        setAllergenScales(cloudScales);
        saveState(STORAGE_KEYS.ALLERGEN_SCALES, cloudScales);
      }
    } catch (err) {
      console.warn('[CloudDB] Không thể tải dữ liệu từ Cloud:', err);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        isInitialSyncDoneRef.current = true;
      }, 400);
    }
  }, [cloudDbConfig]);

  useEffect(() => {
    syncCloudData();
  }, [syncCloudData]);

  // Khi user nhập pass thành công, trigger fetch lại toàn bộ dữ liệu
  useEffect(() => {
    const handler = () => syncCloudData();
    window.addEventListener('password-unlocked', handler);
    return () => window.removeEventListener('password-unlocked', handler);
  }, [syncCloudData]);

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
    catalogItemEquipments,
    setCatalogItemEquipments,
    allergenScales,
    setAllergenScales,
    clinicInfo,
    setClinicInfo,
    cloudDbConfig,
    setCloudDbConfig,
    zaloConfig,
    setZaloConfig,
    isLoading,
    saveAllCatalogData
  };
}
