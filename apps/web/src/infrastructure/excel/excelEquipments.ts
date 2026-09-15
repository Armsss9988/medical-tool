import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import type { TestEquipment } from '@domain/types';
import { saveExcelJsWorkbook, getRowValue } from './excelHelpers';

/**
 * Xuất file Excel template hoặc dữ liệu thực tế cho Thiết bị / Máy đo (kèm Tự Động Mã Máy)
 */
export async function exportEquipmentsTemplate(equipments: TestEquipment[] = [], isSampleOnly: boolean = true): Promise<void> {
  const sampleData = isSampleOnly || equipments.length === 0 ? [
    { stt: 1, name: 'Máy Sinh Hóa Tự Động MS-360', code: 'MS-360', note: 'Phòng Sinh Hóa - Đo quang / điện giải' },
    { stt: 2, name: 'Máy Phân Tích Huyết Học MS-H630', code: 'MS-H630', note: 'Phòng Huyết Học - Laser 5 thành phần bạch cầu' },
    { stt: 3, name: 'PROTIA Allergy-Q Smart Q-processor', code: 'PROTIA-Q', note: 'Máy đọc dị nguyên bán tự động' },
    { stt: 4, name: 'Roche cobas e 801', code: 'COBAS-E801', note: 'Hệ thống miễn dịch điện hóa phát quang' }
  ] : equipments.map((eq, idx) => ({
    stt: idx + 1,
    name: eq.name,
    code: eq.code || eq.id.replace(/^eq_/, '').toUpperCase(),
    note: ''
  }));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GoLab Medical';
  wb.created = new Date();

  const ws = wb.addWorksheet('Thiết Bị & Máy Đo', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  ws.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Tên Thiết Bị / Máy Đo (*)', key: 'name', width: 38 },
    { header: 'Mã Máy Đo [Tự động tạo - K cần nhập]', key: 'code', width: 28 },
    { header: 'Ghi Chú / Nguyên Lý Đo', key: 'note', width: 35 }
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } }; // Cyan 600
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  sampleData.forEach((row) => {
    const excelRow = ws.addRow(row);
    const codeCell = excelRow.getCell(3);
    codeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    codeCell.font = { color: { argb: 'FF047857' }, bold: true };
  });

  const prefix = isSampleOnly ? 'GoLab_Mau_Thiet_Bi_May_Do' : 'GoLab_Danh_Sach_Thiet_Bi_May_Do';
  await saveExcelJsWorkbook(wb, `${prefix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Đọc file Excel Thiết bị / Máy đo
 */
export function parseExcelEquipments(fileOrBuffer: Blob | ArrayBuffer): Promise<TestEquipment[]> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (!e.target?.result) return resolve([]);
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const ws = workbook.Sheets[workbook.SheetNames[0]];
          const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

          const eqs: TestEquipment[] = rawRows.map((row) => {
            const name = getRowValue(row, ['ten_thiet_bi_may_do', 'ten_thiet_bi', 'ten_may', 'ten', 'name']);
            let code = getRowValue(row, ['ma_may_do_tu_dong_tao_k_can_nhap', 'ma_may_code', 'ma_may', 'ma', 'code']);
            if (!code && name) {
              code = name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15);
            }
            const id = 'eq_' + (code ? code.toLowerCase().replace(/[^a-z0-9]/g, '_') : Math.random().toString(36).slice(2, 9));
            return { id, name: name.trim(), code: code.trim() || undefined };
          }).filter((eq) => eq.name.length > 0);

          resolve(eqs);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(fileOrBuffer as Blob);
    } catch (err) {
      reject(err);
    }
  });
}
