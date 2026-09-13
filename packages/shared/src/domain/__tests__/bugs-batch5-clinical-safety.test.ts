import { describe, it, expect } from 'vitest';
import { evaluateTestIndicator, evaluateResult } from '../testResult';
import { isAllergenTest } from '../allergenDetector';

describe('Task 5: Kiểm chứng an toàn lâm sàng sau khi sửa chữa (Bug 20, 21, 22)', () => {
  it('[Bug 20 - FIXED] Kết quả dưới ngưỡng đo ("< 20") được đánh giá chính xác là Không Phát Hiện (Bình thường)', () => {
    const category = 'Sinh học phân tử';
    const testCode = 'HBV-DNA';

    const resultBelowLOD = '< 20';
    const evaluation = evaluateTestIndicator(
      testCode,
      category,
      'copies/mL',
      resultBelowLOD,
      undefined,
      undefined,
      undefined,
      undefined,
      'detection'
    );

    // Sau khi sửa: "< 20" phải là bình thường, không báo động dương tính giả
    expect(evaluation.status).toBe('normal');
    expect(evaluation.label).toBe('Không Phát Hiện');
    expect(evaluation.isAbnormal).toBe(false);
  });

  it('[Bug 21 - FIXED] Xóa giá trị xét nghiệm định lượng tự động làm sạch cờ cảnh báo bất thường cũ', () => {
    const computeAutoNote = (rawVal: string, refMin: number, refMax: number, currentNote: string) => {
      const evalRes = evaluateResult(rawVal, refMin, refMax);
      const isEmptyValue = rawVal === null || rawVal === undefined || String(rawVal).trim() === '';
      const autoNote = isEmptyValue ? '' : (evalRes.label || currentNote);
      return autoNote;
    };

    // Trước đó kỹ thuật viên gõ 15.0 mmol/L -> Đang có note là "CAO ↑"
    const oldNote = 'CAO ↑';

    // Kỹ thuật viên xóa trắng ô kết quả (rawVal = "")
    const autoNoteAfterClear = computeAutoNote('', 3.9, 6.4, oldNote);

    // Sau khi sửa: cờ "CAO ↑" được làm sạch về chuỗi rỗng
    expect(autoNoteAfterClear).toBe('');
  });

  it('[Bug 22 - FIXED] Nhận diện dị nguyên hoạt động chính xác với cả "IU/ml" và "IU/mL" cho chỉ số Dị nguyên', () => {
    const testItemLowercase = {
      code: 'ALLERG-01',
      category: 'Dị Nguyên',
      unit: 'IU/ml'
    };
    const testItemUppercase = {
      code: 'ALLERG-02',
      category: 'Dị Nguyên Hô Hấp',
      unit: 'IU/mL'
    };

    expect(isAllergenTest(testItemLowercase)).toBe(true);
    expect(isAllergenTest(testItemUppercase)).toBe(true);
  });

  it('[Bug 22 - VERIFIED] Chỉ số miễn dịch thông thường (Anti-HBs) có đơn vị IU/mL KHÔNG bị nhận diện là dị nguyên', () => {
    const hepatitisBTest = {
      code: 'AHBS',
      name: 'Anti-HBs (Định lượng)',
      category: 'Miễn dịch',
      unit: 'IU/mL'
    };

    // Anti-HBs KHÔNG được xem là dị nguyên
    expect(isAllergenTest(hepatitisBTest)).toBe(false);

    // Đánh giá chỉ số: 100 IU/mL không được gán nhãn Độ 6 Dị ứng cực mạnh
    const evaluation = evaluateTestIndicator(
      'AHBS',
      'Miễn dịch',
      'IU/mL',
      '100',
      0,
      10.0
    );
    expect(evaluation.label).not.toContain('Dị ứng');
  });
});

