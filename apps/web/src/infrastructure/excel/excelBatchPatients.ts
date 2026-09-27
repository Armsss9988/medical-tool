import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import type {
  CatalogItem,
  TestPackage,
  Doctor,
  BatchImportRow,
  SelectedTest,
  Patient
} from '@domain/types';
import { getPkgCodes } from '@domain/types';
import { evaluateTestIndicator } from '@domain/testResult';
import { generatePatientCode, generateSecretToken } from '@domain/patient';
import {
  saveExcelJsWorkbook,
  cleanKey,
  stripHeaderAnnotations,
  getRowValue,
  getRowRawValue,
  sanitizePhone,
  sanitizeGender,
  sanitizeDob,
  readFileAsArrayBuffer
} from './excelHelpers';

/**
 * Tạo Workbook Excel template chuẩn y tế cho Bệnh Nhân & Kết Quả Hàng Loạt:
 * 1. Sheet 1: Danh Sách Bệnh Nhân (Giao diện nhập liệu chính, cố định hàng tiêu đề, định dạng Text cho SĐT & Mã BN, dropdown Giới tính & Bác sĩ).
 * 2. Sheet 2: Hướng Dẫn & Danh Mục Chỉ Số (Hướng dẫn chi tiết quy tắc nhập liệu và bảng tra cứu mã/tên/đơn vị/tham chiếu của mọi chỉ số).
 * 3. Sheet 3: _DataLookup (Sheet phụ trợ lưu dữ liệu dropdown, được ẩn ngầm wsLookup.state = 'hidden').
 */
export async function generateBatchTemplateWorkbook(
  catalog: CatalogItem[],
  selectedPackage?: TestPackage | null,
  doctors: Doctor[] = []
): Promise<ExcelJS.Workbook> {
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
    // Sắp xếp chỉ số thông minh theo nhóm chuyên khoa (Sinh Hóa, Huyết Học, Nước Tiểu...) rồi theo tên
    targetItems = [...catalog].sort((a, b) => {
      const catA = a.category || '';
      const catB = b.category || '';
      if (catA !== catB) return catA.localeCompare(catB, 'vi');
      return a.name.localeCompare(b.name, 'vi');
    });
  } else {
    targetItems = [
      { code: 'GLU', name: 'Glucose máu', category: 'Sinh Hóa', unit: 'mmol/L', refText: '3.9 - 6.4' } as CatalogItem,
      { code: 'URE', name: 'Ure máu', category: 'Sinh Hóa', unit: 'mmol/L', refText: '2.5 - 7.5' } as CatalogItem,
      { code: 'CRE', name: 'Creatinine', category: 'Sinh Hóa', unit: 'µmol/L', refText: '53 - 106' } as CatalogItem,
      { code: 'AST', name: 'AST (GOT)', category: 'Sinh Hóa', unit: 'U/L', refText: '< 37' } as CatalogItem,
      { code: 'ALT', name: 'ALT (GPT)', category: 'Sinh Hóa', unit: 'U/L', refText: '< 41' } as CatalogItem,
      { code: 'GGT', name: 'GGT', category: 'Sinh Hóa', unit: 'U/L', refText: '9 - 48' } as CatalogItem,
      { code: 'URIC', name: 'Acid Uric (Gút)', category: 'Sinh Hóa', unit: 'µmol/L', refText: '180 - 420' } as CatalogItem,
      { code: 'CHO', name: 'Cholesterol toàn phần', category: 'Sinh Hóa', unit: 'mmol/L', refText: '3.6 - 5.2' } as CatalogItem,
      { code: 'TRI', name: 'Triglyceride', category: 'Sinh Hóa', unit: 'mmol/L', refText: '0.4 - 1.7' } as CatalogItem,
      { code: 'WBC', name: 'Bạch cầu (WBC)', category: 'Huyết Học', unit: 'G/L', refText: '4.0 - 10.0' } as CatalogItem,
      { code: 'RBC', name: 'Hồng cầu (RBC)', category: 'Huyết Học', unit: 'T/L', refText: '3.8 - 5.3' } as CatalogItem,
      { code: 'HGB', name: 'Hemoglobin (HGB)', category: 'Huyết Học', unit: 'g/L', refText: '120 - 165' } as CatalogItem,
      { code: 'HCT', name: 'Hematocrit (HCT)', category: 'Huyết Học', unit: '%', refText: '35.0 - 48.0' } as CatalogItem,
      { code: 'PLT', name: 'Tiểu cầu (PLT)', category: 'Huyết Học', unit: 'G/L', refText: '150 - 450' } as CatalogItem
    ];
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GoLab Medical System';
  wb.created = new Date();

  const sheetTitle = selectedPackage
    ? `Khám Đoàn - ${selectedPackage.name}`.slice(0, 31)
    : 'Danh Sách Khám Đoàn';

  // ─── SHEET 1: DANH SÁCH BỆNH NHÂN (TRANG NHẬP LIỆU CHÍNH) ───────────────────
  const ws = wb.addWorksheet(sheetTitle, {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // Base Columns
  const baseColumns: Array<{ header: string; key: string; width: number; style?: Partial<ExcelJS.Style> }> = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Mã BN (*)', key: 'code', width: 16, style: { numFmt: '@' } },
    { header: 'Họ và Tên (*)', key: 'name', width: 26 },
    { header: 'Năm Sinh (*)', key: 'dob', width: 14, style: { numFmt: '@' } },
    { header: 'Giới Tính (*)', key: 'gender', width: 15 },
    { header: 'Số Điện Thoại', key: 'phone', width: 16, style: { numFmt: '@' } },
    { header: 'Địa Chỉ / Công Ty', key: 'address', width: 30 },
    { header: 'BS Chỉ Định', key: 'doctor', width: 26 },
    { header: 'Chẩn Đoán', key: 'diagnosis', width: 26 },
    { header: 'Kết Luận', key: 'conclusion', width: 32 }
  ];

  targetItems.forEach((item) => {
    const colWidth = Math.max(16, Math.min(32, Math.ceil((item.name.length + item.code.length + 3) * 0.95)));
    baseColumns.push({
      header: `${item.name} [${item.code}]`,
      key: `test_${item.code}`,
      width: colWidth
    });
  });

  ws.columns = baseColumns;

  // Header Styling (Row 1)
  const headerRow = ws.getRow(1);
  headerRow.height = 36;
  const headerBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    bottom: { style: 'medium', color: { argb: 'FF0369A1' } },
    left: { style: 'thin', color: { argb: 'FF94A3B8' } },
    right: { style: 'thin', color: { argb: 'FF94A3B8' } }
  };
  const cellBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };

  for (let c = 1; c <= baseColumns.length; c++) {
    const cell = headerRow.getCell(c);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.border = headerBorder;
    if (c <= 10) {
      // Nhóm thông tin hành chính: Xanh lam y khoa chuẩn
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    } else {
      // Nhóm chỉ số xét nghiệm: Xanh Teal chuyên môn
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7490' } };
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  }

  // Danh sách bác sĩ
  const doctorNames = doctors.length > 0
    ? doctors.map(d => d.name)
    : ['BS. Trần Hoài Long', 'BS. Lê Phan Anh'];

  // Sample data rows (3 dòng mẫu trực quan)
  const sampleData: Record<string, unknown>[] = [
    {
      stt: 1,
      code: 'XN-2026-001',
      name: 'NGUYỄN VĂN A',
      dob: '1990',
      gender: 'Nam',
      phone: '0987654321',
      address: 'Công Ty Cổ Phần GoLab - Đồng Hới',
      doctor: doctorNames[0] || 'BS. Trần Hoài Long',
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
      doctor: doctorNames[0] || 'BS. Trần Hoài Long',
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
      if (idx === 0) {
        row[`test_${item.code}`] = item.refMin != null && item.refMax != null
          ? String(((item.refMin + item.refMax) / 2).toFixed(1))
          : '5.2';
      } else if (idx === 1) {
        row[`test_${item.code}`] = item.unit === 'mmol/L' ? '5.6' : '135';
      } else {
        row[`test_${item.code}`] = '';
      }
    });

    const excelRow = ws.addRow(row);
    excelRow.height = 24;
    excelRow.alignment = { vertical: 'middle' };

    for (let c = 1; c <= baseColumns.length; c++) {
      const cell = excelRow.getCell(c);
      cell.border = cellBorder;
      if (c === 1 || c === 2 || c === 4 || c === 5 || c === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      if (c >= 11) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    }

    const conclusionCell = excelRow.getCell(10);
    conclusionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    conclusionCell.font = { color: { argb: 'FF047857' } };
  });

  // Data Validation & Format cho 500 dòng
  const docEndRow = doctorNames.length + 1;
  for (let r = 2; r <= 500; r++) {
    const row = ws.getRow(r);
    row.getCell(2).numFmt = '@';
    row.getCell(4).numFmt = '@';
    row.getCell(6).numFmt = '@';

    row.getCell(5).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Nam,Nữ"'],
      showErrorMessage: true,
      errorTitle: 'Giới tính không hợp lệ',
      error: 'Vui lòng chọn Nam hoặc Nữ',
      showInputMessage: true,
      promptTitle: 'Giới tính',
      prompt: 'Chọn Nam hoặc Nữ từ danh sách thả xuống'
    };

    row.getCell(8).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$B$2:$B$${docEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Bác sĩ không hợp lệ',
      error: 'Vui lòng chọn bác sĩ từ danh sách dropdown',
      showInputMessage: true,
      promptTitle: 'BS Chỉ Định',
      prompt: 'Chọn bác sĩ chỉ định từ danh sách thả xuống'
    };
  }

  // ─── SHEET 2: HƯỚNG DẪN & DANH MỤC CHỈ SỐ ─────────────────────────────────
  const wsGuide = wb.addWorksheet('Hướng Dẫn & Danh Mục Chỉ Số');
  wsGuide.views = [{ showGridLines: true }];
  wsGuide.columns = [
    { width: 8 },  // A: STT
    { width: 20 }, // B: Mã xét nghiệm / Tên cột
    { width: 34 }, // C: Tên chỉ số / Quy tắc
    { width: 22 }, // D: Chuyên khoa
    { width: 16 }, // E: Đơn vị tính
    { width: 28 }  // F: Khoảng tham chiếu
  ];

  // Title Banner
  wsGuide.mergeCells('A2:F2');
  const bannerCell = wsGuide.getCell('A2');
  bannerCell.value = 'HỆ THỐNG Y KHOA GOLAB - HƯỚNG DẪN NHẬP LIỆU EXCEL KHÁM ĐOÀN';
  bannerCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  bannerCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsGuide.getRow(2).height = 30;

  // Subtitle
  wsGuide.mergeCells('A3:F3');
  const subCell = wsGuide.getCell('A3');
  subCell.value = `Gói xét nghiệm: ${selectedPackage ? selectedPackage.name : 'Tất Cả Chỉ Số (Mẫu Chung)'} | Ngày tạo mẫu: ${new Date().toLocaleDateString('vi-VN')}`;
  subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsGuide.getRow(3).height = 20;

  // Section 1: Hướng Dẫn Quy Tắc Nhập Liệu
  wsGuide.mergeCells('A5:F5');
  const sec1Cell = wsGuide.getCell('A5');
  sec1Cell.value = '1. QUY TẮC NHẬP LIỆU BỆNH NHÂN & KẾT QUẢ XÉT NGHIỆM';
  sec1Cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0284C7' } };
  wsGuide.getRow(5).height = 24;

  const guideRules = [
    { no: '1', field: 'Họ và Tên (*)', rule: 'BẮT BUỘC. Nhập họ và tên đầy đủ. Hệ thống tự động chuyển in hoa chuẩn y tế.' },
    { no: '2', field: 'Năm Sinh (*)', rule: 'BẮT BUỘC. Nhập năm sinh 4 số (VD: 1990) hoặc ngày tháng năm (VD: 15/08/1990).' },
    { no: '3', field: 'Giới Tính (*)', rule: 'BẮT BUỘC. Nhấp vào ô để chọn "Nam" hoặc "Nữ" từ danh sách thả xuống.' },
    { no: '4', field: 'Mã Bệnh Nhân', rule: 'TÙY CHỌN. Có thể nhập mã riêng của đơn vị hoặc ĐỂ TRỐNG (hệ thống GoLab sẽ tự động cấp mã XN-YYYYMMDD-xxx).' },
    { no: '5', field: 'Số Điện Thoại', rule: 'TÙY CHỌN. Nhập 10 số (ô đã định dạng văn bản nên không bị mất số 0 ở đầu).' },
    { no: '6', field: 'BS Chỉ Định', rule: 'TÙY CHỌN. Nhấp vào ô để chọn bác sĩ chỉ định từ danh sách.' },
    { no: '7', field: 'Kết Quả Xét Nghiệm', rule: 'Nhập giá trị đo được (số hoặc chữ). Bệnh nhân không làm xét nghiệm nào thì ĐỂ TRỐNG Ô ĐÓ.' },
    { no: '8', field: 'Dòng Tiêu Đề', rule: 'GIỮ NGUYÊN dòng tiêu đề (Hàng 1) và mã trong ngoặc vuông [MÃ] để hệ thống tự động nhận diện chính xác 100%.' }
  ];

  const ruleHeaderRow = wsGuide.getRow(6);
  ruleHeaderRow.height = 24;
  ruleHeaderRow.getCell(1).value = 'STT';
  ruleHeaderRow.getCell(2).value = 'Tên Cột';
  wsGuide.mergeCells('C6:F6');
  ruleHeaderRow.getCell(3).value = 'Quy Định & Hướng Dẫn Chi Tiết';

  for (let c = 1; c <= 6; c++) {
    const cell = ruleHeaderRow.getCell(c);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.border = cellBorder;
    cell.alignment = { vertical: 'middle', horizontal: c <= 2 ? 'center' : 'left' };
  }

  guideRules.forEach((r, idx) => {
    const rowNum = 7 + idx;
    const ruleRow = wsGuide.getRow(rowNum);
    ruleRow.height = 22;
    ruleRow.getCell(1).value = r.no;
    ruleRow.getCell(2).value = r.field;
    wsGuide.mergeCells(`C${rowNum}:F${rowNum}`);
    ruleRow.getCell(3).value = r.rule;

    for (let c = 1; c <= 6; c++) {
      const cell = ruleRow.getCell(c);
      cell.font = { name: 'Arial', size: 9.5 };
      cell.border = cellBorder;
      if (c === 1 || c === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (c === 2) cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0369A1' } };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    }
  });

  // Section 2: Danh Mục Chỉ Số Xét Nghiệm Trong Mẫu
  const sec2StartRow = 8 + guideRules.length;
  wsGuide.mergeCells(`A${sec2StartRow}:F${sec2StartRow}`);
  const sec2Cell = wsGuide.getCell(`A${sec2StartRow}`);
  sec2Cell.value = `2. DANH MỤC CÁC CHỈ SỐ XÉT NGHIỆM TRONG MẪU NÀY (${targetItems.length} CHỈ SỐ)`;
  sec2Cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0284C7' } };
  wsGuide.getRow(sec2StartRow).height = 28;

  const itemHeaderRow = wsGuide.getRow(sec2StartRow + 1);
  itemHeaderRow.height = 24;
  itemHeaderRow.getCell(1).value = 'STT';
  itemHeaderRow.getCell(2).value = 'Mã Xét Nghiệm';
  itemHeaderRow.getCell(3).value = 'Tên Chỉ Số Xét Nghiệm';
  itemHeaderRow.getCell(4).value = 'Chuyên Khoa / Nhóm';
  itemHeaderRow.getCell(5).value = 'Đơn Vị Tính';
  itemHeaderRow.getCell(6).value = 'Khoảng Tham Chiếu';

  for (let c = 1; c <= 6; c++) {
    const cell = itemHeaderRow.getCell(c);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7490' } };
    cell.border = cellBorder;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  targetItems.forEach((item, idx) => {
    const rowNum = sec2StartRow + 2 + idx;
    const r = wsGuide.getRow(rowNum);
    r.height = 20;
    r.getCell(1).value = idx + 1;
    r.getCell(2).value = item.code;
    r.getCell(3).value = item.name;
    r.getCell(4).value = item.category || 'Xét Nghiệm';
    r.getCell(5).value = item.unit || '-';
    r.getCell(6).value = item.refText || (item.refMin != null && item.refMax != null ? `${item.refMin} - ${item.refMax}` : '-');

    for (let c = 1; c <= 6; c++) {
      const cell = r.getCell(c);
      cell.font = { name: 'Arial', size: 9.5 };
      cell.border = cellBorder;
      if (c === 1 || c === 2 || c === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (c === 2) cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0E7490' } };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    }
  });

  // ─── SHEET 3: _DATALOOKUP (ẨN ĐỂ LƯU DANH SÁCH DROPDOWN) ────────────────────
  const wsLookup = wb.addWorksheet('_DataLookup');
  wsLookup.state = 'hidden';

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

  return wb;
}

/**
 * Xuất file Excel template mẫu cho Bệnh Nhân & Kết Quả Hàng Loạt
 */
export async function exportBatchTemplateExcel(
  catalog: CatalogItem[],
  selectedPackage?: TestPackage | null,
  doctors: Doctor[] = []
): Promise<void> {
  const wb = await generateBatchTemplateWorkbook(catalog, selectedPackage, doctors);
  const safePkgName = selectedPackage ? `_${selectedPackage.name.replace(/[\s/\\:*?"<>|]+/g, '_')}` : '';
  await saveExcelJsWorkbook(wb, `GoLab_Mau_Kham_Doan${safePkgName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export const exportBatchPatientsTemplate = exportBatchTemplateExcel;

/**
 * Xây dựng bộ chỉ mục động từ danh mục xét nghiệm (Catalog) để nhận diện linh hoạt mọi biến thể:
 * - Trích xuất mã xét nghiệm và các dạng mở rộng/rút gọn (VD: NEUPCT <-> NEU, LYMPCT <-> LYM)
 * - Trích xuất từ viết tắt trong ngoặc đơn: AST (GOT) -> GOT, Acid Uric (Gút) -> Gút, Bạch cầu (WBC) -> WBC
 * - Tự động lược bỏ từ bổ trợ y khoa phổ biến (máu, toàn phần, định lượng, huyết thanh, số lượng, tỷ lệ, tuyệt đối)
 * - Tự học và liên kết động từ dữ liệu catalog có sẵn, KHÔNG hardcode danh sách thủ công.
 */
export function buildDynamicCatalogIndex(catalog: CatalogItem[]) {
  const byCode = new Map<string, CatalogItem>();
  const byCleanName = new Map<string, CatalogItem>();
  const byAlias = new Map<string, CatalogItem>();

  const QUALIFIERS = [
    'mau', 'toanphan', 'dinhluong', 'huyetthanh', 'soluong', 'tyle', 'tuyetdoi',
    'test', 'nhanh', 'quanghoc', 'tudong', 'coban', 'chiso', 'tieuhoa', 'hohap',
    'chucnang', 'tongphantich', 'tebao', 'thetichtrungbinh', 'nongdo', 'dungtich',
    'luong'
  ];

  const stripQualifiers = (cleanStr: string): string => {
    let result = cleanStr;
    let changed = true;
    while (changed) {
      changed = false;
      for (const q of QUALIFIERS) {
        if (result.startsWith(q) && result.length > q.length + 1) {
          result = result.slice(q.length);
          changed = true;
        }
        if (result.endsWith(q) && result.length > q.length + 1) {
          result = result.slice(0, -q.length);
          changed = true;
        }
      }
    }
    return result;
  };

  const registerAlias = (key: string, item: CatalogItem) => {
    const k = cleanKey(key);
    if (k && k.length >= 2 && !byAlias.has(k)) {
      byAlias.set(k, item);
    }
  };

  for (const item of catalog) {
    const codeClean = cleanKey(item.code);
    byCode.set(item.code.trim().toLowerCase(), item);
    if (codeClean) byCode.set(codeClean, item);

    // Xử lý mã PCT / ABS (ví dụ NEUPCT -> NEU, LYMPCT -> LYM)
    const upperCode = item.code.toUpperCase();
    if (upperCode.endsWith('PCT')) {
      const baseCode = upperCode.slice(0, -3);
      registerAlias(baseCode, item);
      registerAlias(baseCode + '%', item);
    }
    if (upperCode.endsWith('ABS')) {
      const baseCode = upperCode.slice(0, -3);
      registerAlias(baseCode, item);
      registerAlias(baseCode + '#', item);
    }

    // Tên gốc
    const nameClean = cleanKey(item.name);
    byCleanName.set(nameClean, item);
    byCleanName.set(item.name.trim().toLowerCase(), item);

    // Tách phần tên sau mã xét nghiệm nếu tên bắt đầu bằng mã (VD: "WBC Số lượng bạch cầu" -> "Số lượng bạch cầu" -> "bạch cầu")
    if (codeClean && nameClean.startsWith(codeClean) && nameClean.length > codeClean.length) {
      const remainder = nameClean.slice(codeClean.length);
      registerAlias(remainder, item);
      const strippedRemainder = stripQualifiers(remainder);
      if (strippedRemainder.length >= 2) registerAlias(strippedRemainder, item);
    }

    // Trích xuất nội dung trong ngoặc đơn: AST (GOT) -> GOT, Glucose (Đường huyết lúc đói)
    const parenMatches = item.name.match(/\(([^)]+)\)/g);
    if (parenMatches) {
      for (const m of parenMatches) {
        const inside = m.replace(/[()]/g, '').trim();
        registerAlias(inside, item);
        const strippedInside = stripQualifiers(cleanKey(inside));
        if (strippedInside.length >= 2) registerAlias(strippedInside, item);
      }
    }

    // Tên không có phần trong ngoặc: "Acid Uric (Gút)" -> "Acid Uric"
    const nameWithoutParen = item.name.replace(/\([^)]*\)/g, ' ').trim();
    if (nameWithoutParen) {
      registerAlias(nameWithoutParen, item);
      const stripped = stripQualifiers(cleanKey(nameWithoutParen));
      if (stripped.length >= 2) registerAlias(stripped, item);
    }

    // Tách theo dấu gạch ngang, gạch chéo: "AST (GOT) - Men gan" -> "Men gan"
    const parts = item.name.split(/[-–—/:]/);
    for (const part of parts) {
      const pClean = cleanKey(part);
      if (pClean.length >= 3) {
        registerAlias(part.trim(), item);
        const strippedPart = stripQualifiers(pClean);
        if (strippedPart.length >= 2) registerAlias(strippedPart, item);
      }
    }

    // Scientific / tên khoa học nếu có
    if (item.scientific) {
      registerAlias(item.scientific, item);
      const sciClean = cleanKey(item.scientific);
      if (sciClean.length >= 3) {
        const strippedSci = stripQualifiers(sciClean);
        if (strippedSci.length >= 2) registerAlias(strippedSci, item);
      }
    }
  }

  const matchCatalogItem = (colHeader: string): CatalogItem | undefined => {
    // 1. Nếu có mã trong ngoặc vuông [CODE] (chuẩn template GoLab)
    const codeMatch = colHeader.match(/\[([^\]]+)\]/);
    if (codeMatch) {
      const extractedCode = codeMatch[1].trim().toLowerCase();
      if (byCode.has(extractedCode)) return byCode.get(extractedCode);
      const cleanExtracted = cleanKey(extractedCode);
      if (byCode.has(cleanExtracted)) return byCode.get(cleanExtracted);
    }

    // 2. Tên đã lọc bỏ ngoặc vuông
    const cleanHeaderName = colHeader.replace(/\s*\[[^\]]*\]\s*$/, '').trim();
    const rawClean = cleanKey(cleanHeaderName);

    if (byCode.has(cleanHeaderName.toLowerCase())) return byCode.get(cleanHeaderName.toLowerCase());
    if (byCode.has(rawClean)) return byCode.get(rawClean);
    if (byCleanName.has(cleanHeaderName.toLowerCase())) return byCleanName.get(cleanHeaderName.toLowerCase());
    if (byCleanName.has(rawClean)) return byCleanName.get(rawClean);

    // 3. Tra cứu từ danh mục alias trích xuất động
    if (byAlias.has(rawClean)) return byAlias.get(rawClean);

    // 4. Lược bỏ từ đệm y khoa khỏi tiêu đề cột
    const strippedHeader = stripQualifiers(rawClean);
    if (strippedHeader.length >= 2 && byAlias.has(strippedHeader)) {
      return byAlias.get(strippedHeader);
    }

    // 5. Kiểm tra phần trong ngoặc nếu header có ngoặc
    const headerParen = cleanHeaderName.match(/\(([^)]+)\)/);
    if (headerParen) {
      const insideKey = cleanKey(headerParen[1]);
      if (byCode.has(insideKey)) return byCode.get(insideKey);
      if (byAlias.has(insideKey)) return byAlias.get(insideKey);
    }

    // 6. Fuzzy prefix match nếu độ dài header >= 4
    if (rawClean.length >= 4) {
      for (const [aliasKey, item] of byAlias.entries()) {
        if (aliasKey.length >= 4 && (aliasKey.startsWith(rawClean) || rawClean.startsWith(aliasKey))) {
          return item;
        }
      }
    }

    return undefined;
  };

  return { matchCatalogItem, byCode, byCleanName, byAlias };
}

/**
 * Đọc file Excel batch (hỗ trợ cả 1 Sheet ma trận tổng hợp và 2 Sheet tách rời)
 */
export async function parseExcelBatchPatients(
  fileOrBuffer: Blob | ArrayBuffer,
  catalog: CatalogItem[]
): Promise<BatchImportRow[]> {
  const buffer = await readFileAsArrayBuffer(fileOrBuffer);
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });

  if (workbook.SheetNames.length === 0) {
    throw new Error('File Excel không có dữ liệu!');
  }

  const { matchCatalogItem } = buildDynamicCatalogIndex(catalog);

  const dataSheetNames = workbook.SheetNames.filter((name) => {
    const clean = cleanKey(name);
    return (
      !name.startsWith('_') &&
      !clean.includes('datalookup') &&
      !clean.includes('lookup') &&
      !clean.includes('huongdan') &&
      !clean.includes('instruction')
    );
  });
  const effectiveSheetNames = dataSheetNames.length > 0 ? dataSheetNames : workbook.SheetNames;

  const firstWs = workbook.Sheets[effectiveSheetNames[0]];
  const firstRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstWs, { defval: '' });

  if (firstRows.length === 0) {
    return [];
  }

  const patientColKeys = [
    'mabn', 'code', 'hovaten', 'hoten', 'name', 'fullname', 'tenbenhnhan',
    'namsinh', 'ngaysinh', 'dob', 'gioitinh', 'gender', 'phai',
    'sdt', 'sodienthoai', 'phone', 'dienthoai', 'diachi', 'address',
    'diachicongty', 'congty', 'donvi', 'bschidinh', 'bacsi', 'doctor', 'bs',
    'chandoan', 'diagnosis', 'lydokham', 'benhsu', 'ketluan', 'conclusion',
    'loidan', 'nhanxet', 'stt'
  ];

  const isPatientColumn = (col: string): boolean => {
    const c1 = cleanKey(col);
    const c2 = cleanKey(stripHeaderAnnotations(col));
    return patientColKeys.includes(c1) || patientColKeys.includes(c2);
  };

  const sampleRow = firstRows[0];
  const nonPatientColsInSheet1 = Object.keys(sampleRow).filter((col) => !isPatientColumn(col));

  let hasValidResultSheet2 = false;
  if (effectiveSheetNames.length > 1) {
    const secondWs = workbook.Sheets[effectiveSheetNames[1]];
    const secondRowsSample = XLSX.utils.sheet_to_json<unknown[]>(secondWs, { defval: '', header: 1 });
    if (secondRowsSample.length > 0) {
      const headers = (secondRowsSample[0] || []).map((h) => cleanKey(String(h ?? '')));
      hasValidResultSheet2 = headers.some((h) => ['mabn', 'code', 'ma', 'mabenhnhan'].includes(h));
    }
  }

  const isSingleSheetMatrix = nonPatientColsInSheet1.length > 0 || !hasValidResultSheet2 || effectiveSheetNames.length === 1;

  const results: BatchImportRow[] = [];

  if (isSingleSheetMatrix) {
    // 1. Quét toàn bộ bảng xem những cột xét nghiệm nào có chứa ít nhất 1 kết quả (Active Columns)
    const activeTestColumns = new Set<string>();
    for (const row of firstRows) {
      for (const [col, val] of Object.entries(row)) {
        if (isPatientColumn(col)) continue;
        const s = String(val ?? '').trim();
        if (s) {
          activeTestColumns.add(col);
        }
      }
    }

    for (const pRow of firstRows) {
      const name = getRowValue(pRow, ['ho_va_ten', 'ho_ten', 'ten_benh_nhan', 'name', 'full_name']);
      if (!name) continue;

      const rawCode = getRowValue(pRow, ['ma_bn', 'ma_benh_nhan', 'code', 'ma']);
      const hasExplicitCode = Boolean(rawCode && rawCode.trim().length > 0);
      const code = rawCode || generatePatientCode();

      const patient: Patient = {
        code,
        secretToken: generateSecretToken(),
        name: name.toUpperCase(),
        dob: sanitizeDob(getRowRawValue(pRow, ['nam_sinh', 'ngay_sinh', 'dob', 'namsinh'])),
        gender: sanitizeGender(getRowValue(pRow, ['gioi_tinh', 'gender', 'phai'])),
        phone: sanitizePhone(getRowValue(pRow, ['so_dien_thoai', 'sdt', 'phone', 'dien_thoai'])),
        address: getRowValue(pRow, ['dia_chi', 'dia_chi_cong_ty', 'cong_ty', 'address', 'don_vi']),
        diagnosis: getRowValue(pRow, ['chan_doan', 'diagnosis', 'ly_do_kham', 'benh_su']) || 'Khám sức khỏe định kỳ'
      };

      const doctorName = getRowValue(pRow, ['bs_chi_dinh', 'bac_si', 'doctor', 'bs']) || 'BS. Trần Hoài Long';
      const conclusion = getRowValue(pRow, ['ket_luan', 'conclusion', 'loi_dan', 'nhan_xet']);

      const testMap = new Map<string, SelectedTest>();

      for (const [colHeader, rawValue] of Object.entries(pRow)) {
        if (isPatientColumn(colHeader)) continue;

        const resultStr = String(rawValue ?? '').trim();
        const isActiveCol = activeTestColumns.has(colHeader);

        // Bỏ qua cột nếu hoàn toàn rỗng trên toàn file và ô này cũng rỗng
        if (!resultStr && !isActiveCol) continue;

        let catalogItem = matchCatalogItem(colHeader);
        if (!catalogItem) {
          if (!resultStr) continue;
          const cleanName = stripHeaderAnnotations(colHeader).replace(/\s*\[[^\]]*\]\s*$/, '').trim();
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

        let evalLabel = '';
        if (resultStr) {
          const evalRes = evaluateTestIndicator(
            catalogItem.code,
            catalogItem.category,
            catalogItem.unit,
            resultStr,
            catalogItem.refMin,
            catalogItem.refMax,
            undefined,
            undefined,
            catalogItem.evaluationType
          );
          evalLabel = evalRes.label;
        }

        const testKey = catalogItem.code.toUpperCase();
        testMap.set(testKey, {
          ...catalogItem,
          result: resultStr,
          note: evalLabel || (catalogItem.evaluationType === 'detection' && (!resultStr || resultStr.trim() === '') ? '' : (resultStr ? 'Bình thường' : ''))
        });
      }

      results.push({
        id: `import_row_${Date.now()}_${results.length}_${Math.random().toString(36).slice(2, 7)}`,
        patient,
        selectedTests: Array.from(testMap.values()),
        conclusion,
        doctorName,
        hasExplicitCode
      });
    }
  } else {
    const wsResult = workbook.Sheets[effectiveSheetNames[1]];
    const resultRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsResult, { defval: '' });

    const resultByCode = new Map<string, Record<string, unknown>>();
    for (const row of resultRows) {
      const code = getRowValue(row, ['ma_bn', 'ma_benh_nhan', 'code', 'ma']).trim();
      if (code) resultByCode.set(code.toLowerCase(), row);
    }

    const isResultColumn = (col: string): boolean => {
      const c1 = cleanKey(col);
      const c2 = cleanKey(stripHeaderAnnotations(col));
      return ['mabn', 'code', 'ma', 'mabenhnhan', 'stt'].includes(c1) || ['mabn', 'code', 'ma', 'mabenhnhan', 'stt'].includes(c2);
    };

    const activeTestColumns = new Set<string>();
    for (const row of resultRows) {
      for (const [col, val] of Object.entries(row)) {
        if (isResultColumn(col)) continue;
        const s = String(val ?? '').trim();
        if (s) {
          activeTestColumns.add(col);
        }
      }
    }

    for (const pRow of firstRows) {
      const name = getRowValue(pRow, ['ho_va_ten', 'ho_ten', 'ten_benh_nhan', 'name']);
      if (!name) continue;

      const rawCode = getRowValue(pRow, ['ma_bn', 'ma_benh_nhan', 'code', 'ma']);
      const hasExplicitCode = Boolean(rawCode && rawCode.trim().length > 0);
      const code = rawCode || generatePatientCode();

      const patient: Patient = {
        code,
        secretToken: generateSecretToken(),
        name: name.toUpperCase(),
        dob: sanitizeDob(getRowRawValue(pRow, ['nam_sinh', 'ngay_sinh', 'dob', 'namsinh'])),
        gender: sanitizeGender(getRowValue(pRow, ['gioi_tinh', 'gender', 'phai'])),
        phone: sanitizePhone(getRowValue(pRow, ['so_dien_thoai', 'sdt', 'phone'])),
        address: getRowValue(pRow, ['dia_chi', 'address']),
        diagnosis: getRowValue(pRow, ['chan_doan', 'diagnosis']) || 'Khám sức khỏe'
      };

      const doctorName = getRowValue(pRow, ['bs_chi_dinh', 'bac_si', 'doctor', 'bs']) || 'BS. Trần Hoài Long';
      const conclusion = getRowValue(pRow, ['ket_luan', 'conclusion', 'loi_dan', 'nhan_xet']);

      const testMap = new Map<string, SelectedTest>();
      const lookupKey = (rawCode ? rawCode.toLowerCase().trim() : '') || patient.code.toLowerCase().trim();
      const resultRow = resultByCode.get(lookupKey);

      if (resultRow) {
        for (const [colHeader, rawValue] of Object.entries(resultRow)) {
          if (isResultColumn(colHeader)) continue;

          const resultStr = String(rawValue ?? '').trim();
          const isActiveCol = activeTestColumns.has(colHeader);
          if (!resultStr && !isActiveCol) continue;

          let catalogItem = matchCatalogItem(colHeader);
          if (!catalogItem) {
            if (!resultStr) continue;
            const cleanName = stripHeaderAnnotations(colHeader).replace(/\s*\[[^\]]*\]\s*$/, '').trim();
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

          let evalLabel = '';
          if (resultStr) {
            const evalRes = evaluateTestIndicator(
              catalogItem.code,
              catalogItem.category,
              catalogItem.unit,
              resultStr,
              catalogItem.refMin,
              catalogItem.refMax,
              undefined,
              undefined,
              catalogItem.evaluationType
            );
            evalLabel = evalRes.label;
          }

          const testKey = catalogItem.code.toUpperCase();
          testMap.set(testKey, {
            ...catalogItem,
            result: resultStr,
            note: evalLabel || (catalogItem.evaluationType === 'detection' && (!resultStr || resultStr.trim() === '') ? '' : (resultStr ? 'Bình thường' : ''))
          });
        }
      }

      results.push({
        id: `import_row_${Date.now()}_${results.length}_${Math.random().toString(36).slice(2, 7)}`,
        patient,
        selectedTests: Array.from(testMap.values()),
        conclusion,
        doctorName,
        hasExplicitCode
      });
    }
  }

  return results;
}
