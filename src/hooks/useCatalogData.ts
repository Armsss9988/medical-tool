import { useState, useEffect } from 'react';
import { 
  CatalogItem, 
  TestPackage, 
  TestGroup, 
  Equipment, 
  Doctor, 
  Invoice, 
  ClinicInfo, 
  CloudDbConfig, 
  ZaloZnsConfig 
} from '@domain/types';
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
  defaultDoctor: 'Nguyễn Thị Thành Trung'
};

const DEFAULT_CLOUD_DB_CONFIG: CloudDbConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://omydjydyavugxmqzffka.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9teWRqeWR5YXZ1Z3htcXpmZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDQ5ODgsImV4cCI6MjA1NzYyMDk4OH0.Tqg-H9V2lU6J7B3e2z5s3r9w8v7x6y5z4a3b2c1d0e',
  enabled: true
};

const DEFAULT_ZALO_CONFIG: ZaloZnsConfig = {
  enabled: false,
  appId: '',
  oaId: '',
  templateId: '',
  accessToken: '',
  autoSendOnExport: false
};

export function useCatalogData() {
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    return loadState('catalog', DEFAULT_CATALOG);
  });

  const [testPackages, setTestPackages] = useState<TestPackage[]>(() => {
    return loadState('testPackages', DEFAULT_TEST_PACKAGES);
  });

  const [testGroups, setTestGroups] = useState<TestGroup[]>(() => {
    return loadState('testGroups', DEFAULT_TEST_GROUPS);
  });

  const [equipments, setEquipments] = useState<Equipment[]>(() => {
    return loadState('equipments', DEFAULT_EQUIPMENTS);
  });

  const [doctorsList, setDoctorsList] = useState<Doctor[]>(() => {
    return loadState('doctorsList', DEFAULT_DOCTORS);
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    return loadState('invoices', []);
  });

  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(() => {
    return loadState('clinicInfo', DEFAULT_CLINIC_INFO);
  });

  const [cloudDbConfig, setCloudDbConfig] = useState<CloudDbConfig>(() => {
    return loadState('cloudDbConfig', DEFAULT_CLOUD_DB_CONFIG);
  });

  const [zaloConfig, setZaloConfig] = useState<ZaloZnsConfig>(() => {
    return loadState('zaloConfig', DEFAULT_ZALO_CONFIG);
  });

  // Tự động lưu Local Storage khi state thay đổi
  useEffect(() => {
    saveState('catalog', catalog);
  }, [catalog]);

  useEffect(() => {
    saveState('testPackages', testPackages);
  }, [testPackages]);

  useEffect(() => {
    saveState('testGroups', testGroups);
  }, [testGroups]);

  useEffect(() => {
    saveState('equipments', equipments);
  }, [equipments]);

  useEffect(() => {
    saveState('doctorsList', doctorsList);
  }, [doctorsList]);

  useEffect(() => {
    saveState('invoices', invoices);
  }, [invoices]);

  useEffect(() => {
    saveState('clinicInfo', clinicInfo);
  }, [clinicInfo]);

  useEffect(() => {
    saveState('cloudDbConfig', cloudDbConfig);
  }, [cloudDbConfig]);

  useEffect(() => {
    saveState('zaloConfig', zaloConfig);
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
  }, [cloudDbConfig.enabled, cloudDbConfig.supabaseUrl, cloudDbConfig.supabaseAnonKey]);

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
    setZaloConfig
  };
}
