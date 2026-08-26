import { Invoice, PaymentMethod } from '../types';
import { BillingStatusVO } from '../valueObjects/BillingStatusVO';

export class InvoiceStateMachine {
  /**
   * Khởi tạo hoặc chuyển hóa đơn sang trạng thái Chờ Thu (Chưa thanh toán)
   */
  public static markPending(invoice: Invoice): Invoice {
    return {
      ...invoice,
      status: 'Chưa thu phí',
      paidAt: undefined
    };
  }

  /**
   * Đánh dấu hóa đơn đã thanh toán
   */
  public static markPaid(
    invoice: Invoice,
    paymentMethod?: PaymentMethod,
    paidAt?: string
  ): Invoice {
    const now = paidAt || new Date().toISOString();
    return {
      ...invoice,
      paymentMethod: paymentMethod || invoice.paymentMethod,
      status: 'Đã thanh toán',
      paidAt: now
    };
  }

  /**
   * Đánh dấu hóa đơn đã hủy / hoàn tiền
   */
  public static markRefunded(
    invoice: Invoice,
    notes?: string
  ): Invoice {
    return {
      ...invoice,
      status: 'Đã hủy / Hoàn tiền',
      notes: notes ? `${invoice.notes || ''} [Hủy: ${notes}]`.trim() : invoice.notes
    };
  }

  /**
   * Kiểm tra hóa đơn có thể hủy/hoàn tiền không
   */
  public static canRefund(invoice: Invoice): boolean {
    const billing = BillingStatusVO.from(invoice.status);
    return billing.canRefund();
  }

  /**
   * Kiểm tra hóa đơn có thể thu tiền không
   */
  public static canCollect(invoice: Invoice): boolean {
    const billing = BillingStatusVO.from(invoice.status);
    return billing.canCollect();
  }
}
