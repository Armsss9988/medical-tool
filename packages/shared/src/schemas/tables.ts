import { z } from 'zod';

export const TABLE_NAMES = [
  'catalog',
  'test-packages',
  'test-groups',
  'equipments',
  'doctors',
  'clinic-info',
  'zalo-config',
  'reference-ranges',
  'catalog-item-equipments',
  'allergen-scales',
  'medical-reports',
  'invoices'
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

export const tableNameSchema = z.enum(TABLE_NAMES);

export const catalogRowSchema = z.object({
  code: z.string().min(1),
  category: z.string().min(1),
  name: z.string().min(1),
  refMin: z.number().nullable().optional(),
  refMax: z.number().nullable().optional(),
  unit: z.string().nullable().optional().default(''),
  refText: z.string().nullable().optional().default(''),
  price: z.number().nullable().optional(),
  scientific: z.string().nullable().optional(),
  evaluationType: z.string().nullable().optional()
});

/** Zod schema cho một PackageItem (chỉ số trong gói kèm máy đo) */
export const packageItemSchema = z.object({
  code: z.string().min(1),
  equipmentId: z.string().nullable().optional()
});

export const testPackageRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  defaultEquipmentId: z.string().nullable().optional(),
  items: z.array(packageItemSchema).default([]),
  /** @deprecated backward compat — sẽ bị bỏ sau migration hoàn tất */
  codes: z.array(z.string()).optional(),
  price: z.number().default(0)
});

export const testGroupRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1)
});

export const equipmentRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  code: z.string().nullable().optional()
});

export const doctorRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  specialty: z.string().nullable().optional(),
  phone: z.string().nullable().optional()
});

export const clinicInfoRowSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  website: z.string().nullable().optional(),
  defaultDoctor: z.string(),
  logoUrl: z.string().nullable().optional(),
  stampUrl: z.string().nullable().optional(),
  bankId: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  bankAccountNo: z.string().nullable().optional(),
  bankAccountName: z.string().nullable().optional(),
  bankBranch: z.string().nullable().optional(),
  bankQrImageUrl: z.string().nullable().optional(),
  cashierName: z.string().nullable().optional(),
  accountantName: z.string().nullable().optional()
});

export const zaloConfigRowSchema = z.object({
  enabled: z.boolean(),
  appId: z.string(),
  secretKey: z.string(),
  oaId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().nullable().optional(),
  templateId: z.string(),
  autoSendOnExport: z.boolean(),
  proxyUrl: z.string().nullable().optional()
});

export const referenceRangeRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  refMin: z.number().nullable().optional(),
  refMax: z.number().nullable().optional(),
  unit: z.string().nullable().optional().default(''),
  refText: z.string().nullable().optional().default(''),
  gender: z.string().nullable().optional(),
  ageGroup: z.string().nullable().optional(),
  note: z.string().nullable().optional()
});

/** Zod schema cho bảng catalog_item_equipments */
export const catalogItemEquipmentRowSchema = z.object({
  id: z.string().min(1),
  catalogCode: z.string().min(1),
  equipmentId: z.string().min(1),
  refMin: z.number().nullable().optional(),
  refMax: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  refText: z.string().nullable().optional(),
  scaleId: z.string().nullable().optional(),
  isDefault: z.boolean().optional().default(false)
});

/** Zod schema cho bảng allergen_scales */
export const allergenScaleLevelSchema = z.object({
  grade: z.number(),
  minVal: z.number(),
  maxVal: z.number().nullable(),
  rangeText: z.string(),
  label: z.string(),
  isPositive: z.boolean(),
  colorKey: z.string().nullable().optional()
});

export const allergenScaleRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  equipment: z.string().nullable().optional(),
  unit: z.string().default('IU/ml'),
  levels: z.array(allergenScaleLevelSchema).default([])
});

export const documentRowSchema = z.object({ id: z.string().min(1) }).passthrough();

export const ROW_SCHEMAS: Record<TableName, z.ZodTypeAny> = {
  catalog: catalogRowSchema,
  'test-packages': testPackageRowSchema,
  'test-groups': testGroupRowSchema,
  equipments: equipmentRowSchema,
  doctors: doctorRowSchema,
  'clinic-info': clinicInfoRowSchema,
  'zalo-config': zaloConfigRowSchema,
  'reference-ranges': referenceRangeRowSchema,
  'catalog-item-equipments': catalogItemEquipmentRowSchema,
  'allergen-scales': allergenScaleRowSchema,
  'medical-reports': documentRowSchema,
  invoices: documentRowSchema
};
