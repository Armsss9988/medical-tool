import type { SelectedTest } from '../types';

export interface PaginationEntryCategory {
  readonly type: 'category';
  readonly category: string;
  readonly isContinued?: boolean;
}

export interface PaginationEntryTest {
  readonly type: 'test';
  readonly test: SelectedTest;
  readonly idx: number;
  readonly category: string;
}

export type ReportPaginationEntry = PaginationEntryCategory | PaginationEntryTest;

export interface ReportPaginatedPage {
  readonly pageNumber: number;
  readonly isFirstPage: boolean;
  readonly isLastPage: boolean;
  readonly entries: ReadonlyArray<ReportPaginationEntry>;
  readonly tests: ReadonlyArray<SelectedTest>;
  readonly showConclusion: boolean;
  readonly showSignature: boolean;
}

export interface PaginationOptions {
  readonly pageMaxUsableHeight?: number;
  readonly page1StaticHeight?: number;
  readonly page2StaticHeight?: number;
  readonly signatureBlockHeight?: number;
}

/**
 * PURE DOMAIN SERVICE: ReportPaginationDomainService
 * Quản lý thuật toán chia trang thông minh cho phiếu xét nghiệm y khoa khổ A4 tiêu chuẩn (210mm x 297mm).
 * Tính toán độ cao chính xác của từng dòng, chống tràn trang, chống để tiêu đề mồ côi (orphan headers)
 * và bảo vệ khối chữ ký / kết luận không bị đứt đoạn.
 */
export class ReportPaginationDomainService {
  public static readonly DEFAULT_PAGE_MAX_USABLE_HEIGHT = 1000;
  public static readonly DEFAULT_P1_STATIC_HEIGHT = 328;
  public static readonly DEFAULT_P2_STATIC_HEIGHT = 82;
  public static readonly DEFAULT_SIGNATURE_BLOCK_HEIGHT = 138;

  /**
   * Tính toán chiều cao ước tính (px) của một entry hàng trong bảng xét nghiệm.
   */
  public static getEntryHeight(entry: ReportPaginationEntry): number {
    if (entry.type === 'category') return 26;
    const test = entry.test;
    if (!test) return 28;
    const nameLen = (test.name || '').length;
    const noteLen = (test.note || '').length;
    // Cột tên xét nghiệm chiếm ~31% (~210px), tên trên 25 ký tự sẽ rớt thành 2 dòng
    // Cột ghi chú chiếm ~12% (~80px), ghi chú trên 20 ký tự sẽ rớt dòng
    if (nameLen > 25 || noteLen > 20) {
      return 44;
    }
    return 28;
  }

  /**
   * Tính toán chiều cao ước tính (px) của khối kết luận dựa trên độ dài văn bản.
   */
  public static getConclusionHeight(conclusionText?: string): number {
    if (!conclusionText || !conclusionText.trim()) return 0;
    const lines = Math.ceil(conclusionText.trim().length / 70) || 1;
    return 30 + lines * 18;
  }

  /**
   * Phân trang danh sách chỉ số xét nghiệm và kết luận sang các trang A4 tối ưu.
   */
  public static paginate(
    selectedTests: ReadonlyArray<SelectedTest> | null | undefined,
    conclusion: string = '',
    options?: PaginationOptions
  ): ReportPaginatedPage[] {
    const tests = selectedTests || [];
    const maxUsable = options?.pageMaxUsableHeight ?? this.DEFAULT_PAGE_MAX_USABLE_HEIGHT;
    const p1Static = options?.page1StaticHeight ?? this.DEFAULT_P1_STATIC_HEIGHT;
    const p2Static = options?.page2StaticHeight ?? this.DEFAULT_P2_STATIC_HEIGHT;
    const sigHeight = options?.signatureBlockHeight ?? this.DEFAULT_SIGNATURE_BLOCK_HEIGHT;

    // 1. Gom nhóm chỉ số theo danh mục
    const grouped: Record<string, SelectedTest[]> = {};
    tests.forEach((t) => {
      const cat = t.category || 'CHỈ SỐ KHÁC';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    });

    // 2. Trải phẳng thành danh sách entries tuần tự (STT đánh số theo từng danh mục)
    const flatEntries: ReportPaginationEntry[] = [];
    Object.keys(grouped).forEach((cat) => {
      flatEntries.push({ type: 'category', category: cat });
      grouped[cat].forEach((test, i) => {
        flatEntries.push({ type: 'test', test, idx: i + 1, category: cat });
      });
    });

    const conclusionHeight = this.getConclusionHeight(conclusion);
    const totalFinalBlockHeight = (conclusion && conclusion.trim() ? conclusionHeight : 0) + sigHeight;

    // Ước tính tổng chiều cao tất cả các mục để nhận diện kịch bản 2 trang (2-page report)
    const totalEntriesEstimatedHeight = flatEntries.reduce((sum, e) => sum + this.getEntryHeight(e), 0);
    const p1Available = maxUsable - p1Static;
    const p2AvailableWithSignature = maxUsable - p2Static - totalFinalBlockHeight;
    const canFitInSinglePage = p1Static + totalEntriesEstimatedHeight + totalFinalBlockHeight <= maxUsable;
    // Báo cáo cần 2 trang nếu không vừa trang 1 nhưng vừa vặn trong sức chứa 2 trang
    const canFitInTwoPages = !canFitInSinglePage && (totalEntriesEstimatedHeight <= p1Available + p2AvailableWithSignature - 30);
    // Điểm cân bằng cho Trang 1: phân bổ khoảng 48-52% nội dung để trang 1 và trang 2 đều đẹp mắt
    const balancedP1TargetHeight = canFitInTwoPages
      ? Math.min(p1Available, Math.max(p1Available * 0.45, totalEntriesEstimatedHeight * 0.52))
      : p1Available;

    const pages: ReportPaginatedPage[] = [];
    let remaining = [...flatEntries];
    let pageIdx = 0;

    const extractTests = (entriesList: ReadonlyArray<ReportPaginationEntry>): SelectedTest[] =>
      entriesList.filter((e): e is PaginationEntryTest => e.type === 'test').map((e) => e.test);

    while (remaining.length > 0 || pageIdx === 0) {
      pageIdx++;
      const isFirstPage = pageIdx === 1;
      const initialPageHeight = isFirstPage ? p1Static : p2Static;

      const remainingEntriesHeight = remaining.reduce((sum, e) => sum + this.getEntryHeight(e), 0);

      // Nếu toàn bộ phần còn lại + kết luận + chữ ký vừa vặn trong trang này
      if (initialPageHeight + remainingEntriesHeight + totalFinalBlockHeight <= maxUsable) {
        const currentChunk = [...remaining];
        if (!isFirstPage && currentChunk[0] && currentChunk[0].type === 'test') {
          currentChunk.unshift({
            type: 'category',
            category: `${currentChunk[0].category} (tiếp theo)`,
            isContinued: true
          });
        }
        pages.push({
          pageNumber: pageIdx,
          isFirstPage,
          isLastPage: true,
          entries: currentChunk,
          tests: extractTests(currentChunk),
          showConclusion: Boolean(conclusion && conclusion.trim()),
          showSignature: true
        });
        break;
      }

      // Chưa vừa: Tính toán số lượng item lấy được trong trang này
      const maxAllowedContentHeight = (isFirstPage && canFitInTwoPages)
        ? balancedP1TargetHeight
        : (maxUsable - initialPageHeight);

      let currentAccumulatedHeight = 0;
      let takeCount = 0;

      for (let i = 0; i < remaining.length; i++) {
        const entryH = this.getEntryHeight(remaining[i]);
        if (currentAccumulatedHeight + entryH > maxAllowedContentHeight && takeCount > 0) {
          break;
        }
        currentAccumulatedHeight += entryH;
        takeCount = i + 1;
      }

      // Tránh để category title nằm mồ côi ở dòng cuối cùng của trang
      if (takeCount > 1 && takeCount < remaining.length && remaining[takeCount - 1].type === 'category') {
        takeCount -= 1;
      }

      takeCount = Math.max(1, Math.min(takeCount, remaining.length));

      // Tránh để trang tiếp theo chỉ có mỗi chữ ký hoặc quá ít chỉ số (< 4 mục)
      const remainingAfterTake = remaining.length - takeCount;
      if (remainingAfterTake > 0 && remainingAfterTake < 4 && takeCount > 4) {
        const needToMove = 4 - remainingAfterTake;
        takeCount = Math.max(1, takeCount - needToMove);
      } else if (remaining.length <= takeCount && takeCount > 2) {
        const keepBack = Math.min(2, Math.floor(takeCount / 2));
        takeCount = Math.max(1, takeCount - keepBack);
      }

      const chunk = remaining.slice(0, takeCount);
      if (!isFirstPage && chunk[0] && chunk[0].type === 'test') {
        chunk.unshift({
          type: 'category',
          category: `${chunk[0].category} (tiếp theo)`,
          isContinued: true
        });
      }

      remaining = remaining.slice(takeCount);

      const isLastItemTaken = remaining.length === 0;
      if (isLastItemTaken) {
        // Trang áp chót
        pages.push({
          pageNumber: pageIdx,
          isFirstPage,
          isLastPage: false,
          entries: chunk,
          tests: extractTests(chunk),
          showConclusion: false,
          showSignature: false
        });

        // Trang cuối cùng chứa kết luận & chữ ký
        pageIdx++;
        pages.push({
          pageNumber: pageIdx,
          isFirstPage: false,
          isLastPage: true,
          entries: [],
          tests: [],
          showConclusion: Boolean(conclusion && conclusion.trim()),
          showSignature: true
        });
        break;
      } else {
        pages.push({
          pageNumber: pageIdx,
          isFirstPage,
          isLastPage: false,
          entries: chunk,
          tests: extractTests(chunk),
          showConclusion: false,
          showSignature: false
        });
      }
    }

    return pages;
  }
}
