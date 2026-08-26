import { Invoice, PaymentMethod } from '../domain/types';
import { InvoiceStateMachine } from '../domain/stateMachine/InvoiceStateMachine';

export interface CollectPaymentParams {
  invoice: Invoice;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  reportId?: string;
}

export class CollectPaymentUseCase {
  public execute(params: CollectPaymentParams): Invoice {
    const { invoice, paymentMethod, paidAt, reportId: _reportId } = params;

    // 1. Áp dụng State Machine chuyển trạng thái sang Đã thanh toán
    const paidInvoice = InvoiceStateMachine.markPaid(invoice, paymentMethod, paidAt);

    // DESIGN DECISION: UseCase KHÔNG phát Domain Events.
    // Hooks (useInvoiceManager) là owner duy nhất phát events để tránh double-emit.

    return paidInvoice;
  }
}
