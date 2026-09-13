import { describe, it, expect } from 'vitest';

/**
 * Task 1 - Reproduction Test Suite
 * Kiểm chứng thuật toán dirty check và state synchronization
 */

interface TestItemSnapshot {
  code: string;
  result: string;
  note: string;
  equipmentId?: string | null;
  unit?: string;
  refText?: string;
}

interface PatientSnapshot {
  name: string;
  dob: string;
  gender: string;
  phone: string;
  address: string;
  diagnosis: string;
  sampleCode: string;
}

interface ReportSnapshot {
  id: string;
  patient: PatientSnapshot;
  doctorName?: string;
  conclusion?: string;
  selectedTests: TestItemSnapshot[];
}

// Hàm dirtyCheck được sao chép chính xác 100% từ WorkspaceContext.tsx:121-150
function computeHasUnsavedData(params: {
  currentReportId: string | null;
  patient: PatientSnapshot;
  selectedTests: TestItemSnapshot[];
  conclusion: string;
  doctorName: string;
  origReport?: ReportSnapshot;
}): boolean {
  const { currentReportId, patient, selectedTests, conclusion, doctorName, origReport } = params;
  if (!currentReportId) {
    return Boolean(patient?.name?.trim()) || selectedTests.length > 0 || Boolean(conclusion?.trim());
  }
  const orig = origReport;
  if (!orig) return false;

  const patientChanged =
    patient.name !== orig.patient.name ||
    patient.dob !== orig.patient.dob ||
    patient.gender !== orig.patient.gender ||
    patient.phone !== orig.patient.phone ||
    patient.address !== orig.patient.address ||
    patient.diagnosis !== orig.patient.diagnosis ||
    patient.sampleCode !== orig.patient.sampleCode;
  if (patientChanged) return true;

  if ((conclusion || '') !== (orig.conclusion || '')) return true;
  
  // DÒNG CODE GÂY BUG 2:
  if (doctorName && doctorName !== orig.doctorName) return true;

  if (selectedTests.length !== orig.selectedTests.length) return true;
  for (let i = 0; i < selectedTests.length; i++) {
    const cur = selectedTests[i];
    const o = orig.selectedTests[i];
    // DÒNG CODE GÂY BUG 2 (BỎ SÓT unit, refText):
    if (!o || cur.code !== o.code || cur.result !== o.result || cur.note !== o.note || cur.equipmentId !== o.equipmentId) {
      return true;
    }
  }

  return false;
}

describe('Task 1: Kiểm chứng lỗi State UI & Workspace (Bug 1 - Bug 6)', () => {
  it('[Bug 2 - CONFIRMED] Thuật toán dirtyCheck bỏ qua khi xóa trắng Bác sĩ chỉ định', () => {
    const origReport: ReportSnapshot = {
      id: 'rep-001',
      patient: { name: 'Nguyen Van A', dob: '1990', gender: 'male', phone: '', address: '', diagnosis: '', sampleCode: 'SP01' },
      doctorName: 'BS. Trần Hoài Long',
      conclusion: 'Bình thường',
      selectedTests: [{ code: 'GLU', result: '5.2', note: '', equipmentId: 'EQ1', unit: 'mmol/L', refText: '3.9-6.4' }]
    };

    // Người dùng xóa trắng bác sĩ chỉ định (doctorName = '')
    const isDirty = computeHasUnsavedData({
      currentReportId: 'rep-001',
      patient: { ...origReport.patient },
      selectedTests: [...origReport.selectedTests],
      conclusion: origReport.conclusion || '',
      doctorName: '', // ĐÃ BỊ XÓA TRẮNG
      origReport
    });

    // Kỳ vọng logic: Người dùng đã sửa (từ có bác sĩ thành không có) -> PHẢI là dirty (true).
    // Nhưng thực tế code hiện tại: trả về FALSE (bỏ sót thay đổi)!
    expect(isDirty).toBe(false); // Xác thực BUG 2 THỰC SỰ TỒN TẠI VÀ TRẢ VỀ FALSE!
  });

  it('[Bug 2 - CONFIRMED] Thuật toán dirtyCheck bỏ qua khi sửa đơn vị xét nghiệm (unit) hoặc khoảng tham chiếu (refText)', () => {
    const origReport: ReportSnapshot = {
      id: 'rep-001',
      patient: { name: 'Nguyen Van A', dob: '1990', gender: 'male', phone: '', address: '', diagnosis: '', sampleCode: 'SP01' },
      doctorName: 'BS. Long',
      conclusion: '',
      selectedTests: [{ code: 'GLU', result: '5.2', note: '', equipmentId: 'EQ1', unit: 'mmol/L', refText: '3.9-6.4' }]
    };

    // Người dùng sửa đổi đơn vị tính (unit: mg/dL) và khoảng tham chiếu tùy biến (refText: 70-110)
    const modifiedTests: TestItemSnapshot[] = [{
      code: 'GLU',
      result: '5.2',
      note: '',
      equipmentId: 'EQ1',
      unit: 'mg/dL', // ĐÃ SỬA ĐƠN VỊ
      refText: '70-110' // ĐÃ SỬA THAM CHIẾU
    }];

    const isDirty = computeHasUnsavedData({
      currentReportId: 'rep-001',
      patient: { ...origReport.patient },
      selectedTests: modifiedTests,
      conclusion: '',
      doctorName: 'BS. Long',
      origReport
    });

    // Thực tế: vòng lặp bỏ qua unit và refText, nên trả về FALSE!
    expect(isDirty).toBe(false); // Xác thực BUG 2 BỎ SÓT THAY ĐỔI UNIT/REFTEXT!
  });
});
