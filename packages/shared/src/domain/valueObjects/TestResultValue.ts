import { AllergenGrade, AllergenGradingScale } from '../types';
import { calculateAllergenGrade } from '../allergen';
import { assertNever } from '../utils/assertNever';

export type TestResultValue =
  | {
      readonly kind: 'empty';
      readonly rawString: '';
    }
  | {
      readonly kind: 'quantitative';
      readonly numericValue: number;
      readonly rawString: string;
      readonly unit?: string;
      readonly comparator?: '<' | '>' | '<=' | '>=';
    }
  | {
      readonly kind: 'qualitative';
      readonly normalized: 'Dương tính' | 'Âm tính' | 'Nghi ngờ' | 'Vết';
      readonly rawString: string;
    }
  | {
      readonly kind: 'allergen';
      readonly iuValue: number;
      readonly grade: AllergenGrade;
      readonly classLabel: string;
      readonly rawString: string;
    }
  | {
      readonly kind: 'textual';
      readonly text: string;
      readonly rawString: string;
    };

export class TestResultValueParser {
  /**
   * Phân tích an toàn chuỗi nhập liệu hoặc số thô sang ADT TestResultValue khép kín.
   * Xử lý chính xác dấu phẩy (,), dấu chấm (.), tiền tố so sánh (<, >) và thang dị ứng.
   */
  public static parse(
    val: string | number | null | undefined,
    context?: {
      isAllergen?: boolean;
      scale?: AllergenGradingScale;
      unit?: string;
    }
  ): TestResultValue {
    if (val === null || val === undefined) {
      return { kind: 'empty', rawString: '' };
    }

    const rawStr = String(val).trim();
    if (rawStr === '') {
      return { kind: 'empty', rawString: '' };
    }

    // 1. Nếu là chỉ số dị ứng
    if (context?.isAllergen) {
      const gradeRes = calculateAllergenGrade(rawStr, context.scale);
      const cleanNum = parseFloat(rawStr.replace(',', '.').replace(/[^0-9.]/g, ''));
      return {
        kind: 'allergen',
        iuValue: isNaN(cleanNum) ? 0 : cleanNum,
        grade: gradeRes.grade,
        classLabel: gradeRes.note,
        rawString: rawStr
      };
    }

    const lower = rawStr.toLowerCase();

    // 2. Phân tích kết quả định tính
    if (lower.includes('không phát hiện') || lower.includes('âm') || lower.includes('negative') || lower === 'neg' || lower === '(-)') {
      return { kind: 'qualitative', normalized: 'Âm tính', rawString: rawStr };
    }
    if ((lower.includes('phát hiện') && !lower.includes('không')) || lower.includes('dương') || lower.includes('positive') || lower === 'pos' || lower.includes('(+)')) {
      return { kind: 'qualitative', normalized: 'Dương tính', rawString: rawStr };
    }
    if (lower.includes('nghi ngờ') || lower.includes('indeterminate') || lower.includes('borderline') || lower === '(±)') {
      return { kind: 'qualitative', normalized: 'Nghi ngờ', rawString: rawStr };
    }
    if (lower.includes('vết') || lower === 'trace') {
      return { kind: 'qualitative', normalized: 'Vết', rawString: rawStr };
    }

    // 3. Phân tích kết quả định lượng kèm tiền tố so sánh (VD: "< 15.0", "> 100")
    let comparator: '<' | '>' | '<=' | '>=' | undefined;
    let cleanForNum = rawStr.replace(',', '.');

    if (cleanForNum.startsWith('<=')) {
      comparator = '<=';
      cleanForNum = cleanForNum.slice(2).trim();
    } else if (cleanForNum.startsWith('>=')) {
      comparator = '>=';
      cleanForNum = cleanForNum.slice(2).trim();
    } else if (cleanForNum.startsWith('<')) {
      comparator = '<';
      cleanForNum = cleanForNum.slice(1).trim();
    } else if (cleanForNum.startsWith('>')) {
      comparator = '>';
      cleanForNum = cleanForNum.slice(1).trim();
    }

    const parsedNum = parseFloat(cleanForNum);
    if (!isNaN(parsedNum) && isFinite(parsedNum)) {
      return {
        kind: 'quantitative',
        numericValue: parsedNum,
        rawString: rawStr,
        unit: context?.unit,
        comparator
      };
    }

    // 4. Fallback sang kết quả mô tả chữ thuần túy
    return {
      kind: 'textual',
      text: rawStr,
      rawString: rawStr
    };
  }

  /**
   * Khớp mẫu toàn diện (Exhaustive Pattern Matching) trên TestResultValue
   */
  public static match<T>(
    val: TestResultValue,
    patterns: {
      empty: (v: Extract<TestResultValue, { kind: 'empty' }>) => T;
      quantitative: (v: Extract<TestResultValue, { kind: 'quantitative' }>) => T;
      qualitative: (v: Extract<TestResultValue, { kind: 'qualitative' }>) => T;
      allergen: (v: Extract<TestResultValue, { kind: 'allergen' }>) => T;
      textual: (v: Extract<TestResultValue, { kind: 'textual' }>) => T;
    }
  ): T {
    switch (val.kind) {
      case 'empty':
        return patterns.empty(val);
      case 'quantitative':
        return patterns.quantitative(val);
      case 'qualitative':
        return patterns.qualitative(val);
      case 'allergen':
        return patterns.allergen(val);
      case 'textual':
        return patterns.textual(val);
      default:
        return assertNever(val);
    }
  }
}
