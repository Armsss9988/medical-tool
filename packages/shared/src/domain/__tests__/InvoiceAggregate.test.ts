import { describe, it, expect } from 'vitest';
import { InvoiceAggregate } from '../aggregates/InvoiceAggregate';
import { InvoiceItem } from '../types';

describe('InvoiceAggregate', () => {
  const items: InvoiceItem[] = [
    { code: 'GLU', name: 'Glucose', price: 40000, quantity: 1 },
    { code: 'CHO', name: 'Cholesterol', price: 60000, quantity: 1 }
  ];

  it('should calculate subtotal, discount, surcharge, and final amount accurately', () => {
    const invoice = InvoiceAggregate.create({
      patientName: 'Nguyễn Văn Test',
      items,
      discountAmount: 10000,
      surchargeAmount: 5000
    });

    // Subtotal: 100,000. Surcharge: +5,000 -> 105,000. Discount: -10,000 -> Final: 95,000
    expect(invoice.finalAmount.amount).toBe(95000);
    expect(invoice.paymentState.status).toBe('UNPAID');
    expect(invoice.isPaid).toBe(false);
  });

  it('should transition to PAID state when payment is marked', () => {
    const invoice = InvoiceAggregate.create({
      patientName: 'Nguyễn Văn Test',
      items
    });

    invoice.markPaid('Chuyển khoản (VietQR)', 'Lê Phan Anh');
    expect(invoice.isPaid).toBe(true);
    expect(invoice.paymentState.status).toBe('PAID');
    if (invoice.paymentState.status === 'PAID') {
      expect(invoice.paymentState.method).toBe('Chuyển khoản (VietQR)');
      expect(invoice.paymentState.cashierName).toBe('Lê Phan Anh');
      expect(invoice.paymentState.paidAmount.amount).toBe(100000);
    }
  });

  it('should serialize to snapshot and restore cleanly', () => {
    const original = InvoiceAggregate.create({
      patientName: 'Trần Văn A',
      items,
      discountAmount: 20000,
      isPaid: true
    });

    const snapshot = original.toSnapshot();
    expect(snapshot.status).toBe('Đã thanh toán');
    expect(snapshot.finalAmount).toBe(80000);

    const restored = InvoiceAggregate.fromSnapshot(snapshot);
    expect(restored.finalAmount.amount).toBe(80000);
    expect(restored.isPaid).toBe(true);
  });

  it('[Bug 7 - FIX VERIFY] InvoiceAggregate bảo toàn cloudPdfUrl và qrCodeDataUrl qua vòng đời fromSnapshot -> toSnapshot', () => {
    const rawInvoice = {
      id: 'inv-001',
      code: 'HD-2026-001',
      createdAt: '2026-09-13T10:00:00Z',
      patientName: 'Bệnh nhân Test',
      patientDob: '1990',
      patientPhone: '0901234567',
      patientGender: 'Nam' as const,
      doctorName: 'BS. Long',
      items,
      totalAmount: 100000,
      discountPercent: 0,
      discountAmount: 0,
      finalAmount: 100000,
      paymentMethod: 'Tiền mặt' as const,
      status: 'Đã thanh toán' as const,
      cloudPdfUrl: 'https://storage.supabase.com/invoices/inv-001.pdf',
      qrCodeDataUrl: 'data:image/png;base64,sampleQrData'
    };

    const agg = InvoiceAggregate.fromSnapshot(rawInvoice);
    const snap = agg.toSnapshot();

    expect(snap.cloudPdfUrl).toBe('https://storage.supabase.com/invoices/inv-001.pdf');
    expect(snap.qrCodeDataUrl).toBe('data:image/png;base64,sampleQrData');
  });
});
