export type Gender = 'Nam' | 'Nữ' | 'Khác';

export type AllergenGrade = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ResultStatus = 'normal' | 'low' | 'high';

// ─── DOMAIN STATUS TYPES ─────────────────────────────────────────────────────
export type ClinicalStatus = 'Chờ xét nghiệm' | 'Đã có kết quả' | 'Đã trả kết quả';
export type DocumentStatus = 'Chưa xuất PDF' | 'Đã xuất Cloud' | 'Cần cập nhật PDF';
export type BillingStatus = 'Chưa thu phí' | 'Đã thanh toán' | 'Đã hủy / Hoàn tiền';
export type SampleStatus = 'Đạt' | 'Không đạt' | 'Đang lấy mẫu';
export type PaymentMethod = 'Tiền mặt' | 'Chuyển khoản (VietQR)' | 'Quẹt thẻ' | 'Khác';
export type InvoiceStatus = BillingStatus;
export type ReportStatus = 
  | 'Chờ xét nghiệm' 
  | 'Đã có kết quả' 
  | 'Đã xuất Cloud' 
  | 'Cần cập nhật PDF' 
  | 'Đã trả kết quả';

export interface Patient {
  code: string;
  secretToken: string;
  name: string;
  dob: string;
  gender: Gender;
  phone: string;
  address: string;
  diagnosis: string;
  doctor?: string;
  sampleCode?: string;
  sampleStatus?: SampleStatus | string;
  orderedAt?: string;
  paidAt?: string;
  receivedAt?: string;
  returnedAt?: string;
}

export interface CatalogItem {
  category: string;
  code: string;
  name: string;
  refMin: number | null;
  refMax: number | null;
  unit: string;
  refText: string;
  price?: number;
  scientific?: string;
  equipment?: string;
}

export interface SelectedTest extends CatalogItem {
  result: string;
  note: string;
}

export interface TestPackage {
  id: string;
  name: string;
  codes: string[];
  price: number;
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

export interface CloudDbConfig {
  enabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  autoSync?: boolean;
}

export interface InvoiceItem {
  code: string;
  name: string;
  price: number;
  quantity?: number;
  discount?: number;
  category?: string;
  unit?: string;
}

export interface Invoice {
  id: string;
  code: string;
  createdAt: string;
  patientName: string;
  patientDob: string;
  patientPhone: string;
  patientGender: Gender;
  doctorName: string;
  items: InvoiceItem[];
  totalAmount: number;
  discountPercent: number;
  discountAmount?: number;
  surchargeAmount?: number;
  surchargeNote?: string;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  notes?: string;
  patientCode?: string;
  packageName?: string;
  cashierName?: string;
  reportId?: string;
  paidAt?: string;
}

export interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  website?: string;
  defaultDoctor: string;
  logoUrl?: string;
  stampUrl?: string;
  bankId?: string;          // Mã định danh ngân hàng (VD: VBA, ICB, VCB, MB, TCB...)
  bankName?: string;        // Tên ngân hàng (VD: Agribank, VietinBank, Vietcombank...)
  bankAccountNo?: string;   // Số tài khoản
  bankAccountName?: string; // Tên chủ tài khoản
  bankBranch?: string;      // Chi nhánh ngân hàng (VD: Agribank - Chi nhánh Lý Thái Tổ - Quảng Bình)
  bankQrImageUrl?: string;  // Ảnh QR code tùy chỉnh do người dùng upload
  cashierName?: string;     // Tên người lập phiếu (VD: Lê Phan Anh)
  accountantName?: string;  // Tên kế toán xác nhận (VD: Trần Thị Thanh Hương)
}

export interface AllergenGradeResult {
  grade: AllergenGrade;
  iuValue: string;
  note: string;
  statusStr: 'Dương tính' | 'Âm tính';
}

export interface TestResultEvaluation {
  status: ResultStatus;
  label: string;
}

export interface StorageResult {
  success: boolean;
  path?: string;
  error?: string;
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

export interface ZaloSendResult {
  success: boolean;
  msgId?: string;
  error?: number;
  message?: string;
}

export interface MedicalReport {
  id: string;
  code: string;
  sampleCode: string;
  createdAt: string;
  updatedAt: string;
  patient: Patient;
  doctorName: string;
  selectedTests: SelectedTest[];
  conclusion: string;
  isAllergen: boolean;
  cloudPdfUrl?: string;
  qrCodeDataUrl?: string;
  invoiceId?: string;
  status: ReportStatus;
  testCount: number;
  zaloSentAt?: string;
  zaloMsgId?: string;
  /** Dấu mốc thời gian xuất PDF gần nhất (ISO String) */
  pdfGeneratedAt?: string;
  /** Số phiên bản PDF (1, 2, 3...) */
  pdfVersion?: number;
  /** Cờ đánh dấu dữ liệu đã bị chỉnh sửa sau lần xuất PDF gần nhất */
  isPdfOutdated?: boolean;
}

// ─── BATCH IMPORT / EXPORT TYPES ─────────────────────────────────────────────

export interface BatchImportRow {
  patient: Patient;
  selectedTests: SelectedTest[];
  conclusion: string;
  doctorName: string;
}

export interface BatchExportProgress {
  total: number;
  completed: number;
  current: string;
  status: 'idle' | 'running' | 'done' | 'cancelled' | 'error';
  errors: Array<{ code: string; patientName: string; error: string }>;
  results: Array<{ code: string; patientName: string; cloudUrl: string; qrDataUrl: string; blob: Blob }>;
}

