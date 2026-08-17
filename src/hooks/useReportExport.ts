import { useState, useRef } from 'react';
import { ToastType } from '@domain/types';
import { downloadDataUrlAsImage } from '@infra/qrService';
import { PdfExportTransaction } from '@infra/pdfExportTransaction';
import {
  ExportStepName,
  ExportErrorDetail,
  ExportTransactionResult,
  EXPORT_STEP_LABELS
} from '@domain/exportTransaction';

interface ExportHistoryParams {
  elementId: string;
  filename: string;
  reportCode?: string;
  patientName?: string;
}

export function useReportExport(
  showToast: (message: string, type?: ToastType) => void
) {
  const [cloudLink, setCloudLink] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<ExportStepName | null>(null);
  const [lastError, setLastError] = useState<ExportErrorDetail | null>(null);
  const [lastTransactionResult, setLastTransactionResult] = useState<ExportTransactionResult | null>(null);

  // Lưu params lần xuất gần nhất để hỗ trợ Retry thủ công (Quyết định 2: B)
  const lastParamsRef = useRef<ExportHistoryParams | null>(null);

  const handleExportPdfAndUploadCloud = async (
    elementId: string,
    filename: string,
    reportCode?: string,
    patientName?: string
  ): Promise<ExportTransactionResult | null> => {
    // Lưu lại params cho retry
    lastParamsRef.current = { elementId, filename, reportCode, patientName };

    setIsExporting(true);
    setLastError(null);
    setCurrentStep('render_pdf');

    const cleanCode = reportCode || filename.replace(/^PhieuXN_[^_]+_/, '').replace(/\.pdf$/, '') || 'BN-TEMP';
    const cleanPatientName = patientName || 'BenhNhan';

    const tx = new PdfExportTransaction(
      elementId,
      filename,
      cleanCode,
      cleanPatientName,
      {
        onStepStart: (step: ExportStepName) => {
          setCurrentStep(step);
          showToast(EXPORT_STEP_LABELS[step] || 'Đang xử lý...', 'info');
        }
      }
    );

    try {
      const result = await tx.execute();

      setLastTransactionResult(result);

      if (result.success && result.finalUrl) {
        setCloudLink(result.finalUrl);
        if (result.finalQrCodeDataUrl) {
          setQrCodeDataUrl(result.finalQrCodeDataUrl);
        }
        showToast('Xuất PDF và lưu trữ Cloud thành công! Sẵn sàng in hoặc quét QR.', 'success');
      } else {
        // Xử lý khi transaction thất bại (đã có rollback tự động trong Transaction class)
        const failedStep = result.executedSteps.find((s) => s.status === 'failed');
        const errorDetail: ExportErrorDetail = {
          step: failedStep?.step || 'upload_cloud',
          message: failedStep?.error || result.error || 'Lỗi không xác định trong tiến trình',
          timestamp: new Date().toISOString(),
          retryable: true
        };
        setLastError(errorDetail);

        let errorMsg = `Lỗi ở bước [${EXPORT_STEP_LABELS[errorDetail.step] || errorDetail.step}]: ${errorDetail.message}`;
        if (result.rolledBack) {
          errorMsg += ' (Đã tự động Rollback dữ liệu an toàn)';
        }
        showToast(errorMsg, 'error');
      }

      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi hệ thống khi xuất file';
      const errorDetail: ExportErrorDetail = {
        step: 'render_pdf',
        message: errMsg,
        timestamp: new Date().toISOString(),
        retryable: true
      };
      setLastError(errorDetail);
      showToast(`Không thể hoàn tất quy trình xuất: ${errMsg}`, 'error');
      return null;
    } finally {
      setIsExporting(false);
      setCurrentStep(null);
    }
  };

  // ─── Retry thủ công lần xuất trước (Quyết định 2: B) ─────────────────────────
  const handleRetryExport = async (): Promise<ExportTransactionResult | null> => {
    if (!lastParamsRef.current) {
      showToast('Không có dữ liệu xuất trước đó để thử lại!', 'warning');
      return null;
    }
    const { elementId, filename, reportCode, patientName } = lastParamsRef.current;
    showToast('Đang thử lại tiến trình xuất PDF & Upload...', 'info');
    return handleExportPdfAndUploadCloud(elementId, filename, reportCode, patientName);
  };

  const handleDownloadQrCode = (patientName: string, patientCode: string) => {
    if (!qrCodeDataUrl) {
      showToast('Chưa có ảnh mã QR Code để tải về!', 'error');
      return;
    }
    const safeName = (patientName || 'BenhNhan').replace(/\s+/g, '_');
    const qrFilename = `QRCode_PhieuKham_${safeName}_${patientCode}.png`;
    downloadDataUrlAsImage(qrCodeDataUrl, qrFilename);
    showToast('Đã tải ảnh mã QR Code về máy!', 'success');
  };

  const resetExport = () => {
    setCloudLink('');
    setQrCodeDataUrl('');
    setLastError(null);
    setLastTransactionResult(null);
    lastParamsRef.current = null;
  };

  return {
    cloudLink,
    qrCodeDataUrl,
    isExporting,
    currentStep,
    lastError,
    lastTransactionResult,
    handleExportPdfAndUploadCloud,
    handleRetryExport,
    handleDownloadQrCode,
    resetExport
  };
}
