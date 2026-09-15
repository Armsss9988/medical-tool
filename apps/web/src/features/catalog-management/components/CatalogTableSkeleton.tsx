import { Loader2 } from 'lucide-react';

interface CatalogTableSkeletonProps {
  rowsCount?: number;
}

export function CatalogTableSkeleton({ rowsCount = 6 }: CatalogTableSkeletonProps) {
  const rows = Array.from({ length: rowsCount }, (_, i) => i);

  return (
    <div data-testid="catalog-table-skeleton" className="space-y-3">
      {/* Loading banner */}
      <div className="flex items-center justify-between px-3 py-2 bg-sky-950/30 border border-sky-500/30 rounded-xl text-xs text-sky-300 animate-pulse">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
          <span className="font-semibold">Đang nạp dữ liệu danh mục xét nghiệm & cấu hình từ máy chủ...</span>
        </div>
        <span className="text-[11px] text-sky-400/70 font-mono">TanStack Query</span>
      </div>

      {/* SKELETON TABLE */}
      <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-800 text-slate-200 font-bold border-b border-slate-700">
            <tr>
              <th className="p-2.5 w-10 text-center">STT</th>
              <th className="p-2.5">Mã Chỉ Số</th>
              <th className="p-2.5">Tên Xét Nghiệm</th>
              <th className="p-2.5">Nhóm In</th>
              <th className="p-2.5">Đơn Vị</th>
              <th className="p-2.5">Thiết Bị / Máy Đo</th>
              <th className="p-2.5">Khoảng Tham Chiếu</th>
              <th className="p-2.5 text-right">Đơn Giá</th>
              <th className="p-2.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
            {rows.map((idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="p-2.5 text-center">
                  <div className="w-4 h-3 bg-slate-800 rounded mx-auto" />
                </td>
                <td className="p-2.5">
                  <div className="w-16 h-4 bg-sky-500/20 rounded font-mono" />
                </td>
                <td className="p-2.5">
                  <div className="w-36 h-4 bg-slate-700/80 rounded" />
                </td>
                <td className="p-2.5">
                  <div className="w-20 h-4 bg-slate-800 rounded-full" />
                </td>
                <td className="p-2.5">
                  <div className="w-12 h-3.5 bg-slate-800 rounded" />
                </td>
                <td className="p-2.5">
                  <div className="w-28 h-4 bg-slate-800/90 rounded" />
                </td>
                <td className="p-2.5">
                  <div className="w-32 h-3.5 bg-slate-800/70 rounded" />
                </td>
                <td className="p-2.5 text-right">
                  <div className="w-16 h-4 bg-slate-800 rounded ml-auto" />
                </td>
                <td className="p-2.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-6 h-6 bg-slate-800 rounded-lg" />
                    <div className="w-6 h-6 bg-slate-800 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
