export type ExportStepName = 
  | 'render_pdf'
  | 'upload_cloud'
  | 'generate_qr'
  | 'save_metadata'
  | 'notify_complete';

export type ExportStepStatus = 'idle' | 'running' | 'success' | 'failed' | 'rolled_back';

export interface ExportStepResult<T = any> {
  step: ExportStepName;
  status: ExportStepStatus;
  data?: T;
  error?: string;
  durationMs: number;
}

export interface ExportTransactionResult {
  success: boolean;
  finalUrl: string | null;
  finalQrCodeDataUrl: string | null;
  version: number;
  executedSteps: ExportStepResult[];
  rolledBack: boolean;
  error?: string;
}

export interface PdfFileRecord {
  id: string;
  reportId: string;
  patientCode: string;
  patientName: string;
  filename: string;
  version: number;
  cloudProvider: 'supabase' | 'cloudinary' | 'local';
  cloudUrl: string;
  qrDataUrl?: string;
  fileSizeBytes?: number;
  createdAt: string;
  isLatest: boolean;
}

export interface ExportErrorDetail {
  step: ExportStepName;
  message: string;
  timestamp: string;
  retryable: boolean;
}

export const EXPORT_STEP_ORDER: ExportStepName[] = [
  'render_pdf',
  'upload_cloud',
  'generate_qr',
  'save_metadata',
  'notify_complete'
];

export const EXPORT_STEP_LABELS: Record<ExportStepName, string> = {
  render_pdf: '1. Khởi tạo & Render Lossless PDF',
  upload_cloud: '2. Tải lên Cloud Storage (3 tầng)',
  generate_qr: '3. Tạo mã QR tra cứu trực tiếp',
  save_metadata: '4. Ghi nhận Ledger & Dọn dẹp phiên bản cũ',
  notify_complete: '5. Hoàn tất & Đồng bộ trạng thái'
};
