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

  it('applies defaults', () => {
    const row = { code: 'X', category: 'C', name: 'Y' };
    const result = catalogRowSchema.safeParse(row);
    if (result.success) {
      expect(result.data.unit).toBe('');
      expect(result.data.refText).toBe('');
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

describe('ROW_SCHEMAS', () => {
  it('covers every table name', () => {
    for (const name of TABLE_NAMES) {
      expect(ROW_SCHEMAS[name]).toBeDefined();
    }
  });
});
