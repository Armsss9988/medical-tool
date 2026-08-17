import { useState } from 'react';
import {
  X,
  Printer,
  Download,
  QrCode,
  CloudUpload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Loader2,
  FileText,
  History,
  ExternalLink
} from 'lucide-react';
import PrintReportView from './PrintReportView';
import FullAllergenReportView from './FullAllergenReportView';
import { ClinicInfo, Patient, SelectedTest, ToastType } from '@domain/types';
import {
  ExportStepName,
  ExportErrorDetail,
  EXPORT_STEP_LABELS,
  EXPORT_STEP_ORDER,
  PdfFileRecord
} from '@domain/exportTransaction';
import { getLedgerByReport } from '@infra/pdfLedger';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicInfo;
  patient: Patient;
  selectedTests: SelectedTest[];
  conclusion?: string;
  doctorName?: string;
  qrCodeDataUrl?: string;
  cloudLink?: string;
  isExporting?: boolean;
  currentStep?: ExportStepName | null;
  lastError?: ExportErrorDetail | null;
  showToast: (msg: string, type?: ToastType) => void;
  onExportPdfAndUpload: () => void;
  onRetryExport?: () => void;
  onPrintDirect: () => void;
  onDownloadQrCode: () => void;
}

export default function PdfPreviewModal({
  isOpen,
  onClose,
  clinicInfo,
  patient,
  selectedTests,
  conclusion,
  doctorName,
  qrCodeDataUrl,
  cloudLink,
  isExporting = false,
  currentStep = null,
  lastError = null,
  showToast,
  onExportPdfAndUpload,
  onRetryExport,
  onPrintDirect,
  onDownloadQrCode
}: PdfPreviewModalProps) {
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [historyList, setHistoryList] = useState<PdfFileRecord[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Tải lịch sử version của bệnh nhân khi mở modal
  useEffect(() => {
    if (isOpen && patient.code) {
      getLedgerByReport(patient.code).then((records) => {
        setHistoryList(records);
      });
    }
  }, [isOpen, patient.code, isExporting]);

  if (!isOpen) return null;

  const isAllergenPackage = selectedTests.some(
    (t) => (t.category && t.category.includes('Dị Nguyên')) || t.unit === 'IU/mL'
  );

  const handleZoomIn = () => setZoomScale((prev) => Math.min(1.2, parseFloat((prev + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(0.5, parseFloat((prev - 0.1).toFixed(2))));
  const handleResetZoom = () => setZoomScale(0.85);

  const getStepIndex = (step: ExportStepName | null) => {
    if (!step) return -1;
    return EXPORT_STEP_ORDER.indexOf(step);
  };

  const currentIdx = getStepIndex(currentStep);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 md:p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col h-[94vh] border border-slate-700/60 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Thanh Công Cụ Xem Trước */}
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 shrink-0 gap-3">
          <div className="flex items-center space-x-3">
            <span className={`w-3 h-3 rounded-full shrink-0 ${isExporting ? 'bg-amber-400 animate-ping' : 'bg-sky-500'}`}></span>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
                Màn Hình Xem Trước Phiếu Trả Kết Quả
                <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded">
                  {isAllergenPackage ? 'Panel Dị Nguyên 91 Chỉ Số' : 'Khổ Giấy Chuẩn A4'}
                </span>
                {historyList.length > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <FileText className="w-2.5 h-2.5" />
                    v{historyList[0]?.version || 1}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Bệnh nhân: <strong className="text-slate-200">{patient.name || 'Bệnh nhân mới'}</strong> ({patient.code})
              </p>
            </div>
          </div>

          {/* Quick Action Controls trong Header Modal */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            
            {/* Nút Xem Lịch Sử Version */}
            {historyList.length > 0 && (
              <button
                onClick={() => setShowHistory((prev) => !prev)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  showHistory
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Xem các phiên bản PDF đã xuất trên Cloud"
              >
                <History className="w-3.5 h-3.5" />
                <span>Lịch sử ({historyList.length})</span>
              </button>
            )}

            {/* Bộ Điều Chỉnh Zoom Tỉ Lệ */}
            <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded-lg p-1 mr-1">
              <button
                onClick={handleZoomOut}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
                title="Thu nhỏ xem toàn trang"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-sky-400 px-1.5 min-w-[42px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition ml-0.5"
                title="Đặt về tỷ lệ vừa màn hình"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Nút In Trực Tiếp */}
            <button
              onClick={onPrintDirect}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold shadow transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu A4</span>
            </button>

            {/* Nút Xuất PDF & Cloud (Transaction) */}
            <button
              onClick={onExportPdfAndUpload}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow transition-all active:scale-95"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Đang Xử Lý...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>Lưu PDF & Cloud</span>
                </>
              )}
            </button>

            {/* Nút Tải QR Code (Nếu đã có) */}
            {qrCodeDataUrl && (
              <button
                onClick={onDownloadQrCode}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow transition-all active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>Tải QR</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── THANH TIẾN TRÌNH TRANSACTION PIPELINE ─────────────────────── */}
        {isExporting && (
          <div className="bg-slate-950 border-b border-sky-900/50 px-5 py-2.5 animate-in slide-in-from-top duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Tiến trình Transaction: {currentStep ? EXPORT_STEP_LABELS[currentStep] : 'Đang khởi chạy...'}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Bảo vệ Rollback tự động khi có lỗi mạng
              </span>
            </div>

            {/* Stepper 5 bước */}
            <div className="grid grid-cols-5 gap-1.5 text-[10px]">
              {EXPORT_STEP_ORDER.map((step, idx) => {
                const isCurrent = currentStep === step;
                const isPassed = currentIdx > idx;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                      isCurrent
                        ? 'bg-sky-500/20 border border-sky-400/40 text-sky-200 font-bold'
                        : isPassed
                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-800/40 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3 h-3 text-sky-400 animate-spin shrink-0" />
                    ) : (
                      <span className="w-3 h-3 rounded-full bg-slate-700 text-[8px] flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate">{EXPORT_STEP_LABELS[step].replace(/^[^\s]+\s/, '')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── ERROR NOTIFICATION & MANUAL RETRY BANNER ───────────────────── */}
        {lastError && !isExporting && (
          <div className="bg-red-950/70 border-b border-red-800/60 px-5 py-2.5 flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-red-900/60 text-red-300 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-red-200">
                  Lỗi tại bước: <span className="underline">{EXPORT_STEP_LABELS[lastError.step] || lastError.step}</span>
                </p>
                <p className="text-red-300/90 text-[11px] mt-0.5">
                  {lastError.message} • <em className="text-emerald-300">Dữ liệu trên Cloud đã được Rollback an toàn.</em>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onRetryExport && lastError.retryable && (
                <button
                  onClick={onRetryExport}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-bold text-xs shadow transition-all active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Thử Lại Ngay</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── PANEL LỊCH SỬ VERSION (LEDGER) ────────────────────────────── */}
        {showHistory && (
          <div className="bg-slate-950 border-b border-purple-900/40 px-5 py-3 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Lịch Sử Phiên Bản PDF Trên Cloud ({historyList.length} phiên bản đã lưu)
              </h4>
              <span className="text-[10px] text-slate-400">
                Hệ thống tự động lưu giữ tối đa 3 phiên bản mới nhất
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {historyList.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-2 rounded-lg border text-xs flex flex-col justify-between ${
                    rec.isLatest
                      ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold font-mono text-purple-300">v{rec.version}</span>
                      {rec.isLatest && (
                        <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                          Mới nhất
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate" title={rec.filename}>
                      {rec.filename}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {new Date(rec.createdAt).toLocaleString('vi-VN')} • {rec.cloudProvider.toUpperCase()}
                    </p>
                  </div>

                  {rec.cloudUrl && (
                    <a
                      href={rec.cloudUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex items-center justify-center gap-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-semibold transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Mở xem PDF</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Khung Hiển Thị Mẫu In A4 (Với Tỉ Lệ Zoom Linh Hoạt) */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-950 flex justify-center items-start">
          <div 
            className="shadow-2xl rounded-sm overflow-hidden bg-white transition-transform duration-150 origin-top"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {isAllergenPackage ? (
              <FullAllergenReportView
                elementId="preview-allergen-element"
                clinicInfo={clinicInfo}
                patient={patient}
                selectedTests={selectedTests}
                doctorName={doctorName}
                qrCodeDataUrl={qrCodeDataUrl}
              />
            ) : (
              <PrintReportView
                elementId="preview-print-element"
                clinicInfo={clinicInfo}
                patient={patient}
                selectedTests={selectedTests}
                conclusion={conclusion}
                doctorName={doctorName}
                qrCodeDataUrl={qrCodeDataUrl}
              />
            )}
          </div>
        </div>

        {/* Footer Modal Đóng */}
        <div className="bg-slate-900 px-6 py-2.5 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-3">
            <span>Danh mục: <strong className="text-sky-400">{selectedTests.length} chỉ số</strong></span>
            {cloudLink && (
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 flex items-center gap-1 font-mono truncate max-w-[320px]">
                  <Download className="w-3 h-3 shrink-0" />
                  <a href={cloudLink} target="_blank" rel="noreferrer" className="underline truncate">
                    {cloudLink}
                  </a>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(cloudLink);
                    showToast('Đã sao chép đường dẫn PDF vào bộ nhớ tạm!', 'success');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] border border-slate-700 transition"
                  title="Sao chép đường dẫn xem PDF"
                >
                  Sao chép link
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              Đóng Màn Hình Xem Trước
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
