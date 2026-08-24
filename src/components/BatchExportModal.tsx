import { useState, useMemo, useRef } from 'react';
import {
  X, Upload, Download, FileSpreadsheet, Rocket, CheckCircle, AlertCircle,
  Square, CheckSquare, Filter, FileText, Package, Ban, Archive
} from 'lucide-react';
import {
  MedicalReport, CatalogItem, ClinicInfo, BatchImportRow, BatchExportProgress, ToastType
} from '@domain/types';
import { exportBatchTemplateExcel, parseExcelBatchPatients } from '@infra/excelService';

type TabType = 'IMPORT' | 'EXPORT';
type ExportFilterType = 'ALL' | 'TODAY' | 'NOT_EXPORTED' | 'EXPORTED';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: MedicalReport[];
  catalog: CatalogItem[];
  clinicInfo: ClinicInfo;
  // Batch Import
  onBatchImport: (rows: BatchImportRow[]) => void;
  // Batch Export
  progress: BatchExportProgress;
  isBatchExporting: boolean;
  onBatchExport: (reports: MedicalReport[]) => void;
  onCancelBatch: () => void;
  onDownloadZip: () => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export default function BatchExportModal({
  isOpen,
  onClose,
  reports,
  catalog,
  clinicInfo: _clinicInfo,
  onBatchImport,
  progress,
  isBatchExporting,
  onBatchExport,
  onCancelBatch,
  onDownloadZip,
  showToast
}: BatchExportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('EXPORT');

  // ─── IMPORT TAB STATE ──────────────────────────────────────────────────
  const [importedRows, setImportedRows] = useState<BatchImportRow[]>([]);
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── EXPORT TAB STATE ──────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportFilter, setExportFilter] = useState<ExportFilterType>('ALL');

  // Filter reports for export tab
  const filteredReports = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    return reports.filter((r) => {
      if (exportFilter === 'TODAY') {
        return new Date(r.createdAt).toDateString() === todayStr;
      }
      if (exportFilter === 'NOT_EXPORTED') {
        return !r.cloudPdfUrl;
      }
      if (exportFilter === 'EXPORTED') {
        return !!r.cloudPdfUrl;
      }
      return true;
    });
  }, [reports, exportFilter]);

  // ─── IMPORT HANDLERS ──────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportError('');
      showToast('Đang đọc file Excel batch...', 'info');
      const rows = await parseExcelBatchPatients(file, catalog);
      setImportedRows(rows);
      showToast(`Đã parse thành công ${rows.length} bệnh nhân từ file Excel!`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi đọc file Excel';
      setImportError(msg);
      showToast(`Lỗi import: ${msg}`, 'error');
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportToReports = () => {
    if (importedRows.length === 0) return;
    onBatchImport(importedRows);
    showToast(`Đã nhập ${importedRows.length} phiếu bệnh nhân vào Sổ Lưu!`, 'success');
    setImportedRows([]);
  };

  const handleDownloadTemplate = () => {
    exportBatchTemplateExcel(catalog);
    showToast('Đã tải file Excel Template mẫu về máy!', 'success');
  };

  // ─── EXPORT HANDLERS ──────────────────────────────────────────────────

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredReports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReports.map((r) => r.id)));
    }
  };

  const handleStartBatchExport = () => {
    const toExport = filteredReports.filter((r) => selectedIds.has(r.id));
    if (toExport.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 phiếu để xuất PDF!', 'error');
      return;
    }
    onBatchExport(toExport);
  };

  const progressPercent = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[92vh] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Import Batch & Xuất PDF Đồng Loạt
              </h3>
              <p className="text-xs text-slate-400">
                Nhập liệu hàng loạt từ Excel hoặc xuất toàn bộ phiếu XN thành PDF + Upload Cloud
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isBatchExporting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB HEADERS */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 shrink-0">
          <button
            onClick={() => setActiveTab('IMPORT')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition border-b-2 ${
              activeTab === 'IMPORT'
                ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import Batch từ Excel</span>
          </button>
          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition border-b-2 ${
              activeTab === 'EXPORT'
                ? 'text-sky-400 border-sky-500 bg-sky-500/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>Xuất PDF Đồng Loạt ({reports.length})</span>
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">

          {/* ══════════════ TAB 1: IMPORT ══════════════ */}
          {activeTab === 'IMPORT' && (
            <div className="space-y-4">
              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Template Excel Mẫu</span>
                </button>

                <label className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer active:scale-95">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Chọn File Excel Batch</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>

                {importedRows.length > 0 && (
                  <button
                    onClick={handleImportToReports}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Nhập {importedRows.length} phiếu vào Sổ Lưu</span>
                  </button>
                )}
              </div>

              {importError && (
                <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview imported rows */}
              {importedRows.length > 0 && (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">
                      Xem trước: {importedRows.length} bệnh nhân đã parse thành công
                    </span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-800 text-slate-300 font-bold sticky top-0 z-10">
                        <tr>
                          <th className="p-2.5 w-10 text-center">STT</th>
                          <th className="p-2.5">Mã BN</th>
                          <th className="p-2.5">Họ và Tên</th>
                          <th className="p-2.5">Năm sinh</th>
                          <th className="p-2.5 text-center">Số chỉ số</th>
                          <th className="p-2.5">BS Chỉ Định</th>
                          <th className="p-2.5">Kết Luận</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {importedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            <td className="p-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                            <td className="p-2.5 font-mono text-sky-400 font-bold">{row.patient.code}</td>
                            <td className="p-2.5 font-bold text-white uppercase">{row.patient.name}</td>
                            <td className="p-2.5 text-slate-300">{row.patient.dob}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-emerald-400">{row.selectedTests.length}</td>
                            <td className="p-2.5 text-slate-300">{row.doctorName}</td>
                            <td className="p-2.5 text-slate-400 truncate max-w-[200px]">{row.conclusion || '---'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importedRows.length === 0 && !importError && (
                <div className="py-16 text-center text-slate-500 space-y-3">
                  <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-700" />
                  <p className="text-sm font-semibold text-slate-400">
                    Bước 1: Tải file Template Excel mẫu → Điền dữ liệu bệnh nhân & kết quả
                  </p>
                  <p className="text-xs text-slate-500">
                    Bước 2: Chọn file Excel đã điền → Kiểm tra preview → Nhập vào Sổ Lưu
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ TAB 2: EXPORT ══════════════ */}
          {activeTab === 'EXPORT' && (
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
                        {progress.completed} / {progress.total} ({progressPercent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progress.status === 'done' ? 'bg-emerald-500' :
                          progress.status === 'cancelled' ? 'bg-amber-500' :
                          progress.status === 'error' ? 'bg-rose-500' :
                          'bg-sky-500 animate-pulse'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {progress.current && (
                      <p className="text-xs text-slate-400">
                        Đang xử lý: <strong className="text-white">{progress.current}</strong>
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {isBatchExporting && (
                        <button
                          onClick={onCancelBatch}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition active:scale-95"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Hủy Batch</span>
                        </button>
                      )}

                      {progress.status === 'done' && progress.results.length > 0 && (
                        <button
                          onClick={onDownloadZip}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
                        >
                          <Archive className="w-4 h-4" />
                          <span>Tải ZIP ({progress.results.length} file PDF)</span>
                        </button>
                      )}
                    </div>

                    {/* Error summary */}
                    {progress.errors.length > 0 && (
                      <div className="mt-2 p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg space-y-1">
                        <p className="text-xs font-bold text-rose-400">
                          ⚠️ {progress.errors.length} phiếu gặp lỗi:
                        </p>
                        {progress.errors.map((err, i) => (
                          <p key={i} className="text-[11px] text-rose-300/80">
                            • {err.patientName} ({err.code}): {err.error}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Success summary */}
                    {progress.status === 'done' && progress.results.length > 0 && (
                      <div className="mt-2 p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg">
                        <p className="text-xs font-bold text-emerald-400 mb-1">
                          ✅ {progress.results.length} phiếu xuất thành công:
                        </p>
                        <div className="max-h-[120px] overflow-y-auto space-y-0.5">
                          {progress.results.map((r, i) => (
                            <p key={i} className="text-[11px] text-emerald-300/80 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              {r.patientName} ({r.code})
                              {r.cloudUrl && !r.cloudUrl.startsWith('data:') && (
                                <a
                                  href={r.cloudUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-400 hover:underline ml-1"
                                >
                                  [Cloud Link]
                                </a>
                              )}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Filter + Select All */}
              {!isBatchExporting && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400 font-medium">Lọc:</span>
                    </div>
                    {([
                      { value: 'ALL', label: 'Tất cả' },
                      { value: 'TODAY', label: 'Hôm nay' },
                      { value: 'NOT_EXPORTED', label: 'Chưa xuất Cloud' },
                      { value: 'EXPORTED', label: 'Đã xuất Cloud' }
                    ] as { value: ExportFilterType; label: string }[]).map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setExportFilter(f.value)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition border ${
                          exportFilter === f.value
                            ? 'bg-sky-600 text-white border-sky-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}

                    <div className="flex-1" />

                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition border border-slate-700"
                    >
                      {selectedIds.size === filteredReports.length && filteredReports.length > 0
                        ? <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                        : <Square className="w-3.5 h-3.5" />
                      }
                      <span>
                        {selectedIds.size === filteredReports.length && filteredReports.length > 0
                          ? 'Bỏ chọn tất cả'
                          : `Chọn tất cả (${filteredReports.length})`
                        }
                      </span>
                    </button>
                  </div>

                  {/* Reports list with checkboxes */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <div className="max-h-[400px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-800 text-slate-300 font-bold sticky top-0 z-10">
                          <tr>
                            <th className="p-2.5 w-10 text-center">Chọn</th>
                            <th className="p-2.5">Mã Phiếu</th>
                            <th className="p-2.5">Bệnh Nhân</th>
                            <th className="p-2.5 text-center">Số Chỉ Số</th>
                            <th className="p-2.5">Trạng Thái</th>
                            <th className="p-2.5">Cloud</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {filteredReports.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-500">
                                <FileText className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                                <p className="font-semibold">Không có phiếu nào phù hợp với bộ lọc</p>
                              </td>
                            </tr>
                          ) : (
                            filteredReports.map((rep) => {
                              const isSelected = selectedIds.has(rep.id);
                              return (
                                <tr
                                  key={rep.id}
                                  onClick={() => handleToggleSelect(rep.id)}
                                  className={`cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-sky-950/40 hover:bg-sky-950/60'
                                      : 'hover:bg-slate-800/40'
                                  }`}
                                >
                                  <td className="p-2.5 text-center">
                                    {isSelected
                                      ? <CheckSquare className="w-4 h-4 text-sky-400 mx-auto" />
                                      : <Square className="w-4 h-4 text-slate-600 mx-auto" />
                                    }
                                  </td>
                                  <td className="p-2.5 font-mono font-bold text-sky-400">{rep.code}</td>
                                  <td className="p-2.5">
                                    <span className="font-bold text-white uppercase block">{rep.patient.name}</span>
                                    <span className="text-[11px] text-slate-400">{rep.patient.dob} • {rep.patient.gender}</span>
                                  </td>
                                  <td className="p-2.5 text-center font-mono font-bold text-slate-300">
                                    {rep.testCount || rep.selectedTests.length}
                                  </td>
                                  <td className="p-2.5">
                                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      rep.status === 'Đã xuất Cloud'
                                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                        : rep.status === 'Đã có kết quả'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'bg-slate-700 text-slate-300'
                                    }`}>
                                      {rep.status}
                                    </span>
                                  </td>
                                  <td className="p-2.5">
                                    {rep.cloudPdfUrl
                                      ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                                      : <span className="text-[10px] text-slate-500">Chưa</span>
                                    }
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0 text-xs">
          <div className="text-slate-400">
            {activeTab === 'EXPORT' && (
              <>
                Đã chọn: <strong className="text-white font-mono">{selectedIds.size}</strong> / {filteredReports.length} phiếu
              </>
            )}
            {activeTab === 'IMPORT' && importedRows.length > 0 && (
              <>
                Đã parse: <strong className="text-emerald-400 font-mono">{importedRows.length}</strong> bệnh nhân
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'EXPORT' && !isBatchExporting && selectedIds.size > 0 && (
              <button
                onClick={handleStartBatchExport}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95"
              >
                <Rocket className="w-4 h-4" />
                <span>🚀 Xuất PDF Đồng Loạt ({selectedIds.size} phiếu)</span>
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isBatchExporting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition disabled:opacity-50"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
