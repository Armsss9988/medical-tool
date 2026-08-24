import { Invoice, Patient, SelectedTest, InvoiceItem, PaymentMethod } from '../domain/types';
import { Money } from '../domain/valueObjects/Money';

export interface CreateInvoiceParams {
  patient: Patient;
  selectedTests?: SelectedTest[];
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
}

export class CreateInvoiceUseCase {
  public execute(params: CreateInvoiceParams): Invoice {
    const {
      patient,
      selectedTests = [],
      items: customItems,
      doctorName = 'BS. Trần Hoài Long',
      packageName = 'Tùy chọn',
      discountAmount = 0,
      surchargeAmount = 0,
      surchargeNote,
      paymentMethod = 'Tiền mặt',
      invoicesCount = 0,
      cashierName = 'Thu ngân viện',
      notes = ''
    } = params;

    const items: InvoiceItem[] = customItems && customItems.length > 0
      ? customItems
      : selectedTests.map((t) => ({
          code: t.code,
          name: t.name,
          price: t.price || 0,
          quantity: 1,
          category: t.category,
          unit: t.unit || 'Lần'
        }));

    const rawSubtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const totalWithSurcharge = rawSubtotal + surchargeAmount;
    const totalMoney = new Money(totalWithSurcharge);
    const finalMoney = totalMoney.applyDiscount(discountAmount);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(invoicesCount + 1).padStart(3, '0');
    const invoiceCode = `HD-${dateStr}-${seq}`;

    return {
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
      status: 'Đã thanh toán',
      cashierName,
      notes
    };
  }
}
