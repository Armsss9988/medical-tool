import { describe, it, expect } from 'vitest';
import { LabReportAggregate } from '../aggregates/LabReportAggregate';
import { InvoiceAggregate } from '../aggregates/InvoiceAggregate';
import { Patient, MedicalReport, SelectedTest } from '../types';

describe('Task 2: Kiểm chứng lỗi Domain Aggregates & FSM (Bug 7 - Bug 10)', () => {
  const dummyPatient: Patient = {
    code: 'BN001',
    secretToken: 'TOKEN',
    name: 'Nguyễn Văn B',
    dob: '1985',
    gender: 'Nam',
    phone: '0901234567',
    address: 'Hà Nội',
    diagnosis: '',
    sampleCode: 'SP001',
    sampleStatus: 'Đạt',
    orderedAt: '2026-01-01T08:00:00Z',
    receivedAt: '2026-01-01T08:15:00Z',
    returnedAt: '2026-01-01T09:00:00Z',
    doctor: 'BS. Long'
  };

  const sampleTest: SelectedTest = {
    code: 'GLU',
    name: 'Glucose',
    result: '5.0',
    unit: 'mmol/L',
    refMin: 3.9,
    refMax: 6.4,
    refText: '3.9 - 6.4',
    note: '',
    category: 'Sinh hóa'
  };

  it('[Bug 7 - FIXED] OutdatedStateNode bảo toàn chính xác thời điểm xuất PDF gốc khi sửa đổi thông tin', () => {
    const originalExportTime = '2025-01-01T08:00:00.000Z';

    // Phiếu đã xuất bản từ năm 2025 với link cloud và mốc thời gian xuất bản rõ ràng
    const snapshot: MedicalReport = {
      id: 'REP-001',
      code: 'REP-001',
      sampleCode: 'SP001',
      conclusion: 'Bình thường',
      patient: dummyPatient,
      doctorName: 'BS. Long',
      selectedTests: [{ ...sampleTest }],
      cloudPdfUrl: 'https://cloud.storage/report-2025.pdf',
      qrCodeDataUrl: 'data:image/png;base64,qr',
      pdfVersion: 1,
      pdfGeneratedAt: originalExportTime,
      status: 'Đã xuất Cloud',
      isAllergen: false,
      testCount: 1,
      createdAt: '2025-01-01T07:50:00.000Z',
      updatedAt: '2025-01-01T08:00:00.000Z'
    };

    const report = LabReportAggregate.fromSnapshot(snapshot);
    expect(report.documentState.status).toBe('EXPORTED');

    // Sau đó người dùng sửa thông tin hành chính bệnh nhân (đổi SĐT)
    report.updatePatient({ phone: '0988888888' });

    expect(report.documentState.status).toBe('OUTDATED');
    const outdatedState = report.documentState as { status: string; lastExportedAt: string };

    // KỲ VỌNG NGHIỆP VỤ: outdatedState.lastExportedAt phải giữ nguyên mốc xuất file PDF gốc năm 2025 (originalExportTime)
    expect(outdatedState.lastExportedAt).toBe(originalExportTime);
  });

  it('[Bug 8 - FIXED] updateReport bảo toàn trạng thái FSM, không bị thụt lùi từ DELIVERED về RESULTED', () => {
    const report = LabReportAggregate.create({
      code: 'REP-002',
      patient: dummyPatient,
      doctorName: 'BS. Long',
      selectedTests: [{ ...sampleTest }]
    });

    // Chuyển sang DELIVERED (Đã gửi cho bệnh nhân qua Zalo)
    report.recordCloudExport('https://cloud.storage/rep.pdf', 'data:image/png;base64,qr', 1);
    report.recordZaloSent('MSG-12345');

    expect(report.documentState.status).toBe('DELIVERED');

    // Sau đó một tiến trình legacy cập nhật phiếu với status: 'Đã có kết quả'
    report.updateReport({
      status: 'Đã có kết quả'
    });

    // KỲ VỌNG TOÀN VẸN FSM: Không bị thụt lùi từ DELIVERED về RESULTED
    expect(report.documentState.status).toBe('DELIVERED');
  });

  it('[Bug 9 - FIXED] markPaymentVoided() bảo lưu invoiceId trên Report phục vụ audit trail', () => {
    const report = LabReportAggregate.create({
      code: 'REP-003',
      patient: dummyPatient,
      doctorName: 'BS. Long',
      selectedTests: [],
      invoiceId: 'INV-99999'
    });

    expect(report.invoiceId).toBe('INV-99999');

    // Thu ngân hủy hóa đơn INV-99999
    report.markPaymentVoided();

    // KỲ VỌNG KIỂM TOÁN: invoiceId vẫn phải được lưu vết
    expect(report.invoiceId).toBe('INV-99999');
    expect(report.isPaid).toBe(false);
  });

  it('[Bug 10 - FIXED] InvoiceAggregate chặn sửa chiết khấu hoặc phụ phí trên hóa đơn đã thanh toán (PAID)', () => {
    const invoice = InvoiceAggregate.create({
      code: 'HD-001',
      reportId: 'REP-001',
      patientName: 'Nguyen Van B',
      items: [{ code: 'GLU', name: 'Glucose', price: 500000, quantity: 1 }]
    });

    // Thu ngân xác nhận thu tiền 500.000đ
    invoice.markPaid('Tiền mặt', 'ThuNgan01');
    expect(invoice.isPaid).toBe(true);
    expect(invoice.finalAmount.amount).toBe(500000);

    // KỲ VỌNG NGHIỆP VỤ: Hóa đơn đã chốt và thu tiền BỊ CẤM áp chiết khấu / phụ phí
    expect(() => invoice.applyDiscount(100000)).toThrow('Không thể thay đổi chiết khấu trên hóa đơn đã thanh toán');
    expect(() => invoice.applySurcharge(50000)).toThrow('Không thể thay đổi phụ phí trên hóa đơn đã thanh toán');

    // Bất biến tài chính được bảo toàn tuyệt đối
    expect(invoice.finalAmount.amount).toBe(500000);
    expect(invoice.paymentState.status).toBe('PAID');
  });
});
