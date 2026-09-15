import React from 'react';
import { 
  Calendar, 
  RotateCcw, 
  Eye, 
  QrCode, 
  Copy, 
  Trash2, 
  MessageSquare, 
  RefreshCw, 
  CheckCircle2, 
  CreditCard, 
  AlertTriangle 
} from 'lucide-react';
import { MedicalReport, Invoice, BILLING_STATUS } from '@domain';
import { LabReportAggregate } from '@domain/aggregates/LabReportAggregate';
import { ReportKindResolver } from '@domain/valueObjects/ReportKind';

interface ReportHistoryTableProps {
  reports: MedicalReport[];
  getInvoiceForReport: (rep: MedicalReport) => Invoice | undefined;
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

export const ReportHistoryTable: React.FC<ReportHistoryTableProps> = ({
  reports,
  getInvoiceForReport,
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
  return (
    <div className="hidden md:block border border-slate-800 rounded-xl overflow-hidden shadow-inner">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-800 text-slate-200 font-bold border-b border-slate-700">
          <tr>
            <th className="p-3 w-10 text-center">STT</th>
            <th className="p-3">Mã Phiếu & Thời Gian</th>
            <th className="p-3">Bệnh Nhân & Năm Sinh</th>
            <th className="p-3">Số ĐT & Địa Chỉ</th>
            <th className="p-3">Bác Sĩ & Loại Phiếu</th>
            <th className="p-3 text-center">Số Chỉ Số</th>
            <th className="p-3">Thu Phí & Doanh Thu</th>
            <th className="p-3">Tình Trạng PDF</th>
            <th className="p-3 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/50">
          {reports.map((rep, idx) => {
            const kind = ReportKindResolver.resolve(rep.selectedTests);
            const inv = getInvoiceForReport(rep);
            const isPaid = Boolean(inv && inv.status === BILLING_STATUS.PAID);
            const agg = LabReportAggregate.fromSnapshot(rep);
            const { clinical, document, billing } = agg.computeStatusSummary(isPaid);
            const isOutdated = document.isOutdated();
            const versionStr = rep.pdfVersion ? `v${rep.pdfVersion}` : 'v1';
            const reasonsList = isOutdated && agg.documentState.status === 'OUTDATED' ? agg.documentState.dirtyReasons : [];
            const primaryDirtyReason = reasonsList.length > 0 ? reasonsList[0] : 'Dữ liệu đã sửa đổi';
            const dirtyTooltip = reasonsList.length > 0 ? reasonsList.map((r) => `• ${r}`).join('\n') : 'Dữ liệu đã sửa đổi';

            return (
              <tr key={rep.id} className={`hover:bg-slate-800/40 transition-colors ${isOutdated ? 'bg-amber-950/30 border-l-4 border-l-amber-500' : ''}`}>
                <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>

                {/* Mã phiếu & Ngày giờ */}
                <td className="p-3">
                  <span className="font-mono font-bold text-sky-400 block">{rep.code}</span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {new Date(rep.createdAt).toLocaleString('vi-VN')}
                  </span>
                </td>

                {/* Bệnh nhân */}
                <td className="p-3">
                  <strong className="text-white text-xs block uppercase font-bold">
                    {rep.patient.name || '---'}
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    {rep.patient.dob || '---'} • {rep.patient.gender}
                  </span>
                </td>

                {/* Số ĐT & Địa chỉ */}
                <td className="p-3 max-w-[180px]">
                  <span className="font-mono text-slate-300 block">{rep.patient.phone || '---'}</span>
                  <span className="text-[10.5px] text-slate-400 truncate block mt-0.5" title={rep.patient.address}>
                    {rep.patient.address || 'Quảng Bình'}
                  </span>
                </td>

                {/* Bác sĩ, Tiến trình & Loại phiếu */}
                <td className="p-3">
                  <span className="font-semibold text-slate-200 block">{rep.doctorName || 'BS. Trần Hoài Long'}</span>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span
                      className={`inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                        kind.type === 'hybrid'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : kind.type === 'allergen'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      }`}
                    >
                      {kind.type === 'hybrid' ? 'Hỗn Hợp' : kind.type === 'allergen' ? 'Dị Nguyên' : 'Xét Nghiệm'}
                    </span>
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${clinical.getBadgeStyle().bg} ${clinical.getBadgeStyle().text} ${clinical.getBadgeStyle().border}`}>
                      {clinical.label()}
                    </span>
                  </div>
                </td>

                {/* Số lượng chỉ số */}
                <td className="p-3 text-center font-mono font-bold text-slate-300">
                  {rep.testCount || rep.selectedTests.length}
                </td>

                {/* Thu Phí & Hóa Đơn */}
                <td className="p-3">
                  {inv ? (
                    <div className="space-y-0.5">
                      <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md border ${billing.getBadgeStyle().bg} ${billing.getBadgeStyle().text} ${billing.getBadgeStyle().border}`}>
                        <CreditCard className="w-3 h-3 text-emerald-400" />
                        <span>{billing.label()} ({(inv.finalAmount ?? 0).toLocaleString('vi-VN')} đ)</span>
                      </span>
                      <span className="block font-mono text-[9.5px] text-slate-400">{inv.code}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${billing.getBadgeStyle().bg} ${billing.getBadgeStyle().text} ${billing.getBadgeStyle().border}`}>
                        <span>{billing.label()}</span>
                      </span>
                      {onOpenInvoiceForReport && (
                        <button
                          type="button"
                          onClick={() => onOpenInvoiceForReport(rep)}
                          className="px-2 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-[10px] font-bold shadow-sm transition active:scale-95 flex items-center gap-0.5 cursor-pointer"
                          title="Tạo hóa đơn & thu phí cho phiếu này"
                        >
                          <CreditCard className="w-2.5 h-2.5" />
                          <span>Thu</span>
                        </button>
                      )}
                    </div>
                  )}
                </td>

                {/* Tình Trạng PDF & Version */}
                <td className="p-3">
                  {document.isOutdated() ? (
                    <div className="space-y-1">
                      <span className={`inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md border ${document.getBadgeStyle().bg} ${document.getBadgeStyle().text} ${document.getBadgeStyle().border}`}>
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>{document.label()} ({versionStr})</span>
                      </span>
                      <span
                        className="block text-[9.5px] text-amber-400/90 font-medium truncate max-w-[170px] cursor-help"
                        title={dirtyTooltip}
                      >
                        {primaryDirtyReason}{reasonsList.length > 1 ? ` (+${reasonsList.length - 1})` : ''}
                      </span>
                    </div>
                  ) : document.isSynced() ? (
                    <div className="space-y-0.5">
                      <span className={`inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md border ${document.getBadgeStyle().bg} ${document.getBadgeStyle().text} ${document.getBadgeStyle().border}`}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{document.label()} ({versionStr})</span>
                      </span>
                      <span className="block text-[9.5px] text-slate-400">Khớp Cloud 100%</span>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md border ${document.getBadgeStyle().bg} ${document.getBadgeStyle().text} ${document.getBadgeStyle().border}`}>
                      <span>{document.label()}</span>
                    </span>
                  )}
                </td>

                {/* Action Buttons */}
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    {/* Nút Cập Nhật PDF 1-Click (Khi phiếu bị Outdated) */}
                    {isOutdated && onUpdateSingleReportPdf && (
                      <button
                        type="button"
                        onClick={() => onUpdateSingleReportPdf(rep)}
                        disabled={isUpdatingPdf}
                        className="p-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-lg transition cursor-pointer"
                        title="Cập nhật và xuất lại file PDF lên Cloud cho phiếu này"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingPdf ? 'animate-spin' : ''}`} />
                      </button>
                    )}

                    {/* Nút Xem trước A4 */}
                    <button
                      type="button"
                      onClick={() => onPreviewReport(rep)}
                      className="p-1.5 bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                      title="Xem trước mẫu in A4"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Nút Nạp lại lên Form */}
                    <button
                      type="button"
                      onClick={() => onLoadReport(rep)}
                      className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                      title="Nạp phiếu này lên màn hình làm việc"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Nút Nhân bản danh mục */}
                    <button
                      type="button"
                      onClick={() => onDuplicateReport(rep)}
                      className="p-1.5 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                      title="Nhân bản danh mục chỉ số cho bệnh nhân mới"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Nút Gửi Zalo */}
                    {onOpenSendZaloModal && (
                      <button
                        type="button"
                        onClick={() => onOpenSendZaloModal(rep)}
                        className="p-1.5 bg-slate-800 hover:bg-[#0068FF] text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                        title="Gửi kết quả qua Zalo cho bệnh nhân"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Nút Tải QR Code */}
                    {rep.qrCodeDataUrl && (
                      <button
                        type="button"
                        onClick={() => onDownloadQr(rep)}
                        className="p-1.5 bg-slate-800 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg transition cursor-pointer"
                        title="Tải ảnh QR Code tra cứu kết quả"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Nút Xóa phiếu */}
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Bạn có chắc chắn muốn xóa phiếu xét nghiệm của bệnh nhân [${rep.patient?.name || rep.code}] khỏi Sổ lưu và Cloud?`
                          )
                        ) {
                          onDeleteReport(rep.id);
                        }
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                      title="Xóa phiếu này khỏi Sổ lưu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
