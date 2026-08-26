import type { SampleStatus } from '../types';

export class SampleStatusVO {
  public static readonly ACCEPTED = new SampleStatusVO('Đạt');
  public static readonly REJECTED = new SampleStatusVO('Không đạt');
  public static readonly COLLECTING = new SampleStatusVO('Đang lấy mẫu');

  private readonly _value: SampleStatus;

  public constructor(value: SampleStatus | string) {
    if (value === 'Không đạt' || value === 'REJECTED') {
      this._value = 'Không đạt';
    } else if (value === 'Đang lấy mẫu' || value === 'COLLECTING') {
      this._value = 'Đang lấy mẫu';
    } else {
      this._value = 'Đạt';
    }
  }

  public get value(): SampleStatus {
    return this._value;
  }

  public static from(value?: string | SampleStatus | SampleStatusVO): SampleStatusVO {
    if (value instanceof SampleStatusVO) return value;
    if (!value) return SampleStatusVO.ACCEPTED;
    return new SampleStatusVO(value);
  }

  public isAccepted(): boolean {
    return this._value === 'Đạt';
  }

  public isRejected(): boolean {
    return this._value === 'Không đạt';
  }

  public isCollecting(): boolean {
    return this._value === 'Đang lấy mẫu';
  }

  public getBadgeStyle(): { bg: string; text: string; border: string } {
    switch (this._value) {
      case 'Không đạt':
        return {
          bg: 'bg-rose-500/20',
          text: 'text-rose-300',
          border: 'border-rose-500/30'
        };
      case 'Đang lấy mẫu':
        return {
          bg: 'bg-amber-500/20',
          text: 'text-amber-300',
          border: 'border-amber-500/30'
        };
      case 'Đạt':
      default:
        return {
          bg: 'bg-emerald-500/20',
          text: 'text-emerald-300',
          border: 'border-emerald-500/30'
        };
    }
  }

  public label(): string {
    return this._value;
  }

  public toString(): string {
    return this._value;
  }

  public equals(other: SampleStatusVO | string): boolean {
    const otherVal = typeof other === 'string' ? other : other.value;
    return this._value === otherVal;
  }
}
