import { describe, it, expect } from 'vitest';
import { ReportKindResolver } from '../valueObjects/ReportKind';
import { PRINT_ELEMENT_ID } from '../constants/uiConstants';

describe('ReportKindResolver', () => {
  it('should resolve to clinical when only routine tests are present', () => {
    const kind = ReportKindResolver.resolve([
      { code: 'GLU', category: 'Sinh Hóa Máu', unit: 'mmol/L' },
      { code: 'WBC', category: 'Huyết Học', unit: 'G/L' }
    ]);

    expect(kind.type).toBe('clinical');
    expect(kind.totalCount).toBe(2);
    expect(kind.elementId).toBe(PRINT_ELEMENT_ID.MEDICAL_REPORT);
  });

  it('should resolve to allergen when only allergen tests are present', () => {
    const kind = ReportKindResolver.resolve([
      { code: 'D1', category: 'Dị Nguyên Bụi Nhà', unit: 'IU/mL' },
      { code: 'F1', category: 'Dị Nguyên Thực Phẩm', unit: 'IU/mL' }
    ]);

    expect(kind.type).toBe('allergen');
    expect(kind.totalCount).toBe(2);
    if (kind.type === 'allergen') {
      expect(kind.allergenCount).toBe(2);
    }
    expect(kind.elementId).toBe(PRINT_ELEMENT_ID.ALLERGEN_REPORT);
  });

  it('should resolve to hybrid when both routine and allergen tests are present', () => {
    const kind = ReportKindResolver.resolve([
      { code: 'GLU', category: 'Sinh Hóa Máu', unit: 'mmol/L' },
      { code: 'D1', category: 'Dị Nguyên Bụi Nhà', unit: 'IU/mL' }
    ]);

    expect(kind.type).toBe('hybrid');
    if (kind.type === 'hybrid') {
      expect(kind.clinicalCount).toBe(1);
      expect(kind.allergenCount).toBe(1);
      expect(kind.elementId).toBe(PRINT_ELEMENT_ID.HYBRID_REPORT);
    }
  });

  it('should provide batch element ID when isBatch option is true', () => {
    const kind = ReportKindResolver.resolve(
      [
        { code: 'GLU', category: 'Sinh Hóa Máu', unit: 'mmol/L' },
        { code: 'D1', category: 'Dị Nguyên Bụi Nhà', unit: 'IU/mL' }
      ],
      { isBatch: true }
    );

    expect(kind.type).toBe('hybrid');
    expect(kind.elementId).toBe(PRINT_ELEMENT_ID.BATCH_HYBRID);
  });
});
