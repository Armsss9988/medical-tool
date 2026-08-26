import type { BillingStatus } from '../types';

export class BillingStatusVO {
  public static readonly UNPAID = new BillingStatusVO('Chưa thu phí');
  public static readonly PAID = new BillingStatusVO('Đã thanh toán');
  public static readonly REFUNDED = new BillingStatusVO('Đã hủy / Hoàn tiền');

  private readonly _value: BillingStatus;

  public constructor(value: BillingStatus | string) {
    if (value === 'Đã thanh toán' || value === 'PAID') {
      this._value = 'Đã thanh toán';
    } else if (value === 'Đã hủy / Hoàn tiền' || value === 'REFUNDED' || value === 'Đã hủy') {
      this._value = 'Đã hủy / Hoàn tiền';
    } else {
      this._value = 'Chưa thu phí';
    }
  }

  public get value(): BillingStatus {
    return this._value;
  }

  public static from(value?: string | BillingStatus | BillingStatusVO): BillingStatusVO {
    if (value instanceof BillingStatusVO) return value;
    if (!value) return BillingStatusVO.UNPAID;
    return new BillingStatusVO(value);
  }

  public isUnpaid(): boolean {
    return this._value === 'Chưa thu phí';
  }

  public isPaid(): boolean {
    return this._value === 'Đã thanh toán';
  }

  public isRefunded(): boolean {
    return this._value === 'Đã hủy / Hoàn tiền';
  }

  public canCollect(): boolean {
    return this._value === 'Chưa thu phí' || this._value === 'Đã hủy / Hoàn tiền';
  }

  public canRefund(): boolean {
    return this._value === 'Đã thanh toán';
  }

  public getBadgeStyle(): { bg: string; text: string; border: string } {
    switch (this._value) {
      case 'Đã thanh toán':
        return {
          bg: 'bg-emerald-500/20',
          text: 'text-emerald-300',
          border: 'border-emerald-500/30'
        };
      case 'Đã hủy / Hoàn tiền':
        return {
          bg: 'bg-rose-500/20',
          text: 'text-rose-300',
          border: 'border-rose-500/30'
        };
      case 'Chưa thu phí':
      default:
        return {
          bg: 'bg-amber-500/20',
          text: 'text-amber-300',
          border: 'border-amber-500/30'
        };
    }
  }

  public label(): string {
    return this._value;
  }

  public toString(): string {
    return this._value;
  }

  public equals(other: BillingStatusVO | string): boolean {
    const otherVal = typeof other === 'string' ? other : other.value;
    return this._value === otherVal;
  }
}
