export const CATALOG_TAB = {
  INDICATORS: 'INDICATORS',
  ALLERGENS: 'ALLERGENS',
  PACKAGES: 'PACKAGES',
  PACKAGES_INDICATOR: 'PACKAGES_INDICATOR',
  PACKAGES_ALLERGEN: 'PACKAGES_ALLERGEN',
  DOCTORS: 'DOCTORS'
} as const;

export type CatalogTabType = (typeof CATALOG_TAB)[keyof typeof CATALOG_TAB];

export const GENDER_OPTIONS = [
  { value: 'Nam', label: 'Nam' },
  { value: 'Nữ', label: 'Nữ' },
  { value: 'Khác', label: 'Khác' }
] as const;

export const DEFAULT_DOCTOR_NAME = 'BS. Lê Thị Hoa';
