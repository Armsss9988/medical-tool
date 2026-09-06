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
  normalizeTestPackage,
  DEFAULT_CLINIC_INFO,
  getSafeClinicInfo,
  isCorruptedClinicInfo
} from '@domain';
import { autoResolveItemLinks } from '@data';
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
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [testPackages, setTestPackages] = useState<TestPackage[]>([]);
  const [testGroups, setTestGroups] = useState<TestGroup[]>([]);
  const [equipments, setEquipments] = useState<TestEquipment[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [referenceRanges, setReferenceRanges] = useState<ReferenceRangeItem[]>([]);
  const [catalogItemEquipments, setCatalogItemEquipments] = useState<CatalogItemEquipmentLink[]>([]);
  const [allergenScales, setAllergenScales] = useState<AllergenGradingScale[]>([]);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(DEFAULT_CLINIC_INFO);
  const [cloudDbConfig, setCloudDbConfig] = useState<CloudDbConfig>(DEFAULT_CLOUD_DB_CONFIG);
  const [zaloConfig, setZaloConfig] = useState<ZaloZnsConfig>(DEFAULT_ZALO_CONFIG);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isManualSavingRef = useRef<boolean>(false);
  const isInitialSyncDoneRef = useRef<boolean>(false);

  // Tự động đồng bộ Cloud Database khi state thay đổi (CHỈ sau khi đã nạp xong từ Cloud)
  useEffect(() => {
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncCatalogToSupabase(catalog, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ danh mục:', err);
      });
    }
  }, [catalog, cloudDbConfig]);

  useEffect(() => {
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncPackagesToSupabase(testPackages, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ gói:', err);
      });
    }
  }, [testPackages, cloudDbConfig]);

  useEffect(() => {
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncGroupsToSupabase(testGroups, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ nhóm:', err);
      });
    }
  }, [testGroups, cloudDbConfig]);

  useEffect(() => {
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncEquipmentsToSupabase(equipments, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ thiết bị:', err);
      });
    }
  }, [equipments, cloudDbConfig]);

  useEffect(() => {
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncDoctorsToSupabase(doctorsList, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ bác sĩ:', err);
      });
    }
  }, [doctorsList, cloudDbConfig]);

  useEffect(() => {
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncReferenceRangesToSupabase(referenceRanges, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ tham chiếu:', err);
      });
    }
  }, [referenceRanges, cloudDbConfig]);

  useEffect(() => {
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncCatalogItemEquipmentsToSupabase(catalogItemEquipments, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ liên kết máy:', err);
      });
    }
  }, [catalogItemEquipments, cloudDbConfig]);

  useEffect(() => {
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncScalesToSupabase(allergenScales, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ thang dị ứng:', err);
      });
    }
  }, [allergenScales, cloudDbConfig]);

  useEffect(() => {
    if (!isInitialSyncDoneRef.current || isManualSavingRef.current) return;
    if (cloudDbConfig?.enabled && cloudDbConfig?.autoSync) {
      syncClinicInfoToSupabase(clinicInfo, cloudDbConfig).catch((err) => {
        console.warn('[CloudDB] Lỗi đồng bộ phòng khám:', err);
      });
    }
  }, [clinicInfo, cloudDbConfig]);

  useEffect(() => {
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
      }
      if (data.testPackages) {
        setTestPackages(data.testPackages);
      }
      if (data.testGroups) {
        setTestGroups(data.testGroups);
      }
      if (data.equipments) {
        setEquipments(data.equipments);
      }
      if (data.doctorsList) {
        setDoctorsList(data.doctorsList);
      }
      if (data.catalogItemEquipments) {
        setCatalogItemEquipments(data.catalogItemEquipments);
      }
      if (data.allergenScales) {
        setAllergenScales(data.allergenScales);
      }
      if (data.referenceRanges) {
        setReferenceRanges(data.referenceRanges);
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
      }
      if (cloudPackages && cloudPackages.length > 0) {
        const normalized = cloudPackages.map(normalizeTestPackage);
        setTestPackages(normalized);
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
      if (cloudClinic && cloudClinic.name && !isCorruptedClinicInfo(cloudClinic)) {
        const safeClinic = getSafeClinicInfo(cloudClinic);
        setClinicInfo(safeClinic);
      }
      if (cloudRefRanges && cloudRefRanges.length > 0) {
        setReferenceRanges(cloudRefRanges);
      }
      if (cloudItemEquipLinks && cloudItemEquipLinks.length > 0) {
        setCatalogItemEquipments(cloudItemEquipLinks);
      }
      if (cloudScales && cloudScales.length > 0) {
        setAllergenScales(cloudScales);
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
