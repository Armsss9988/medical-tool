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
 * Đọc file Blob hoặc ArrayBuffer thành ArrayBuffer an toàn trên cả Browser và Node/Worker
 */
export async function readFileAsArrayBuffer(fileOrBuffer: Blob | ArrayBuffer): Promise<ArrayBuffer> {
  if (fileOrBuffer instanceof ArrayBuffer) {
    return fileOrBuffer;
  }
  if (typeof (fileOrBuffer as Blob).arrayBuffer === 'function') {
    return await (fileOrBuffer as Blob).arrayBuffer();
  }
  return new Promise<ArrayBuffer>((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(fileOrBuffer as Blob);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Chuẩn hóa chuỗi header: loại bỏ dấu, chuyển thường, chỉ giữ ký tự chữ & số
 */
export function cleanKey(str: unknown): string {
  return String(str ?? '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Lấy giá trị thô gốc (chưa ép kiểu sang string) từ 1 hàng Excel dựa trên danh sách aliases
 */
export function getRowRawValue(row: Record<string, unknown>, aliases: string[]): unknown {
  const cleanAliases = aliases.map(cleanKey);
  for (const [key, val] of Object.entries(row)) {
    const cleaned = cleanKey(key);
    if (cleanAliases.includes(cleaned)) {
      return val;
    }
  }
  return undefined;
}

/**
 * Tìm giá trị từ 1 hàng Excel dựa trên danh sách các tên cột tương đương (aliases)
 */
export function getRowValue(row: Record<string, unknown>, aliases: string[]): string {
  const raw = getRowRawValue(row, aliases);
  return raw !== null && raw !== undefined ? String(raw).trim() : '';
}

/**
 * Chuẩn hóa số điện thoại: thêm số 0 ở đầu nếu người dùng nhập 9 số
 */
export function sanitizePhone(raw: unknown): string {
  let cleaned = String(raw ?? '').replace(/\D/g, '');
  if (cleaned.length === 9 && ['3', '5', '7', '8', '9'].includes(cleaned[0])) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

/**
 * Chuẩn hóa giới tính: tự động nhận diện Nam / Nữ
 */
export function sanitizeGender(raw: unknown): Gender {
  const val = String(raw ?? '').toLowerCase().trim();
  if (['nam', 'm', 'male', 'boy', '1'].includes(val)) return 'Nam';
  if (['nu', 'nữ', 'f', 'female', 'girl', '0'].includes(val)) return 'Nữ';
  return 'Nam';
}

/**
 * Chuẩn hóa ngày sinh / năm sinh (hỗ trợ JS Date, Excel serial date, ISO string, DD/MM/YYYY)
 */
export function sanitizeDob(raw: unknown): string {
  if (raw === null || raw === undefined) return '';

  // 1. Trường hợp là đối tượng Date
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const day = String(raw.getDate()).padStart(2, '0');
    const month = String(raw.getMonth() + 1).padStart(2, '0');
    const year = raw.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // 2. Trường hợp là số hoặc chuỗi số serial Excel
  const num = typeof raw === 'number' ? raw : (typeof raw === 'string' && /^\d+(\.\d+)?$/.test(raw.trim()) ? Number(raw) : NaN);
  if (!isNaN(num)) {
    if (num >= 1900 && num <= 2100) {
      return String(Math.floor(num));
    }
    if (num > 2000 && num < 80000) {
      const d = new Date((num - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
  }

  const str = String(raw).trim();
  if (!str) return '';

  // 3. Chuỗi ISO: YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const day = isoMatch[3].padStart(2, '0');
    const month = isoMatch[2].padStart(2, '0');
    const year = isoMatch[1];
    return `${day}/${month}/${year}`;
  }

  // 4. Chuỗi chuẩn hóa phân tách bởi dấu chấm hoặc gạch ngang: DD.MM.YYYY hoặc DD-MM-YYYY
  const delimiterMatch = str.match(/^(\d{1,2})[.-](\d{1,2})[.-](\d{4})$/);
  if (delimiterMatch) {
    const day = delimiterMatch[1].padStart(2, '0');
    const month = delimiterMatch[2].padStart(2, '0');
    const year = delimiterMatch[3];
    return `${day}/${month}/${year}`;
  }

  // 5. Chuỗi 8 số liên tiếp: DDMMYYYY (ví dụ: 08121994)
  const ddmmyyyy8Match = str.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (ddmmyyyy8Match) {
    const day = parseInt(ddmmyyyy8Match[1], 10);
    const month = parseInt(ddmmyyyy8Match[2], 10);
    const year = parseInt(ddmmyyyy8Match[3], 10);
    const currentYear = new Date().getFullYear();
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= currentYear) {
      return `${ddmmyyyy8Match[1]}/${ddmmyyyy8Match[2]}/${ddmmyyyy8Match[3]}`;
    }
  }

  // 6. Chuỗi 7 số liên tiếp: DMMYYYY hoặc DDMYYYY (ví dụ: 8121994 -> 08/12/1994, 1551994 -> 15/05/1994)
  if (/^\d{7}$/.test(str)) {
    const d1 = parseInt(str.slice(0, 1), 10);
    const m2 = parseInt(str.slice(1, 3), 10);
    const d2 = parseInt(str.slice(0, 2), 10);
    const m1 = parseInt(str.slice(2, 3), 10);
    const year = parseInt(str.slice(3), 10);
    const currentYear = new Date().getFullYear();

    const isYearValid = year >= 1900 && year <= currentYear;
    const isCase2Valid = isYearValid && d1 >= 1 && d1 <= 9 && m2 >= 10 && m2 <= 12; // DMMYYYY (VD: 8121994 -> 08/12/1994)
    const isCase1Valid = isYearValid && d2 >= 10 && d2 <= 31 && m1 >= 1 && m1 <= 9; // DDMYYYY (VD: 1551994 -> 15/05/1994)

    if (isCase2Valid && !isCase1Valid) {
      return `0${d1}/${m2}/${year}`;
    }
    if (isCase1Valid && !isCase2Valid) {
      return `${d2}/0${m1}/${year}`;
    }
    if (isCase2Valid && isCase1Valid) {
      return `${d2}/0${m1}/${year}`;
    }
  }

  return str;
}
