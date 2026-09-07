import { describe, it, expect } from 'vitest';
import { PackageOrderDomainService, sortTestsByPackageOrder } from '../packageOrderResolver';
import { TestPackage } from '../../types';

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
});
