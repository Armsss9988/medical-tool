import { describe, it, expect } from 'vitest';
import { ReportClassificationDomainService } from '../ReportClassificationDomainService';
import { CatalogItem } from '../../types';
import { PRINT_ELEMENT_ID } from '../../constants/uiConstants';

describe('ReportClassificationDomainService', () => {
  const regularItem1: Pick<CatalogItem, 'code' | 'category' | 'unit'> = {
    code: 'GLU',
    category: 'Sinh Hóa',
    unit: 'mmol/L'
  };

  const regularItem2: Pick<CatalogItem, 'code' | 'category' | 'unit'> = {
    code: 'WBC',
    category: 'Huyết Học',
    unit: 'G/L'
  };

  const allergenItem1: Pick<CatalogItem, 'code' | 'category' | 'unit'> = {
    code: 'd1',
    category: 'Dị Nguyên Hô Hấp',
    unit: 'IU/mL'
  };

  const allergenItem2: Pick<CatalogItem, 'code' | 'category' | 'unit'> = {
    code: 'f1',
    category: 'Dị Nguyên Thực Phẩm',
    unit: 'IU/mL'
  };

  const tigeItem: Pick<CatalogItem, 'code' | 'category' | 'unit'> = {
    code: 'TIgE',
    category: 'Dị Nguyên & Miễn Dịch',
    unit: 'IU/mL'
  };

  it('should default to clinical when tests is empty or null', () => {
    expect(ReportClassificationDomainService.classify([])).toBe('clinical');
    expect(ReportClassificationDomainService.classify(null)).toBe('clinical');
    expect(ReportClassificationDomainService.classify(undefined)).toBe('clinical');
  });

  it('should classify purely regular tests as clinical', () => {
    expect(ReportClassificationDomainService.classify([regularItem1, regularItem2])).toBe('clinical');
    // TIgE alone or with regular tests should classify as clinical (standard A4)
    expect(ReportClassificationDomainService.classify([tigeItem])).toBe('clinical');
    expect(ReportClassificationDomainService.classify([regularItem1, tigeItem])).toBe('clinical');
    expect(ReportClassificationDomainService.classify([regularItem1, regularItem2, tigeItem])).toBe('clinical');
  });

  it('should classify purely allergen tests as allergen', () => {
    expect(ReportClassificationDomainService.classify([allergenItem1, allergenItem2])).toBe('allergen');
    expect(ReportClassificationDomainService.classify([tigeItem, allergenItem1])).toBe('allergen');
  });

  it('should classify mixed regular and allergen tests as hybrid', () => {
    expect(ReportClassificationDomainService.classify([regularItem1, allergenItem1])).toBe('hybrid');
    expect(ReportClassificationDomainService.classify([regularItem1, regularItem2, tigeItem, allergenItem1])).toBe('hybrid');
  });

  it('should accurately resolve print element IDs for single export', () => {
    expect(ReportClassificationDomainService.resolvePrintElementId('clinical')).toBe(PRINT_ELEMENT_ID.MEDICAL_REPORT);
    expect(ReportClassificationDomainService.resolvePrintElementId('allergen')).toBe(PRINT_ELEMENT_ID.ALLERGEN_REPORT);
    expect(ReportClassificationDomainService.resolvePrintElementId('hybrid')).toBe(PRINT_ELEMENT_ID.HYBRID_REPORT);
  });

  it('should accurately resolve print element IDs for batch export', () => {
    expect(ReportClassificationDomainService.resolvePrintElementId('clinical', { isBatch: true })).toBe(PRINT_ELEMENT_ID.BATCH_MEDICAL);
    expect(ReportClassificationDomainService.resolvePrintElementId('allergen', { isBatch: true })).toBe(PRINT_ELEMENT_ID.BATCH_ALLERGEN);
    expect(ReportClassificationDomainService.resolvePrintElementId('hybrid', { isBatch: true })).toBe(PRINT_ELEMENT_ID.BATCH_HYBRID);
  });

  it('should provide informative badges for each report type', () => {
    const hybridBadge = ReportClassificationDomainService.getReportTypeBadge('hybrid');
    expect(hybridBadge.label).toContain('Hybrid');

    const allergenBadge = ReportClassificationDomainService.getReportTypeBadge('allergen');
    expect(allergenBadge.label).toContain('Dị Nguyên');

    const clinicalBadge = ReportClassificationDomainService.getReportTypeBadge('clinical');
    expect(clinicalBadge.label).toContain('Chuẩn');
  });

  it('classifyDetails trả về Discriminated Union đầy đủ thông tin chuẩn xác', () => {
    const details = ReportClassificationDomainService.classifyDetails([regularItem1, allergenItem1]);
    expect(details.kind).toBe('hybrid');
    expect(details.elementId).toBe(PRINT_ELEMENT_ID.HYBRID_REPORT);
    expect(details.badge.label).toContain('Hybrid');
  });

  it('match thực hiện exhaustive pattern matching chính xác', () => {
    const result = ReportClassificationDomainService.match('allergen', {
      clinical: () => 'A',
      allergen: () => 'B',
      hybrid: () => 'C',
      newborn55: () => 'D'
    });
    expect(result).toBe('B');
  });

  it('classify và classifyDetails nhận diện newborn55 khi có mã SS55_*', () => {
    const ss55Item: CatalogItem = {
      code: 'SS55_01',
      name: 'PKU',
      category: 'Sàng lọc 55 bệnh',
      unit: '',
      price: 0,
      refMin: null,
      refMax: null,
      refText: '',
      scientific: '',
      evaluationType: 'text'
    };
    const res = ReportClassificationDomainService.classify([ss55Item]);
    expect(res).toBe('newborn55');

    const details = ReportClassificationDomainService.classifyDetails([ss55Item]);
    expect(details.kind).toBe('newborn55');
    expect(details.elementId).toBe(PRINT_ELEMENT_ID.NEWBORN55_REPORT);
  });
});
