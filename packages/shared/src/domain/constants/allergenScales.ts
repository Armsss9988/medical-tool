import { AllergenGradingScale } from '../types';
import { normalizeAllergenScale } from '../allergen';

export const STANDARD_ALLERGEN_SCALES: AllergenGradingScale[] = [
  {
    id: 'scale_protia_91',
    name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)',
    equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor',
    unit: 'IU/ml',
    levels: [
      { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0.34', label: 'Không phản ứng', isPositive: false, colorKey: 'white' },
      { grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0.35 - 0.69', label: 'Yếu', isPositive: true, colorKey: 'amber-light' },
      { grade: 2, minVal: 0.70, maxVal: 3.49, rangeText: '0.70 - 3.49', label: 'Trung bình', isPositive: true, colorKey: 'amber' },
      { grade: 3, minVal: 3.50, maxVal: 17.49, rangeText: '3.50 - 17.49', label: 'Khá', isPositive: true, colorKey: 'red-light' },
      { grade: 4, minVal: 17.50, maxVal: 49.99, rangeText: '17.50 - 49.99', label: 'Mạnh', isPositive: true, colorKey: 'red' },
      { grade: 5, minVal: 50.00, maxVal: 99.99, rangeText: '50.00 - 99.99', label: 'Rất mạnh', isPositive: true, colorKey: 'red-bold' },
      { grade: 6, minVal: 100.0, maxVal: null, rangeText: '>100.0', label: 'Cực mạnh', isPositive: true, colorKey: 'red-extreme' }
    ]
  },
  {
    id: 'scale_allergen_44',
    name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (MEDIWISS 44)',
    equipment: 'MEDIWISS AlleisaScreen 44 BLOTrix Reader C1',
    unit: 'IU/ml',
    levels: [
      { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0.35', label: 'Không phản ứng', isPositive: false, colorKey: 'white' },
      { grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0.35 - 0.69', label: 'Yếu', isPositive: true, colorKey: 'amber-light' },
      { grade: 2, minVal: 0.70, maxVal: 3.49, rangeText: '0.70 - 3.49', label: 'Trung bình', isPositive: true, colorKey: 'amber' },
      { grade: 3, minVal: 3.50, maxVal: 17.49, rangeText: '3.50 - 17.49', label: 'Khá', isPositive: true, colorKey: 'red-light' },
      { grade: 4, minVal: 17.50, maxVal: 49.99, rangeText: '17.50 - 49.99', label: 'Mạnh', isPositive: true, colorKey: 'red' },
      { grade: 5, minVal: 50.00, maxVal: 99.99, rangeText: '50.00 - 99.99', label: 'Rất mạnh', isPositive: true, colorKey: 'red-bold' },
      { grade: 6, minVal: 100.0, maxVal: null, rangeText: '>100.0', label: 'Cực mạnh', isPositive: true, colorKey: 'red-extreme' }
    ]
  }
];

export function getAllergenScaleById(id?: string, customScales?: AllergenGradingScale[]): AllergenGradingScale | undefined {
  if (customScales && customScales.length > 0) {
    const found = id ? customScales.find((s) => s.id === id) : customScales[0];
    if (found) return normalizeAllergenScale(found);
  }
  if (id) {
    const std = STANDARD_ALLERGEN_SCALES.find((s) => s.id === id);
    if (std) return normalizeAllergenScale(std);
  } else if (!customScales || customScales.length === 0) {
    return normalizeAllergenScale(STANDARD_ALLERGEN_SCALES[0]);
  }
  return undefined;
}

