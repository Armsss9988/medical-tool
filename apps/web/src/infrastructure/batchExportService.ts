import JSZip from 'jszip';
import { MedicalReport, ClinicInfo, BatchExportProgress } from '@domain/types';
import { formatReportPdfFilename } from '@domain';
import { ReportKindResolver } from '@domain/valueObjects/ReportKind';
import { PdfExportTransaction } from './pdfExportTransaction';

export interface BatchExportCallbacks {
  onProgress: (progress: BatchExportProgress) => void;
  /** Called before each report render — App.tsx should update the hidden render component's data */
  onSetRenderData: (report: MedicalReport) => Promise<void>;
}

/**
 * Pipeline xuất PDF đồng loạt cho danh sách phiếu.
 * Sử dụng chung duy nhất Engine: PdfExportTransaction cho từng phiếu để đảm bảo tính nhất quán 100%.
 *
 * Cuối cùng: Hỗ trợ nén toàn bộ blob thành ZIP khi người dùng yêu cầu.
 */
export async function batchExportPdfs(
  reports: MedicalReport[],
  _clinicInfo: ClinicInfo,
  callbacks: BatchExportCallbacks,
  cancelRef: { current: boolean }
): Promise<BatchExportProgress> {
  const progress: BatchExportProgress = {
    total: reports.length,
    completed: 0,
    current: '',
    status: 'running',
    errors: [],
    results: []
  };

  callbacks.onProgress({ ...progress });

  for (const report of reports) {
    // Check cancel
    if (cancelRef.current) {
      progress.status = 'cancelled';
      callbacks.onProgress({ ...progress });
      break;
    }

    const patientName = report.patient?.name || 'BenhNhan';
    progress.current = patientName;
    callbacks.onProgress({ ...progress });

    try {
      // 1. Set data cho hidden render component
      await callbacks.onSetRenderData(report);

      // 2. Chờ DOM re-render hoàn tất
      await waitForDomRender(400);

      // 3. Phân giải loại báo cáo chính xác bằng ADT ReportKind (hỗ trợ cả Hỗn Hợp, Dị Nguyên và Tiêu Chuẩn)
      const reportKind = ReportKindResolver.resolve(report.selectedTests, { isBatch: true });
      const elementId = reportKind.elementId;
      const filename = formatReportPdfFilename(patientName, report.code);

      // 4. Ủy quyền toàn bộ tiến trình xuất và đồng bộ Cloud cho Engine duy nhất: PdfExportTransaction
      const tx = new PdfExportTransaction(
        elementId,
        filename,
        report.code,
        patientName,
        {
          currentVersion: report.pdfVersion,
          cloudPdfUrl: report.cloudPdfUrl,
          autoDownloadLocal: false // Xuất hàng loạt không trigger tải riêng lẻ từng file
        }
      );

      const result = await tx.execute();

      if (!result.success || !result.finalUrl || !result.blob) {
        throw new Error(result.error || 'Giao dịch Transaction xuất PDF thất bại');
      }

      // 5. Thu thập kết quả
      progress.results.push({
        code: report.code,
        patientName: patientName,
        cloudUrl: result.finalUrl,
        qrDataUrl: result.finalQrCodeDataUrl || '',
        blob: result.blob,
        version: result.version
      });

      progress.completed++;
      callbacks.onProgress({ ...progress });

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
      console.error(`[BatchExport] Lỗi khi xuất phiếu ${report.code}:`, err);

      progress.errors.push({
        code: report.code,
        patientName: patientName,
        error: errMsg
      });
      progress.completed++;
      callbacks.onProgress({ ...progress });
    }
  }

  if (progress.status !== 'cancelled') {
    progress.status = progress.errors.length > 0 && progress.results.length === 0 ? 'error' : 'done';
  }

  progress.current = '';
  callbacks.onProgress({ ...progress });

  return progress;
}

/**
 * Nén toàn bộ PDF blobs thành 1 file ZIP và trigger download.
 */
export async function downloadBatchZip(
  results: Array<{ code: string; patientName: string; blob: Blob }>
): Promise<void> {
  if (results.length === 0) return;

  const zip = new JSZip();

  for (const item of results) {
    const filename = formatReportPdfFilename(item.patientName, item.code);
    zip.file(filename, item.blob);
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  // Trigger browser download
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = `GoLab_BatchPDF_${ts}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Chờ DOM re-render hoàn tất (React async setState + browser paint)
 */
function waitForDomRender(ms: number = 300): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, ms);
    });
  });
}
