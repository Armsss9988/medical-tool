import { 
  CatalogItem, 
  CatalogItemEquipmentLink, 
  ReferenceRangeItem, 
  AllergenGradingScale, 
  TestEquipment, 
  EvaluationType 
} from '../types';
import { getAllergenScaleById } from '../constants/allergenScales';

export const DEFAULT_CODE_TO_REFERENCE_RANGE_MAP: Record<string, string> = {
  GLU: 'ref_glucose',
  URE: 'ref_ure',
  CRE: 'ref_creatinine',
  GOT: 'ref_ast',
  AST: 'ref_ast',
  GPT: 'ref_alt',
  ALT: 'ref_alt',
  GGT: 'ref_ggt',
  ACID_URIC: 'ref_uric',
  CHO: 'ref_cholesterol',
  TRI: 'ref_triglyceride',
  HDL: 'ref_hdl',
  LDL: 'ref_ldl',
  BIL_T: 'ref_bil_total',
  BIL_D: 'ref_bil_direct',
  BIL_I: 'ref_bil_indirect',
  PROT: 'ref_protein',
  ALB: 'ref_albumin',
  CRP: 'ref_crp',
  MG: 'ref_mg',
  ZN: 'ref_zn',
  FERR: 'ref_ferritin',
  IRON: 'ref_fe',
  CALCI: 'ref_calci',
  CAT: 'ref_calci',
  ICA: 'ref_calci_ion',
  TIGE: 'ref_tige',
  WBC: 'ref_wbc',
  RBC: 'ref_rbc',
  HGB: 'ref_hgb',
  PLT: 'ref_plt',
  VIT_D: 'ref_vit_d'
};

export interface ResolvedReferenceInfo {
  refMin: number | null;
  refMax: number | null;
  refText: string;
  unit: string;
  evaluationType: EvaluationType;
  scaleId?: string;
  scale?: AllergenGradingScale;
  equipmentId?: string;
  equipmentName?: string;
  label?: string;
  isAllergen: boolean;
}

export interface ResolveIndicatorOptions {
  equipmentId?: string | null;
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  referenceRanges?: ReferenceRangeItem[];
  allergenScales?: AllergenGradingScale[];
  equipments?: TestEquipment[];
}

/**
 * Phân giải toàn diện và động ngưỡng tham chiếu cho chỉ số xét nghiệm:
 * 1. Tra cứu link thiết bị trong catalogItemEquipments (ưu tiên equipmentId, isDefault, hoặc link đầu tiên).
 * 2. Nếu là Scale (Dị nguyên):
 *    - Tra cứu thang đo trong allergenScales theo scaleId.
 *    - Tìm level có grade === 0 (Mức không phản ứng / âm tính) để trích xuất:
 *      minVal -> refMin, maxVal -> refMax, rangeText -> refText, unit.
 * 3. Nếu là Range (Khoảng số):
 *    - Lấy refMin, refMax, refText, unit từ link thiết bị hoặc tra cứu trong referenceRanges.
 * 4. Nếu là Text (Định tính):
 *    - Lấy refText từ link hoặc item.
 */
export function resolveIndicatorReference(
  item: Pick<CatalogItem, 'code' | 'category' | 'unit' | 'refText' | 'evaluationType' | 'scaleId' | 'referenceRangeId' | 'refMin' | 'refMax'>,
  options: ResolveIndicatorOptions = {}
): ResolvedReferenceInfo {
  const {
    equipmentId: preferredEquipmentId,
    catalogItemEquipments = [],
    referenceRanges = [],
    allergenScales = [],
    equipments = []
  } = options;

  const itemCodeUpper = (item.code || '').trim().toUpperCase();
  const isTIgE = itemCodeUpper === 'TIGE';
  const isAllergenCategory = !isTIgE && (
    (item.category && item.category.includes('Dị Nguyên')) === true ||
    item.unit === 'IU/mL' ||
    Boolean(item.scaleId) ||
    item.evaluationType === 'scale'
  );

  // ─── 1. Tìm CatalogItemEquipmentLink phù hợp ───────────────────────────────
  const matchingLinks = catalogItemEquipments.filter(
    (l) => (l.catalogCode || '').trim().toUpperCase() === itemCodeUpper
  );

  let matchedLink: CatalogItemEquipmentLink | undefined;
  if (preferredEquipmentId) {
    matchedLink = matchingLinks.find((l) => l.equipmentId === preferredEquipmentId);
  }
  if (!matchedLink) {
    matchedLink = matchingLinks.find((l) => l.isDefault);
  }
  if (!matchedLink && matchingLinks.length > 0) {
    matchedLink = matchingLinks[0];
  }

  // Xác định thông tin thiết bị đo
  const activeEquipmentId = matchedLink?.equipmentId || preferredEquipmentId || undefined;
  let activeEquipmentName: string | undefined;
  if (activeEquipmentId) {
    const eqObj = equipments.find((e) => e.id === activeEquipmentId || e.code === activeEquipmentId);
    activeEquipmentName = eqObj?.name || activeEquipmentId;
  }

  // ─── 2. Phân giải THANG ĐO DỊ NGUYÊN (SCALE) ──────────────────────────────
  const activeScaleId = matchedLink?.scaleId || item.scaleId || (isAllergenCategory ? 'scale_protia_91' : undefined);

  if (activeScaleId) {
    const scale = getAllergenScaleById(activeScaleId, allergenScales);
    // Tìm level có grade === 0 (Mức không phản ứng)
    const level0 = scale?.levels?.find((l) => l.grade === 0);

    const refMin = level0?.minVal !== undefined && level0?.minVal !== null ? level0.minVal : 0;
    const refMax = level0?.maxVal !== undefined && level0?.maxVal !== null ? level0.maxVal : 0.34;
    const unit = matchedLink?.unit || scale?.unit || item.unit || 'IU/ml';
    const refText = matchedLink?.refText || (level0?.rangeText ? `${level0.rangeText} (Độ 0)` : '<0.34 (Độ 0)');
    const label = level0?.label || 'Không phản ứng';

    return {
      refMin,
      refMax,
      refText,
      unit,
      evaluationType: 'scale',
      scaleId: activeScaleId,
      scale,
      equipmentId: activeEquipmentId,
      equipmentName: activeEquipmentName,
      label,
      isAllergen: true
    };
  }

  // ─── 3. Phân giải KHOẢNG SỐ THAM CHIẾU (RANGE) & TEXT ─────────────────────
  let resolvedRefMin: number | null = null;
  let resolvedRefMax: number | null = null;
  let resolvedRefText = '';
  let resolvedUnit = matchedLink?.unit || item.unit || '';

  // Ưu tiên A: Ngưỡng đã cấu hình trực tiếp trên máy đo (CatalogItemEquipmentLink)
  const hasLinkRange = matchedLink && (
    (matchedLink.refMin !== null && matchedLink.refMin !== undefined) ||
    (matchedLink.refMax !== null && matchedLink.refMax !== undefined) ||
    (matchedLink.refText && matchedLink.refText.trim() !== '')
  );

  if (hasLinkRange && matchedLink) {
    resolvedRefMin = matchedLink.refMin !== undefined ? matchedLink.refMin : null;
    resolvedRefMax = matchedLink.refMax !== undefined ? matchedLink.refMax : null;
    if (matchedLink.unit) resolvedUnit = matchedLink.unit;
    if (matchedLink.refText && matchedLink.refText.trim() !== '') {
      resolvedRefText = matchedLink.refText.trim();
    } else if (resolvedRefMin !== null && resolvedRefMax !== null) {
      resolvedRefText = `${resolvedRefMin} - ${resolvedRefMax}`;
    } else if (resolvedRefMin !== null) {
      resolvedRefText = `>= ${resolvedRefMin}`;
    } else if (resolvedRefMax !== null) {
      resolvedRefText = `<= ${resolvedRefMax}`;
    }
  } else {
    // Ưu tiên B: Tra cứu trong bảng ReferenceRangeItem
    const refRangeId = item.referenceRangeId || DEFAULT_CODE_TO_REFERENCE_RANGE_MAP[itemCodeUpper];
    const refRange = refRangeId ? referenceRanges.find((r) => r.id === refRangeId) : undefined;

    if (refRange) {
      resolvedRefMin = refRange.refMin !== undefined ? refRange.refMin : null;
      resolvedRefMax = refRange.refMax !== undefined ? refRange.refMax : null;
      if (refRange.unit) resolvedUnit = refRange.unit;
      if (refRange.refText && refRange.refText.trim() !== '') {
        resolvedRefText = refRange.refText.trim();
      } else if (resolvedRefMin !== null && resolvedRefMax !== null) {
        resolvedRefText = `${resolvedRefMin} - ${resolvedRefMax}`;
      }
    } else {
      // Fallback C: Dữ liệu tĩnh trên CatalogItem (nếu có)
      resolvedRefMin = item.refMin !== undefined ? item.refMin : null;
      resolvedRefMax = item.refMax !== undefined ? item.refMax : null;
      resolvedRefText = item.refText || '';
      if (!resolvedRefText && resolvedRefMin !== null && resolvedRefMax !== null) {
        resolvedRefText = `${resolvedRefMin} - ${resolvedRefMax}`;
      }
    }
  }

  const isNumericRange = resolvedRefMin !== null || resolvedRefMax !== null;
  const evaluationType: EvaluationType = isNumericRange ? 'range' : ((item.evaluationType as EvaluationType) || 'text');

  return {
    refMin: resolvedRefMin,
    refMax: resolvedRefMax,
    refText: resolvedRefText || item.refText || (resolvedRefMin !== null && resolvedRefMax !== null ? `${resolvedRefMin} - ${resolvedRefMax}` : '---'),
    unit: resolvedUnit || item.unit || '',
    evaluationType,
    equipmentId: activeEquipmentId,
    equipmentName: activeEquipmentName,
    isAllergen: false
  };
}
