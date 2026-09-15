import { create } from 'zustand';
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
  DEFAULT_CLINIC_INFO
} from '@domain';
import { DEFAULT_CLOUD_DB_CONFIG } from '@infra/cloudDbService';

const DEFAULT_ZALO_CONFIG: ZaloZnsConfig = {
  enabled: false,
  appId: '',
  secretKey: '',
  oaId: '',
  templateId: '',
  accessToken: '',
  autoSendOnExport: false
};

type Updater<T> = T | ((prev: T) => T);

function resolveUpdater<T>(updater: Updater<T>, prev: T): T {
  return typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
}

export interface CatalogStoreState {
  catalog: CatalogItem[];
  testPackages: TestPackage[];
  testGroups: TestGroup[];
  equipments: TestEquipment[];
  doctorsList: Doctor[];
  referenceRanges: ReferenceRangeItem[];
  catalogItemEquipments: CatalogItemEquipmentLink[];
  allergenScales: AllergenGradingScale[];
  clinicInfo: ClinicInfo;
  cloudDbConfig: CloudDbConfig;
  zaloConfig: ZaloZnsConfig;
  isLoading: boolean;
  isFetching: boolean;

  setCatalog: (updater: Updater<CatalogItem[]>) => void;
  setTestPackages: (updater: Updater<TestPackage[]>) => void;
  setTestGroups: (updater: Updater<TestGroup[]>) => void;
  setEquipments: (updater: Updater<TestEquipment[]>) => void;
  setDoctorsList: (updater: Updater<Doctor[]>) => void;
  setReferenceRanges: (updater: Updater<ReferenceRangeItem[]>) => void;
  setCatalogItemEquipments: (updater: Updater<CatalogItemEquipmentLink[]>) => void;
  setAllergenScales: (updater: Updater<AllergenGradingScale[]>) => void;
  setClinicInfo: (updater: Updater<ClinicInfo>) => void;
  setCloudDbConfig: (updater: Updater<CloudDbConfig>) => void;
  setZaloConfig: (updater: Updater<ZaloZnsConfig>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsFetching: (isFetching: boolean) => void;

  setAllCatalogData: (data: Partial<{
    catalog: CatalogItem[];
    testPackages: TestPackage[];
    testGroups: TestGroup[];
    equipments: TestEquipment[];
    doctorsList: Doctor[];
    referenceRanges: ReferenceRangeItem[];
    catalogItemEquipments: CatalogItemEquipmentLink[];
    allergenScales: AllergenGradingScale[];
    clinicInfo: ClinicInfo;
    cloudDbConfig: CloudDbConfig;
    zaloConfig: ZaloZnsConfig;
  }>) => void;
}

export const useCatalogStore = create<CatalogStoreState>((set) => ({
  catalog: [],
  testPackages: [],
  testGroups: [],
  equipments: [],
  doctorsList: [],
  referenceRanges: [],
  catalogItemEquipments: [],
  allergenScales: [],
  clinicInfo: DEFAULT_CLINIC_INFO,
  cloudDbConfig: DEFAULT_CLOUD_DB_CONFIG,
  zaloConfig: DEFAULT_ZALO_CONFIG,
  isLoading: false,
  isFetching: false,

  setCatalog: (updater) => set((state) => ({ catalog: resolveUpdater(updater, state.catalog) })),
  setTestPackages: (updater) => set((state) => ({ testPackages: resolveUpdater(updater, state.testPackages) })),
  setTestGroups: (updater) => set((state) => ({ testGroups: resolveUpdater(updater, state.testGroups) })),
  setEquipments: (updater) => set((state) => ({ equipments: resolveUpdater(updater, state.equipments) })),
  setDoctorsList: (updater) => set((state) => ({ doctorsList: resolveUpdater(updater, state.doctorsList) })),
  setReferenceRanges: (updater) => set((state) => ({ referenceRanges: resolveUpdater(updater, state.referenceRanges) })),
  setCatalogItemEquipments: (updater) => set((state) => ({ catalogItemEquipments: resolveUpdater(updater, state.catalogItemEquipments) })),
  setAllergenScales: (updater) => set((state) => ({ allergenScales: resolveUpdater(updater, state.allergenScales) })),
  setClinicInfo: (updater) => set((state) => ({ clinicInfo: resolveUpdater(updater, state.clinicInfo) })),
  setCloudDbConfig: (updater) => set((state) => ({ cloudDbConfig: resolveUpdater(updater, state.cloudDbConfig) })),
  setZaloConfig: (updater) => set((state) => ({ zaloConfig: resolveUpdater(updater, state.zaloConfig) })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsFetching: (isFetching) => set({ isFetching }),

  setAllCatalogData: (data) => set((state) => ({ ...state, ...data }))
}));
