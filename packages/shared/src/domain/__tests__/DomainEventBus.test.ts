import { describe, it, expect, beforeEach, vi } from 'vitest';
import { domainEventBus } from '../events/DomainEventBus';
import { INVOICE_EVENT_TYPES, REPORT_EVENT_TYPES } from '../events/DomainEvent';
import type { Invoice, MedicalReport } from '../types';

describe('DomainEventBus', () => {
  const mockInvoice: Invoice = {
    id: 'inv-1',
    code: 'HD-001',
    createdAt: '2026-08-25T10:00:00.000Z',
    patientName: 'Nguyen Van A',
    patientDob: '1990',
    patientPhone: '0901234567',
    patientGender: 'Nam',
    doctorName: 'BS. Long',
    items: [],
    totalAmount: 100000,
    discountPercent: 0,
    finalAmount: 100000,
    paymentMethod: 'Tiền mặt',
    status: 'Đã thanh toán',
    reportId: 'rep-1'
  };

  const mockReport: MedicalReport = {
    id: 'rep-1',
    code: 'BN-001',
    sampleCode: 'BN-001',
    createdAt: '2026-08-25T10:00:00.000Z',
    updatedAt: '2026-08-25T10:00:00.000Z',
    patient: {
      code: 'BN-001',
      secretToken: 'ABC123',
      name: 'Nguyen Van A',
      dob: '1990',
      gender: 'Nam',
      phone: '0901234567',
      address: '',
      diagnosis: ''
    },
    doctorName: 'BS. Long',
    selectedTests: [],
    conclusion: '',
    isAllergen: false,
    status: 'Đã có kết quả',
    testCount: 0
  };

  beforeEach(() => {
    domainEventBus.clear();
  });

  it('should subscribe and receive emitted events', () => {
    const handler = vi.fn();
    const unsub = domainEventBus.subscribe(INVOICE_EVENT_TYPES.PAID, handler);

    const eventPayload = {
      invoice: mockInvoice,
      paymentMethod: 'Tiền mặt' as const,
      paidAt: '2026-08-25T10:00:00.000Z',
      reportId: 'rep-1'
    };

    domainEventBus.emit(INVOICE_EVENT_TYPES.PAID, eventPayload);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: INVOICE_EVENT_TYPES.PAID,
        payload: eventPayload
      })
    );

    unsub();
    domainEventBus.emit(INVOICE_EVENT_TYPES.PAID, eventPayload);
    expect(handler).toHaveBeenCalledTimes(1); // Not called after unsubscribe
  });

  it('should maintain event history', () => {
    domainEventBus.emit(REPORT_EVENT_TYPES.SAVED, { report: mockReport, isNew: true });
    domainEventBus.emit(REPORT_EVENT_TYPES.DELETED, { reportId: 'rep-1' });

    const history = domainEventBus.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].eventType).toBe(REPORT_EVENT_TYPES.DELETED);
    expect(history[1].eventType).toBe(REPORT_EVENT_TYPES.SAVED);
  });

  it('should handle errors gracefully in subscribers without crashing publisher', () => {
    const faultyHandler = vi.fn().mockImplementation(() => {
      throw new Error('Subscriber failed');
    });
    const goodHandler = vi.fn();

    domainEventBus.subscribe('TEST_EVENT', faultyHandler);
    domainEventBus.subscribe('TEST_EVENT', goodHandler);

    expect(() => {
      domainEventBus.emit('TEST_EVENT', { data: 123 });
    }).not.toThrow();

    expect(faultyHandler).toHaveBeenCalledTimes(1);
    expect(goodHandler).toHaveBeenCalledTimes(1);
  });
});
