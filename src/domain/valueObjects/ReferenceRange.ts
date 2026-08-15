import { ResultStatus } from '../types';

export class ReferenceRange {
  public readonly refMin: number | null;
  public readonly refMax: number | null;
  public readonly unit: string;
  public readonly refText: string;

  public constructor(
    refMin: number | null = null,
    refMax: number | null = null,
    unit = '',
    refText = ''
  ) {
    this.refMin = refMin;
    this.refMax = refMax;
    this.unit = unit ? unit.trim() : '';
    this.refText = refText ? refText.trim() : '';
  }

  public formatDisplay(): string {
    if (this.refText) return this.refText;
    if (this.refMin !== null && this.refMax !== null) {
      return `${this.refMin} - ${this.refMax}`;
    }
    if (this.refMin !== null) return `>= ${this.refMin}`;
    if (this.refMax !== null) return `<= ${this.refMax}`;
    return 'Bình thường';
  }

  public evaluateNumeric(val: number): ResultStatus {
    if (this.refMin !== null && val < this.refMin) return 'low';
    if (this.refMax !== null && val > this.refMax) return 'high';
    return 'normal';
  }
}
