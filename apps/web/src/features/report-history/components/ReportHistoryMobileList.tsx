import React from 'react';
import { 
  RotateCcw, 
  Eye, 
  MoreVertical, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { MedicalReport, Invoice, BILLING_STATUS } from '@domain';
import { LabReportAggregate } from '@domain/aggregates/LabReportAggregate';
import { ReportKindResolver } from '@domain/valueObjects/ReportKind';

interface ReportHistoryMobileListProps {
  reports: MedicalReport[];
  getInvoiceForReport: (rep: MedicalReport) => Invoice | undefined;
  onLoadReport: (report: MedicalReport) => void;
  onPreviewReport: (report: MedicalReport) => void;
  onOpenActionSheet: (report: MedicalReport) => void;
}

export const ReportHistoryMobileList: React.FC<ReportHistoryMobileListProps> = ({
  reports,
  getInvoiceForReport,
  onLoadReport,
  onPreviewReport,
  onOpenActionSheet
}) => {
  return (
    <div className="md:hidden space-y-2.5">
      {reports.map((rep) => {
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
          <div
            key={`mob_rep_${rep.id}`}
            className={`p-3.5 bg-slate-900 border rounded-2xl shadow-sm transition-all ${
              isOutdated ? 'border-amber-500/80 bg-amber-950/30 ring-1 ring-amber-500/40' : 'border-slate-800'
            }`}
          >
            {/* Header: Mã phiếu, loại phiếu & ngày giờ */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-sky-400">{rep.code}</span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                      kind.type === 'hybrid'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : kind.type === 'allergen'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    }`}
                  >
                    {kind.type === 'hybrid' ? 'Hỗn Hợp' : kind.type === 'allergen' ? 'Dị Nguyên' : 'Xét Nghiệm'}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${clinical.getBadgeStyle().bg} ${clinical.getBadgeStyle().text} ${clinical.getBadgeStyle().border}`}>
                    {clinical.label()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white uppercase mt-1 truncate">
                  {rep.patient.name || '---'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {rep.patient.dob || '---'} • {rep.patient.gender} • {rep.patient.phone || 'Không SĐT'}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block font-mono">
                  {new Date(rep.createdAt).toLocaleDateString('vi-VN')}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(rep.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Dải trạng thái: Viện phí & PDF */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 flex-wrap text-[10.5px]">
              <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md border ${billing.getBadgeStyle().bg} ${billing.getBadgeStyle().text} ${billing.getBadgeStyle().border}`}>
                <CreditCard className="w-3 h-3" />
                <span>{billing.label()} {inv?.finalAmount ? `(${(inv.finalAmount).toLocaleString('vi-VN')} đ)` : ''}</span>
              </span>

              <div className="flex flex-col items-end gap-0.5">
                <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md border ${document.getBadgeStyle().bg} ${document.getBadgeStyle().text} ${document.getBadgeStyle().border}`}>
                  {isOutdated ? <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                  <span>{document.label()} ({versionStr})</span>
                </span>
                {isOutdated && (
                  <span
                    className="text-[9.5px] text-amber-400/90 font-medium text-right max-w-[160px] truncate"
                    title={dirtyTooltip}
                  >
                    {primaryDirtyReason}{reasonsList.length > 1 ? ` (+${reasonsList.length - 1})` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Dải nút hành động cảm ứng trên mobile */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onLoadReport(rep)}
                className="flex-1 min-h-[42px] px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition active:scale-[0.98] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nạp Phiếu</span>
              </button>

              <button
                type="button"
                onClick={() => onPreviewReport(rep)}
                className="min-h-[42px] px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition active:scale-95 cursor-pointer"
                title="Xem trước mẫu in A4"
              >
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Xem PDF</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenActionSheet(rep)}
                className="min-h-[42px] min-w-[42px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Tùy chọn thao tác khác"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
