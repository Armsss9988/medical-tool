import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import type { AllergenGradingScale, AllergenGradeLevel } from '@domain/types';
import { getScaleCategory, isAllergenScale } from '@domain/services/scaleClassification';
import { saveExcelJsWorkbook, cleanKey, getRowValue, readFileAsArrayBuffer } from './excelHelpers';

/**
 * Xuất file Excel template (hoặc data) cho Thang Đo & Phân Độ
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
    scaleType: string;
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
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', scaleType: 'Dị nguyên', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0.34', label: 'Không phản ứng', isPositive: 'Âm tính', colorKey: 'white' },
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', scaleType: 'Dị nguyên', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0.35 - 0.69', label: 'Yếu', isPositive: 'Dương tính', colorKey: 'amber-light' },
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', scaleType: 'Dị nguyên', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 2, minVal: 0.70, maxVal: 3.49, rangeText: '0.70 - 3.49', label: 'Trung bình', isPositive: 'Dương tính', colorKey: 'amber' },
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', scaleType: 'Dị nguyên', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 3, minVal: 3.50, maxVal: 17.49, rangeText: '3.50 - 17.49', label: 'Khá', isPositive: 'Dương tính', colorKey: 'red-light' },
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', scaleType: 'Dị nguyên', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 4, minVal: 17.50, maxVal: 49.99, rangeText: '17.50 - 49.99', label: 'Mạnh', isPositive: 'Dương tính', colorKey: 'red' },
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', scaleType: 'Dị nguyên', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 5, minVal: 50.00, maxVal: 99.99, rangeText: '50.00 - 99.99', label: 'Rất mạnh', isPositive: 'Dương tính', colorKey: 'red-bold' },
      { id: 'scale_protia_91', name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)', scaleType: 'Dị nguyên', equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor', unit: 'IU/ml', grade: 6, minVal: 100.0, maxVal: null, rangeText: '>100.0', label: 'Cực mạnh', isPositive: 'Dương tính', colorKey: 'red-extreme' }
    );
  } else {
    for (const scale of targetScales) {
      const scaleType = getScaleCategory(scale);
      for (const level of scale.levels) {
        targetRows.push({
          id: scale.id,
          name: scale.name,
          scaleType,
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
  const scaleTypeOptions = ['Dị nguyên', 'Xét nghiệm khác'];

  wsLookup.columns = [
    { header: 'Mã Màu Chỉ Thị Khả Dụng', key: 'color', width: 28 },
    { header: 'Trạng Thái Đánh Giá', key: 'status', width: 24 },
    { header: 'Phân Loại Thang Đo', key: 'scaleType', width: 24 }
  ];

  const maxLookup = Math.max(colorOptions.length, statusOptions.length, scaleTypeOptions.length);
  for (let i = 0; i < maxLookup; i++) {
    wsLookup.addRow({
      color: colorOptions[i] || '',
      status: statusOptions[i] || '',
      scaleType: scaleTypeOptions[i] || ''
    });
  }

  const lookupHeader = wsLookup.getRow(1);
  lookupHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  lookupHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

  ws.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Tên Thang Đo (*)', key: 'name', width: 38 },
    { header: 'Loại Thang (*)', key: 'scaleType', width: 20 },
    { header: 'Thiết Bị / Máy Đo', key: 'equipment', width: 36 },
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
      name: row.name,
      scaleType: row.scaleType,
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

    const rangeCell = excelRow.getCell(9);
    rangeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    rangeCell.font = { color: { argb: 'FF047857' }, bold: true };
  });

  const colorEndRow = colorOptions.length + 1;
  for (let r = 2; r <= 500; r++) {
    const row = ws.getRow(r);
    row.getCell(3).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_DataLookup!$C$2:$C$3'],
      showErrorMessage: true,
      errorTitle: 'Loại thang không hợp lệ',
      error: 'Vui lòng chọn Dị nguyên hoặc Xét nghiệm khác'
    };
    row.getCell(11).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['_DataLookup!$B$2:$B$3'],
      showErrorMessage: true,
      errorTitle: 'Trạng thái không hợp lệ',
      error: 'Vui lòng chọn Âm tính hoặc Dương tính'
    };
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
 * Đọc file Excel Thang đo & Phân độ
 */
export async function parseExcelScales(
  fileOrBuffer: Blob | ArrayBuffer
): Promise<AllergenGradingScale[]> {
  const buffer = await readFileAsArrayBuffer(fileOrBuffer);
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });
  if (workbook.SheetNames.length === 0) return [];
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  if (!ws) return [];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  const scaleMap = new Map<string, AllergenGradingScale>();

  for (const row of rawRows) {
    const scaleName = getRowValue(row, ['ten_thang_do', 'ten_thang', 'thang_do', 'scale_name', 'name']).trim();
    if (!scaleName) continue;

    let scaleId = getRowValue(row, ['ma_thang_do', 'ma_thang', 'id', 'scale_id', 'code']).trim();
    if (!scaleId) {
      scaleId = `scale_${cleanKey(scaleName).toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
    }

    const rawScaleType = getRowValue(row, ['loai_thang_do', 'loai_thang', 'scale_type', 'type', 'loai']).trim();
    let scaleType: 'Dị nguyên' | 'Xét nghiệm khác';
    const lowerType = rawScaleType.toLowerCase();
    if (lowerType.includes('dị') || lowerType.includes('di') || lowerType.includes('allergen')) {
      scaleType = 'Dị nguyên';
    } else if (lowerType.includes('khác') || lowerType.includes('khac') || lowerType.includes('general')) {
      scaleType = 'Xét nghiệm khác';
    } else {
      scaleType = isAllergenScale({ id: scaleId, name: scaleName, unit: '', levels: [] }) ? 'Dị nguyên' : 'Xét nghiệm khác';
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
        scaleType,
        levels: []
      });
    }

    const scaleObj = scaleMap.get(scaleId)!;
    if (equipment && !scaleObj.equipment) scaleObj.equipment = equipment;
    if (scaleType && !scaleObj.scaleType) scaleObj.scaleType = scaleType;

    const levelData: AllergenGradeLevel = {
      grade,
      minVal,
      maxVal,
      rangeText,
      label,
      isPositive,
      colorKey
    };

    // Ghi đè bậc phân độ theo (Tên thang + Bậc) thay vì cộng dồn làm nhân đôi
    const existingIdx = scaleObj.levels.findIndex((l) => l.grade === grade);
    if (existingIdx >= 0) {
      scaleObj.levels[existingIdx] = levelData;
    } else {
      scaleObj.levels.push(levelData);
    }
  }

  scaleMap.forEach((scale) => {
    scale.levels.sort((a, b) => a.grade - b.grade);
  });

  return Array.from(scaleMap.values());
}
