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
import { loadState, saveState } from '@infra/storage';
import { 
  fetchCatalogFromSupabase, 
  fetchPackagesFromSupabase, 
  fetchGroupsFromSupabase, 
  fetchEquipmentsFromSupabase, 
  fetchDoctorsFromSupabase,
  fetchClinicInfoFromSupabase
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
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://omydjydyavugxmqzffka.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9teWRqeWR5YXZ1Z3htcXpmZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDQ5ODgsImV4cCI6MjA1NzYyMDk4OH0.Tqg-H9V2lU6J7B3e2z5s3r9w8v7x6y5z4a3b2c1d0e',
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
    return loadState(STORAGE_KEYS.CATALOG, DEFAULT_CATALOG);
  });

  const [testPackages, setTestPackages] = useState<TestPackage[]>(() => {
    return loadState(STORAGE_KEYS.TEST_PACKAGES, DEFAULT_TEST_PACKAGES);
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

  // Tự động lưu Local Storage khi state thay đổi
  useEffect(() => {
    saveState(STORAGE_KEYS.CATALOG, catalog);
  }, [catalog]);

  useEffect(() => {
    saveState(STORAGE_KEYS.TEST_PACKAGES, testPackages);
  }, [testPackages]);

  useEffect(() => {
    saveState(STORAGE_KEYS.TEST_GROUPS, testGroups);
  }, [testGroups]);

  useEffect(() => {
    saveState(STORAGE_KEYS.EQUIPMENTS, equipments);
  }, [equipments]);

  useEffect(() => {
    saveState(STORAGE_KEYS.DOCTORS, doctorsList);
  }, [doctorsList]);

  useEffect(() => {
    saveState(STORAGE_KEYS.CLINIC_INFO, clinicInfo);
  }, [clinicInfo]);

  useEffect(() => {
    saveState(STORAGE_KEYS.CLOUD_DB, cloudDbConfig);
  }, [cloudDbConfig]);

  useEffect(() => {
    saveState(STORAGE_KEYS.ZALO_CONFIG, zaloConfig);
  }, [zaloConfig]);

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

        if (cloudCatalog && cloudCatalog.length > 0) setCatalog(cloudCatalog);
        if (cloudPackages && cloudPackages.length > 0) setTestPackages(cloudPackages);
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
