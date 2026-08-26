import { Invoice } from '../domain/types';
import { InvoiceStateMachine } from '../domain/stateMachine/InvoiceStateMachine';
import { domainEventBus } from '../domain/events/DomainEventBus';
import { INVOICE_EVENT_TYPES } from '../domain/events/DomainEvent';

export interface CancelInvoiceParams {
  invoice: Invoice;
  reason?: string;
}

export class CancelInvoiceUseCase {
  public execute(params: CancelInvoiceParams): Invoice {
    const { invoice, reason } = params;

    // 1. Áp dụng State Machine chuyển trạng thái sang Đã hủy / Hoàn tiền
    const cancelledInvoice = InvoiceStateMachine.markRefunded(invoice, reason);

    // 2. Phát Domain Event: Hóa đơn bị hủy
    domainEventBus.emit(INVOICE_EVENT_TYPES.CANCELLED, {
      invoiceId: invoice.id,
      reportId: invoice.reportId,
      reason
    });

    return cancelledInvoice;
  }
}
