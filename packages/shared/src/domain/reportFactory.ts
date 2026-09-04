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

  const resolvedDoctorName = (patient.doctor && patient.doctor.trim()) || (doctorName && doctorName.trim()) || DEFAULTS.DOCTOR_NAME;

  return {
    id: params.id || code,
    code,
    sampleCode: patient.sampleCode || code,
    createdAt: now,
    updatedAt: now,
    patient: { ...patient, doctor: resolvedDoctorName },
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
 * Ưu tiên Bác sĩ được chỉ định/chọn trước, sau đó tới fallback, cuối cùng là mặc định.
 */
export function resolveDoctorName(primary?: string, fallback?: string): string {
  return (primary && primary.trim()) || (fallback && fallback.trim()) || DEFAULTS.DOCTOR_NAME;
}
