import { useState } from 'react';
import { X, Printer, Download, QrCode, CloudUpload, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import PrintReportView from './PrintReportView';
import FullAllergenReportView from './FullAllergenReportView';
import { ClinicInfo, Patient, SelectedTest, ToastType } from '@domain/types';

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
  showToast: (msg: string, type?: ToastType) => void;
  onExportPdfAndUpload: () => void;
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
  onExportPdfAndUpload,
  onPrintDirect,
  onDownloadQrCode
}: PdfPreviewModalProps) {
  const [zoomScale, setZoomScale] = useState<number>(0.85);

  if (!isOpen) return null;

  const isAllergenPackage = selectedTests.some(
    (t) => (t.category && t.category.includes('Dị Nguyên')) || t.unit === 'IU/mL'
  );

  const handleZoomIn = () => setZoomScale((prev) => Math.min(1.2, parseFloat((prev + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(0.5, parseFloat((prev - 0.1).toFixed(2))));
  const handleResetZoom = () => setZoomScale(0.85);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 md:p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col h-[94vh] border border-slate-700/60 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Thanh Công Cụ Xem Trước */}
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 shrink-0 gap-3">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-sky-500 animate-pulse shrink-0"></span>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
                Màn Hình Xem Trước Phiếu Trả Kết Quả
                <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded">
                  {isAllergenPackage ? 'Panel Dị Nguyên 91 Chỉ Số' : 'Khổ Giấy Chuẩn A4'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Bệnh nhân: <strong className="text-slate-200">{patient.name || 'Bệnh nhân mới'}</strong> ({patient.code})
              </p>
            </div>
          </div>

          {/* Quick Action Controls trong Header Modal */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            
            {/* Bộ Điều Chỉnh Zoom Tỉ Lệ */}
            <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded-lg p-1 mr-2">
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
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu A4</span>
            </button>

            {/* Nút Xuất PDF & Cloud */}
            <button
              onClick={onExportPdfAndUpload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all active:scale-95"
            >
              <CloudUpload className="w-4 h-4" />
              <span>Lưu PDF & Cloud</span>
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
              <span className="text-emerald-400 flex items-center gap-1 font-mono truncate max-w-[400px]">
                <Download className="w-3 h-3 shrink-0" />
                <a href={cloudLink} target="_blank" rel="noreferrer" className="underline truncate">
                  {cloudLink}
                </a>
              </span>
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
