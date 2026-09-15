import React from 'react';
import { 
  X, 
  RotateCcw, 
  Eye, 
  CreditCard, 
  MessageSquare, 
  RefreshCw, 
  Copy, 
  QrCode, 
  Trash2 
} from 'lucide-react';
import { MedicalReport, REPORT_STATUS } from '@domain';

interface ReportActionSheetProps {
  report: MedicalReport | null;
  onClose: () => void;
  onParentModalClose: () => void;
  onLoadReport: (report: MedicalReport) => void;
  onPreviewReport: (report: MedicalReport) => void;
  onDuplicateReport: (report: MedicalReport) => void;
  onOpenSendZaloModal?: (report: MedicalReport) => void;
  onUpdateSingleReportPdf?: (report: MedicalReport) => void;
  onOpenInvoiceForReport?: (report: MedicalReport) => void;
  onDeleteReport: (id: string) => void;
  onDownloadQr: (report: MedicalReport) => void;
  isUpdatingPdf?: boolean;
}

export const ReportActionSheet: React.FC<ReportActionSheetProps> = ({
  report,
  onClose,
  onParentModalClose,
  onLoadReport,
  onPreviewReport,
  onDuplicateReport,
  onOpenSendZaloModal,
  onUpdateSingleReportPdf,
  onOpenInvoiceForReport,
  onDeleteReport,
  onDownloadQr,
  isUpdatingPdf = false
}) => {
  if (!report) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm sm:hidden flex flex-col justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border-t border-slate-700 rounded-t-3xl p-4 space-y-3 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-1 bg-slate-700 rounded-full mb-3" />
          <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-mono text-sky-400 font-bold block">{report.code}</span>
              <h4 className="text-sm font-bold text-white uppercase truncate">
                {report.patient.name || 'Bệnh Nhân'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {report.patient.dob || '---'} • {report.patient.gender} • {report.patient.phone || 'Không SĐT'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Items List */}
        <div className="space-y-1.5">
          {/* 1. Nạp Lên Form */}
          <button
            type="button"
            onClick={() => {
              onLoadReport(report);
              onClose();
              onParentModalClose();
            }}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-left font-semibold active:scale-[0.98] transition"
          >
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-white">Nạp lên form làm việc</span>
              <span className="block text-[10px] text-emerald-400/80">Điền toàn bộ kết quả vào màn hình chính</span>
            </div>
          </button>

          {/* 2. Xem Trước In A4 */}
          <button
            type="button"
            onClick={() => {
              onPreviewReport(report);
              onClose();
            }}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-sky-600/15 hover:bg-sky-600/25 text-sky-300 border border-sky-500/30 rounded-xl flex items-center gap-3 text-left font-semibold active:scale-[0.98] transition"
          >
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-white">Xem trước mẫu in A4 & PDF</span>
              <span className="block text-[10px] text-sky-400/80">Kiểm tra hiển thị và xuất file</span>
            </div>
          </button>

          {/* 3. Thu Phí / Hóa Đơn */}
          {onOpenInvoiceForReport && (
            <button
              type="button"
              onClick={() => {
                onOpenInvoiceForReport(report);
                onClose();
              }}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-teal-600/15 hover:bg-teal-600/25 text-teal-300 border border-teal-500/30 rounded-xl flex items-center gap-3 text-left font-semibold active:scale-[0.98] transition"
            >
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-white">Thu phí & Xuất biên lai</span>
                <span className="block text-[10px] text-teal-400/80">Quản lý hóa đơn và trạng thái viện phí</span>
              </div>
            </button>
          )}

          {/* 4. Gửi Zalo */}
          {onOpenSendZaloModal && (
            <button
              type="button"
              onClick={() => {
                onOpenSendZaloModal(report);
                onClose();
              }}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#0068FF]/15 hover:bg-[#0068FF]/25 text-blue-300 border border-blue-500/30 rounded-xl flex items-center gap-3 text-left font-semibold active:scale-[0.98] transition"
            >
              <div className="p-2 rounded-lg bg-[#0068FF]/20 text-[#0068FF] shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-white">Gửi kết quả qua Zalo</span>
                <span className="block text-[10px] text-blue-400/80">Gửi trực tiếp đến SĐT bệnh nhân</span>
              </div>
            </button>
          )}

          {/* 5. Cập Nhật PDF (khi Outdated) */}
          {(report.isPdfOutdated || report.status === REPORT_STATUS.OUTDATED) && onUpdateSingleReportPdf && (
            <button
              type="button"
              onClick={() => {
                onUpdateSingleReportPdf(report);
                onClose();
              }}
              disabled={isUpdatingPdf}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border border-amber-500/30 rounded-xl flex items-center gap-3 text-left font-semibold active:scale-[0.98] transition"
            >
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <RefreshCw className={`w-4 h-4 ${isUpdatingPdf ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-white">Cập nhật PDF mới lên Cloud</span>
                <span className="block text-[10px] text-amber-400/90 truncate" title={report.dirtyReasons?.join(', ')}>
                  {report.dirtyReasons && report.dirtyReasons.length > 0
                    ? `Thay đổi: ${report.dirtyReasons.join(', ')}`
                    : 'Cập nhật lại bản in khi dữ liệu đã sửa'}
                </span>
              </div>
            </button>
          )}

          {/* 6. Nhân Bản Danh Mục */}
          <button
            type="button"
            onClick={() => {
              onDuplicateReport(report);
              onClose();
              onParentModalClose();
            }}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 rounded-xl flex items-center gap-3 text-left font-semibold active:scale-[0.98] transition"
          >
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
              <Copy className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-white">Nhân bản danh mục chỉ số</span>
              <span className="block text-[10px] text-purple-400/80">Tạo phiếu mới với cùng nhóm xét nghiệm</span>
            </div>
          </button>

          {/* 7. Tải Mã QR */}
          {report.qrCodeDataUrl && (
            <button
              type="button"
              onClick={() => {
                onDownloadQr(report);
                onClose();
              }}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border border-amber-500/30 rounded-xl flex items-center gap-3 text-left font-semibold active:scale-[0.98] transition"
            >
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-white">Tải ảnh mã QR Code</span>
                <span className="block text-[10px] text-amber-400/80">Lưu ảnh QR Code tra cứu kết quả</span>
              </div>
            </button>
          )}

          {/* 8. Xóa Phiếu */}
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `Bạn có chắc chắn muốn xóa phiếu xét nghiệm của bệnh nhân [${report.patient?.name || report.code}] khỏi Sổ lưu và Cloud?`
                )
              ) {
                onDeleteReport(report.id);
                onClose();
              }
            }}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-500/30 rounded-xl flex items-center gap-3 text-left font-semibold active:scale-[0.98] transition"
          >
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-rose-200">Xóa phiếu này</span>
              <span className="block text-[10px] text-rose-400/80">Xóa vĩnh viễn khỏi Sổ lưu và Cloud</span>
            </div>
          </button>
        </div>

        {/* Đóng Drawer */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition active:scale-[0.98]"
        >
          Đóng bảng thao tác
        </button>
      </div>
    </div>
  );
};
