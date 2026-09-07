import { describe, expect, it } from 'vitest';
import {
  TABLE_NAMES,
  tableNameSchema,
  catalogRowSchema,
  documentRowSchema,
  ROW_SCHEMAS
} from '../tables';

describe('tableNameSchema', () => {
  it('accepts all table names', () => {
    for (const name of TABLE_NAMES) {
      expect(tableNameSchema.safeParse(name).success).toBe(true);
    }
  });

  it('rejects unknown table', () => {
    expect(tableNameSchema.safeParse('users').success).toBe(false);
  });
});

describe('catalogRowSchema', () => {
  it('accepts a valid row', () => {
    const row = { code: 'GLU', category: 'Sinh hóa', name: 'Glucose', unit: 'mmol/L', refText: '3.9-6.4' };
    const result = catalogRowSchema.safeParse(row);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.unit).toBe('mmol/L');
  });

  it('rejects missing code', () => {
    const row = { category: 'Sinh hóa', name: 'Glucose' };
    expect(catalogRowSchema.safeParse(row).success).toBe(false);
  });

  it('parses catalog item with evaluationType correctly', () => {
    const row = {
      code: 'GLU',
      category: 'Sinh hóa',
      name: 'Glucose',
      unit: 'mmol/L',
      refText: '3.9-6.4',
      evaluationType: 'range'
    };
    const result = catalogRowSchema.safeParse(row);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.evaluationType).toBe('range');
      expect(result.data.code).toBe('GLU');
    }
  });
});

describe('documentRowSchema', () => {
  it('requires id and passes through extra fields', () => {
    const result = documentRowSchema.safeParse({ id: 'r1', code: 'M123', patient: { name: 'A' } });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.patient).toEqual({ name: 'A' });
  });

  it('rejects missing id', () => {
    expect(documentRowSchema.safeParse({ code: 'M123' }).success).toBe(false);
  });
});

describe('testPackageRowSchema', () => {
  it('accepts valid package with items', () => {
    const row = {
      id: 'pkg_1',
      name: 'Gói Sinh Hóa',
      items: [{ code: 'GLU', equipmentId: 'cobas_c311' }, { code: 'URE', equipmentId: null }],
      price: 200000
    };
    const result = ROW_SCHEMAS['test-packages'].safeParse(row);
    expect(result.success).toBe(true);
  });

  it('preserves defaultValue and hasDefaultValue in package items', () => {
    const row = {
      id: 'pkg_screen',
      name: 'Gói Sàng Lọc',
      items: [
        { code: 'HBSAG', equipmentId: null, defaultValue: 'Âm tính', hasDefaultValue: true },
        { code: 'GLU', equipmentId: 'cobas_c311', defaultValue: '5.2', hasDefaultValue: true },
        { code: 'URE', equipmentId: null, defaultValue: null, hasDefaultValue: false }
      ],
      price: 350000
    };
    const result = ROW_SCHEMAS['test-packages'].safeParse(row);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].defaultValue).toBe('Âm tính');
      expect(result.data.items[0].hasDefaultValue).toBe(true);
      expect(result.data.items[1].defaultValue).toBe('5.2');
      expect(result.data.items[1].hasDefaultValue).toBe(true);
      expect(result.data.items[2].defaultValue).toBeNull();
      expect(result.data.items[2].hasDefaultValue).toBe(false);
    }
  });
});

describe('catalogItemEquipmentRowSchema', () => {
  it('accepts valid link', () => {
    const row = {
      id: 'cie_glu_cobas',
      catalogCode: 'GLU',
      equipmentId: 'cobas_c311',
      referenceRangeId: 'ref_glucose',
      isDefault: true
    };
    const result = ROW_SCHEMAS['catalog-item-equipments'].safeParse(row);
    expect(result.success).toBe(true);
  });

  it('handles flexibleNumber for refMin and refMax (empty string, string number, null)', () => {
    const row = {
      id: 'cie_glu_ms360',
      catalogCode: 'GLU',
      equipmentId: 'ms_360',
      refMin: '',
      refMax: '6.4',
      unit: 'mmol/L',
      isDefault: true
    };
    const result = ROW_SCHEMAS['catalog-item-equipments'].safeParse(row);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.refMin).toBeNull();
      expect(result.data.refMax).toBe(6.4);
    }
  });
});

describe('ROW_SCHEMAS', () => {
  it('covers every table name', () => {
    for (const name of TABLE_NAMES) {
      expect(ROW_SCHEMAS[name]).toBeDefined();
    }
  });
});

describe('reportTemplateRowSchema', () => {
  it('accepts valid report template row', () => {
    const row = {
      id: 'tpl_custom_1',
      name: 'Mẫu Khám Tổng Quát',
      category: 'clinical',
      isDefault: true,
      paperSize: 'A4',
      orientation: 'portrait',
      fontFamily: 'Inter',
      primaryColor: '#2563eb',
      paddingMm: 14,
      blocks: [{ id: 'b1', type: 'header', order: 1 }]
    };
    const result = ROW_SCHEMAS['report-templates'].safeParse(row);
    expect(result.success).toBe(true);
  });

  it('applies defaults for optional fields in report template', () => {
    const row = {
      id: 'tpl_min'
    };
    const result = ROW_SCHEMAS['report-templates'].safeParse(row);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Mẫu In Mới');
      expect(result.data.paperSize).toBe('A4');
      expect(result.data.paddingMm).toBe(15);
      expect(result.data.blocks).toEqual([]);
    }
  });
});
