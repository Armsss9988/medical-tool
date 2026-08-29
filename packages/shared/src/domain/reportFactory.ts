import type { MedicalReport, Patient, SelectedTest } from './types';
import { hasAllergenTests } from './allergenDetector';
import { DEFAULTS } from './constants/defaults';

// ─── REPORT FACTORY ─────────────────────────────────────────────────────────
// Single source of truth for constructing MedicalReport objects.
// RULE: Never construct MedicalReport manually in components/App.tsx.
//       Always use this factory.

export interface BuildCurrentReportParams {
  id?: string;
  patient: Patient;
  selectedTests: SelectedTest[];
  conclusion: string;
  doctorName: string;
  cloudPdfUrl?: string;
  qrCodeDataUrl?: string;
}

/**
 * Xây dựng MedicalReport snapshot từ dữ liệu workspace hiện tại.
 * Dùng khi cần tạo report object tạm (Zalo, Preview) mà không lưu vào storage.
 *
 * Thay thế 3+ chỗ tạo MedicalReport thủ công trong App.tsx.
 */
export function buildCurrentReport(params: BuildCurrentReportParams): MedicalReport {
  const { patient, selectedTests, conclusion, doctorName, cloudPdfUrl, qrCodeDataUrl } = params;
  const now = new Date().toISOString();
  const code = patient.code || `BN-${Date.now()}`;
  const isAllergen = hasAllergenTests(selectedTests);

  const resolvedDoctorName = doctorName || patient.doctor || DEFAULTS.DOCTOR_NAME;

  return {
    id: params.id || code,
    code,
    sampleCode: patient.sampleCode || code,
    createdAt: now,
    updatedAt: now,
    patient: { ...patient },
    doctorName: resolvedDoctorName,
    selectedTests: [...selectedTests],
    conclusion: conclusion || '',
    isAllergen,
    cloudPdfUrl,
    qrCodeDataUrl,
    status: cloudPdfUrl ? 'Đã xuất Cloud' : 'Đã có kết quả',
    testCount: selectedTests.length,
  };
}

/**
 * Resolve doctor name với fallback chain chuẩn.
 * Thay thế pattern `doctorName || patient.doctor || 'BS. Trần Hoài Long'` lặp lại 6+ lần.
 */
export function resolveDoctorName(doctorName?: string, patientDoctor?: string): string {
  return doctorName || patientDoctor || DEFAULTS.DOCTOR_NAME;
}
