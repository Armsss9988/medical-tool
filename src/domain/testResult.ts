import { TestResultEvaluation, AllergenGradingScale, ReferenceRangeItem } from './types';
import { calculateAllergenGrade } from './allergen';

export function evaluateResult(
  val: string | number | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined
): TestResultEvaluation {
  if (val === null || val === undefined || val === '') return { status: 'normal', label: '' };
  
  const cleanStr = String(val).trim().replace(',', '.');

  // Xử lý các giá trị định tính hoặc dạng so sánh < 15, < 0.35, Âm tính
  if (cleanStr.startsWith('<')) {
    return { status: 'normal', label: 'Bình thường' };
  }
  if (cleanStr.toLowerCase().includes('âm') || cleanStr.toLowerCase().includes('bình thường') || cleanStr.toLowerCase().includes('không')) {
    return { status: 'normal', label: 'Bình thường' };
  }
  if (cleanStr.toLowerCase().includes('dương')) {
    return { status: 'high', label: 'Dương tính' };
  }

  const num = parseFloat(cleanStr);
  if (isNaN(num)) return { status: 'normal', label: '' };

  if (min !== null && min !== undefined && !isNaN(min) && num < min) {
    return { status: 'low', label: 'THẤP ↓' };
  }
  if (max !== null && max !== undefined && !isNaN(max) && num > max) {
    return { status: 'high', label: 'CAO ↑' };
  }
  return { status: 'normal', label: 'Bình thường' };
}

export interface IndicatorEvaluationResult {
  status: 'normal' | 'low' | 'high';
  label: string;
  isAbnormal: boolean;
}

/**
 * Đánh giá tổng hợp chỉ số xét nghiệm:
 * - Riêng Tổng nồng độ IgE (TIgE): Mức bình thường < 15,0 IU/ml. Không tính độ (+).
 * - Các dị nguyên khác: Tính độ dương tính theo bảng thang đo IgE đặc hiệu (Độ 0-6).
 * - Các chỉ số huyết học/sinh hóa thông thường: So sánh với khoảng tham chiếu [min, max].
 */
export function evaluateTestIndicator(
  code: string | undefined,
  category: string | undefined,
  unit: string | undefined,
  val: string | number | null | undefined,
  min?: number | null,
  max?: number | null,
  scale?: AllergenGradingScale,
  refRange?: ReferenceRangeItem
): IndicatorEvaluationResult {
  const isTIgE = (code || '').toLowerCase() === 'tige';
  const isAllergen = !isTIgE && ((category && category.includes('Dị Nguyên')) || unit === 'IU/mL');

  if (isTIgE) {
    // TIgE mức bình thường < 15,0 IU/ml, không tính độ
    const effectiveMax = refRange?.refMax !== undefined && refRange?.refMax !== null ? refRange.refMax : 15.0;
    const evalRes = evaluateResult(val, 0, effectiveMax);
    return {
      status: evalRes.status,
      label: evalRes.status === 'normal' ? (val ? 'Bình thường' : '') : evalRes.label,
      isAbnormal: evalRes.status !== 'normal'
    };
  }

  if (isAllergen) {
    const gradeRes = calculateAllergenGrade(val, scale);
    return {
      status: gradeRes.grade >= 1 ? 'high' : 'normal',
      label: gradeRes.note,
      isAbnormal: gradeRes.grade >= 1
    };
  }

  const effectiveMin = refRange?.refMin !== undefined ? refRange.refMin : min;
  const effectiveMax = refRange?.refMax !== undefined ? refRange.refMax : max;

  const evalRes = evaluateResult(val, effectiveMin, effectiveMax);
  return {
    status: evalRes.status,
    label: evalRes.label,
    isAbnormal: evalRes.status !== 'normal'
  };
}

