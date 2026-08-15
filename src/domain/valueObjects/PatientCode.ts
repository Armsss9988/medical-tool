export class PatientCode {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(date = new Date(), index = 1): PatientCode {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(index).padStart(3, '0');
    return new PatientCode(`BN-${year}${month}${day}-${seq}`);
  }

  public static from(code: string): PatientCode {
    if (!code || typeof code !== 'string') {
      return PatientCode.create();
    }
    return new PatientCode(code.trim());
  }

  public get value(): string {
    return this._value;
  }

  public toString(): string {
    return this._value;
  }
}
