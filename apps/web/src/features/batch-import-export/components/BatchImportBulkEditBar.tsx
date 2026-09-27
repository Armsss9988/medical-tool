import React, { useState } from 'react';
import { 
  CheckSquare, Trash2, X, Stethoscope, 
  FileEdit, AlertCircle 
} from 'lucide-react';
import { Doctor, ImportRowAction } from '@domain';

interface BatchImportBulkEditBarProps {
  selectedCount: number;
  totalCount: number;
  doctorsList?: Doctor[];
  onBulkAction: (action: ImportRowAction) => void;
  onBulkDoctor: (doctorName: string) => void;
  onBulkDiagnosis: (diagnosis: string) => void;
  onBulkDelete: () => void;
  onDeselectAll: () => void;
}

export const BatchImportBulkEditBar: React.FC<BatchImportBulkEditBarProps> = ({
  selectedCount,
  totalCount,
  doctorsList = [],
  onBulkAction,
  onBulkDoctor,
  onBulkDiagnosis,
  onBulkDelete,
  onDeselectAll
}) => {
  const [showDiagnosisPrompt, setShowDiagnosisPrompt] = useState(false);
  const [diagnosisValue, setDiagnosisValue] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/40 rounded-xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
      {/* LEFT: SELECTION BADGE & CLEAR */}
      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
          <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
          <span>Đã chọn {selectedCount} / {totalCount} bệnh nhân</span>
        </span>

        <button
          type="button"
          onClick={onDeselectAll}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition cursor-pointer"
          title="Bỏ chọn tất cả"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* RIGHT: BULK ACTIONS */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Set Action: Create or Overwrite */}
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onBulkAction('CREATE_NEW')}
            className="px-2 py-1 font-semibold text-slate-300 hover:text-white hover:bg-sky-600/40 rounded transition cursor-pointer"
            title="Đặt các dòng đã chọn thành Thêm mới"
          >
            + Thêm mới
          </button>
          <button
            type="button"
            onClick={() => onBulkAction('OVERWRITE')}
            className="px-2 py-1 font-semibold text-amber-300 hover:text-amber-100 hover:bg-amber-600/40 rounded transition cursor-pointer"
            title="Đặt các dòng đã chọn thành Ghi đè"
          >
            ✎ Ghi đè
          </button>
        </div>

        {/* Change Doctor Dropdown */}
        {doctorsList.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
            <Stethoscope className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onBulkDoctor(e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer max-w-[150px] truncate"
              title="Đổi bác sĩ chỉ định cho các dòng đã chọn"
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">
                -- Đổi Bác Sĩ --
              </option>
              {doctorsList.map((doc) => (
                <option key={doc.id} value={doc.name} className="bg-slate-900 text-slate-200">
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Change Diagnosis Popover / Prompt */}
        {!showDiagnosisPrompt ? (
          <button
            type="button"
            onClick={() => setShowDiagnosisPrompt(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg font-semibold transition cursor-pointer"
            title="Đổi chẩn đoán cho các dòng đã chọn"
          >
            <FileEdit className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đổi Chẩn Đoán</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-900 border border-emerald-500/50 rounded-lg p-1">
            <input
              type="text"
              placeholder="Nhập chẩn đoán mới..."
              value={diagnosisValue}
              onChange={(e) => setDiagnosisValue(e.target.value)}
              className="bg-slate-950 text-white px-2 py-0.5 rounded text-xs focus:outline-none w-44"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                if (diagnosisValue.trim()) {
                  onBulkDiagnosis(diagnosisValue.trim());
                  setDiagnosisValue('');
                  setShowDiagnosisPrompt(false);
                }
              }}
              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition cursor-pointer"
            >
              Áp dụng
            </button>
            <button
              type="button"
              onClick={() => {
                setDiagnosisValue('');
                setShowDiagnosisPrompt(false);
              }}
              className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Bulk Delete */}
        {!showConfirmDelete ? (
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg font-semibold transition cursor-pointer"
            title="Xóa các dòng đã chọn khỏi danh sách nạp"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Xóa ({selectedCount})</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 bg-rose-950 border border-rose-600 rounded-lg p-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[11px] text-rose-200 font-bold">Xóa {selectedCount} dòng?</span>
            <button
              type="button"
              onClick={() => {
                onBulkDelete();
                setShowConfirmDelete(false);
              }}
              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold transition cursor-pointer"
            >
              Đồng ý
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
