import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import type { TestGroup } from '@domain/types';
import { saveExcelJsWorkbook, cleanKey, getRowValue } from './excelHelpers';

/**
 * Xuất file Excel template hoặc dữ liệu thực tế cho Nhóm xét nghiệm (kèm Tự Động Mã Nhóm)
 */
export async function exportTestGroupsTemplate(groups: TestGroup[] = [], isSampleOnly: boolean = true): Promise<void> {
  const sampleData = isSampleOnly || groups.length === 0 ? [
    { stt: 1, id: 'grp_sh', name: 'Sinh Hóa', note: 'Xét nghiệm sinh hóa máu & nước tiểu' },
    { stt: 2, id: 'grp_hh', name: 'Huyết Học', note: 'Tổng phân tích tế bào máu ngoại vi' },
    { stt: 3, id: 'grp_nt', name: 'Nước Tiểu', note: 'Tổng phân tích nước tiểu 10 thông số' },
    { stt: 4, id: 'grp_dn', name: 'Dị Nguyên', note: 'Panel 91 dị nguyên PROTIA Allergy-Q' },
    { stt: 5, id: 'grp_md', name: 'Miễn Dịch', note: 'Hormone, dấu ấn ung thư, tuyến giáp' }
  ] : groups.map((g, idx) => ({
    stt: idx + 1,
    id: g.id,
    name: g.name,
    note: ''
  }));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GoLab Medical';
  wb.created = new Date();

  const ws = wb.addWorksheet('Nhóm Xét Nghiệm', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  ws.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Tên Nhóm Xét Nghiệm (*)', key: 'name', width: 35 },
    { header: 'Mã Nhóm [Tự động tạo - K cần nhập]', key: 'id', width: 28 },
    { header: 'Ghi Chú / Mô Tả', key: 'note', width: 35 }
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } }; // Amber 600
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  sampleData.forEach((row) => {
    const excelRow = ws.addRow({
      stt: row.stt,
      name: row.name,
      id: row.id || `grp_${cleanKey(row.name).slice(0, 10)}`,
      note: row.note || ''
    });

    const idCell = excelRow.getCell(3);
    idCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    idCell.font = { color: { argb: 'FF047857' }, bold: true };
  });

  const prefix = isSampleOnly ? 'GoLab_Mau_Nhom_Xet_Nghiem' : 'GoLab_Danh_Sach_Nhom_Xet_Nghiem';
  await saveExcelJsWorkbook(wb, `${prefix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Đọc file Excel Nhóm xét nghiệm
 */
export function parseExcelTestGroups(fileOrBuffer: Blob | ArrayBuffer): Promise<TestGroup[]> {
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

          const groups: TestGroup[] = rawRows.map((row) => {
            const name = getRowValue(row, ['ten_nhom_xet_nghiem', 'ten_nhom', 'ten', 'name', 'group_name']);
            let id = getRowValue(row, ['ma_nhom_tu_dong_tao_k_can_nhap', 'ma_nhom_id', 'ma_nhom', 'id', 'code']);
            if (!id && name) {
              id = 'grp_' + cleanKey(name).replace(/[^a-z0-9]/g, '_').slice(0, 15);
            }
            return { id: id || `grp_${Math.random().toString(36).slice(2, 9)}`, name: name.trim() };
          }).filter((g) => g.name.length > 0);

          resolve(groups);
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
