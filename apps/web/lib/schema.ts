import { boolean, integer, jsonb, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core';

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
  evaluationType: text('evaluation_type'),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/** Bảng cấu hình thiết bị: 1 chỉ số xét nghiệm × nhiều loại máy đo */
export const catalogItemEquipments = pgTable('catalog_item_equipments', {
  id: text('id').primaryKey(),
  catalogCode: text('catalog_code').notNull(),
  equipmentId: text('equipment_id').notNull(),
  refMin: real('ref_min'),
  refMax: real('ref_max'),
  unit: text('unit'),
  refText: text('ref_text'),
  scaleId: text('scale_id'),
  isDefault: boolean('is_default').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/** Bảng Master: Gói xét nghiệm */
export const testPackages = pgTable('test_packages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  defaultEquipmentId: text('default_equipment_id'),
  price: real('price').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/** Bảng Detail: Chỉ số trong gói xét nghiệm */
export const packageItems = pgTable('package_items', {
  id: text('id').primaryKey(),
  packageId: text('package_id').notNull().references(() => testPackages.id, { onDelete: 'cascade' }),
  catalogCode: text('catalog_code').notNull(),
  equipmentId: text('equipment_id'),
  orderIndex: integer('order_index').notNull().default(0)
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

/** Bảng Master: Thang đo phân độ dị nguyên */
export const allergenScales = pgTable('allergen_scales', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  equipment: text('equipment'),
  unit: text('unit').notNull().default('IU/ml'),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/** Bảng Detail: Các bậc thang phân độ */
export const allergenScaleLevels = pgTable('allergen_scale_levels', {
  id: text('id').primaryKey(),
  scaleId: text('scale_id').notNull().references(() => allergenScales.id, { onDelete: 'cascade' }),
  grade: integer('grade').notNull(),
  minVal: real('min_val').notNull(),
  maxVal: real('max_val'),
  rangeText: text('range_text').notNull(),
  label: text('label').notNull(),
  isPositive: boolean('is_positive').notNull().default(false),
  colorKey: text('color_key'),
  orderIndex: integer('order_index').notNull().default(0)
});

/** Bảng Master: Phiếu Kết Quả Xét Nghiệm (Hồ Sơ Y Khoa) */
export const medicalReports = pgTable('medical_reports', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  sampleCode: text('sample_code'),
  status: text('status').notNull().default('Chờ xét nghiệm'),
  doctorName: text('doctor_name'),
  conclusion: text('conclusion'),
  isAllergen: boolean('is_allergen').notNull().default(false),
  invoiceId: text('invoice_id'),
  cloudPdfUrl: text('cloud_pdf_url'),
  qrCodeDataUrl: text('qr_code_data_url'),
  pdfVersion: integer('pdf_version').notNull().default(1),
  isPdfOutdated: boolean('is_pdf_outdated').notNull().default(false),
  pdfGeneratedAt: timestamp('pdf_generated_at'),
  zaloSentAt: timestamp('zalo_sent_at'),
  zaloMsgId: text('zalo_msg_id'),
  patientName: text('patient_name').notNull().default(''),
  patientDob: text('patient_dob'),
  patientGender: text('patient_gender'),
  patientPhone: text('patient_phone'),
  patientAddress: text('patient_address'),
  patientDiagnosis: text('patient_diagnosis'),
  patientOrderedAt: text('patient_ordered_at'),
  patientReceivedAt: text('patient_received_at'),
  patientReturnedAt: text('patient_returned_at'),
  patientSecretToken: text('patient_secret_token'),
  patientSampleStatus: text('patient_sample_status'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/** Bảng Detail: Dòng chỉ số xét nghiệm (Clinical Row-Level Snapshot) */
export const medicalReportTests = pgTable('medical_report_tests', {
  id: text('id').primaryKey(),
  reportId: text('report_id').notNull().references(() => medicalReports.id, { onDelete: 'cascade' }),
  testOrder: integer('test_order').notNull().default(0),
  testCode: text('test_code').notNull(),
  testName: text('test_name').notNull(),
  category: text('category'),
  result: text('result').notNull().default(''),
  note: text('note'),
  unit: text('unit'),
  refMin: real('ref_min'),
  refMax: real('ref_max'),
  refText: text('ref_text'),
  price: real('price').default(0),
  equipmentId: text('equipment_id'),
  equipmentName: text('equipment_name'),
  scaleId: text('scale_id'),
  evaluationType: text('evaluation_type'),
  scientific: text('scientific'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

/** Bảng Master: Hóa Đơn Thu Phí */
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  reportId: text('report_id'),
  patientCode: text('patient_code'),
  patientName: text('patient_name'),
  patientPhone: text('patient_phone'),
  doctorName: text('doctor_name'),
  cashierName: text('cashier_name'),
  status: text('status').notNull().default('Chưa thu phí'),
  paymentMethod: text('payment_method').default('Tiền mặt'),
  subtotal: real('subtotal').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  discountPercent: real('discount_percent').notNull().default(0),
  discountType: text('discount_type').default('amount'),
  surchargeAmount: real('surcharge_amount').notNull().default(0),
  finalAmount: real('final_amount').notNull().default(0),
  paidAt: timestamp('paid_at'),
  cancelledAt: timestamp('cancelled_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/** Bảng Detail: Dịch vụ trong hóa đơn (Invoice Row Snapshot) */
export const invoiceItems = pgTable('invoice_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  itemOrder: integer('item_order').notNull().default(0),
  code: text('code').notNull(),
  name: text('name').notNull(),
  price: real('price').notNull().default(0),
  quantity: real('quantity').notNull().default(1),
  unit: text('unit'),
  total: real('total').notNull().default(0)
});

/** Bảng Lưu Trữ Bản Chụp Hệ Thống (Database Snapshots) */
export const databaseSnapshots = pgTable('database_snapshots', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  data: jsonb('data').notNull(),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});
