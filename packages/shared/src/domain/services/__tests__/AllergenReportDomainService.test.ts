import { describe, it, expect } from 'vitest';
import { AllergenReportDomainService } from '../AllergenReportDomainService';
import { SelectedTest, TestPackage, AllergenDatabaseItem, AllergenGradingScale } from '../../types';

describe('AllergenReportDomainService', () => {
  const mockDbItems: AllergenDatabaseItem[] = [
    { tt: 1, code: 'TIgE', name: 'Tổng nồng độ IgE', allergenName: 'Total IgE', route: '', normalRef: '<15,0', note: 'Tổng lượng kháng thể IgE trong máu' },
    { tt: 2, code: 'd1', name: 'Mạt bụi nhà D. pteronyssinus', allergenName: 'House dust mite', route: 'Đường hô hấp', normalRef: '<0,34', note: 'Gây dị ứng đường thở', scaleId: 'scale_protia_91' },
    { tt: 3, code: 'f1', name: 'Lòng trắng trứng', allergenName: 'Egg white', route: 'Đường tiêu hóa', normalRef: '<0,34', note: 'Dị ứng thực phẩm', scaleId: 'scale_allergen_44' }
  ];

  const mockPackages: TestPackage[] = [
    {
      id: 'pkg_allergen_custom',
      name: 'Gói Dị Nguyên Test',
      items: ['TIgE', 'd1', 'f1'].map((c) => ({ code: c, equipmentId: null })),
      codes: ['TIgE', 'd1', 'f1'],
      price: 1500000
    }
  ];

  const mockScaleProtia91: AllergenGradingScale = {
    id: 'scale_protia_91',
    name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)',
    unit: 'IU/ml',
    levels: [
      { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0,34', label: 'Không phản ứng', isPositive: false },
      { grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0,35 - 0,69', label: 'Yếu', isPositive: true },
      { grade: 2, minVal: 0.70, maxVal: 3.49, rangeText: '0,70 - 3,49', label: 'Trung bình', isPositive: true },
      { grade: 3, minVal: 3.50, maxVal: 17.49, rangeText: '3,50 - 17,49', label: 'Khá', isPositive: true },
      { grade: 4, minVal: 17.50, maxVal: 49.99, rangeText: '17,50 - 49,99', label: 'Mạnh', isPositive: true },
      { grade: 5, minVal: 50.00, maxVal: 99.99, rangeText: '50,00 - 99,99', label: 'Rất mạnh', isPositive: true },
      { grade: 6, minVal: 100.0, maxVal: null, rangeText: '>100,0', label: 'Cực mạnh', isPositive: true }
    ]
  };

  const customScale44: AllergenGradingScale = {
    id: 'scale_allergen_44',
    name: 'DIỄN GIẢI THANG ĐO 44 DỊ NGUYÊN',
    unit: 'IU/ml',
    levels: [
      { grade: 0, minVal: 0, maxVal: 0.49, rangeText: '<0,50', label: 'Âm tính', isPositive: false },
      { grade: 1, minVal: 0.50, maxVal: 1.99, rangeText: '0,50 - 1,99', label: 'Dương tính nhẹ', isPositive: true },
      { grade: 2, minVal: 2.00, maxVal: null, rangeText: '>=2,00', label: 'Dương tính mạnh', isPositive: true }
    ]
  };

  const allMockScales = [mockScaleProtia91, customScale44];

  it('should format TIgE and calculate positive status when result > 15.0', () => {
    const tests: SelectedTest[] = [
      {
        category: 'Dị Nguyên & Miễn Dịch',
        code: 'TIgE',
        name: 'Tổng nồng độ IgE',
        refMin: 0,
        refMax: 15.0,
        unit: 'IU/mL',
        refText: '< 15,0',
        result: '25.4',
        note: 'Cao (Tăng)'
      },
      {
        category: 'Dị Nguyên Hô Hấp',
        code: 'd1',
        name: 'Mạt bụi nhà D. pteronyssinus',
        refMin: 0,
        refMax: 0.34,
        unit: 'IU/mL',
        refText: '< 0.35 (Độ 0)',
        result: '1.2', // Độ 2
        note: 'Dương tính (Độ 2)'
      },
      {
        category: 'Dị Nguyên Thực Phẩm',
        code: 'f1',
        name: 'Lòng trắng trứng',
        refMin: 0,
        refMax: 0.34,
        unit: 'IU/mL',
        refText: '< 0.35 (Độ 0)',
        result: '<0.15', // Độ 0
        note: 'Âm tính (Độ 0)'
      }
    ];

    const dto = AllergenReportDomainService.buildReportDTO({
      tests,
      testPackages: mockPackages,
      databaseItems: mockDbItems,
      customScales: allMockScales
    });

    expect(dto.detailedList).toHaveLength(3);
    expect(dto.detailedList[0].code).toBe('TIgE');
    expect(dto.detailedList[0].isPositive).toBe(true);
    expect(dto.detailedList[0].allergenName).toBe('Total IgE');

    // Positive list: TIgE (positive > 15) is at index 0, followed by d1 (grade 2)
    expect(dto.positiveList).toHaveLength(2);
    expect(dto.positiveList[0].code).toBe('TIgE');
    expect(dto.positiveList[1].code).toBe('d1');

    // Package price
    expect(dto.packagePrice).toBe(1500000);
  });

  it('should evaluate grade dynamically per indicator scale and collect appliedScales', () => {
    const tests: SelectedTest[] = [
      {
        category: 'Dị Nguyên Hô Hấp',
        code: 'd1',
        name: 'Mạt bụi nhà D. pteronyssinus',
        refMin: 0,
        refMax: 0.34,
        unit: 'IU/mL',
        refText: '< 0.35',
        result: '1.2', // Thang Protia 91 -> Độ 2
        note: '',
        scaleId: 'scale_protia_91'
      },
      {
        category: 'Dị Nguyên Thực Phẩm',
        code: 'f1',
        name: 'Lòng trắng trứng',
        refMin: 0,
        refMax: 0.49,
        unit: 'IU/mL',
        refText: '< 0.50',
        result: '1.2', // Thang 44 -> minVal 0.50 -> Độ 1
        note: '',
        scaleId: 'scale_allergen_44'
      }
    ];

    const dto = AllergenReportDomainService.buildReportDTO({
      tests,
      databaseItems: mockDbItems,
      customScales: allMockScales
    });

    expect(dto.detailedList[0].grade).toBe(2);
    expect(dto.detailedList[1].grade).toBe(1);

    // Báo cáo chứa cả 2 thang đo duy nhất được dùng
    expect(dto.appliedScales).toHaveLength(2);
    expect(dto.appliedScales.map((s) => s.id)).toContain('scale_protia_91');
    expect(dto.appliedScales.map((s) => s.id)).toContain('scale_allergen_44');
  });

  it('should exclude TIgE from positiveList when result <= 15.0 (normal)', () => {
    const tests: SelectedTest[] = [
      {
        category: 'Dị Nguyên & Miễn Dịch',
        code: 'TIgE',
        name: 'Tổng nồng độ IgE',
        refMin: 0,
        refMax: 15.0,
        unit: 'IU/mL',
        refText: '< 15,0',
        result: '8.5',
        note: 'Bình thường'
      },
      {
        category: 'Dị Nguyên Hô Hấp',
        code: 'd1',
        name: 'Mạt bụi nhà D. pteronyssinus',
        refMin: 0,
        refMax: 0.34,
        unit: 'IU/mL',
        refText: '< 0.35 (Độ 0)',
        result: '0.5', // Độ 1
        note: 'Dương tính (Độ 1)'
      }
    ];

    const dto = AllergenReportDomainService.buildReportDTO({
      tests,
      testPackages: mockPackages,
      databaseItems: mockDbItems,
      customScales: allMockScales
    });

    expect(dto.detailedList[0].isPositive).toBe(false);
    // TIgE should NOT be in positiveList because it is <= 15
    expect(dto.positiveList).toHaveLength(1);
    expect(dto.positiveList[0].code).toBe('d1');
  });

  it('should slice detailPages by itemsPerPage correctly', () => {
    const dummyTests: SelectedTest[] = Array.from({ length: 28 }, (_, i) => ({
      category: 'Dị Nguyên',
      code: `DN_${i + 1}`,
      name: `Dị nguyên ${i + 1}`,
      refMin: 0,
      refMax: 0.34,
      unit: 'IU/mL',
      refText: '< 0.35',
      result: '<0.15',
      note: 'Âm tính (Độ 0)'
    }));

    const dto = AllergenReportDomainService.buildReportDTO({
      tests: dummyTests,
      itemsPerPage: 13
    });

    // 28 items / 13 = 3 pages (13, 13, 2)
    expect(dto.detailPages).toHaveLength(3);
    expect(dto.detailPages[0]).toHaveLength(13);
    expect(dto.detailPages[1]).toHaveLength(13);
    expect(dto.detailPages[2]).toHaveLength(2);
    expect(dto.totalPages).toBe(3 + 3); // 3 detail pages + Cover + Summary + Guidance = 6
  });
});
