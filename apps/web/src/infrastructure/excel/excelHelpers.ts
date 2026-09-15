import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import type { Gender } from '@domain/types';

/**
 * Trích xuất toàn bộ nội dung các sheet của workbook XLSX thành text thuần
 * (dùng cho AI Smart Fill — bỏ qua các sheet _DataLookup)
 */
export function extractExcelWorkbookToText(buffer: ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const textParts: string[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    if (sheetName.startsWith('_DataLookup')) return;
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;
    const jsonRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    if (!jsonRows || jsonRows.length === 0) return;

    textParts.push(`\n=== BẢNG / SHEET: ${sheetName} ===`);
    jsonRows.slice(0, 100).forEach((row) => {
      if (row && Array.isArray(row) && row.some((c) => c !== null && c !== undefined && String(c).trim() !== '')) {
        textParts.push(row.map((c) => String(c ?? '').trim()).join(' | '));
      }
    });
  });

  return textParts.join('\n').trim();
}

/**
 * Số lượng sheet trong workbook XLSX (dùng cho thông báo sau khi trích xuất)
 */
export function countExcelSheets(buffer: ArrayBuffer): number {
  const workbook = XLSX.read(buffer, { type: 'array' });
  return workbook.SheetNames.length;
}

/**
 * Lưu Workbook từ ExcelJS thành file tải về trình duyệt
 */
export async function saveExcelJsWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Chuẩn hóa chuỗi header: loại bỏ dấu, chuyển thường, chỉ giữ ký tự chữ & số
 */
export function cleanKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Tìm giá trị từ 1 hàng Excel dựa trên danh sách các tên cột tương đương (aliases)
 */
export function getRowValue(row: Record<string, unknown>, aliases: string[]): string {
  const cleanAliases = aliases.map(cleanKey);
  for (const [key, val] of Object.entries(row)) {
    const cleaned = cleanKey(key);
    if (cleanAliases.includes(cleaned)) {
      return String(val ?? '').trim();
    }
  }
  return '';
}

/**
 * Chuẩn hóa số điện thoại: thêm số 0 ở đầu nếu người dùng nhập 9 số
 */
export function sanitizePhone(raw: string): string {
  let cleaned = raw.replace(/\D/g, '');
  if (cleaned.length === 9 && ['3', '5', '7', '8', '9'].includes(cleaned[0])) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

/**
 * Chuẩn hóa giới tính: tự động nhận diện Nam / Nữ
 */
export function sanitizeGender(raw: string): Gender {
  const val = raw.toLowerCase().trim();
  if (['nam', 'm', 'male', 'boy', '1'].includes(val)) return 'Nam';
  if (['nu', 'nữ', 'f', 'female', 'girl', '0'].includes(val)) return 'Nữ';
  return 'Nam';
}

/**
 * Chuẩn hóa ngày sinh / năm sinh (hỗ trợ cả dạng ngày Excel serial và chuỗi text)
 */
export function sanitizeDob(raw: unknown): string {
  if (typeof raw === 'number') {
    if (raw >= 1900 && raw <= 2100) {
      return String(raw);
    }
    if (raw > 2000 && raw < 70000) {
      const d = new Date((raw - 25569) * 86400 * 1000);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }
  return String(raw || '').trim();
}
