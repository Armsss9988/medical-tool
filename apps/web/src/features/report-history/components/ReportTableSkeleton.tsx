import { Loader2 } from 'lucide-react';

interface ReportTableSkeletonProps {
  rowsCount?: number;
}

export function ReportTableSkeleton({ rowsCount = 6 }: ReportTableSkeletonProps) {
  const rows = Array.from({ length: rowsCount }, (_, i) => i);

  return (
    <div data-testid="report-table-skeleton" className="space-y-3">
      {/* Loading banner */}
      <div className="flex items-center justify-between px-3 py-2 bg-sky-950/30 border border-sky-500/30 rounded-xl text-xs text-sky-300 animate-pulse">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
          <span className="font-semibold">Đang tải danh sách hồ sơ phiếu khám từ máy chủ...</span>
        </div>
        <span className="text-[11px] text-sky-400/70 font-mono">TanStack Query</span>
      </div>

      {/* DESKTOP SKELETON TABLE (≥ md) */}
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
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
            {rows.map((idx) => (
              <tr key={idx} className="animate-pulse">
                {/* 1. STT */}
                <td className="p-3 text-center">
                  <div className="w-5 h-4 bg-slate-800 rounded mx-auto" />
                </td>

                {/* 2. Mã Phiếu & Thời Gian */}
                <td className="p-3 space-y-1.5">
                  <div className="w-24 h-4 bg-slate-700/80 rounded" />
                  <div className="w-16 h-3 bg-slate-800 rounded" />
                </td>

                {/* 3. Bệnh Nhân & Năm Sinh */}
                <td className="p-3 space-y-1.5">
                  <div className="w-32 h-4 bg-slate-700/90 rounded" />
                  <div className="w-20 h-3 bg-slate-800 rounded" />
                </td>

                {/* 4. Số ĐT & Địa Chỉ */}
                <td className="p-3 space-y-1.5">
                  <div className="w-24 h-3.5 bg-slate-800 rounded" />
                  <div className="w-28 h-3 bg-slate-800/80 rounded" />
                </td>

                {/* 5. Bác Sĩ & Loại Phiếu */}
                <td className="p-3 space-y-1.5">
                  <div className="w-24 h-3.5 bg-slate-800 rounded" />
                  <div className="w-20 h-4 bg-slate-800/70 rounded-full" />
                </td>

                {/* 6. Số Chỉ Số */}
                <td className="p-3 text-center">
                  <div className="w-7 h-4 bg-slate-800 rounded-full mx-auto" />
                </td>

                {/* 7. Thu Phí & Doanh Thu */}
                <td className="p-3 space-y-1.5">
                  <div className="w-20 h-4 bg-slate-800 rounded-md" />
                  <div className="w-16 h-3 bg-slate-800/70 rounded" />
                </td>

                {/* 8. Tình Trạng PDF */}
                <td className="p-3">
                  <div className="w-24 h-5 bg-slate-800 rounded-md" />
                </td>

                {/* 9. Thao Tác */}
                <td className="p-3">
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
          <div key={i} className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2.5 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="w-24 h-4 bg-slate-700 rounded" />
              <div className="w-16 h-4 bg-slate-800 rounded-full" />
            </div>
            <div className="w-36 h-4 bg-slate-700/90 rounded" />
            <div className="flex justify-between items-center pt-1">
              <div className="w-20 h-3 bg-slate-800 rounded" />
              <div className="w-16 h-6 bg-slate-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
