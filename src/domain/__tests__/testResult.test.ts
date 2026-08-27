import { describe, it, expect } from 'vitest';
import { evaluateResult, evaluateTestIndicator } from '../testResult';
import { ReferenceRangeItem, AllergenGradingScale } from '../types';

describe('TestResult Domain - evaluateResult & evaluateTestIndicator', () => {
  describe('evaluateResult', () => {
    it('should evaluate numeric values within range as normal', () => {
      expect(evaluateResult('4.5', 4.0, 10.0)).toEqual({ status: 'normal', label: 'Bình thường' });
      expect(evaluateResult(5, 4.0, 10.0)).toEqual({ status: 'normal', label: 'Bình thường' });
    });

    it('should evaluate values above max as high', () => {
      expect(evaluateResult('12.5', 4.0, 10.0)).toEqual({ status: 'high', label: 'CAO ↑' });
    });

    it('should evaluate values below min as low', () => {
      expect(evaluateResult('2.1', 4.0, 10.0)).toEqual({ status: 'low', label: 'THẤP ↓' });
    });

    it('should evaluate string values starting with < as normal', () => {
      expect(evaluateResult('<15,0', 0, 15.0)).toEqual({ status: 'normal', label: 'Bình thường' });
      expect(evaluateResult('<0.35', 0, 0.34)).toEqual({ status: 'normal', label: 'Bình thường' });
    });
  });

  describe('evaluateTestIndicator - TIgE specific rules', () => {
    it('should evaluate TIgE with result <= 15.0 as normal with label "Bình thường" and isAbnormal false', () => {
      const res1 = evaluateTestIndicator('TIgE', 'Dị Nguyên & Miễn Dịch', 'IU/mL', '<15,0', 0, 15.0);
      expect(res1.isAbnormal).toBe(false);
      expect(res1.status).toBe('normal');
      expect(res1.label).toBe('Bình thường');

      const res2 = evaluateTestIndicator('TIgE', 'Dị Nguyên & Miễn Dịch', 'IU/mL', '8.5', 0, 15.0);
      expect(res2.isAbnormal).toBe(false);
      expect(res2.status).toBe('normal');
      expect(res2.label).toBe('Bình thường');

      const res3 = evaluateTestIndicator('TIgE', 'Dị Nguyên & Miễn Dịch', 'IU/mL', '15.0', 0, 15.0);
      expect(res3.isAbnormal).toBe(false);
      expect(res3.status).toBe('normal');
    });

    it('should evaluate TIgE with result > 15.0 as CAO ↑ and isAbnormal true without calculating allergen grade', () => {
      const res = evaluateTestIndicator('TIgE', 'Dị Nguyên & Miễn Dịch', 'IU/mL', '45.0', 0, 15.0);
      expect(res.isAbnormal).toBe(true);
      expect(res.status).toBe('high');
      expect(res.label).toBe('CAO ↑');
      // Must NOT be "Dương tính mạnh (Độ 4)"
      expect(res.label).not.toContain('Độ');
    });

    it('should handle case-insensitive code for tige', () => {
      const res = evaluateTestIndicator('tige', 'Dị Nguyên', 'IU/mL', '10', 0, 15.0);
      expect(res.isAbnormal).toBe(false);
      expect(res.label).toBe('Bình thường');
    });
  });

  describe('evaluateTestIndicator - Allergen indicators (non-TIgE)', () => {
    it('should calculate allergen grades 0 to 6 for standard allergen tests', () => {
      const resNeg = evaluateTestIndicator('d1', 'Dị Nguyên Hô Hấp', 'IU/mL', '<0.35', 0, 0.34);
      expect(resNeg.isAbnormal).toBe(false);
      expect(resNeg.label).toContain('Độ 0');

      const resPos = evaluateTestIndicator('d1', 'Dị Nguyên Hô Hấp', 'IU/mL', '12.5', 0, 0.34);
      expect(resPos.isAbnormal).toBe(true);
      expect(resPos.label).toContain('Độ 3');
    });
  });

  describe('evaluateTestIndicator - ReferenceRangeItem & AllergenGradingScale linked evaluation', () => {
    it('should evaluate using linked ReferenceRangeItem', () => {
      const glucoseRef: ReferenceRangeItem = {
        id: 'ref_glucose',
        name: 'Glucose máu',
        refMin: 3.9,
        refMax: 6.4,
        unit: 'mmol/L',
        refText: '3.9 - 6.4'
      };

      const normalRes = evaluateTestIndicator('GLU', 'Sinh Hóa Máu', 'mmol/L', '5.2', null, null, undefined, glucoseRef);
      expect(normalRes.status).toBe('normal');
      expect(normalRes.isAbnormal).toBe(false);

      const highRes = evaluateTestIndicator('GLU', 'Sinh Hóa Máu', 'mmol/L', '8.9', null, null, undefined, glucoseRef);
      expect(highRes.status).toBe('high');
      expect(highRes.label).toBe('CAO ↑');
      expect(highRes.isAbnormal).toBe(true);
    });

    it('should evaluate using linked custom AllergenGradingScale', () => {
      const customScale: AllergenGradingScale = {
        id: 'scale_custom',
        name: 'Custom Scale',
        unit: 'IU/ml',
        levels: [
          { grade: 0, minVal: 0, maxVal: 0.5, rangeText: '<0.5', label: 'Âm tính', isPositive: false },
          { grade: 1, minVal: 0.5, maxVal: 5.0, rangeText: '0.5 - 5.0', label: 'Dương tính nhẹ', isPositive: true },
          { grade: 2, minVal: 5.0, maxVal: null, rangeText: '>5.0', label: 'Dương tính mạnh', isPositive: true }
        ]
      };

      const res = evaluateTestIndicator('d1', 'Dị Nguyên', 'IU/mL', '6.0', 0, 0.5, customScale);
      expect(res.isAbnormal).toBe(true);
      expect(res.label).toBe('Dương tính dương tính mạnh (Độ 2)');
    });
  });
});
