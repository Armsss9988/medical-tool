import { boolean, jsonb, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core';

export const catalogItems = pgTable('catalog_items', {
  code: text('code').primaryKey(),
  category: text('category').notNull(),
  name: text('name').notNull(),
  refMin: real('ref_min'),
  refMax: real('ref_max'),
  unit: text('unit').notNull().default(''),
  refText: text('ref_text').notNull().default(''),
  price: real('price'),
  scientific: text('scientific'),
  equipment: text('equipment'),
  evaluationType: text('evaluation_type'),
  referenceRangeId: text('reference_range_id'),
  scaleId: text('scale_id'),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const testPackages = pgTable('test_packages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  codes: text('codes').array().notNull(),
  price: real('price').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const testGroups = pgTable('test_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const equipments = pgTable('equipments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const doctors = pgTable('doctors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  specialty: text('specialty'),
  phone: text('phone'),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const clinicInfo = pgTable('clinic_info', {
  id: text('id').primaryKey().default('default'),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  website: text('website'),
  defaultDoctor: text('default_doctor').notNull(),
  logoUrl: text('logo_url'),
  stampUrl: text('stamp_url'),
  bankId: text('bank_id'),
  bankName: text('bank_name'),
  bankAccountNo: text('bank_account_no'),
  bankAccountName: text('bank_account_name'),
  bankBranch: text('bank_branch'),
  bankQrImageUrl: text('bank_qr_image_url'),
  cashierName: text('cashier_name'),
  accountantName: text('accountant_name'),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const zaloConfig = pgTable('zalo_config', {
  id: text('id').primaryKey().default('default'),
  enabled: boolean('enabled').notNull().default(false),
  appId: text('app_id').notNull().default(''),
  secretKey: text('secret_key').notNull().default(''),
  oaId: text('oa_id').notNull().default(''),
  accessToken: text('access_token').notNull().default(''),
  refreshToken: text('refresh_token'),
  templateId: text('template_id').notNull().default(''),
  autoSendOnExport: boolean('auto_send_on_export').notNull().default(false),
  proxyUrl: text('proxy_url'),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const referenceRanges = pgTable('reference_ranges', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  refMin: real('ref_min'),
  refMax: real('ref_max'),
  unit: text('unit').notNull().default(''),
  refText: text('ref_text').notNull().default(''),
  gender: text('gender'),
  ageGroup: text('age_group'),
  note: text('note'),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const medicalReports = pgTable('medical_reports', {
  id: text('id').primaryKey(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
