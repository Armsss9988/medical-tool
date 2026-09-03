import { describe, it, expect } from 'vitest';
import type { SelectedTest } from '@domain/types';

// Extract the core pagination logic for testing
export function calculateReportPages(
  selectedTests: SelectedTest[],
  conclusion: string = ''
) {
  const PAGE_MAX_USABLE_HEIGHT = 1000;
  const P1_STATIC_HEIGHT = 328;
  const P2_STATIC_HEIGHT = 82;
  const SIGNATURE_BLOCK_HEIGHT = 138;

  type FlatEntry =
    | { type: 'category'; category: string; isContinued?: boolean }
    | { type: 'test'; test: SelectedTest; idx: number; category: string };

  const grouped: Record<string, SelectedTest[]> = {};
  selectedTests.forEach((t) => {
    const cat = t.category || 'CHỈ SỐ KHÁC';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  });

  const flatEntries: FlatEntry[] = [];
  let itemCounter = 0;
  Object.keys(grouped).forEach((cat) => {
    flatEntries.push({ type: 'category', category: cat });
    grouped[cat].forEach((test) => {
      itemCounter++;
      flatEntries.push({ type: 'test', test, idx: itemCounter, category: cat });
    });
  });

  const getEntryHeight = (entry: FlatEntry): number => {
    if (entry.type === 'category') return 26;
    const test = entry.test;
    if (!test) return 28;
    const nameLen = (test.name || '').length;
    const noteLen = (test.note || '').length;
    if (nameLen > 35 || noteLen > 25) {
      return 42;
    }
    return 28;
  };

  const getConclusionHeight = (conclusionText?: string): number => {
    if (!conclusionText || !conclusionText.trim()) return 0;
    const lines = Math.ceil(conclusionText.length / 70) || 1;
    return 30 + lines * 18;
  };

  const conclusionHeight = getConclusionHeight(conclusion);
  const totalFinalBlockHeight = (conclusion ? conclusionHeight : 0) + SIGNATURE_BLOCK_HEIGHT;

  const pages: Array<{
    isFirstPage: boolean;
    isLastPage: boolean;
    entries: FlatEntry[];
    showConclusion: boolean;
    showSignature: boolean;
  }> = [];

  let remaining = [...flatEntries];
  let pageIdx = 0;

  while (remaining.length > 0 || pageIdx === 0) {
    pageIdx++;
    const isFirstPage = pageIdx === 1;
    const initialPageHeight = isFirstPage ? P1_STATIC_HEIGHT : P2_STATIC_HEIGHT;

    const remainingEntriesHeight = remaining.reduce((sum, e) => sum + getEntryHeight(e), 0);

    if (initialPageHeight + remainingEntriesHeight + totalFinalBlockHeight <= PAGE_MAX_USABLE_HEIGHT) {
      const currentChunk = [...remaining];
      if (!isFirstPage && currentChunk[0] && currentChunk[0].type === 'test') {
        currentChunk.unshift({
          type: 'category',
          category: `${currentChunk[0].category} (tiếp theo)`,
          isContinued: true
        });
      }
      pages.push({
        isFirstPage,
        isLastPage: true,
        entries: currentChunk,
        showConclusion: Boolean(conclusion),
        showSignature: true
      });
      break;
    }

    let currentHeight = initialPageHeight;
    let takeCount = 0;

    for (let i = 0; i < remaining.length; i++) {
      const entryH = getEntryHeight(remaining[i]);
      if (currentHeight + entryH > PAGE_MAX_USABLE_HEIGHT) {
        break;
      }
      currentHeight += entryH;
      takeCount = i + 1;
    }

    if (takeCount > 1 && takeCount < remaining.length && remaining[takeCount - 1].type === 'category') {
      takeCount -= 1;
    }

    takeCount = Math.max(1, Math.min(takeCount, remaining.length));

    if (remaining.length <= takeCount && takeCount > 2) {
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
      pages.push({
        isFirstPage,
        isLastPage: false,
        entries: chunk,
        showConclusion: false,
        showSignature: false
      });

      pages.push({
        isFirstPage: false,
        isLastPage: true,
        entries: [],
        showConclusion: Boolean(conclusion),
        showSignature: true
      });
      break;
    } else {
      pages.push({
        isFirstPage,
        isLastPage: false,
        entries: chunk,
        showConclusion: false,
        showSignature: false
      });
    }
  }

  return pages;
}

describe('Clinical Report Pagination with ~10 Standard Indicators', () => {
  const createTests = (count: number, category: string = 'SINH HÓA MÁU'): SelectedTest[] => {
    return Array.from({ length: count }, (_, i) => ({
      code: `TEST_${i + 1}`,
      name: `Chỉ số xét nghiệm ${i + 1}`,
      result: '5.5',
      unit: 'mmol/L',
      refMin: 3.5,
      refMax: 6.5,
      refText: '3.5 - 6.5',
      note: '',
      price: 35000,
      category
    }));
  };

  it('should fit a routine 10-indicator package on exactly 1 page with conclusion and signature', () => {
    const tests10 = createTests(10, 'SINH HÓA MÁU');
    const pages = calculateReportPages(tests10, 'Các chỉ số trong giới hạn bình thường. Tái khám sau 3 tháng.');

    expect(pages).toHaveLength(1);
    expect(pages[0].isFirstPage).toBe(true);
    expect(pages[0].isLastPage).toBe(true);
    expect(pages[0].showSignature).toBe(true);
    expect(pages[0].showConclusion).toBe(true);
    // 1 category + 10 test entries = 11 entries
    expect(pages[0].entries).toHaveLength(11);
  });

  it('should fit a 12-indicator routine package on exactly 1 page with signature', () => {
    const tests12 = createTests(12, 'SINH HÓA MÁU');
    const pages = calculateReportPages(tests12, 'Theo dõi thêm.');

    expect(pages).toHaveLength(1);
    expect(pages[0].showSignature).toBe(true);
  });

  it('should cleanly split into 2 pages for large panels (>16 tests) and never leave an empty orphan signature page', () => {
    const tests20 = createTests(20, 'SINH HÓA MÁU');
    const pages = calculateReportPages(tests20, 'Chỉ số cần theo dõi.');

    expect(pages.length).toBeGreaterThanOrEqual(2);
    // Page 2 must have tests and not be an empty orphan page
    const lastPage = pages[pages.length - 1];
    expect(lastPage.showSignature).toBe(true);
    expect(lastPage.entries.length).toBeGreaterThan(0);
  });
});
