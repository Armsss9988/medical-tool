import { Invoice, InvoiceItem, PaymentMethod, Gender } from '../types';
import { Money } from '../valueObjects/Money';
import { InvoiceCode } from '../valueObjects/InvoiceCode';
import { InvoicePaymentState, InvoicePaymentStateHelper } from '../valueObjects/InvoicePaymentState';
import { DEFAULTS } from '../constants/defaults';

export interface CreateInvoiceAggregateParams {
  id?: string;
  code?: string | InvoiceCode;
  patientName: string;
  patientDob?: string;
  patientPhone?: string;
  patientGender?: Gender;
  patientCode?: string;
  doctorName?: string;
  packageName?: string;
  cashierName?: string;
  items: InvoiceItem[];
  discountAmount?: number;
  surchargeAmount?: number;
  surchargeNote?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  reportId?: string;
  isPaid?: boolean;
  paidAt?: string;
}

export class InvoiceAggregate {
  private readonly _id: string;
  private readonly _code: InvoiceCode;
  private readonly _createdAt: string;

  private _patientName: string;
  private _patientDob: string;
  private _patientPhone: string;
  private _patientGender: Gender;
  private _patientCode: string;
  private _doctorName: string;
  private _packageName: string;
  private _cashierName: string;
  private _notes: string;
  private _reportId?: string;

  private _items: InvoiceItem[];
  private _discountAmount: Money;
  private _surchargeAmount: Money;
  private _surchargeNote?: string;

  private _paymentState: InvoicePaymentState;
  private _paymentMethod: PaymentMethod;

  private constructor(params: {
    id: string;
    code: InvoiceCode;
    createdAt: string;
    patientName: string;
    patientDob: string;
    patientPhone: string;
    patientGender: Gender;
    patientCode: string;
    doctorName: string;
    packageName: string;
    cashierName: string;
    notes: string;
    reportId?: string;
    items: InvoiceItem[];
    discountAmount: Money;
    surchargeAmount: Money;
    surchargeNote?: string;
    paymentState: InvoicePaymentState;
    paymentMethod?: PaymentMethod;
  }) {
    this._id = params.id;
    this._code = params.code;
    this._createdAt = params.createdAt;
    this._patientName = params.patientName;
    this._patientDob = params.patientDob;
    this._patientPhone = params.patientPhone;
    this._patientGender = params.patientGender;
    this._patientCode = params.patientCode;
    this._doctorName = params.doctorName;
    this._packageName = params.packageName;
    this._cashierName = params.cashierName;
    this._notes = params.notes;
    this._reportId = params.reportId;
    this._items = [...params.items];
    this._discountAmount = params.discountAmount;
    this._surchargeAmount = params.surchargeAmount;
    this._surchargeNote = params.surchargeNote;
    this._paymentState = params.paymentState;
    this._paymentMethod = params.paymentMethod || (params.paymentState.status === 'PAID' ? params.paymentState.method : 'Tiền mặt');
  }

  public static create(params: CreateInvoiceAggregateParams): InvoiceAggregate {
    const now = new Date();
    const id = params.id || crypto.randomUUID();
    const code = params.code instanceof InvoiceCode
      ? params.code
      : (params.code ? InvoiceCode.from(params.code) : InvoiceCode.create(now));

    const items = [...params.items];
    const discount = new Money(params.discountAmount || 0);
    const surcharge = new Money(params.surchargeAmount || 0);

    const rawSubtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const totalWithSurcharge = new Money(rawSubtotal).add(surcharge);
    const finalMoney = totalWithSurcharge.applyDiscount(discount.amount);

    const paymentState: InvoicePaymentState = params.isPaid
      ? {
          status: 'PAID',
          paidAmount: finalMoney,
          paidAt: params.paidAt || now.toISOString(),
          method: params.paymentMethod || 'Tiền mặt',
          cashierName: params.cashierName || DEFAULTS.CASHIER_NAME
        }
      : {
          status: 'UNPAID',
          dueAmount: finalMoney
        };

    return new InvoiceAggregate({
      id,
      code,
      createdAt: now.toISOString(),
      patientName: params.patientName || 'Bệnh nhân',
      patientDob: params.patientDob || '',
      patientPhone: params.patientPhone || '',
      patientGender: params.patientGender || 'Nam',
      patientCode: params.patientCode || 'BN-GOLAB',
      doctorName: params.doctorName || DEFAULTS.DOCTOR_NAME,
      packageName: params.packageName || DEFAULTS.PACKAGE_NAME,
      cashierName: params.cashierName || DEFAULTS.CASHIER_NAME,
      notes: params.notes || '',
      reportId: params.reportId,
      items,
      discountAmount: discount,
      surchargeAmount: surcharge,
      surchargeNote: params.surchargeNote,
      paymentState,
      paymentMethod: params.paymentMethod
    });
  }

  public static fromSnapshot(invoice: Invoice): InvoiceAggregate {
    const rawSubtotal = (invoice.items || []).reduce(
      (sum, item) => sum + (item.price * (item.quantity || 1)),
      0
    );
    const discount = new Money(invoice.discountAmount || 0);
    const surcharge = new Money(invoice.surchargeAmount || 0);
    const totalWithSurcharge = new Money(rawSubtotal).add(surcharge);
    const finalMoney = totalWithSurcharge.applyDiscount(discount.amount);

    const paymentState = InvoicePaymentStateHelper.fromLegacy(invoice.status, finalMoney, {
      paidAt: invoice.paidAt,
      paymentMethod: invoice.paymentMethod,
      cashierName: invoice.cashierName
    });

    return new InvoiceAggregate({
      id: invoice.id,
      code: InvoiceCode.from(invoice.code),
      createdAt: invoice.createdAt || new Date().toISOString(),
      patientName: invoice.patientName || 'Bệnh nhân',
      patientDob: invoice.patientDob || '',
      patientPhone: invoice.patientPhone || '',
      patientGender: invoice.patientGender || 'Nam',
      patientCode: invoice.patientCode || 'BN-GOLAB',
      doctorName: invoice.doctorName || DEFAULTS.DOCTOR_NAME,
      packageName: invoice.packageName || DEFAULTS.PACKAGE_NAME,
      cashierName: invoice.cashierName || DEFAULTS.CASHIER_NAME,
      notes: invoice.notes || '',
      reportId: invoice.reportId,
      items: invoice.items || [],
      discountAmount: discount,
      surchargeAmount: surcharge,
      surchargeNote: invoice.surchargeNote,
      paymentState,
      paymentMethod: invoice.paymentMethod
    });
  }

  public toSnapshot(): Invoice {
    const rawSubtotal = this._items.reduce(
      (sum, item) => sum + (item.price * (item.quantity || 1)),
      0
    );
    const totalWithSurcharge = new Money(rawSubtotal).add(this._surchargeAmount);
    const finalMoney = totalWithSurcharge.applyDiscount(this._discountAmount.amount);
    const discountPercent = totalWithSurcharge.amount > 0
      ? Math.round((this._discountAmount.amount / totalWithSurcharge.amount) * 100)
      : 0;

    const legacyStatus = InvoicePaymentStateHelper.toLegacyStatus(this._paymentState);
    const paidAt = this._paymentState.status === 'PAID' ? this._paymentState.paidAt : undefined;
    const paymentMethod = this._paymentState.status === 'PAID' ? this._paymentState.method : this._paymentMethod;

    return {
      id: this._id,
      code: this._code.value,
      createdAt: this._createdAt,
      patientName: this._patientName,
      patientDob: this._patientDob,
      patientPhone: this._patientPhone,
      patientGender: this._patientGender,
      patientCode: this._patientCode,
      doctorName: this._doctorName,
      packageName: this._packageName,
      cashierName: this._cashierName,
      notes: this._notes,
      reportId: this._reportId,
      items: [...this._items],
      totalAmount: rawSubtotal,
      discountPercent,
      discountAmount: this._discountAmount.amount,
      surchargeAmount: this._surchargeAmount.amount > 0 ? this._surchargeAmount.amount : undefined,
      surchargeNote: this._surchargeAmount.amount > 0 ? this._surchargeNote : undefined,
      finalAmount: finalMoney.amount,
      paymentMethod,
      status: legacyStatus,
      paidAt
    };
  }

  // ─── BEHAVIORS & INVARIANTS ──────────────────────────────────────────────

  public markPaid(method?: PaymentMethod, cashierOrPaidAt?: string, paidAt?: string): void {
    const finalMoney = this.computeFinalAmount();
    let finalCashier = this._cashierName;
    let finalPaidAt = new Date().toISOString();

    if (paidAt) {
      finalCashier = cashierOrPaidAt || this._cashierName;
      finalPaidAt = paidAt;
    } else if (cashierOrPaidAt) {
      if (/^\d{4}-\d{2}-\d{2}/.test(cashierOrPaidAt)) {
        finalPaidAt = cashierOrPaidAt;
      } else {
        finalCashier = cashierOrPaidAt;
      }
    }

    const finalMethod = method || this._paymentMethod || 'Tiền mặt';
    this._cashierName = finalCashier;
    this._paymentState = {
      status: 'PAID',
      paidAmount: finalMoney,
      paidAt: finalPaidAt,
      method: finalMethod,
      cashierName: finalCashier
    };
  }

  public markAsPaid(method?: PaymentMethod, cashierOrPaidAt?: string, paidAt?: string): void {
    this.markPaid(method, cashierOrPaidAt, paidAt);
  }

  public voidPayment(reason?: string): void {
    const finalMoney = this.computeFinalAmount();
    if (reason) {
      this._notes = `${this._notes ? this._notes + ' ' : ''}[Hủy: ${reason}]`.trim();
    }
    this._paymentState = {
      status: 'REFUNDED',
      refundedAmount: finalMoney,
      refundedAt: new Date().toISOString(),
      reason: reason || 'Hoàn hủy viện phí'
    };
  }

  public refund(reason?: string): void {
    this.voidPayment(reason);
  }

  public applyDiscount(amount: number): void {
    this._discountAmount = new Money(Math.max(0, amount));
    this.refreshPaymentDue();
  }

  public applySurcharge(amount: number, note?: string): void {
    this._surchargeAmount = new Money(Math.max(0, amount));
    this._surchargeNote = note;
    this.refreshPaymentDue();
  }

  private refreshPaymentDue(): void {
    if (this._paymentState.status === 'UNPAID') {
      this._paymentState = {
        status: 'UNPAID',
        dueAmount: this.computeFinalAmount()
      };
    }
  }

  public computeFinalAmount(): Money {
    const rawSubtotal = this._items.reduce(
      (sum, item) => sum + (item.price * (item.quantity || 1)),
      0
    );
    const totalWithSurcharge = new Money(rawSubtotal).add(this._surchargeAmount);
    return totalWithSurcharge.applyDiscount(this._discountAmount.amount);
  }

  // ─── GETTERS ─────────────────────────────────────────────────────────────
  public get id(): string { return this._id; }
  public get code(): InvoiceCode { return this._code; }
  public get paymentState(): InvoicePaymentState { return this._paymentState; }
  public get isPaid(): boolean { return this._paymentState.status === 'PAID'; }
  public get items(): ReadonlyArray<InvoiceItem> { return this._items; }
  public get finalAmount(): Money { return this.computeFinalAmount(); }
  public get reportId(): string | undefined { return this._reportId; }
}
