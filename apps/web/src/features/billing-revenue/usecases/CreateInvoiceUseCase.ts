import { Invoice, Patient, SelectedTest, InvoiceItem, PaymentMethod, InvoiceStatus, TestPackage } from '@domain/types';
import { buildInvoiceItems } from '@domain/pricing';
import { DEFAULTS } from '@domain/constants/defaults';
import { InvoiceAggregate } from '@domain/aggregates/InvoiceAggregate';
import { InvoiceCode } from '@domain/valueObjects/InvoiceCode';

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
      doctorName = DEFAULTS.DOCTOR_NAME,
      packageName = DEFAULTS.PACKAGE_NAME,
      discountAmount = 0,
      surchargeAmount = 0,
      surchargeNote,
      paymentMethod = 'Tiền mặt',
      invoicesCount = 0,
      cashierName = DEFAULTS.CASHIER_NAME,
      notes = '',
      status = 'Chưa thu phí',
      paidAt
    } = params;

    const items: InvoiceItem[] = customItems && customItems.length > 0
      ? customItems
      : buildInvoiceItems(selectedTests, testPackages);

    const now = new Date();
    const invoiceCode = InvoiceCode.create(now, invoicesCount + 1);

    const aggregate = InvoiceAggregate.create({
      code: invoiceCode,
      patientName: patient.name || 'Bệnh nhân',
      patientDob: patient.dob || '',
      patientPhone: patient.phone || '',
      patientGender: patient.gender || 'Nam',
      patientCode: patient.code || 'BN-GOLAB',
      doctorName,
      packageName,
      cashierName,
      items,
      discountAmount,
      surchargeAmount,
      surchargeNote,
      paymentMethod,
      notes,
      reportId: params.reportId,
      isPaid: status === 'Đã thanh toán',
      paidAt
    });

    return aggregate.toSnapshot();
  }
}
