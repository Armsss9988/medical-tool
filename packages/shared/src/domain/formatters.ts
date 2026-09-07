export function formatCurrency(amount: number | null | undefined): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

/**
 * Chuẩn hóa chuỗi tiếng Việt bỏ dấu và chuyển chữ thường để phục vụ tìm kiếm nhanh (ví dụ: 'Đường huyết' -> 'duong huyet')
 */
export function removeVietnameseTones(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Chuẩn hóa tên file PDF khi xuất và tải về: PhieuXN_Ten_MaPhieu.pdf
 * Đảm bảo loại bỏ các ký tự cấm của hệ điều hành (\ / : * ? " < > |),
 * thay khoảng trắng bằng gạch dưới, không thừa ký tự gạch dưới liên tiếp.
 */
export function formatReportPdfFilename(
  patientName: string | null | undefined,
  reportCode: string | null | undefined
): string {
  const rawName = (patientName || '').trim();
  const cleanName = rawName
    ? rawName
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/[\s\t\n]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
    : 'BenhNhan';

  const rawCode = (reportCode || '').trim();
  const cleanCode = rawCode
    ? rawCode
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/[\s\t\n]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
    : 'BN';

  return `PhieuXN_${cleanName || 'BenhNhan'}_${cleanCode || 'BN'}.pdf`;
}

