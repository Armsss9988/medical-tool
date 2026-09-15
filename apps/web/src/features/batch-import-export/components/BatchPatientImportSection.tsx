import React from 'react';
import { 
  FileSpreadsheet, Layers, Download, Sparkles, Upload, 
  CheckCircle, AlertCircle 
} from 'lucide-react';
import { BatchImportRow, TestPackage, AiTemplateTarget, getPkgCodes } from '@domain';

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
  importError
}) => {
  return (
    <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 md:p-5 space-y-4">
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

          {importedRows.length > 0 && (
            <button
              type="button"
              onClick={handleImportToReports}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer animate-pulse"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Nhập {importedRows.length} phiếu vào Sổ Lưu</span>
            </button>
          )}
        </div>
      </div>

      {importError && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* Preview imported rows */}
      {importedRows.length > 0 && (
        <div className="border border-slate-700/80 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">
              Xem trước: {importedRows.length} bệnh nhân đã parse thành công
            </span>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
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
              <div className="font-bold text-xs text-purple-400">3. Xem &amp; Lưu</div>
              <p className="text-[11px] text-slate-400">Bấm "Chọn File Excel Batch" $\rightarrow$ Xem trước bảng đối soát $\rightarrow$ Nhập vào Sổ Lưu.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
