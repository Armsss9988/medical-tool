import type { ReferenceRangeItem } from '../domain/types';

export const CODE_TO_REFERENCE_RANGE_MAP: Record<string, string> = {
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
  TIGE: 'ref_tige'
};

export function autoResolveItemLinks<
  T extends {
    code: string;
    referenceRangeId?: string;
    scaleId?: string;
    evaluationType?: string;
    category?: string;
    unit?: string;
  }
>(item: T): T {
  const isTIgE = item.code.toUpperCase() === 'TIGE';
  const isAllergen =
    !isTIgE &&
    ((item.category && item.category.includes('Dị Nguyên')) ||
      item.unit === 'IU/mL' ||
      Boolean(item.scaleId));

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
  if (!id || !customRanges) return undefined;
  return customRanges.find((r) => r.id === id);
}

export { 
  resolveIndicatorReference,
  type ResolvedReferenceInfo,
  type ResolveIndicatorOptions,
  DEFAULT_CODE_TO_REFERENCE_RANGE_MAP
} from '../domain/services/itemResolver';

