import type { ClinicalStatus } from '../types';

export class ClinicalStatusVO {
  public static readonly DRAFT = new ClinicalStatusVO('Chờ xét nghiệm');
  public static readonly RESULTED = new ClinicalStatusVO('Đã có kết quả');
  public static readonly DELIVERED = new ClinicalStatusVO('Đã trả kết quả');

  private readonly _value: ClinicalStatus;

  public constructor(value: ClinicalStatus | string) {
    if (value === 'Đã trả kết quả' || value === 'DELIVERED') {
      this._value = 'Đã trả kết quả';
    } else if (value === 'Đã có kết quả' || value === 'RESULTED' || value === 'Đã xuất Cloud' || value === 'Cần cập nhật PDF') {
      this._value = 'Đã có kết quả';
    } else {
      this._value = 'Chờ xét nghiệm';
    }
  }

  public get value(): ClinicalStatus {
    return this._value;
  }

  public static from(value?: string | ClinicalStatus | ClinicalStatusVO): ClinicalStatusVO {
    if (value instanceof ClinicalStatusVO) return value;
    if (!value) return ClinicalStatusVO.DRAFT;
    return new ClinicalStatusVO(value);
  }

  public isDraft(): boolean {
    return this._value === 'Chờ xét nghiệm';
  }

  public isResulted(): boolean {
    return this._value === 'Đã có kết quả';
  }

  public isDelivered(): boolean {
    return this._value === 'Đã trả kết quả';
  }

  public canTransitionTo(target: ClinicalStatusVO): boolean {
    if (this._value === 'Chờ xét nghiệm') {
      return target._value === 'Đã có kết quả';
    }
    if (this._value === 'Đã có kết quả') {
      return target._value === 'Đã trả kết quả' || target._value === 'Đã có kết quả';
    }
    if (this._value === 'Đã trả kết quả') {
      return target._value === 'Đã trả kết quả' || target._value === 'Đã có kết quả';
    }
    return false;
  }

  public getBadgeStyle(): { bg: string; text: string; border: string } {
    switch (this._value) {
      case 'Đã trả kết quả':
        return {
          bg: 'bg-purple-500/20',
          text: 'text-purple-300',
          border: 'border-purple-500/30'
        };
      case 'Đã có kết quả':
        return {
          bg: 'bg-sky-500/20',
          text: 'text-sky-300',
          border: 'border-sky-500/30'
        };
      case 'Chờ xét nghiệm':
      default:
        return {
          bg: 'bg-slate-700/40',
          text: 'text-slate-300',
          border: 'border-slate-600/40'
        };
    }
  }

  public label(): string {
    return this._value;
  }

  public toString(): string {
    return this._value;
  }

  public equals(other: ClinicalStatusVO | string): boolean {
    const otherVal = typeof other === 'string' ? other : other.value;
    return this._value === otherVal;
  }
}
