import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CATALOG,
  DEFAULT_EQUIPMENTS,
  TEST_PACKAGES
} from '../backup/defaultCatalog';
import {
  DEFAULT_TEST_EQUIPMENTS,
  resolveTestEquipmentName
} from '../../domain/types';

describe('Data Integrity & Equipment Resolution Tests', () => {
  describe('Equipments Configuration', () => {
    it('should include Phadia 250 in DEFAULT_EQUIPMENTS and DEFAULT_TEST_EQUIPMENTS', () => {
      const phadiaId = '81e15751-ec5a-4cce-9fb6-9860d859950e';
      const inDefaultEquipments = DEFAULT_EQUIPMENTS.find(e => e.id === phadiaId);
      const inDefaultTestEquipments = DEFAULT_TEST_EQUIPMENTS.find(e => e.id === phadiaId);

      expect(inDefaultEquipments).toBeDefined();
      expect(inDefaultEquipments?.name).toContain('Phadia 250');
      expect(inDefaultTestEquipments).toBeDefined();
      expect(inDefaultTestEquipments?.name).toContain('Phadia 250');
    });

    it('should resolve equipment names correctly including aliases', () => {
      // Alias resolution
      const mediwissAlias = resolveTestEquipmentName({ equipmentId: 'eq_mediwiss' });
      expect(mediwissAlias).toBe('MEDIWISS AlleisaScreen 44 BLOTrix Reader C1');

      const protiaAlias = resolveTestEquipmentName({ equipmentId: 'eq_protia' });
      expect(protiaAlias).toBe('PROTIA Allergy-Q Smart Q-processor (Dị Nguyên)');

      // Canonical resolution
      const mediwissCanonical = resolveTestEquipmentName({ equipmentId: 'eq_mediwiss_c1' });
      expect(mediwissCanonical).toBe('MEDIWISS AlleisaScreen 44 BLOTrix Reader C1');

      const protiaCanonical = resolveTestEquipmentName({ equipmentId: 'eq_protia_q' });
      expect(protiaCanonical).toBe('PROTIA Allergy-Q Smart Q-processor (Dị Nguyên)');

      // Phadia 250 resolution
      const phadia = resolveTestEquipmentName({ equipmentId: '81e15751-ec5a-4cce-9fb6-9860d859950e' });
      expect(phadia).toBe('Thermo Scientific Phadia 250 (Dị Ứng Kháng Sinh)');
    });
  });

  describe('Test Packages Data Integrity', () => {
    it('should only use canonical equipment IDs in allergen test packages', () => {
      const pkg44 = TEST_PACKAGES.find(p => p.id === 'di_nguyen_44');
      const pkg61 = TEST_PACKAGES.find(p => p.id === 'di_nguyen_61');
      const pkg90 = TEST_PACKAGES.find(p => p.id === 'di_nguyen_90');

      expect(pkg44).toBeDefined();
      expect(pkg61).toBeDefined();
      expect(pkg90).toBeDefined();

      pkg44?.items?.forEach(item => {
        expect(item.equipmentId).toBe('eq_mediwiss_c1');
      });

      pkg61?.items?.forEach(item => {
        expect(item.equipmentId).toBe('eq_protia_q');
      });

      pkg90?.items?.forEach(item => {
        expect(item.equipmentId).toBe('eq_protia_q');
      });
    });

    it('should ensure all test package items exist in DEFAULT_CATALOG', () => {
      const catalogCodes = new Set(DEFAULT_CATALOG.map(c => c.code.toUpperCase()));
      for (const pkg of TEST_PACKAGES) {
        const items = pkg.items || (pkg.codes || []).map(code => ({ code, equipmentId: null }));
        for (const item of items) {
          expect(catalogCodes.has(item.code.toUpperCase())).toBe(true);
        }
      }
    });
  });

  describe('Catalog Items Data Integrity', () => {
    it('should have CAROTENETP, IGF1, SOIPHAN, STOOL_RBC, STOOL_WBC with valid fields', () => {
      const targetCodes = ['CAROTENETP', 'IGF1', 'SOIPHAN', 'STOOL_RBC', 'STOOL_WBC'];
      for (const code of targetCodes) {
        const item = DEFAULT_CATALOG.find(c => c.code.toUpperCase() === code);
        expect(item).toBeDefined();
        expect(item?.unit).toBeTruthy();
        expect(item?.refText).toBeTruthy();
        expect(item?.category).toBeTruthy();
      }
    });

    it('should have valid non-empty categories, units, and refText across default catalog', () => {
      for (const item of DEFAULT_CATALOG) {
        expect(item.code).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.category).toBeTruthy();
        expect(typeof item.unit).toBe('string');
        expect(typeof item.refText).toBe('string');
        if (item.refMin !== undefined && item.refMin !== null) {
          expect(isNaN(item.refMin)).toBe(false);
        }
        if (item.refMax !== undefined && item.refMax !== null) {
          expect(isNaN(item.refMax)).toBe(false);
        }
      }
    });

    it('should correctly handle autoResolveItemLinks for TIgE variants and general tests', async () => {
      const { autoResolveItemLinks } = await import('../../data/index');
      
      const tigeStandard = autoResolveItemLinks({ code: 'TIGE', name: 'Total IgE', unit: 'IU/ml', refText: '<15', category: 'Dị Nguyên', scaleId: undefined, referenceRangeId: undefined });
      expect(tigeStandard.scaleId).toBeUndefined();
      expect(tigeStandard.referenceRangeId).toBe('ref_tige');

      const tigeVariant = autoResolveItemLinks({ code: 'TIGE_C6', name: 'Tổng nồng độ IgE – C6 kháng sinh', unit: 'kU/L', refText: '<97', category: 'Dị Nguyên', scaleId: undefined });
      expect(tigeVariant.scaleId).toBeUndefined();

      const allergenTest = autoResolveItemLinks({ code: 'd1', name: 'Dermatophagoides pteronyssinus', unit: 'IU/ml', refText: '<0.34', category: 'Dị Nguyên Hô Hấp', scaleId: undefined, evaluationType: undefined });
      expect(allergenTest.scaleId).toBe('scale_protia_91');
      expect(allergenTest.evaluationType).toBe('scale');
    });
  });
});
