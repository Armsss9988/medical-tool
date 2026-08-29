export class SecretToken {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(): SecretToken {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return new SecretToken(token);
  }

  public static from(token: string): SecretToken {
    if (!token || typeof token !== 'string') {
      return SecretToken.create();
    }
    return new SecretToken(token.trim().toUpperCase());
  }

  public get value(): string {
    return this._value;
  }

  public toString(): string {
    return this._value;
  }
}
