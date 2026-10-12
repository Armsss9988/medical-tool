import { describe, it, expect } from 'vitest';
import { evaluateTestIndicator } from '../testResult';
import { resolveIndicatorReference, buildSelectedTest } from '../services/itemResolver';
import type { CatalogItem } from '../types';

describe('Task 3: Qualitative Text Reference & SS55 Evaluation Bypass', () => {
  it('does NOT evaluate High/Low for qualitative text indicator', () => {
    // An indicator with text reference "Âm tính (-)" and no numeric range
    const evalNormal = evaluateTestIndicator(
      'TEST_NHANH',
      'Miễn Dịch',
      '',
      'Âm tính',
      null,
      null,
      undefined,
      undefined,
      'text'
    );
    expect(evalNormal.status).toBe('normal');
    expect(evalNormal.isAbnormal).toBe(false);

    // If result is arbitrary text or quantitative number for a text indicator, it should not report CAO or THẤP
    const evalNum = evaluateTestIndicator(
      'TEST_NHANH',
      'Miễn Dịch',
      '',
      '15.5',
      null,
      null,
      undefined,
      undefined,
      'text'
    );
    expect(evalNum.label).not.toContain('CAO');
    expect(evalNum.label).not.toContain('THẤP');
  });

  it('evaluates SS55_* properly: Nguy cơ thấp is normal, Nguy cơ cao is abnormal, never Cao/Thấp', () => {
    const evalLow = evaluateTestIndicator(
      'SS55_01',
      'Sàng lọc sơ sinh',
      '',
      'Nguy cơ thấp',
      null,
      null,
      undefined,
      undefined,
      'text'
    );
    expect(evalLow.status).toBe('normal');
    expect(evalLow.isAbnormal).toBe(false);
    expect(evalLow.label).toBe('Nguy cơ thấp');

    const evalHigh = evaluateTestIndicator(
      'SS55_01',
      'Sàng lọc sơ sinh',
      '',
      'Nguy cơ cao',
      null,
      null,
      undefined,
      undefined,
      'text'
    );
    expect(evalHigh.status).toBe('high');
    expect(evalHigh.isAbnormal).toBe(true);
    expect(evalHigh.label).toBe('Nguy cơ cao');
  });

  it('resolveIndicatorReference binds SS55_* reference text from scientific column and enforces evaluationType text', () => {
    const itemSS55: CatalogItem = {
      code: 'SS55_12',
      name: 'Bệnh thiếu hụt chuỗi rất dài acyl-CoA dehydrogenase (VLCAD)',
      category: 'Sàng lọc 55 bệnh',
      scientific: 'C14:1 > 0,80',
      unit: '',
      refText: '',
      refMin: 14, // Even if garbage 14 exists
      refMax: 15, // Even if garbage 15 exists
      price: 0
    };

    const resolved = resolveIndicatorReference(itemSS55);
    expect(resolved.evaluationType).toBe('text');
    expect(resolved.refText).toBe('C14:1 > 0,80');
    expect(resolved.refMin).toBeNull();
    expect(resolved.refMax).toBeNull();
    expect(resolved.unit).toBe('');

    const selected = buildSelectedTest(itemSS55);
    expect(selected.evaluationType).toBe('text');
    expect(selected.refText).toBe('C14:1 > 0,80');
    expect(selected.refMin).toBeNull();
    expect(selected.refMax).toBeNull();
  });
});
