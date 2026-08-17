import { 
  ExportStepName, 
  ExportStepResult, 
  ExportTransactionResult, 
  PdfFileRecord,
  ExportErrorDetail 
} from '@domain/exportTransaction';
import { generateHighQualityPdf } from './pdfService';
import { uploadPdfToCloud } from './cloudService';
import { generateQrCodeDataUrl } from './qrService';
import { addLedgerRecord, getNextVersionForReport } from './pdfLedger';
import { cleanupOldVersions, deleteSupabaseFile } from './cloudFileManager';

export interface TransactionStepCallback {
  onStepStart?: (step: ExportStepName) => void;
  onStepSuccess?: (step: ExportStepName, result: any) => void;
  onStepError?: (step: ExportStepName, error: Error) => void;
  onRollback?: (step: ExportStepName) => void;
}

export class PdfExportTransaction {
  private executedSteps: ExportStepResult[] = [];
  private rollbackActions: Array<() => Promise<void>> = [];

  constructor(
    private elementId: string,
    private filename: string,
    private patientCode: string,
    private patientName: string,
    private callbacks?: TransactionStepCallback
  ) {}

  public async execute(): Promise<ExportTransactionResult> {
    let pdfBlob: Blob | null = null;
    let pdfBase64: string | null = null;
    let cloudUrl: string | null = null;
    let qrDataUrl: string | null = null;
    let uploadedFilename: string | null = null;
    let version = 1;

    try {
      // -------------------------------------------------------------
      // BƯỚC 1: RENDER LOSSLESS PDF
      // -------------------------------------------------------------
      this.callbacks?.onStepStart?.('render_pdf');
      const t1Start = Date.now();
      
      const pdfRes = await generateHighQualityPdf(this.elementId, this.filename);
      pdfBlob = pdfRes.blob;
      pdfBase64 = pdfRes.base64;

      this.executedSteps.push({
        step: 'render_pdf',
        status: 'success',
        durationMs: Date.now() - t1Start,
        data: { sizeBytes: pdfBlob.size }
      });
      this.callbacks?.onStepSuccess?.('render_pdf', { sizeBytes: pdfBlob.size });

      // -------------------------------------------------------------
      // BƯỚC 2: UPLOAD CLOUD STORAGE (SUPABASE -> CLOUDINARY -> LOCAL)
      // -------------------------------------------------------------
      this.callbacks?.onStepStart?.('upload_cloud');
      const t2Start = Date.now();

      // Xác định phiên bản tiếp theo cho bệnh nhân này
      version = await getNextVersionForReport(this.patientCode);
      const versionedFilename = this.filename.replace(/\.pdf$/i, `_v${version}.pdf`);

      const uploadRes = await uploadPdfToCloud(pdfBlob, versionedFilename);
      cloudUrl = uploadRes.url;
      uploadedFilename = uploadRes.filename || versionedFilename;

      // Đăng ký hành động Rollback nếu các bước sau thất bại
      if (uploadRes.provider === 'supabase' && uploadRes.url) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://omydjydyavugxmqzffka.supabase.co';
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
        
        this.rollbackActions.push(async () => {
          await deleteSupabaseFile(supabaseUrl, anonKey, 'reports', uploadedFilename!);
        });
      }

      this.executedSteps.push({
        step: 'upload_cloud',
        status: 'success',
        durationMs: Date.now() - t2Start,
        data: { url: cloudUrl, provider: uploadRes.provider, version }
      });
      this.callbacks?.onStepSuccess?.('upload_cloud', { url: cloudUrl, provider: uploadRes.provider });

      // -------------------------------------------------------------
      // BƯỚC 3: GENERATE QR CODE TRA CỨU
      // -------------------------------------------------------------
      this.callbacks?.onStepStart?.('generate_qr');
      const t3Start = Date.now();

      qrDataUrl = await generateQrCodeDataUrl(cloudUrl);

      this.executedSteps.push({
        step: 'generate_qr',
        status: 'success',
        durationMs: Date.now() - t3Start,
        data: { qrDataUrl }
      });
      this.callbacks?.onStepSuccess?.('generate_qr', { qrDataUrl });

      // -------------------------------------------------------------
      // BƯỚC 4: SAVE METADATA & VERSION LEDGER
      // -------------------------------------------------------------
      this.callbacks?.onStepStart?.('save_metadata');
      const t4Start = Date.now();

      const record: PdfFileRecord = {
        id: crypto.randomUUID(),
        reportId: this.patientCode,
        patientCode: this.patientCode,
        patientName: this.patientName,
        filename: uploadedFilename || versionedFilename,
        version: version,
        cloudProvider: uploadRes.provider as any,
        cloudUrl: cloudUrl,
        qrDataUrl: qrDataUrl,
        fileSizeBytes: pdfBlob.size,
        createdAt: new Date().toISOString(),
        isLatest: true
      };

      await addLedgerRecord(record);

      // Dọn dẹp phiên bản cũ (giữ tối đa 3 phiên bản gần nhất)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://omydjydyavugxmqzffka.supabase.co';
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      await cleanupOldVersions(this.patientCode, 3, { url: supabaseUrl, anonKey });

      this.executedSteps.push({
        step: 'save_metadata',
        status: 'success',
        durationMs: Date.now() - t4Start,
        data: { recordId: record.id }
      });
      this.callbacks?.onStepSuccess?.('save_metadata', { recordId: record.id });

      // -------------------------------------------------------------
      // BƯỚC 5: NOTIFY COMPLETE
      // -------------------------------------------------------------
      this.callbacks?.onStepStart?.('notify_complete');
      this.executedSteps.push({
        step: 'notify_complete',
        status: 'success',
        durationMs: 0
      });
      this.callbacks?.onStepSuccess?.('notify_complete', { success: true });

      return {
        success: true,
        finalUrl: cloudUrl,
        finalQrCodeDataUrl: qrDataUrl,
        version: version,
        executedSteps: this.executedSteps,
        rolledBack: false
      };

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('💥 Transaction xuất PDF thất bại! Đang tiến hành Rollback...', error);

      // Kích hoạt Rollback toàn bộ các thay đổi
      await this.rollback();

      return {
        success: false,
        finalUrl: null,
        finalQrCodeDataUrl: null,
        version: 0,
        executedSteps: this.executedSteps,
        rolledBack: true,
        error: error.message
      };
    }
  }

  private async rollback(): Promise<void> {
    for (const action of this.rollbackActions.reverse()) {
      try {
        await action();
      } catch (rbErr) {
        console.error('Lỗi khi thực thi Rollback action:', rbErr);
      }
    }
    this.callbacks?.onRollback?.(
      this.executedSteps[this.executedSteps.length - 1]?.step || 'render_pdf'
    );
  }
}
