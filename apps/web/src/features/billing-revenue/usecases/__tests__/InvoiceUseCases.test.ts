import { describe, it, expect, beforeEach } from 'vitest';
import { CollectPaymentUseCase } from '../CollectPaymentUseCase';
import { CancelInvoiceUseCase } from '../CancelInvoiceUseCase';
import { domainEventBus } from '@domain/events/DomainEventBus';
import { Invoice } from '@domain/types';

describe('Invoice UseCases (Collect & Cancel)', () => {
  const collectUseCase = new CollectPaymentUseCase();
  const cancelUseCase = new CancelInvoiceUseCase();

  const mockInvoice: Invoice = {
    id: 'inv-test-1',
    code: 'HD-20260825-001',
    createdAt: new Date().toISOString(),
    patientName: 'Lê Thị C',
    patientDob: '1988',
    patientPhone: '0912345678',
    patientGender: 'Nữ',
    doctorName: 'BS. Trần Hoài Long',
    items: [],
    totalAmount: 150000,
    discountPercent: 0,
    finalAmount: 150000,
    paymentMethod: 'Tiền mặt',
    status: 'Chưa thu phí',
    reportId: 'rep-test-1'
  };

  beforeEach(() => {
    domainEventBus.clear();
  });

  it('CollectPaymentUseCase: should transition invoice to PAID (pure transformation, NO event emission)', () => {
    const result = collectUseCase.execute({
      invoice: mockInvoice,
      paymentMethod: 'Chuyển khoản (VietQR)',
      paidAt: '2026-08-25T11:00:00.000Z'
    });

    expect(result.status).toBe('Đã thanh toán');
    expect(result.paymentMethod).toBe('Chuyển khoản (VietQR)');
    expect(result.paidAt).toBe('2026-08-25T11:00:00.000Z');

    expect(domainEventBus.getHistory()).toHaveLength(0);
  });

  it('CancelInvoiceUseCase: should transition invoice to REFUNDED (pure transformation, NO event emission)', () => {
    const paidInvoice: Invoice = {
      ...mockInvoice,
      status: 'Đã thanh toán',
      paidAt: new Date().toISOString()
    };

    const result = cancelUseCase.execute({
      invoice: paidInvoice,
      reason: 'Khách hàng hủy dịch vụ'
    });

    expect(result.status).toBe('Đã hủy / Hoàn tiền');
    expect(result.notes).toContain('Khách hàng hủy dịch vụ');

    expect(domainEventBus.getHistory()).toHaveLength(0);
  });
});