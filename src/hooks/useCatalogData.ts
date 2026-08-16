import { useState, useEffect, useRef } from "react";
import { DEFAULT_CATALOG, TEST_PACKAGES as INITIAL_PACKAGES, DEFAULT_TEST_GROUPS, DEFAULT_EQUIPMENTS } from "@data/defaultCatalog";
import { loadData, saveData } from "@infra/storage";
import { DEFAULT_CLOUD_DB_CONFIG, syncTableToCloud, fetchTableFromCloud } from "@infra/cloudDbService";
import { CatalogItem, TestPackage, TestGroup, TestEquipment, Doctor, Invoice, ClinicInfo, CloudDbConfig } from "@domain/types";

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
  defaultDoctor: "BS. Trần Hoài Long"
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

  const isDataLoadedRef = useRef(false);

  useEffect(() => {
    async function initData() {
      try {
        const loadedCatalog = await loadData<CatalogItem[]>("catalog_data", DEFAULT_CATALOG);
        const loadedPackages = await loadData<TestPackage[]>("test_packages", INITIAL_PACKAGES);
        const loadedDoctors = await loadData<Doctor[]>("doctors_catalog", DEFAULT_DOCTORS);
        const loadedInvoices = await loadData<Invoice[]>("invoices_history", []);
        const loadedTestGroups = await loadData<TestGroup[]>("test_groups", DEFAULT_TEST_GROUPS);
        const loadedEquipments = await loadData<TestEquipment[]>("equipments_catalog", DEFAULT_EQUIPMENTS);
        const loadedClinic = await loadData<ClinicInfo>("clinic_info", DEFAULT_CLINIC_INFO);
        const loadedCloudDbConfig = await loadData<CloudDbConfig>("cloud_db_config", DEFAULT_CLOUD_DB_CONFIG);

        const existingGroupNames = new Set(loadedTestGroups.map((g) => g.name.toLowerCase()));
        const finalGroups = [...loadedTestGroups];
        DEFAULT_TEST_GROUPS.forEach((defG) => {
          if (!existingGroupNames.has(defG.name.toLowerCase())) {
            finalGroups.push(defG);
            existingGroupNames.add(defG.name.toLowerCase());
          }
        });

        const existingEquipNames = new Set(loadedEquipments.map((e) => e.name.toLowerCase()));
        const finalEquipments = [...loadedEquipments];
        DEFAULT_EQUIPMENTS.forEach((defE) => {
          if (!existingEquipNames.has(defE.name.toLowerCase())) {
            finalEquipments.push(defE);
            existingEquipNames.add(defE.name.toLowerCase());
          }
        });

        const seenDocIds = new Set<string>();
        const seenDocNames = new Set<string>();
        const finalDoctors: Doctor[] = [];
        [...loadedDoctors, ...DEFAULT_DOCTORS].forEach((d) => {
          if (d && d.id && !seenDocIds.has(d.id) && !seenDocNames.has(d.name.toLowerCase())) {
            seenDocIds.add(d.id);
            seenDocNames.add(d.name.toLowerCase());
            finalDoctors.push(d);
          }
        });

        const existingCodes = new Set(loadedCatalog.map((c) => c.code));
        const mergedCatalog = [...loadedCatalog];
        let hasNewItems = false;
        DEFAULT_CATALOG.forEach((item) => {
          if (!existingCodes.has(item.code)) {
            mergedCatalog.push(item);
            existingCodes.add(item.code);
            hasNewItems = true;
          }
        });

        const mergedPackages = INITIAL_PACKAGES.map((defPkg) => {
          const found = loadedPackages.find((p) => p.id === defPkg.id);
          return found || defPkg;
        });

        setCatalog(mergedCatalog);
        setTestPackages(mergedPackages);
        setTestGroups(finalGroups);
        setEquipments(finalEquipments);
        setDoctorsList(finalDoctors);
        setInvoices(loadedInvoices);
        setClinicInfo(loadedClinic);
        setCloudDbConfig(loadedCloudDbConfig);

        if (hasNewItems) {
          saveData("catalog_data", mergedCatalog);
        }

        if (loadedCloudDbConfig.enabled && loadedCloudDbConfig.supabaseUrl) {
          try {
            const cloudCat = await fetchTableFromCloud<CatalogItem[]>("catalog_data", loadedCloudDbConfig);
            if (cloudCat && cloudCat.length > 0) {
              setCatalog(cloudCat);
              saveData("catalog_data", cloudCat);
            }
            const cloudPkgs = await fetchTableFromCloud<TestPackage[]>("test_packages", loadedCloudDbConfig);
            if (cloudPkgs && cloudPkgs.length > 0) {
              setTestPackages(cloudPkgs);
              saveData("test_packages", cloudPkgs);
            }
            const cloudGroups = await fetchTableFromCloud<TestGroup[]>("test_groups", loadedCloudDbConfig);
            if (cloudGroups && cloudGroups.length > 0) {
              setTestGroups(cloudGroups);
              saveData("test_groups", cloudGroups);
            }
            const cloudEquip = await fetchTableFromCloud<TestEquipment[]>("equipments_catalog", loadedCloudDbConfig);
            if (cloudEquip && cloudEquip.length > 0) {
              setEquipments(cloudEquip);
              saveData("equipments_catalog", cloudEquip);
            }
            const cloudDocs = await fetchTableFromCloud<Doctor[]>("doctors_catalog", loadedCloudDbConfig);
            if (cloudDocs && cloudDocs.length > 0) {
              setDoctorsList(cloudDocs);
              saveData("doctors_catalog", cloudDocs);
            }
            const cloudInvoices = await fetchTableFromCloud<Invoice[]>("invoices_history", loadedCloudDbConfig);
            if (cloudInvoices && cloudInvoices.length > 0) {
              setInvoices(cloudInvoices);
              saveData("invoices_history", cloudInvoices);
            }
            const cloudClinic = await fetchTableFromCloud<ClinicInfo>("clinic_info", loadedCloudDbConfig);
            if (cloudClinic && cloudClinic.name) {
              setClinicInfo(cloudClinic);
              saveData("clinic_info", cloudClinic);
            }
          } catch (cloudErr) {
            console.warn("[CloudSync] Không thể tải dữ liệu tự động từ Supabase:", cloudErr);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu khởi tạo:", err);
      } finally {
        isDataLoadedRef.current = true;
      }
    }
    initData();
  }, []);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("catalog_data", catalog);
    if (cloudDbConfig.enabled) syncTableToCloud("catalog_data", catalog, cloudDbConfig);
  }, [catalog, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("test_packages", testPackages);
    if (cloudDbConfig.enabled) syncTableToCloud("test_packages", testPackages, cloudDbConfig);
  }, [testPackages, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("test_groups", testGroups);
    if (cloudDbConfig.enabled) syncTableToCloud("test_groups", testGroups, cloudDbConfig);
  }, [testGroups, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("equipments_catalog", equipments);
    if (cloudDbConfig.enabled) syncTableToCloud("equipments_catalog", equipments, cloudDbConfig);
  }, [equipments, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("doctors_catalog", doctorsList);
    if (cloudDbConfig.enabled) syncTableToCloud("doctors_catalog", doctorsList, cloudDbConfig);
  }, [doctorsList, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("invoices_history", invoices);
    if (cloudDbConfig.enabled) syncTableToCloud("invoices_history", invoices, cloudDbConfig);
  }, [invoices, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("clinic_info", clinicInfo);
    if (cloudDbConfig.enabled) syncTableToCloud("clinic_info", clinicInfo, cloudDbConfig);
  }, [clinicInfo, cloudDbConfig]);

  useEffect(() => {
    if (!isDataLoadedRef.current) return;
    saveData("cloud_db_config", cloudDbConfig);
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
    invoices,
    setInvoices,
    clinicInfo,
    setClinicInfo,
    cloudDbConfig,
    setCloudDbConfig
  };
}
