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
import { ClinicInfo, Patient, SelectedTest, ToastType, TestPackage, TestEquipment, CatalogItemEquipmentLink } from '@domain/types';
import { hasAllergenTests } from '@domain/allergenDetector';
import {
  ExportStepName,
  ExportErrorDetail,
  EXPORT_STEP_LABELS,
  EXPORT_STEP_ORDER,
  PdfFileRecord
} from '@domain/exportTransaction';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicInfo;
  patient: Patient;
  selectedTests?: SelectedTest[];
  conclusion?: string;
  doctorName?: string;
  qrCodeDataUrl?: string;
  cloudLink?: string;
  isExporting?: boolean;
  currentStep?: ExportStepName | null;
  lastError?: ExportErrorDetail | null;
  showToast: (msg: string, type?: ToastType) => void;
  onExportPdfAndUpload: () => void;
  onDownloadPdf?: (elementId: string, filename: string) => void;
  onRetryExport?: () => void;
  onPrintDirect: () => void;
  onDownloadQrCode: () => void;
  testPackages?: TestPackage[];
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
}

export default function PdfPreviewModal({
  isOpen,
  onClose,
  clinicInfo,
  patient,
  selectedTests = [],
  conclusion = '',
  doctorName = '',
  qrCodeDataUrl,
  cloudLink,
  isExporting = false,
  currentStep = null,
  lastError = null,
  showToast: _showToast,
  onExportPdfAndUpload,
  onDownloadPdf,
  onRetryExport,
  onPrintDirect,
  onDownloadQrCode,
  testPackages = [],
  equipments = [],
  catalogItemEquipments = []
}: PdfPreviewModalProps) {
  // State điều khiển độ thu phóng
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  // State xem lịch sử phiên bản PDF trên cloud
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyList] = useState<PdfFileRecord[]>([]);
  // State modal xác nhận trước khi lưu & xuất cloud
  const [showConfirmExport, setShowConfirmExport] = useState<boolean>(false);

  if (!isOpen) return null;

  const safePatient: Patient = patient || {
    code: 'BN-GOLAB',
    secretToken: '',
    name: 'Bệnh nhân mới',
    dob: '',
    gender: 'Nam',
    phone: '',
    address: '',
    diagnosis: '',
    sampleCode: 'BN-GOLAB',
    sampleStatus: 'Đạt',
    orderedAt: '',
    paidAt: undefined,
    receivedAt: '',
    returnedAt: ''
  };

  const safeSelectedTests = selectedTests || [];

  // Nhận diện loại báo cáo: Xét nghiệm thông thường hay Booklet Dị nguyên 6 trang
  const isAllergenPackage = hasAllergenTests(safeSelectedTests);

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.1, 0.4));
  };

  const handleResetZoom = () => {
    setZoomScale(0.85);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 sm:rounded-2xl shadow-2xl flex flex-col w-full h-full sm:max-w-5xl sm:h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header Modal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-800 gap-2 sm:gap-3 shrink-0 bg-slate-900/90 backdrop-blur">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                <span>Xem Trước Bản In & Xuất PDF Chất Lượng Cao</span>
                {isAllergenPackage && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Booklet Dị Nguyên 6 Trang
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Bệnh nhân: <strong className="text-slate-200">{safePatient.name || 'Bệnh nhân mới'}</strong> ({safePatient.code})
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

            {/* Nút Tải File PDF Trực Tiếp Về Máy (Chỉ kích hoạt khi đã upload PDF lên Cloud) */}
            {onDownloadPdf && (
              <button
                onClick={() => {
                  const elemId = isAllergenPackage ? 'preview-allergen-element' : 'preview-print-element';
                  const fname = `PhieuXN_${(safePatient.name || 'BenhNhan').replace(/\s+/g, '_')}_${safePatient.code}.pdf`;
                  onDownloadPdf(elemId, fname);
                }}
                disabled={!cloudLink || isExporting}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow transition-all active:scale-95 ${
                  cloudLink && !isExporting
                    ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
                title={cloudLink ? "Tải trực tiếp file PDF chất lượng cao về máy tính" : "Vui lòng bấm 'Lưu PDF & Cloud' để tải lên trước"}
              >
                <Download className="w-4 h-4" />
                <span>Tải File PDF</span>
              </button>
            )}

            {/* Nút Xuất PDF & Cloud (Transaction) */}
            <button
              onClick={() => setShowConfirmExport(true)}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow transition-all active:scale-95 cursor-pointer"
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

        {/* ─── TRANSACTION STEP PROGRESS BAR (KHI ĐANG XUẤT) ────────────────── */}
        {isExporting && (
          <div className="bg-slate-950 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Tiến trình Transaction:</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-1 max-w-2xl overflow-x-auto py-1">
              {EXPORT_STEP_ORDER.map((step, idx) => {
                const stepIdx = EXPORT_STEP_ORDER.indexOf(step);
                const currentIdx = currentStep ? EXPORT_STEP_ORDER.indexOf(currentStep) : -1;
                const isPassed = currentIdx > stepIdx;
                const isCurrent = currentIdx === stepIdx;

                return (
                  <div
                    key={step}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all shrink-0 ${
                      isPassed
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                        : isCurrent
                        ? 'bg-sky-900 text-sky-200 border border-sky-500 shadow-sm animate-pulse'
                        : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
              {historyList.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                    rec.isLatest
                      ? 'bg-purple-950/40 border-purple-500/50'
                      : 'bg-slate-900/60 border-slate-800'
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
                patient={safePatient}
                selectedTests={safeSelectedTests}
                doctorName={doctorName}
                qrCodeDataUrl={qrCodeDataUrl}
                testPackages={testPackages}
              />
            ) : (
              <PrintReportView
                elementId="preview-print-element"
                clinicInfo={clinicInfo}
                patient={safePatient}
                selectedTests={safeSelectedTests}
                conclusion={conclusion}
                doctorName={doctorName}
                qrCodeDataUrl={qrCodeDataUrl}
                equipments={equipments}
                catalogItemEquipments={catalogItemEquipments}
              />
            )}
          </div>
        </div>

        {/* Footer Modal Đóng */}
        <div className="bg-slate-900 px-6 py-2.5 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-3">
            <span>Danh mục: <strong className="text-sky-400">{safeSelectedTests.length} chỉ số</strong></span>
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
                    if (_showToast) _showToast('Đã sao chép đường dẫn PDF vào bộ nhớ tạm!', 'success');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] border border-slate-700 transition"
                  title="Sao chép đường dẫn xem PDF"
                >
                  Sao chép link
                </button>
                <a
                  href={cloudLink}
                  download={`PhieuXN_${(safePatient.name || 'BenhNhan').replace(/\s+/g, '_')}_${safePatient.code}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] border border-emerald-600 transition flex items-center gap-1"
                  title="Mở / Tải file PDF từ Cloud"
                >
                  <Download className="w-2.5 h-2.5" />
                  <span>Tải PDF</span>
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              Đóng Màn Hình Xem Trước
            </button>
          </div>
        </div>

        {/* ─── CONFIRMATION MODAL: YÊU CẦU XÁC NHẬN LƯU TRƯỚC KHI XUẤT CLOUD ── */}
        {showConfirmExport && (
          <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <CloudUpload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Xác Nhận Lưu PDF & Đồng Bộ Cloud
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Lưu dữ liệu kết quả, xuất file PDF và đồng bộ lên máy chủ
                  </p>
                </div>
              </div>

              {/* Thông tin tóm tắt phiếu xét nghiệm */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Bệnh nhân:</span>
                  <span className="font-bold text-slate-900 uppercase">{safePatient.name}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Mã BN / Số BP:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {safePatient.code} / <span className="text-red-600">{safePatient.sampleCode || safePatient.code}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Loại phiếu:</span>
                  <span className="font-bold text-sky-700">
                    {isAllergenPackage ? 'Báo cáo Dị nguyên IgE' : 'Phiếu Xét Nghiệm Y Khoa'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Tổng số chỉ số:</span>
                  <span className="font-bold text-slate-900">{safeSelectedTests.length} chỉ số</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">Bác sĩ phụ trách:</span>
                  <span className="font-bold text-slate-900">{doctorName || clinicInfo.defaultDoctor || '---'}</span>
                </div>
              </div>

              <div className="text-[11.5px] text-slate-600 leading-relaxed bg-amber-50 border border-amber-200/70 p-2.5 rounded-lg text-amber-950 font-medium">
                💡 Hệ thống sẽ tự động lưu phiếu vào <strong>Sổ Lưu Trữ</strong>, kết xuất file PDF chất lượng cao (300 DPI), tạo mã <strong>QR tra cứu trực tuyến</strong> và đồng bộ lên Cloud.
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmExport(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Hủy / Xem lại
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmExport(false);
                    onExportPdfAndUpload();
                  }}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>Xác Nhận Lưu & Đồng Bộ</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
