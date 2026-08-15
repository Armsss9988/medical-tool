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
  name: "PHÒNG KHÁM XÉT NGHIỆM Y KHOA AN BÌNH",
  address: "Số 123 Đường Giải Phóng, Đống Đa, Hà Nội",
  phone: "0988 123 456",
  defaultDoctor: "BS. CKII. Lê Anh Minh"
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

        for (const defaultGroup of DEFAULT_TEST_GROUPS) {
          if (!existingGroupNames.has(defaultGroup.name.toLowerCase())) {
            finalGroups.push(defaultGroup);
            existingGroupNames.add(defaultGroup.name.toLowerCase());
          }
        }

        for (const catItem of loadedCatalog) {
          if (catItem.category && !existingGroupNames.has(catItem.category.toLowerCase())) {
            finalGroups.push({ id: crypto.randomUUID(), name: catItem.category.trim() });
            existingGroupNames.add(catItem.category.toLowerCase());
          }
        }

        const existingEqNames = new Set(loadedEquipments.map((e) => e.name.toLowerCase()));
        const finalEquipments = [...loadedEquipments];
        for (const eq of DEFAULT_EQUIPMENTS) {
          if (!existingEqNames.has(eq.name.toLowerCase())) {
            finalEquipments.push(eq);
            existingEqNames.add(eq.name.toLowerCase());
          }
        }
        for (const catItem of loadedCatalog) {
          if (catItem.equipment && !existingEqNames.has(catItem.equipment.toLowerCase())) {
            finalEquipments.push({ id: crypto.randomUUID(), name: catItem.equipment.trim() });
            existingEqNames.add(catItem.equipment.toLowerCase());
          }
        }

        setCatalog(loadedCatalog);
        setTestPackages(loadedPackages);
        setDoctorsList(loadedDoctors);
        setInvoices(loadedInvoices);
        setTestGroups(finalGroups);
        setEquipments(finalEquipments);
        setClinicInfo(loadedClinic);
        setCloudDbConfig(loadedCloudDbConfig);

        if (loadedCloudDbConfig.enabled && loadedCloudDbConfig.supabaseUrl) {
          try {
            const cloudCatalog = await fetchTableFromCloud<CatalogItem[]>("catalog_data", loadedCloudDbConfig);
            if (cloudCatalog && Array.isArray(cloudCatalog) && cloudCatalog.length > 0) {
              setCatalog(cloudCatalog);
            }
            const cloudPackages = await fetchTableFromCloud<TestPackage[]>("test_packages", loadedCloudDbConfig);
            if (cloudPackages && Array.isArray(cloudPackages) && cloudPackages.length > 0) {
              setTestPackages(cloudPackages);
            }
            const cloudInvoices = await fetchTableFromCloud<Invoice[]>("invoices_history", loadedCloudDbConfig);
            if (cloudInvoices && Array.isArray(cloudInvoices) && cloudInvoices.length > 0) {
              setInvoices(cloudInvoices);
            }
          } catch (cloudErr) {
            console.warn("Chưa thể tải dữ liệu từ Cloud DB, sử dụng dữ liệu cục bộ:", cloudErr);
          }
        }
      } catch (err) {
        console.error("Lỗi nạp dữ liệu ban đầu:", err);
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
