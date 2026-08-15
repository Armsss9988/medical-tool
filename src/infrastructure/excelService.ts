import * as XLSX from 'xlsx';
import { DEFAULT_CATALOG } from '../data/defaultCatalog';
import { CatalogItem, Invoice, Doctor } from '../domain/types';

export function parseExcelCatalog(fileOrBuffer: Blob | ArrayBuffer): Promise<CatalogItem[]> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (!e.target?.result) return resolve(DEFAULT_CATALOG);
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

          if (!rawRows || rawRows.length === 0) {
            return resolve(DEFAULT_CATALOG);
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
          });

          resolve(catalog.length > 0 ? catalog : DEFAULT_CATALOG);
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

export function exportSampleExcelCatalog(catalog: CatalogItem[] = DEFAULT_CATALOG): void {
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
