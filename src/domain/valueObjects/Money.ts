export class Money {
  private readonly _amount: number;

  public constructor(amount: number) {
    this._amount = Math.max(0, Math.round(amount || 0));
  }

  public get amount(): number {
    return this._amount;
  }

  public add(other: Money | number): Money {
    const val = typeof other === 'number' ? other : other.amount;
    return new Money(this._amount + val);
  }

  public subtract(other: Money | number): Money {
    const val = typeof other === 'number' ? other : other.amount;
    return new Money(Math.max(0, this._amount - val));
  }

  public applyDiscount(discountAmount: number): Money {
    return new Money(Math.max(0, this._amount - Math.max(0, discountAmount || 0)));
  }

  public formatVND(): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(this._amount);
  }

  public toString(): string {
    return String(this._amount);
  }
}
