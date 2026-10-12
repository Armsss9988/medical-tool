import { describe, it, expect } from 'vitest';
import {
  cleanGarbage14And15,
  sanitizeCatalogAndEquipments
} from '../services/catalogDataSanitizer';
import type { CatalogItem, CatalogItemEquipmentLink } from '../types';

describe('Task 4: Data Sanitizer for Garbage 14 and 15', () => {
  const dirtyCatalog: CatalogItem[] = [
    {
      code: 'C3/C2',
      name: 'Tỷ lệ C3/C2',
      category: 'Sàng lọc sơ sinh',
      unit: '14', // Garbage 14 unit
      refMin: 14,
      refMax: 15,
      refText: '14 – 15'
    },
    {
      code: 'C2',
      name: 'Acetylcarnitine (C2)',
      category: 'Sàng lọc sơ sinh',
      unit: 'µmol/L',
      refMin: 8.0,
      refMax: 14, // Garbage max 14 causing false high for 16.8
      refText: '8,0 – 14'
    },
    {
      code: 'G6PD',
      name: 'Men G6PD',
      category: 'Sàng lọc sơ sinh',
      unit: 'U/gHb',
      refMin: 2.2,
      refMax: 15, // Garbage max 15 causing false high
      refText: '2,2 – 15'
    },
    {
      code: 'SS55_01',
      name: 'Bệnh thiếu hụt carnitine palmitoyltransferase IA',
      category: 'Sàng lọc 55 bệnh',
      scientific: 'C0 < 9,0',
      unit: '14',
      refMin: 14,
      refMax: 14,
      refText: '14 – 14'
    }
  ];

  const dirtyLinks: CatalogItemEquipmentLink[] = [
    {
      id: 'link_c3c2',
      catalogCode: 'C3/C2',
      equipmentId: 'eq_msms',
      unit: '14',
      refMin: 14,
      refMax: 15,
      refText: '14 – 15',
      isDefault: true
    },
    {
      id: 'link_c2',
      catalogCode: 'C2',
      equipmentId: 'eq_msms',
      unit: 'µmol/L',
      refMin: 8.0,
      refMax: 14,
      refText: '8,0 – 14',
      isDefault: true
    },
    {
      id: 'link_ss01',
      catalogCode: 'SS55_01',
      equipmentId: 'eq_msms',
      unit: '14',
      refMin: 14,
      refMax: 14,
      refText: '14 – 14',
      isDefault: true
    }
  ];

  it('cleanGarbage14And15 cleans ratio units, fixes C2 and G6PD thresholds, and purges SS55 14-14 references', () => {
    const cleaned = cleanGarbage14And15(dirtyCatalog, dirtyLinks);

    const c3c2 = cleaned.catalog.find((i) => i.code === 'C3/C2');
    expect(c3c2?.unit).toBe('');
    expect(c3c2?.refMin).toBeNull();
    expect(c3c2?.refMax).toBeNull();

    const c2 = cleaned.catalog.find((i) => i.code === 'C2');
    expect(c2?.refMin).toBe(8.0);
    expect(c2?.refMax).toBeNull();
    expect(c2?.refText).toBe('> 8,0');

    const g6pd = cleaned.catalog.find((i) => i.code === 'G6PD');
    expect(g6pd?.refMax).toBeNull();

    const ss1 = cleaned.catalog.find((i) => i.code === 'SS55_01');
    expect(ss1?.unit).toBe('');
    expect(ss1?.refMin).toBeNull();
    expect(ss1?.refMax).toBeNull();
    expect(ss1?.refText).toBe('C0 < 9,0');
    expect(ss1?.evaluationType).toBe('text');

    // Check links
    const linkC2 = cleaned.links.find((l) => l.catalogCode === 'C2');
    expect(linkC2?.refMin).toBe(8.0);
    expect(linkC2?.refMax).toBeNull();
    expect(linkC2?.refText).toBe('> 8,0');

    const linkSS = cleaned.links.find((l) => l.catalogCode === 'SS55_01');
    expect(linkSS?.unit).toBeUndefined();
    expect(linkSS?.refMin).toBeNull();
    expect(linkSS?.refMax).toBeNull();
  });

  it('sanitizeCatalogAndEquipments includes cleanGarbage14And15 in unified sanitization', () => {
    const sanitized = sanitizeCatalogAndEquipments(dirtyCatalog, dirtyLinks, []);
    const c2 = sanitized.catalog.find((i) => i.code === 'C2');
    expect(c2?.refMin).toBe(8.0);
    expect(c2?.refMax).toBeNull();
    expect(c2?.refText).toBe('> 8,0');
  });
});
