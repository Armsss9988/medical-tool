import { describe, it, expect } from 'vitest';
import { removeVietnameseTones, formatCurrency, formatReportPdfFilename, formatDisplayDate } from '../formatters';

describe('formatters domain utility', () => {
  describe('removeVietnameseTones', () => {
    it('should normalize Vietnamese diacritics to unaccented lowercase', () => {
      expect(removeVietnameseTones('Đường huyết (Glucose)')).toBe('duong huyet (glucose)');
      expect(removeVietnameseTones('AST (GOT) - Men gan')).toBe('ast (got) - men gan');
      expect(removeVietnameseTones('Tổng phân tích nước tiểu')).toBe('tong phan tich nuoc tieu');
      expect(removeVietnameseTones('DỊ NGUYÊN HÔ HẤP')).toBe('di nguyen ho hap');
      expect(removeVietnameseTones('ĐẮC LẮC Ợ Ỡ Ụ')).toBe('dac lac o o u');
    });

    it('should handle empty or null values gracefully', () => {
      expect(removeVietnameseTones('')).toBe('');
      expect(removeVietnameseTones(null)).toBe('');
      expect(removeVietnameseTones(undefined)).toBe('');
    });

    it('should preserve numbers and standard ascii characters', () => {
      expect(removeVietnameseTones('HbA1c 6.5%')).toBe('hba1c 6.5%');
      expect(removeVietnameseTones('   Triglyceride   ')).toBe('triglyceride');
    });
  });

  describe('formatCurrency', () => {
    it('should format VND currency correctly', () => {
      const formatted = formatCurrency(150000);
      expect(formatted).toContain('150.000');
    });

    it('should format 0 when amount is null or undefined', () => {
      const formatted = formatCurrency(null);
      expect(formatted).toContain('0');
    });
  });

  describe('formatReportPdfFilename', () => {
    it('should format PDF filename with PhieuXN_Ten_MaPhieu.pdf structure', () => {
      expect(formatReportPdfFilename('Nguyễn Văn A', '260308-01')).toBe('PhieuXN_Nguyễn_Văn_A_260308-01.pdf');
    });

    it('should normalize consecutive spaces and trim whitespace', () => {
      expect(formatReportPdfFilename('   Trần   Thị   Mai   ', '  XN002  ')).toBe('PhieuXN_Trần_Thị_Mai_XN002.pdf');
    });

    it('should sanitize illegal operating system filename characters', () => {
      expect(formatReportPdfFilename('Lê Văn B (VIP):/\\*?"<>|', 'GL:123/45')).toBe('PhieuXN_Lê_Văn_B_(VIP)_GL12345.pdf');
    });

    it('should fallback gracefully when name or code is missing', () => {
      expect(formatReportPdfFilename('', 'XN001')).toBe('PhieuXN_BenhNhan_XN001.pdf');
      expect(formatReportPdfFilename('Nguyễn Văn C', '')).toBe('PhieuXN_Nguyễn_Văn_C_BN.pdf');
      expect(formatReportPdfFilename(null, null)).toBe('PhieuXN_BenhNhan_BN.pdf');
    });
  });

  describe('formatDisplayDate', () => {
    it('should format ISO timestamp to DD/MM/YYYY HH:mm', () => {
      // 2026-09-13T10:30:00.000Z
      const iso = new Date(2026, 8, 13, 10, 30).toISOString();
      const formatted = formatDisplayDate(iso);
      expect(formatted).toBe('13/09/2026 10:30');
    });

    it('should return fallback when input is empty, null or undefined', () => {
      expect(formatDisplayDate('', 'Chưa thu phí')).toBe('Chưa thu phí');
      expect(formatDisplayDate(null, '---')).toBe('---');
      expect(formatDisplayDate(undefined, '---')).toBe('---');
    });

    it('should preserve already formatted strings', () => {
      expect(formatDisplayDate('13/09/2026')).toBe('13/09/2026');
      expect(formatDisplayDate('Chưa thu phí')).toBe('Chưa thu phí');
    });
  });
});
