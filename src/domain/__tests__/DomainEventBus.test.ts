import { describe, it, expect, beforeEach, vi } from 'vitest';
import { domainEventBus } from '../events/DomainEventBus';
import { INVOICE_EVENT_TYPES, REPORT_EVENT_TYPES } from '../events/DomainEvent';

describe('DomainEventBus', () => {
  beforeEach(() => {
    domainEventBus.clear();
  });

  it('should subscribe and receive emitted events', () => {
    const handler = vi.fn();
    const unsub = domainEventBus.subscribe(INVOICE_EVENT_TYPES.PAID, handler);

    const eventPayload = {
      invoice: { id: 'inv-1', code: 'HD-001' } as any,
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
    domainEventBus.emit(REPORT_EVENT_TYPES.SAVED, { report: { id: 'rep-1' } as any, isNew: true });
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
