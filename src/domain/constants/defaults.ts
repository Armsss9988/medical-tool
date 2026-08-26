// ─── APPLICATION DEFAULTS ───────────────────────────────────────────────────
// Single source of truth for all hardcoded fallback values.
// RULE: Never use literal strings for defaults in components/hooks/App.tsx.
//       Always reference this file.

export const DEFAULTS = {
  /** Bác sĩ mặc định khi không có doctor được chỉ định */
  DOCTOR_NAME: 'BS. Trần Hoài Long',

  /** Prefix mã bệnh nhân */
  PATIENT_CODE_PREFIX: 'BN',

  /** Số lượng phiên bản PDF tối đa giữ lại trên Cloud (cũ hơn sẽ bị dọn) */
  MAX_PDF_VERSIONS: 3,

  /** Thời gian hiển thị Toast notification (ms) */
  TOAST_DURATION_MS: 4000,

  /** CSS selector cho ảnh QR Code trong DOM (dùng để inject QR trước khi render PDF) */
  QR_IMAGE_SELECTOR: 'img[alt*="QR"], img[data-qr="true"]',

  /** Tên mặc định cho bệnh nhân khi chưa nhập */
  PATIENT_NAME_FALLBACK: 'BenhNhan',

  /** Mã bệnh nhân fallback khi không có mã hợp lệ */
  PATIENT_CODE_FALLBACK: 'BN-GOLAB',

  /** Tên nhân viên thu ngân mặc định */
  CASHIER_NAME: 'Thu ngân viện',

  /** Tên gói xét nghiệm mặc định */
  PACKAGE_NAME: 'Tùy chọn',
} as const;

export type DefaultKey = keyof typeof DEFAULTS;
