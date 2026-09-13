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

/**
 * Định dạng ngày giờ hiển thị trên phiếu in y khoa và giao diện:
 * - Chuỗi ISO-8601 hợp lệ -> 'DD/MM/YYYY HH:mm' (hoặc 'DD/MM/YYYY' nếu không có giờ/phút)
 * - Chuỗi rỗng / null / undefined -> trả về fallback ('---' hoặc 'Chưa thu phí')
 * - Chuỗi định dạng sẵn hợp lệ -> giữ nguyên
 */
export function formatDisplayDate(dateStr: string | null | undefined, fallback: string = '---'): string {
  if (!dateStr || !dateStr.trim()) return fallback;
  const trimmed = dateStr.trim();
  if (trimmed === 'Chưa thu phí' || trimmed === '---') return trimmed;

  // Nếu đã là dạng DD/MM/YYYY hoặc chuỗi thông thường không chứa T/Z
  if (!trimmed.includes('T') && !trimmed.includes('Z') && !/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed;
  }

  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return trimmed;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  if (trimmed.includes('T') || hours !== '00' || minutes !== '00') {
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  return `${day}/${month}/${year}`;
}

