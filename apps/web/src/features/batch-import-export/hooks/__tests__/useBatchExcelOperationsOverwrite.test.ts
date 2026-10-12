import { describe, it, expect } from 'vitest';
import type { CatalogItem, CatalogItemEquipmentLink } from '@domain/types';

describe('Task 2: Overwrite Semantics on Excel Upload', () => {
  it('overwrites existing catalog item: empty cell in uploaded Excel clears old value', () => {
    const existing: CatalogItem = {
      code: 'C3/C2',
      name: 'Tỷ lệ C3/C2',
      category: 'Sàng lọc sơ sinh',
      scientific: 'Ratio C3 to C2',
      unit: '14', // Garbage 14 from old import
      refMin: 14, // Garbage 14
      refMax: 15, // Garbage 15
      refText: '14 – 15',
      price: 50000,
      evaluationType: 'range'
    };

    // New uploaded item where unit, refMin, refMax are empty in Excel
    const uploadedItem: CatalogItem = {
      code: 'C3/C2',
      name: 'Tỷ lệ C3/C2',
      category: 'Sàng lọc sơ sinh',
      scientific: undefined, // empty in Excel
      unit: '', // empty in Excel -> must clear old unit '14'
      refMin: null, // empty in Excel -> must clear old refMin 14
      refMax: null, // empty in Excel -> must clear old refMax 15
      refText: '< 0,25',
      price: 50000,
      evaluationType: 'range',
      decimalPlaces: null
    };

    // Apply overwrite merge logic
    const merged: CatalogItem = {
      ...existing,
      ...uploadedItem,
      category: uploadedItem.category || existing.category,
      name: uploadedItem.name || existing.name,
      scientific: uploadedItem.scientific !== undefined ? uploadedItem.scientific : undefined,
      unit: uploadedItem.unit, // strictly overwrites
      price: uploadedItem.price !== undefined && uploadedItem.price >= 0 ? uploadedItem.price : existing.price,
      refText: uploadedItem.refText,
      evaluationType: uploadedItem.evaluationType,
      scaleId: uploadedItem.evaluationType === 'scale' ? uploadedItem.scaleId : undefined,
      refMin: uploadedItem.refMin, // strictly clears
      refMax: uploadedItem.refMax, // strictly clears
      decimalPlaces: uploadedItem.decimalPlaces !== undefined ? uploadedItem.decimalPlaces : null
    };

    expect(merged.unit).toBe('');
    expect(merged.refMin).toBeNull();
    expect(merged.refMax).toBeNull();
    expect(merged.scientific).toBeUndefined();
    expect(merged.refText).toBe('< 0,25');
  });

  it('overwrites existing equipment link: empty thresholds clear old thresholds', () => {
    const existingLink: CatalogItemEquipmentLink = {
      id: 'cie_c2_eq1',
      catalogCode: 'C2',
      equipmentId: 'eq1',
      refMin: 8.0,
      refMax: 14.0, // Garbage max 14
      unit: 'µmol/L',
      refText: '8,0 – 14,0',
      isDefault: true
    };

    const uploadedLink: CatalogItemEquipmentLink = {
      id: 'cie_temp_123',
      catalogCode: 'C2',
      equipmentId: 'eq1',
      refMin: 8.0,
      refMax: null, // empty in Excel -> must clear garbage max
      unit: 'µmol/L',
      refText: '> 8,0',
      isDefault: true
    };

    const mergedLink: CatalogItemEquipmentLink = {
      ...existingLink,
      ...uploadedLink,
      id: existingLink.id,
      unit: uploadedLink.unit !== undefined ? uploadedLink.unit : undefined,
      refText: uploadedLink.refText !== undefined ? uploadedLink.refText : undefined,
      scaleId: uploadedLink.scaleId !== undefined ? uploadedLink.scaleId : undefined,
      refMin: uploadedLink.refMin !== undefined ? uploadedLink.refMin : null,
      refMax: uploadedLink.refMax !== undefined ? uploadedLink.refMax : null,
      decimalPlaces: uploadedLink.decimalPlaces !== undefined ? uploadedLink.decimalPlaces : null,
      isDefault: uploadedLink.isDefault
    };

    expect(mergedLink.refMin).toBe(8.0);
    expect(mergedLink.refMax).toBeNull();
    expect(mergedLink.refText).toBe('> 8,0');
  });
});
