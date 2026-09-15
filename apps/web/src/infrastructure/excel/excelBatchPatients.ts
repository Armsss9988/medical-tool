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
  getRowValue,
  sanitizePhone,
  sanitizeGender,
  sanitizeDob
} from './excelHelpers';

/**
 * Xuất file Excel template mẫu cho Bệnh Nhân & Kết Quả Hàng Loạt
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
    : ['BS. Trần Hoài Long', 'BS. Lê Phan Anh'];

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
      if (idx === 0) row[`test_${item.code}`] = item.refMin != null && item.refMax != null ? String(((item.refMin + item.refMax) / 2).toFixed(1)) : '5.2';
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

export const exportBatchPatientsTemplate = exportBatchTemplateExcel;

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

          const catalogByCode = new Map<string, CatalogItem>();
          const catalogByName = new Map<string, CatalogItem>();
          for (const item of catalog) {
            catalogByCode.set(item.code.trim().toLowerCase(), item);
            catalogByName.set(item.name.trim().toLowerCase(), item);
            catalogByName.set(cleanKey(item.name), item);
          }

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
            return resolve([]);
          }

          const patientColKeys = [
            'mabn', 'code', 'hovaten', 'hoten', 'name', 'fullname', 'tenbenhnhan',
            'namsinh', 'ngaysinh', 'dob', 'gioitinh', 'gender', 'phai',
            'sdt', 'sodienthoai', 'phone', 'dienthoai', 'diachi', 'address',
            'diachicongty', 'congty', 'donvi', 'bschidinh', 'bacsi', 'doctor', 'bs',
            'chandoan', 'diagnosis', 'lydokham', 'benhsu', 'ketluan', 'conclusion',
            'loidan', 'nhanxet', 'stt'
          ];

          const sampleRow = firstRows[0];
          const nonPatientColsInSheet1 = Object.keys(sampleRow).filter((col) => {
            const cleaned = cleanKey(col);
            return !patientColKeys.includes(cleaned);
          });

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
                dob: sanitizeDob(getRowValue(pRow, ['nam_sinh', 'ngay_sinh', 'dob', 'namsinh'])),
                gender: sanitizeGender(getRowValue(pRow, ['gioi_tinh', 'gender', 'phai'])),
                phone: sanitizePhone(getRowValue(pRow, ['so_dien_thoai', 'sdt', 'phone', 'dien_thoai'])),
                address: getRowValue(pRow, ['dia_chi', 'dia_chi_cong_ty', 'cong_ty', 'address', 'don_vi']),
                diagnosis: getRowValue(pRow, ['chan_doan', 'diagnosis', 'ly_do_kham', 'benh_su']) || 'Khám sức khỏe định kỳ'
              };

              const doctorName = getRowValue(pRow, ['bs_chi_dinh', 'bac_si', 'doctor', 'bs']) || 'BS. Trần Hoài Long';
              const conclusion = getRowValue(pRow, ['ket_luan', 'conclusion', 'loi_dan', 'nhan_xet']);

              const testMap = new Map<string, SelectedTest>();

              for (const [colHeader, rawValue] of Object.entries(pRow)) {
                const cleaned = cleanKey(colHeader);
                if (patientColKeys.includes(cleaned)) continue;

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
                  catalogItem.refMax,
                  undefined,
                  undefined,
                  catalogItem.evaluationType
                );

                const testKey = catalogItem.code.toUpperCase();
                testMap.set(testKey, {
                  ...catalogItem,
                  result: resultStr,
                  note: evalRes.label || (catalogItem.evaluationType === 'detection' && (!resultStr || resultStr.trim() === '') ? '' : 'Bình thường')
                });
              }

              results.push({
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
              const code = getRowValue(row, ['ma_bn', 'ma_benh_nhan', 'code', 'ma']);
              if (code) resultByCode.set(code.toLowerCase(), row);
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
                dob: sanitizeDob(getRowValue(pRow, ['nam_sinh', 'ngay_sinh', 'dob'])),
                gender: sanitizeGender(getRowValue(pRow, ['gioi_tinh', 'gender'])),
                phone: sanitizePhone(getRowValue(pRow, ['so_dien_thoai', 'sdt', 'phone'])),
                address: getRowValue(pRow, ['dia_chi', 'address']),
                diagnosis: getRowValue(pRow, ['chan_doan', 'diagnosis']) || 'Khám sức khỏe'
              };

              const doctorName = getRowValue(pRow, ['bs_chi_dinh', 'bac_si', 'doctor']) || 'BS. Trần Hoài Long';
              const conclusion = getRowValue(pRow, ['ket_luan', 'conclusion']);

              const testMap = new Map<string, SelectedTest>();
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
                    catalogItem.refMax,
                    undefined,
                    undefined,
                    catalogItem.evaluationType
                  );

                  const testKey = catalogItem.code.toUpperCase();
                  testMap.set(testKey, {
                    ...catalogItem,
                    result: resultStr,
                    note: evalRes.label || (catalogItem.evaluationType === 'detection' && (!resultStr || resultStr.trim() === '') ? '' : 'Bình thường')
                  });
                }
              }

              results.push({
                patient,
                selectedTests: Array.from(testMap.values()),
                conclusion,
                doctorName,
                hasExplicitCode
              });
            }
          }

          resolve(results);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      if (fileOrBuffer instanceof Blob) {
        reader.readAsArrayBuffer(fileOrBuffer);
      } else {
        reader.readAsArrayBuffer(new Blob([fileOrBuffer as ArrayBuffer]));
      }
    } catch (err) {
      reject(err);
    }
  });
}
