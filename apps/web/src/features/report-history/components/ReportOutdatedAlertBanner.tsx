import React from 'react';
import { 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  Eye, 
  RotateCcw 
} from 'lucide-react';
import { MedicalReport } from '@domain';
import { LabReportAggregate } from '@domain/aggregates/LabReportAggregate';

interface ReportOutdatedAlertBannerProps {
  allOutdatedReports: MedicalReport[];
  onFilterToOutdated: (specificCode?: string) => void;
  onPreviewReport: (report: MedicalReport) => void;
  onLoadReport: (report: MedicalReport) => void;
  onUpdateSingleReportPdf?: (report: MedicalReport) => void;
  onBatchUpdateOutdatedReports?: (reports: MedicalReport[]) => void;
  isUpdatingPdf?: boolean;
}

export const ReportOutdatedAlertBanner: React.FC<ReportOutdatedAlertBannerProps> = ({
  allOutdatedReports,
  onFilterToOutdated,
  onPreviewReport,
  onLoadReport,
  onUpdateSingleReportPdf,
  onBatchUpdateOutdatedReports,
  isUpdatingPdf = false
}) => {
  if (allOutdatedReports.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-950/90 via-amber-900/50 to-amber-950/90 border-b border-amber-500/40 shrink-0 text-xs shadow-inner">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <span className="text-amber-200 font-semibold">
              Phát hiện <strong className="text-amber-300 font-extrabold text-sm">{allOutdatedReports.length}</strong> phiếu có dữ liệu thay đổi sau khi xuất PDF:
            </span>
          </div>

          {/* Danh sách chi tiết các phiếu bị Outdated */}
          <div className="flex flex-wrap items-center gap-1.5 pl-6 sm:pl-7">
            {allOutdatedReports.slice(0, 5).map((rep) => {
              const agg = LabReportAggregate.fromSnapshot(rep);
              const docState = agg.documentState;
              const reasons = docState.status === 'OUTDATED' ? docState.dirtyReasons : [];
              const primaryReason = reasons.length > 0 ? reasons[0] : null;
              const allReasonsTooltip = reasons.length > 0 ? reasons.map((r) => `• ${r}`).join('\n') : undefined;

              return (
                <div
                  key={rep.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-amber-500/50 text-amber-200 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => onFilterToOutdated(rep.code)}
                    className="font-mono font-extrabold text-amber-400 hover:text-amber-300 hover:underline transition cursor-pointer"
                    title="Bấm để lọc phiếu này trong bảng"
                  >
                    {rep.code}
                  </button>
                  <span className="font-bold text-white uppercase truncate max-w-[130px]" title={rep.patient.name}>
                    {rep.patient.name || '---'}
                  </span>
                  {primaryReason && (
                    <span
                      className="text-[10px] text-amber-300/90 hidden sm:inline max-w-[240px] truncate cursor-help"
                      title={allReasonsTooltip}
                    >
                      • {primaryReason}{reasons.length > 1 ? ` (+${reasons.length - 1})` : ''}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 ml-1 border-l border-amber-500/30 pl-1">
                    <button
                      type="button"
                      onClick={() => onPreviewReport(rep)}
                      className="p-1 hover:bg-amber-500/30 text-slate-300 hover:text-white rounded transition cursor-pointer"
                      title="Xem trước mẫu in A4"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onLoadReport(rep)}
                      className="p-1 hover:bg-emerald-500/30 text-slate-300 hover:text-emerald-300 rounded transition cursor-pointer"
                      title="Nạp phiếu này lên form xét nghiệm"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    {onUpdateSingleReportPdf && (
                      <button
                        type="button"
                        onClick={() => onUpdateSingleReportPdf(rep)}
                        disabled={isUpdatingPdf}
                        className="p-1 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded transition disabled:opacity-50 cursor-pointer"
                        title="Cập nhật lại PDF cho riêng phiếu này"
                      >
                        <RefreshCw className={`w-3 h-3 ${isUpdatingPdf ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {allOutdatedReports.length > 5 && (
              <span className="text-slate-400 text-xs pl-1">
                +{allOutdatedReports.length - 5} phiếu khác
              </span>
            )}
          </div>
        </div>

        {/* Nhóm nút hành động */}
        <div className="flex items-center gap-2 self-end lg:self-center shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onFilterToOutdated()}
            className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            title="Lọc bảng danh sách chỉ hiển thị các phiếu cần cập nhật PDF"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Lọc Xem {allOutdatedReports.length} Phiếu Này</span>
          </button>

          {onBatchUpdateOutdatedReports && (
            <button
              type="button"
              onClick={() => onBatchUpdateOutdatedReports(allOutdatedReports)}
              disabled={isUpdatingPdf}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingPdf ? 'animate-spin' : ''}`} />
              <span>⚡ Cập Nhật PDF ({allOutdatedReports.length})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
