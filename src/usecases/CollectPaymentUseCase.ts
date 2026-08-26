import { Invoice, PaymentMethod } from '../domain/types';
import { InvoiceStateMachine } from '../domain/stateMachine/InvoiceStateMachine';
import { domainEventBus } from '../domain/events/DomainEventBus';
import { INVOICE_EVENT_TYPES } from '../domain/events/DomainEvent';

export interface CollectPaymentParams {
  invoice: Invoice;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  reportId?: string;
}

export class CollectPaymentUseCase {
  public execute(params: CollectPaymentParams): Invoice {
    const { invoice, paymentMethod, paidAt, reportId } = params;

    // 1. Áp dụng State Machine chuyển trạng thái sang Đã thanh toán
    const paidInvoice = InvoiceStateMachine.markPaid(invoice, paymentMethod, paidAt);

    // 2. Phát Domain Event: Hóa đơn đã thanh toán thành công
    domainEventBus.emit(INVOICE_EVENT_TYPES.PAID, {
      invoice: paidInvoice,
      paymentMethod: paidInvoice.paymentMethod,
      paidAt: paidInvoice.paidAt || new Date().toISOString(),
      reportId: reportId || paidInvoice.reportId
    });

    return paidInvoice;
  }
}
