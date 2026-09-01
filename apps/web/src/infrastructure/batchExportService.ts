import JSZip from 'jszip';
import { MedicalReport, ClinicInfo, BatchExportProgress } from '@domain/types';
import { hasAllergenTests } from '@domain/allergenDetector';
import { generateHighQualityPdf } from './pdfService';
import { uploadPdfToCloud } from './cloudService';
import { generateQrCodeDataUrl } from './qrService';
import { addLedgerRecord, getNextVersionForReport } from './pdfLedger';
import { PdfFileRecord } from '@domain/exportTransaction';

export interface BatchExportCallbacks {
  onProgress: (progress: BatchExportProgress) => void;
  /** Called before each report render — App.tsx should update the hidden render component's data */
  onSetRenderData: (report: MedicalReport) => Promise<void>;
}

/**
 * Pipeline xuất PDF đồng loạt cho danh sách phiếu.
 * Quy trình MỖI phiếu (tuần tự):
 * 1. Set data vào hidden render component (callback)
 * 2. Chờ DOM re-render
 * 3. generateHighQualityPdf() → blob
 * 4. uploadPdfToCloud()
 * 5. generateQrCodeDataUrl()
 * 6. Lưu metadata vào Ledger
 * 7. Thu thập blob vào kết quả
 *
 * Cuối cùng: Nén toàn bộ blob thành ZIP và trigger download.
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

    const patientName = report.patient.name || 'BenhNhan';
    progress.current = patientName;
    callbacks.onProgress({ ...progress });

    try {
      // 1. Set data cho hidden render component
      await callbacks.onSetRenderData(report);

      // 2. Chờ DOM re-render hoàn tất
      await waitForDomRender(400);

      // 3. Xác định element ID
      const isAllergen = report.isAllergen || hasAllergenTests(report.selectedTests);
      const elementId = isAllergen ? 'batch-allergen-report' : 'batch-medical-report';

      // 4. Render PDF
      const safeName = patientName.replace(/\s+/g, '_');
      const filename = `PhieuXN_${safeName}_${report.code}.pdf`;
      const pdfRes = await generateHighQualityPdf(elementId, filename);

      // 5. Upload lên Cloud
      const version = await getNextVersionForReport(report.code);
      const versionedFilename = filename.replace(/\.pdf$/i, `_v${version}.pdf`);
      const uploadRes = await uploadPdfToCloud(pdfRes.blob, versionedFilename);

      // 6. Generate QR Code
      let qrDataUrl = '';
      if (uploadRes.url && !uploadRes.url.startsWith('data:')) {
        qrDataUrl = await generateQrCodeDataUrl(uploadRes.url);
      }

      // 7. Save to Ledger
      const ledgerRecord: PdfFileRecord = {
        id: crypto.randomUUID(),
        reportId: report.code,
        patientCode: report.code,
        patientName: patientName,
        filename: uploadRes.filename || versionedFilename,
        version: version,
        cloudProvider: uploadRes.provider,
        cloudUrl: uploadRes.url,
        qrDataUrl: qrDataUrl,
        fileSizeBytes: pdfRes.blob.size,
        createdAt: new Date().toISOString(),
        isLatest: true
      };
      await addLedgerRecord(ledgerRecord);

      // 8. Collect result
      progress.results.push({
        code: report.code,
        patientName: patientName,
        cloudUrl: uploadRes.url,
        qrDataUrl: qrDataUrl,
        blob: pdfRes.blob
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
    const safeName = (item.patientName || 'BenhNhan').replace(/\s+/g, '_');
    const filename = `PhieuXN_${safeName}_${item.code}.pdf`;
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
  URL.revokeObjectURL(url);
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
