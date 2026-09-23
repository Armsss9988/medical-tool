import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import type {
  CatalogItem,
  TestGroup,
  TestEquipment,
  CatalogItemEquipmentLink,
  AllergenGradingScale,
  EvaluationType,
} from '@domain/types';
import { saveExcelJsWorkbook, cleanKey, getRowValue, readFileAsArrayBuffer } from './excelHelpers';

export interface CatalogExportOptions {
  isSampleOnly?: boolean;
  filterCategory?: string;
  scales?: AllergenGradingScale[];
}

export interface EquipmentLinkExportOptions {
  isSampleOnly?: boolean;
  filterEquipmentId?: string;
  scales?: AllergenGradingScale[];
}

/**
 * Xuất file Excel template (hoặc data) cho Chỉ số xét nghiệm
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
export async function parseExcelCatalog(fileOrBuffer: Blob | ArrayBuffer): Promise<CatalogItem[]> {
  const buffer = await readFileAsArrayBuffer(fileOrBuffer);
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });
  if (workbook.SheetNames.length === 0) return [];
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) return [];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    return [];
  }

  // Kiểm tra phát hiện nếu người dùng nạp nhầm file Excel khác loại
  const firstRow = rawRows[0] || {};
  const keys = Object.keys(firstRow).map((k) => cleanKey(k));
  const sheetLower = firstSheetName.toLowerCase();
  const isDoctorFile =
    keys.some((k) => k.includes('bac_si') || k.includes('chuyen_khoa')) ||
    sheetLower.includes('bác sĩ') ||
    sheetLower.includes('bac si');
  const isEquipmentFile =
    keys.some((k) => k.includes('thiet_bi') || k.includes('may_do')) ||
    sheetLower.includes('thiết bị') ||
    sheetLower.includes('thiet bi');

  if (isDoctorFile) {
    throw new Error(
      'File Excel bạn vừa chọn là "Danh Sách Bác Sĩ & Chuyên Gia", không phải Danh Mục Chỉ Số Xét Nghiệm! Vui lòng chuyển sang Tab 4 (Bác Sĩ & Chuyên Gia) để nhập file này.'
    );
  }
  if (isEquipmentFile) {
    throw new Error(
      'File Excel bạn vừa chọn là "Danh Sách Thiết Bị / Máy Đo", không phải Danh Mục Chỉ Số Xét Nghiệm! Vui lòng chọn đúng file.'
    );
  }

  const catalog: CatalogItem[] = rawRows.map((row) => {
    const category = getRowValue(row, ['nhom_xet_nghiem', 'nhom', 'category', 'group']) || 'Xét nghiệm khác';
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
    const evaluationType: EvaluationType = isScale ? 'scale' : 'range';

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

  return catalog;
}

/**
 * Xuất file Excel template (hoặc data) cho Bảng cấu hình thiết bị
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
    row.getCell(2).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$A$2:$A$${itemEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Mã chỉ số không hợp lệ',
      error: 'Vui lòng chọn mã chỉ số từ danh sách dropdown'
    };
    row.getCell(3).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$B$2:$B$${eqEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Tên máy đo không hợp lệ',
      error: 'Vui lòng chọn máy đo từ danh sách dropdown'
    };
    row.getCell(5).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_DataLookup!$C$2:$C$3'],
      showErrorMessage: true,
      errorTitle: 'Kiểu đánh giá không hợp lệ',
      error: 'Vui lòng chọn Khoảng số hoặc Thang phân độ'
    };
    row.getCell(8).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_DataLookup!$D$2:$D$3'],
      showErrorMessage: true,
      errorTitle: 'Thang đo không hợp lệ',
      error: 'Vui lòng chọn thang đo từ dropdown'
    };
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
export async function parseExcelCatalogItemEquipments(
  fileOrBuffer: Blob | ArrayBuffer,
  _items: CatalogItem[],
  equipments: TestEquipment[]
): Promise<CatalogItemEquipmentLink[]> {
  const buffer = await readFileAsArrayBuffer(fileOrBuffer);
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });
  if (workbook.SheetNames.length === 0) return [];
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  if (!ws) return [];
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

  return links;
}
