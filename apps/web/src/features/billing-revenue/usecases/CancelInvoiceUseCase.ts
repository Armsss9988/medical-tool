import { Invoice } from '@domain/types';
import { InvoiceStateMachine } from '@domain/stateMachine/InvoiceStateMachine';

export interface CancelInvoiceParams {
  invoice: Invoice;
  reason?: string;
}

export class CancelInvoiceUseCase {
  public execute(params: CancelInvoiceParams): Invoice {
    const { invoice, reason } = params;

    // 1. Áp dụng State Machine chuyển trạng thái sang Đã hủy / Hoàn tiền
    const cancelledInvoice = InvoiceStateMachine.markRefunded(invoice, reason);

    // DESIGN DECISION: UseCase KHÔNG phát Domain Events.
    // Hooks (useInvoiceManager) là owner duy nhất phát events để tránh double-emit.

    return cancelledInvoice;
  }
}
