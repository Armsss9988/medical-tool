import { ReferenceRangeItem } from '../../domain/types';

export const DEFAULT_REFERENCE_RANGES: ReferenceRangeItem[] = [
  // Sinh Hóa Máu
  {
    id: 'ref_glucose',
    name: 'Glucose máu (Đường huyết)',
    refMin: 3.9,
    refMax: 6.4,
    unit: 'mmol/L',
    refText: '3.9 - 6.4',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_ure',
    name: 'Ure máu',
    refMin: 2.5,
    refMax: 7.5,
    unit: 'mmol/L',
    refText: '2.5 - 7.5',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_creatinine',
    name: 'Creatinine máu',
    refMin: 53,
    refMax: 106,
    unit: 'µmol/L',
    refText: '53 - 106',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_ast',
    name: 'AST (GOT) - Men gan',
    refMin: 0,
    refMax: 37,
    unit: 'U/L',
    refText: '< 37',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_alt',
    name: 'ALT (GPT) - Men gan',
    refMin: 0,
    refMax: 41,
    unit: 'U/L',
    refText: '< 41',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_uric',
    name: 'Acid Uric máu',
    refMin: 200,
    refMax: 420,
    unit: 'µmol/L',
    refText: '200 - 420',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_cholesterol',
    name: 'Cholesterol toàn phần',
    refMin: 3.9,
    refMax: 5.2,
    unit: 'mmol/L',
    refText: '3.9 - 5.2',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_triglyceride',
    name: 'Triglyceride máu',
    refMin: 0.46,
    refMax: 1.88,
    unit: 'mmol/L',
    refText: '0.46 - 1.88',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_hdl',
    name: 'HDL - Cholesterol (Mỡ tốt)',
    refMin: 0.9,
    refMax: 2.2,
    unit: 'mmol/L',
    refText: '0.9 - 2.2',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_ldl',
    name: 'LDL - Cholesterol (Mỡ xấu)',
    refMin: 0,
    refMax: 3.4,
    unit: 'mmol/L',
    refText: '< 3.4',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },

  // Tổng nồng độ IgE & Miễn Dịch
  {
    id: 'ref_tige',
    name: 'Tổng nồng độ IgE (Total IgE)',
    refMin: 0,
    refMax: 15.0,
    unit: 'IU/mL',
    refText: '< 15,0',
    gender: 'Tất cả',
    ageGroup: 'Tất cả'
  },
  {
    id: 'ref_crp',
    name: 'CRP Định lượng (Protein phản ứng C)',
    refMin: 0,
    refMax: 5.0,
    unit: 'mg/L',
    refText: '< 5.0',
    gender: 'Tất cả',
    ageGroup: 'Tất cả'
  },

  // Huyết Học Tổng Quát
  {
    id: 'ref_wbc',
    name: 'WBC - Số lượng bạch cầu',
    refMin: 4.0,
    refMax: 10.0,
    unit: 'G/L',
    refText: '4.0 - 10.0',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_rbc',
    name: 'RBC - Số lượng hồng cầu',
    refMin: 3.8,
    refMax: 5.3,
    unit: 'T/L',
    refText: '3.8 - 5.3',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_hgb',
    name: 'HGB - Lượng huyết sắc tố',
    refMin: 120,
    refMax: 165,
    unit: 'g/L',
    refText: '120 - 165',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_plt',
    name: 'PLT - Số lượng tiểu cầu',
    refMin: 150,
    refMax: 450,
    unit: 'G/L',
    refText: '150 - 450',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },

  // Vi Chất & Vitamin
  {
    id: 'ref_fe',
    name: 'Sắt huyết thanh (Fe)',
    refMin: 11,
    refMax: 27,
    unit: 'µmol/L',
    refText: '11 - 27',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_ferritin',
    name: 'Ferritin dự trữ',
    refMin: 30,
    refMax: 400,
    unit: 'ng/mL',
    refText: '30 - 400',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_calci',
    name: 'Calci toàn phần',
    refMin: 2.15,
    refMax: 2.55,
    unit: 'mmol/L',
    refText: '2.15 - 2.55',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_calci_ion',
    name: 'Calci Ion hóa',
    refMin: 1.15,
    refMax: 1.35,
    unit: 'mmol/L',
    refText: '1.15 - 1.35',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_vit_d',
    name: 'Vitamin D3 (25-OH Vitamin D)',
    refMin: 30,
    refMax: 100,
    unit: 'ng/mL',
    refText: '30 - 100',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_zn',
    name: 'Kẽm huyết thanh (Zn)',
    refMin: 11,
    refMax: 18,
    unit: 'µmol/L',
    refText: '11 - 18',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_c3',
    name: 'Bổ thể C3',
    refMin: 0.9,
    refMax: 1.8,
    unit: 'g/L',
    refText: '0.9 - 1.8',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_c4',
    name: 'Bổ thể C4',
    refMin: 0.1,
    refMax: 0.4,
    unit: 'g/L',
    refText: '0.1 - 0.4',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  },
  {
    id: 'ref_anascr',
    name: 'ANA Screen',
    refMin: null,
    refMax: 20,
    unit: 'IU/mL',
    refText: 'Âm tính <20 IU/ml',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  }
];

export const CODE_TO_REFERENCE_RANGE_MAP: Record<string, string> = {
  RBC: 'ref_rbc',
  HGB: 'ref_hgb',
  WBC: 'ref_wbc',
  PLT: 'ref_plt',
  GLU: 'ref_glucose',
  URE: 'ref_ure',
  CREAT: 'ref_creatinine',
  AST: 'ref_ast',
  ALT: 'ref_alt',
  URIC: 'ref_uric',
  CHO: 'ref_cholesterol',
  TRI: 'ref_triglyceride',
  HDL: 'ref_hdl',
  LDL: 'ref_ldl',
  CRP: 'ref_crp',
  VITD: 'ref_vit_d',
  ZN: 'ref_zn',
  FERR: 'ref_ferritin',
  IRON: 'ref_fe',
  CALCI: 'ref_calci',
  CAT: 'ref_calci',
  ICA: 'ref_calci_ion',
  TIGE: 'ref_tige',
  C3: 'ref_c3',
  C4: 'ref_c4',
  ANASCR: 'ref_anascr'
};

export function autoResolveItemLinks<T extends { code: string; referenceRangeId?: string; scaleId?: string; evaluationType?: string; category?: string; unit?: string }>(item: T): T {
  const isExcluded = ['TIGE', 'ANASCR', 'C3', 'C4'].includes(item.code.toUpperCase());
  const isAllergen = !isExcluded && ((item.category && item.category.includes('Dị Nguyên')) || item.unit === 'IU/mL' || item.scaleId);

  if (isAllergen) {
    if (!item.scaleId) {
      return {
        ...item,
        scaleId: 'scale_protia_91',
        referenceRangeId: undefined,
        evaluationType: 'scale'
      };
    }
    return {
      ...item,
      referenceRangeId: undefined,
      evaluationType: 'scale'
    };
  }

  // General indicator
  const mappedRefId = CODE_TO_REFERENCE_RANGE_MAP[item.code.toUpperCase()];
  if (mappedRefId && !item.referenceRangeId) {
    return {
      ...item,
      referenceRangeId: mappedRefId,
      scaleId: undefined,
      evaluationType: 'range'
    };
  }

  return item;
}

export function getReferenceRangeById(
  id?: string,
  customRanges?: ReferenceRangeItem[]
): ReferenceRangeItem | undefined {
  if (!id) return undefined;
  const pool = customRanges && customRanges.length > 0 ? customRanges : DEFAULT_REFERENCE_RANGES;
  return pool.find((r) => r.id === id);
}
