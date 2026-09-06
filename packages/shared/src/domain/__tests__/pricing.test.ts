import { describe, it, expect } from 'vitest';
import { computePricingWithPackages, buildInvoiceItems, computeReportTotalPrice, computeHybridReportTotalPrice } from '../pricing';
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

  it('should NOT double charge for overlapping packages and charge remaining items at orphan price', () => {
    const overlappingPackages: TestPackage[] = [
      {
        id: 'pkg_a',
        name: 'Gói A (4 chỉ số)',
        codes: ['T1', 'T2', 'T3', 'T4'],
        items: ['T1', 'T2', 'T3', 'T4'].map((c) => ({ code: c, equipmentId: null })),
        price: 500000
      },
      {
        id: 'pkg_b',
        name: 'Gói B (3 chỉ số trùng 2)',
        codes: ['T3', 'T4', 'T5'],
        items: ['T3', 'T4', 'T5'].map((c) => ({ code: c, equipmentId: null })),
        price: 300000
      }
    ];

    const selectedTests = [
      { code: 'T1', name: 'Test 1', price: 150000 },
      { code: 'T2', name: 'Test 2', price: 150000 },
      { code: 'T3', name: 'Test 3', price: 150000 },
      { code: 'T4', name: 'Test 4', price: 150000 },
      { code: 'T5', name: 'Test 5', price: 100000 }
    ];

    const pricing = computePricingWithPackages(
      selectedTests.map((t) => t.code),
      selectedTests,
      overlappingPackages
    );

    // Gói A lớn hơn (4 chỉ số) được chọn -> 500k
    // Gói B có T3, T4 đã bị phủ bởi Gói A -> Gói B KHÔNG được kích hoạt
    // T5 tính giá lẻ riêng (100k)
    // Tổng = 500k (Gói A) + 100k (T5) = 600k (thay vì bị tính đúp 500k + 300k = 800k)
    expect(pricing.activePackages).toHaveLength(1);
    expect(pricing.activePackages[0].id).toBe('pkg_a');
    expect(pricing.orphanCodes).toEqual(['T5']);
    expect(pricing.total).toBe(600000);
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

  describe('computeReportTotalPrice & computeHybridReportTotalPrice', () => {
    it('computeReportTotalPrice tính đúng tổng giá kèm gói hoặc lẻ', () => {
      expect(computeReportTotalPrice([])).toBe(0);

      const tests = [
        { code: 'RBC', price: 20000 },
        { code: 'HGB', price: 20000 },
        { code: 'WBC', price: 25000 },
        { code: 'PLT', price: 25000 }
      ];
      expect(computeReportTotalPrice(tests, samplePackages)).toBe(80000);

      const partial = [
        { code: 'RBC', price: 20000 },
        { code: 'HGB', price: 20000 }
      ];
      expect(computeReportTotalPrice(partial, samplePackages)).toBe(40000);
    });

    it('computeHybridReportTotalPrice tính đúng phí gói dị nguyên + phí xét nghiệm thường, tự động loại trừ TIgE để không trùng giá', () => {
      const regularTests = [
        { code: 'GLU', price: 40000 },
        { code: 'URE', price: 35000 },
        { code: 'TIgE', price: 150000 } // TIgE phải được bỏ qua vì đã nằm trong gói dị nguyên
      ];

      const totalPrice = computeHybridReportTotalPrice(regularTests, 1900000, samplePackages);
      // 1,900,000 (gói dị nguyên) + 40,000 (GLU) + 35,000 (URE) = 1,975,000đ (không cộng 150k TIgE)
      expect(totalPrice).toBe(1975000);
    });
  });
});

