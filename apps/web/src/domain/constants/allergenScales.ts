import { AllergenGradingScale } from '../types';

export const DEFAULT_PROTIA_91_SCALE: AllergenGradingScale = {
  id: 'scale_protia_91',
  name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)',
  equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor',
  unit: 'IU/ml',
  levels: [
    { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0,34', label: 'Không phản ứng', isPositive: false, colorKey: 'white' },
    { grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0,35 - 0,69', label: 'Yếu', isPositive: true, colorKey: 'amber-light' },
    { grade: 2, minVal: 0.70, maxVal: 3.49, rangeText: '0,70 - 3,49', label: 'Trung bình', isPositive: true, colorKey: 'amber' },
    { grade: 3, minVal: 3.50, maxVal: 17.49, rangeText: '3,50 - 17,49', label: 'Khá', isPositive: true, colorKey: 'red-light' },
    { grade: 4, minVal: 17.50, maxVal: 49.99, rangeText: '17,50 - 49,99', label: 'Mạnh', isPositive: true, colorKey: 'red' },
    { grade: 5, minVal: 50.00, maxVal: 99.99, rangeText: '50,00 - 99,99', label: 'Rất mạnh', isPositive: true, colorKey: 'red-bold' },
    { grade: 6, minVal: 100.0, maxVal: null, rangeText: '>100,0', label: 'Cực mạnh', isPositive: true, colorKey: 'red-extreme' }
  ]
};

export const DEFAULT_ALLERGEN_44_SCALE: AllergenGradingScale = {
  id: 'scale_allergen_44',
  name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH',
  equipment: 'Hệ Thống Phân Tích 44 Dị Nguyên',
  unit: 'IU/ml',
  levels: [
    { grade: 0, minVal: 0, maxVal: 0.35, rangeText: '<0,35', label: 'Không phản ứng', isPositive: false, colorKey: 'white' },
    { grade: 1, minVal: 0.36, maxVal: 0.69, rangeText: '0,36 - 0,69', label: 'Yếu', isPositive: true, colorKey: 'amber-light' },
    { grade: 2, minVal: 0.70, maxVal: 3.49, rangeText: '0,70 - 3,49', label: 'Trung bình', isPositive: true, colorKey: 'amber' },
    { grade: 3, minVal: 3.50, maxVal: 17.49, rangeText: '3,50 - 17,49', label: 'Khá', isPositive: true, colorKey: 'red-light' },
    { grade: 4, minVal: 17.50, maxVal: 49.99, rangeText: '17,50 - 49,99', label: 'Mạnh', isPositive: true, colorKey: 'red' },
    { grade: 5, minVal: 50.00, maxVal: 99.99, rangeText: '50,00 - 99,99', label: 'Rất mạnh', isPositive: true, colorKey: 'red-bold' },
    { grade: 6, minVal: 100.0, maxVal: null, rangeText: '>100,0', label: 'Cực mạnh', isPositive: true, colorKey: 'red-extreme' }
  ]
};

export const DEFAULT_ALLERGEN_SCALES: AllergenGradingScale[] = [
  DEFAULT_PROTIA_91_SCALE,
  DEFAULT_ALLERGEN_44_SCALE
];

export function getAllergenScaleById(id?: string, customScales?: AllergenGradingScale[]): AllergenGradingScale {
  if (!id) return DEFAULT_PROTIA_91_SCALE;
  const pool = customScales && customScales.length > 0 ? customScales : DEFAULT_ALLERGEN_SCALES;
  return pool.find((s) => s.id === id) || DEFAULT_PROTIA_91_SCALE;
}
