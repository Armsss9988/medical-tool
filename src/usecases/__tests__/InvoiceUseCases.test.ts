import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollectPaymentUseCase } from '../CollectPaymentUseCase';
import { CancelInvoiceUseCase } from '../CancelInvoiceUseCase';
import { domainEventBus } from '../../domain/events/DomainEventBus';
import { INVOICE_EVENT_TYPES } from '../../domain/events/DomainEvent';
import { Invoice } from '../../domain/types';

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

  it('CollectPaymentUseCase: should transition invoice to PAID and emit INVOICE_PAID event', () => {
    const paidListener = vi.fn();
    domainEventBus.subscribe(INVOICE_EVENT_TYPES.PAID, paidListener);

    const result = collectUseCase.execute({
      invoice: mockInvoice,
      paymentMethod: 'Chuyển khoản (VietQR)',
      paidAt: '2026-08-25T11:00:00.000Z'
    });

    expect(result.status).toBe('Đã thanh toán');
    expect(result.paymentMethod).toBe('Chuyển khoản (VietQR)');
    expect(result.paidAt).toBe('2026-08-25T11:00:00.000Z');

    expect(paidListener).toHaveBeenCalledTimes(1);
    expect(paidListener).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: INVOICE_EVENT_TYPES.PAID,
        payload: expect.objectContaining({
          reportId: 'rep-test-1',
          paymentMethod: 'Chuyển khoản (VietQR)'
        })
      })
    );
  });

  it('CancelInvoiceUseCase: should transition invoice to REFUNDED and emit INVOICE_CANCELLED event', () => {
    const cancelListener = vi.fn();
    domainEventBus.subscribe(INVOICE_EVENT_TYPES.CANCELLED, cancelListener);

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

    expect(cancelListener).toHaveBeenCalledTimes(1);
    expect(cancelListener).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: INVOICE_EVENT_TYPES.CANCELLED,
        payload: expect.objectContaining({
          invoiceId: 'inv-test-1',
          reportId: 'rep-test-1',
          reason: 'Khách hàng hủy dịch vụ'
        })
      })
    );
  });
});
