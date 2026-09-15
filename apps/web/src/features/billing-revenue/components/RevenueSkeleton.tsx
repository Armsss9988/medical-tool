import { Loader2 } from 'lucide-react';

interface RevenueSkeletonProps {
  rowsCount?: number;
}

export function RevenueKpiSkeleton() {
  return (
    <div
      data-testid="revenue-kpi-skeleton"
      className="flex overflow-x-auto no-scrollbar touch-pan-x lg:grid lg:grid-cols-6 gap-2 sm:gap-2.5 p-2.5 sm:p-4 bg-slate-950/40 border-b border-slate-800/80 text-xs shrink-0"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 sm:p-3 flex items-center justify-between shrink-0 min-w-[125px] lg:min-w-0 animate-pulse"
        >
          <div className="space-y-2">
            <div className="w-16 h-3 bg-slate-700/80 rounded" />
            <div className="w-24 h-5 bg-slate-600/90 rounded" />
          </div>
          <div className="w-5 h-5 bg-slate-700/60 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function InvoiceTableSkeleton({ rowsCount = 6 }: RevenueSkeletonProps) {
  const rows = Array.from({ length: rowsCount }, (_, i) => i);

  return (
    <div data-testid="invoice-table-skeleton" className="space-y-3">
      {/* Loading banner */}
      <div className="flex items-center justify-between px-3 py-2 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-300 animate-pulse">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
          <span className="font-semibold">Đang tải dữ liệu sổ sách hóa đơn & doanh thu từ máy chủ...</span>
        </div>
        <span className="text-[11px] text-amber-400/70 font-mono">TanStack Query</span>
      </div>

      {/* DESKTOP SKELETON TABLE (≥ md) */}
      <div className="hidden md:block border border-slate-800 rounded-xl overflow-hidden shadow-inner">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-800 text-slate-200 font-bold border-b border-slate-700 text-[11.5px]">
            <tr>
              <th className="p-2.5 w-10 text-center">STT</th>
              <th className="p-2.5">Mã HĐ & Ngày Lập</th>
              <th className="p-2.5">Bệnh Nhân & Mã BN</th>
              <th className="p-2.5">BS Chỉ Định & Gói</th>
              <th className="p-2.5">Số Dịch Vụ</th>
              <th className="p-2.5">Hình Thức</th>
              <th className="p-2.5 text-right">Giảm Giá</th>
              <th className="p-2.5 text-right">Thực Thu</th>
              <th className="p-2.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/40">
            {rows.map((idx) => (
              <tr key={idx} className="animate-pulse">
                {/* 1. STT */}
                <td className="p-2.5 text-center">
                  <div className="w-4 h-3.5 bg-slate-800 rounded mx-auto" />
                </td>

                {/* 2. Mã HĐ & Ngày Lập */}
                <td className="p-2.5 space-y-1.5">
                  <div className="w-24 h-4 bg-amber-500/20 rounded font-mono" />
                  <div className="w-16 h-3 bg-slate-800 rounded" />
                </td>

                {/* 3. Bệnh Nhân & Mã BN */}
                <td className="p-2.5 space-y-1.5">
                  <div className="w-32 h-4 bg-slate-700/80 rounded" />
                  <div className="w-20 h-3 bg-slate-800 rounded" />
                </td>

                {/* 4. BS Chỉ Định & Gói */}
                <td className="p-2.5 space-y-1.5">
                  <div className="w-24 h-3.5 bg-slate-800 rounded" />
                  <div className="w-28 h-3.5 bg-slate-800/70 rounded" />
                </td>

                {/* 5. Số Dịch Vụ */}
                <td className="p-2.5">
                  <div className="w-8 h-4 bg-slate-800 rounded-full" />
                </td>

                {/* 6. Hình Thức */}
                <td className="p-2.5">
                  <div className="w-20 h-5 bg-slate-800 rounded-md" />
                </td>

                {/* 7. Giảm Giá */}
                <td className="p-2.5 text-right">
                  <div className="w-16 h-4 bg-slate-800 rounded ml-auto" />
                </td>

                {/* 8. Thực Thu */}
                <td className="p-2.5 text-right">
                  <div className="w-20 h-4 bg-slate-700 rounded ml-auto" />
                </td>

                {/* 9. Thao Tác */}
                <td className="p-2.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-7 h-7 bg-slate-800 rounded-lg" />
                    <div className="w-7 h-7 bg-slate-800 rounded-lg" />
                    <div className="w-7 h-7 bg-slate-800 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE SKELETON CARDS (< md) */}
      <div className="md:hidden space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="w-24 h-4 bg-slate-700 rounded" />
              <div className="w-16 h-4 bg-slate-800 rounded-full" />
            </div>
            <div className="w-32 h-4 bg-slate-700/80 rounded" />
            <div className="flex justify-between items-center pt-1 border-t border-slate-700/40">
              <div className="w-20 h-4 bg-slate-700 rounded" />
              <div className="w-16 h-6 bg-slate-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
