import { Money } from './Money';
import { PaymentMethod, InvoiceStatus } from '../types';
import { assertNever } from '../utils/assertNever';

export type InvoicePaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export type InvoicePaymentState =
  | {
      readonly status: 'UNPAID';
      readonly dueAmount: Money;
    }
  | {
      readonly status: 'PAID';
      readonly paidAmount: Money;
      readonly paidAt: string;
      readonly method: PaymentMethod;
      readonly cashierName: string;
    }
  | {
      readonly status: 'REFUNDED';
      readonly refundedAmount: Money;
      readonly refundedAt: string;
      readonly reason: string;
    };

export class InvoicePaymentStateHelper {
  /**
   * Khớp mẫu đầy đủ (Exhaustive Pattern Matching) trên ADT InvoicePaymentState.
   */
  public static match<T>(
    state: InvoicePaymentState,
    patterns: {
      unpaid: (s: Extract<InvoicePaymentState, { status: 'UNPAID' }>) => T;
      paid: (s: Extract<InvoicePaymentState, { status: 'PAID' }>) => T;
      refunded: (s: Extract<InvoicePaymentState, { status: 'REFUNDED' }>) => T;
    }
  ): T {
    switch (state.status) {
      case 'UNPAID':
        return patterns.unpaid(state);
      case 'PAID':
        return patterns.paid(state);
      case 'REFUNDED':
        return patterns.refunded(state);
      default:
        return assertNever(state);
    }
  }

  public static toLegacyStatus(state: InvoicePaymentState): InvoiceStatus {
    switch (state.status) {
      case 'UNPAID':
        return 'Chưa thu phí';
      case 'PAID':
        return 'Đã thanh toán';
      case 'REFUNDED':
        return 'Đã hủy / Hoàn tiền';
      default:
        return assertNever(state);
    }
  }

  public static fromLegacy(
    status: InvoiceStatus | string | undefined,
    dueAmount: Money,
    options?: {
      paidAt?: string;
      paymentMethod?: PaymentMethod;
      cashierName?: string;
      refundedAt?: string;
      refundReason?: string;
    }
  ): InvoicePaymentState {
    if (status === 'Đã thanh toán') {
      return {
        status: 'PAID',
        paidAmount: dueAmount,
        paidAt: options?.paidAt || new Date().toISOString(),
        method: options?.paymentMethod || 'Tiền mặt',
        cashierName: options?.cashierName || 'Lê Phan Anh'
      };
    }
    if (status === 'Đã hủy / Hoàn tiền') {
      return {
        status: 'REFUNDED',
        refundedAmount: dueAmount,
        refundedAt: options?.refundedAt || new Date().toISOString(),
        reason: options?.refundReason || 'Hoàn hủy viện phí'
      };
    }
    return {
      status: 'UNPAID',
      dueAmount
    };
  }
}
