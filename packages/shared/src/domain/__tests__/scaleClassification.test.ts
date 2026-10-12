import { describe, it, expect } from 'vitest';
import {
  isAllergenScale,
  getScaleCategory,
  isAllergenCategory,
  validateScaleAssignment
} from '../services/scaleClassification';
import type { AllergenGradingScale } from '../types';

describe('scaleClassification domain service', () => {
  const protia91Scale: AllergenGradingScale = {
    id: 'scale_protia_91',
    name: 'Protia 91 (Độ 0-6)',
    unit: 'IU/mL',
    levels: []
  };

  const mediwiss44Scale: AllergenGradingScale = {
    id: 'scale_allergen_44',
    name: 'Gói 44 (Độ 0-6)',
    unit: 'IU/mL',
    levels: []
  };

  const betaHcgScale: AllergenGradingScale = {
    id: 'scale_beta_hcg',
    name: 'Beta-hCG (mIU/mL)',
    unit: 'mIU/mL',
    levels: []
  };

  const hbvScale: AllergenGradingScale = {
    id: 'scale_hbv',
    name: 'GL – HBV DNA tải lượng (IU/mL)',
    unit: 'IU/mL',
    levels: []
  };

  const c6ImmunoScale: AllergenGradingScale = {
    id: 'scale_c6_immunocap',
    name: 'C6 ImmunoCAP (Độ 0-6)',
    unit: 'kU/L',
    levels: []
  };

  const explicitAllergenScale: AllergenGradingScale = {
    id: 'scale_custom_1',
    name: 'Thang đo đặc thù',
    scaleType: 'Dị nguyên',
    unit: 'IU/mL',
    levels: []
  };

  const explicitGeneralScale: AllergenGradingScale = {
    id: 'scale_custom_2',
    name: 'Thang đo vi sinh',
    scaleType: 'Xét nghiệm khác',
    unit: 'COI',
    levels: []
  };

  describe('isAllergenScale and getScaleCategory', () => {
    it('correctly identifies allergen scales by explicit scaleType or name', () => {
      expect(isAllergenScale(protia91Scale)).toBe(true);
      expect(isAllergenScale(mediwiss44Scale)).toBe(true);
      expect(isAllergenScale(explicitAllergenScale)).toBe(true);
      expect(getScaleCategory(protia91Scale)).toBe('Dị nguyên');
      expect(getScaleCategory(mediwiss44Scale)).toBe('Dị nguyên');
    });

    it('correctly identifies non-allergen scales (Xét nghiệm khác)', () => {
      expect(isAllergenScale(betaHcgScale)).toBe(false);
      expect(isAllergenScale(hbvScale)).toBe(false);
      expect(isAllergenScale(c6ImmunoScale)).toBe(false);
      expect(isAllergenScale(explicitGeneralScale)).toBe(false);
      expect(getScaleCategory(betaHcgScale)).toBe('Xét nghiệm khác');
      expect(getScaleCategory(hbvScale)).toBe('Xét nghiệm khác');
      expect(getScaleCategory(c6ImmunoScale)).toBe('Xét nghiệm khác');
    });

    it('returns false / Xét nghiệm khác for undefined or null', () => {
      expect(isAllergenScale(undefined)).toBe(false);
      expect(isAllergenScale(null)).toBe(false);
    });
  });

  describe('isAllergenCategory', () => {
    it('recognizes allergen categories', () => {
      expect(isAllergenCategory('Dị Nguyên')).toBe(true);
      expect(isAllergenCategory('Dị Nguyên Hô Hấp')).toBe(true);
      expect(isAllergenCategory('Dị nguyên thực phẩm')).toBe(true);
      expect(isAllergenCategory('ALLERGEN')).toBe(true);
      expect(isAllergenCategory('Bảng dị ứng')).toBe(true);
    });

    it('recognizes non-allergen categories', () => {
      expect(isAllergenCategory('Hóa sinh')).toBe(false);
      expect(isAllergenCategory('Huyết học')).toBe(false);
      expect(isAllergenCategory('Miễn dịch')).toBe(false);
      expect(isAllergenCategory('Sinh học phân tử')).toBe(false);
      expect(isAllergenCategory(undefined)).toBe(false);
    });
  });

  describe('validateScaleAssignment', () => {
    it('allows assigning allergen scale to allergen category', () => {
      const result = validateScaleAssignment('Dị Nguyên Hô Hấp', protia91Scale);
      expect(result.valid).toBe(true);
    });

    it('blocks assigning non-allergen scale (e.g. Beta-hCG) to allergen category', () => {
      const result = validateScaleAssignment('Dị Nguyên Hô Hấp', betaHcgScale);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('chỉ được gán thang đo Dị nguyên');
    });

    it('blocks assigning allergen scale (e.g. Protia 91) to non-allergen category (e.g. Hóa sinh)', () => {
      const result = validateScaleAssignment('Hóa sinh máu', protia91Scale);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('không thể gán thang đo Dị nguyên');
    });

    it('allows assigning non-allergen scale to non-allergen category', () => {
      const result = validateScaleAssignment('Miễn dịch', betaHcgScale);
      expect(result.valid).toBe(true);
    });

    it('allows null or undefined scale (no scale assigned)', () => {
      expect(validateScaleAssignment('Hóa sinh', null).valid).toBe(true);
      expect(validateScaleAssignment('Dị Nguyên', undefined).valid).toBe(true);
    });
  });
});
