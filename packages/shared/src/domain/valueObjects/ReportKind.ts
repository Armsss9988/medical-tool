import { CatalogItem } from '../types';
import { isAllergenTest } from '../allergenDetector';
import { PRINT_ELEMENT_ID, PrintElementId } from '../constants/uiConstants';
import { assertNever } from '../utils/assertNever';

export type ReportKindType = 'clinical' | 'allergen' | 'hybrid';

export interface ReportKindBadge {
  readonly label: string;
  readonly subLabel: string;
  readonly bgClass: string;
  readonly textClass: string;
  readonly borderClass: string;
}

export type ReportKind =
  | {
      readonly type: 'clinical';
      readonly elementId: PrintElementId;
      readonly badge: ReportKindBadge;
      readonly totalCount: number;
    }
  | {
      readonly type: 'allergen';
      readonly elementId: PrintElementId;
      readonly badge: ReportKindBadge;
      readonly allergenCount: number;
      readonly totalCount: number;
      readonly scaleId?: string;
    }
  | {
      readonly type: 'hybrid';
      readonly elementId: PrintElementId;
      readonly badge: ReportKindBadge;
      readonly clinicalCount: number;
      readonly allergenCount: number;
      readonly totalCount: number;
    };

export class ReportKindResolver {
  /**
   * Phân giải danh sách chỉ số xét nghiệm sang ADT ReportKind khép kín.
   */
  public static resolve(
    tests: ReadonlyArray<Pick<CatalogItem, 'code' | 'category' | 'unit'>> | null | undefined,
    options?: { isBatch?: boolean; scaleId?: string }
  ): ReportKind {
    const safeTests = tests || [];
    const isBatch = Boolean(options?.isBatch);

    if (safeTests.length === 0) {
      return {
        type: 'clinical',
        elementId: isBatch ? PRINT_ELEMENT_ID.BATCH_MEDICAL : PRINT_ELEMENT_ID.MEDICAL_REPORT,
        badge: this.getBadge('clinical'),
        totalCount: 0
      };
    }

    let clinicalCount = 0;
    let allergenCount = 0;

    for (const t of safeTests) {
      if (isAllergenTest(t)) {
        allergenCount++;
      } else {
        clinicalCount++;
      }
    }

    if (clinicalCount > 0 && allergenCount > 0) {
      return {
        type: 'hybrid',
        elementId: isBatch ? PRINT_ELEMENT_ID.BATCH_HYBRID : PRINT_ELEMENT_ID.HYBRID_REPORT,
        badge: this.getBadge('hybrid'),
        clinicalCount,
        allergenCount,
        totalCount: safeTests.length
      };
    }

    if (allergenCount > 0 && clinicalCount === 0) {
      return {
        type: 'allergen',
        elementId: isBatch ? PRINT_ELEMENT_ID.BATCH_ALLERGEN : PRINT_ELEMENT_ID.ALLERGEN_REPORT,
        badge: this.getBadge('allergen'),
        allergenCount,
        totalCount: allergenCount,
        scaleId: options?.scaleId
      };
    }

    return {
      type: 'clinical',
      elementId: isBatch ? PRINT_ELEMENT_ID.BATCH_MEDICAL : PRINT_ELEMENT_ID.MEDICAL_REPORT,
      badge: this.getBadge('clinical'),
      totalCount: clinicalCount
    };
  }

  /**
   * Khớp mẫu đầy đủ (Exhaustive Pattern Matching) trên ADT ReportKind.
   */
  public static match<T>(
    kind: ReportKind,
    patterns: {
      clinical: (k: Extract<ReportKind, { type: 'clinical' }>) => T;
      allergen: (k: Extract<ReportKind, { type: 'allergen' }>) => T;
      hybrid: (k: Extract<ReportKind, { type: 'hybrid' }>) => T;
    }
  ): T {
    switch (kind.type) {
      case 'clinical':
        return patterns.clinical(kind);
      case 'allergen':
        return patterns.allergen(kind);
      case 'hybrid':
        return patterns.hybrid(kind);
      default:
        return assertNever(kind);
    }
  }

  public static getBadge(type: ReportKindType): ReportKindBadge {
    switch (type) {
      case 'hybrid':
        return {
          label: 'Mẫu Hỗn Hợp (Hybrid)',
          subLabel: 'Xét nghiệm thường + Cuốn Dị nguyên',
          bgClass: 'bg-gradient-to-r from-purple-100 to-indigo-100',
          textClass: 'text-purple-800',
          borderClass: 'border-purple-300'
        };
      case 'allergen':
        return {
          label: 'Mẫu Cuốn Dị Nguyên',
          subLabel: 'Booklet chuyên sâu định lượng IgE',
          bgClass: 'bg-gradient-to-r from-amber-100 to-orange-100',
          textClass: 'text-amber-800',
          borderClass: 'border-amber-300'
        };
      case 'clinical':
        return {
          label: 'Mẫu Xét Nghiệm Chuẩn',
          subLabel: 'Huyết học, Sinh hóa, Nước tiểu...',
          bgClass: 'bg-emerald-50',
          textClass: 'text-emerald-800',
          borderClass: 'border-emerald-200'
        };
      default:
        return assertNever(type);
    }
  }
}
