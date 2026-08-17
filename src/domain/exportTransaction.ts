/**
 * exportTransaction.ts
 * Domain types cho hệ thống quản lý xuất PDF dạng Transaction với Rollback.
 */

// ─── Tên các bước trong pipeline xuất PDF ────────────────────────────────────
export type ExportStepName =
  | 'render_pdf'      // Render HTML → Canvas → jsPDF
  | 'upload_cloud'    // Upload lên Supabase → Cloudinary → Local Fallback
  | 'generate_qr'     // Tạo QR Code từ Cloud URL
  | 'save_metadata'   // Lưu report metadata + ledger entry
  | 'notify_complete';// Hoàn tất, thông báo UI

// ─── Trạng thái mỗi bước ─────────────────────────────────────────────────────
export type ExportStepStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'rolled_back'
  | 'skipped';

// ─── Kết quả chi tiết mỗi bước ───────────────────────────────────────────────
export interface ExportStepResult {
  step: ExportStepName;
  status: ExportStepStatus;
  startedAt: number;     // performance.now()
  durationMs: number;
  error?: string;
  data?: Record<string, unknown>;
}

// ─── Kết quả toàn bộ transaction ─────────────────────────────────────────────
export interface ExportTransactionResult {
  transactionId: string;
  success: boolean;
  steps: ExportStepResult[];
  totalDurationMs: number;
  finalUrl?: string;
  finalQrCodeDataUrl?: string;
  cloudProvider?: 'supabase' | 'cloudinary' | 'local';
  rollbackPerformed: boolean;
  rollbackDetails: string[];
}

// ─── Metadata 1 file PDF trên Cloud (quản lý version) ────────────────────────
export interface PdfFileRecord {
  id: string;
  reportCode: string;          // Mã phiếu / mã bệnh nhân
  patientName: string;
  filename: string;             // Tên file đúng trên Cloud
  cloudProvider: 'supabase' | 'cloudinary' | 'local';
  cloudUrl: string;
  publicId?: string;            // Cloudinary public_id (dùng khi xóa)
  fileSize?: number;            // Bytes (nếu có)
  version: number;              // Tăng dần mỗi lần re-export
  createdAt: string;            // ISO 8601
  isLatest: boolean;            // true = version hiện hành
  qrCodeDataUrl?: string;
  transactionId?: string;       // Liên kết với transaction đã tạo ra nó
}

// ─── Chi tiết lỗi để hiển thị trong UI ───────────────────────────────────────
export interface ExportErrorDetail {
  step: ExportStepName;
  message: string;
  timestamp: string;
  retryable: boolean;
}

// ─── Tham số đầu vào khi thực thi transaction ────────────────────────────────
export interface ExportTransactionParams {
  elementId: string;
  filename: string;
  reportCode: string;
  patientName: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  cloudName?: string;
  uploadPreset?: string;
  onProgress?: (step: ExportStepName, status: ExportStepStatus) => void;
}

// ─── Label hiển thị tiến trình cho từng bước ─────────────────────────────────
export const EXPORT_STEP_LABELS: Record<ExportStepName, string> = {
  render_pdf: '📄 Đang render PDF...',
  upload_cloud: '☁️ Đang upload lên Cloud...',
  generate_qr: '🔲 Đang tạo QR Code...',
  save_metadata: '💾 Đang lưu thông tin...',
  notify_complete: '✅ Hoàn tất!'
};

export const EXPORT_STEP_ORDER: ExportStepName[] = [
  'render_pdf',
  'upload_cloud',
  'generate_qr',
  'save_metadata',
  'notify_complete'
];
