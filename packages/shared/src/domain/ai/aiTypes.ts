export type AiTemplateTarget =
  | 'CATALOG_ITEMS'
  | 'CATALOG_ITEM_EQUIPMENTS'
  | 'TEST_PACKAGES'
  | 'DOCTORS'
  | 'EQUIPMENTS'
  | 'TEST_GROUPS'
  | 'ALLERGEN_SCALES'
  | 'BATCH_PATIENTS';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DiscrepancyItem {
  field: string;
  originalValue: unknown;
  suggestedValue: unknown;
  reason: string;
}

export interface ExtractedRowItem<T = Record<string, unknown>> {
  id: string;
  data: T;
  confidence: ConfidenceLevel;
  warnings?: string[];
  discrepancies?: DiscrepancyItem[];
  isSelected: boolean;
}

export interface AiFillResult<T = Record<string, unknown>> {
  targetTemplate: AiTemplateTarget;
  summary: string;
  totalExtracted: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  rows: ExtractedRowItem<T>[];
  rawAiResponse?: string;
}

export interface AiFillRequest {
  targetTemplate: AiTemplateTarget;
  rawText?: string;
  imageBase64?: string;
  imageMimeType?: string;
  fileName?: string;
  contextData?: {
    catalogCodes?: string[];
    equipmentNames?: string[];
    groupNames?: string[];
    doctorNames?: string[];
    scaleNames?: string[];
  };
}
