import { AllergenGradingScale } from '../types';
import { normalizeAllergenScale } from '../allergen';

export const STANDARD_ALLERGEN_SCALE: AllergenGradingScale = {
  id: 'standard-allergen-scale',
  name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH',
  unit: 'IU/ml',
  levels: [
    { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0,34', label: 'Không phản ứng', isPositive: false },
    { grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0,35 - 0,69', label: 'Yếu', isPositive: true },
    { grade: 2, minVal: 0.70, maxVal: 3.49, rangeText: '0,70 - 3,49', label: 'Trung bình', isPositive: true },
    { grade: 3, minVal: 3.50, maxVal: 17.49, rangeText: '3,50 - 17,49', label: 'Khá', isPositive: true },
    { grade: 4, minVal: 17.50, maxVal: 49.99, rangeText: '17,50 - 49,99', label: 'Mạnh', isPositive: true },
    { grade: 5, minVal: 50.00, maxVal: 99.99, rangeText: '50,00 - 99,99', label: 'Rất mạnh', isPositive: true },
    { grade: 6, minVal: 100.00, maxVal: 999999, rangeText: '≥100,0', label: 'Cực mạnh', isPositive: true }
  ]
};

export function getAllergenScaleById(id?: string, customScales?: AllergenGradingScale[]): AllergenGradingScale {
  if (customScales && customScales.length > 0) {
    const found = id ? customScales.find((s) => s.id === id) : customScales[0];
    if (found) return normalizeAllergenScale(found) || STANDARD_ALLERGEN_SCALE;
  }
  return STANDARD_ALLERGEN_SCALE;
}

