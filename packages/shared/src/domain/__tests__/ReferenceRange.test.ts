import { describe, it, expect } from 'vitest';
import { ReferenceRange } from '../valueObjects/ReferenceRange';

describe('ReferenceRange Value Object', () => {
  it('should format range with Min and Max correctly as Min – Max', () => {
    const range = new ReferenceRange(9.0, 55.0, 'mg/dL', '', 1);
    expect(range.formatDisplay()).toBe('9,0 – 55,0');
  });

  it('should format range with Min = 0 and Max > 0 as < Max', () => {
    const range = new ReferenceRange(0, 4.20, 'µmol/L', '', 2);
    expect(range.formatDisplay()).toBe('< 4,20');
  });

  it('should format range with only Max as < Max', () => {
    const range = new ReferenceRange(null, 4.20, 'µmol/L', '', 2);
    expect(range.formatDisplay()).toBe('< 4,20');
  });

  it('should format range with only Min as > Min', () => {
    const range = new ReferenceRange(8.0, null, 'µmol/L', '', 1);
    expect(range.formatDisplay()).toBe('> 8,0');
  });

  it('should never contain <= or >= symbols', () => {
    const rangeMax = new ReferenceRange(null, 15.0);
    expect(rangeMax.formatDisplay()).not.toContain('<=');
    expect(rangeMax.formatDisplay()).not.toContain('≤');

    const rangeMin = new ReferenceRange(8.0, null);
    expect(rangeMin.formatDisplay()).not.toContain('>=');
    expect(rangeMin.formatDisplay()).not.toContain('≥');
  });

  it('should correctly evaluate numeric boundaries', () => {
    const range = new ReferenceRange(0, 4.20);
    // KQ = 4.20 is within range (normal)
    expect(range.evaluateNumeric(4.20)).toBe('normal');
    // KQ = 4.21 is high
    expect(range.evaluateNumeric(4.21)).toBe('high');
    // KQ = 0 is normal
    expect(range.evaluateNumeric(0)).toBe('normal');
  });
});
