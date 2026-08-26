import { describe, it, expect } from 'vitest';
import { ReportStateMachine } from '../stateMachine/ReportStateMachine';
import { InvoiceStateMachine } from '../stateMachine/InvoiceStateMachine';
import { Patient, Invoice } from '../types';

describe('Domain State Machines', () => {
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

  it('ReportStateMachine: should initialize report with DRAFT when no results exist', () => {
    const report = ReportStateMachine.createInitialReport({
      code: 'XN-001',
      sampleCode: 'MAU-001',
      patient: mockPatient,
      doctorName: 'BS. Long',
      selectedTests: [{ category: 'Sinh hóa', code: 'GLU', name: 'Glucose', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '', result: '', note: '' }]
    });

    expect(report.status).toBe('Chờ xét nghiệm');
    const summary = ReportStateMachine.computeSummary(report, false);
    expect(summary.clinical.isDraft()).toBe(true);
    expect(summary.billing.isUnpaid()).toBe(true);
    expect(summary.document.isUnexported()).toBe(true);
  });

  it('ReportStateMachine: should compute PAID when invoice exists', () => {
    const report = ReportStateMachine.createInitialReport({
      code: 'XN-002',
      sampleCode: 'MAU-002',
      patient: mockPatient,
      doctorName: 'BS. Long',
      selectedTests: [{ category: 'Sinh hóa', code: 'GLU', name: 'Glucose', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '', result: '5.2', note: 'Bình thường' }]
    });

    const summary = ReportStateMachine.computeSummary(report, true);
    expect(summary.clinical.isResulted()).toBe(true);
    expect(summary.billing.isPaid()).toBe(true);
  });

  it('ReportStateMachine: should handle onPaymentCollected and onPaymentVoided cleanly', () => {
    const report = ReportStateMachine.createInitialReport({
      code: 'XN-003',
      sampleCode: 'MAU-003',
      patient: mockPatient,
      doctorName: 'BS. Long',
      selectedTests: []
    });

    const attached = ReportStateMachine.onInvoiceAttached(report, 'inv-123');
    expect(attached.invoiceId).toBe('inv-123');
    expect(attached.patient.paidAt).toBeUndefined();

    const collected = ReportStateMachine.onPaymentCollected(attached, 'inv-123', '2026-08-25T10:00:00.000Z');
    expect(collected.patient.paidAt).toBe('2026-08-25T10:00:00.000Z');
    expect(collected.invoiceId).toBe('inv-123');

    const voided = ReportStateMachine.onPaymentVoided(collected);
    expect(voided.patient.paidAt).toBeUndefined();
    expect(voided.invoiceId).toBeUndefined();
  });

  it('InvoiceStateMachine: should mark paid and mark refunded correctly', () => {
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

    expect(InvoiceStateMachine.canCollect(mockInvoice)).toBe(true);
    expect(InvoiceStateMachine.canRefund(mockInvoice)).toBe(false);

    const paidInvoice = InvoiceStateMachine.markPaid(mockInvoice, 'Chuyển khoản (VietQR)');
    expect(paidInvoice.status).toBe('Đã thanh toán');
    expect(paidInvoice.paymentMethod).toBe('Chuyển khoản (VietQR)');
    expect(InvoiceStateMachine.canRefund(paidInvoice)).toBe(true);

    const refundedInvoice = InvoiceStateMachine.markRefunded(paidInvoice, 'Bệnh nhân yêu cầu hủy');
    expect(refundedInvoice.status).toBe('Đã hủy / Hoàn tiền');
    expect(refundedInvoice.notes).toContain('Bệnh nhân yêu cầu hủy');
  });
});
