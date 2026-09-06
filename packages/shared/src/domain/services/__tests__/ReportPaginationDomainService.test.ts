import { describe, it, expect } from 'vitest';
import {
  ReportPaginationDomainService,
  PaginationEntryCategory,
  PaginationEntryTest
} from '../ReportPaginationDomainService';
import type { SelectedTest } from '../../types';

describe('ReportPaginationDomainService', () => {
  const createMockTest = (
    code: string,
    name: string,
    category: string = 'Sinh hóa',
    note: string = ''
  ): SelectedTest => ({
    code,
    name,
    result: '5.0',
    unit: 'mmol/L',
    refText: '3.5 - 5.5',
    refMin: 3.5,
    refMax: 5.5,
    category,
    price: 50000,
    note
  });

  describe('Height Calculations', () => {
    it('should calculate category entry height as 26px', () => {
      const catEntry: PaginationEntryCategory = {
        type: 'category',
        category: 'Huyết học'
      };
      expect(ReportPaginationDomainService.getEntryHeight(catEntry)).toBe(26);
    });

    it('should calculate standard test entry height as 28px', () => {
      const test = createMockTest('GLU', 'Glucose máu');
      const entry: PaginationEntryTest = {
        type: 'test',
        test,
        idx: 1,
        category: 'Sinh hóa'
      };
      expect(ReportPaginationDomainService.getEntryHeight(entry)).toBe(28);
    });

    it('should calculate long test entry or long note height as 42px', () => {
      const longTest = createMockTest('SPEC', 'Định lượng kháng thể đặc hiệu trong huyết thanh bệnh nhân rất dài');
      const entry1: PaginationEntryTest = {
        type: 'test',
        test: longTest,
        idx: 1,
        category: 'Sinh hóa'
      };
      expect(ReportPaginationDomainService.getEntryHeight(entry1)).toBe(42);

      const noteTest = createMockTest('UR', 'Ure', 'Sinh hóa', 'Mẫu huyết thanh bị vỡ hồng cầu nhẹ cần đối chiếu lâm sàng');
      const entry2: PaginationEntryTest = {
        type: 'test',
        test: noteTest,
        idx: 2,
        category: 'Sinh hóa'
      };
      expect(ReportPaginationDomainService.getEntryHeight(entry2)).toBe(42);
    });

    it('should calculate conclusion height correctly based on text length', () => {
      expect(ReportPaginationDomainService.getConclusionHeight('')).toBe(0);
      expect(ReportPaginationDomainService.getConclusionHeight('   ')).toBe(0);
      expect(ReportPaginationDomainService.getConclusionHeight(undefined)).toBe(0);

      // 1 line conclusion (<= 70 chars) -> 30 + 1 * 18 = 48
      expect(ReportPaginationDomainService.getConclusionHeight('Các chỉ số trong giới hạn bình thường')).toBe(48);

      // Multi-line conclusion (> 70 chars)
      const longConclusion = 'Bệnh nhân có biểu hiện tăng men gan nhẹ. Đề nghị kiêng rượu bia, tái khám kiểm tra sau 2 tuần hoặc khi có dấu hiệu vàng da, mệt mỏi.';
      expect(ReportPaginationDomainService.getConclusionHeight(longConclusion)).toBeGreaterThan(48);
    });
  });

  describe('Pagination Splitting Scenarios', () => {
    it('should handle empty or null tests list', () => {
      const pages1 = ReportPaginationDomainService.paginate([]);
      expect(pages1).toHaveLength(1);
      expect(pages1[0].isFirstPage).toBe(true);
      expect(pages1[0].isLastPage).toBe(true);
      expect(pages1[0].entries).toHaveLength(0);
      expect(pages1[0].showSignature).toBe(true);

      const pages2 = ReportPaginationDomainService.paginate(null, 'Lời dặn');
      expect(pages2).toHaveLength(1);
      expect(pages2[0].showConclusion).toBe(true);
      expect(pages2[0].showSignature).toBe(true);
    });

    it('should fit small test list (5 tests) on a single page', () => {
      const tests = [
        createMockTest('GLU', 'Glucose'),
        createMockTest('URE', 'Ure'),
        createMockTest('CRE', 'Creatinin'),
        createMockTest('AST', 'SGOT / AST'),
        createMockTest('ALT', 'SGPT / ALT')
      ];

      const pages = ReportPaginationDomainService.paginate(tests, 'Bình thường');
      expect(pages).toHaveLength(1);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[0].isFirstPage).toBe(true);
      expect(pages[0].isLastPage).toBe(true);
      expect(pages[0].showConclusion).toBe(true);
      expect(pages[0].showSignature).toBe(true);
      expect(pages[0].tests).toHaveLength(5);
    });

    it('should split moderate test list (20 tests) across exactly 2 pages', () => {
      const tests: SelectedTest[] = [];
      for (let i = 1; i <= 20; i++) {
        tests.push(createMockTest(`T${i}`, `Xét nghiệm chỉ số số ${i}`, i <= 10 ? 'Sinh hóa máu' : 'Huyết học'));
      }

      const pages = ReportPaginationDomainService.paginate(tests, 'Cần theo dõi thêm');
      expect(pages).toHaveLength(2);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[0].isFirstPage).toBe(true);
      expect(pages[0].isLastPage).toBe(false);
      expect(pages[0].showSignature).toBe(false);

      expect(pages[1].pageNumber).toBe(2);
      expect(pages[1].isFirstPage).toBe(false);
      expect(pages[1].isLastPage).toBe(true);
      expect(pages[1].showConclusion).toBe(true);
      expect(pages[1].showSignature).toBe(true);

      // Total tests across pages must equal 20
      const totalTests = pages[0].tests.length + pages[1].tests.length;
      expect(totalTests).toBe(20);
    });

    it('should split long test list (45 tests) across 3 pages cleanly', () => {
      const tests: SelectedTest[] = [];
      for (let i = 1; i <= 45; i++) {
        tests.push(createMockTest(`T${i}`, `Chỉ số kiểm tra tổng quát lâm sàng số ${i}`, `Nhóm ${Math.ceil(i / 10)}`));
      }

      const pages = ReportPaginationDomainService.paginate(tests, 'Kết luận tổng thể');
      expect(pages.length).toBeGreaterThanOrEqual(2);
      expect(pages[pages.length - 1].isLastPage).toBe(true);
      expect(pages[pages.length - 1].showSignature).toBe(true);

      const totalCalculatedTests = pages.reduce((sum, p) => sum + p.tests.length, 0);
      expect(totalCalculatedTests).toBe(45);
    });

    it('should add (tiếp theo) label when a category continues onto page 2', () => {
      const tests: SelectedTest[] = [];
      for (let i = 1; i <= 25; i++) {
        tests.push(createMockTest(`T${i}`, `Xét nghiệm cùng nhóm ${i}`, 'Sinh hóa gan mật'));
      }

      const pages = ReportPaginationDomainService.paginate(tests);
      expect(pages.length).toBeGreaterThan(1);
      const page2FirstEntry = pages[1].entries[0];
      expect(page2FirstEntry.type).toBe('category');
      if (page2FirstEntry.type === 'category') {
        expect(page2FirstEntry.isContinued).toBe(true);
        expect(page2FirstEntry.category).toContain('(tiếp theo)');
      }
    });
  });
});
