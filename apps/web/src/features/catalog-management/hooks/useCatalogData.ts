import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  syncReferenceRangesToSupabase,
  syncCatalogItemEquipmentsToSupabase,
  syncScalesToSupabase,
  DEFAULT_CLOUD_DB_CONFIG
} from '@infra/cloudDbService';
import {
  postCatalogItem,
  deleteCatalogItemApi,
  postTestPackage,
  deleteTestPackageApi
} from '@infra/apiClient';

const DEFAULT_ZALO_CONFIG: ZaloZnsConfig = {
  enabled: false,
  appId: '',
  secretKey: '',
  oaId: '',
  templateId: '',
  accessToken: '',
  autoSendOnExport: false
};

export const CATALOG_BUNDLE_QUERY_KEY = ['catalog-bundle'] as const;

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

  const qc = useQueryClient();

  const catalogQuery = useQuery({
    queryKey: CATALOG_BUNDLE_QUERY_KEY,
    queryFn: async () => {
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
      return {
        cloudCatalog, 
        cloudPackages, 
        cloudGroups, 
        cloudEquip, 
        cloudDocs, 
        cloudClinic, 
        cloudRefRanges,
        cloudItemEquipLinks,
        cloudScales
      };
    },
    enabled: cloudDbConfig?.enabled !== false,
    staleTime: 60_000,
    refetchOnWindowFocus: false
  });

  const isLoading = cloudDbConfig?.enabled === false ? false : catalogQuery.isLoading;
  const isFetching = catalogQuery.isFetching;

  useEffect(() => {
    if (!catalogQuery.data) return;
    const {
      cloudCatalog, 
      cloudPackages, 
      cloudGroups, 
      cloudEquip, 
      cloudDocs, 
      cloudClinic, 
      cloudRefRanges,
      cloudItemEquipLinks,
      cloudScales
    } = catalogQuery.data;

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
  }, [catalogQuery.data]);

  // Khi user nhập pass thành công, trigger fetch lại toàn bộ dữ liệu
  useEffect(() => {
    const handler = () => {
      qc.invalidateQueries({ queryKey: CATALOG_BUNDLE_QUERY_KEY });
    };
    window.addEventListener('password-unlocked', handler);
    return () => window.removeEventListener('password-unlocked', handler);
  }, [qc]);

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
      // Thực thi tuần tự các bảng cần lưu lên Cloud để tránh tràn transaction pooler / khóa hàng Postgres
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
          console.warn('[CloudDB] Lỗi lưu thành phần danh mục lên Cloud:', err);
        });
      }
      // Làm mới bộ nhớ cache của TanStack Query sau khi lưu
      qc.invalidateQueries({ queryKey: CATALOG_BUNDLE_QUERY_KEY, refetchType: 'none' });
    }
  }, [cloudDbConfig, qc]);

  // Lưu đơn lẻ một chỉ số xét nghiệm lên Cloud DB
  const saveSingleCatalogItem = useCallback(async (item: CatalogItem) => {
    setCatalog((prev) => {
      const idx = prev.findIndex((i) => i.code === item.code);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [...prev, item];
    });

    if (item.equipmentLinks) {
      setCatalogItemEquipments((prev) => {
        const filtered = prev.filter((l) => l.catalogCode !== item.code);
        return [...filtered, ...(item.equipmentLinks || [])];
      });
    }

    if (cloudDbConfig?.enabled) {
      await postCatalogItem(item);
    }
  }, [cloudDbConfig]);

  // Xóa đơn lẻ một chỉ số xét nghiệm khỏi Cloud DB (có báo lỗi nếu vi phạm ràng buộc gói)
  const deleteSingleCatalogItem = useCallback(async (code: string): Promise<{ success: boolean; message?: string }> => {
    try {
      if (cloudDbConfig?.enabled) {
        await deleteCatalogItemApi(code);
      }
      setCatalog((prev) => prev.filter((i) => i.code !== code));
      setCatalogItemEquipments((prev) => prev.filter((l) => l.catalogCode !== code));
      return { success: true };
    } catch (err) {
      const message = (err as Error).message || 'Không thể xóa chỉ số';
      return { success: false, message };
    }
  }, [cloudDbConfig]);

  // Lưu đơn lẻ một gói xét nghiệm lên Cloud DB
  const saveSingleTestPackage = useCallback(async (pkg: TestPackage) => {
    const normalized = normalizeTestPackage(pkg);
    setTestPackages((prev) => {
      const idx = prev.findIndex((p) => p.id === normalized.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = normalized;
        return next;
      }
      return [...prev, normalized];
    });

    if (cloudDbConfig?.enabled) {
      await postTestPackage(normalized);
    }
  }, [cloudDbConfig]);

  // Xóa đơn lẻ một gói xét nghiệm khỏi Cloud DB
  const deleteSingleTestPackage = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (cloudDbConfig?.enabled) {
        await deleteTestPackageApi(id);
      }
      setTestPackages((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err) {
      console.error('[useCatalogData] Lỗi xóa gói xét nghiệm:', err);
      return false;
    }
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
    isFetching,
    refetch: catalogQuery.refetch,
    saveAllCatalogData,
    saveSingleCatalogItem,
    deleteSingleCatalogItem,
    saveSingleTestPackage,
    deleteSingleTestPackage
  };
}
