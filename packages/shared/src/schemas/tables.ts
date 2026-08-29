import { z } from 'zod';

export const TABLE_NAMES = [
  'catalog',
  'test-packages',
  'test-groups',
  'equipments',
  'doctors',
  'clinic-info',
  'zalo-config',
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
  equipment: z.string().optional(),
  evaluationType: z.string().optional(),
  referenceRangeId: z.string().optional(),
  scaleId: z.string().optional()
});

export const testPackageRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  codes: z.array(z.string()).default([]),
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

export const documentRowSchema = z.object({ id: z.string().min(1) }).passthrough();

export const ROW_SCHEMAS: Record<TableName, z.ZodTypeAny> = {
  catalog: catalogRowSchema,
  'test-packages': testPackageRowSchema,
  'test-groups': testGroupRowSchema,
  equipments: equipmentRowSchema,
  doctors: doctorRowSchema,
  'clinic-info': clinicInfoRowSchema,
  'zalo-config': zaloConfigRowSchema,
  'medical-reports': documentRowSchema,
  invoices: documentRowSchema
};
