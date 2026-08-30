// ─── UI CONSTANTS & ENUMS ───────────────────────────────────────────────────

export const DATE_FILTER = {
  ALL: 'ALL',
  TODAY: 'TODAY',
  YESTERDAY: 'YESTERDAY',
  LAST_7_DAYS: 'LAST_7_DAYS',
  THIS_MONTH: 'THIS_MONTH',
  LAST_MONTH: 'LAST_MONTH',
  CUSTOM: 'CUSTOM'
} as const;

export type DateFilterType = typeof DATE_FILTER[keyof typeof DATE_FILTER];

export const REVENUE_TAB = {
  INVOICES: 'INVOICES',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  DOCTORS: 'DOCTORS',
  DAILY_REPORT: 'DAILY_REPORT'
} as const;

export type RevenueTabType = typeof REVENUE_TAB[keyof typeof REVENUE_TAB];

export const CATALOG_TAB = {
  INDICATORS: 'INDICATORS',
  PACKAGES: 'PACKAGES',
  PACKAGES_INDICATOR: 'PACKAGES_INDICATOR',
  ALLERGENS: 'ALLERGENS',
  PACKAGES_ALLERGEN: 'PACKAGES_ALLERGEN',
  DOCTORS: 'DOCTORS'
} as const;

export type CatalogTabType = typeof CATALOG_TAB[keyof typeof CATALOG_TAB];

export const PRINT_ELEMENT_ID = {
  MEDICAL_REPORT: 'printable-medical-report',
  ALLERGEN_REPORT: 'printable-allergen-report',
  BATCH_MEDICAL: 'batch-medical-report',
  BATCH_ALLERGEN: 'batch-allergen-report'
} as const;

export type PrintElementId = typeof PRINT_ELEMENT_ID[keyof typeof PRINT_ELEMENT_ID];

export const TOAST_TYPE = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
} as const;

export const QUICK_NOTE = {
  NORMAL: 'Bình thường',
  HIGH: 'CAO ↑',
  LOW: 'THẤP ↓',
  NEGATIVE: 'Âm tính',
  POSITIVE: 'Dương tính',
  HIGH_SHORT: 'H (Tăng)',
  LOW_SHORT: 'L (Giảm)'
} as const;

export const QUICK_NOTE_LIST: readonly string[] = [
  QUICK_NOTE.NORMAL,
  QUICK_NOTE.HIGH,
  QUICK_NOTE.LOW,
  QUICK_NOTE.NEGATIVE,
  QUICK_NOTE.POSITIVE,
  QUICK_NOTE.HIGH_SHORT,
  QUICK_NOTE.LOW_SHORT
] as const;
