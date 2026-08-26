import type { DocumentStatus } from '../types';

export class DocumentStatusVO {
  public static readonly UNEXPORTED = new DocumentStatusVO('Chưa xuất PDF');
  public static readonly SYNCED = new DocumentStatusVO('Đã xuất Cloud');
  public static readonly OUTDATED = new DocumentStatusVO('Cần cập nhật PDF');

  private readonly _value: DocumentStatus;

  public constructor(value: DocumentStatus | string) {
    if (value === 'Đã xuất Cloud' || value === 'SYNCED') {
      this._value = 'Đã xuất Cloud';
    } else if (value === 'Cần cập nhật PDF' || value === 'OUTDATED') {
      this._value = 'Cần cập nhật PDF';
    } else {
      this._value = 'Chưa xuất PDF';
    }
  }

  public get value(): DocumentStatus {
    return this._value;
  }

  public static from(value?: string | DocumentStatus | DocumentStatusVO): DocumentStatusVO {
    if (value instanceof DocumentStatusVO) return value;
    if (!value) return DocumentStatusVO.UNEXPORTED;
    return new DocumentStatusVO(value);
  }

  public isUnexported(): boolean {
    return this._value === 'Chưa xuất PDF';
  }

  public isSynced(): boolean {
    return this._value === 'Đã xuất Cloud';
  }

  public isOutdated(): boolean {
    return this._value === 'Cần cập nhật PDF';
  }

  public markOutdated(): DocumentStatusVO {
    return DocumentStatusVO.OUTDATED;
  }

  public markSynced(): DocumentStatusVO {
    return DocumentStatusVO.SYNCED;
  }

  public getBadgeStyle(): { bg: string; text: string; border: string } {
    switch (this._value) {
      case 'Đã xuất Cloud':
        return {
          bg: 'bg-emerald-500/20',
          text: 'text-emerald-300',
          border: 'border-emerald-500/30'
        };
      case 'Cần cập nhật PDF':
        return {
          bg: 'bg-amber-500/20',
          text: 'text-amber-300',
          border: 'border-amber-500/30'
        };
      case 'Chưa xuất PDF':
      default:
        return {
          bg: 'bg-slate-700/40',
          text: 'text-slate-400',
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

  public equals(other: DocumentStatusVO | string): boolean {
    const otherVal = typeof other === 'string' ? other : other.value;
    return this._value === otherVal;
  }
}
