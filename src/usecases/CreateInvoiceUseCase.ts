import { Invoice, Patient, SelectedTest, InvoiceItem } from '../domain/types';
import { Money } from '../domain/valueObjects/Money';

export interface CreateInvoiceParams {
  patient: Patient;
  selectedTests: SelectedTest[];
  doctorName: string;
  packageName: string;
  discountAmount?: number;
  paymentMethod?: 'Tiền mặt' | 'Chuyển khoản (VietQR)' | 'Quẹt thẻ';
  invoicesCount?: number;
}

export class CreateInvoiceUseCase {
  public execute(params: CreateInvoiceParams): Invoice {
    const {
      patient,
      selectedTests,
      doctorName,
      packageName,
      discountAmount = 0,
      paymentMethod = 'Tiền mặt',
      invoicesCount = 0
    } = params;

    const items: InvoiceItem[] = selectedTests.map((t) => ({
      code: t.code,
      name: t.name,
      price: t.price || 0
    }));

    const rawTotal = items.reduce((sum, item) => sum + item.price, 0);
    const totalMoney = new Money(rawTotal);
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
      patientCode: patient.code || 'BN-GOLAB',
      doctorName: doctorName || 'Bác sĩ phòng khám',
      packageName: packageName || 'Tùy chọn',
      items,
      totalAmount: totalMoney.amount,
      discountAmount,
      finalAmount: finalMoney.amount,
      paymentMethod,
      status: 'Đã thanh toán'
    };
  }
}
