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

/**
 * Định dạng số thập phân theo quy chuẩn y khoa GoLab:
 * - Sử dụng dấu phẩy (,) làm dấu thập phân (vi-VN)
 * - Nếu có `decimalPlaces` (>= 0), giữ cố định số chữ số thập phân (VD: 4.2 -> '4,20', 1150 -> '1150')
 * - Nếu không có `decimalPlaces`, thay thế dấu chấm (.) thành dấu phẩy (,)
 */
export function formatDecimalNumber(
  value: number | string | null | undefined,
  decimalPlaces?: number | null
): string {
  if (value === null || value === undefined) return '';
  const strVal = String(value).trim();
  if (!strVal) return '';

  const cleanNumStr = strVal.replace(',', '.');
  const num = parseFloat(cleanNumStr);
  if (isNaN(num)) return strVal;

  if (decimalPlaces !== undefined && decimalPlaces !== null && !isNaN(decimalPlaces) && decimalPlaces >= 0) {
    const fixed = num.toFixed(decimalPlaces);
    return fixed.replace('.', ',');
  }

  return strVal.replace('.', ',');
}

/**
 * Chuẩn hóa chuỗi tham chiếu y khoa theo chỉ đạo GoLab (10/10/2026):
 * 1. Chỉ dùng dấu < và > (Min – Max, < Max, > Min)
 * 2. Tuyệt đối loại bỏ các ký hiệu <=, >=, ≤, ≥, =<, =>
 * 3. Hỗ trợ tham chiếu dạng chữ (refText) nguyên văn sau khi làm sạch ký tự cấm
 */
export function formatReferenceRange(
  min: number | null | undefined,
  max: number | null | undefined,
  refText?: string | null,
  decimalPlaces?: number | null
): string {
  if (refText && refText.trim()) {
    return refText
      .trim()
      .replace(/[≤]/g, '<')
      .replace(/[≥]/g, '>')
      .replace(/<=\s*/g, '< ')
      .replace(/>=\s*/g, '> ')
      .replace(/=<\s*/g, '< ')
      .replace(/=>\s*/g, '> ')
      .replace(/<\s+/g, '< ')
      .replace(/>\s+/g, '> ')
      .replace(/(\d+)\.(\d+)/g, '$1,$2');
  }

  const hasMin = min !== null && min !== undefined && !isNaN(min);
  const hasMax = max !== null && max !== undefined && !isNaN(max);

  const numMin = hasMin ? Number(min) : null;
  const numMax = hasMax ? Number(max) : null;

  // Có Min (> 0) và có Max: Min – Max (ví dụ 9,0 – 55,0)
  if (numMin !== null && numMin > 0 && numMax !== null && numMax > 0) {
    const formattedMin = formatDecimalNumber(numMin, decimalPlaces);
    const formattedMax = formatDecimalNumber(numMax, decimalPlaces);
    return `${formattedMin} – ${formattedMax}`;
  }

  // Chỉ có Max, hoặc Min = 0: < Max (ví dụ < 4,20)
  if (numMax !== null && (numMin === null || numMin === 0)) {
    const formattedMax = formatDecimalNumber(numMax, decimalPlaces);
    return `< ${formattedMax}`;
  }

  // Chỉ có Min (> 0): > Min (ví dụ > 8,0)
  if (numMin !== null && numMin > 0 && numMax === null) {
    const formattedMin = formatDecimalNumber(numMin, decimalPlaces);
    return `> ${formattedMin}`;
  }

  return '---';
}

