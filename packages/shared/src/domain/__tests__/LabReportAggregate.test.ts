import { describe, it, expect } from 'vitest';
import { LabReportAggregate } from '../aggregates/LabReportAggregate';
import { SelectedTest } from '../types';

describe('LabReportAggregate', () => {
  const sampleTests: SelectedTest[] = [
    {
      code: 'GLU',
      name: 'Glucose máu',
      category: 'Sinh Hóa Máu',
      unit: 'mmol/L',
      refText: '4.1 - 5.9',
      result: '5.2',
      note: 'Bình thường'
    }
  ];

  it('should create initial report aggregate with RESULTED status when tests have results', () => {
    const report = LabReportAggregate.create({
      code: 'BN-20260905-001',
      patient: {
        code: 'BN-20260905-001',
        secretToken: 'TOK123',
        name: 'Nguyễn Văn A',
        dob: '1990',
        gender: 'Nam',
        phone: '0912345678',
        address: 'Hà Nội',
        diagnosis: 'Khám sức khỏe'
      },
      doctorName: 'BS. Nguyễn Thị Thành Trung',
      selectedTests: sampleTests,
      conclusion: 'Chỉ số đường huyết ổn định'
    });

    expect(report.code).toBe('BN-20260905-001');
    expect(report.patient.name).toBe('Nguyễn Văn A');
    expect(report.documentState.status).toBe('RESULTED');
    expect(report.kind.type).toBe('clinical');
    expect(report.isDirty()).toBe(false);
  });

  it('should automatically mark document state as OUTDATED when tests are modified after cloud export', () => {
    const report = LabReportAggregate.create({
      code: 'BN-20260905-001',
      patient: {
        code: 'BN-20260905-001',
        secretToken: 'TOK123',
        name: 'Nguyễn Văn A',
        dob: '1990',
        gender: 'Nam',
        phone: '0912345678',
        address: 'Hà Nội',
        diagnosis: 'Khám sức khỏe'
      },
      doctorName: 'BS. Nguyễn Thị Thành Trung',
      selectedTests: sampleTests
    });

    // 1. Ghi nhận đã xuất PDF Cloud
    report.recordCloudExport('https://cloud.example.com/pdf1.pdf', 'data:image/png;base64,qr123');
    expect(report.documentState.status).toBe('EXPORTED');
    expect(report.cloudPdfUrl).toBe('https://cloud.example.com/pdf1.pdf');
    expect(report.pdfVersion).toBe(1);

    // 2. Chỉnh sửa kết quả xét nghiệm
    report.updateTests([
      {
        ...sampleTests[0],
        result: '8.5',
        note: 'Đường huyết tăng cao'
      }
    ]);

    // 3. Aggregate phải TỰ ĐỘNG chuyển sang OUTDATED!
    expect(report.documentState.status).toBe('OUTDATED');
    if (report.documentState.status === 'OUTDATED') {
      expect(report.documentState.dirtyReasons.length).toBeGreaterThan(0);
      expect(report.documentState.previousPdfUrl).toBe('https://cloud.example.com/pdf1.pdf');
    }

    // 4. Xuất lại PDF mới -> Tăng version và trở về EXPORTED
    report.recordCloudExport('https://cloud.example.com/pdf2.pdf', 'data:image/png;base64,qr456');
    expect(report.documentState.status).toBe('EXPORTED');
    expect(report.pdfVersion).toBe(2);
  });

  it('should serialize to snapshot and restore without data loss', () => {
    const original = LabReportAggregate.create({
      code: 'BN-20260905-002',
      patient: {
        code: 'BN-20260905-002',
        secretToken: 'TOK456',
        name: 'Trần Thị B',
        dob: '1995',
        gender: 'Nữ',
        phone: '0987654321',
        address: 'Đà Nẵng',
        diagnosis: 'Dị ứng thức ăn'
      },
      doctorName: 'BS. Lê Phan Anh',
      selectedTests: [
        {
          code: 'F1',
          name: 'Lòng trắng trứng (Egg white)',
          category: 'Dị Nguyên Thực Phẩm',
          unit: 'IU/mL',
          refText: '< 0.35',
          result: '15.4',
          note: 'Độ 3'
        }
      ]
    });

    const snapshot = original.toSnapshot();
    expect(snapshot.isAllergen).toBe(true);

    const restored = LabReportAggregate.fromSnapshot(snapshot);
    expect(restored.code).toBe(original.code);
    expect(restored.patient.name).toBe(original.patient.name);
    expect(restored.kind.type).toBe('allergen');
    expect(restored.selectedTests[0].result).toBe('15.4');
  });

  it('should accurately detect dirty state when any deep field is edited', () => {
    const report = LabReportAggregate.create({
      code: 'BN-20260905-003',
      patient: {
        code: 'BN-20260905-003',
        secretToken: 'TOK789',
        name: 'Lê Văn C',
        dob: '1985',
        gender: 'Nam',
        phone: '0901234567',
        address: 'Quảng Bình',
        diagnosis: 'Kiểm tra gan mật'
      },
      doctorName: 'BS. Thành Trung',
      selectedTests: sampleTests
    });

    expect(report.isDirty()).toBe(false);

    // Chỉnh sửa tên bác sĩ -> isDirty() = true
    report.updateDoctor('BS. Mới');
    expect(report.isDirty()).toBe(true);

    report.markClean();
    expect(report.isDirty()).toBe(false);

    // Chỉnh sửa kết quả chỉ số -> isDirty() = true
    report.updateTests([{ ...sampleTests[0], result: '6.0' }]);
    expect(report.isDirty()).toBe(true);
  });

  it('should handle numeric results (including 0) and non-string types safely without throwing', () => {
    // Test with result as number 0 (falsy in JS if not converted to string)
    const reportWithZero = LabReportAggregate.create({
      code: 'BN-20260905-004',
      patient: {
        code: 'BN-20260905-004',
        secretToken: 'TOK000',
        name: 'Hoàng Văn D',
        dob: '1970',
        gender: 'Nam',
        phone: '0901112233',
        address: 'Hà Nội',
        diagnosis: 'Kiểm tra'
      },
      doctorName: 'BS. Trung',
      selectedTests: [
        {
          code: 'KET',
          name: 'Ketone nước tiểu',
          // @ts-expect-error test runtime robustness against numeric result
          result: 0,
          unit: 'mmol/L'
        }
      ]
    });

    expect(reportWithZero.documentState.status).toBe('RESULTED');
    if (reportWithZero.documentState.status === 'RESULTED') {
      expect(reportWithZero.documentState.completedTests).toBe(1);
    }

    // Test fromSnapshot with non-string results
    const snapshot = reportWithZero.toSnapshot();
    const restored = LabReportAggregate.fromSnapshot(snapshot);
    expect(restored.documentState.status).toBe('RESULTED');
  });

  it('should preserve pdfGeneratedAt when report transitions to OUTDATED', () => {
    const report = LabReportAggregate.create({
      code: 'BN-OUTDATED-001',
      patient: {
        code: 'BN-OUTDATED-001',
        secretToken: 'TOK999',
        name: 'Nguyen Van Outdated',
        dob: '1992',
        gender: 'Nam',
        phone: '0901234999',
        address: 'Hue',
        diagnosis: 'Test Outdated'
      },
      doctorName: 'BS. Trung',
      selectedTests: sampleTests
    });

    report.recordCloudExport('https://cloud.example.com/pdf1.pdf', 'data:image/png;base64,qr123');
    expect(report.documentState.status).toBe('EXPORTED');
    const exportedAt = (report.documentState as any).exportedAt;

    // Modify test to make it OUTDATED
    report.updateTests([{ ...sampleTests[0], result: '9.0' }]);
    expect(report.documentState.status).toBe('OUTDATED');

    const snap = report.toSnapshot();
    expect(snap.pdfGeneratedAt).toBe(exportedAt);
    expect(snap.isPdfOutdated).toBe(true);

    const restored = LabReportAggregate.fromSnapshot(snap);
    expect(restored.documentState.status).toBe('OUTDATED');
    if (restored.documentState.status === 'OUTDATED') {
      expect(restored.documentState.lastExportedAt).toBe(exportedAt);
    }
  });
});

