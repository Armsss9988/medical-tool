import { describe, it, expect } from 'vitest';
import { LabReportAggregate } from '../aggregates/LabReportAggregate';
import { InvoiceAggregate } from '../aggregates/InvoiceAggregate';
import { Patient, Invoice } from '../types';

describe('Domain Aggregates Lifecycle & State Transitions', () => {
  const mockPatient: Patient = {
    code: 'BN-TEST01',
    secretToken: 'TOK123',
    name: 'Nguyễn Văn A',
    dob: '01/01/1990',
    gender: 'Nam',
    phone: '0901234567',
    address: 'Hà Nội',
    diagnosis: 'Kiểm tra sức khỏe'
  };

  it('LabReportAggregate: should initialize report with DRAFT when no results exist', () => {
    const aggregate = LabReportAggregate.create({
      code: 'XN-001',
      sampleCode: 'MAU-001',
      patient: mockPatient,
      doctorName: 'BS. Long',
      selectedTests: [{ category: 'Sinh hóa', code: 'GLU', name: 'Glucose', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '', result: '', note: '' }]
    });

    const report = aggregate.toSnapshot();
    expect(report.status).toBe('Chờ xét nghiệm');
    const summary = aggregate.computeStatusSummary(false);
    expect(summary.clinical.isDraft()).toBe(true);
    expect(summary.billing.isUnpaid()).toBe(true);
    expect(summary.document.isUnexported()).toBe(true);
  });

  it('LabReportAggregate: should compute PAID when invoice exists', () => {
    const aggregate = LabReportAggregate.create({
      code: 'XN-002',
      sampleCode: 'MAU-002',
      patient: mockPatient,
      doctorName: 'BS. Long',
      selectedTests: [{ category: 'Sinh hóa', code: 'GLU', name: 'Glucose', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '', result: '5.2', note: 'Bình thường' }]
    });

    const summary = aggregate.computeStatusSummary(true);
    expect(summary.clinical.isResulted()).toBe(true);
    expect(summary.billing.isPaid()).toBe(true);
  });

  it('LabReportAggregate: should handle onPaymentCollected and onPaymentVoided cleanly', () => {
    const aggregate = LabReportAggregate.create({
      code: 'XN-003',
      sampleCode: 'MAU-003',
      patient: mockPatient,
      doctorName: 'BS. Long',
      selectedTests: []
    });

    aggregate.linkInvoice('inv-123', false);
    const attached = aggregate.toSnapshot();
    expect(attached.invoiceId).toBe('inv-123');
    expect(attached.patient.paidAt).toBeUndefined();

    aggregate.markPaymentCollected('inv-123', '2026-08-25T10:00:00.000Z');
    const collected = aggregate.toSnapshot();
    expect(collected.patient.paidAt).toBe('2026-08-25T10:00:00.000Z');
    expect(collected.invoiceId).toBe('inv-123');

    aggregate.markPaymentVoided();
    const voided = aggregate.toSnapshot();
    expect(voided.patient.paidAt).toBeUndefined();
    expect(voided.invoiceId).toBeUndefined();
  });

  it('InvoiceAggregate: should mark paid and mark refunded correctly', () => {
    const mockInvoice: Invoice = {
      id: 'inv-001',
      code: 'HD-001',
      createdAt: new Date().toISOString(),
      patientName: 'Nguyễn Văn A',
      patientDob: '1990',
      patientPhone: '0901234567',
      patientGender: 'Nam',
      doctorName: 'BS. Long',
      items: [],
      totalAmount: 100000,
      discountPercent: 0,
      finalAmount: 100000,
      paymentMethod: 'Tiền mặt',
      status: 'Chưa thu phí'
    };

    const aggregate = InvoiceAggregate.fromSnapshot(mockInvoice);
    expect(aggregate.isPaid).toBe(false);

    aggregate.markPaid('Chuyển khoản (VietQR)');
    const paidInvoice = aggregate.toSnapshot();
    expect(paidInvoice.status).toBe('Đã thanh toán');
    expect(paidInvoice.paymentMethod).toBe('Chuyển khoản (VietQR)');

    aggregate.refund('Bệnh nhân yêu cầu hủy');
    const refundedInvoice = aggregate.toSnapshot();
    expect(refundedInvoice.status).toBe('Đã hủy / Hoàn tiền');
    expect(refundedInvoice.notes).toContain('Bệnh nhân yêu cầu hủy');
  });

  it('LabReportAggregate: should mark isPdfOutdated when doctor or patient info changes after export', () => {
    const aggregate = LabReportAggregate.create({
      code: 'XN-004',
      sampleCode: 'MAU-004',
      patient: mockPatient,
      doctorName: 'BS. Long',
      selectedTests: [{ category: 'Sinh hóa', code: 'GLU', name: 'Glucose', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '', result: '5.2', note: 'Bình thường' }]
    });

    aggregate.recordCloudExport('https://cloud.com/report.pdf');
    const exported = aggregate.toSnapshot();
    expect(exported.status).toBe('Đã xuất Cloud');
    expect(exported.isPdfOutdated).toBe(false);
    expect(exported.pdfVersion).toBe(1);

    // Update doctorName -> should become Outdated
    aggregate.updateDoctor('BS. Nguyễn Văn B');
    const updatedDoctor = aggregate.toSnapshot();
    expect(updatedDoctor.isPdfOutdated).toBe(true);
    expect(updatedDoctor.status).toBe('Cần cập nhật PDF');

    // Update patient phone -> should also remain Outdated
    aggregate.updatePatient({ phone: '0988888888' });
    const updatedPhone = aggregate.toSnapshot();
    expect(updatedPhone.isPdfOutdated).toBe(true);
    expect(updatedPhone.status).toBe('Cần cập nhật PDF');

    // Re-export -> version should increment to 2 and clear outdated flag
    aggregate.recordCloudExport('https://cloud.com/report_v2.pdf');
    const reExported = aggregate.toSnapshot();
    expect(reExported.isPdfOutdated).toBe(false);
    expect(reExported.pdfVersion).toBe(2);
    expect(reExported.status).toBe('Đã xuất Cloud');
  });
});
