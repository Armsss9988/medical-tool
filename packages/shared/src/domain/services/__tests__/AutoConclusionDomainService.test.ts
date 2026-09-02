import { describe, it, expect } from 'vitest';
import { AutoConclusionDomainService } from '../AutoConclusionDomainService';
import { SelectedTest } from '../../types';

describe('AutoConclusionDomainService', () => {
  const normalGlucose: SelectedTest = {
    code: 'GLU',
    name: 'Glucose máu',
    category: 'Sinh Hóa',
    unit: 'mmol/L',
    refMin: 3.9,
    refMax: 6.4,
    result: '5.2',
    note: 'Bình thường',
    refText: '3.9 - 6.4'
  };

  const highGlucose: SelectedTest = {
    code: 'GLU',
    name: 'Glucose máu',
    category: 'Sinh Hóa',
    unit: 'mmol/L',
    refMin: 3.9,
    refMax: 6.4,
    result: '8.5',
    note: 'CAO ↑',
    refText: '3.9 - 6.4'
  };

  const highUrea: SelectedTest = {
    code: 'URE',
    name: 'Ure máu',
    category: 'Sinh Hóa',
    unit: 'mmol/L',
    refMin: 2.5,
    refMax: 7.5,
    result: '9.2',
    note: 'CAO ↑',
    refText: '2.5 - 7.5'
  };

  const highAst: SelectedTest = {
    code: 'AST',
    name: 'AST (GOT)',
    category: 'Sinh Hóa',
    unit: 'U/L',
    refMin: 0,
    refMax: 37,
    result: '65',
    note: 'CAO ↑',
    refText: '< 37'
  };

  const highAlt: SelectedTest = {
    code: 'ALT',
    name: 'ALT (GPT)',
    category: 'Sinh Hóa',
    unit: 'U/L',
    refMin: 0,
    refMax: 40,
    result: '70',
    note: 'CAO ↑',
    refText: '< 40'
  };

  const negativeAllergen: SelectedTest = {
    code: 'd1',
    name: 'Mạt bụi nhà D. pteronyssinus',
    category: 'Dị Nguyên Hô Hấp',
    unit: 'IU/mL',
    refMin: 0,
    refMax: 0.34,
    result: '<0.15',
    note: 'Âm tính (Độ 0)',
    refText: '< 0.35 (Độ 0)'
  };

  const positiveAllergen: SelectedTest = {
    code: 'f1',
    name: 'Lòng trắng trứng',
    category: 'Dị Nguyên Thực Phẩm',
    unit: 'IU/mL',
    refMin: 0,
    refMax: 0.34,
    result: '3.5',
    note: 'Dương tính (Độ 3)',
    refText: '< 0.35 (Độ 0)'
  };

  const positiveTIgE: SelectedTest = {
    code: 'TIgE',
    name: 'Tổng nồng độ IgE',
    category: 'Dị Nguyên & Miễn Dịch',
    unit: 'IU/mL',
    refMin: 0,
    refMax: 15.0,
    result: '45.0',
    note: 'Tăng (> 15,0 IU/ml)',
    refText: '< 15,0'
  };

  it('should return null when tests array is empty or has no filled results', () => {
    expect(AutoConclusionDomainService.generate([])).toBeNull();

    const emptyResultTest: SelectedTest = {
      ...normalGlucose,
      result: ''
    };
    expect(AutoConclusionDomainService.generate([emptyResultTest])).toBeNull();
  });

  it('should generate normal conclusion for purely normal clinical tests', () => {
    const res = AutoConclusionDomainService.generate([normalGlucose]);
    expect(res).toBe('Các chỉ số xét nghiệm trong giới hạn bình thường');
  });

  it('should list abnormal tests when clinical tests have 1-3 abnormal indicators', () => {
    const res = AutoConclusionDomainService.generate([highGlucose, highUrea]);
    expect(res).toContain('Chỉ số bất thường: Glucose máu (CAO ↑), Ure máu (CAO ↑)');
    expect(res).toContain('Đề nghị theo dõi và tái khám');
  });

  it('should summarize count when clinical tests have >3 abnormal indicators', () => {
    const res = AutoConclusionDomainService.generate([highGlucose, highUrea, highAst, highAlt]);
    expect(res).toContain('Có 4 chỉ số bất thường. Đề nghị xét nghiệm lại và theo dõi');
  });

  it('should generate conclusion for allergen-only test (all negative)', () => {
    const res = AutoConclusionDomainService.generate([negativeAllergen]);
    expect(res).toBe('Kết quả xét nghiệm dị nguyên: Tất cả các chỉ số đều Âm tính');
  });

  it('should generate conclusion for allergen-only test (with positive allergens)', () => {
    const res = AutoConclusionDomainService.generate([negativeAllergen, positiveAllergen, positiveTIgE]);
    expect(res).toContain('Dương tính với: Lòng trắng trứng, Tổng nồng độ IgE');
    expect(res).toContain('Đề nghị kết hợp lâm sàng');
  });

  it('should generate structured hybrid conclusion when both regular and allergen tests are present', () => {
    const res = AutoConclusionDomainService.generate([
      highGlucose,
      negativeAllergen,
      positiveAllergen
    ]);

    expect(res).toContain('Chỉ số bất thường: Glucose máu (CAO ↑)');
    expect(res).toContain('Dương tính với dị nguyên: Lòng trắng trứng');
    expect(res).toContain('Đề nghị kết hợp lâm sàng và theo dõi');
  });

  it('should handle hybrid test where regular is normal and allergens are negative', () => {
    const res = AutoConclusionDomainService.generate([
      normalGlucose,
      negativeAllergen
    ]);

    expect(res).toContain('Các chỉ số sinh hóa/huyết học trong giới hạn bình thường');
    expect(res).toContain('Âm tính với các dị nguyên tầm soát');
    expect(res).toContain('Đề nghị kết hợp lâm sàng và theo dõi');
  });
});
