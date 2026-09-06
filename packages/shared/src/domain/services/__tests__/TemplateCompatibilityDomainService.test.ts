import { describe, it, expect } from 'vitest';
import { TemplateCompatibilityDomainService } from '../TemplateCompatibilityDomainService';
import { ReportTemplate, TemplateBlock } from '../../templateTypes';
import { CatalogItem } from '../../types';

describe('TemplateCompatibilityDomainService', () => {
  describe('Block Category & Compatibility', () => {
    it('should correctly classify common, clinical, and allergen blocks', () => {
      expect(TemplateCompatibilityDomainService.getBlockCategory('header')).toBe('common');
      expect(TemplateCompatibilityDomainService.getBlockCategory('patient_info')).toBe('common');
      expect(TemplateCompatibilityDomainService.getBlockCategory('signature')).toBe('common');
      expect(TemplateCompatibilityDomainService.getBlockCategory('test_table')).toBe('clinical');
      expect(TemplateCompatibilityDomainService.getBlockCategory('allergen_detail_table')).toBe('allergen');
      expect(TemplateCompatibilityDomainService.getBlockCategory('allergen_positive_table')).toBe('allergen');
      expect(TemplateCompatibilityDomainService.getBlockCategory('allergen_header')).toBe('allergen');
    });

    it('should determine block compatibility for clinical templates', () => {
      expect(TemplateCompatibilityDomainService.isBlockCompatibleWithTargetType('header', 'clinical')).toBe(true);
      expect(TemplateCompatibilityDomainService.isBlockCompatibleWithTargetType('test_table', 'clinical')).toBe(true);
      expect(TemplateCompatibilityDomainService.isBlockCompatibleWithTargetType('allergen_detail_table', 'clinical')).toBe(false);
      expect(TemplateCompatibilityDomainService.isBlockCompatibleWithTargetType('allergen_positive_table', 'clinical')).toBe(false);
    });

    it('should determine block compatibility for allergen templates', () => {
      expect(TemplateCompatibilityDomainService.isBlockCompatibleWithTargetType('header', 'allergen')).toBe(true);
      expect(TemplateCompatibilityDomainService.isBlockCompatibleWithTargetType('allergen_detail_table', 'allergen')).toBe(true);
      expect(TemplateCompatibilityDomainService.isBlockCompatibleWithTargetType('test_table', 'allergen')).toBe(false);
    });

    it('should allow all blocks for hybrid and general templates', () => {
      expect(TemplateCompatibilityDomainService.isBlockCompatibleWithTargetType('test_table', 'hybrid')).toBe(true);
      expect(TemplateCompatibilityDomainService.isBlockCompatibleWithTargetType('allergen_detail_table', 'hybrid')).toBe(true);
      expect(TemplateCompatibilityDomainService.isBlockCompatibleWithTargetType('test_table', 'general')).toBe(true);
    });
  });

  describe('validateTemplateStructure', () => {
    it('should pass validation for a well-formed clinical template', () => {
      const template: ReportTemplate = {
        id: 't1',
        name: 'Clinical Template',
        category: 'clinical',
        targetType: 'clinical',
        isDefault: false,
        paperSize: 'A4',
        orientation: 'portrait',
        fontFamily: 'Arial',
        primaryColor: '#0284c7',
        paddingMm: 15,
        createdAt: '',
        updatedAt: '',
        blocks: [
          { id: 'b1', type: 'header', visible: true, order: 1, props: {} as unknown as TemplateBlock['props'] },
          { id: 'b2', type: 'patient_info', visible: true, order: 2, props: {} as unknown as TemplateBlock['props'] },
          { id: 'b3', type: 'test_table', visible: true, order: 3, props: {} as unknown as TemplateBlock['props'] },
          { id: 'b4', type: 'signature', visible: true, order: 4, props: {} as unknown as TemplateBlock['props'] }
        ]
      };

      const result = TemplateCompatibilityDomainService.validateTemplateStructure(template);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report an error if clinical template is missing test_table', () => {
      const template: ReportTemplate = {
        id: 't2',
        name: 'Invalid Clinical Template',
        category: 'clinical',
        targetType: 'clinical',
        isDefault: false,
        paperSize: 'A4',
        orientation: 'portrait',
        fontFamily: 'Arial',
        primaryColor: '#0284c7',
        paddingMm: 15,
        createdAt: '',
        updatedAt: '',
        blocks: [
          { id: 'b1', type: 'header', visible: true, order: 1, props: {} as unknown as TemplateBlock['props'] },
          { id: 'b2', type: 'patient_info', visible: true, order: 2, props: {} as unknown as TemplateBlock['props'] }
        ]
      };

      const result = TemplateCompatibilityDomainService.validateTemplateStructure(template);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('test_table'))).toBe(true);
    });

    it('should warn if clinical template contains allergen blocks', () => {
      const template: ReportTemplate = {
        id: 't3',
        name: 'Clinical with Allergen Block',
        category: 'clinical',
        targetType: 'clinical',
        isDefault: false,
        paperSize: 'A4',
        orientation: 'portrait',
        fontFamily: 'Arial',
        primaryColor: '#0284c7',
        paddingMm: 15,
        createdAt: '',
        updatedAt: '',
        blocks: [
          { id: 'b1', type: 'header', visible: true, order: 1, props: {} as unknown as TemplateBlock['props'] },
          { id: 'b2', type: 'patient_info', visible: true, order: 2, props: {} as unknown as TemplateBlock['props'] },
          { id: 'b3', type: 'test_table', visible: true, order: 3, props: {} as unknown as TemplateBlock['props'] },
          { id: 'b4', type: 'allergen_positive_table', visible: true, order: 4, props: {} as unknown as TemplateBlock['props'] }
        ]
      };

      const result = TemplateCompatibilityDomainService.validateTemplateStructure(template);
      expect(result.isValid).toBe(true); // errors = 0
      expect(result.warnings.some((w) => w.includes('dị nguyên'))).toBe(true);
    });
  });

  describe('isTemplateCompatibleWithData & getRecommendedTemplate', () => {
    const clinicalTests: Array<Pick<CatalogItem, 'code' | 'category' | 'unit'>> = [
      { code: 'GLU', category: 'Sinh Hóa', unit: 'mmol/L' },
      { code: 'URE', category: 'Sinh Hóa', unit: 'mmol/L' }
    ];

    const allergenTests: Array<Pick<CatalogItem, 'code' | 'category' | 'unit'>> = [
      { code: 'd1', category: 'Dị Nguyên Hô Hấp', unit: 'IU/mL' },
      { code: 'e1', category: 'Dị Nguyên', unit: 'IU/mL' }
    ];

    const clinicalTemplate: ReportTemplate = {
      id: 'tpl_clin',
      name: 'Mẫu Xét Nghiệm Thường',
      category: 'clinical',
      targetType: 'clinical',
      isDefault: true,
      paperSize: 'A4',
      orientation: 'portrait',
      fontFamily: 'Arial',
      primaryColor: '#0284c7',
      paddingMm: 15,
      createdAt: '',
      updatedAt: '',
      blocks: []
    };

    const allergenTemplate: ReportTemplate = {
      id: 'tpl_aller',
      name: 'Mẫu Dị Nguyên',
      category: 'allergen',
      targetType: 'allergen',
      isDefault: true,
      paperSize: 'A4',
      orientation: 'portrait',
      fontFamily: 'Arial',
      primaryColor: '#0284c7',
      paddingMm: 15,
      createdAt: '',
      updatedAt: '',
      blocks: []
    };

    const hybridTemplate: ReportTemplate = {
      id: 'tpl_hyb',
      name: 'Mẫu Hỗn Hợp',
      category: 'hybrid',
      targetType: 'hybrid',
      isDefault: false,
      paperSize: 'A4',
      orientation: 'portrait',
      fontFamily: 'Arial',
      primaryColor: '#0284c7',
      paddingMm: 15,
      createdAt: '',
      updatedAt: '',
      blocks: []
    };

    it('should recognize clinical template as 100% compatible for clinical tests', () => {
      const match = TemplateCompatibilityDomainService.isTemplateCompatibleWithData(clinicalTemplate, clinicalTests);
      expect(match.isCompatible).toBe(true);
      expect(match.matchScore).toBe(100);
      expect(match.isRecommendedDefault).toBe(true);
    });

    it('should flag allergen template as incompatible for pure clinical tests', () => {
      const match = TemplateCompatibilityDomainService.isTemplateCompatibleWithData(allergenTemplate, clinicalTests);
      expect(match.isCompatible).toBe(false);
      expect(match.matchScore).toBeLessThan(50);
    });

    it('should recognize allergen template as 100% compatible for allergen tests', () => {
      const match = TemplateCompatibilityDomainService.isTemplateCompatibleWithData(allergenTemplate, allergenTests);
      expect(match.isCompatible).toBe(true);
      expect(match.matchScore).toBe(100);
    });

    it('should recognize hybrid template for mixed clinical and allergen tests', () => {
      const mixedTests = [...clinicalTests, ...allergenTests];
      const match = TemplateCompatibilityDomainService.isTemplateCompatibleWithData(hybridTemplate, mixedTests);
      expect(match.isCompatible).toBe(true);
      expect(match.matchScore).toBe(100);
    });

    it('should pick best recommended template according to data', () => {
      const allTemplates = [clinicalTemplate, allergenTemplate, hybridTemplate];

      const recForClinical = TemplateCompatibilityDomainService.getRecommendedTemplate(allTemplates, clinicalTests);
      expect(recForClinical?.id).toBe('tpl_clin');

      const recForAllergen = TemplateCompatibilityDomainService.getRecommendedTemplate(allTemplates, allergenTests);
      expect(recForAllergen?.id).toBe('tpl_aller');

      const recForMixed = TemplateCompatibilityDomainService.getRecommendedTemplate(allTemplates, [...clinicalTests, ...allergenTests]);
      expect(recForMixed?.id).toBe('tpl_hyb');
    });
  });
});
