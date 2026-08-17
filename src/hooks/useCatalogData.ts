import { useState, useEffect, useRef } from "react";
import { DEFAULT_CATALOG, TEST_PACKAGES as INITIAL_PACKAGES, DEFAULT_TEST_GROUPS, DEFAULT_EQUIPMENTS } from "@data/defaultCatalog";
import { loadData, saveData } from "@infra/storage";
import { DEFAULT_CLOUD_DB_CONFIG, syncTableToCloud, fetchTableFromCloud } from "@infra/cloudDbService";
import { DEFAULT_ZALO_CONFIG } from "@infra/zaloService";
import { CatalogItem, TestPackage, TestGroup, TestEquipment, Doctor, Invoice, ClinicInfo, CloudDbConfig, ZaloZnsConfig } from "@domain/types";

const DEFAULT_DOCTORS: Doctor[] = [
  { id: "BS01", name: "BS. Trần Hoài Long", specialty: "Bác sĩ xét nghiệm chính", phone: "0912345678" },
  { id: "BS02", name: "BS. Nguyễn Thị Mai", specialty: "Nội khoa - Dị ứng", phone: "0987654321" },
  { id: "BS03", name: "BS. CKII. Lê Anh Minh", specialty: "Trưởng khoa xét nghiệm", phone: "0905123456" }
];

const DEFAULT_CLINIC_INFO: ClinicInfo = {
  name: "TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH",
  address: "Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị",
  phone: "032.855.3773",
  website: "golab.com.vn",
  defaultDoctor: "Nguyễn Thị Thành Trung"
};

export function useCatalogData() {
  const [catalog, setCatalog] = useState<CatalogItem[]>(DEFAULT_CATALOG);
  const [testPackages, setTestPackages] = useState<TestPackage[]>(INITIAL_PACKAGES);
  const [testGroups, setTestGroups] = useState<TestGroup[]>(DEFAULT_TEST_GROUPS);
  const [equipments, setEquipments] = useState<TestEquipment[]>(DEFAULT_EQUIPMENTS);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>(DEFAULT_DOCTORS);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(DEFAULT_CLINIC_INFO);
  const [cloudDbConfig, setCloudDbConfig] = useState<CloudDbConfig>(DEFAULT_CLOUD_DB_CONFIG);
  const [zaloConfig, setZaloConfig] = useState<ZaloZnsConfig>(DEFAULT_ZALO_CONFIG);

  const isDataLoadedRef = useRef(false);

  useEffect(() => {
    async function initData() {
      try {
        const loadedCatalog = await loadData<CatalogItem[]>("catalog_data", DEFAULT_CATALOG);
        const loadedPackages = await loadData<TestPackage[]>("test_packages", INITIAL_PACKAGES);
        const loadedDoctors = await loadData<Doctor[]>("doctors_catalog", DEFAULT_DOCTORS);
        const loadedGroups = await loadData<TestGroup[]>("test_groups", DEFAULT_TEST_GROUPS);
        const loadedEquipments = await loadData<TestEquipment[]>("equipments_catalog", DEFAULT_EQUIPMENTS);
        const loadedInvoices = await loadData<Invoice[]>("invoices_data", []);
        const loadedClinicInfo = await loadData<ClinicInfo>("clinic_info", DEFAULT_CLINIC_INFO);
        const loadedCloudConfig = await loadData<CloudDbConfig>("cloud_db_config", DEFAULT_CLOUD_DB_CONFIG);
        const loadedZaloConfig = await loadData<ZaloZnsConfig>("zalo_zns_config", DEFAULT_ZALO_CONFIG);

        setCatalog(loadedCatalog);
        setTestPackages(loadedPackages);
        setDoctorsList(loadedDoctors);
        setTestGroups(loadedGroups);
        setEquipments(loadedEquipments);
        setInvoices(loadedInvoices);
        setClinicInfo(loadedClinicInfo);
        setCloudDbConfig(loadedCloudConfig);
        setZaloConfig(loadedZaloConfig);

        if (loadedCloudConfig.enabled && loadedCloudConfig.supabaseUrl) {
          try {
            const cloudCatalog = await fetchTableFromCloud<CatalogItem[]>("catalog_data", loadedCloudConfig);
            if (cloudCatalog && cloudCatalog.length > 0) setCatalog(cloudCatalog);

            const cloudPackages = await fetchTableFromCloud<TestPackage[]>("test_packages", loadedCloudConfig);
            if (cloudPackages && cloudPackages.length > 0) setTestPackages(cloudPackages);

            const cloudDoctors = await fetchTableFromCloud<Doctor[]>("doctors_catalog", loadedCloudConfig);
            if (cloudDoctors && cloudDoctors.length > 0) setDoctorsList(cloudDoctors);

            const cloudGroups = await fetchTableFromCloud<TestGroup[]>("test_groups", loadedCloudConfig);
            if (cloudGroups && cloudGroups.length > 0) setTestGroups(cloudGroups);

            const cloudEquipments = await fetchTableFromCloud<TestEquipment[]>("equipments_catalog", loadedCloudConfig);
            if (cloudEquipments && cloudEquipments.length > 0) setEquipments(cloudEquipments);

            const cloudInvoices = await fetchTableFromCloud<Invoice[]>("invoices_data", loadedCloudConfig);
            if (cloudInvoices && cloudInvoices.length > 0) setInvoices(cloudInvoices);

            const cloudClinicInfo = await fetchTableFromCloud<ClinicInfo>("clinic_info", loadedCloudConfig);
            if (cloudClinicInfo) setClinicInfo(cloudClinicInfo);
          } catch (cloudErr) {
            console.warn("[CloudDB] Lỗi khi nạp dữ liệu từ Cloud:", cloudErr);
          }
        }
      } catch (err) {
        console.error("Lỗi khi nạp dữ liệu từ Storage:", err);
      } finally {
        isDataLoadedRef.current = true;
      }
    }

    initData();
  }, []);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("catalog_data", catalog);
    if (cloudDbConfig.enabled && cloudDbConfig.autoSync) {
      syncTableToCloud("catalog_data", catalog, cloudDbConfig);
    }
  }, [catalog, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("test_packages", testPackages);
    if (cloudDbConfig.enabled && cloudDbConfig.autoSync) {
      syncTableToCloud("test_packages", testPackages, cloudDbConfig);
    }
  }, [testPackages, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("test_groups", testGroups);
    if (cloudDbConfig.enabled && cloudDbConfig.autoSync) {
      syncTableToCloud("test_groups", testGroups, cloudDbConfig);
    }
  }, [testGroups, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("equipments_catalog", equipments);
    if (cloudDbConfig.enabled && cloudDbConfig.autoSync) {
      syncTableToCloud("equipments_catalog", equipments, cloudDbConfig);
    }
  }, [equipments, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("doctors_catalog", doctorsList);
    if (cloudDbConfig.enabled && cloudDbConfig.autoSync) {
      syncTableToCloud("doctors_catalog", doctorsList, cloudDbConfig);
    }
  }, [doctorsList, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("invoices_data", invoices);
    if (cloudDbConfig.enabled && cloudDbConfig.autoSync) {
      syncTableToCloud("invoices_data", invoices, cloudDbConfig);
    }
  }, [invoices, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("clinic_info", clinicInfo);
    if (cloudDbConfig.enabled && cloudDbConfig.autoSync) {
      syncTableToCloud("clinic_info", clinicInfo, cloudDbConfig);
    }
  }, [clinicInfo, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("cloud_db_config", cloudDbConfig);
  }, [cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("zalo_zns_config", zaloConfig);
  }, [zaloConfig]);

  const addCatalogItem = (item: CatalogItem) => {
    setCatalog((prev) => [...prev, item]);
  };

  const updateCatalogItem = (item: CatalogItem) => {
    setCatalog((prev) => prev.map((c) => (c.code === item.code ? item : c)));
  };

  const deleteCatalogItem = (code: string) => {
    setCatalog((prev) => prev.filter((c) => c.code !== code));
  };

  const addDoctor = (doc: Doctor) => {
    setDoctorsList((prev) => [...prev, doc]);
  };

  const updateDoctor = (doc: Doctor) => {
    setDoctorsList((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
  };

  const deleteDoctor = (id: string) => {
    setDoctorsList((prev) => prev.filter((d) => d.id !== id));
  };

  const addPackage = (pkg: TestPackage) => {
    setTestPackages((prev) => [...prev, pkg]);
  };

  const updatePackage = (pkg: TestPackage) => {
    setTestPackages((prev) => prev.map((p) => (p.id === pkg.id ? pkg : p)));
  };

  const deletePackage = (id: string) => {
    setTestPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const addGroup = (grp: TestGroup) => {
    setTestGroups((prev) => [...prev, grp]);
  };

  const updateGroup = (grp: TestGroup) => {
    setTestGroups((prev) => prev.map((g) => (g.id === grp.id ? grp : g)));
  };

  const deleteGroup = (id: string) => {
    setTestGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const addEquipment = (eq: TestEquipment) => {
    setEquipments((prev) => [...prev, eq]);
  };

  const updateEquipment = (eq: TestEquipment) => {
    setEquipments((prev) => prev.map((e) => (e.id === eq.id ? eq : e)));
  };

  const deleteEquipment = (id: string) => {
    setEquipments((prev) => prev.filter((e) => e.id !== id));
  };

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
    invoices,
    setInvoices,
    clinicInfo,
    setClinicInfo,
    cloudDbConfig,
    setCloudDbConfig,
    zaloConfig,
    setZaloConfig,
    addCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    addPackage,
    updatePackage,
    deletePackage,
    addGroup,
    updateGroup,
    deleteGroup,
    addEquipment,
    updateEquipment,
    deleteEquipment
  };
}
