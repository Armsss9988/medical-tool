import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import {
  CatalogItem, Invoice, Doctor, BatchImportRow, SelectedTest, Patient, Gender, MedicalReport,
  TestPackage, getPkgCodes, TestGroup, TestEquipment, CatalogItemEquipmentLink, PackageItem,
  AllergenGradingScale
} from '@domain/types';
import { evaluateTestIndicator } from '@domain/testResult';
import { generatePatientCode, generateSecretToken } from '@domain/patient';

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
  URL.revokeObjectURL(url);
}

// ─── SMART HELPER FUNCTIONS ──────────────────────────────────────────────────

/**
 * Chuẩn hóa chuỗi header: loại bỏ dấu, chuyển thường, chỉ giữ ký tự chữ & số
 */
function cleanKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Tìm giá trị từ 1 hàng Excel dựa trên danh sách các tên cột tương đương (aliases)
 */
function getRowValue(row: Record<string, unknown>, aliases: string[]): string {
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
function sanitizePhone(raw: string): string {
  let cleaned = raw.replace(/\D/g, '');
  if (cleaned.length === 9 && ['3', '5', '7', '8', '9'].includes(cleaned[0])) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

/**
 * Chuẩn hóa giới tính: tự động nhận diện Nam / Nữ
 */
function sanitizeGender(raw: string): Gender {
  const val = raw.toLowerCase().trim();
  if (['nam', 'm', 'male', 'boy', '1'].includes(val)) return 'Nam';
  if (['nu', 'nữ', 'f', 'female', 'girl', '0'].includes(val)) return 'Nữ';
  return 'Nam';
}

/**
 * Chuẩn hóa ngày sinh / năm sinh (hỗ trợ cả dạng ngày Excel serial và chuỗi text)
 */
function sanitizeDob(raw: unknown): string {
  if (typeof raw === 'number' && raw > 20000 && raw < 60000) {
    const d = new Date((raw - 25569) * 86400 * 1000);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return String(raw || '').trim();
}

// ─── 1. BẢNG: NHÓM XÉT NGHIỆM (test_groups) ───────────────────────────────────

// ─── 1. BẢNG: NHÓM XÉT NGHIỆM (test_groups) ─────────────────────────────────

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

// ─── 2. BẢNG: THIẾT BỊ & MÁY ĐO (equipments) ─────────────────────────────────

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

// ─── 3. BẢNG: BÁC SĨ & CHUYÊN GIA (doctors) ──────────────────────────────────

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

// ─── 4. BẢNG: CHỈ SỐ XÉT NGHIỆM (catalog_items) ──────────────────────────────

export interface CatalogExportOptions {
  isSampleOnly?: boolean;
  filterCategory?: string;
  scales?: AllergenGradingScale[];
}

/**
 * Xuất file Excel template (hoặc data) cho Chỉ số xét nghiệm (kèm In-Cell Data Validation Dropdowns, Conditional Formatting & Tự Động Trị Số Tham Chiếu)
 */
export async function exportCatalogItemsTemplate(
  groups: TestGroup[] = [],
  items: CatalogItem[] = [],
  options: CatalogExportOptions = {}
): Promise<void> {
  const { isSampleOnly = true, filterCategory = 'all', scales = [] } = options;

  let targetItems: CatalogItem[] = [];

  if (isSampleOnly) {
    if (filterCategory !== 'all') {
      targetItems = [
        { category: filterCategory, code: 'SAMPLE_1', name: `Chỉ số mẫu 1 (${filterCategory})`, scientific: 'Sample Scientific 1', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '3.9 - 6.4', price: 40000, evaluationType: 'range' },
        { category: filterCategory, code: 'SAMPLE_2', name: `Chỉ số mẫu 2 (${filterCategory})`, scientific: 'Sample Scientific 2', refMin: 2.5, refMax: 7.5, unit: 'mmol/L', refText: '2.5 - 7.5', price: 45000, evaluationType: 'range' },
        { category: filterCategory, code: 'SAMPLE_3', name: `Chỉ số mẫu 3 (${filterCategory})`, scientific: 'Sample Scientific 3', refMin: null, refMax: null, unit: 'IU/mL', refText: '< 0.34 (Độ 0)', price: 80000, scaleId: 'scale_protia_91', evaluationType: 'scale' }
      ];
    } else {
      targetItems = [
        { category: 'Sinh Hóa', code: 'GLU', name: 'Glucose máu', scientific: 'Fasting Plasma Glucose', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '3.9 - 6.4', price: 40000, evaluationType: 'range' },
        { category: 'Sinh Hóa', code: 'URE', name: 'Ure máu', scientific: 'Blood Urea', refMin: 2.5, refMax: 7.5, unit: 'mmol/L', refText: '2.5 - 7.5', price: 40000, evaluationType: 'range' },
        { category: 'Huyết Học', code: 'WBC', name: 'Số lượng bạch cầu', scientific: 'White Blood Cell', refMin: 4.0, refMax: 10.0, unit: 'G/L', refText: '4.0 - 10.0', price: 50000, evaluationType: 'range' },
        { category: 'Nước Tiểu', code: 'LEU_U', name: 'Bạch cầu nước tiểu', scientific: 'Leukocytes Urine', refMin: null, refMax: null, unit: 'Leu/µL', refText: 'Âm tính (-)', price: 35000, evaluationType: 'range' },
        { category: 'Dị Nguyên', code: 'd1', name: 'Mạt bụi nhà D.Pteronyssinus', scientific: 'House dust mite', refMin: null, refMax: null, unit: 'IU/mL', refText: '< 0.34 (Độ 0)', scaleId: 'scale_protia_91', evaluationType: 'scale', price: 80000 }
      ];
    }
  } else {
    targetItems = filterCategory !== 'all'
      ? items.filter((it) => it.category.toLowerCase() === filterCategory.toLowerCase())
      : items;
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GoLab Medical';
  wb.created = new Date();

  // Sheet 1: Chỉ Số Xét Nghiệm
  const ws = wb.addWorksheet('Chỉ Số Xét Nghiệm', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // Sheet 2: _DataLookup
  const wsLookup = wb.addWorksheet('_DataLookup');

  const groupNames = groups.length > 0
    ? groups.map(g => g.name)
    : ['Sinh Hóa', 'Huyết Học', 'Nước Tiểu', 'Miễn Dịch', 'Dị Nguyên', 'Vi Sinh', 'Ký Sinh Trùng', 'Đông Máu'];

  const scaleNames = scales.length > 0
    ? scales.map(s => s.name)
    : ['Protia 91 (Độ 0-6)', 'Gói 44 (Độ 0-6)'];

  wsLookup.columns = [
    { header: 'Nhóm Xét Nghiệm Khả Dụng', key: 'group', width: 28 },
    { header: 'Kiểu Đánh Giá Khả Dụng', key: 'eval', width: 25 },
    { header: 'Thang Phân Độ Khả Dụng', key: 'scale', width: 35 }
  ];

  const maxLookupRows = Math.max(groupNames.length, scaleNames.length, 5);
  for (let i = 0; i < maxLookupRows; i++) {
    wsLookup.addRow({
      group: groupNames[i] || '',
      eval: i === 0 ? 'Khoảng số' : (i === 1 ? 'Thang phân độ' : ''),
      scale: scaleNames[i] || ''
    });
  }

  const lookupHeader = wsLookup.getRow(1);
  lookupHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  lookupHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

  ws.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Mã chỉ số (*)', key: 'code', width: 16 },
    { header: 'Tên chỉ số (*)', key: 'name', width: 32 },
    { header: 'Nhóm xét nghiệm (*) [Chọn Dropdown]', key: 'category', width: 32 },
    { header: 'Tên khoa học / Allergen', key: 'scientific', width: 28 },
    { header: 'Đơn vị', key: 'unit', width: 12 },
    { header: 'Kiểu đánh giá (*) [Chọn Dropdown]', key: 'evalType', width: 25 },
    { header: 'Ngưỡng Min (Nếu Khoảng số)', key: 'refMin', width: 16 },
    { header: 'Ngưỡng Max (Nếu Khoảng số)', key: 'refMax', width: 16 },
    { header: 'Thang phân độ [Chọn Dropdown (Nếu Thang phân độ)]', key: 'scaleName', width: 32 },
    { header: 'Trị số tham chiếu [Tự động - K cần nhập]', key: 'refText', width: 30 },
    { header: 'Đơn giá (VNĐ)', key: 'price', width: 16 }
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Dark Teal
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  targetItems.forEach((item, idx) => {
    const r = idx + 2;
    const isScale = !!item.scaleId || item.evaluationType === 'scale';
    const evalType = isScale ? 'Thang phân độ' : 'Khoảng số';
    const scaleName = item.scaleId === 'scale_allergen_44' ? 'Gói 44 (Độ 0-6)' : (item.scaleId === 'scale_protia_91' ? 'Protia 91 (Độ 0-6)' : (isScale ? 'Protia 91 (Độ 0-6)' : ''));

    const row = ws.addRow({
      stt: idx + 1,
      code: item.code,
      name: item.name,
      category: item.category,
      scientific: item.scientific || '',
      unit: item.unit || '',
      evalType,
      refMin: isScale ? '' : (item.refMin !== null && item.refMin !== undefined ? item.refMin : ''),
      refMax: isScale ? '' : (item.refMax !== null && item.refMax !== undefined ? item.refMax : ''),
      scaleName: isScale ? scaleName : '',
      refText: {
        formula: `=IF(G${r}="Thang phân độ",IF(J${r}="Gói 44 (Độ 0-6)","< 0.35 (Độ 0)","< 0.34 (Độ 0)"),IF(AND(H${r}<>"",I${r}<>""),H${r}&" - "&I${r},IF(H${r}<>"","&gt;= "&H${r},IF(I${r}<>"","&lt;= "&I${r},""))))`,
        result: item.refText || (isScale ? '< 0.34 (Độ 0)' : (item.refMin !== null && item.refMax !== null ? `${item.refMin} - ${item.refMax}` : ''))
      },
      price: item.price || 0
    });

    // Style the auto calculated column
    const refCell = row.getCell(11);
    refCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }; // Light emerald
    refCell.font = { color: { argb: 'FF047857' }, bold: true };
  });

  const groupEndRow = groupNames.length + 1;
  for (let r = 2; r <= 500; r++) {
    const row = ws.getRow(r);
    // Dropdown nhóm xét nghiệm
    row.getCell(4).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$A$2:$A$${groupEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Nhóm xét nghiệm không hợp lệ',
      error: 'Vui lòng chọn từ danh sách dropdown'
    };
    // Dropdown Kiểu đánh giá
    row.getCell(7).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_DataLookup!$B$2:$B$3'],
      showErrorMessage: true,
      errorTitle: 'Kiểu đánh giá không hợp lệ',
      error: 'Vui lòng chọn Khoảng số hoặc Thang phân độ'
    };
    // Dropdown Thang phân độ
    row.getCell(10).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_DataLookup!$C$2:$C$3'],
      showErrorMessage: true,
      errorTitle: 'Thang phân độ không hợp lệ',
      error: 'Vui lòng chọn từ danh sách dropdown'
    };

    // Auto formula cho các dòng trống tiếp theo nếu chưa có
    if (r > targetItems.length + 1) {
      const refCell = row.getCell(11);
      refCell.value = {
        formula: `=IF(G${r}="Thang phân độ",IF(J${r}="Gói 44 (Độ 0-6)","< 0.35 (Độ 0)","< 0.34 (Độ 0)"),IF(AND(H${r}<>"",I${r}<>""),H${r}&" - "&I${r},IF(H${r}<>"","&gt;= "&H${r},IF(I${r}<>"","&lt;= "&I${r},""))))`
      };
      refCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      refCell.font = { color: { argb: 'FF047857' }, bold: true };
    }
  }

  // ── Conditional Formatting:
  // 1. Khi Kiểu đánh giá là 'Thang phân độ' -> Vùng Min & Max (H & I) bị mờ/khóa xám
  ws.addConditionalFormatting({
    ref: 'H2:I500',
    rules: [
      {
        type: 'expression',
        priority: 1,
        formulae: ['$G2="Thang phân độ"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF1F5F9' }, fgColor: { argb: 'FFF1F5F9' } },
          font: { color: { argb: 'FF94A3B8' }, italic: true }
        }
      }
    ]
  });

  // 2. Khi Kiểu đánh giá là 'Khoảng số' -> Vùng Thang phân độ (J) bị mờ/khóa xám
  ws.addConditionalFormatting({
    ref: 'J2:J500',
    rules: [
      {
        type: 'expression',
        priority: 2,
        formulae: ['$G2="Khoảng số"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF1F5F9' }, fgColor: { argb: 'FFF1F5F9' } },
          font: { color: { argb: 'FF94A3B8' }, italic: true }
        }
      }
    ]
  });

  const catSuffix = filterCategory !== 'all' ? `_${filterCategory.replace(/[\s/\\:*?"<>|]+/g, '_')}` : '';
  const prefix = isSampleOnly ? 'GoLab_Mau_Chi_So_Xet_Nghiem' : 'GoLab_Danh_Muc_Chi_So';
  await saveExcelJsWorkbook(wb, `${prefix}${catSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export const exportSampleExcelCatalog = exportCatalogItemsTemplate;

/**
 * Đọc file Excel danh mục chỉ số xét nghiệm
 */
export function parseExcelCatalog(fileOrBuffer: Blob | ArrayBuffer): Promise<CatalogItem[]> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (!e.target?.result) return resolve([]);
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

          if (!rawRows || rawRows.length === 0) {
            return resolve([]);
          }

          const catalog: CatalogItem[] = rawRows.map((row) => {
            const category = getRowValue(row, ['nhom_xet_nghiem', 'nhom', 'category', 'chuyen_khoa', 'group']) || 'Xét nghiệm khác';
            const code = getRowValue(row, ['ma_chi_so', 'ma_xet_nghiem', 'ma', 'code', 'symbol', 'ma_code']);
            const name = getRowValue(row, ['ten_chi_so', 'ten_xet_nghiem', 'ten', 'name', 'test_name']) || code;
            const scientific = getRowValue(row, ['ten_khoa_hoc', 'scientific', 'allergen', 'ten_tieng_anh']);
            const unit = getRowValue(row, ['don_vi', 'unit', 'dvt', 'donvi']);

            const evalRaw = getRowValue(row, ['kieu_danh_gia', 'danh_gia', 'evaluation_type', 'loai']).toLowerCase();
            const scaleRaw = getRowValue(row, ['thang_do_phan_do', 'thang_phan_do', 'thang_do', 'scale', 'scale_id']).toLowerCase();

            let scaleId: string | undefined;
            if (scaleRaw.includes('44')) scaleId = 'scale_allergen_44';
            else if (scaleRaw.includes('protia') || scaleRaw.includes('91')) scaleId = 'scale_protia_91';
            else if (evalRaw.includes('scale') || evalRaw.includes('thang')) scaleId = 'scale_protia_91';

            const isScale = !!scaleId;
            const evaluationType: import('@domain/types').EvaluationType = isScale ? 'scale' : 'range';

            const rawMin = getRowValue(row, ['min', 'ref_min', 'nguong_min', 'tu']);
            const refMin = !isScale && rawMin !== '' && !isNaN(parseFloat(rawMin)) ? parseFloat(rawMin) : null;

            const rawMax = getRowValue(row, ['max', 'ref_max', 'nguong_max', 'den']);
            const refMax = !isScale && rawMax !== '' && !isNaN(parseFloat(rawMax)) ? parseFloat(rawMax) : null;

            const rawRefText = getRowValue(row, ['tri_so_tham_chieu', 'tham_chieu', 'khoang_tham_chieu', 'ref_text', 'binh_thuong']);
            let refText = rawRefText;
            if (!refText) {
              if (isScale) {
                refText = scaleId === 'scale_allergen_44' ? '< 0.35 (Độ 0)' : '< 0.34 (Độ 0)';
              } else if (refMin !== null && refMax !== null) {
                refText = `${refMin} - ${refMax}`;
              } else if (refMin !== null) {
                refText = `>= ${refMin}`;
              } else if (refMax !== null) {
                refText = `<= ${refMax}`;
              }
            }

            const rawPrice = getRowValue(row, ['don_gia_vnd', 'don_gia', 'gia_tien', 'gia_thu', 'price', 'gia']);
            const price = parseFloat(rawPrice.replace(/[^\d.]/g, '')) || 0;

            return {
              category: category.trim(),
              code: code.trim().toUpperCase() || name.trim().toUpperCase(),
              name: name.trim(),
              scientific: scientific.trim() || undefined,
              unit: unit.trim(),
              refMin,
              refMax,
              refText: refText.trim(),
              price,
              scaleId,
              evaluationType
            };
          }).filter((item) => item.code.length > 0 && item.name.length > 0);

          resolve(catalog);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      if (fileOrBuffer instanceof Blob) {
        reader.readAsArrayBuffer(fileOrBuffer);
      } else {
        const blob = new Blob([fileOrBuffer]);
        reader.readAsArrayBuffer(blob);
      }
    } catch (err) {
      reject(err);
    }
  });
}

// ─── 5. BẢNG: CẤU HÌNH THIẾT BỊ & NGƯỠNG ĐO (catalog_item_equipments) ──────────

export interface EquipmentLinkExportOptions {
  isSampleOnly?: boolean;
  filterEquipmentId?: string;
  scales?: AllergenGradingScale[];
}

/**
 * Xuất file Excel template (hoặc data) cho Bảng cấu hình thiết bị (kèm In-Cell Data Validation Dropdowns, Conditional Formatting & Tự Động Text Tham Chiếu)
 */
export async function exportCatalogItemEquipmentsTemplate(
  items: CatalogItem[],
  equipments: TestEquipment[],
  links: CatalogItemEquipmentLink[] = [],
  options: EquipmentLinkExportOptions = {}
): Promise<void> {
  const { isSampleOnly = true, filterEquipmentId = 'all', scales = [] } = options;

  let targetRows: {
    catalogCode: string;
    equipmentName: string;
    evaluationType: 'range' | 'scale';
    refMin: number | null;
    refMax: number | null;
    unit: string;
    refText: string;
    scaleId: string | null;
    isDefault: boolean;
  }[] = [];

  const targetEq = filterEquipmentId !== 'all' ? equipments.find(e => e.id === filterEquipmentId) : null;

  if (isSampleOnly) {
    if (targetEq) {
      targetRows = [
        { catalogCode: 'GLU', equipmentName: targetEq.name, evaluationType: 'range', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '3.9 - 6.4', scaleId: null, isDefault: true },
        { catalogCode: 'URE', equipmentName: targetEq.name, evaluationType: 'range', refMin: 2.5, refMax: 7.5, unit: 'mmol/L', refText: '2.5 - 7.5', scaleId: null, isDefault: true },
        { catalogCode: 'CRE', equipmentName: targetEq.name, evaluationType: 'range', refMin: 53, refMax: 106, unit: 'µmol/L', refText: '53 - 106', scaleId: null, isDefault: true }
      ];
    } else {
      targetRows = [
        { catalogCode: 'GLU', equipmentName: 'Máy Sinh Hóa Tự Động MS-360', evaluationType: 'range', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '3.9 - 6.4', scaleId: null, isDefault: true },
        { catalogCode: 'URE', equipmentName: 'Máy Sinh Hóa Tự Động MS-360', evaluationType: 'range', refMin: 2.5, refMax: 7.5, unit: 'mmol/L', refText: '2.5 - 7.5', scaleId: null, isDefault: true },
        { catalogCode: 'WBC', equipmentName: 'Máy Phân Tích Huyết Học MS-H630', evaluationType: 'range', refMin: 4.0, refMax: 10.0, unit: 'G/L', refText: '4.0 - 10.0', scaleId: null, isDefault: true },
        { catalogCode: 'd1', equipmentName: 'PROTIA Allergy-Q Smart Q-processor', evaluationType: 'scale', refMin: null, refMax: null, unit: 'IU/mL', refText: '< 0.34 (Độ 0)', scaleId: 'scale_protia_91', isDefault: true }
      ];
    }
  } else {
    const filteredLinks = filterEquipmentId !== 'all'
      ? links.filter(l => l.equipmentId === filterEquipmentId)
      : links;

    targetRows = filteredLinks.map((l) => {
      const eq = equipments.find(e => e.id === l.equipmentId);
      const isScale = !!l.scaleId;
      return {
        catalogCode: l.catalogCode,
        equipmentName: eq ? eq.name : l.equipmentId,
        evaluationType: isScale ? 'scale' : 'range',
        refMin: isScale ? null : (l.refMin ?? null),
        refMax: isScale ? null : (l.refMax ?? null),
        unit: l.unit || '',
        refText: l.refText || '',
        scaleId: l.scaleId || null,
        isDefault: !!l.isDefault
      };
    });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GoLab Medical';
  wb.created = new Date();

  const ws = wb.addWorksheet('Cấu Hình Ngưỡng & Máy Đo', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  const wsLookup = wb.addWorksheet('_DataLookup');

  const itemCodes = items.length > 0 ? items.map(i => i.code) : ['GLU', 'URE', 'CRE', 'AST', 'ALT', 'WBC', 'RBC', 'HGB', 'd1'];
  const eqNames = equipments.length > 0 ? equipments.map(e => e.name) : ['Máy Sinh Hóa Tự Động MS-360', 'Máy Phân Tích Huyết Học MS-H630', 'PROTIA Allergy-Q Smart Q-processor'];
  const scaleNames = scales.length > 0 ? scales.map(s => s.name) : ['Protia 91 (Độ 0-6)', 'Gói 44 (Độ 0-6)'];

  wsLookup.columns = [
    { header: 'Mã Chỉ Số Khả Dụng', key: 'code', width: 22 },
    { header: 'Thiết Bị / Máy Đo Khả Dụng', key: 'eq', width: 38 },
    { header: 'Kiểu Đánh Giá Khả Dụng', key: 'eval', width: 22 },
    { header: 'Thang Phân Độ Khả Dụng', key: 'scale', width: 25 },
    { header: 'Đặt Làm Mặc Định', key: 'def', width: 18 }
  ];

  const maxLookupRows = Math.max(itemCodes.length, eqNames.length, scaleNames.length, 5);
  for (let i = 0; i < maxLookupRows; i++) {
    wsLookup.addRow({
      code: itemCodes[i] || '',
      eq: eqNames[i] || '',
      eval: i === 0 ? 'Khoảng số' : (i === 1 ? 'Thang phân độ' : ''),
      scale: scaleNames[i] || '',
      def: i === 0 ? 'Có' : (i === 1 ? 'Không' : '')
    });
  }

  const lookupHeader = wsLookup.getRow(1);
  lookupHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  lookupHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

  ws.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Mã chỉ số (*) [Chọn Dropdown]', key: 'code', width: 25 },
    { header: 'Tên máy đo (*) [Chọn Dropdown]', key: 'eq', width: 38 },
    { header: 'Đơn vị', key: 'unit', width: 12 },
    { header: 'Kiểu đánh giá (*) [Chọn Dropdown]', key: 'evalType', width: 25 },
    { header: 'Ngưỡng Min (Nếu Khoảng số)', key: 'min', width: 16 },
    { header: 'Ngưỡng Max (Nếu Khoảng số)', key: 'max', width: 16 },
    { header: 'Thang đo phân độ [Chọn Dropdown (Nếu Thang phân độ)]', key: 'scale', width: 32 },
    { header: 'Text tham chiếu [Tự động - K cần nhập]', key: 'refText', width: 30 },
    { header: 'Đặt làm mặc định [Chọn Dropdown]', key: 'def', width: 22 }
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } }; // Indigo 700
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  targetRows.forEach((row, idx) => {
    const r = idx + 2;
    const isScale = row.evaluationType === 'scale';
    const evalType = isScale ? 'Thang phân độ' : 'Khoảng số';
    const scaleName = row.scaleId === 'scale_allergen_44' ? 'Gói 44 (Độ 0-6)' : (row.scaleId === 'scale_protia_91' ? 'Protia 91 (Độ 0-6)' : (isScale ? 'Protia 91 (Độ 0-6)' : ''));

    const excelRow = ws.addRow({
      stt: idx + 1,
      code: row.catalogCode,
      eq: row.equipmentName,
      unit: row.unit,
      evalType,
      min: isScale ? '' : (row.refMin !== null ? row.refMin : ''),
      max: isScale ? '' : (row.refMax !== null ? row.refMax : ''),
      scale: isScale ? scaleName : '',
      refText: {
        formula: `=IF(E${r}="Thang phân độ",IF(H${r}="Gói 44 (Độ 0-6)","< 0.35 (Độ 0)","< 0.34 (Độ 0)"),IF(AND(F${r}<>"",G${r}<>""),F${r}&" - "&G${r},IF(F${r}<>"","&gt;= "&F${r},IF(G${r}<>"","&lt;= "&G${r},""))))`,
        result: row.refText || (isScale ? '< 0.34 (Độ 0)' : (row.refMin !== null && row.refMax !== null ? `${row.refMin} - ${row.refMax}` : ''))
      },
      def: row.isDefault ? 'Có' : 'Không'
    });

    const refCell = excelRow.getCell(9);
    refCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    refCell.font = { color: { argb: 'FF047857' }, bold: true };
  });

  const itemEndRow = itemCodes.length + 1;
  const eqEndRow = eqNames.length + 1;

  for (let r = 2; r <= 500; r++) {
    const row = ws.getRow(r);
    // Mã chỉ số
    row.getCell(2).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$A$2:$A$${itemEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Mã chỉ số không hợp lệ',
      error: 'Vui lòng chọn mã chỉ số từ danh sách dropdown'
    };
    // Tên máy đo
    row.getCell(3).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$B$2:$B$${eqEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Tên máy đo không hợp lệ',
      error: 'Vui lòng chọn máy đo từ danh sách dropdown'
    };
    // Kiểu đánh giá
    row.getCell(5).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_DataLookup!$C$2:$C$3'],
      showErrorMessage: true,
      errorTitle: 'Kiểu đánh giá không hợp lệ',
      error: 'Vui lòng chọn Khoảng số hoặc Thang phân độ'
    };
    // Thang đo phân độ
    row.getCell(8).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_DataLookup!$D$2:$D$3'],
      showErrorMessage: true,
      errorTitle: 'Thang đo không hợp lệ',
      error: 'Vui lòng chọn thang đo từ dropdown'
    };
    // Đặt làm mặc định
    row.getCell(10).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_DataLookup!$E$2:$E$3'],
      showErrorMessage: true,
      errorTitle: 'Lựa chọn không hợp lệ',
      error: 'Vui lòng chọn Có hoặc Không'
    };

    if (r > targetRows.length + 1) {
      const refCell = row.getCell(9);
      refCell.value = {
        formula: `=IF(E${r}="Thang phân độ",IF(H${r}="Gói 44 (Độ 0-6)","< 0.35 (Độ 0)","< 0.34 (Độ 0)"),IF(AND(F${r}<>"",G${r}<>""),F${r}&" - "&G${r},IF(F${r}<>"","&gt;= "&F${r},IF(G${r}<>"","&lt;= "&G${r},""))))`
      };
      refCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      refCell.font = { color: { argb: 'FF047857' }, bold: true };
    }
  }

  // ── Conditional Formatting:
  // 1. Khi Kiểu đánh giá là 'Thang phân độ' -> Vùng Min & Max (F & G) mờ xám
  ws.addConditionalFormatting({
    ref: 'F2:G500',
    rules: [
      {
        type: 'expression',
        priority: 1,
        formulae: ['$E2="Thang phân độ"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF1F5F9' }, fgColor: { argb: 'FFF1F5F9' } },
          font: { color: { argb: 'FF94A3B8' }, italic: true }
        }
      }
    ]
  });

  // 2. Khi Kiểu đánh giá là 'Khoảng số' -> Vùng Thang phân độ (H) mờ xám
  ws.addConditionalFormatting({
    ref: 'H2:H500',
    rules: [
      {
        type: 'expression',
        priority: 2,
        formulae: ['$E2="Khoảng số"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF1F5F9' }, fgColor: { argb: 'FFF1F5F9' } },
          font: { color: { argb: 'FF94A3B8' }, italic: true }
        }
      }
    ]
  });

  const eqSuffix = targetEq ? `_${targetEq.name.replace(/[\s/\\:*?"<>|]+/g, '_')}` : '';
  const prefix = isSampleOnly ? 'GoLab_Mau_Cau_Hinh_May_Do' : 'GoLab_Danh_Sach_Cau_Hinh_May_Do';
  await saveExcelJsWorkbook(wb, `${prefix}${eqSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Đọc file Excel Cấu hình máy đo & ngưỡng đo
 */
export function parseExcelCatalogItemEquipments(
  fileOrBuffer: Blob | ArrayBuffer,
  _items: CatalogItem[],
  equipments: TestEquipment[]
): Promise<CatalogItemEquipmentLink[]> {
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

          const links: CatalogItemEquipmentLink[] = [];

          for (const row of rawRows) {
            let rawCode = getRowValue(row, ['ma_chi_so', 'ma_xet_nghiem', 'ma', 'code', 'catalog_code']);
            if (rawCode.includes('-')) rawCode = rawCode.split('-')[0].trim();
            const cleanCode = rawCode.toUpperCase().trim();
            if (!cleanCode) continue;

            const eqRawName = getRowValue(row, ['ten_may_do', 'ten_thiet_bi', 'may_do', 'equipment', 'equipment_name']);
            if (!eqRawName) continue;

            let matchedEq = equipments.find(e => e.name.toLowerCase() === eqRawName.toLowerCase() || (e.code && e.code.toLowerCase() === eqRawName.toLowerCase()));
            const eqId = matchedEq ? matchedEq.id : 'eq_' + eqRawName.toLowerCase().replace(/[^a-z0-9]/g, '_');

            const evalRaw = getRowValue(row, ['kieu_danh_gia', 'danh_gia', 'evaluation_type', 'loai']).toLowerCase();
            const rawScale = getRowValue(row, ['thang_do_phan_do', 'thang_phan_do', 'thang_do', 'scale', 'scale_id']).toLowerCase();
            let scaleId: string | undefined;
            if (rawScale.includes('44')) scaleId = 'scale_allergen_44';
            else if (rawScale.includes('protia') || rawScale.includes('91')) scaleId = 'scale_protia_91';
            else if (evalRaw.includes('scale') || evalRaw.includes('thang')) scaleId = 'scale_protia_91';

            const isScale = !!scaleId;

            const rawMin = getRowValue(row, ['nguong_min', 'min', 'ref_min']);
            const refMin = !isScale && rawMin !== '' && !isNaN(parseFloat(rawMin)) ? parseFloat(rawMin) : null;

            const rawMax = getRowValue(row, ['nguong_max', 'max', 'ref_max']);
            const refMax = !isScale && rawMax !== '' && !isNaN(parseFloat(rawMax)) ? parseFloat(rawMax) : null;

            const unit = getRowValue(row, ['don_vi', 'unit', 'dvt']);
            const rawRefText = getRowValue(row, ['text_tham_chieu', 'tri_so_tham_chieu', 'tham_chieu', 'ref_text']);
            let refText = rawRefText;
            if (!refText) {
              if (isScale) {
                refText = scaleId === 'scale_allergen_44' ? '< 0.35 (Độ 0)' : '< 0.34 (Độ 0)';
              } else if (refMin !== null && refMax !== null) {
                refText = `${refMin} - ${refMax}`;
              } else if (refMin !== null) {
                refText = `>= ${refMin}`;
              } else if (refMax !== null) {
                refText = `<= ${refMax}`;
              }
            }

            const rawDefault = getRowValue(row, ['dat_lam_mac_dinh', 'mac_dinh', 'is_default']).toLowerCase();
            const isDefault = ['co', 'có', 'yes', 'true', '1', 'x'].includes(rawDefault);

            links.push({
              id: `cie_${cleanCode.toLowerCase()}_${eqId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              catalogCode: cleanCode,
              equipmentId: eqId,
              refMin,
              refMax,
              unit: unit || undefined,
              refText: refText || undefined,
              scaleId: scaleId || undefined,
              isDefault
            });
          }

          resolve(links);
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

// ─── 6. BẢNG: GÓI XÉT NGHIỆM (test_packages) ─────────────────────────────────

export interface PackageExportOptions {
  isSampleOnly?: boolean;
  filterPackageId?: string;
}

/**
 * Xuất file Excel template (hoặc data) cho Gói xét nghiệm (kèm In-Cell Data Validation Dropdowns & Tự Động Tra Cứu Tên Chỉ Số)
 */
export async function exportTestPackagesTemplate(
  items: CatalogItem[],
  equipments: TestEquipment[],
  packages: TestPackage[] = [],
  options: PackageExportOptions = {}
): Promise<void> {
  const { isSampleOnly = true, filterPackageId = 'all' } = options;

  let targetPackageRows: {
    packageName: string;
    defaultEquipmentName: string;
    itemCode: string;
    itemName: string;
    equipmentName: string;
    price: number;
  }[] = [];

  const targetPkg = filterPackageId !== 'all' ? packages.find(p => p.id === filterPackageId) : null;

  if (isSampleOnly) {
    if (targetPkg) {
      const defEq = equipments.find(e => e.id === targetPkg.defaultEquipmentId);
      const pkgItems = targetPkg.items && targetPkg.items.length > 0 ? targetPkg.items : (targetPkg.codes || []).map(c => ({ code: c, equipmentId: null }));
      targetPackageRows = pkgItems.map((pi) => {
        const eq = equipments.find(e => e.id === pi.equipmentId);
        const it = items.find(i => i.code.toLowerCase() === pi.code.toLowerCase());
        return {
          packageName: targetPkg.name,
          defaultEquipmentName: defEq ? defEq.name : '',
          itemCode: pi.code,
          itemName: it ? it.name : pi.code,
          equipmentName: eq ? eq.name : '',
          price: targetPkg.price || 0
        };
      });
    } else {
      targetPackageRows = [
        { packageName: 'Gói Khám Sức Khỏe Tổng Quát Cơ Bản', defaultEquipmentName: 'Máy Sinh Hóa Tự Động MS-360', itemCode: 'GLU', itemName: 'Glucose máu', equipmentName: 'Máy Sinh Hóa Tự Động MS-360', price: 450000 },
        { packageName: 'Gói Khám Sức Khỏe Tổng Quát Cơ Bản', defaultEquipmentName: 'Máy Sinh Hóa Tự Động MS-360', itemCode: 'URE', itemName: 'Ure máu', equipmentName: 'Máy Sinh Hóa Tự Động MS-360', price: 450000 },
        { packageName: 'Gói Khám Sức Khỏe Tổng Quát Cơ Bản', defaultEquipmentName: 'Máy Sinh Hóa Tự Động MS-360', itemCode: 'WBC', itemName: 'Số lượng bạch cầu', equipmentName: 'Máy Phân Tích Huyết Học MS-H630', price: 450000 },
        { packageName: 'Gói Khám Sức Khỏe Tổng Quát Cơ Bản', defaultEquipmentName: 'Máy Sinh Hóa Tự Động MS-360', itemCode: 'LEU_U', itemName: 'Bạch cầu nước tiểu', equipmentName: '', price: 450000 },
        { packageName: 'Panel 91 Dị Nguyên PROTIA Chuyên Sâu', defaultEquipmentName: 'PROTIA Allergy-Q Smart Q-processor', itemCode: 'DN91', itemName: 'Panel 91 Dị Nguyên', equipmentName: 'PROTIA Allergy-Q Smart Q-processor', price: 1900000 }
      ];
    }
  } else {
    const filteredPackages = filterPackageId !== 'all'
      ? packages.filter(p => p.id === filterPackageId)
      : packages;

    targetPackageRows = filteredPackages.flatMap((pkg) => {
      const defEq = equipments.find(e => e.id === pkg.defaultEquipmentId);
      const pkgItems = pkg.items && pkg.items.length > 0 ? pkg.items : (pkg.codes || []).map(c => ({ code: c, equipmentId: null }));
      return pkgItems.map((pi) => {
        const eq = equipments.find(e => e.id === pi.equipmentId);
        const it = items.find(i => i.code.toLowerCase() === pi.code.toLowerCase());
        return {
          packageName: pkg.name,
          defaultEquipmentName: defEq ? defEq.name : '',
          itemCode: pi.code,
          itemName: it ? it.name : pi.code,
          equipmentName: eq ? eq.name : '',
          price: pkg.price || 0
        };
      });
    });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GoLab Medical';
  wb.created = new Date();

  const ws = wb.addWorksheet('Gói Xét Nghiệm', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  const wsLookup = wb.addWorksheet('_DataLookup');

  const itemCodes = items.length > 0
    ? items.map(i => ({ code: i.code, name: i.name }))
    : [
        { code: 'GLU', name: 'Glucose máu' },
        { code: 'URE', name: 'Ure máu' },
        { code: 'CRE', name: 'Creatinine' },
        { code: 'AST', name: 'AST (GOT)' },
        { code: 'ALT', name: 'ALT (GPT)' },
        { code: 'WBC', name: 'Số lượng bạch cầu' },
        { code: 'RBC', name: 'Số lượng hồng cầu' },
        { code: 'HGB', name: 'Hemoglobin' },
        { code: 'LEU_U', name: 'Bạch cầu nước tiểu' },
        { code: 'DN91', name: 'Panel 91 Dị Nguyên PROTIA' }
      ];

  const eqNames = equipments.length > 0
    ? equipments.map(e => e.name)
    : ['Máy Sinh Hóa Tự Động MS-360', 'Máy Phân Tích Huyết Học MS-H630', 'PROTIA Allergy-Q Smart Q-processor', 'Roche cobas e 801'];

  wsLookup.columns = [
    { header: 'Mã Chỉ Số Khả Dụng', key: 'code', width: 22 },
    { header: 'Tên Chỉ Số Xét Nghiệm', key: 'name', width: 35 },
    { header: 'Thiết Bị / Máy Đo Khả Dụng', key: 'eq', width: 38 }
  ];

  const maxLookupRows = Math.max(itemCodes.length, eqNames.length, 5);
  for (let i = 0; i < maxLookupRows; i++) {
    wsLookup.addRow({
      code: itemCodes[i]?.code || '',
      name: itemCodes[i]?.name || '',
      eq: eqNames[i] || ''
    });
  }

  const lookupHeader = wsLookup.getRow(1);
  lookupHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  lookupHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

  ws.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Tên Gói Xét Nghiệm (*)', key: 'name', width: 38 },
    { header: 'Máy Đo Chính Của Gói (Tùy chọn) [Chọn Dropdown]', key: 'defaultEq', width: 38 },
    { header: 'Mã Chỉ Số Thành Phần (*) [Chọn Dropdown]', key: 'code', width: 32 },
    { header: 'Tên Chỉ Số [Tự động tra cứu - K cần nhập]', key: 'itemName', width: 35 },
    { header: 'Tên Máy Đo Áp Dụng (Tùy chọn) [Chọn Dropdown]', key: 'eq', width: 38 },
    { header: 'Đơn Giá Gói (VNĐ)', key: 'price', width: 18 }
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7E22CE' } }; // Purple 700
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  const itemEndRow = itemCodes.length + 1;
  const eqEndRow = eqNames.length + 1;

  targetPackageRows.forEach((row, idx) => {
    const r = idx + 2;
    const excelRow = ws.addRow({
      stt: idx + 1,
      name: row.packageName,
      defaultEq: row.defaultEquipmentName,
      code: row.itemCode,
      itemName: {
        formula: `=IFERROR(VLOOKUP(D${r},_DataLookup!$A$2:$B$${itemEndRow},2,FALSE),"")`,
        result: row.itemName || ''
      },
      eq: row.equipmentName,
      price: row.price
    });

    const nameCell = excelRow.getCell(5);
    nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    nameCell.font = { color: { argb: 'FF047857' }, bold: true };
  });

  for (let r = 2; r <= 500; r++) {
    const row = ws.getRow(r);
    // Máy đo chính của gói (Cột C)
    row.getCell(3).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$C$2:$C$${eqEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Máy đo chính không hợp lệ',
      error: 'Vui lòng chọn máy đo từ danh sách dropdown'
    };
    // Mã chỉ số (Cột D)
    row.getCell(4).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$A$2:$A$${itemEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Mã chỉ số không hợp lệ',
      error: 'Vui lòng chọn mã chỉ số từ danh sách dropdown'
    };
    // Tên máy đo áp dụng cho chỉ số (Cột F)
    row.getCell(6).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$C$2:$C$${eqEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Tên máy đo không hợp lệ',
      error: 'Vui lòng chọn máy đo từ danh sách dropdown'
    };

    if (r > targetPackageRows.length + 1) {
      const nameCell = row.getCell(5);
      nameCell.value = {
        formula: `=IFERROR(VLOOKUP(D${r},_DataLookup!$A$2:$B$${itemEndRow},2,FALSE),"")`
      };
      nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      nameCell.font = { color: { argb: 'FF047857' }, bold: true };
    }
  }

  const pkgSuffix = targetPkg ? `_${targetPkg.name.replace(/[\s/\\:*?"<>|]+/g, '_')}` : '';
  const prefix = isSampleOnly ? 'GoLab_Mau_Goi_Xet_Nghiem' : 'GoLab_Danh_Sach_Goi_Xet_Nghiem';
  await saveExcelJsWorkbook(wb, `${prefix}${pkgSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Đọc file Excel Gói xét nghiệm (nhóm các hàng có cùng tên gói lại thành 1 gói)
 */
export function parseExcelTestPackages(
  fileOrBuffer: Blob | ArrayBuffer,
  _items: CatalogItem[],
  equipments: TestEquipment[]
): Promise<TestPackage[]> {
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

          const packageMap = new Map<string, { id: string; name: string; defaultEquipmentId?: string | null; items: PackageItem[]; price: number }>();

          for (const row of rawRows) {
            const pkgName = getRowValue(row, ['ten_goi_xet_nghiem', 'ten_goi', 'ten', 'package_name', 'name']).trim();
            if (!pkgName) continue;

            let rawCode = getRowValue(row, ['ma_chi_so_thanh_phan', 'ma_chi_so', 'ma_xet_nghiem', 'code', 'item_code']);
            if (rawCode.includes('-')) rawCode = rawCode.split('-')[0].trim();
            const cleanCode = rawCode.toUpperCase().trim();
            if (!cleanCode) continue;

            const defEqRawName = getRowValue(row, ['may_do_chinh_cua_goi', 'may_do_chinh', 'default_equipment', 'primary_equipment']).trim();
            let defEqId: string | null = null;
            if (defEqRawName) {
              const matchedDefEq = equipments.find(e => e.name.toLowerCase() === defEqRawName.toLowerCase() || (e.code && e.code.toLowerCase() === defEqRawName.toLowerCase()));
              defEqId = matchedDefEq ? matchedDefEq.id : 'eq_' + defEqRawName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            }

            const eqRawName = getRowValue(row, ['ten_may_do_ap_dung', 'ten_may_do', 'may_do', 'equipment', 'equipment_name']).trim();
            let eqId: string | null = null;
            if (eqRawName) {
              const matchedEq = equipments.find(e => e.name.toLowerCase() === eqRawName.toLowerCase() || (e.code && e.code.toLowerCase() === eqRawName.toLowerCase()));
              eqId = matchedEq ? matchedEq.id : 'eq_' + eqRawName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            }

            const rawPrice = getRowValue(row, ['don_gia_goi_vnd', 'don_gia_goi', 'gia_goi', 'don_gia', 'price']);
            const price = parseFloat(rawPrice.replace(/[^\d.]/g, '')) || 0;

            const pkgKey = pkgName.toLowerCase();
            if (!packageMap.has(pkgKey)) {
              const pkgId = 'pkg_' + pkgName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) + '_' + Math.random().toString(36).slice(2, 6);
              packageMap.set(pkgKey, {
                id: pkgId,
                name: pkgName,
                defaultEquipmentId: defEqId,
                items: [],
                price
              });
            }

            const existing = packageMap.get(pkgKey)!;
            if (defEqId && !existing.defaultEquipmentId) {
              existing.defaultEquipmentId = defEqId;
            }
            if (!existing.items.some(i => i.code === cleanCode)) {
              existing.items.push({ code: cleanCode, equipmentId: eqId || existing.defaultEquipmentId || null });
            }
            if (price > 0 && existing.price === 0) {
              existing.price = price;
            }
          }

          resolve(Array.from(packageMap.values()));
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


// ─── 2. BATCH PATIENTS & RESULTS EXCEL IMPORT / EXPORT ───────────────────────

/**
 * Xuất file Excel template mẫu cho Bệnh Nhân & Kết Quả Hàng Loạt (Hỗ trợ cả mẫu chung và mẫu theo từng gói xét nghiệm, kèm In-Cell Dropdowns)
 */
export async function exportBatchTemplateExcel(
  catalog: CatalogItem[],
  selectedPackage?: TestPackage | null,
  doctors: Doctor[] = []
): Promise<void> {
  let targetItems: CatalogItem[] = [];
  if (selectedPackage && selectedPackage.items && selectedPackage.items.length > 0) {
    const pkgCodes = getPkgCodes(selectedPackage);
    targetItems = pkgCodes.map((code) => {
      const found = catalog.find((c) => c.code.toLowerCase() === code.toLowerCase());
      return (
        found ||
        ({
          code,
          name: code,
          category: 'Gói ' + selectedPackage.name,
          unit: '',
          refMin: null,
          refMax: null,
          refText: ''
        } as CatalogItem)
      );
    });
  } else if (catalog.length > 0) {
    targetItems = catalog.slice(0, 35);
  } else {
    targetItems = [
      { code: 'GLU', name: 'Glucose máu', category: 'Sinh Hóa', unit: 'mmol/L', refText: '3.9 - 6.4' } as CatalogItem,
      { code: 'URE', name: 'Ure máu', category: 'Sinh Hóa', unit: 'mmol/L', refText: '2.5 - 7.5' } as CatalogItem,
      { code: 'CRE', name: 'Creatinine', category: 'Sinh Hóa', unit: 'µmol/L', refText: '53 - 106' } as CatalogItem,
      { code: 'AST', name: 'AST (GOT)', category: 'Sinh Hóa', unit: 'U/L', refText: '< 37' } as CatalogItem,
      { code: 'ALT', name: 'ALT (GPT)', category: 'Sinh Hóa', unit: 'U/L', refText: '< 41' } as CatalogItem,
      { code: 'WBC', name: 'Bạch cầu (WBC)', category: 'Huyết Học', unit: 'G/L', refText: '4.0 - 10.0' } as CatalogItem,
      { code: 'RBC', name: 'Hồng cầu (RBC)', category: 'Huyết Học', unit: 'T/L', refText: '3.8 - 5.3' } as CatalogItem,
      { code: 'HGB', name: 'Hemoglobin', category: 'Huyết Học', unit: 'g/L', refText: '120 - 165' } as CatalogItem
    ];
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GoLab Medical';
  wb.created = new Date();

  const sheetTitle = selectedPackage
    ? `Khám Đoàn - ${selectedPackage.name}`.slice(0, 31)
    : 'Danh Sách Khám Đoàn';

  const ws = wb.addWorksheet(sheetTitle, {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  const wsLookup = wb.addWorksheet('_DataLookup');

  const doctorNames = doctors.length > 0
    ? doctors.map(d => d.name)
    : ['BS. Nguyễn Thị Thành Trung', 'BS. Lê Phan Anh'];

  wsLookup.columns = [
    { header: 'Giới Tính Khả Dụng', key: 'gender', width: 20 },
    { header: 'Danh Sách Bác Sĩ Chỉ Định', key: 'doctor', width: 32 },
    { header: 'Chỉ Số Thành Phần Áp Dụng', key: 'item', width: 35 }
  ];

  const maxLookupRows = Math.max(targetItems.length, doctorNames.length, 5);
  for (let i = 0; i < maxLookupRows; i++) {
    wsLookup.addRow({
      gender: i === 0 ? 'Nam' : (i === 1 ? 'Nữ' : ''),
      doctor: doctorNames[i] || '',
      item: targetItems[i] ? `${targetItems[i].name} [${targetItems[i].code}]` : ''
    });
  }

  const lookupHeader = wsLookup.getRow(1);
  lookupHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  lookupHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

  // Base Columns
  const baseColumns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Mã BN (*)', key: 'code', width: 16 },
    { header: 'Họ và Tên (*)', key: 'name', width: 26 },
    { header: 'Năm Sinh (*)', key: 'dob', width: 14 },
    { header: 'Giới Tính (*) [Chọn Dropdown]', key: 'gender', width: 18 },
    { header: 'Số Điện Thoại', key: 'phone', width: 16 },
    { header: 'Địa Chỉ / Công Ty', key: 'address', width: 32 },
    { header: 'BS Chỉ Định [Chọn Dropdown]', key: 'doctor', width: 28 },
    { header: 'Chẩn Đoán', key: 'diagnosis', width: 28 },
    { header: 'Kết Luận [Tùy chọn - K cần nhập]', key: 'conclusion', width: 38 }
  ];

  targetItems.forEach((item) => {
    baseColumns.push({
      header: `${item.name} [${item.code}]`,
      key: `test_${item.code}`,
      width: 22
    });
  });

  ws.columns = baseColumns;

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // Sky 600
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  // Sample data rows
  const sampleData: Record<string, unknown>[] = [
    {
      stt: 1,
      code: 'XN-2026-001',
      name: 'NGUYỄN VĂN A',
      dob: '1990',
      gender: 'Nam',
      phone: '0987654321',
      address: 'Công Ty Cổ Phần GoLab - Đồng Hới',
      doctor: doctorNames[0] || 'BS. Nguyễn Thị Thành Trung',
      diagnosis: selectedPackage ? `Khám theo gói: ${selectedPackage.name}` : 'Khám sức khỏe định kỳ',
      conclusion: 'Các chỉ số xét nghiệm trong giới hạn bình thường'
    },
    {
      stt: 2,
      code: 'XN-2026-002',
      name: 'TRẦN THỊ B',
      dob: '1985',
      gender: 'Nữ',
      phone: '0912345678',
      address: 'Công Ty Cổ Phần GoLab - Đồng Hới',
      doctor: doctorNames[0] || 'BS. Nguyễn Thị Thành Trung',
      diagnosis: selectedPackage ? `Khám theo gói: ${selectedPackage.name}` : 'Theo dõi đường huyết',
      conclusion: 'Chỉ số trong giới hạn tốt, tái khám định kỳ sau 6 tháng'
    },
    {
      stt: 3,
      code: 'XN-2026-003',
      name: 'LÊ PHAN C',
      dob: '1998',
      gender: 'Nam',
      phone: '0905111222',
      address: 'UBND Phường Đồng Hới, Quảng Trị',
      doctor: doctorNames[1] || 'BS. Lê Phan Anh',
      diagnosis: selectedPackage ? `Khám theo gói: ${selectedPackage.name}` : 'Khám sức khỏe tuyển dụng',
      conclusion: 'Đủ điều kiện sức khỏe công tác'
    }
  ];

  sampleData.forEach((row, idx) => {
    targetItems.forEach((item) => {
      if (idx === 0) row[`test_${item.code}`] = item.refMin !== null && item.refMax !== null ? String(((item.refMin + item.refMax) / 2).toFixed(1)) : '5.2';
      else if (idx === 1) row[`test_${item.code}`] = item.unit === 'mmol/L' ? '5.6' : '135';
      else row[`test_${item.code}`] = '';
    });
    const excelRow = ws.addRow(row);
    const conclusionCell = excelRow.getCell(10);
    conclusionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    conclusionCell.font = { color: { argb: 'FF047857' } };
  });

  const docEndRow = doctorNames.length + 1;
  for (let r = 2; r <= 500; r++) {
    const row = ws.getRow(r);
    row.getCell(5).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_DataLookup!$A$2:$A$3'],
      showErrorMessage: true,
      errorTitle: 'Giới tính không hợp lệ',
      error: 'Vui lòng chọn Nam hoặc Nữ'
    };
    row.getCell(8).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$B$2:$B$${docEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Bác sĩ không hợp lệ',
      error: 'Vui lòng chọn bác sĩ từ danh sách dropdown'
    };
  }

  const safePkgName = selectedPackage ? `_${selectedPackage.name.replace(/[\s/\\:*?"<>|]+/g, '_')}` : '';
  await saveExcelJsWorkbook(wb, `GoLab_Mau_Kham_Doan${safePkgName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Đọc file Excel batch (hỗ trợ cả 1 Sheet ma trận tổng hợp và 2 Sheet tách rời)
 */
export function parseExcelBatchPatients(
  fileOrBuffer: Blob | ArrayBuffer,
  catalog: CatalogItem[]
): Promise<BatchImportRow[]> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (!e.target?.result) return resolve([]);
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          if (workbook.SheetNames.length === 0) {
            return reject(new Error('File Excel không có dữ liệu!'));
          }

          // Build catalog lookups
          const catalogByCode = new Map<string, CatalogItem>();
          const catalogByName = new Map<string, CatalogItem>();
          for (const item of catalog) {
            catalogByCode.set(item.code.trim().toLowerCase(), item);
            catalogByName.set(item.name.trim().toLowerCase(), item);
            catalogByName.set(cleanKey(item.name), item);
          }

          // Hàm trợ giúp trích xuất CatalogItem từ tên cột
          const matchCatalogItem = (colHeader: string): CatalogItem | undefined => {
            const codeMatch = colHeader.match(/\[([^\]]+)\]/);
            if (codeMatch) {
              const extractedCode = codeMatch[1].trim().toLowerCase();
              if (catalogByCode.has(extractedCode)) return catalogByCode.get(extractedCode);
            }
            const cleanHeaderName = colHeader.replace(/\s*\[[^\]]*\]\s*$/, '').trim().toLowerCase();
            if (catalogByCode.has(cleanHeaderName)) return catalogByCode.get(cleanHeaderName);
            if (catalogByName.has(cleanHeaderName)) return catalogByName.get(cleanHeaderName);
            if (catalogByName.has(cleanKey(cleanHeaderName))) return catalogByName.get(cleanKey(cleanHeaderName));
            return undefined;
          };

          const firstWs = workbook.Sheets[workbook.SheetNames[0]];
          const firstRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstWs, { defval: '' });

          if (firstRows.length === 0) {
            return resolve([]);
          }

          // Kiểm tra xem sheet 1 có phải là Ma trận gộp 1 Sheet không
          const sampleRow = firstRows[0];
          const testColsInSheet1 = Object.keys(sampleRow).filter((col) => {
            const cleaned = cleanKey(col);
            const isPatientCol = ['mabn', 'code', 'hovaten', 'hoten', 'name', 'namsinh', 'ngaysinh', 'dob', 'gioitinh', 'gender', 'sdt', 'sodienthoai', 'phone', 'diachi', 'address', 'diachicongty', 'congty', 'bschidinh', 'bacsi', 'doctor', 'chandoan', 'diagnosis', 'ketluan', 'conclusion', 'stt'].includes(cleaned);
            return !isPatientCol && matchCatalogItem(col) !== undefined;
          });

          const isSingleSheetMatrix = testColsInSheet1.length > 0 || workbook.SheetNames.length === 1;

          const results: BatchImportRow[] = [];

          if (isSingleSheetMatrix) {
            // ── TH1: PARSE THEO MA TRẬN GỘP 1 SHEET ──
            for (const pRow of firstRows) {
              const name = getRowValue(pRow, ['ho_va_ten', 'ho_ten', 'ten_benh_nhan', 'name', 'full_name']);
              if (!name) continue; // Bỏ qua hàng trống

              const rawCode = getRowValue(pRow, ['ma_bn', 'ma_benh_nhan', 'code', 'ma']);
              const code = rawCode || generatePatientCode();

              const patient: Patient = {
                code,
                secretToken: generateSecretToken(),
                name: name.toUpperCase(),
                dob: sanitizeDob(getRowValue(pRow, ['nam_sinh', 'ngay_sinh', 'dob', 'namsinh'])),
                gender: sanitizeGender(getRowValue(pRow, ['gioi_tinh', 'gender', 'phai'])),
                phone: sanitizePhone(getRowValue(pRow, ['so_dien_thoai', 'sdt', 'phone', 'dien_thoai'])),
                address: getRowValue(pRow, ['dia_chi', 'dia_chi_cong_ty', 'cong_ty', 'address', 'don_vi']),
                diagnosis: getRowValue(pRow, ['chan_doan', 'diagnosis', 'ly_do_kham', 'benh_su']) || 'Khám sức khỏe định kỳ'
              };

              const doctorName = getRowValue(pRow, ['bs_chi_dinh', 'bac_si', 'doctor', 'bs']) || 'BS. Nguyễn Thị Thành Trung';
              const conclusion = getRowValue(pRow, ['ket_luan', 'conclusion', 'loi_dan', 'nhan_xet']);

              const selectedTests: SelectedTest[] = [];

              for (const [colHeader, rawValue] of Object.entries(pRow)) {
                const cleaned = cleanKey(colHeader);
                const isPatientCol = ['mabn', 'code', 'hovaten', 'hoten', 'name', 'namsinh', 'ngaysinh', 'dob', 'gioitinh', 'gender', 'sdt', 'sodienthoai', 'phone', 'diachi', 'address', 'diachicongty', 'congty', 'bschidinh', 'bacsi', 'doctor', 'chandoan', 'diagnosis', 'ketluan', 'conclusion', 'stt'].includes(cleaned);
                if (isPatientCol) continue;

                const resultStr = String(rawValue ?? '').trim();
                if (!resultStr) continue;

                let catalogItem = matchCatalogItem(colHeader);
                if (!catalogItem) {
                  const cleanName = colHeader.replace(/\s*\[[^\]]*\]\s*$/, '').trim();
                  catalogItem = {
                    category: 'Nhập từ Excel',
                    code: cleanName.toUpperCase().replace(/\s+/g, '_').slice(0, 15),
                    name: cleanName,
                    refMin: null,
                    refMax: null,
                    unit: '',
                    refText: ''
                  };
                }

                const evalRes = evaluateTestIndicator(
                  catalogItem.code,
                  catalogItem.category,
                  catalogItem.unit,
                  resultStr,
                  catalogItem.refMin,
                  catalogItem.refMax
                );

                selectedTests.push({
                  ...catalogItem,
                  result: resultStr,
                  note: evalRes.label || 'Bình thường'
                });
              }

              results.push({
                patient,
                selectedTests,
                conclusion,
                doctorName
              });
            }
          } else {
            // ── TH2: PARSE THEO MẪU 2 SHEET (Sheet 1 BN, Sheet 2 Kết quả) ──
            const wsResult = workbook.Sheets[workbook.SheetNames[1]];
            const resultRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsResult, { defval: '' });

            const resultByCode = new Map<string, Record<string, unknown>>();
            for (const row of resultRows) {
              const code = getRowValue(row, ['ma_bn', 'ma_benh_nhan', 'code', 'ma']);
              if (code) resultByCode.set(code.toLowerCase(), row);
            }

            for (const pRow of firstRows) {
              const name = getRowValue(pRow, ['ho_va_ten', 'ho_ten', 'ten_benh_nhan', 'name']);
              if (!name) continue;

              const rawCode = getRowValue(pRow, ['ma_bn', 'ma_benh_nhan', 'code', 'ma']);
              const code = rawCode || generatePatientCode();

              const patient: Patient = {
                code,
                secretToken: generateSecretToken(),
                name: name.toUpperCase(),
                dob: sanitizeDob(getRowValue(pRow, ['nam_sinh', 'ngay_sinh', 'dob'])),
                gender: sanitizeGender(getRowValue(pRow, ['gioi_tinh', 'gender'])),
                phone: sanitizePhone(getRowValue(pRow, ['so_dien_thoai', 'sdt', 'phone'])),
                address: getRowValue(pRow, ['dia_chi', 'address']),
                diagnosis: getRowValue(pRow, ['chan_doan', 'diagnosis']) || 'Khám sức khỏe'
              };

              const doctorName = getRowValue(pRow, ['bs_chi_dinh', 'bac_si', 'doctor']) || 'BS. Nguyễn Thị Thành Trung';
              const conclusion = getRowValue(pRow, ['ket_luan', 'conclusion']);

              const selectedTests: SelectedTest[] = [];
              const resultRow = resultByCode.get(patient.code.toLowerCase());

              if (resultRow) {
                for (const [colHeader, rawValue] of Object.entries(resultRow)) {
                  const cleaned = cleanKey(colHeader);
                  if (['mabn', 'code', 'ma'].includes(cleaned)) continue;

                  const resultStr = String(rawValue ?? '').trim();
                  if (!resultStr) continue;

                  let catalogItem = matchCatalogItem(colHeader);
                  if (!catalogItem) {
                    const cleanName = colHeader.replace(/\s*\[[^\]]*\]\s*$/, '').trim();
                    catalogItem = {
                      category: 'Nhập từ Excel',
                      code: cleanName.toUpperCase().replace(/\s+/g, '_').slice(0, 15),
                      name: cleanName,
                      refMin: null,
                      refMax: null,
                      unit: '',
                      refText: ''
                    };
                  }

                  const evalRes = evaluateTestIndicator(
                    catalogItem.code,
                    catalogItem.category,
                    catalogItem.unit,
                    resultStr,
                    catalogItem.refMin,
                    catalogItem.refMax
                  );

                  selectedTests.push({
                    ...catalogItem,
                    result: resultStr,
                    note: evalRes.label || 'Bình thường'
                  });
                }
              }

              results.push({
                patient,
                selectedTests,
                conclusion,
                doctorName
              });
            }
          }

          resolve(results);
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

// ─── 3. EXPORT REPORTS & REVENUE SPREADSHEETS ─────────────────────────────────

export function exportReportsExcel(reports: MedicalReport[]): void {
  const reportRows = reports.map((rep, idx) => ({
    'STT': idx + 1,
    'Mã Bệnh Nhân': rep.code,
    'Số Bệnh Phẩm': rep.sampleCode || rep.code,
    'Họ và Tên': rep.patient.name,
    'Giới Tính': rep.patient.gender,
    'Năm Sinh / Ngày Sinh': rep.patient.dob,
    'Số Điện Thoại': rep.patient.phone || '',
    'Địa Chỉ': rep.patient.address || '',
    'Chẩn Đoán': rep.patient.diagnosis || '',
    'Bác Sĩ Chỉ Định': rep.doctorName || '',
    'Loại Phiếu': rep.isAllergen ? 'Panel Dị Nguyên 91 Chỉ Số' : 'Xét Nghiệm Chuẩn A4',
    'Số Lượng Chỉ Số': rep.testCount || rep.selectedTests.length,
    'Trạng Thái': rep.status,
    'Kết Luận Bác Sĩ': rep.conclusion || '',
    'Link Cloud PDF': rep.cloudPdfUrl || '',
    'Thời Gian Tạo': new Date(rep.createdAt).toLocaleString('vi-VN')
  }));

  const worksheet = XLSX.utils.json_to_sheet(reportRows);

  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 18 }, // Mã BN
    { wch: 18 }, // Số BP
    { wch: 25 }, // Họ tên
    { wch: 10 }, // Giới tính
    { wch: 15 }, // Năm sinh
    { wch: 15 }, // SĐT
    { wch: 30 }, // Địa chỉ
    { wch: 25 }, // Chẩn đoán
    { wch: 22 }, // Bác sĩ
    { wch: 25 }, // Loại phiếu
    { wch: 12 }, // Số chỉ số
    { wch: 18 }, // Trạng thái
    { wch: 40 }, // Kết luận
    { wch: 40 }, // Cloud Link
    { wch: 22 }  // Thời gian tạo
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, worksheet, 'Sổ Lưu Phiếu Xét Nghiệm');
  XLSX.writeFile(wb, `SoLuuPhieuXN_GoLab_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportRevenueExcel(
  invoices: Invoice[],
  doctorStats: { doctor: Doctor | { id: string; name: string }; totalRevenue: number; invoiceCount: number; percentage: number }[]
): void {
  const doctorRows = doctorStats.map((stat, idx) => ({
    'STT': idx + 1,
    'Mã Bác Sĩ': stat.doctor.id || '',
    'Tên Bác Sĩ Chỉ Định': stat.doctor.name,
    'Số Ca / Hóa Đơn': stat.invoiceCount,
    'Tổng Doanh Số (VNĐ)': stat.totalRevenue,
    'Tỷ Lệ (%)': stat.percentage.toFixed(1) + '%'
  }));

  const invoiceRows = invoices.map((inv, idx) => ({
    'STT': idx + 1,
    'Mã Hóa Đơn': inv.code,
    'Ngày Lập': new Date(inv.createdAt).toLocaleString('vi-VN'),
    'Bệnh Nhân': inv.patientName,
    'Mã Bệnh Nhân': inv.patientCode,
    'Bác Sĩ Chỉ Định': inv.doctorName || '---',
    'Gói Xét Nghiệm': inv.packageName || 'Tùy chọn',
    'Số Dịch Vụ': inv.items.length,
    'Tổng Tiền Dịch Vụ': inv.totalAmount,
    'Giảm Giá / Chiết Khấu': inv.discountAmount || 0,
    'Thực Thu (VNĐ)': inv.finalAmount,
    'Hình Thức Thanh Toán': inv.paymentMethod || 'Tiền mặt'
  }));

  const wb = XLSX.utils.book_new();

  const wsDoctor = XLSX.utils.json_to_sheet(doctorRows);
  wsDoctor['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 22 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsDoctor, 'Doanh Thu Theo Bác Sĩ');

  const wsInvoice = XLSX.utils.json_to_sheet(invoiceRows);
  wsInvoice['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 20 }, { wch: 25 }, { wch: 18 },
    { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, wsInvoice, 'Sổ Sách Chi Tiết Hóa Đơn');

  XLSX.writeFile(wb, `BaoCaoDoanhThu_GoLab_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Xuất file Excel template (hoặc data) cho Thang Đo & Phân Độ (kèm In-Cell Data Validation Dropdown & Công thức tự động)
 */
export async function exportScalesTemplate(
  scales: AllergenGradingScale[],
  isSampleOnly: boolean = true,
  filterScaleId?: string
): Promise<void> {
  const targetScales = filterScaleId
    ? scales.filter((s) => s.id === filterScaleId)
    : scales;

  const targetRows: {
    id: string;
    name: string;
    equipment: string;
    unit: string;
    grade: number;
    minVal: number;
    maxVal: number | null;
    rangeText: string;
    label: string;
    isPositive: string;
    colorKey: string;
  }[] = [];

  if (isSampleOnly) {
    targetRows.push(
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0.34', label: 'Không phản ứng', isPositive: 'Âm tính', colorKey: 'white' },
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0.35 - 0.69', label: 'Yếu', isPositive: 'Dương tính', colorKey: 'amber-light' },
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 2, minVal: 0.70, maxVal: 3.49, rangeText: '0.70 - 3.49', label: 'Trung bình', isPositive: 'Dương tính', colorKey: 'amber' },
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 3, minVal: 3.50, maxVal: 17.49, rangeText: '3.50 - 17.49', label: 'Khá', isPositive: 'Dương tính', colorKey: 'red-light' },
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 4, minVal: 17.50, maxVal: 49.99, rangeText: '17.50 - 49.99', label: 'Mạnh', isPositive: 'Dương tính', colorKey: 'red' },
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 5, minVal: 50.00, maxVal: 99.99, rangeText: '50.00 - 99.99', label: 'Rất mạnh', isPositive: 'Dương tính', colorKey: 'red-bold' },
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 6, minVal: 100.0, maxVal: null, rangeText: '>100.0', label: 'Cực mạnh', isPositive: 'Dương tính', colorKey: 'red-extreme' }
    );
  } else {
    for (const scale of targetScales) {
      for (const level of scale.levels) {
        targetRows.push({
          id: scale.id,
          name: scale.name,
          equipment: scale.equipment || '',
          unit: scale.unit || 'IU/ml',
          grade: level.grade,
          minVal: level.minVal,
          maxVal: level.maxVal,
          rangeText: level.rangeText,
          label: level.label,
          isPositive: level.isPositive ? 'Dương tính' : 'Âm tính',
          colorKey: level.colorKey || 'white'
        });
      }
    }
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GoLab Medical';
  wb.created = new Date();

  const ws = wb.addWorksheet('Thang Đo Phân Độ', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  const wsLookup = wb.addWorksheet('_DataLookup');

  const colorOptions = [
    'white', 'emerald-light', 'amber-light', 'amber', 'orange', 'red-light', 'red', 'red-bold', 'red-extreme'
  ];
  const statusOptions = ['Âm tính', 'Dương tính'];

  wsLookup.columns = [
    { header: 'Mã Màu Chỉ Thị Khả Dụng', key: 'color', width: 28 },
    { header: 'Trạng Thái Đánh Giá', key: 'status', width: 24 }
  ];

  const maxLookup = Math.max(colorOptions.length, statusOptions.length);
  for (let i = 0; i < maxLookup; i++) {
    wsLookup.addRow({
      color: colorOptions[i] || '',
      status: statusOptions[i] || ''
    });
  }

  const lookupHeader = wsLookup.getRow(1);
  lookupHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  lookupHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

  ws.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Mã Thang Đo (ID) [Tự động tạo - K cần nhập]', key: 'id', width: 28 },
    { header: 'Tên Thang Đo (*)', key: 'name', width: 38 },
    { header: 'Thiết Bị / Máy Đo Áp Dụng', key: 'equipment', width: 36 },
    { header: 'Đơn Vị Đo (*)', key: 'unit', width: 14 },
    { header: 'Bậc (Grade) (*)', key: 'grade', width: 15 },
    { header: 'Ngưỡng Min (*)', key: 'minVal', width: 15 },
    { header: 'Ngưỡng Max (Để trống nếu >)', key: 'maxVal', width: 26 },
    { header: 'Khoảng Text [Tự động - K cần nhập]', key: 'rangeText', width: 25 },
    { header: 'Diễn Giải Lâm Sàng (*)', key: 'label', width: 28 },
    { header: 'Trạng Thái (*) [Chọn Dropdown]', key: 'isPositive', width: 25 },
    { header: 'Mã Màu Chỉ Thị [Chọn Dropdown]', key: 'colorKey', width: 25 }
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } }; // Amber 600
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  targetRows.forEach((row, idx) => {
    const r = idx + 2;
    const excelRow = ws.addRow({
      stt: idx + 1,
      id: row.id || `scale_${cleanKey(row.name).slice(0, 15)}`,
      name: row.name,
      equipment: row.equipment,
      unit: row.unit,
      grade: row.grade,
      minVal: row.minVal,
      maxVal: row.maxVal === null ? '' : row.maxVal,
      rangeText: {
        formula: `=IF(H${r}="","&gt; " & G${r},IF(G${r}=0,"&lt; " & H${r},G${r} & " - " & H${r}))`,
        result: row.rangeText || ''
      },
      label: row.label,
      isPositive: row.isPositive,
      colorKey: row.colorKey
    });

    const idCell = excelRow.getCell(2);
    idCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    idCell.font = { color: { argb: 'FF047857' }, bold: true };

    const rangeCell = excelRow.getCell(9);
    rangeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    rangeCell.font = { color: { argb: 'FF047857' }, bold: true };
  });

  const colorEndRow = colorOptions.length + 1;
  for (let r = 2; r <= 500; r++) {
    const row = ws.getRow(r);
    // Trạng Thái
    row.getCell(11).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_DataLookup!$B$2:$B$3'],
      showErrorMessage: true,
      errorTitle: 'Trạng thái không hợp lệ',
      error: 'Vui lòng chọn Âm tính hoặc Dương tính'
    };
    // Màu chỉ thị
    row.getCell(12).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$A$2:$A$${colorEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Màu chỉ thị không hợp lệ',
      error: 'Vui lòng chọn màu chỉ thị từ danh sách dropdown'
    };

    if (r > targetRows.length + 1) {
      const rangeCell = row.getCell(9);
      rangeCell.value = {
        formula: `=IF(H${r}="","&gt; " & G${r},IF(G${r}=0,"&lt; " & H${r},G${r} & " - " & H${r}))`
      };
      rangeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      rangeCell.font = { color: { argb: 'FF047857' }, bold: true };
    }
  }

  const prefix = isSampleOnly ? 'GoLab_Mau_Thang_Do_Phan_Do' : 'GoLab_Danh_Sach_Thang_Do_Phan_Do';
  await saveExcelJsWorkbook(wb, `${prefix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Đọc file Excel Thang đo & Phân độ (gom nhóm các hàng cùng tên thang/mã thang)
 */
export function parseExcelScales(
  fileOrBuffer: Blob | ArrayBuffer
): Promise<AllergenGradingScale[]> {
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

          const scaleMap = new Map<string, AllergenGradingScale>();

          for (const row of rawRows) {
            const scaleName = getRowValue(row, ['ten_thang_do', 'ten_thang', 'thang_do', 'scale_name', 'name']).trim();
            if (!scaleName) continue;

            let scaleId = getRowValue(row, ['ma_thang_do', 'ma_thang', 'id', 'scale_id', 'code']).trim();
            if (!scaleId) {
              scaleId = `scale_${cleanKey(scaleName).slice(0, 15)}_${Math.random().toString(36).slice(2, 6)}`;
            }

            const equipment = getRowValue(row, ['thiet_bi_may_do_ap_dung', 'thiet_bi', 'may_do', 'equipment']).trim();
            const unit = getRowValue(row, ['don_vi_do', 'don_vi', 'unit']).trim() || 'IU/ml';

            const rawGrade = getRowValue(row, ['bac_grade', 'bac', 'grade', 'level']);
            const grade = parseInt(rawGrade.replace(/[^\d]/g, ''), 10) || 0;

            const rawMin = getRowValue(row, ['nguong_min', 'min_val', 'min']);
            const minVal = parseFloat(rawMin.replace(/[^\d.]/g, '')) || 0;

            const rawMax = getRowValue(row, ['nguong_max', 'max_val', 'max']);
            const maxVal = rawMax.trim() === '' || isNaN(parseFloat(rawMax)) ? null : parseFloat(rawMax.replace(/[^\d.]/g, ''));

            let rangeText = getRowValue(row, ['khoang_text', 'range_text', 'khoang']).trim();
            if (!rangeText) {
              if (maxVal === null) rangeText = `>${minVal}`;
              else if (minVal === 0) rangeText = `<${maxVal}`;
              else rangeText = `${minVal} - ${maxVal}`;
            }

            const label = getRowValue(row, ['dien_giai_lam_sang', 'dien_giai', 'label', 'mo_ta']).trim() || `Mức độ ${grade}`;
            const rawStatus = getRowValue(row, ['trang_thai', 'is_positive', 'status']).toLowerCase();
            const isPositive = rawStatus.includes('duong') || rawStatus.includes('positive') || grade > 0;
            const colorKey = getRowValue(row, ['ma_mau_chi_thi', 'mau_sac', 'color_key', 'color']).trim() || 'white';

            if (!scaleMap.has(scaleId)) {
              scaleMap.set(scaleId, {
                id: scaleId,
                name: scaleName,
                equipment: equipment || undefined,
                unit,
                levels: []
              });
            }

            const scaleObj = scaleMap.get(scaleId)!;
            scaleObj.levels.push({
              grade,
              minVal,
              maxVal,
              rangeText,
              label,
              isPositive,
              colorKey
            });
          }

          // Sort levels by grade ascending for each scale
          scaleMap.forEach((scale) => {
            scale.levels.sort((a, b) => a.grade - b.grade);
          });

          resolve(Array.from(scaleMap.values()));
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

