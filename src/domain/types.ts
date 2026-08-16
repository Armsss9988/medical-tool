export type Gender = 'Nam' | 'Nữ' | 'Khác';

export type AllergenGrade = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ToastType = 'success' | 'error' | 'info';

export type ResultStatus = 'normal' | 'low' | 'high';

export interface Patient {
  code: string;
  secretToken: string;
  name: string;
  dob: string;
  gender: Gender;
  phone: string;
  address: string;
  diagnosis: string;
  sampleCode?: string;
  sampleStatus?: string;
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
  category?: string;
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
  finalAmount: number;
  paymentMethod: 'Tiền mặt' | 'Chuyển khoản (VietQR)' | 'Quẹt thẻ';
  status: 'Đã thanh toán' | 'Chờ thanh toán';
  notes?: string;
}

export interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  website?: string;
  defaultDoctor: string;
  logoUrl?: string;
  stampUrl?: string;
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

export type ReportStatus = 'Chờ xét nghiệm' | 'Đã có kết quả' | 'Đã xuất Cloud' | 'Đã trả kết quả';

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
}
