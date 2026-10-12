import type { AllergenGradingScale, ScaleCategory } from '../types';

export type { ScaleCategory };

/**
 * Kiểm tra 1 thang đo có thuộc nhóm Dị Nguyên hay không.
 * Ưu tiên thuộc tính `scaleType`, sau đó kiểm tra ID và tên thang.
 */
export function isAllergenScale(scale: AllergenGradingScale | null | undefined): boolean {
  if (!scale) return false;

  if (scale.scaleType === 'allergen' || scale.scaleType === 'Dị nguyên') {
    return true;
  }
  if (scale.scaleType === 'general' || scale.scaleType === 'Xét nghiệm khác') {
    return false;
  }

  const id = (scale.id || '').toLowerCase();
  const name = (scale.name || '').toLowerCase();

  // Kiểm tra các thang đo phi dị nguyên (Xét nghiệm khác) trước
  if (
    id.includes('beta_hcg') ||
    id.includes('hbv') ||
    id.includes('ana') ||
    id.includes('immunocap') ||
    name.includes('beta-hcg') ||
    name.includes('hbv') ||
    name.includes('ana screen') ||
    name.includes('c6 immunocap') ||
    name.includes('test nhanh') ||
    name.includes('định tính')
  ) {
    return false;
  }

  // Kiểm tra nhận diện thang dị nguyên chuẩn
  if (
    id.includes('protia') ||
    id.includes('allergen') ||
    id.includes('mediwiss') ||
    id.includes('alex2') ||
    name.includes('protia') ||
    name.includes('gói 44') ||
    name.includes('mediwiss') ||
    name.includes('dị nguyên') ||
    name.includes('di nguyen') ||
    name.includes('allergy') ||
    name.includes('dương tính (protia') ||
    name.includes('dương tính (mediwiss')
  ) {
    return true;
  }

  return false;
}

/**
 * Trả về nhóm chuẩn của thang đo: 'Dị nguyên' hoặc 'Xét nghiệm khác'.
 */
export function getScaleCategory(scale: AllergenGradingScale | null | undefined): ScaleCategory {
  return isAllergenScale(scale) ? 'Dị nguyên' : 'Xét nghiệm khác';
}

/**
 * Kiểm tra tên nhóm chỉ số có phải là nhóm Dị Nguyên hay không.
 */
export function isAllergenCategory(categoryName?: string | null): boolean {
  if (!categoryName) return false;
  const cat = categoryName.toLowerCase().trim();
  return (
    cat.includes('dị nguyên') ||
    cat.includes('di nguyen') ||
    cat.includes('allergen') ||
    cat.includes('dị ứng') ||
    cat.includes('di ung')
  );
}

/**
 * Kiểm tra tính hợp lệ khi gán thang đo cho một chỉ số.
 * Quy tắc bất biến:
 * - Chỉ số nhóm Dị Nguyên CHỈ ĐƯỢC gán thang đo Dị Nguyên.
 * - Chỉ số nhóm khác CHỈ ĐƯỢC gán thang đo Xét nghiệm khác.
 */
export function validateScaleAssignment(
  categoryName: string | undefined | null,
  scale: AllergenGradingScale | null | undefined
): { valid: boolean; reason?: string } {
  if (!scale) {
    return { valid: true };
  }

  const isAllergenCat = isAllergenCategory(categoryName);
  const isScaleAllergen = isAllergenScale(scale);

  if (isAllergenCat && !isScaleAllergen) {
    return {
      valid: false,
      reason: `Chỉ số thuộc nhóm Dị nguyên "${categoryName || ''}" chỉ được gán thang đo Dị nguyên, không thể gán thang "${scale.name}".`
    };
  }

  if (!isAllergenCat && isScaleAllergen) {
    return {
      valid: false,
      reason: `Chỉ số thuộc nhóm "${categoryName || ''}" không phải Dị nguyên, không thể gán thang đo Dị nguyên "${scale.name}".`
    };
  }

  return { valid: true };
}
