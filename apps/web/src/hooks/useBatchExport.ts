import { useState, useRef, useCallback } from 'react';
import { MedicalReport, ClinicInfo, BatchExportProgress } from '@domain/types';
import { batchExportPdfs, downloadBatchZip } from '@infra/batchExportService';

const INITIAL_PROGRESS: BatchExportProgress = {
  total: 0,
  completed: 0,
  current: '',
  status: 'idle',
  errors: [],
  results: []
};

export function useBatchExport(
  clinicInfo: ClinicInfo,
  onSetRenderData: (report: MedicalReport) => Promise<void>,
  onReportExported?: (report: MedicalReport, cloudUrl: string, qrDataUrl: string) => void
) {
  const [progress, setProgress] = useState<BatchExportProgress>(INITIAL_PROGRESS);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const cancelRef = useRef({ current: false });

  const handleBatchExport = useCallback(async (reports: MedicalReport[]) => {
    if (reports.length === 0) return;

    cancelRef.current = { current: false };
    setIsBatchExporting(true);
    setProgress({
      ...INITIAL_PROGRESS,
      total: reports.length,
      status: 'running'
    });

    const finalProgress = await batchExportPdfs(
      reports,
      clinicInfo,
      {
        onProgress: (p) => setProgress({ ...p }),
        onSetRenderData
      },
      cancelRef.current
    );

    // Callback cho mỗi phiếu đã export thành công → cập nhật trong reportManager
    if (onReportExported) {
      for (const result of finalProgress.results) {
        const matchReport = reports.find((r) => r.code === result.code);
        if (matchReport) {
          onReportExported(matchReport, result.cloudUrl, result.qrDataUrl);
        }
      }
    }

    setIsBatchExporting(false);
    return finalProgress;
  }, [clinicInfo, onSetRenderData, onReportExported]);

  const handleCancelBatch = useCallback(() => {
    cancelRef.current.current = true;
  }, []);

  const handleDownloadZip = useCallback(async () => {
    if (progress.results.length === 0) return;
    await downloadBatchZip(progress.results);
  }, [progress.results]);

  const resetBatchProgress = useCallback(() => {
    setProgress(INITIAL_PROGRESS);
  }, []);

  return {
    progress,
    isBatchExporting,
    handleBatchExport,
    handleCancelBatch,
    handleDownloadZip,
    resetBatchProgress
  };
}
