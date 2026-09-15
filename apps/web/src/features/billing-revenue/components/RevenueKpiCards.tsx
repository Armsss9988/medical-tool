import { DollarSign, Clock, Percent, Users, TrendingUp } from 'lucide-react';
import type { MedicalReport, RevenueTabType } from '@domain';

export interface RevenueKpiCardsProps {
  kpis: {
    totalFinal: number;
    totalRaw: number;
    totalDiscount: number;
    count: number;
    aov: number;
    cashTotal: number;
    vietQrTotal: number;
    posTotal: number;
  };
  totalPendingAmount: number;
  pendingReports: MedicalReport[];
  onSelectPendingTab: (tab: RevenueTabType) => void;
}

export function RevenueKpiCards({
  kpis,
  totalPendingAmount,
  pendingReports,
  onSelectPendingTab
}: RevenueKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 p-3 sm:p-3.5 bg-slate-900/60 border-b border-slate-800 text-xs shrink-0 overflow-x-auto">
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 sm:p-3 flex items-center justify-between shrink-0 min-w-[125px] lg:min-w-0">
        <div>
          <p className="text-slate-400 font-medium text-[10px] sm:text-[11px]">Doanh thu thực thu</p>
          <p className="text-xs sm:text-sm lg:text-base font-black text-amber-400 font-mono mt-0.5">
            {kpis.totalFinal.toLocaleString('vi-VN')} đ
          </p>
        </div>
        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400/80" />
      </div>

      <div
        onClick={() => onSelectPendingTab('PENDING_PAYMENT')}
        className={`border rounded-xl p-2.5 sm:p-3 flex items-center justify-between cursor-pointer transition shrink-0 min-w-[125px] lg:min-w-0 ${
          totalPendingAmount > 0
            ? 'bg-rose-950/20 border-rose-500/40 hover:bg-rose-950/40'
            : 'bg-slate-800/60 border-slate-700/60'
        }`}
        title="Click để xem danh sách phiếu chờ thu tiền"
      >
        <div>
          <p className="text-rose-300 font-medium text-[10px] sm:text-[11px] flex items-center gap-1">
            <span>Chờ thu</span>
            {pendingReports.length > 0 && (
              <span className="text-[9px] bg-rose-500 text-white px-1 rounded font-bold">{pendingReports.length}</span>
            )}
          </p>
          <p className="text-xs sm:text-sm lg:text-base font-black text-rose-400 font-mono mt-0.5">
            {totalPendingAmount.toLocaleString('vi-VN')} đ
          </p>
        </div>
        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400/80" />
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 sm:p-3 flex items-center justify-between shrink-0 min-w-[125px] lg:min-w-0">
        <div>
          <p className="text-slate-400 font-medium text-[10px] sm:text-[11px]">Tổng giảm giá</p>
          <p className="text-xs sm:text-sm lg:text-base font-black text-rose-300 font-mono mt-0.5">
            {kpis.totalDiscount.toLocaleString('vi-VN')} đ
          </p>
        </div>
        <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300/80" />
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 sm:p-3 flex items-center justify-between shrink-0 min-w-[125px] lg:min-w-0">
        <div>
          <p className="text-slate-400 font-medium text-[10px] sm:text-[11px]">Số ca đã thu</p>
          <p className="text-xs sm:text-sm lg:text-base font-black text-white font-mono mt-0.5">
            {kpis.count} lượt
          </p>
        </div>
        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400/80" />
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 sm:p-3 flex items-center justify-between shrink-0 min-w-[125px] lg:min-w-0">
        <div>
          <p className="text-slate-400 font-medium text-[10px] sm:text-[11px]">TB / Lượt (AOV)</p>
          <p className="text-xs sm:text-sm lg:text-base font-black text-emerald-400 font-mono mt-0.5">
            {kpis.aov.toLocaleString('vi-VN')} đ
          </p>
        </div>
        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400/80" />
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 flex flex-col justify-between shrink-0 min-w-[125px] lg:min-w-0">
        <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-400">Cơ cấu:</span>
        <div className="flex flex-col space-y-0.5 font-mono text-[10px] sm:text-[10.5px]">
          <span className="text-slate-300">TM: <strong className="text-white">{kpis.cashTotal.toLocaleString('vi-VN')}</strong></span>
          <span className="text-indigo-300">QR: <strong className="text-white">{kpis.vietQrTotal.toLocaleString('vi-VN')}</strong></span>
        </div>
      </div>
    </div>
  );
}
