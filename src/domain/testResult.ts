import { TestResultEvaluation } from './types';

export function evaluateResult(
  val: string | number | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined
): TestResultEvaluation {
  if (val === null || val === undefined || val === '') return { status: 'normal', label: '' };
  const num = parseFloat(String(val));
  if (isNaN(num)) return { status: 'normal', label: '' };

  if (min !== null && min !== undefined && !isNaN(min) && num < min) {
    return { status: 'low', label: 'THẤP ↓' };
  }
  if (max !== null && max !== undefined && !isNaN(max) && num > max) {
    return { status: 'high', label: 'CAO ↑' };
  }
  return { status: 'normal', label: 'Bình thường' };
}
