import { Search, Plus, FileSpreadsheet, Download, Upload } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { TestGroup } from '@domain/types';

interface IndicatorFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedGroup: string;
  onGroupChange: (val: string) => void;
  groups: TestGroup[];
  viewFilter: 'all' | 'general' | 'allergen';
  onViewFilterChange: (val: 'all' | 'general' | 'allergen') => void;
  totalCount: number;
  generalCount: number;
  allergenCount: number;
  onAddNew: () => void;
  onExportExcel: () => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
}

export function IndicatorFilterBar({
  searchTerm,
  onSearchChange,
  selectedGroup,
  onGroupChange,
  groups,
  viewFilter,
  onViewFilterChange,
  totalCount,
  generalCount,
  allergenCount,
  onAddNew,
  onExportExcel,
  onImportExcel,
  onDownloadTemplate
}: IndicatorFilterBarProps) {
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExcelMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
      {/* Left: Search & Filter controls */}
      <div className="flex items-center gap-2 flex-1 min-w-[280px]">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã, tên chỉ số..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden transition"
          />
        </div>

        {/* Group selector */}
        <select
          value={selectedGroup}
          onChange={(e) => onGroupChange(e.target.value)}
          className="text-xs py-1.5 px-2.5 border border-slate-300 rounded-xl bg-white text-slate-700 font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
        >
          <option value="all">Tất cả nhóm ({groups.length})</option>
          {groups.map((g) => (
            <option key={g.id} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Type pills: All / General / Allergen */}
        <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => onViewFilterChange('all')}
            className={`px-2.5 py-1 rounded-lg transition ${
              viewFilter === 'all' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => onViewFilterChange('general')}
            className={`px-2.5 py-1 rounded-lg transition ${
              viewFilter === 'general' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Thường ({generalCount})
          </button>
          <button
            type="button"
            onClick={() => onViewFilterChange('allergen')}
            className={`px-2.5 py-1 rounded-lg transition ${
              viewFilter === 'allergen' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dị nguyên ({allergenCount})
          </button>
        </div>
      </div>

      {/* Right: Actions (Excel dropdown + Add button) */}
      <div className="flex items-center gap-2">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowExcelMenu(!showExcelMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          {showExcelMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowExcelMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                <span>Nạp từ file Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onExportExcel();
                  setShowExcelMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xuất danh mục Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onDownloadTemplate();
                  setShowExcelMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 border-t border-slate-100"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                <span>Tải file mẫu Excel</span>
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={onImportExcel}
            className="hidden"
          />
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="flex items-center gap-1 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-sky-600/20 transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Chỉ Số</span>
        </button>
      </div>
    </div>
  );
}
