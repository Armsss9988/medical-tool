import React from 'react';
import { 
  Rocket, Ban, Archive, Filter, CheckSquare, Square, FileText 
} from 'lucide-react';
import { MedicalReport, BatchExportProgress, ReportKindResolver } from '@domain';

export type ExportFilterType = 'ALL' | 'TODAY' | 'NOT_EXPORTED' | 'EXPORTED';

interface BatchPdfExportSectionProps {
  filteredReports: MedicalReport[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  exportFilter: ExportFilterType;
  setExportFilter: (filter: ExportFilterType) => void;
  isBatchExporting: boolean;
  progress: BatchExportProgress;
  progressPercent: number;
  onStartBatchExport: () => void;
  onCancelBatch: () => void;
  onDownloadZip: () => void;
}

export const BatchPdfExportSection: React.FC<BatchPdfExportSectionProps> = ({
  filteredReports,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  exportFilter,
  setExportFilter,
  isBatchExporting,
  progress,
  progressPercent,
  onStartBatchExport,
  onCancelBatch,
  onDownloadZip
}) => {
  return (
    <div className="space-y-4">
      {/* Export Progress Panel (khi đang chạy hoặc đã xong) */}
      {(isBatchExporting || progress.status === 'done' || progress.status === 'cancelled') && (
        <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950/50">
          <div className="p-4 space-y-3">
            {/* Progress bar */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">
                {progress.status === 'running' ? '🚀 Đang xuất PDF đồng loạt...' :
                 progress.status === 'done' ? '✅ Hoàn tất!' :
                 progress.status === 'cancelled' ? '⏹️ Đã hủy' : ''}
              </span>
              <span className="font-mono font-bold text-sky-400">
                {progress.completed}/{progress.total} ({progressPercent}%)
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  progress.status === 'done' ? 'bg-emerald-500' :
                  progress.status === 'cancelled' ? 'bg-amber-500' : 'bg-sky-500 animate-pulse'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Current item */}
            {progress.current && (
              <p className="text-[11px] text-slate-400 font-mono truncate">
                Đang xử lý: {progress.current}
              </p>
            )}

            {/* Action buttons during/after export */}
            <div className="flex items-center justify-end gap-2 pt-1">
              {isBatchExporting && (
                <button
                  onClick={onCancelBatch}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Hủy Quá Trình</span>
                </button>
              )}

              {progress.status === 'done' && (
                <button
                  onClick={onDownloadZip}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Archive className="w-4 h-4" />
                  <span>Tải File .ZIP ({progress.completed} PDFs)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar: Filter + Select All + Start Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
        {/* Filter chips */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {(['ALL', 'TODAY', 'NOT_EXPORTED', 'EXPORTED'] as ExportFilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setExportFilter(f)}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                exportFilter === f
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {f === 'ALL' ? 'Tất cả' :
               f === 'TODAY' ? 'Hôm nay' :
               f === 'NOT_EXPORTED' ? 'Chưa xuất' : 'Đã xuất'}
            </button>
          ))}
        </div>

        {/* Selection & Export actions */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white font-bold cursor-pointer"
          >
            {selectedIds.size === filteredReports.length && filteredReports.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-sky-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>
              {selectedIds.size === filteredReports.length && filteredReports.length > 0
                ? 'Bỏ chọn tất cả'
                : `Chọn tất cả (${filteredReports.length})`}
            </span>
          </button>

          <button
            onClick={onStartBatchExport}
            disabled={isBatchExporting || selectedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
          >
            <Rocket className="w-4 h-4" />
            <span>Bắt đầu xuất PDF ({selectedIds.size})</span>
          </button>
        </div>
      </div>

      {/* Reports Table for selection */}
      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-slate-300 font-bold sticky top-0 z-10">
              <tr>
                <th className="p-2.5 w-10 text-center">
                  <button onClick={onSelectAll} className="p-0.5 cursor-pointer">
                    {selectedIds.size === filteredReports.length && filteredReports.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </th>
                <th className="p-2.5">Mã BN</th>
                <th className="p-2.5">Họ và Tên</th>
                <th className="p-2.5">Thời gian tạo</th>
                <th className="p-2.5 text-center">Loại phiếu</th>
                <th className="p-2.5 text-center">Số chỉ số</th>
                <th className="p-2.5 text-center">Trạng thái PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold">Không có phiếu nào khớp với bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const isSelected = selectedIds.has(r.id);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onToggleSelect(r.id)}
                      className={`hover:bg-slate-800/40 transition cursor-pointer ${
                        isSelected ? 'bg-sky-950/20' : ''
                      }`}
                    >
                      <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onToggleSelect(r.id)} className="p-0.5 cursor-pointer">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td className="p-2.5 font-mono font-bold text-sky-400">{r.patient.code}</td>
                      <td className="p-2.5 font-bold text-white uppercase">{r.patient.name}</td>
                      <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                        {new Date(r.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-2.5 text-center">
                        {ReportKindResolver.match(ReportKindResolver.resolve(r.selectedTests), {
                          allergen: () => (
                            <span className="text-[10px] bg-red-950/80 text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-800/60">
                              Panel 91
                            </span>
                          ),
                          hybrid: () => (
                            <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded-full font-bold border border-purple-800/60">
                              Hybrid
                            </span>
                          ),
                          clinical: () => (
                            <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-800/60">
                              Chuẩn A4
                            </span>
                          ),
                        })}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-300">
                        {r.selectedTests?.length || r.testCount || 0}
                      </td>
                      <td className="p-2.5 text-center">
                        {r.cloudPdfUrl ? (
                          <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-800/60">
                            Đã xuất Cloud
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                            Chưa xuất
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
