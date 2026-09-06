import { describe, it, expect } from 'vitest';
import { TestResultValueParser } from '../valueObjects/TestResultValue';
import { AllergenGradingScale } from '../types';

describe('TestResultValueParser', () => {
  const mockScale: AllergenGradingScale = {
    id: 'scale_protia_91',
    name: 'Thang đo PROTIA 91',
    unit: 'IU/mL',
    levels: [
      { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0,35', label: 'Âm tính', isPositive: false },
      { grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0,35 - 0,69', label: 'Dương tính nhẹ', isPositive: true },
      { grade: 2, minVal: 0.70, maxVal: 3.49, rangeText: '0,70 - 3,49', label: 'Dương tính', isPositive: true },
      { grade: 3, minVal: 3.50, maxVal: 17.49, rangeText: '3,50 - 17,49', label: 'Dương tính vừa', isPositive: true },
      { grade: 4, minVal: 17.50, maxVal: 49.99, rangeText: '17,50 - 49,99', label: 'Dương tính mạnh', isPositive: true }
    ]
  };

  it('should parse quantitative numeric results with commas or periods', () => {
    const res1 = TestResultValueParser.parse('5,4', { unit: 'mmol/L' });
    expect(res1.kind).toBe('quantitative');
    if (res1.kind === 'quantitative') {
      expect(res1.numericValue).toBe(5.4);
      expect(res1.unit).toBe('mmol/L');
    }

    const res2 = TestResultValueParser.parse('< 15.0');
    expect(res2.kind).toBe('quantitative');
    if (res2.kind === 'quantitative') {
      expect(res2.numericValue).toBe(15.0);
      expect(res2.comparator).toBe('<');
    }
  });

  it('should parse qualitative results with various Vietnamese keywords', () => {
    const neg = TestResultValueParser.parse('Âm tính (-)');
    expect(neg.kind).toBe('qualitative');
    if (neg.kind === 'qualitative') {
      expect(neg.normalized).toBe('Âm tính');
    }

    const pos = TestResultValueParser.parse('Dương tính (3+)');
    expect(pos.kind).toBe('qualitative');
    if (pos.kind === 'qualitative') {
      expect(pos.normalized).toBe('Dương tính');
    }
  });

  it('should parse allergen IgE results with grade calculation', () => {
    const allergen = TestResultValueParser.parse('17.5', { isAllergen: true, scale: mockScale });
    expect(allergen.kind).toBe('allergen');
    if (allergen.kind === 'allergen') {
      expect(allergen.iuValue).toBe(17.5);
      expect(allergen.grade).toBe(4);
    }
  });

  it('should parse empty inputs cleanly', () => {
    expect(TestResultValueParser.parse('').kind).toBe('empty');
    expect(TestResultValueParser.parse(null).kind).toBe('empty');
    expect(TestResultValueParser.parse(undefined).kind).toBe('empty');
  });
});
