import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  sanitizeDob,
  cleanKey,
  sanitizePhone,
  sanitizeGender,
  readFileAsArrayBuffer
} from '../excel/excelHelpers';
import { parseExcelDoctors } from '../excel/excelDoctors';
import { parseExcelEquipments } from '../excel/excelEquipments';
import { parseExcelTestGroups } from '../excel/excelTestGroups';
import { parseExcelTestPackages } from '../excel/excelPackages';

describe('Excel Helpers & Hardened Parsers', () => {
  describe('sanitizeDob', () => {
    it('handles JS Date objects properly', () => {
      const d = new Date(1990, 4, 15); // May 15, 1990
      expect(sanitizeDob(d)).toBe('15/05/1990');
    });

    it('handles Excel serial dates', () => {
      // 32874 corresponds to 1990-01-01
      const res = sanitizeDob(32874);
      expect(res).toBe('01/01/1990');
    });

    it('handles 4-digit birth year', () => {
      expect(sanitizeDob('1985')).toBe('1985');
      expect(sanitizeDob(1985)).toBe('1985');
    });

    it('handles ISO date YYYY-MM-DD', () => {
      expect(sanitizeDob('1992-12-25')).toBe('25/12/1992');
    });

    it('handles delimited dates DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY', () => {
      expect(sanitizeDob('05/08/1993')).toBe('05/08/1993');
      expect(sanitizeDob('5.8.1993')).toBe('05/08/1993');
      expect(sanitizeDob('5-8-1993')).toBe('05/08/1993');
    });

    it('handles 8-digit and 7-digit continuous number DOBs properly', () => {
      expect(sanitizeDob('08121994')).toBe('08/12/1994');
      expect(sanitizeDob('8121994')).toBe('08/12/1994');
      expect(sanitizeDob('1551994')).toBe('15/05/1994');
      expect(sanitizeDob('2281994')).toBe('22/08/1994');
    });

    it('returns empty string on invalid or empty inputs', () => {
      expect(sanitizeDob('')).toBe('');
      expect(sanitizeDob(null)).toBe('');
      expect(sanitizeDob(undefined)).toBe('');
    });
  });

  describe('cleanKey, sanitizePhone, sanitizeGender', () => {
    it('cleans Vietnamese diacritics and special characters including d/D', () => {
      expect(cleanKey('Họ và Tên')).toBe('hovaten');
      expect(cleanKey('Glucose máu [GLU]')).toBe('glucosemauglu');
      expect(cleanKey('Số Điện Thoại')).toBe('sodienthoai');
      expect(cleanKey('Tên Thiết Bị / Máy Đo (*)')).toBe('tenthietbimaydo');
    });

    it('sanitizes phone numbers with dots/dashes', () => {
      expect(sanitizePhone('090.123.4567')).toBe('0901234567');
      expect(sanitizePhone('901234567')).toBe('0901234567');
    });

    it('sanitizes gender correctly', () => {
      expect(sanitizeGender('nam')).toBe('Nam');
      expect(sanitizeGender('NỮ')).toBe('Nữ');
      expect(sanitizeGender('female')).toBe('Nữ');
      expect(sanitizeGender('unknown')).toBe('Nam');
    });
  });

  describe('readFileAsArrayBuffer', () => {
    it('returns the same buffer if an ArrayBuffer is passed', async () => {
      const ab = new ArrayBuffer(8);
      const res = await readFileAsArrayBuffer(ab);
      expect(res).toBe(ab);
    });
  });

  describe('parseExcelDoctors with ArrayBuffer', () => {
    it('parses doctors list without FileReader', async () => {
      const wb = XLSX.utils.book_new();
      const rows = [
        { 'Họ và Tên Bác Sĩ (*)': 'BS. Lê Văn Cường', 'Chuyên Khoa': 'Xét Nghiệm', 'Số Điện Thoại': '0912.345.678' }
      ];
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Doctors');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      const doctors = await parseExcelDoctors(buffer);
      expect(doctors.length).toBe(1);
      expect(doctors[0].name).toBe('BS. Lê Văn Cường');
      expect(doctors[0].specialty).toBe('Xét Nghiệm');
      expect(doctors[0].phone).toBe('0912345678');
      expect(doctors[0].id).toBeDefined();
    });
  });

  describe('parseExcelEquipments with ArrayBuffer', () => {
    it('parses equipments list without FileReader', async () => {
      const wb = XLSX.utils.book_new();
      const rows = [
        { 'Tên Thiết Bị / Máy Đo (*)': 'Máy Huyết Học Mindray BC-5000', 'Mã Máy Đo': 'BC5000' }
      ];
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Equipments');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      const eqs = await parseExcelEquipments(buffer);
      expect(eqs.length).toBe(1);
      expect(eqs[0].name).toBe('Máy Huyết Học Mindray BC-5000');
      expect(eqs[0].code).toBe('BC5000');
      expect(eqs[0].id).toBe('eq_bc5000');
    });
  });

  describe('parseExcelTestGroups with ArrayBuffer', () => {
    it('parses test groups list without FileReader', async () => {
      const wb = XLSX.utils.book_new();
      const rows = [
        { 'Tên Nhóm Xét Nghiệm (*)': 'Huyết Học Lâm Sàng', 'Mã Nhóm': 'GRP_HH' }
      ];
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Groups');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      const grps = await parseExcelTestGroups(buffer);
      expect(grps.length).toBe(1);
      expect(grps[0].name).toBe('Huyết Học Lâm Sàng');
      expect(grps[0].id).toBe('GRP_HH');
    });
  });

  describe('parseExcelTestPackages with explicit ID', () => {
    it('preserves explicit package id from Excel columns', async () => {
      const wb = XLSX.utils.book_new();
      const rows = [
        { 'Tên Gói Xét Nghiệm (*)': 'Gói Gan Mật', 'Mã Gói': 'PKG_LIVER_01', 'Đơn Giá Gói (VNĐ)': 350000, 'Mã Chỉ Số Thành Phần': 'GOT' }
      ];
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Packages');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      const pkgs = await parseExcelTestPackages(buffer, [], []);
      expect(pkgs.length).toBe(1);
      expect(pkgs[0].id).toBe('pkg_liver_01');
      expect(pkgs[0].name).toBe('Gói Gan Mật');
      expect(pkgs[0].price).toBe(350000);
      expect(pkgs[0].items.some(i => i.code === 'GOT')).toBe(true);
    });
  });
});
