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

  it('should resolve to clinical when only routine tests and TIgE are present', () => {
    const kind = ReportKindResolver.resolve([
      { code: 'GLU', category: 'Sinh Hóa Máu', unit: 'mmol/L' },
      { code: 'TIgE', category: 'Dị Nguyên & Miễn Dịch', unit: 'IU/mL' }
    ]);

    expect(kind.type).toBe('clinical');
    expect(kind.totalCount).toBe(2);
    expect(kind.elementId).toBe(PRINT_ELEMENT_ID.MEDICAL_REPORT);
  });

  it('should resolve to clinical when only TIgE is present', () => {
    const kind = ReportKindResolver.resolve([
      { code: 'TIgE', category: 'Dị Nguyên & Miễn Dịch', unit: 'IU/mL' }
    ]);

    expect(kind.type).toBe('clinical');
    expect(kind.totalCount).toBe(1);
    expect(kind.elementId).toBe(PRINT_ELEMENT_ID.MEDICAL_REPORT);
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

  it('should resolve to newborn55 when tests include SS55_* codes', () => {
    const kind = ReportKindResolver.resolve([
      { code: 'SS_C0', category: 'Sàng lọc MS/MS', unit: 'µmol/L' },
      { code: 'SS55_01', category: 'Sàng lọc 55 bệnh', unit: '' }
    ]);

    expect(kind.type).toBe('newborn55');
    expect(kind.totalCount).toBe(2);
    expect(kind.elementId).toBe(PRINT_ELEMENT_ID.NEWBORN55_REPORT);
  });

  it('should match exhaustively with pattern matching including newborn55', () => {
    const kind = ReportKindResolver.resolve([
      { code: 'SS55_01', category: 'Sàng lọc 55 bệnh', unit: '' }
    ]);

    const result = ReportKindResolver.match(kind, {
      clinical: () => 'clinical-res',
      allergen: () => 'allergen-res',
      hybrid: () => 'hybrid-res',
      newborn55: (k) => `newborn55-${k.totalCount}`
    });

    expect(result).toBe('newborn55-1');
  });
});
