import { TestPackage, getPkgCodes } from './types';
import { isTIgETest } from './allergenDetector';

/**
 * Tính tổng phí dịch vụ ưu tiên giá gói.
 *
 * Logic:
 * 1. Tìm tất cả các gói mà TOÀN BỘ codes đều nằm trong danh sách items hiện tại.
 * 2. Gói lớn nhất (nhiều codes nhất) được ưu tiên trước để tránh trùng lặp.
 * 3. Các item đã được "phủ" bởi gói sẽ dùng giá gói (không cộng giá lẻ).
 * 4. Các item không thuộc gói nào → cộng giá lẻ (item.price).
 *
 * @returns { total, activePackages, orphanItems }
 */
export interface PricingItem {
  code: string;
  price?: number;
  quantity?: number;
}

export interface ActivePackageInfo {
  id: string;
  name: string;
  price: number;
  codes: string[];
}

export interface PricingResult {
  /** Tổng phí cuối cùng (gói + lẻ) */
  total: number;
  /** Danh sách gói đang hoạt động */
  activePackages: ActivePackageInfo[];
  /** Codes của các item không thuộc gói nào */
  orphanCodes: string[];
  /** Tổng phí từ các gói */
  packageSubtotal: number;
  /** Tổng phí từ các item lẻ */
  orphanSubtotal: number;
}

export function computePricingWithPackages(
  itemCodes: string[],
  items: PricingItem[],
  testPackages: TestPackage[]
): PricingResult {
  // Bỏ gói placeholder (codes rỗng hoặc price = 0)
  const validPackages = testPackages.filter(
    (pkg) => getPkgCodes(pkg).length > 0 && pkg.price > 0
  );

  // Tìm các gói "active": tất cả codes của gói đều nằm trong itemCodes
  const codeSet = new Set(itemCodes.map((c) => c.toLowerCase()));

  const candidatePackages = validPackages
    .filter((pkg) => getPkgCodes(pkg).every((c) => codeSet.has(c.toLowerCase())))
    // Ưu tiên gói lớn nhất trước (greedy)
    .sort((a, b) => getPkgCodes(b).length - getPkgCodes(a).length);

  const coveredCodes = new Set<string>();
  const activePackages: ActivePackageInfo[] = [];

  for (const pkg of candidatePackages) {
    // Kiểm tra xem gói này có bị trùng hoàn toàn với gói đã chọn không
    const pkgCodesLower = getPkgCodes(pkg).map((c) => c.toLowerCase());
    const hasNewCodes = pkgCodesLower.some((c) => !coveredCodes.has(c));

    if (hasNewCodes) {
      activePackages.push({
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        codes: getPkgCodes(pkg)
      });
      pkgCodesLower.forEach((c) => coveredCodes.add(c));
    }
  }

  // Tính phí items không thuộc gói nào
  const orphanCodes: string[] = [];
  let orphanSubtotal = 0;

  for (const item of items) {
    const codeLower = (item.code || '').toLowerCase();
    if (!coveredCodes.has(codeLower)) {
      orphanCodes.push(item.code);
      orphanSubtotal += (item.price || 0) * (item.quantity || 1);
    }
  }

  const packageSubtotal = activePackages.reduce((sum, pkg) => sum + pkg.price, 0);

  return {
    total: packageSubtotal + orphanSubtotal,
    activePackages,
    orphanCodes,
    packageSubtotal,
    orphanSubtotal
  };
}

/**
 * Xây dựng danh sách InvoiceItem thông minh:
 * - Nếu chỉ số thuộc gói trọn vẹn: tạo 1 dòng đại diện cho gói với giá gói
 * - Nếu chỉ số lẻ (không thuộc gói nào): tạo từng dòng với giá lẻ của chỉ số
 */
export function buildInvoiceItems(
  selectedTests: { code: string; name: string; price?: number; category?: string; unit?: string }[],
  testPackages: TestPackage[] = []
): { code: string; name: string; price: number; quantity: number; category?: string; unit?: string }[] {
  if (!selectedTests || selectedTests.length === 0) return [];

  const pricing = computePricingWithPackages(
    selectedTests.map((t) => t.code),
    selectedTests,
    testPackages
  );

  const resultItems: { code: string; name: string; price: number; quantity: number; category?: string; unit?: string }[] = [];

  // 1. Thêm các dòng đại diện cho Gói Xét Nghiệm
  for (const pkg of pricing.activePackages) {
    resultItems.push({
      code: pkg.id,
      name: pkg.name,
      price: pkg.price,
      quantity: 1,
      category: 'Gói Xét Nghiệm',
      unit: 'Gói'
    });
  }

  // 2. Thêm các chỉ số lẻ không thuộc gói nào
  const orphanSet = new Set(pricing.orphanCodes.map((c) => (c || '').toLowerCase()));
  for (const t of selectedTests) {
    if (orphanSet.has((t.code || '').toLowerCase())) {
      resultItems.push({
        code: t.code,
        name: t.name,
        price: t.price || 0,
        quantity: 1,
        category: t.category,
        unit: t.unit || 'Lần'
      });
    }
  }

  return resultItems;
}

/**
 * Tính tổng phí dịch vụ cho danh sách xét nghiệm thường (ưu tiên giá gói nếu có).
 */
export function computeReportTotalPrice(
  tests: { code: string; price?: number }[],
  testPackages: TestPackage[] = []
): number {
  if (!tests || tests.length === 0) return 0;
  return computePricingWithPackages(
    tests.map((t) => t.code),
    tests,
    testPackages
  ).total;
}

/**
 * Tính tổng giá dịch vụ toàn bộ phiếu Hỗn Hợp (Hybrid):
 * Phí gói dị nguyên + Phí các xét nghiệm thường (không tính trùng TIgE vì TIgE đã nằm trong gói dị nguyên).
 */
export function computeHybridReportTotalPrice(
  regularTests: { code: string; price?: number; name?: string }[],
  allergenPackagePrice: number | string | undefined | null,
  testPackages: TestPackage[] = []
): number {
  const allergenPrice = Number(allergenPackagePrice) || 0;
  const nonAllergenRegularTests = regularTests.filter((t) => !isTIgETest(t));
  const regularCodes = nonAllergenRegularTests.map((t) => t.code);

  if (testPackages && testPackages.length > 0 && regularCodes.length > 0) {
    const regPricing = computePricingWithPackages(
      regularCodes,
      nonAllergenRegularTests.map((t) => ({ code: t.code, price: t.price })),
      testPackages
    );
    return allergenPrice + regPricing.total;
  }

  const regSubtotal = nonAllergenRegularTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  return allergenPrice + regSubtotal;
}


