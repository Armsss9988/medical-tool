import * as XLSX from 'xlsx';
import { CatalogItem, Invoice, Doctor } from '@domain/types';

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
            const category = String(row['Nhóm xét nghiệm'] || row['Nhóm'] || row['Category'] || row['Nhom'] || 'Xét nghiệm khác');
            const code = String(row['Mã chỉ số'] || row['Mã'] || row['Code'] || row['Ma'] || '');
            const name = String(row['Tên chỉ số'] || row['Tên xét nghiệm'] || row['Name'] || row['Ten'] || code);
            
            const unit = String(row['Đơn vị'] || row['Unit'] || row['DonVi'] || '');
            let refMin: number | null = parseFloat(String(row['Min'] || row['RefMin'] || ''));
            if (isNaN(refMin)) refMin = null;
            let refMax: number | null = parseFloat(String(row['Max'] || row['RefMax'] || ''));
            if (isNaN(refMax)) refMax = null;

            const refText = String(row['Khoảng tham chiếu'] || row['Tham chiếu'] || row['RefText'] || row['Trị số tham chiếu'] || (refMin !== null && refMax !== null ? `${refMin} - ${refMax}` : 'Bình thường'));
            const price = parseFloat(String(row['Đơn giá (VNĐ)'] || row['Đơn giá'] || row['Giá tiền'] || row['Giá'] || row['Price'] || 0)) || 0;

            return {
              category: String(category).trim(),
              code: String(code).trim() || String(name).trim(),
              name: String(name).trim(),
              unit: String(unit).trim(),
              refMin,
              refMax,
              refText: String(refText).trim(),
              price
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

export function exportSampleExcelCatalog(catalog: CatalogItem[] = []): void {
  const excelData = catalog.map((item, index) => ({
    'STT': index + 1,
    'Nhóm xét nghiệm': item.category,
    'Mã chỉ số': item.code,
    'Tên chỉ số': item.name,
    'Min': item.refMin !== null ? item.refMin : '',
    'Max': item.refMax !== null ? item.refMax : '',
    'Đơn vị': item.unit,
    'Trị số tham chiếu': item.refText,
    'Đơn giá (VNĐ)': item.price || 0
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 22 }, // Nhóm
    { wch: 12 }, // Mã
    { wch: 35 }, // Tên
    { wch: 10 }, // Min
    { wch: 10 }, // Max
    { wch: 12 }, // Đơn vị
    { wch: 25 }, // Trị số tham chiếu
    { wch: 15 }  // Đơn giá
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh Mục Xét Nghiệm');
  
  XLSX.writeFile(workbook, 'danh_muc_xet_nghiem.xlsx');
}

export function exportRevenueExcel(invoices: Invoice[], doctorStats: { doctor: Doctor | { id: string; name: string }; totalRevenue: number; invoiceCount: number; percentage: number }[]): void {
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
  XLSX.utils.book_append_sheet(wb, wsDoctor, 'Doanh Thu Theo Bác Sĩ');

  const wsInvoice = XLSX.utils.json_to_sheet(invoiceRows);
  XLSX.utils.book_append_sheet(wb, wsInvoice, 'Sổ Sách Chi Tiết Hóa Đơn');

  XLSX.writeFile(wb, `BaoCaoDoanhThu_GoLab_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportReportsExcel(reports: import('@domain/types').MedicalReport[]): void {
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

// ─── BATCH IMPORT / EXPORT ──────────────────────────────────────────────────

import { BatchImportRow, SelectedTest, Patient, Gender } from '@domain/types';
import { evaluateTestIndicator } from '@domain/testResult';
import { generatePatientCode, generateSecretToken } from '@domain/patient';

/**
 * Xuất file Excel template mẫu 2 sheet để người dùng điền dữ liệu batch.
 * Sheet 1: Danh sách bệnh nhân
 * Sheet 2: Ma trận kết quả xét nghiệm (mỗi cột = 1 chỉ số, mỗi hàng = 1 BN)
 */
export function exportBatchTemplateExcel(catalog: CatalogItem[]): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Thông tin bệnh nhân
  const patientSample = [
    {
      'Mã BN (*)': 'XN-20260821-001',
      'Họ và Tên (*)': 'NGUYỄN VĂN A',
      'Năm Sinh': '1992',
      'Giới Tính': 'Nam',
      'Số Điện Thoại': '0987654321',
      'Địa Chỉ': 'Đồng Hới, Quảng Bình',
      'BS Chỉ Định': 'BS. Trần Hoài Long',
      'Kết Luận': 'Các chỉ số trong giới hạn bình thường'
    },
    {
      'Mã BN (*)': 'XN-20260821-002',
      'Họ và Tên (*)': 'TRẦN THỊ B',
      'Năm Sinh': '1985',
      'Giới Tính': 'Nữ',
      'Số Điện Thoại': '0912345678',
      'Địa Chỉ': 'Đồng Hới, Quảng Bình',
      'BS Chỉ Định': 'BS. Trần Hoài Long',
      'Kết Luận': ''
    }
  ];
  const wsPatient = XLSX.utils.json_to_sheet(patientSample);
  wsPatient['!cols'] = [
    { wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 10 },
    { wch: 16 }, { wch: 30 }, { wch: 24 }, { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(wb, wsPatient, 'Bệnh Nhân');

  // Sheet 2: Ma trận kết quả xét nghiệm
  // Header = Mã BN | Tên chỉ số 1 (code1) | Tên chỉ số 2 (code2) | ...
  const topCatalogItems = catalog.slice(0, 30); // Lấy tối đa 30 chỉ số đầu tiên làm mẫu
  const resultHeaders: Record<string, string>[] = patientSample.map((p) => {
    const row: Record<string, string> = { 'Mã BN (*)': p['Mã BN (*)'] };
    topCatalogItems.forEach((item) => {
      const colName = `${item.name} [${item.code}]`;
      row[colName] = '';
    });
    return row;
  });

  const wsResult = XLSX.utils.json_to_sheet(resultHeaders);
  const resultCols: { wch: number }[] = [{ wch: 22 }];
  topCatalogItems.forEach(() => resultCols.push({ wch: 18 }));
  wsResult['!cols'] = resultCols;
  XLSX.utils.book_append_sheet(wb, wsResult, 'Kết Quả XN');

  XLSX.writeFile(wb, `GoLab_Batch_Template_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Đọc file Excel batch 2 sheet → parse thành BatchImportRow[].
 * Sheet 1 ("Bệnh Nhân"): thông tin bệnh nhân
 * Sheet 2 ("Kết Quả XN"): ma trận kết quả, header có dạng "Tên chỉ số [MÃ_CODE]"
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

          if (workbook.SheetNames.length < 2) {
            return reject(new Error('File Excel cần có ít nhất 2 Sheet: "Bệnh Nhân" và "Kết Quả XN"'));
          }

          // Parse Sheet 1: Bệnh Nhân
          const wsPatient = workbook.Sheets[workbook.SheetNames[0]];
          const patientRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsPatient, { defval: '' });

          // Parse Sheet 2: Kết Quả XN
          const wsResult = workbook.Sheets[workbook.SheetNames[1]];
          const resultRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsResult, { defval: '' });

          // Build lookup: code BN → result row
          const resultByCode = new Map<string, Record<string, unknown>>();
          for (const row of resultRows) {
            const code = String(row['Mã BN (*)'] || row['Mã BN'] || row['Code'] || '').trim();
            if (code) resultByCode.set(code, row);
          }

          // Build catalog lookup: code → CatalogItem
          const catalogByCode = new Map<string, CatalogItem>();
          const catalogByName = new Map<string, CatalogItem>();
          for (const item of catalog) {
            catalogByCode.set(item.code.trim().toLowerCase(), item);
            catalogByName.set(item.name.trim().toLowerCase(), item);
          }

          // Parse từng bệnh nhân
          const results: BatchImportRow[] = [];

          for (const pRow of patientRows) {
            const code = String(pRow['Mã BN (*)'] || pRow['Mã BN'] || pRow['Code'] || '').trim();
            const name = String(pRow['Họ và Tên (*)'] || pRow['Họ và Tên'] || pRow['Họ Tên'] || pRow['Name'] || '').trim();

            if (!name) continue; // Bỏ qua hàng trống

            const patient: Patient = {
              code: code || generatePatientCode(),
              secretToken: generateSecretToken(),
              name: name.toUpperCase(),
              dob: String(pRow['Năm Sinh'] || pRow['Ngày Sinh'] || pRow['DOB'] || ''),
              gender: (String(pRow['Giới Tính'] || pRow['Gender'] || 'Nam').trim() as Gender) || 'Nam',
              phone: String(pRow['Số Điện Thoại'] || pRow['SĐT'] || pRow['Phone'] || ''),
              address: String(pRow['Địa Chỉ'] || pRow['Address'] || ''),
              diagnosis: String(pRow['Chẩn Đoán'] || pRow['Diagnosis'] || '')
            };

            const doctorName = String(pRow['BS Chỉ Định'] || pRow['Bác Sĩ'] || pRow['Doctor'] || 'BS. Trần Hoài Long');
            const conclusion = String(pRow['Kết Luận'] || pRow['Conclusion'] || '');

            // Map kết quả xét nghiệm từ Sheet 2
            const selectedTests: SelectedTest[] = [];
            const resultRow = resultByCode.get(patient.code);

            if (resultRow) {
              // Iterate qua tất cả cột của result row (trừ cột Mã BN)
              for (const [colHeader, rawValue] of Object.entries(resultRow)) {
                if (colHeader === 'Mã BN (*)' || colHeader === 'Mã BN' || colHeader === 'Code') continue;

                const resultStr = String(rawValue || '').trim();
                if (!resultStr) continue; // Bỏ qua ô trống

                // Tìm chỉ số trong catalog theo header format "Tên chỉ số [CODE]"
                let catalogItem: CatalogItem | undefined;

                const codeMatch = colHeader.match(/\[([^\]]+)\]/);
                if (codeMatch) {
                  const extractedCode = codeMatch[1].trim().toLowerCase();
                  catalogItem = catalogByCode.get(extractedCode);
                }

                if (!catalogItem) {
                  // Fallback: tìm theo tên chỉ số (bỏ phần [CODE] nếu có)
                  const cleanName = colHeader.replace(/\s*\[[^\]]*\]\s*$/, '').trim().toLowerCase();
                  catalogItem = catalogByName.get(cleanName);
                }

                if (!catalogItem) {
                  // Nếu vẫn không tìm thấy, tạo chỉ số tạm thời
                  catalogItem = {
                    category: 'Nhập từ Excel',
                    code: colHeader.replace(/\s*\[[^\]]*\]\s*$/, '').trim(),
                    name: colHeader.replace(/\s*\[[^\]]*\]\s*$/, '').trim(),
                    refMin: null,
                    refMax: null,
                    unit: '',
                    refText: ''
                  };
                }

                // Auto evaluate result
                const evalRes = evaluateTestIndicator(
                  catalogItem.code,
                  catalogItem.category,
                  catalogItem.unit,
                  resultStr,
                  catalogItem.refMin,
                  catalogItem.refMax
                );
                const autoNote = evalRes.label || 'Bình thường';

                selectedTests.push({
                  ...catalogItem,
                  result: resultStr,
                  note: autoNote
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

