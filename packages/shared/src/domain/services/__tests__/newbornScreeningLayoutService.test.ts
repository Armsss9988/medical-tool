import { describe, it, expect } from 'vitest';
import {
  calculateSamplingAgeDays,
  formatMSMSEvaluationText,
  NEWBORN_SCREENING_8_FIXED_NOTES
} from '../newbornScreeningLayoutService';

describe('newbornScreeningLayoutService', () => {
  describe('calculateSamplingAgeDays', () => {
    it('tính toán số ngày chính xác khi ngày lấy mẫu sau ngày sinh', () => {
      expect(calculateSamplingAgeDays('2026-10-05', '2026-10-08')).toBe('3 ngày');
      expect(calculateSamplingAgeDays('2026-10-08', '2026-10-08')).toBe('0 ngày');
      expect(calculateSamplingAgeDays('05/10/2026', '08/10/2026')).toBe('3 ngày');
    });

    it('trả về rỗng khi dữ liệu ngày không hợp lệ hoặc bị thiếu', () => {
      expect(calculateSamplingAgeDays(null, '2026-10-08')).toBe('—');
      expect(calculateSamplingAgeDays('2026-10-08', null)).toBe('—');
      expect(calculateSamplingAgeDays('', '')).toBe('—');
      expect(calculateSamplingAgeDays('invalid-date', '2026-10-08')).toBe('—');
    });
  });

  describe('formatMSMSEvaluationText', () => {
    it('trả về đúng định dạng text đánh giá riêng cho gói MS/MS', () => {
      // Trong ngưỡng
      expect(formatMSMSEvaluationText(4.2, 0, 4.2)).toBe('Trong giới hạn sàng lọc');
      expect(formatMSMSEvaluationText(8.5, 8.0, null)).toBe('Trong giới hạn sàng lọc');
      expect(formatMSMSEvaluationText(15.0, 9.0, 55.0)).toBe('Trong giới hạn sàng lọc');

      // Vượt Max
      expect(formatMSMSEvaluationText(4.21, 0, 4.2)).toBe('Cao hơn giới hạn sàng lọc ↑');
      expect(formatMSMSEvaluationText(60.0, 9.0, 55.0)).toBe('Cao hơn giới hạn sàng lọc ↑');

      // Thấp hơn Min
      expect(formatMSMSEvaluationText(7.5, 8.0, null)).toBe('Thấp hơn giới hạn sàng lọc ↓');
      expect(formatMSMSEvaluationText(8.9, 9.0, 55.0)).toBe('Thấp hơn giới hạn sàng lọc ↓');

      // Không có giá trị
      expect(formatMSMSEvaluationText(null, 0, 4.2)).toBe('Chưa xác định');
    });
  });

  describe('NEWBORN_SCREENING_8_FIXED_NOTES', () => {
    it('chứa đúng 8 mục lưu ý cố định và không chứa ký tự so sánh kép', () => {
      expect(NEWBORN_SCREENING_8_FIXED_NOTES.length).toBe(8);
      for (const note of NEWBORN_SCREENING_8_FIXED_NOTES) {
        expect(note).not.toMatch(/[≤≥]|<=|>=|=<|=>/);
      }
    });
  });
});
