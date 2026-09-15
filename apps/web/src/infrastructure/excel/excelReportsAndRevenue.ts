import * as XLSX from 'xlsx';
import type { MedicalReport, Invoice, Doctor } from '@domain/types';
import { ReportKindResolver } from '@domain/valueObjects/ReportKind';

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
    'Loại Phiếu': ReportKindResolver.match(ReportKindResolver.resolve(rep.selectedTests), {
      allergen: () => 'Panel Dị Nguyên 91 Chỉ Số',
      hybrid: () => 'Kết Hợp (Chuẩn A4 + Dị Nguyên)',
      clinical: () => 'Xét Nghiệm Chuẩn A4',
    }),
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
    'Mã Hóa Đơn': inv.code || '',
    'Ngày Lập': inv.createdAt ? new Date(inv.createdAt).toLocaleString('vi-VN') : '',
    'Bệnh Nhân': inv.patientName || '',
    'Mã Bệnh Nhân': inv.patientCode || '',
    'Bác Sĩ Chỉ Định': inv.doctorName || '---',
    'Gói Xét Nghiệm': inv.packageName || 'Tùy chọn',
    'Số Dịch Vụ': inv.items?.length || 0,
    'Tổng Tiền Dịch Vụ': inv.totalAmount ?? 0,
    'Giảm Giá / Chiết Khấu': inv.discountAmount || 0,
    'Thực Thu (VNĐ)': inv.finalAmount ?? 0,
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
