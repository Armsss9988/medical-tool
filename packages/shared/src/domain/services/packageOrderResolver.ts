import { TestPackage } from '../types';

/**
 * Trọng số thứ tự chuẩn y khoa của các chuyên khoa xét nghiệm chính.
 * Giúp các danh mục trên phiếu in luôn xuất hiện theo trình tự quy chuẩn.
 */
export const STANDARD_CATEGORY_RANKS: Record<string, number> = {
  'huyết học': 1000,
  'sinh hóa': 2000,
  'sinh hóa máu': 2000,
  'huyết sắc tố': 3000,
  'ký sinh trùng': 4000,
  'vi chất': 5000,
  'hóc môn': 6000,
  'nội tiết tố & hormone': 6000,
  'miễn dịch': 7000,
  'miễn dịch & tầm soát': 7000,
  'đông máu': 7500,
  'nước tiểu': 8000,
  'dị nguyên': 9000,
  'dị nguyên hô hấp': 9100,
  'dị nguyên thực phẩm': 9200,
  'dị nguyên côn trùng & khác': 9300,
  'di truyền': 10000,
  'tầm soát ung thư (marker)': 11000,
  'giải phẫu bệnh & tế bào': 12000,
  'xét nghiệm khác': 99000
};

export function getCategoryRank(category?: string | null): number {
  if (!category || !category.trim()) return 99000;
  const key = category.trim().toLowerCase();
  if (STANDARD_CATEGORY_RANKS[key] !== undefined) {
    return STANDARD_CATEGORY_RANKS[key];
  }
  for (const [catName, rank] of Object.entries(STANDARD_CATEGORY_RANKS)) {
    if (key.includes(catName)) return rank;
  }
  return 90000;
}

/**
 * Xây dựng bản đồ thứ tự ưu tiên (Order Rank) cho từng mã chỉ số xét nghiệm
 * dựa trên thuộc tính `orderIndex` trong danh sách các gói xét nghiệm (`package_items`).
 */
export function buildPackageItemOrderMap(testPackages: TestPackage[] = []): Map<string, number> {
  const codeRankMap = new Map<string, number>();

  // Độ ưu tiên của các gói chuyên khoa chuẩn để lấy order_index
  const packagePriority: Record<string, number> = {
    'huyet_hoc': 1,
    'sinh_hoa': 1,
    'nuoc_tieu': 1,
    'di_nguyen_90': 1,
    'di_nguyen_61': 2,
    'di_nguyen_44': 3,
    'tong_quat': 5
  };

  // Sắp xếp các gói: Gói chuyên ngành cụ thể được ưu tiên trước, gói tổng quát sau
  const sortedPackages = [...testPackages].sort((a, b) => {
    const pA = packagePriority[a.id] || (a.id.startsWith('pkg_') ? 2 : 10);
    const pB = packagePriority[b.id] || (b.id.startsWith('pkg_') ? 2 : 10);
    return pA - pB;
  });

  for (const pkg of sortedPackages) {
    const items = pkg.items || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || !item.code) continue;
      const cleanCode = item.code.trim().toUpperCase();
      
      // Ưu tiên orderIndex định danh rõ ràng, nếu không dùng vị trí trong mảng i
      const order = typeof item.orderIndex === 'number' ? item.orderIndex : i;

      // Nếu chưa có, gán order từ gói ưu tiên cao nhất
      if (!codeRankMap.has(cleanCode)) {
        codeRankMap.set(cleanCode, order);
      }
    }
  }

  return codeRankMap;
}

/**
 * Sắp xếp mảng chỉ số xét nghiệm (SelectedTest / CatalogItem):
 * 1. Theo thứ tự chuẩn của chuyên khoa (Category Rank).
 * 2. Bên trong cùng chuyên khoa: Theo đúng `orderIndex` từ bảng `package_items`.
 * 3. Các chỉ số không nằm trong gói sẽ xuất hiện ở cuối nhóm và giữ nguyên thứ tự ban đầu.
 */
export function sortTestsByPackageOrder<T extends { code: string; category?: string }>(
  tests: T[],
  testPackages: TestPackage[] = []
): T[] {
  if (!tests || tests.length <= 1) return tests ? [...tests] : [];

  const codeRankMap = buildPackageItemOrderMap(testPackages);

  return [...tests]
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((a, b) => {
      const catRankA = getCategoryRank(a.item.category);
      const catRankB = getCategoryRank(b.item.category);

      // 1. So sánh cấp Chuyên khoa
      if (catRankA !== catRankB) {
        return catRankA - catRankB;
      }

      // 2. So sánh order_index bên trong cùng chuyên khoa
      const codeA = (a.item.code || '').trim().toUpperCase();
      const codeB = (b.item.code || '').trim().toUpperCase();

      const orderA = codeRankMap.has(codeA) ? codeRankMap.get(codeA)! : 99999;
      const orderB = codeRankMap.has(codeB) ? codeRankMap.get(codeB)! : 99999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // 3. Giữ nguyên vị trí ban đầu nếu cả 2 không có trong package_items hoặc cùng rank
      return a.originalIndex - b.originalIndex;
    })
    .map((wrap) => wrap.item);
}

export class PackageOrderDomainService {
  public static getCategoryRank = getCategoryRank;
  public static buildPackageItemOrderMap = buildPackageItemOrderMap;
  public static sortTestsByPackageOrder = sortTestsByPackageOrder;
}
