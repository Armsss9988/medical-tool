import React from 'react';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  CreditCard 
} from 'lucide-react';
import { 
  ReportFilterStats, 
  PaymentFilterType, 
  PdfStatusFilterType 
} from '../hooks/useReportFilterAndStats';

interface ReportKpiBannerProps {
  stats: ReportFilterStats;
  paymentFilter: PaymentFilterType;
  setPaymentFilter: (filter: PaymentFilterType) => void;
  pdfFilter: PdfStatusFilterType;
  setPdfFilter: (filter: PdfStatusFilterType) => void;
}

export const ReportKpiBanner: React.FC<ReportKpiBannerProps> = ({
  stats,
  paymentFilter,
  setPaymentFilter,
  pdfFilter,
  setPdfFilter
}) => {
  return (
    <div className="flex overflow-x-auto no-scrollbar touch-pan-x sm:grid sm:grid-cols-6 gap-2 sm:gap-2.5 p-2.5 sm:p-4 bg-slate-950/50 border-b border-slate-800 shrink-0 text-xs">
      {/* KPI: Tổng số phiếu */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 sm:p-3 flex items-center justify-between shrink-0 min-w-[110px] sm:min-w-0">
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Tổng số phiếu</span>
          <strong className="text-sm sm:text-base font-extrabold text-white font-mono">{stats.total}</strong>
        </div>
        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400/80" />
      </div>

      {/* KPI: Phiếu hôm nay */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 sm:p-3 flex items-center justify-between shrink-0 min-w-[110px] sm:min-w-0">
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Phiếu hôm nay</span>
          <strong className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">{stats.today}</strong>
        </div>
        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400/80" />
      </div>

      {/* KPI: Đã Thu Phí */}
      <div 
        onClick={() => setPaymentFilter(paymentFilter === 'PAID' ? 'ALL' : 'PAID')}
        className={`bg-slate-900 border rounded-xl p-2 sm:p-3 flex items-center justify-between cursor-pointer transition shrink-0 min-w-[110px] sm:min-w-0 ${
          paymentFilter === 'PAID' 
            ? 'border-emerald-500 bg-emerald-950/30' 
            : 'border-slate-800 hover:border-emerald-500/50'
        }`}
        title="Click để lọc các phiếu đã thu phí"
      >
        <div>
          <span className="text-[10px] sm:text-[11px] text-emerald-400 block font-medium flex items-center gap-1">
            <span>Đã thu phí</span>
            {paymentFilter === 'PAID' && <span className="text-[9px] bg-emerald-400 text-slate-950 px-1 rounded font-black">Lọc</span>}
          </span>
          <strong className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">{stats.paidCount}</strong>
        </div>
        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400/80" />
      </div>

      {/* KPI: Chưa Thu Phí */}
      <div 
        onClick={() => setPaymentFilter(paymentFilter === 'UNPAID' ? 'ALL' : 'UNPAID')}
        className={`bg-slate-900 border rounded-xl p-2 sm:p-3 flex items-center justify-between cursor-pointer transition shrink-0 min-w-[110px] sm:min-w-0 ${
          paymentFilter === 'UNPAID' 
            ? 'border-amber-500 bg-amber-950/30' 
            : 'border-slate-800 hover:border-amber-500/50'
        }`}
        title="Click để lọc các phiếu chưa thu tiền"
      >
        <div>
          <span className="text-[10px] sm:text-[11px] text-amber-400 block font-medium flex items-center gap-1">
            <span>Chưa thu phí</span>
            {paymentFilter === 'UNPAID' && <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black">Lọc</span>}
          </span>
          <strong className="text-sm sm:text-base font-extrabold text-amber-400 font-mono">{stats.unpaidCount}</strong>
        </div>
        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400/80" />
      </div>

      {/* KPI: PDF Lỗi Thời (Outdated) */}
      <div 
        onClick={() => setPdfFilter(pdfFilter === 'OUTDATED' ? 'ALL' : 'OUTDATED')}
        className={`bg-slate-900 border rounded-xl p-2 sm:p-3 flex items-center justify-between cursor-pointer transition shrink-0 min-w-[110px] sm:min-w-0 ${
          stats.outdated > 0 
            ? 'border-amber-500/50 hover:bg-amber-950/20' 
            : 'border-slate-800 opacity-80'
        }`}
        title="Click để lọc các phiếu cần cập nhật lại PDF"
      >
        <div>
          <span className="text-[10px] sm:text-[11px] text-amber-400 block font-medium flex items-center gap-1">
            <span>PDF lỗi thời</span>
            {pdfFilter === 'OUTDATED' && <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black">Lọc</span>}
          </span>
          <strong className="text-sm sm:text-base font-extrabold text-amber-400 font-mono">{stats.outdated}</strong>
        </div>
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400/90" />
      </div>

      {/* KPI: PDF Mới */}
      <div 
        onClick={() => setPdfFilter(pdfFilter === 'LATEST' ? 'ALL' : 'LATEST')}
        className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-2 sm:p-3 flex items-center justify-between cursor-pointer transition shrink-0 min-w-[110px] sm:min-w-0"
        title="Click để lọc các phiếu đã xuất PDF mới nhất"
      >
        <div>
          <span className="text-[10px] sm:text-[11px] text-emerald-400 block font-medium flex items-center gap-1">
            <span>PDF Mới</span>
            {pdfFilter === 'LATEST' && <span className="text-[9px] bg-emerald-400 text-slate-950 px-1 rounded font-black">Lọc</span>}
          </span>
          <strong className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">{stats.latest}</strong>
        </div>
        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400/80" />
      </div>
    </div>
  );
};
