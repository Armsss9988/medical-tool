/**
 * newbornScreeningLayoutService.ts
 * Pure Domain Service: Tính toán ngày tuổi, định dạng đánh giá và 8 mục lưu ý cho phiếu Sàng lọc sơ sinh 55 bệnh MS/MS.
 * Tuân thủ DDD Core: Không import React, DOM API hay thư viện ngoài.
 */

/**
 * Phân tích chuỗi ngày sang Date (chỉ lấy phần Date UTC/local không ảnh hưởng bởi giờ)
 */
function parseDateOnly(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return new Date(val.getFullYear(), val.getMonth(), val.getDate());
  }

  const str = String(val).trim();
  if (!str) return null;

  // Hỗ trợ DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Hỗ trợ YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/**
 * Tính tuổi tại ngày lấy mẫu theo công thức:
 * Tuổi tại ngày lấy mẫu = (Ngày lấy mẫu − Ngày sinh), hiển thị theo ngày (ví dụ: "3 ngày").
 */
export function calculateSamplingAgeDays(
  birthDate: string | Date | null | undefined,
  samplingDate: string | Date | null | undefined
): string {
  const birth = parseDateOnly(birthDate);
  const sampling = parseDateOnly(samplingDate);

  if (!birth || !sampling) {
    return '—';
  }

  const diffMs = sampling.getTime() - birth.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return '0 ngày';
  }

  return `${diffDays} ngày`;
}

/**
 * Chữ đánh giá riêng cho gói MS/MS:
 * trong ngưỡng → "Trong giới hạn sàng lọc"
 * lớn hơn Max  → "Cao hơn giới hạn sàng lọc ↑"
 * nhỏ hơn Min  → "Thấp hơn giới hạn sàng lọc ↓"
 */
export function formatMSMSEvaluationText(
  val: number | null,
  min: number | null,
  max: number | null
): 'Trong giới hạn sàng lọc' | 'Cao hơn giới hạn sàng lọc ↑' | 'Thấp hơn giới hạn sàng lọc ↓' | 'Chưa xác định' {
  if (val === null || val === undefined || isNaN(val)) {
    return 'Chưa xác định';
  }

  if (max !== null && max !== undefined && !isNaN(max) && val > max) {
    return 'Cao hơn giới hạn sàng lọc ↑';
  }

  if (min !== null && min !== undefined && !isNaN(min) && val < min) {
    return 'Thấp hơn giới hạn sàng lọc ↓';
  }

  return 'Trong giới hạn sàng lọc';
}

/**
 * 8 mục lưu ý cố định trên phiếu mẫu Sàng lọc 55 bệnh chuyển hóa bẩm sinh:
 * Tuyệt đối không chứa ký hiệu so sánh kép (<=, >=, <=, >=, =<, =>).
 */
export const NEWBORN_SCREENING_8_FIXED_NOTES: readonly string[] = Object.freeze([
  '1. Kết quả sàng lọc chỉ mang tính chất định hướng nguy cơ, không thay thế cho chẩn đoán xác định.',
  '2. Trẻ có kết quả "Nguy cơ cao" cần được bác sĩ chuyên khoa tư vấn, làm xét nghiệm chẩn đoán khẳng định và theo dõi lâm sàng.',
  '3. Trẻ có kết quả "Nguy cơ thấp" hầu hết không mắc các bệnh trong danh mục sàng lọc, tuy nhiên không loại trừ tuyệt đối mọi trường hợp thể nhẹ hoặc khởi phát muộn.',
  '4. Một số bệnh có ký hiệu (*) có độ nhạy sàng lọc hạn chế do đặc tính chuyển hóa sinh học hoặc ngưỡng phát hiện kỹ thuật.',
  '5. Thời điểm lấy mẫu tối ưu là từ 48 giờ đến 72 giờ sau sinh (sau khi trẻ đã bú mẹ hoặc ăn sữa đủ 24 giờ).',
  '6. Kết quả có thể bị ảnh hưởng bởi: trẻ sinh non, nhẹ cân, truyền máu, đang dùng thuốc, hoặc nuôi dưỡng qua đường tĩnh mạch.',
  '7. Mẫu máu gót chân thu thập trên giấy thấm chuyên dụng đạt tiêu chuẩn chất lượng.',
  '8. Mọi thắc mắc về kết quả xét nghiệm xin vui lòng liên hệ hotline trung tâm hoặc bác sĩ tư vấn chuyên khoa.'
]);
