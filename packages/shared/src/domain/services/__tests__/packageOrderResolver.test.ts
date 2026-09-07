import { describe, it, expect } from 'vitest';
import { PackageOrderDomainService, sortTestsByPackageOrder } from '../packageOrderResolver';
import { TestPackage, getPkgItems, normalizeTestPackage } from '../../types';

describe('PackageOrderDomainService', () => {
  const mockPackages: TestPackage[] = [
    {
      id: 'huyet_hoc',
      name: 'Gói Công Thức Máu',
      price: 80000,
      items: [
        { code: 'RBC', orderIndex: 0 },
        { code: 'HGB', orderIndex: 1 },
        { code: 'HCT', orderIndex: 2 },
        { code: 'MCV', orderIndex: 3 },
        { code: 'WBC', orderIndex: 4 },
        { code: 'PLT', orderIndex: 5 }
      ]
    },
    {
      id: 'sinh_hoa',
      name: 'Gói Sinh Hóa Cơ Bản',
      price: 280000,
      items: [
        { code: 'GLU', orderIndex: 0 },
        { code: 'URE', orderIndex: 1 },
        { code: 'CREAT', orderIndex: 2 },
        { code: 'AST', orderIndex: 3 },
        { code: 'ALT', orderIndex: 4 }
      ]
    },
    {
      id: 'nuoc_tieu',
      name: 'Gói Nước Tiểu',
      price: 40000,
      items: [
        { code: 'LEU_U', orderIndex: 0 },
        { code: 'PRO_U', orderIndex: 1 },
        { code: 'GLU_U', orderIndex: 2 }
      ]
    }
  ];

  it('buildPackageItemOrderMap correctly maps orderIndex from package_items', () => {
    const map = PackageOrderDomainService.buildPackageItemOrderMap(mockPackages);
    expect(map.get('RBC')).toBe(0);
    expect(map.get('HGB')).toBe(1);
    expect(map.get('PLT')).toBe(5);
    expect(map.get('GLU')).toBe(0);
    expect(map.get('ALT')).toBe(4);
    expect(map.get('LEU_U')).toBe(0);
  });

  it('sortTestsByPackageOrder sorts indicators within the same category according to order_index', () => {
    // Thêm các chỉ số Huyết học lộn xộn
    const unsortedHuyetHoc = [
      { code: 'PLT', name: 'Tiểu cầu', category: 'Huyết Học' },
      { code: 'RBC', name: 'Hồng cầu', category: 'Huyết Học' },
      { code: 'MCV', name: 'Thể tích HC', category: 'Huyết Học' },
      { code: 'HGB', name: 'Huyết sắc tố', category: 'Huyết Học' }
    ];

    const sorted = sortTestsByPackageOrder(unsortedHuyetHoc, mockPackages);
    const codes = sorted.map((t) => t.code);
    expect(codes).toEqual(['RBC', 'HGB', 'MCV', 'PLT']);
  });

  it('sortTestsByPackageOrder groups and sorts multiple categories in standard medical order', () => {
    const mixedTests = [
      { code: 'GLU_U', name: 'Glucose NT', category: 'Nước Tiểu' },
      { code: 'ALT', name: 'Men gan ALT', category: 'Sinh Hóa' },
      { code: 'PLT', name: 'Tiểu cầu', category: 'Huyết Học' },
      { code: 'GLU', name: 'Glucose máu', category: 'Sinh Hóa' },
      { code: 'RBC', name: 'Hồng cầu', category: 'Huyết Học' },
      { code: 'LEU_U', name: 'Bạch cầu NT', category: 'Nước Tiểu' }
    ];

    const sorted = sortTestsByPackageOrder(mixedTests, mockPackages);
    const codes = sorted.map((t) => t.code);
    // Huyết Học (RBC, PLT) -> Sinh Hóa (GLU, ALT) -> Nước Tiểu (LEU_U, GLU_U)
    expect(codes).toEqual(['RBC', 'PLT', 'GLU', 'ALT', 'LEU_U', 'GLU_U']);
  });

  it('places unknown indicators after ordered indicators while preserving their relative order', () => {
    const testsWithUnknown = [
      { code: 'CUSTOM_TEST', name: 'Chỉ số tự do', category: 'Huyết Học' },
      { code: 'PLT', name: 'Tiểu cầu', category: 'Huyết Học' },
      { code: 'RBC', name: 'Hồng cầu', category: 'Huyết Học' }
    ];

    const sorted = sortTestsByPackageOrder(testsWithUnknown, mockPackages);
    const codes = sorted.map((t) => t.code);
    expect(codes).toEqual(['RBC', 'PLT', 'CUSTOM_TEST']);
  });

  it('getPkgItems preserves orderIndex and sorts items accordingly', () => {
    const pkg: TestPackage = {
      id: 'pkg_test',
      name: 'Gói Thử Nghiệm',
      price: 100000,
      items: [
        { code: 'PLT', orderIndex: 3 },
        { code: 'RBC', orderIndex: 1 },
        { code: 'HGB', orderIndex: 2 }
      ]
    };

    const items = getPkgItems(pkg);
    expect(items.map((i) => i.code)).toEqual(['RBC', 'HGB', 'PLT']);
    expect(items[0].orderIndex).toBe(1);
    expect(items[1].orderIndex).toBe(2);
    expect(items[2].orderIndex).toBe(3);
  });

  it('normalizeTestPackage synchronizes codes array with items sorted by orderIndex', () => {
    const pkg: TestPackage = {
      id: 'pkg_custom',
      name: 'Gói Tùy Chỉnh',
      price: 150000,
      items: [
        { code: 'WBC', orderIndex: 3 },
        { code: 'RBC', orderIndex: 1 },
        { code: 'PLT', orderIndex: 2 }
      ],
      codes: ['WBC', 'RBC', 'PLT']
    };

    const normalized = normalizeTestPackage(pkg);
    expect(normalized.codes).toEqual(['RBC', 'PLT', 'WBC']);
    expect(normalized.items.map((i) => i.code)).toEqual(['RBC', 'PLT', 'WBC']);
  });

  it('sortTestsByPackageOrder respects custom drag-and-drop reordered package items', () => {
    const customPkg: TestPackage = {
      id: 'huyet_hoc',
      name: 'Gói Công Thức Máu Tùy Chỉnh',
      price: 80000,
      items: [
        { code: 'PLT', orderIndex: 1 },
        { code: 'RBC', orderIndex: 2 },
        { code: 'HGB', orderIndex: 3 }
      ]
    };

    const tests = [
      { code: 'HGB', name: 'Huyết sắc tố', category: 'Huyết Học' },
      { code: 'RBC', name: 'Hồng cầu', category: 'Huyết Học' },
      { code: 'PLT', name: 'Tiểu cầu', category: 'Huyết Học' }
    ];

    const sorted = sortTestsByPackageOrder(tests, [customPkg]);
    expect(sorted.map((t) => t.code)).toEqual(['PLT', 'RBC', 'HGB']);
  });

  it('getPkgItems preserves defaultValue and hasDefaultValue from object and string formats', () => {
    const pkgWithDefaults: TestPackage = {
      id: 'pkg_checkup',
      name: 'Gói Khám',
      price: 150000,
      items: [
        { code: 'HBSAG', defaultValue: 'Âm tính', hasDefaultValue: true },
        { code: 'GLU', defaultValue: '5.0', hasDefaultValue: true },
        { code: 'URE', defaultValue: null, hasDefaultValue: false }
      ]
    };

    const items = getPkgItems(pkgWithDefaults);
    expect(items[0].defaultValue).toBe('Âm tính');
    expect(items[0].hasDefaultValue).toBe(true);
    expect(items[1].defaultValue).toBe('5.0');
    expect(items[1].hasDefaultValue).toBe(true);
    expect(items[2].defaultValue).toBeNull();
    expect(items[2].hasDefaultValue).toBe(false);
  });
});
