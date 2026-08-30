export type Gender = 'Nam' | 'Nữ' | 'Khác';

export interface PatientInfo {
  name: string;
  age: number | string;
  gender: Gender;
  address?: string;
  phone?: string;
  code?: string;
  sampleId?: string;
  orderNumber?: number | string;
  testDate?: string;
  orderDate?: string;
  sampleCollectionTime?: string;
  sampleReceiveTime?: string;
  diagnosis?: string;
}

export interface CatalogItem {
  code: string;
  category: string;
  name: string;
  refMin?: number | null;
  refMax?: number | null;
  unit: string;
  refText: string;
  price?: number | null;
  scientific?: string | null;
  evaluationType?: string | null;
  scaleId?: string | null;
  referenceRangeId?: string | null;
}

export interface CatalogItemEquipmentLink {
  id: string;
  catalogCode: string;
  equipmentId: string;
  refMin?: number | null;
  refMax?: number | null;
  unit?: string | null;
  refText?: string | null;
  scaleId?: string | null;
  isDefault?: boolean;
}

export interface PackageItemDetail {
  code: string;
  equipmentId?: string | null;
}

export interface TestPackage {
  id: string;
  name: string;
  items: (string | PackageItemDetail)[];
  price: number;
}

export function getPkgCodes(items: (string | PackageItemDetail)[]): string[] {
  return items.map((it) => (typeof it === 'string' ? it : it.code));
}

export function normalizePkgItems(items: (string | PackageItemDetail)[]): PackageItemDetail[] {
  return items.map((it) => (typeof it === 'string' ? { code: it, equipmentId: null } : it));
}

export function computeItemEquipmentLinkKey(catalogCode: string, equipmentId: string): string {
  return `${catalogCode}__${equipmentId}`;
}

export interface TestGroup {
  id: string;
  name: string;
}

export interface TestEquipment {
  id: string;
  name: string;
  code?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  phone?: string;
}

export interface SelectedTest extends CatalogItem {
  result: string;
  note?: string;
  customRefText?: string;
}

export interface MedicalReport {
  id?: string;
  code?: string;
  patient: PatientInfo;
  selectedTests: SelectedTest[];
  conclusion?: string;
  doctorName?: string;
  status?: string;
  cloudPdfUrl?: string;
  qrCodeDataUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category?: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  reportId?: string;
  patient: PatientInfo;
  items: InvoiceItem[];
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  createdAt: string;
  creatorName?: string;
  doctorName?: string;
}

export interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  website?: string;
  defaultDoctor: string;
  logoUrl?: string;
  stampUrl?: string;
  bankId?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  bankBranch?: string;
  bankQrImageUrl?: string;
  cashierName?: string;
  accountantName?: string;
}

export interface CloudDbConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  cloudinaryPreset?: string;
  cloudinaryCloudName?: string;
}

export interface ZaloZnsConfig {
  enabled: boolean;
  appId: string;
  secretKey: string;
  oaId: string;
  accessToken: string;
  refreshToken?: string;
  templateId: string;
  autoSendOnExport: boolean;
  proxyUrl?: string;
}

export interface BatchImportRow {
  patient: PatientInfo;
  selectedTests: SelectedTest[];
  conclusion?: string;
  doctorName?: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ExportStepName =
  | 'RENDERING_CANVAS'
  | 'CONVERTING_PDF'
  | 'UPLOADING_SUPABASE'
  | 'UPLOADING_CLOUDINARY'
  | 'GENERATING_QR'
  | 'SAVING_LOCAL'
  | 'COMPLETED';

export interface ExportErrorDetail {
  message: string;
  step?: ExportStepName;
  originalError?: any;
}

export interface BatchExportProgress {
  total: number;
  current: number;
  successCount: number;
  failCount: number;
  currentPatientName?: string;
}
