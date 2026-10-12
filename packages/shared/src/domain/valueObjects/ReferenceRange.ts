import { ResultStatus } from '../types';
import { formatReferenceRange } from '../formatters';

export class ReferenceRange {
  public readonly refMin: number | null;
  public readonly refMax: number | null;
  public readonly unit: string;
  public readonly refText: string;
  public readonly decimalPlaces?: number | null;

  public constructor(
    refMin: number | null = null,
    refMax: number | null = null,
    unit = '',
    refText = '',
    decimalPlaces: number | null = null
  ) {
    this.refMin = refMin;
    this.refMax = refMax;
    this.unit = unit ? unit.trim() : '';
    this.refText = refText ? refText.trim() : '';
    this.decimalPlaces = decimalPlaces;
  }

  public formatDisplay(decimals?: number | null): string {
    const dec = decimals !== undefined ? decimals : this.decimalPlaces;
    const formatted = formatReferenceRange(this.refMin, this.refMax, this.refText, dec);
    return formatted !== '---' ? formatted : 'Bình thường';
  }

  public evaluateNumeric(val: number): ResultStatus {
    if (this.refMin !== null && val < this.refMin) return 'low';
    if (this.refMax !== null && val > this.refMax) return 'high';
    return 'normal';
  }
}
