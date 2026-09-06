export class InvoiceCode {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(date = new Date(), index = 1): InvoiceCode {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(index).padStart(3, '0');
    return new InvoiceCode(`HD-${year}${month}${day}-${seq}`);
  }

  public static from(code: string): InvoiceCode {
    if (!code || typeof code !== 'string') {
      return InvoiceCode.create();
    }
    return new InvoiceCode(code.trim());
  }

  public static fromPatient(patientCode: string, date = new Date()): InvoiceCode {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const cleanPatientCode = (patientCode || 'BN001').replace(/^BN-?/, '');
    return new InvoiceCode(`HD-${year}${month}${day}-${cleanPatientCode}`);
  }

  public get value(): string {
    return this._value;
  }

  public toString(): string {
    return this._value;
  }

  public equals(other: InvoiceCode): boolean {
    return this._value === other._value;
  }
}
