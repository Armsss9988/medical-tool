import { Invoice, Patient, SelectedTest, InvoiceItem, PaymentMethod, InvoiceStatus, TestPackage } from '../domain/types';
import { Money } from '../domain/valueObjects/Money';
import { domainEventBus } from '../domain/events/DomainEventBus';
import { INVOICE_EVENT_TYPES } from '../domain/events/DomainEvent';
import { buildInvoiceItems } from '../domain/pricing';

export interface CreateInvoiceParams {
  patient: Patient;
  selectedTests?: SelectedTest[];
  testPackages?: TestPackage[];
  items?: InvoiceItem[];
  doctorName?: string;
  packageName?: string;
  discountAmount?: number;
  surchargeAmount?: number;
  surchargeNote?: string;
  paymentMethod?: PaymentMethod;
  invoicesCount?: number;
  cashierName?: string;
  notes?: string;
  reportId?: string;
  status?: InvoiceStatus;
  paidAt?: string;
}

export class CreateInvoiceUseCase {
  public execute(params: CreateInvoiceParams): Invoice {
    const {
      patient,
      selectedTests = [],
      testPackages = [],
      items: customItems,
      doctorName = 'BS. Trần Hoài Long',
      packageName = 'Tùy chọn',
      discountAmount = 0,
      surchargeAmount = 0,
      surchargeNote,
      paymentMethod = 'Tiền mặt',
      invoicesCount = 0,
      cashierName = 'Thu ngân viện',
      notes = '',
      status = 'Chưa thu phí'
    } = params;

    const items: InvoiceItem[] = customItems && customItems.length > 0
      ? customItems
      : buildInvoiceItems(selectedTests, testPackages);

    const rawSubtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const totalWithSurcharge = rawSubtotal + surchargeAmount;
    const totalMoney = new Money(totalWithSurcharge);
    const finalMoney = totalMoney.applyDiscount(discountAmount);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(invoicesCount + 1).padStart(3, '0');
    const invoiceCode = `HD-${dateStr}-${seq}`;

    const isPaid = status === 'Đã thanh toán';
    const paidAt = isPaid ? (params.paidAt || now.toISOString()) : undefined;

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      code: invoiceCode,
      createdAt: now.toISOString(),
      patientName: patient.name || 'Bệnh nhân',
      patientDob: patient.dob || '',
      patientPhone: patient.phone || '',
      patientGender: patient.gender || 'Nam',
      patientCode: patient.code || 'BN-GOLAB',
      doctorName,
      packageName,
      items,
      totalAmount: rawSubtotal,
      discountPercent: totalWithSurcharge > 0 ? Math.round((discountAmount / totalWithSurcharge) * 100) : 0,
      discountAmount,
      surchargeAmount: surchargeAmount > 0 ? surchargeAmount : undefined,
      surchargeNote: surchargeAmount > 0 ? surchargeNote : undefined,
      finalAmount: finalMoney.amount,
      paymentMethod,
      status,
      cashierName,
      notes,
      reportId: params.reportId,
      paidAt
    };

    // Phát Domain Event: Hóa đơn được tạo
    domainEventBus.emit(INVOICE_EVENT_TYPES.CREATED, { invoice });

    // Nếu tạo ở trạng thái Đã thanh toán, phát thêm event PAID
    if (isPaid) {
      domainEventBus.emit(INVOICE_EVENT_TYPES.PAID, {
        invoice,
        paymentMethod,
        paidAt: paidAt!,
        reportId: params.reportId
      });
    }

    return invoice;
  }
}
