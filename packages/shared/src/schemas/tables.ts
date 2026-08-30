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
  unit: z.string().optional().default(''),
  refText: z.string().optional().default(''),
  price: z.number().optional(),
  scientific: z.string().optional(),
  evaluationType: z.string().optional()
});

/** Zod schema cho một PackageItem (chỉ số trong gói kèm máy đo) */
export const packageItemSchema = z.object({
  code: z.string().min(1),
  equipmentId: z.string().nullable().optional()
});

export const testPackageRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
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
  code: z.string().optional()
});

export const doctorRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  specialty: z.string().optional(),
  phone: z.string().optional()
});

export const clinicInfoRowSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  website: z.string().optional(),
  defaultDoctor: z.string(),
  logoUrl: z.string().optional(),
  stampUrl: z.string().optional(),
  bankId: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankBranch: z.string().optional(),
  bankQrImageUrl: z.string().optional(),
  cashierName: z.string().optional(),
  accountantName: z.string().optional()
});

export const zaloConfigRowSchema = z.object({
  enabled: z.boolean(),
  appId: z.string(),
  secretKey: z.string(),
  oaId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  templateId: z.string(),
  autoSendOnExport: z.boolean(),
  proxyUrl: z.string().optional()
});

export const referenceRangeRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  refMin: z.number().nullable().optional(),
  refMax: z.number().nullable().optional(),
  unit: z.string().optional().default(''),
  refText: z.string().optional().default(''),
  gender: z.string().optional(),
  ageGroup: z.string().optional(),
  note: z.string().optional()
});

/** Zod schema cho bảng catalog_item_equipments */
export const catalogItemEquipmentRowSchema = z.object({
  id: z.string().min(1),
  catalogCode: z.string().min(1),
  equipmentId: z.string().min(1),
  referenceRangeId: z.string().nullable().optional(),
  scaleId: z.string().nullable().optional(),
  isDefault: z.boolean().optional().default(false)
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
  'medical-reports': documentRowSchema,
  invoices: documentRowSchema
};
