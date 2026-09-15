import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import type { Doctor } from '@domain/types';
import { saveExcelJsWorkbook, cleanKey, getRowValue, sanitizePhone } from './excelHelpers';

/**
 * Xuất file Excel template hoặc dữ liệu thực tế cho Bác sĩ (kèm Tự Động Mã Bác Sĩ)
 */
export async function exportDoctorsTemplate(doctors: Doctor[] = [], isSampleOnly: boolean = true): Promise<void> {
  const sampleData = isSampleOnly || doctors.length === 0 ? [
    { stt: 1, name: 'BS. Nguyễn Thị Thành Trung', id: 'doc_trung', specialty: 'Phụ Trách Xét Nghiệm', phone: '032.855.3773' },
    { stt: 2, name: 'BS. Lê Phan Anh', id: 'doc_anh', specialty: 'Bác Sĩ Lâm Sàng', phone: '090.555.8888' }
  ] : doctors.map((d, idx) => ({
    stt: idx + 1,
    name: d.name,
    id: d.id,
    specialty: d.specialty || '',
    phone: d.phone || ''
  }));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GoLab Medical';
  wb.created = new Date();

  const ws = wb.addWorksheet('Danh Sách Bác Sĩ', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  ws.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Họ và Tên Bác Sĩ (*)', key: 'name', width: 32 },
    { header: 'Mã Bác Sĩ [Tự động tạo - K cần nhập]', key: 'id', width: 28 },
    { header: 'Chuyên Khoa / Chức Vụ', key: 'specialty', width: 28 },
    { header: 'Số Điện Thoại', key: 'phone', width: 18 }
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } }; // Teal 600
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  sampleData.forEach((row) => {
    const excelRow = ws.addRow(row);
    const idCell = excelRow.getCell(3);
    idCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    idCell.font = { color: { argb: 'FF047857' }, bold: true };
  });

  const prefix = isSampleOnly ? 'GoLab_Mau_Danh_Sach_Bac_Si' : 'GoLab_Danh_Sach_Bac_Si';
  await saveExcelJsWorkbook(wb, `${prefix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Đọc file Excel Bác sĩ
 */
export function parseExcelDoctors(fileOrBuffer: Blob | ArrayBuffer): Promise<Doctor[]> {
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

          const docs: Doctor[] = rawRows.map((row) => {
            const name = getRowValue(row, ['ho_va_ten_bac_si', 'ho_ten_bac_si', 'ten_bac_si', 'ten', 'name', 'bac_si']);
            let id = getRowValue(row, ['ma_bac_si_tu_dong_tao_k_can_nhap', 'ma_bac_si', 'id', 'code']);
            if (!id && name) {
              id = 'doc_' + cleanKey(name).replace(/[^a-z0-9]/g, '_').slice(0, 15);
            }
            const specialty = getRowValue(row, ['chuyen_khoa', 'specialty', 'chuc_vu']);
            const phone = sanitizePhone(getRowValue(row, ['so_dien_thoai', 'sdt', 'phone']));
            return { id: id || `doc_${Math.random().toString(36).slice(2, 9)}`, name: name.trim(), specialty: specialty.trim() || undefined, phone: phone || undefined };
          }).filter((d) => d.name.length > 0);

          resolve(docs);
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
