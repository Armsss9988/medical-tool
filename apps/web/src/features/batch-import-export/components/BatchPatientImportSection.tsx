import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, Layers, Download, Sparkles, Upload, 
  CheckCircle, AlertCircle, AlertTriangle, 
  Trash2, Filter, Edit3, Edit2
} from 'lucide-react';
import { BatchImportRow, TestPackage, AiTemplateTarget, getPkgCodes, ImportRowAction, Doctor } from '@domain';
import { BatchImportBulkEditBar } from './BatchImportBulkEditBar';
import { BatchImportRowEditModal } from './BatchImportRowEditModal';

interface BatchPatientImportSectionProps {
  selectedBatchPackageId: string;
  setSelectedBatchPackageId: (id: string) => void;
  testPackages: TestPackage[];
  handleDownloadPatientTemplate: () => void;
  onOpenAiSmartFill?: (target?: AiTemplateTarget) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importedRows: BatchImportRow[];
  handleImportToReports: () => void;
  importError: string;
  duplicateCount?: number;
  newCount?: number;
  overwriteCount?: number;
  createNewCount?: number;
  setRowAction?: (target: number | string, action: ImportRowAction) => void;
  setAllDuplicateAction?: (action: ImportRowAction) => void;
  handleClearImportedRows?: () => void;
  // Selection & Editing
  selectedRowIds?: Set<string>;
  editingRow?: BatchImportRow | null;
  setEditingRow?: (row: BatchImportRow | null) => void;
  isRowSelected?: (id?: string) => boolean;
  toggleSelectRow?: (id: string) => void;
  toggleSelectAll?: (allIds: string[]) => void;
  updateRow?: (id: string, updatedRow: BatchImportRow) => void;
  deleteRow?: (id: string) => void;
  bulkUpdateSelectedRows?: (patch: { doctorName?: string; diagnosis?: string; address?: string; action?: ImportRowAction }) => void;
  bulkDeleteSelectedRows?: () => void;
  deselectAllRows?: () => void;
  doctorsList?: Doctor[];
}

export const BatchPatientImportSection: React.FC<BatchPatientImportSectionProps> = ({
  selectedBatchPackageId,
  setSelectedBatchPackageId,
  testPackages,
  handleDownloadPatientTemplate,
  onOpenAiSmartFill,
  fileInputRef,
  handleFileSelect,
  importedRows,
  handleImportToReports,
  importError,
  duplicateCount = 0,
  newCount = 0,
  overwriteCount = 0,
  createNewCount = 0,
  setRowAction,
  setAllDuplicateAction,
  handleClearImportedRows,
  selectedRowIds,
  editingRow,
  setEditingRow,
  isRowSelected,
  toggleSelectRow,
  toggleSelectAll,
  updateRow,
  deleteRow,
  bulkUpdateSelectedRows,
  bulkDeleteSelectedRows,
  deselectAllRows,
  doctorsList = []
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'NEW' | 'DUPLICATE'>('ALL');

  // Lọc danh sách theo tab xem
  const displayedItems = useMemo(() => {
    return importedRows
      .map((row, originalIndex) => ({ row, originalIndex }))
      .filter(({ row }) => {
        if (filterTab === 'NEW') return row.status === 'NEW';
        if (filterTab === 'DUPLICATE') return row.status === 'DUPLICATE';
        return true;
      });
  }, [importedRows, filterTab]);

  const displayedIds = useMemo(() => {
    return displayedItems.map(({ row }) => row.id!).filter(Boolean);
  }, [displayedItems]);

  const isAllDisplayedSelected = displayedIds.length > 0 && displayedIds.every((id) => isRowSelected?.(id));

  return (
    <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 md:p-5 space-y-4">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
        <div>
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>1. Nhập Bệnh Nhân &amp; Khám Đoàn Hàng Loạt</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Chọn gói xét nghiệm để tạo file mẫu chuyên biệt (hoặc mẫu tổng quát), sau đó nhập file kết quả đồng loạt.
          </p>
        </div>

        {/* Actions & Package Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Package Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/90 rounded-xl px-3 py-1.5 text-xs shadow-inner">
            <Layers className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-slate-400 font-bold shrink-0 hidden sm:inline">Mẫu Theo Gói:</span>
            <select
              value={selectedBatchPackageId}
              onChange={(e) => setSelectedBatchPackageId(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[210px] truncate"
              title="Chọn gói xét nghiệm áp dụng cho mẫu Excel"
            >
              <option value="all" className="bg-slate-900 text-slate-200">
                -- Tất cả chỉ số (Mẫu chung) --
              </option>
              {testPackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id} className="bg-slate-900 text-purple-200">
                  {pkg.name} ({getPkgCodes(pkg).length} chỉ số)
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleDownloadPatientTemplate}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            title="Tải template Excel khám đoàn theo gói đang chọn"
          >
            <Download className="w-4 h-4" />
            <span>
              {selectedBatchPackageId !== 'all' && testPackages.some((p) => p.id === selectedBatchPackageId)
                ? `Tải Mẫu Gói [${testPackages.find((p) => p.id === selectedBatchPackageId)?.name}]`
                : 'Tải Template Mẫu'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAiSmartFill?.('BATCH_PATIENTS')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer border border-purple-400/40"
            title="AI tự động đọc từ ảnh chụp, PDF hoặc văn bản và điền vào mẫu khám đoàn"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>✨ AI Điền Mẫu Khám Đoàn</span>
          </button>

          <label className="flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95">
            <Upload className="w-4 h-4" />
            <span>Chọn File Excel Batch</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>

      {importError && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* ─── REVIEW & DUPLICATE RESOLUTION SECTION ─────────────────────── */}
      {importedRows.length > 0 && (
        <div className="border border-slate-700/80 rounded-2xl overflow-hidden bg-slate-900/60 shadow-xl space-y-0">
          {/* SCAN SUMMARY & TOOLBAR */}
          <div className="p-3.5 bg-slate-800/90 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
            {/* Left: Metrics & Filter tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-300 mr-1 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-sky-400" />
                <span>Xem danh sách:</span>
              </span>

              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  filterTab === 'ALL'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                Tất cả ({importedRows.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('NEW')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  filterTab === 'NEW'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-700'
                }`}
              >
                <CheckCircle className="w-3 h-3" />
                <span>Mới ({newCount})</span>
              </button>

              {duplicateCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterTab('DUPLICATE')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    filterTab === 'DUPLICATE'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Trùng ({duplicateCount})</span>
                </button>
              )}
            </div>

            {/* Right: Bulk Action for Duplicates */}
            {duplicateCount > 0 && setAllDuplicateAction && (
              <div className="flex items-center gap-2 bg-slate-950/70 border border-amber-500/30 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-semibold text-amber-300 hidden sm:inline">
                  Bản ghi trùng:
                </span>
                <button
                  type="button"
                  onClick={() => setAllDuplicateAction('CREATE_NEW')}
                  className="px-2 py-0.5 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 rounded-lg transition cursor-pointer active:scale-95"
                  title="Đặt tất cả bản ghi trùng thành Thêm mới"
                >
                  + Thêm mới tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setAllDuplicateAction('OVERWRITE')}
                  className="px-2 py-0.5 text-[11px] font-bold bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded-lg transition cursor-pointer active:scale-95"
                  title="Đặt tất cả bản ghi trùng thành Ghi đè vào phiếu cũ"
                >
                  ✎ Ghi đè tất cả
                </button>
              </div>
            )}
          </div>

          {/* BULK EDIT TOOLBAR (WHEN ROWS ARE SELECTED) */}
          {selectedRowIds && selectedRowIds.size > 0 && (
            <div className="p-2.5 bg-slate-950/80 border-b border-slate-700">
              <BatchImportBulkEditBar
                selectedCount={selectedRowIds.size}
                totalCount={importedRows.length}
                doctorsList={doctorsList}
                onBulkAction={(act) => bulkUpdateSelectedRows?.({ action: act })}
                onBulkDoctor={(doc) => bulkUpdateSelectedRows?.({ doctorName: doc })}
                onBulkDiagnosis={(diag) => bulkUpdateSelectedRows?.({ diagnosis: diag })}
                onBulkDelete={() => bulkDeleteSelectedRows?.()}
                onDeselectAll={() => deselectAllRows?.()}
              />
            </div>
          )}

          {/* TABLE OF IMPORT ROWS */}
          <div className="max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800/90 text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-700">
                <tr>
                  <th className="p-2.5 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={isAllDisplayedSelected}
                      onChange={() => toggleSelectAll?.(displayedIds)}
                      className="w-4 h-4 rounded text-sky-600 bg-slate-950 border-slate-700 cursor-pointer accent-sky-500"
                      title="Chọn tất cả hiển thị"
                    />
                  </th>
                  <th className="p-2.5 w-10 text-center">STT</th>
                  <th className="p-2.5 w-32">Trạng Thái</th>
                  <th className="p-2.5 w-24">Mã BN</th>
                  <th className="p-2.5">Họ và Tên</th>
                  <th className="p-2.5 w-28">Năm Sinh / Phái</th>
                  <th className="p-2.5 text-center w-14">Chỉ Số</th>
                  <th className="p-2.5">BS Chỉ Định</th>
                  <th className="p-2.5 w-56 text-center">Hành Động &amp; Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                      Không có bản ghi nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  displayedItems.map(({ row, originalIndex }, displayIdx) => {
                    const isDup = row.status === 'DUPLICATE';
                    const isOverwrite = row.action === 'OVERWRITE';
                    const isSelected = isRowSelected?.(row.id);

                    return (
                      <tr
                        key={row.id || originalIndex}
                        className={`transition ${
                          isSelected
                            ? 'bg-sky-950/40 hover:bg-sky-950/60'
                            : isDup
                            ? 'bg-amber-950/20 hover:bg-amber-950/30'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* CHECKBOX */}
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => row.id && toggleSelectRow?.(row.id)}
                            className="w-4 h-4 rounded text-sky-600 bg-slate-950 border-slate-700 cursor-pointer accent-sky-500"
                          />
                        </td>

                        {/* STT */}
                        <td className="p-2.5 text-center text-slate-500 font-mono">
                          {displayIdx + 1}
                        </td>

                        {/* STATUS BADGE & REASON */}
                        <td className="p-2.5">
                          {isDup ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                <span>Trùng</span>
                              </span>
                              {row.duplicateReason && (
                                <p className="text-[10px] text-amber-400/80 truncate max-w-[130px]" title={row.duplicateReason}>
                                  {row.duplicateReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Mới</span>
                            </span>
                          )}
                        </td>

                        {/* MÃ BN */}
                        <td className="p-2.5 font-mono font-bold text-sky-400 truncate max-w-[100px]">
                          {row.patient.code || <span className="text-slate-500 italic">Tự sinh</span>}
                        </td>

                        {/* HỌ VÀ TÊN */}
                        <td className="p-2.5 font-bold text-white uppercase">
                          {row.patient.name}
                        </td>

                        {/* NĂM SINH / GIỚI TÍNH */}
                        <td className="p-2.5 text-slate-300">
                          <span>{row.patient.dob || '---'}</span>
                          <span className="text-slate-500 ml-1">({row.patient.gender || 'Nam'})</span>
                        </td>

                        {/* CHỈ SỐ */}
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-400">
                          {row.selectedTests.length}
                        </td>

                        {/* BÁC SĨ */}
                        <td className="p-2.5 text-slate-300 truncate max-w-[130px]" title={row.doctorName}>
                          {row.doctorName}
                        </td>

                        {/* HÀNH ĐỘNG & THAO TÁC */}
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* ACTION TOGGLE */}
                            {isDup ? (
                              <div className="inline-flex items-center bg-slate-950 border border-slate-700/80 rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => setRowAction?.(row.id || originalIndex, 'CREATE_NEW')}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                                    !isOverwrite
                                      ? 'bg-sky-600 text-white shadow-xs'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Thêm mới bản ghi"
                                >
                                  + Mới
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRowAction?.(row.id || originalIndex, 'OVERWRITE')}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer flex items-center gap-0.5 ${
                                    isOverwrite
                                      ? 'bg-amber-600 text-white shadow-xs'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Ghi đè phiếu cũ"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span>Đè</span>
                                </button>
                              </div>
                            ) : (
                              <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 rounded-lg">
                                + Mới
                              </span>
                            )}

                            {/* EDIT BUTTON */}
                            <button
                              type="button"
                              onClick={() => setEditingRow?.(row)}
                              className="p-1 text-slate-400 hover:text-sky-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition cursor-pointer"
                              title="Sửa thông tin bệnh nhân & kết quả"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* DELETE BUTTON */}
                            <button
                              type="button"
                              onClick={() => row.id && deleteRow?.(row.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-800 rounded-md transition cursor-pointer"
                              title="Xóa dòng này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="p-3 bg-slate-800/90 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-white">Đã sẵn sàng:</span>
              <span className="text-emerald-400 font-bold">{createNewCount} thêm mới</span>
              {overwriteCount > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-bold">{overwriteCount} ghi đè phiếu cũ</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {handleClearImportedRows && (
                <button
                  type="button"
                  onClick={handleClearImportedRows}
                  className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-rose-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hủy danh sách</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleImportToReports}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  Xác nhận nhập {importedRows.length} phiếu vào Sổ Lưu
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROW EDIT MODAL */}
      {editingRow && (
        <BatchImportRowEditModal
          isOpen={Boolean(editingRow)}
          row={editingRow}
          onClose={() => setEditingRow?.(null)}
          onSave={(id, updated) => updateRow?.(id, updated)}
          doctorsList={doctorsList}
        />
      )}

      {/* EMPTY INSTRUCTION */}
      {importedRows.length === 0 && !importError && (
        <div className="py-6 px-4 text-center text-slate-400 space-y-3 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl space-y-1">
              <div className="font-bold text-xs text-emerald-400">1. Tải File Mẫu</div>
              <p className="text-[11px] text-slate-400">Bấm nút "Tải Template Mẫu" để lấy file Excel đã sinh sẵn các cột thông tin và mã xét nghiệm.</p>
            </div>
            <div className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl space-y-1">
              <div className="font-bold text-xs text-sky-400">2. Điền Dữ Liệu</div>
              <p className="text-[11px] text-slate-400">Paste danh sách bệnh nhân và kết quả xét nghiệm. Parser tự động chuẩn hóa SĐT, giới tính, ngày sinh.</p>
            </div>
            <div className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl space-y-1">
              <div className="font-bold text-xs text-purple-400">3. Quét, Sửa &amp; Đối Soát</div>
              <p className="text-[11px] text-slate-400">Hệ thống quét trùng lặp, hỗ trợ chọn hàng loạt, sửa nhanh từng hàng trước khi lưu vào Sổ Lưu.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
