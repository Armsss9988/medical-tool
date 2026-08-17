/**
 * pdfExportTransaction.ts
 * Core class quản lý toàn bộ pipeline xuất PDF theo mô hình Transaction:
 * - Thực thi tuần tự 5 bước: render → upload → QR → save → notify
 * - Rollback tự động khi bất kỳ bước nào thất bại
 * - Retry thủ công thông qua `.retry()`
 * - Nút retry chỉ hiển thị khi `retryable = true`
 */

import { exportToPdfFull } from './pdfService';
import { uploadPdfToCloudinary } from './cloudService';
import { generateQrCodeDataUrl } from './qrService';
import { addLedgerEntry, getOldVersionFilenames } from './pdfLedger';
import { deleteSupabaseFile, deleteCloudinaryFile, cleanupOldVersions } from './cloudFileManager';
import { DEFAULT_CLOUD_DB_CONFIG } from './cloudDbService';
import {
  ExportStepName,
  ExportStepStatus,
  ExportStepResult,
  ExportTransactionResult,
  ExportTransactionParams,
  PdfFileRecord
} from '../domain/exportTransaction';

export class PdfExportTransaction {
  private steps: ExportStepResult[] = [];
  readonly transactionId: string;
  private rollbackActions: Array<() => Promise<string>> = [];

  // Lưu kết quả trung gian giữa các bước
  private pdfBase64 = '';
  private pdfBlob: Blob | null = null;
  private cloudUrl = '';
  private cloudProvider: 'supabase' | 'cloudinary' | 'local' = 'local';
  private cloudPublicId = '';
  private qrCodeDataUrl = '';
  private ledgerRecord: PdfFileRecord | null = null;

  constructor() {
    this.transactionId = `TX-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // ─── Thực thi toàn bộ pipeline ──────────────────────────────────────────────
  async execute(params: ExportTransactionParams): Promise<ExportTransactionResult> {
    const txStart = performance.now();
    this.steps = [];
    this.rollbackActions = [];

    const {
      elementId,
      filename,
      reportCode,
      patientName,
      supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || DEFAULT_CLOUD_DB_CONFIG.supabaseUrl || '',
      supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || DEFAULT_CLOUD_DB_CONFIG.supabaseAnonKey || '',
      cloudName = 'wzy6qu56',
      uploadPreset = 'golab-clinic',
      onProgress
    } = params;

    const notify = (step: ExportStepName, status: ExportStepStatus) => {
      onProgress?.(step, status);
    };

    // ── STEP 1: Render PDF ────────────────────────────────────────────────────
    notify('render_pdf', 'running');
    const step1 = await this.runStep('render_pdf', async () => {
      const res = await exportToPdfFull(elementId, filename, true);
      if (!res?.pdfBase64) throw new Error('exportToPdfFull trả về kết quả rỗng');
      this.pdfBase64 = res.pdfBase64;
      this.pdfBlob = res.pdfBlob ?? null;
      return { fileSize: res.pdfBlob?.size };
    });
    notify('render_pdf', step1.status);
    if (step1.status === 'failed') return this.buildResult(txStart, false);

    // ── STEP 2: Upload Cloud ──────────────────────────────────────────────────
    notify('upload_cloud', 'running');
    const step2 = await this.runStep('upload_cloud', async () => {
      const cloudRes = await uploadPdfToCloudinary({
        pdfBase64: this.pdfBase64,
        filename,
        supabaseUrl,
        supabaseAnonKey,
        cloudName,
        uploadPreset
      });
      this.cloudUrl = cloudRes.url;
      this.cloudPublicId = cloudRes.publicId || '';

      // Xác định provider từ URL
      if (this.cloudUrl.startsWith('data:')) {
        this.cloudProvider = 'local';
      } else if (this.cloudUrl.includes('cloudinary.com')) {
        this.cloudProvider = 'cloudinary';
      } else {
        this.cloudProvider = 'supabase';
      }

      // Đăng ký rollback action: xóa file trên Cloud nếu các bước sau fail
      const uploadedFilename = this.cloudPublicId || filename;

      if (this.cloudProvider === 'supabase' && supabaseUrl && supabaseAnonKey) {
        this.rollbackActions.push(async () => {
          const deleted = await deleteSupabaseFile(uploadedFilename, { url: supabaseUrl, anonKey: supabaseAnonKey });
          return deleted ? `Đã xóa file Supabase: ${uploadedFilename}` : `Không thể xóa file Supabase: ${uploadedFilename}`;
        });
      } else if (this.cloudProvider === 'cloudinary' && this.cloudPublicId) {
        this.rollbackActions.push(async () => {
          const deleted = await deleteCloudinaryFile(this.cloudPublicId, { cloudName, uploadPreset });
          return deleted ? `Đã xóa file Cloudinary: ${this.cloudPublicId}` : `Không thể xóa file Cloudinary: ${this.cloudPublicId}`;
        });
      }

      return { provider: this.cloudProvider, url: this.cloudUrl };
    });
    notify('upload_cloud', step2.status);
    if (step2.status === 'failed') return this.buildResult(txStart, false);

    // ── STEP 3: Tạo QR Code ───────────────────────────────────────────────────
    notify('generate_qr', 'running');
    const step3 = await this.runStep('generate_qr', async () => {
      this.qrCodeDataUrl = await generateQrCodeDataUrl(this.cloudUrl);
      if (!this.qrCodeDataUrl) throw new Error('generateQrCodeDataUrl trả về chuỗi rỗng');
      return { qrLength: this.qrCodeDataUrl.length };
    });
    notify('generate_qr', step3.status);
    if (step3.status === 'failed') {
      // QR fail → rollback file đã upload
      const rollbackDetails = await this.rollback();
      return this.buildResult(txStart, false, rollbackDetails);
    }

    // ── STEP 4: Lưu Metadata & Ledger ────────────────────────────────────────
    notify('save_metadata', 'running');
    const step4 = await this.runStep('save_metadata', async () => {
      const uploadedFilename = this.cloudPublicId || filename;

      // Cleanup version cũ trên Cloud (giữ MAX_VERSIONS = 3)
      const oldFiles = await getOldVersionFilenames(reportCode);
      if (oldFiles.length > 0 && supabaseUrl && supabaseAnonKey) {
        const supabaseOldFiles = oldFiles
          .filter((f) => f.cloudProvider === 'supabase')
          .map((f) => f.filename);
        if (supabaseOldFiles.length > 0) {
          await cleanupOldVersions(supabaseOldFiles, { url: supabaseUrl, anonKey: supabaseAnonKey });
        }
      }

      // Thêm bản ghi vào ledger
      this.ledgerRecord = await addLedgerEntry({
        reportCode,
        patientName,
        filename: uploadedFilename,
        cloudProvider: this.cloudProvider,
        cloudUrl: this.cloudUrl,
        publicId: this.cloudPublicId || undefined,
        fileSize: this.pdfBlob?.size,
        createdAt: new Date().toISOString(),
        qrCodeDataUrl: this.qrCodeDataUrl,
        transactionId: this.transactionId
      });
      return { ledgerVersion: this.ledgerRecord.version };
    });
    notify('save_metadata', step4.status);
    if (step4.status === 'failed') {
      const rollbackDetails = await this.rollback();
      return this.buildResult(txStart, false, rollbackDetails);
    }

    // ── STEP 5: Hoàn tất ─────────────────────────────────────────────────────
    notify('notify_complete', 'running');
    this.addStep('notify_complete', 'success', performance.now(), 0);
    notify('notify_complete', 'success');

    return this.buildResult(txStart, true);
  }

  // ─── Rollback: thực thi tất cả rollback action theo thứ tự ngược ────────────
  async rollback(): Promise<string[]> {
    const details: string[] = [];
    const reversed = [...this.rollbackActions].reverse();
    for (const action of reversed) {
      try {
        const msg = await action();
        details.push(msg);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        details.push(`Rollback error: ${msg}`);
        console.error('[PdfExportTransaction] Rollback action failed:', err);
      }
    }
    return details;
  }

  // ─── Chạy 1 step với error handling ─────────────────────────────────────────
  private async runStep(
    stepName: ExportStepName,
    fn: () => Promise<Record<string, unknown> | undefined>
  ): Promise<ExportStepResult> {
    const start = performance.now();
    try {
      const data = await fn();
      const duration = performance.now() - start;
      return this.addStep(stepName, 'success', start, duration, undefined, data);
    } catch (err) {
      const duration = performance.now() - start;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[PdfExportTransaction] Step "${stepName}" failed:`, err);
      return this.addStep(stepName, 'failed', start, duration, errorMsg);
    }
  }

  private addStep(
    step: ExportStepName,
    status: ExportStepStatus,
    startedAt: number,
    durationMs: number,
    error?: string,
    data?: Record<string, unknown>
  ): ExportStepResult {
    const result: ExportStepResult = { step, status, startedAt, durationMs, error, data };
    // Cập nhật nếu step đã tồn tại
    const idx = this.steps.findIndex((s) => s.step === step);
    if (idx >= 0) {
      this.steps[idx] = result;
    } else {
      this.steps.push(result);
    }
    return result;
  }

  // ─── Build kết quả cuối cùng ─────────────────────────────────────────────────
  private buildResult(
    txStart: number,
    success: boolean,
    rollbackDetails: string[] = []
  ): ExportTransactionResult {
    return {
      transactionId: this.transactionId,
      success,
      steps: this.steps,
      totalDurationMs: performance.now() - txStart,
      finalUrl: success ? this.cloudUrl : undefined,
      finalQrCodeDataUrl: success ? this.qrCodeDataUrl : undefined,
      cloudProvider: success ? this.cloudProvider : undefined,
      rollbackPerformed: rollbackDetails.length > 0,
      rollbackDetails
    };
  }

  // ─── Truy vấn trạng thái step cụ thể ────────────────────────────────────────
  getStep(name: ExportStepName): ExportStepResult | undefined {
    return this.steps.find((s) => s.step === name);
  }

  getFailedStep(): ExportStepResult | undefined {
    return this.steps.find((s) => s.status === 'failed');
  }
}
