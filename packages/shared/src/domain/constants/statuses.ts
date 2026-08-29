// ─── DOMAIN STATUS CONSTANTS & ENUMS ─────────────────────────────────────────
import type { Gender, PaymentMethod } from '../types';

export const CLINICAL_STATUS = {
  DRAFT: 'Chờ xét nghiệm',
  RESULTED: 'Đã có kết quả',
  DELIVERED: 'Đã trả kết quả'
} as const;

export const DOCUMENT_STATUS = {
  UNEXPORTED: 'Chưa xuất PDF',
  SYNCED: 'Đã xuất Cloud',
  OUTDATED: 'Cần cập nhật PDF'
} as const;

export const BILLING_STATUS = {
  UNPAID: 'Chưa thu phí',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hủy / Hoàn tiền'
} as const;

export const SAMPLE_STATUS = {
  QUALIFIED: 'Đạt',
  UNQUALIFIED: 'Không đạt',
  COLLECTING: 'Đang lấy mẫu'
} as const;

export const REPORT_STATUS = {
  DRAFT: 'Chờ xét nghiệm',
  RESULTED: 'Đã có kết quả',
  EXPORTED: 'Đã xuất Cloud',
  OUTDATED: 'Cần cập nhật PDF',
  DELIVERED: 'Đã trả kết quả'
} as const;

export const GENDER = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác'
} as const;

export const GENDER_LIST: readonly Gender[] = [
  GENDER.MALE,
  GENDER.FEMALE,
  GENDER.OTHER
] as const;

export const PAYMENT_METHOD = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản (VietQR)',
  POS_CARD: 'Quẹt thẻ',
  OTHER: 'Khác'
} as const;

export const PAYMENT_METHOD_LIST: readonly PaymentMethod[] = [
  PAYMENT_METHOD.CASH,
  PAYMENT_METHOD.BANK_TRANSFER,
  PAYMENT_METHOD.POS_CARD,
  PAYMENT_METHOD.OTHER
] as const;

export const RESULT_STATUS = {
  NORMAL: 'normal',
  LOW: 'low',
  HIGH: 'high'
} as const;

