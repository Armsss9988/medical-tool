import { describe, it, expect } from 'vitest';
import { computePricingWithPackages, buildInvoiceItems } from '../pricing';
import { TestPackage } from '../types';

describe('Pricing Domain - computePricingWithPackages & buildInvoiceItems', () => {
  const samplePackages: TestPackage[] = [
    {
      id: 'pkg_blood',
      name: 'Gói Công Thức Máu',
      items: ['RBC', 'HGB', 'WBC', 'PLT'].map((c) => ({ code: c, equipmentId: null })),
      codes: ['RBC', 'HGB', 'WBC', 'PLT'],
      price: 80000
    },
    {
      id: 'pkg_allergen_91',
      name: 'Gói Trọn Bộ Dị Nguyên 91 Chỉ Số',
      items: ['d1', 'd2', 'e1', 'f1', 'f2'].map((c) => ({ code: c, equipmentId: null })),
      codes: ['d1', 'd2', 'e1', 'f1', 'f2'],
      price: 1900000
    }
  ];

  it('should use package price when all test codes of a package are selected', () => {
    const selectedTests = [
      { code: 'RBC', name: 'Hồng cầu', price: 20000 },
      { code: 'HGB', name: 'Huyết sắc tố', price: 20000 },
      { code: 'WBC', name: 'Bạch cầu', price: 25000 },
      { code: 'PLT', name: 'Tiểu cầu', price: 25000 }
    ];

    const pricing = computePricingWithPackages(
      selectedTests.map(t => t.code),
      selectedTests,
      samplePackages
    );

    // Sum of individual = 90,000đ, but package price = 80,000đ
    expect(pricing.total).toBe(80000);
    expect(pricing.activePackages).toHaveLength(1);
    expect(pricing.activePackages[0].id).toBe('pkg_blood');
    expect(pricing.orphanCodes).toHaveLength(0);

    const invoiceItems = buildInvoiceItems(selectedTests, samplePackages);
    expect(invoiceItems).toHaveLength(1);
    expect(invoiceItems[0].name).toBe('Gói Công Thức Máu');
    expect(invoiceItems[0].price).toBe(80000);
  });

  it('should calculate individual prices when tests do not match a full package', () => {
    const selectedTests = [
      { code: 'RBC', name: 'Hồng cầu', price: 20000 },
      { code: 'HGB', name: 'Huyết sắc tố', price: 20000 }
      // Missing WBC, PLT
    ];

    const pricing = computePricingWithPackages(
      selectedTests.map(t => t.code),
      selectedTests,
      samplePackages
    );

    expect(pricing.total).toBe(40000);
    expect(pricing.activePackages).toHaveLength(0);
    expect(pricing.orphanCodes).toEqual(['RBC', 'HGB']);

    const invoiceItems = buildInvoiceItems(selectedTests, samplePackages);
    expect(invoiceItems).toHaveLength(2);
    expect(invoiceItems[0].price).toBe(20000);
    expect(invoiceItems[1].price).toBe(20000);
  });

  it('should correctly handle package + extra orphan tests', () => {
    const selectedTests = [
      { code: 'RBC', name: 'Hồng cầu', price: 20000 },
      { code: 'HGB', name: 'Huyết sắc tố', price: 20000 },
      { code: 'WBC', name: 'Bạch cầu', price: 25000 },
      { code: 'PLT', name: 'Tiểu cầu', price: 25000 },
      { code: 'AMIBE', name: 'Ký sinh trùng Amibe', price: 250000 }
    ];

    const pricing = computePricingWithPackages(
      selectedTests.map(t => t.code),
      selectedTests,
      samplePackages
    );

    // Package 80,000 + AMIBE 250,000 = 330,000
    expect(pricing.total).toBe(330000);
    expect(pricing.activePackages).toHaveLength(1);
    expect(pricing.orphanCodes).toEqual(['AMIBE']);

    const invoiceItems = buildInvoiceItems(selectedTests, samplePackages);
    expect(invoiceItems).toHaveLength(2);
    expect(invoiceItems[0].name).toBe('Gói Công Thức Máu');
    expect(invoiceItems[0].price).toBe(80000);
    expect(invoiceItems[1].code).toBe('AMIBE');
    expect(invoiceItems[1].price).toBe(250000);
  });

  it('should handle allergen tests with undefined price when package is selected', () => {
    const allergenTests = [
      { code: 'd1', name: 'Mạt bụi d1' },
      { code: 'd2', name: 'Mạt bụi d2' },
      { code: 'e1', name: 'Vảy mèo e1' },
      { code: 'f1', name: 'Trứng f1' },
      { code: 'f2', name: 'Sữa f2' }
    ];

    const pricing = computePricingWithPackages(
      allergenTests.map(t => t.code),
      allergenTests,
      samplePackages
    );

    expect(pricing.total).toBe(1900000);
    expect(pricing.activePackages).toHaveLength(1);

    const invoiceItems = buildInvoiceItems(allergenTests, samplePackages);
    expect(invoiceItems).toHaveLength(1);
    expect(invoiceItems[0].name).toBe('Gói Trọn Bộ Dị Nguyên 91 Chỉ Số');
    expect(invoiceItems[0].price).toBe(1900000);
  });

  it('getPkgCodes correctly extracts codes from various package formats', async () => {
    const { getPkgCodes } = await import('../types');
    expect(getPkgCodes(null)).toEqual([]);
    expect(getPkgCodes(undefined)).toEqual([]);
    expect(getPkgCodes({ id: '1', name: 'P', price: 0, items: [{ code: 'RBC' }, { code: 'WBC' }] })).toEqual(['RBC', 'WBC']);
    expect(getPkgCodes({ id: '2', name: 'P2', price: 0, items: [] as never, codes: ['GLU', 'URE'] })).toEqual(['GLU', 'URE']);
    expect(getPkgCodes({ id: '3', name: 'P3', price: 0, items: '[{"code":"AST"},{"code":"ALT"}]' as never })).toEqual(['AST', 'ALT']);
    expect(getPkgCodes({ id: '4', name: 'P4', price: 0, items: [] as never, codes: '["CHO","TRI"]' as never })).toEqual(['CHO', 'TRI']);
  });

  it('getPkgItems and normalizeTestPackage correctly handle all package structures', async () => {
    const { getPkgItems, normalizeTestPackage } = await import('../types');
    expect(getPkgItems(null)).toEqual([]);
    expect(getPkgItems(undefined)).toEqual([]);
    expect(getPkgItems({ id: '1', name: 'P', price: 0, codes: ['GLU', 'URE'] } as never)).toEqual([
      { code: 'GLU', equipmentId: null },
      { code: 'URE', equipmentId: null }
    ]);
    expect(getPkgItems({ id: '2', name: 'P2', price: 0, items: [{ code: 'RBC', equipmentId: 'eq_1' }] } as never)).toEqual([
      { code: 'RBC', equipmentId: 'eq_1' }
    ]);

    const normalized = normalizeTestPackage({
      id: 'p_test',
      name: 'Test Pkg',
      price: 100000,
      codes: ['AST', 'ALT']
    } as never);
    expect(normalized.items).toEqual([
      { code: 'AST', equipmentId: null },
      { code: 'ALT', equipmentId: null }
    ]);
    expect(normalized.codes).toEqual(['AST', 'ALT']);
  });
});
