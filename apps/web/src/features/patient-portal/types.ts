export interface PortalTestItem {
  testCode: string;
  testName: string;
  category: string;
  result: string;
  unit: string;
  refMin: number | null;
  refMax: number | null;
  refText: string;
  note: string;
  evaluationType?: 'range' | 'scale' | string;
  scaleId?: string | null;
  evaluation: 'NORMAL' | 'ABNORMAL';
}

export interface PortalPaymentInfo {
  isPaid: boolean;
  status: string;
  totalAmount?: number | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  invoiceCode?: string | null;
}

export interface PortalReportData {
  id: string;
  code: string;
  sampleCode: string;
  status: string;
  patientName: string;
  patientDob?: string;
  patientGender?: string;
  patientAddress?: string;
  patientDiagnosis?: string;
  doctorName?: string;
  conclusion?: string;
  isAllergen?: boolean;
  cloudPdfUrl?: string;
  pdfGeneratedAt?: string;
  createdAt: string;
  isPaid?: boolean;
  paymentStatus?: string;
  paymentAmount?: number | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  invoiceCode?: string | null;
  payment?: PortalPaymentInfo;
  tests: PortalTestItem[];
}

export interface PortalClinicData {
  name: string;
  address: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  stampUrl?: string;
}

export interface RecentLookupItem {
  code: string;
  patientName: string;
  date: string;
  testCount: number;
}
