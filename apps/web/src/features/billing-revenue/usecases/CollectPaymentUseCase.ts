import { Invoice, PaymentMethod } from '@domain/types';
import { InvoiceAggregate } from '@domain/aggregates/InvoiceAggregate';

export interface CollectPaymentParams {
  invoice: Invoice;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  reportId?: string;
}

export class CollectPaymentUseCase {
  public execute(params: CollectPaymentParams): Invoice {
    const { invoice, paymentMethod, paidAt } = params;

    // 1. Áp dụng InvoiceAggregate để chuyển trạng thái sang Đã thanh toán
    const aggregate = InvoiceAggregate.fromSnapshot(invoice);
    aggregate.markAsPaid(paymentMethod, paidAt);

    // DESIGN DECISION: UseCase KHÔNG phát Domain Events.
    // Hooks (useInvoiceManager) là owner duy nhất phát events để tránh double-emit.

    return aggregate.toSnapshot();
  }
}
