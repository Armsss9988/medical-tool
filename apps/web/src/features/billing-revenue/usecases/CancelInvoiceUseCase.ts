import { Invoice } from '@domain/types';
import { InvoiceAggregate } from '@domain/aggregates/InvoiceAggregate';

export interface CancelInvoiceParams {
  invoice: Invoice;
  reason?: string;
}

export class CancelInvoiceUseCase {
  public execute(params: CancelInvoiceParams): Invoice {
    const { invoice, reason } = params;

    // 1. Áp dụng InvoiceAggregate để chuyển trạng thái sang Đã hủy / Hoàn tiền
    const aggregate = InvoiceAggregate.fromSnapshot(invoice);
    aggregate.refund(reason);

    // DESIGN DECISION: UseCase KHÔNG phát Domain Events.
    // Hooks (useInvoiceManager) là owner duy nhất phát events để tránh double-emit.

    return aggregate.toSnapshot();
  }
}
