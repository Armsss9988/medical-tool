import type { CatalogItem, CatalogItemEquipmentLink, AllergenGradingScale, TestEquipment } from '../types';
import { getScaleCategory, isAllergenCategory } from './scaleClassification';
import { formatReferenceRange, formatDecimalNumber } from '../formatters';

/**
 * Thang chuẩn Beta-hCG theo đúng yêu cầu lâm sàng kỹ thuật:
 * Bậc 0: < 5 -> Âm tính (bình thường)
 * Bậc 1: 5 - 25 -> Vùng xám (cảnh báo)
 * Bậc 2: > 25 -> Dương tính (báo động)
 */
export const STANDARD_BETA_HCG_SCALE: AllergenGradingScale = {
  id: 'scale_beta_hcg',
  name: 'Beta-hCG (mIU/mL)',
  scaleType: 'Xét nghiệm khác',
  unit: 'mIU/mL',
  equipment: 'Máy Miễn Dịch Tự Động',
  levels: [
    { grade: 0, minVal: 0, maxVal: 5, rangeText: '< 5', label: 'Âm tính', isPositive: false, colorKey: 'white' },
    { grade: 1, minVal: 5, maxVal: 25, rangeText: '5 - 25', label: 'Vùng xám', isPositive: true, colorKey: 'amber' },
    { grade: 2, minVal: 25, maxVal: null, rangeText: '> 25', label: 'Dương tính', isPositive: true, colorKey: 'red-bold' }
  ]
};

/**
 * Danh sách tên/mã thang đo cũ cần xóa bỏ theo tài liệu kỹ thuật
 */
export const DEPRECATED_SCALE_NAMES = [
  'Beta-hCG – Chẩn đoán thai (mIU/mL)',
  'C6 dị ứng kháng sinh',
  'Cấu hình ANA Screen trên Dynex DS2'
];

export interface SanitizeCatalogResult {
  catalog: CatalogItem[];
  links: CatalogItemEquipmentLink[];
  scales: AllergenGradingScale[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Dọn dẹp triệt để các giá trị rác 14 và 15 sinh ra từ lỗi import Excel cũ:
 * 1. Đơn vị là '14' hoặc '15' -> đưa về rỗng '' (hoặc undefined với links).
 * 2. 55 dòng bệnh SS55_* -> đặt Min/Max về null, đơn vị rỗng, tham chiếu lấy từ scientific, kiểu 'text'.
 * 3. Chỉ số C2 (không phải dị nguyên) -> Min 8.0, Max null, refText '> 8,0'.
 * 4. Chỉ số C3 (sàng lọc sơ sinh) -> Min 0, Max 4.20, refText '< 4,20'.
 * 5. G6PD, GALT có Max 14 hoặc 15 -> xóa Max về null.
 * 6. Chuỗi tham chiếu có dạng '14 - 14', '15 - 15', '14 – 14', '15 – 15' -> làm sạch/tính lại.
 */
export function cleanGarbage14And15(
  catalog: CatalogItem[],
  links: CatalogItemEquipmentLink[] = []
): { catalog: CatalogItem[]; links: CatalogItemEquipmentLink[] } {
  const cleanedCatalog = catalog.map((item) => {
    const code = item.code.toUpperCase();
    const isAllergen = isAllergenCategory(item.category);
    let unit = (item.unit === '14' || item.unit === '15') ? '' : item.unit;
    let refMin = (item.refMin === 14 || item.refMin === 15) ? null : item.refMin;
    let refMax = (item.refMax === 14 || item.refMax === 15) ? null : item.refMax;
    let refText = item.refText;
    let evalType = item.evaluationType || 'range';

    if (code.startsWith('SS55_')) {
      unit = '';
      refMin = null;
      refMax = null;
      evalType = 'text';
      refText = item.scientific || (refText && (refText.includes('14') || refText.includes('15')) ? '' : refText);
    } else if (code === 'C2' && !isAllergen) {
      refMin = 8.0;
      refMax = null;
      refText = '> 8,0';
      evalType = 'range';
    } else if (code === 'C3' && (item.category.toLowerCase().includes('sàng lọc') || item.category.toLowerCase().includes('chuyển hóa') || item.category.toLowerCase().includes('nhi'))) {
      refMin = 0;
      refMax = 4.20;
      refText = '< 4,20';
      evalType = 'range';
    } else if ((code === 'G6PD' || code === 'GALT') && (refMax === 14 || refMax === 15 || item.refMax === 14 || item.refMax === 15)) {
      refMax = null;
      refText = refMin !== null && refMin !== undefined ? `> ${formatDecimalNumber(refMin, item.decimalPlaces)}` : '---';
    } else if (code.includes('/')) {
      // 4 tỷ lệ: C3/C2, ...
      if (unit === '14' || unit === '15') unit = '';
      refMin = null;
      refMax = null;
      if (refText && (refText.includes('14') || refText.includes('15'))) {
        refText = formatReferenceRange(refMin, refMax, undefined, item.decimalPlaces);
      }
    }

    if (refText === '14 - 14' || refText === '15 - 15' || refText === '14 – 14' || refText === '15 – 15') {
      refText = formatReferenceRange(refMin, refMax, undefined, item.decimalPlaces);
    }

    return {
      ...item,
      unit,
      refMin,
      refMax,
      refText: refText !== '---' ? refText : '',
      evaluationType: evalType
    };
  });

  const cleanedLinks = links.map((link) => {
    const code = link.catalogCode.toUpperCase();
    let unit = (link.unit === '14' || link.unit === '15') ? undefined : link.unit;
    let refMin = (link.refMin === 14 || link.refMin === 15) ? null : link.refMin;
    let refMax = (link.refMax === 14 || link.refMax === 15) ? null : link.refMax;
    let refText = link.refText;

    if (code.startsWith('SS55_')) {
      unit = undefined;
      refMin = null;
      refMax = null;
      if (refText && (refText.includes('14') || refText.includes('15'))) {
        refText = undefined;
      }
    } else if (code === 'C2') {
      if (refMax === 14 || refMax === 15) refMax = null;
      refMin = 8.0;
      refText = '> 8,0';
    } else if ((code === 'G6PD' || code === 'GALT') && (refMax === 14 || refMax === 15 || link.refMax === 14 || link.refMax === 15)) {
      refMax = null;
      refText = refMin !== null && refMin !== undefined ? `> ${formatDecimalNumber(refMin, link.decimalPlaces)}` : undefined;
    } else if (code.includes('/')) {
      if (unit === '14' || unit === '15') unit = undefined;
      refMin = null;
      refMax = null;
    }

    if (refText === '14 - 14' || refText === '15 - 15' || refText === '14 – 14' || refText === '15 – 15') {
      refText = formatReferenceRange(refMin, refMax, undefined, link.decimalPlaces);
    }

    return {
      ...link,
      unit,
      refMin,
      refMax,
      refText: refText !== '---' ? refText : undefined
    };
  });

  return {
    catalog: cleanedCatalog,
    links: cleanedLinks
  };
}

/**
 * Hàm làm sạch và đồng bộ dữ liệu chỉ số, thang đo và cấu hình máy:
 * 1. Xóa bỏ các thang đo rác không dùng, đảm bảo thang chuẩn Beta-hCG.
 * 2. Chuẩn hóa 12 mã chỉ số: BHCG, HBV, ANASCR, C1, C2, C5, C6, C7, TEST_FLU, ASLO, RF, ESR.
 * 3. Làm sạch cấu hình máy đo HPDADAY (chỉ giữ 1 máy Urea C14, xóa UUID rác).
 * 4. Đảm bảo mỗi chỉ số có duy nhất 1 cấu hình máy mặc định.
 * 5. Chạy cleanGarbage14And15 loại bỏ triệt để rác 14/15.
 */
export function sanitizeCatalogAndEquipments(
  catalog: CatalogItem[],
  links: CatalogItemEquipmentLink[],
  scales: AllergenGradingScale[],
  equipments: TestEquipment[] = []
): SanitizeCatalogResult {
  // 0. Làm sạch số rác 14/15
  const garbageCleaned = cleanGarbage14And15(catalog, links);

  // 1. Dọn dẹp và chuẩn hóa Scales
  let cleanScales: AllergenGradingScale[] = scales
    .filter((s) => !DEPRECATED_SCALE_NAMES.includes(s.name) && !DEPRECATED_SCALE_NAMES.includes(s.id))
    .map((s) => ({
      ...s,
      scaleType: s.scaleType || getScaleCategory(s)
    }));

  const hasBetaHcg = cleanScales.some(
    (s) => s.id === 'scale_beta_hcg' || s.name.toLowerCase() === 'beta-hcg (miu/ml)'
  );
  if (!hasBetaHcg) {
    cleanScales.push(STANDARD_BETA_HCG_SCALE);
  } else {
    cleanScales = cleanScales.map((s) =>
      s.id === 'scale_beta_hcg' || s.name.toLowerCase() === 'beta-hcg (miu/ml)'
        ? { ...STANDARD_BETA_HCG_SCALE, id: s.id }
        : s
    );
  }

  // 2. Chuẩn hóa 12 mã chỉ số
  const cleanCatalog = garbageCleaned.catalog.map((item) => {
    const code = item.code.toUpperCase();
    if (code === 'BHCG') {
      return {
        ...item,
        evaluationType: 'scale' as const,
        scaleId: 'scale_beta_hcg',
        unit: item.unit || 'mIU/mL',
        refText: '< 5',
        refMin: null,
        refMax: null
      };
    }
    if (code === 'HBV') {
      return {
        ...item,
        evaluationType: 'scale' as const,
        scaleId: item.scaleId || 'scale_hbv',
        unit: item.unit || 'IU/mL',
        refMin: null,
        refMax: null
      };
    }
    if (code === 'ANASCR') {
      return {
        ...item,
        evaluationType: 'scale' as const,
        scaleId: item.scaleId || 'scale_ana',
        unit: item.unit || 'IU/mL',
        refMin: null,
        refMax: null
      };
    }
    if (['C1', 'C5', 'C6', 'C7', 'TEST_FLU'].includes(code)) {
      return {
        ...item,
        evaluationType: 'scale' as const
      };
    }
    if (code === 'C2') {
      if (isAllergenCategory(item.category)) {
        return {
          ...item,
          evaluationType: 'scale' as const
        };
      } else {
        return {
          ...item,
          evaluationType: 'range' as const,
          refMin: 8.0,
          refMax: null,
          refText: '> 8,0',
          scaleId: undefined
        };
      }
    }
    if (['ASLO', 'RF', 'ESR'].includes(code)) {
      return {
        ...item,
        evaluationType: 'range' as const,
        scaleId: undefined
      };
    }
    return item;
  });

  // 3. Chuẩn hóa Links (Cấu hình thiết bị)
  let cleanLinks = garbageCleaned.links.filter((l) => {
    const eqId = l.equipmentId || '';
    if (UUID_REGEX.test(eqId) || eqId.startsWith('eq_eq_') || eqId.startsWith('eq_f3ba') || eqId.includes('f3ba2e15')) {
      return false;
    }
    return true;
  });

  // Tìm máy Urea C14 chuẩn cho HPDADAY
  const ureaC14Eq = equipments.find(
    (e) => e.name?.toLowerCase().includes('urea c14') || e.code?.toUpperCase() === 'C14' || e.id === 'eq_urea_c14'
  );
  const targetC14Id = ureaC14Eq?.id || 'eq_urea_c14';

  const nonHpLinks = cleanLinks.filter((l) => l.catalogCode !== 'HPDADAY');
  const hpExisting = cleanLinks.filter((l) => l.catalogCode === 'HPDADAY');
  const validHpLink = hpExisting.find((l) => l.equipmentId === targetC14Id);

  const finalHpLink: CatalogItemEquipmentLink = validHpLink
    ? { ...validHpLink, isDefault: true }
    : {
        id: `cie_hpdaday_${targetC14Id}_default`,
        catalogCode: 'HPDADAY',
        equipmentId: targetC14Id,
        evaluationType: 'range',
        refMin: 0,
        refMax: 50,
        unit: 'DPM',
        refText: '< 50',
        isDefault: true
      };

  cleanLinks = [...nonHpLinks, finalHpLink];

  // Đảm bảo mỗi catalogCode có đúng 1 default machine
  const codeMap = new Map<string, CatalogItemEquipmentLink[]>();
  for (const l of cleanLinks) {
    if (!codeMap.has(l.catalogCode)) codeMap.set(l.catalogCode, []);
    codeMap.get(l.catalogCode)!.push(l);
  }
  codeMap.forEach((group) => {
    const defaultOnes = group.filter((g) => g.isDefault);
    if (defaultOnes.length === 0) {
      group[0].isDefault = true;
    } else if (defaultOnes.length > 1) {
      defaultOnes.slice(0, -1).forEach((g) => (g.isDefault = false));
    }
  });

  return {
    catalog: cleanCatalog,
    links: cleanLinks,
    scales: cleanScales
  };
}
