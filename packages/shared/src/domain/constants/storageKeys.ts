// ─── STORAGE KEYS CONSTANTS ──────────────────────────────────────────────────

export const STORAGE_KEYS = {
  REPORTS: 'medical_reports',
  INVOICES: 'invoices',
  CATALOG: 'catalog',
  TEST_PACKAGES: 'testPackages',
  TEST_GROUPS: 'testGroups',
  EQUIPMENTS: 'equipments',
  DOCTORS: 'doctorsList',
  CLINIC_INFO: 'clinicInfo',
  CLOUD_DB: 'cloudDbConfig',
  ZALO_CONFIG: 'zaloConfig',
  RECENT_TESTS: 'recent_tests',
  REFERENCE_RANGES: 'referenceRanges',
  CATALOG_ITEM_EQUIPMENTS: 'catalogItemEquipments',
  ALLERGEN_SCALES: 'allergenScales'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
