import { describe, it, expect } from 'vitest';
import {
  STANDARD_BETA_HCG_SCALE,
  sanitizeCatalogAndEquipments
} from '../services/catalogDataSanitizer';
import { evaluateTestIndicator } from '../testResult';
import type { CatalogItem, CatalogItemEquipmentLink, AllergenGradingScale, TestEquipment } from '../types';

describe('catalogDataSanitizer and Beta-hCG Clinical Evaluation', () => {
  describe('Beta-hCG clinical acceptance criteria from technical directive', () => {
    it('evaluates KQ 1,0 as Âm tính (normal), KQ 12 as Vùng xám (abnormal), and KQ 75,51 as Dương tính (abnormal)', () => {
      const evalNeg = evaluateTestIndicator('BHCG', 'Miễn dịch', 'mIU/mL', '1,0', null, null, STANDARD_BETA_HCG_SCALE, undefined, 'scale');
      expect(evalNeg.status).toBe('normal');
      expect(evalNeg.label).toBe('Âm tính');
      expect(evalNeg.isAbnormal).toBe(false);

      const evalGrey = evaluateTestIndicator('BHCG', 'Miễn dịch', 'mIU/mL', '12', null, null, STANDARD_BETA_HCG_SCALE, undefined, 'scale');
      expect(evalGrey.status).toBe('high');
      expect(evalGrey.label).toBe('Vùng xám');
      expect(evalGrey.isAbnormal).toBe(true);

      const evalPos = evaluateTestIndicator('BHCG', 'Miễn dịch', 'mIU/mL', '75,51', null, null, STANDARD_BETA_HCG_SCALE, undefined, 'scale');
      expect(evalPos.status).toBe('high');
      expect(evalPos.label).toBe('Dương tính');
      expect(evalPos.isAbnormal).toBe(true);
    });
  });

  describe('sanitizeCatalogAndEquipments', () => {
    const rawScales: AllergenGradingScale[] = [
      { id: 'scale_old_bhcg', name: 'Beta-hCG – Chẩn đoán thai (mIU/mL)', unit: 'mIU/mL', levels: [] },
      { id: 'scale_old_c6', name: 'C6 dị ứng kháng sinh', unit: 'kU/L', levels: [] },
      { id: 'scale_old_ana', name: 'Cấu hình ANA Screen trên Dynex DS2', unit: 'IU/mL', levels: [] },
      { id: 'scale_protia_91', name: 'Protia 91 (Độ 0-6)', unit: 'IU/mL', levels: [] }
    ];

    const rawCatalog: CatalogItem[] = [
      { code: 'BHCG', name: 'Beta-hCG', category: 'Miễn dịch', price: 150000, evaluationType: 'range', unit: 'mIU/mL', refText: '' },
      { code: 'HBV', name: 'GL – HBV DNA', category: 'Sinh học phân tử', price: 500000, evaluationType: 'range', unit: 'IU/mL', refText: '' },
      { code: 'ANASCR', name: 'ANA Screen', category: 'Miễn dịch', price: 300000, evaluationType: 'range', unit: 'IU/mL', refText: '' },
      { code: 'C1', name: 'Kháng sinh C1', category: 'Dị Nguyên', price: 200000, evaluationType: 'scale', unit: 'kU/L', refText: '' },
      { code: 'C6', name: 'C6 ImmunoCAP', category: 'Dị Nguyên', price: 200000, evaluationType: 'range', unit: 'kU/L', refText: '' },
      { code: 'ASLO', name: 'Định lượng ASLO', category: 'Miễn dịch', price: 80000, evaluationType: 'scale', scaleId: 'scale_protia_91', unit: 'IU/mL', refText: '' },
      { code: 'RF', name: 'Yếu tố dạng thấp RF', category: 'Miễn dịch', price: 80000, evaluationType: 'scale', scaleId: 'scale_protia_91', unit: 'IU/mL', refText: '' },
      { code: 'ESR', name: 'Tốc độ máu lắng ESR', category: 'Huyết học', price: 50000, evaluationType: 'scale', scaleId: 'scale_protia_91', unit: 'mm/h', refText: '' },
      { code: 'HPDADAY', name: 'Test HP hơi thở C14', category: 'Thăm dò chức năng', price: 400000, evaluationType: 'range', unit: 'DPM', refText: '< 50' }
    ];

    const rawLinks: CatalogItemEquipmentLink[] = [
      { id: 'link_1', catalogCode: 'HPDADAY', equipmentId: 'f3ba2e15-7764-4e4b-b0b3-96b02ca43058', isDefault: true },
      { id: 'link_2', catalogCode: 'HPDADAY', equipmentId: 'eq_eq_urea_c14', isDefault: false },
      { id: 'link_3', catalogCode: 'HPDADAY', equipmentId: 'eq_urea_c14', isDefault: false }
    ];

    const rawEquipments: TestEquipment[] = [
      { id: 'eq_urea_c14', name: 'Máy đo hơi thở Urea C14 (H. pylori)', code: 'C14' }
    ];

    it('removes deprecated scales and upserts standard Beta-hCG scale', () => {
      const result = sanitizeCatalogAndEquipments(rawCatalog, rawLinks, rawScales, rawEquipments);
      const scaleNames = result.scales.map((s) => s.name);

      expect(scaleNames).not.toContain('Beta-hCG – Chẩn đoán thai (mIU/mL)');
      expect(scaleNames).not.toContain('C6 dị ứng kháng sinh');
      expect(scaleNames).not.toContain('Cấu hình ANA Screen trên Dynex DS2');
      expect(scaleNames).toContain('Beta-hCG (mIU/mL)');
      expect(scaleNames).toContain('Protia 91 (Độ 0-6)');
    });

    it('normalizes the 12 codes correctly (scale vs range)', () => {
      const result = sanitizeCatalogAndEquipments(rawCatalog, rawLinks, rawScales, rawEquipments);
      const bhcg = result.catalog.find((i) => i.code === 'BHCG');
      expect(bhcg?.evaluationType).toBe('scale');
      expect(bhcg?.scaleId).toBe('scale_beta_hcg');
      expect(bhcg?.refText).toBe('< 5');

      const hbv = result.catalog.find((i) => i.code === 'HBV');
      expect(hbv?.evaluationType).toBe('scale');

      const aslo = result.catalog.find((i) => i.code === 'ASLO');
      expect(aslo?.evaluationType).toBe('range');
      expect(aslo?.scaleId).toBeUndefined();

      const rf = result.catalog.find((i) => i.code === 'RF');
      expect(rf?.evaluationType).toBe('range');
      expect(rf?.scaleId).toBeUndefined();

      const esr = result.catalog.find((i) => i.code === 'ESR');
      expect(esr?.evaluationType).toBe('range');
      expect(esr?.scaleId).toBeUndefined();
    });

    it('cleans HPDADAY equipment links to only 1 default Urea C14 machine', () => {
      const result = sanitizeCatalogAndEquipments(rawCatalog, rawLinks, rawScales, rawEquipments);
      const hpLinks = result.links.filter((l) => l.catalogCode === 'HPDADAY');
      expect(hpLinks).toHaveLength(1);
      expect(hpLinks[0].equipmentId).toBe('eq_urea_c14');
      expect(hpLinks[0].isDefault).toBe(true);
    });
  });
});
