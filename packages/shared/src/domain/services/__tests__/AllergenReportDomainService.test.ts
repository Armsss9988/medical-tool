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
      { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0.34', label: 'Không phản ứng', isPositive: false },
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
        refText: '< 0.34 (Độ 0)',
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
        refText: '< 0.34 (Độ 0)',
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

    // Format of normalRef must be '< ...' rather than '0 - ...'
    expect(dto.detailedList[0].normalRef).toMatch(/^<\s*15/);
    expect(dto.detailedList[0].normalRef).not.toContain('0 -');
    expect(dto.detailedList[1].normalRef).toMatch(/^<\s*0[,.]3/);
    expect(dto.detailedList[1].normalRef).not.toContain('0 -');
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
        refText: '< 0.34',
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
        refText: '< 0.34 (Độ 0)',
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
      refText: '< 0.34',
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

  it('should accurately match Gói 44 and Gói 61 and calculate correct package prices', () => {
    const codes44 = ['TIgE', ...Array.from({ length: 43 }, (_, i) => `dn_${i + 1}`)];
    const pkg44: TestPackage = {
      id: 'di_nguyen_44',
      name: '🔬 Gói 44 Dị Nguyên IgE (MEDIWISS / Hô Hấp & Thực Phẩm)',
      codes: codes44,
      items: codes44.map((c) => ({ code: c, equipmentId: null })),
      price: 1400000
    };

    const codes61 = ['TIgE', ...Array.from({ length: 60 }, (_, i) => `dn_${i + 1}`)];
    const pkg61: TestPackage = {
      id: 'di_nguyen_61',
      name: '🧬 Gói 61 Dị Nguyên IgE (PROTIA Smart Q-Processor)',
      codes: codes61,
      items: codes61.map((c) => ({ code: c, equipmentId: null })),
      price: 1600000
    };

    const codes91 = ['TIgE', ...Array.from({ length: 90 }, (_, i) => `dn_${i + 1}`)];
    const pkg91: TestPackage = {
      id: 'di_nguyen_90',
      name: '🩸 Gói Trọn Bộ Dị Nguyên IgE (91 Panel PROTIA)',
      codes: codes91,
      items: codes91.map((c) => ({ code: c, equipmentId: null })),
      price: 1900000
    };

    const packages = [pkg91, pkg61, pkg44];

    // Case 1: Gói 44 (người dùng chọn 43 dị nguyên + 1 TIgE trong allTests)
    const tests44: SelectedTest[] = Array.from({ length: 43 }, (_, i) => ({
      category: 'Dị Nguyên',
      code: `dn_${i + 1}`,
      name: `Dị nguyên ${i + 1}`,
      refMin: 0,
      refMax: 0.34,
      unit: 'IU/mL',
      result: '<0.15',
      note: 'Âm tính (Độ 0)',
      refText: '< 0.34'
    }));
    const tIgETest: SelectedTest = {
      category: 'Miễn Dịch',
      code: 'TIgE',
      name: 'Tổng nồng độ IgE',
      refMin: 0,
      refMax: 15.0,
      unit: 'IU/mL',
      result: '10.5',
      note: 'Bình thường',
      refText: '< 15,0'
    };

    const dto44 = AllergenReportDomainService.buildReportDTO({
      tests: tests44,
      allTests: [...tests44, tIgETest],
      testPackages: packages
    });

    expect(dto44.packagePrice).toBe(1400000);
    expect(dto44.packageName).toBe(pkg44.name);

    // Case 2: Gói 61 (người dùng chọn 60 dị nguyên + 1 TIgE trong allTests)
    const tests61: SelectedTest[] = Array.from({ length: 60 }, (_, i) => ({
      category: 'Dị Nguyên',
      code: `dn_${i + 1}`,
      name: `Dị nguyên ${i + 1}`,
      refMin: 0,
      refMax: 0.34,
      unit: 'IU/mL',
      result: '<0.15',
      note: 'Âm tính (Độ 0)',
      refText: '< 0.34'
    }));

    const dto61 = AllergenReportDomainService.buildReportDTO({
      tests: tests61,
      allTests: [...tests61, tIgETest],
      testPackages: packages
    });

    expect(dto61.packagePrice).toBe(1600000);
    expect(dto61.packageName).toBe(pkg61.name);

    // Case 3: Gói 44 nhưng không chọn TIgE (chỉ có 43 dị nguyên)
    const dto44NoTIgE = AllergenReportDomainService.buildReportDTO({
      tests: tests44,
      testPackages: packages
    });

    expect(dto44NoTIgE.packagePrice).toBe(1400000);
    expect(dto44NoTIgE.packageName).toBe(pkg44.name);
  });

  it('should accurately calculate totalCount = 0 and packagePrice = 0 without hardcoding fallback to 41 when tests are empty', () => {
    const dtoEmpty = AllergenReportDomainService.buildReportDTO({
      tests: []
    });
    expect(dtoEmpty.totalCount).toBe(0);
    expect(dtoEmpty.packagePrice).toBe(0);
    expect(dtoEmpty.detailedList).toHaveLength(0);
  });

  it('định dạng normalRef dị nguyên theo thang đo (<...) thay vì nối dải 0 - refMax ngay cả khi dbItem không có normalRef', () => {
    const customScaleAlex2: AllergenGradingScale = {
      id: 'scale_alex2',
      name: 'THANG ĐO ALEX2 NANO',
      unit: 'kUA/L',
      levels: [
        { grade: 0, minVal: 0, maxVal: 0.29, rangeText: '<0.30', label: 'Âm tính', isPositive: false },
        { grade: 1, minVal: 0.30, maxVal: 0.99, rangeText: '0.30 - 0.99', label: 'Thấp', isPositive: true }
      ]
    };

    const tests: SelectedTest[] = [
      {
        category: 'Dị Nguyên Hô Hấp',
        code: 'g2',
        name: 'Cỏ đuôi mèo',
        refMin: 0,
        refMax: 0.29,
        unit: 'kUA/L',
        refText: '< 0.30 (Độ 0)',
        result: '<0.10',
        note: 'Âm tính (Độ 0)',
        scaleId: 'scale_alex2'
      },
      {
        category: 'Dị Nguyên & Miễn Dịch',
        code: 'TIgE',
        name: 'Tổng nồng độ IgE',
        refMin: 0,
        refMax: 15.0,
        unit: 'IU/mL',
        refText: '',
        result: '5.0',
        note: 'Bình thường'
      }
    ];

    const dto = AllergenReportDomainService.buildReportDTO({
      tests,
      databaseItems: [
        // normalRef rỗng trong DB item (không cấu hình chuỗi cứng)
        { tt: 1, code: 'g2', name: 'Cỏ đuôi mèo', allergenName: 'Timothy grass', route: 'Hô hấp', normalRef: '', note: '', scaleId: 'scale_alex2' }
      ],
      customScales: [customScaleAlex2]
    });

    const g2Item = dto.detailedList.find((i) => i.code === 'g2');
    expect(g2Item).toBeDefined();
    expect(g2Item?.normalRef).toBe('<0.30');
    expect(g2Item?.normalRef).not.toContain('0 - 0.29');

    const tigeItem = dto.detailedList.find((i) => i.code === 'TIgE');
    expect(tigeItem).toBeDefined();
    expect(tigeItem?.normalRef).toBe('<15,0');
    expect(tigeItem?.normalRef).not.toContain('0 - 15');
  });

  it('should order items according to the matched package orderIndex', () => {
    const pkg44: TestPackage = {
      id: 'di_nguyen_44',
      name: 'Gói 44 Dị Nguyên',
      items: [
        { code: 'TIgE', orderIndex: 0 },
        { code: 'f1', orderIndex: 1 },
        { code: 'd1', orderIndex: 2 }
      ],
      codes: ['TIgE', 'f1', 'd1'],
      price: 1400000
    };
    const pkg90: TestPackage = {
      id: 'di_nguyen_90',
      name: 'Gói 90 Dị Nguyên',
      items: [
        { code: 'TIgE', orderIndex: 0 },
        { code: 'd1', orderIndex: 1 },
        { code: 'f1', orderIndex: 2 },
        { code: 'd2', orderIndex: 3 }
      ],
      codes: ['TIgE', 'd1', 'f1', 'd2'],
      price: 1900000
    };

    const tests: SelectedTest[] = [
      { code: 'd1', name: 'Mạt bụi d1', result: '<0.10', category: 'Dị Nguyên', unit: 'IU/ml', refText: '<0,34', note: 'Âm tính' },
      { code: 'f1', name: 'Trứng f1', result: '<0.10', category: 'Dị Nguyên', unit: 'IU/ml', refText: '<0,34', note: 'Âm tính' },
      { code: 'TIgE', name: 'Total IgE', result: '5.0', category: 'Dị Nguyên', unit: 'IU/ml', refText: '<15,0', note: 'Bình thường' }
    ];

    const dto = AllergenReportDomainService.buildReportDTO({
      tests,
      testPackages: [pkg90, pkg44]
    });

    // In pkg44, f1 has orderIndex 1 and d1 has orderIndex 2.
    // Tests match pkg44 (length 3 vs 3). TIgE is first, then f1, then d1.
    expect(dto.detailedList[0].code).toBe('TIgE');
    expect(dto.detailedList[1].code).toBe('f1');
    expect(dto.detailedList[2].code).toBe('d1');
  });

  it('should correctly match packages containing TIgE variants like TIGE_C6', () => {
    const pkgC6: TestPackage = {
      id: 'pkg_c6',
      name: 'Gói C6 Kháng Sinh',
      items: [
        { code: 'TIGE_C6', orderIndex: 0 },
        { code: 'c1', orderIndex: 1 },
        { code: 'c2', orderIndex: 2 }
      ],
      codes: ['TIGE_C6', 'c1', 'c2'],
      price: 800000
    };

    const tests: SelectedTest[] = [
      { code: 'c1', name: 'Penicillin G', result: '0.1', category: 'Dị Nguyên', unit: 'kUA/L', refText: '<0,35', note: 'Âm tính' },
      { code: 'c2', name: 'Penicillin V', result: '0.1', category: 'Dị Nguyên', unit: 'kUA/L', refText: '<0,35', note: 'Âm tính' }
    ];

    const dto = AllergenReportDomainService.buildReportDTO({
      tests,
      testPackages: [pkgC6]
    });

    // Even without TIGE_C6 in tests, it should match pkgC6 as full non-TIgE match
    expect(dto.packageName).toBe('Gói C6 Kháng Sinh');
    expect(dto.packagePrice).toBe(800000);
  });

  it('tự động điền kết quả Độ 0 (<0.34 theo thang đo) cho chỉ số dị nguyên khi không nhập kết quả', () => {
    const tests: SelectedTest[] = [
      {
        code: 'd1',
        name: 'Mạt bụi d1 (Protia 91)',
        category: 'Dị Nguyên Hô Hấp',
        unit: 'IU/ml',
        refText: '',
        scaleId: 'scale_protia_91',
        result: '', // Không nhập kết quả
        note: ''
      },
      {
        code: 'f1',
        name: 'Lòng trắng trứng (Mediwiss 44)',
        category: 'Dị Nguyên Thực Phẩm',
        unit: 'IU/ml',
        refText: '',
        scaleId: 'scale_allergen_44',
        result: '', // Không nhập kết quả
        note: ''
      },
      {
        code: 'd2',
        name: 'Mạt bụi d2 (Có nhập dương tính)',
        category: 'Dị Nguyên Hô Hấp',
        unit: 'IU/ml',
        refText: '',
        scaleId: 'scale_protia_91',
        result: '12.5',
        note: 'Dương tính (Độ 3)'
      },
      {
        code: 'TIgE',
        name: 'Total IgE',
        category: 'Dị Nguyên & Miễn Dịch',
        unit: 'IU/ml',
        refText: '',
        result: '', // TIgE không nhập
        note: ''
      }
    ];

    const mockScale44: AllergenGradingScale = {
      id: 'scale_allergen_44',
      name: 'MEDIWISS 44',
      unit: 'IU/ml',
      levels: [
        { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0.34', label: 'Không phản ứng', isPositive: false },
        { grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0.35 - 0.69', label: 'Yếu', isPositive: true },
        { grade: 2, minVal: 0.70, maxVal: 3.49, rangeText: '0.70 - 3.49', label: 'Trung bình', isPositive: true },
        { grade: 3, minVal: 3.50, maxVal: 17.49, rangeText: '3.50 - 17.49', label: 'Khá', isPositive: true }
      ]
    };

    const dto = AllergenReportDomainService.buildReportDTO({
      tests,
      customScales: [mockScaleProtia91, mockScale44]
    });

    const d1Item = dto.detailedList.find((i) => i.code === 'd1');
    expect(d1Item).toBeDefined();
    // d1 thuộc Protia 91: Tự động điền <0.34 khi không nhập
    expect(d1Item?.result).toBe('<0.34');
    expect(d1Item?.note).toBe('Âm tính (Độ 0)');
    expect(d1Item?.isPositive).toBe(false);

    const f1Item = dto.detailedList.find((i) => i.code === 'f1');
    expect(f1Item).toBeDefined();
    // f1 thuộc Mediwiss 44: Tự động điền <0.34 khi không nhập
    expect(f1Item?.result).toBe('<0.34');
    expect(f1Item?.note).toBe('Âm tính (Độ 0)');
    expect(f1Item?.isPositive).toBe(false);

    const d2Item = dto.detailedList.find((i) => i.code === 'd2');
    expect(d2Item).toBeDefined();
    // d2 có nhập 12.5: Giữ nguyên kết quả người dùng nhập
    expect(d2Item?.result).toBe('12.5');
    expect(d2Item?.isPositive).toBe(true);

    const tigeItem = dto.detailedList.find((i) => i.code === 'TIgE');
    expect(tigeItem).toBeDefined();
    // TIgE là xét nghiệm số học không theo thang đo dị nguyên: Giữ rỗng nếu chưa đo
    expect(tigeItem?.result).toBe('');
  });

  it('đồng bộ tuyệt đối cột BÌNH THƯỜNG và KẾT QUẢ (<0.34) kể cả khi bản nháp cũ mang giá trị <0.35 hoặc <0,34', () => {
    const mockScale44: AllergenGradingScale = {
      id: 'scale_allergen_44',
      name: 'MEDIWISS 44',
      unit: 'IU/ml',
      levels: [
        { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0.34', label: 'Không phản ứng', isPositive: false },
        { grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0.35 - 0.69', label: 'Yếu', isPositive: true }
      ]
    };

    const tests: SelectedTest[] = [
      {
        code: 'd1',
        name: 'Mạt bụi d1',
        category: 'Dị Nguyên Hô Hấp',
        scaleId: 'scale_allergen_44',
        unit: 'IU/ml',
        refText: '< 0.35 (Độ 0)',
        result: '<0.35', // Bản nháp mang <0.35 từ cấu hình cũ
        note: ''
      },
      {
        code: 'f1',
        name: 'Lòng trắng trứng f1',
        category: 'Dị Nguyên Thực Phẩm',
        scaleId: 'scale_allergen_44',
        unit: 'IU/ml',
        refText: '<0,34', // Ký tự phẩy từ catalog
        result: '<0,35', // Nhập phẩy <0,35
        note: ''
      }
    ];

    const dto = AllergenReportDomainService.buildReportDTO({
      tests,
      customScales: [mockScale44]
    });

    const d1 = dto.detailedList.find((i) => i.code === 'd1');
    expect(d1?.normalRef).toBe('<0.34');
    expect(d1?.result).toBe('<0.34'); // Đã tự động đồng bộ về <0.34, không bị lệch một bên 0.34 một bên 0.35

    const f1 = dto.detailedList.find((i) => i.code === 'f1');
    expect(f1?.normalRef).toBe('<0.34');
    expect(f1?.result).toBe('<0.34'); // Đã chuẩn hóa phẩy thành chấm và đồng bộ về <0.34
  });
});



