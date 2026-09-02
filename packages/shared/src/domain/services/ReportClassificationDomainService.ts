import type { CatalogItem } from '../types';
import { hasMixedTests, hasAllergenTests } from '../allergenDetector';
import { PRINT_ELEMENT_ID, PrintElementId } from '../constants/uiConstants';
import { assertNever } from '../utils/assertNever';

export type MedicalReportType = 'clinical' | 'allergen' | 'hybrid';

export interface ReportTypeBadge {
  label: string;
  subLabel: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

/**
 * Discriminated Union theo triết lý "Make Illegal States Unrepresentable":
 * Mỗi loại báo cáo đóng gói trọn vẹn kiểu loại (kind), ID phần tử in tương ứng và badge hiển thị.
 */
export type ClassifiedReport =
  | { readonly kind: 'clinical'; readonly elementId: PrintElementId; readonly badge: ReportTypeBadge }
  | { readonly kind: 'allergen'; readonly elementId: PrintElementId; readonly badge: ReportTypeBadge }
  | { readonly kind: 'hybrid'; readonly elementId: PrintElementId; readonly badge: ReportTypeBadge };

export class ReportClassificationDomainService {
  /**
   * Phân loại danh sách chỉ số xét nghiệm sang loại báo cáo y khoa tương ứng:
   * - 'hybrid': Phiếu hỗn hợp gồm cả chỉ số thường (Huyết học, Sinh hóa) và Gói dị nguyên
   * - 'allergen': Phiếu chuyên biệt Dị nguyên (Booklet nhiều trang)
   * - 'clinical': Phiếu xét nghiệm y khoa tiêu chuẩn (A4 chuẩn)
   */
  public static classify(
    tests: ReadonlyArray<Pick<CatalogItem, 'code' | 'category' | 'unit'>> | null | undefined
  ): MedicalReportType {
    const safeTests = tests || [];
    if (safeTests.length === 0) {
      return 'clinical';
    }

    const isMixed = hasMixedTests(safeTests);
    if (isMixed) return 'hybrid';

    const isAllergenOnly = hasAllergenTests(safeTests);
    if (isAllergenOnly) return 'allergen';

    return 'clinical';
  }

  /**
   * Phân loại toàn diện sang Discriminated Union (ClassifiedReport).
   */
  public static classifyDetails(
    tests: ReadonlyArray<Pick<CatalogItem, 'code' | 'category' | 'unit'>> | null | undefined,
    options?: { isBatch?: boolean }
  ): ClassifiedReport {
    const reportType = this.classify(tests);
    const elementId = this.resolvePrintElementId(reportType, options);
    const badge = this.getReportTypeBadge(reportType);

    switch (reportType) {
      case 'clinical':
        return { kind: 'clinical', elementId, badge };
      case 'allergen':
        return { kind: 'allergen', elementId, badge };
      case 'hybrid':
        return { kind: 'hybrid', elementId, badge };
      default:
        return assertNever(reportType);
    }
  }

  /**
   * Khớp mẫu toàn diện (Exhaustive Pattern Matching):
   * Bắt buộc xử lý đầy đủ cả 3 nhánh clinical, allergen, hybrid; bắt lỗi compile time nếu thiếu.
   */
  public static match<T>(
    reportType: MedicalReportType,
    patterns: {
      clinical: () => T;
      allergen: () => T;
      hybrid: () => T;
    }
  ): T {
    switch (reportType) {
      case 'clinical':
        return patterns.clinical();
      case 'allergen':
        return patterns.allergen();
      case 'hybrid':
        return patterns.hybrid();
      default:
        return assertNever(reportType);
    }
  }

  /**
   * Ánh xạ loại báo cáo sang ID của phần tử DOM dùng để in ấn / xuất PDF html2canvas.
   */
  public static resolvePrintElementId(
    reportType: MedicalReportType,
    options?: { isBatch?: boolean }
  ): PrintElementId {
    const isBatch = Boolean(options?.isBatch);

    switch (reportType) {
      case 'hybrid':
        return isBatch ? PRINT_ELEMENT_ID.BATCH_HYBRID : PRINT_ELEMENT_ID.HYBRID_REPORT;
      case 'allergen':
        return isBatch ? PRINT_ELEMENT_ID.BATCH_ALLERGEN : PRINT_ELEMENT_ID.ALLERGEN_REPORT;
      case 'clinical':
        return isBatch ? PRINT_ELEMENT_ID.BATCH_MEDICAL : PRINT_ELEMENT_ID.MEDICAL_REPORT;
      default:
        return assertNever(reportType);
    }
  }

  /**
   * Lấy thông tin Badge hiển thị trên Header (Xem trước, Modal, Danh sách phiếu).
   */
  public static getReportTypeBadge(reportType: MedicalReportType): ReportTypeBadge {
    switch (reportType) {
      case 'hybrid':
        return {
          label: 'Mẫu Hỗn Hợp (Hybrid)',
          subLabel: 'Xét nghiệm thường + Cuốn Dị nguyên',
          bgClass: 'bg-gradient-to-r from-purple-100 to-indigo-100',
          textClass: 'text-purple-800',
          borderClass: 'border-purple-300'
        };
      case 'allergen':
        return {
          label: 'Mẫu Cuốn Dị Nguyên',
          subLabel: 'Booklet chuyên sâu định lượng IgE',
          bgClass: 'bg-gradient-to-r from-amber-100 to-orange-100',
          textClass: 'text-amber-800',
          borderClass: 'border-amber-300'
        };
      case 'clinical':
        return {
          label: 'Mẫu Xét Nghiệm Chuẩn',
          subLabel: 'Huyết học, Sinh hóa, Nước tiểu...',
          bgClass: 'bg-emerald-50',
          textClass: 'text-emerald-800',
          borderClass: 'border-emerald-200'
        };
      default:
        return assertNever(reportType);
    }
  }
}
