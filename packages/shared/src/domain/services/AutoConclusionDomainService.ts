import type { SelectedTest } from '../types';
import { hasMixedTests, hasAllergenTests, isAllergenTest } from '../allergenDetector';
import { evaluateTestIndicator } from '../testResult';

export interface TestAnalysisSummary {
  hasResults: boolean;
  isMixed: boolean;
  isAllergenOnly: boolean;
  abnormalRegularTests: string[];
  positiveAllergens: string[];
}

export class AutoConclusionDomainService {
  /**
   * Phân tích chi tiết danh sách chỉ số xét nghiệm:
   * - Tách chỉ số thường bất thường (kèm nhãn đánh giá CAO/THẤP...)
   * - Tách chỉ số dị nguyên dương tính (kèm độ dương tính hoặc nồng độ tăng)
   */
  public static analyze(selectedTests: ReadonlyArray<SelectedTest>): TestAnalysisSummary {
    const safeTests = selectedTests || [];
    if (safeTests.length === 0) {
      return {
        hasResults: false,
        isMixed: false,
        isAllergenOnly: false,
        abnormalRegularTests: [],
        positiveAllergens: []
      };
    }

    const testsWithResults = safeTests.filter((t) => t.result !== undefined && t.result !== null && String(t.result).trim() !== '');
    if (testsWithResults.length === 0) {
      return {
        hasResults: false,
        isMixed: false,
        isAllergenOnly: false,
        abnormalRegularTests: [],
        positiveAllergens: []
      };
    }

    const isMixed = hasMixedTests(safeTests);
    const isAllergenOnly = !isMixed && hasAllergenTests(safeTests);
    const abnormalRegularTests: string[] = [];

    for (const t of testsWithResults) {
      if (isAllergenTest(t)) {
        continue;
      }
      const evalRes = evaluateTestIndicator(t.code, t.category, t.unit, t.result, t.refMin, t.refMax);
      const noteLabel = t.note || evalRes.label;
      if (evalRes.isAbnormal || (t.note && (t.note.includes('CAO') || t.note.includes('THẤP') || t.note.includes('Dương')))) {
        abnormalRegularTests.push(`${t.name} (${noteLabel})`);
      }
    }

    const positiveAllergens = testsWithResults
      .filter((t) => {
        if (!isAllergenTest(t)) return false;
        
        // 1. Kiểm tra qua evaluateTestIndicator chuẩn y khoa
        const evalRes = evaluateTestIndicator(t.code, t.category, t.unit, t.result, t.refMin, t.refMax);
        if (evalRes.isAbnormal) return true;

        // 2. Kiểm tra qua ghi chú người dùng nhập hoặc máy trả về
        if (t.note) {
          const lowerNote = t.note.toLowerCase();
          if (lowerNote.includes('âm tính') || lowerNote.includes('độ 0') || lowerNote.includes('bình thường')) {
            return false;
          }
          if (lowerNote.includes('dương tính') || lowerNote.includes('tăng') || lowerNote.includes('cao') || /độ\s*[1-6]/i.test(t.note)) {
            return true;
          }
        }
        return false;
      })
      .map((t) => t.name);

    return {
      hasResults: true,
      isMixed,
      isAllergenOnly,
      abnormalRegularTests,
      positiveAllergens
    };
  }

  /**
   * Tự động sinh văn bản kết luận & lời dặn chuyên môn của Bác sĩ dựa trên kết quả phân tích y khoa.
   */
  public static generate(selectedTests: ReadonlyArray<SelectedTest>): string | null {
    const analysis = this.analyze(selectedTests);
    if (!analysis.hasResults) return null;

    const { isMixed, isAllergenOnly, abnormalRegularTests, positiveAllergens } = analysis;

    if (isMixed) {
      const parts: string[] = [];
      if (abnormalRegularTests.length > 0) {
        parts.push(`Chỉ số bất thường: ${abnormalRegularTests.join(', ')}`);
      } else {
        parts.push('Các chỉ số sinh hóa/huyết học trong giới hạn bình thường');
      }

      if (positiveAllergens.length > 0) {
        parts.push(`Dương tính với dị nguyên: ${positiveAllergens.join(', ')}`);
      } else {
        parts.push('Âm tính với các dị nguyên tầm soát');
      }

      return `${parts.join('. ')}. Đề nghị kết hợp lâm sàng và theo dõi`;
    }

    if (isAllergenOnly) {
      if (positiveAllergens.length === 0) {
        return 'Kết quả xét nghiệm dị nguyên: Tất cả các chỉ số đều Âm tính';
      }
      return `Dương tính với: ${positiveAllergens.join(', ')}. Đề nghị kết hợp lâm sàng`;
    }

    if (abnormalRegularTests.length === 0) {
      return 'Các chỉ số xét nghiệm trong giới hạn bình thường';
    }

    if (abnormalRegularTests.length <= 3) {
      return `Chỉ số bất thường: ${abnormalRegularTests.join(', ')}. Đề nghị theo dõi và tái khám`;
    }

    return `Có ${abnormalRegularTests.length} chỉ số bất thường. Đề nghị xét nghiệm lại và theo dõi`;
  }
}
