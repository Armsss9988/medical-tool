import { Search, Plus, FileSpreadsheet, Download, Upload, Zap, X } from 'lucide-react';
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
  isQuickEditMode: boolean;
  onToggleQuickEditMode: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
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
  isQuickEditMode,
  onToggleQuickEditMode,
  searchInputRef,
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
    <div className="bg-white border-b border-slate-200 shrink-0 divide-y divide-slate-100">
      {/* Row 1: Search, View Filter, Quick Edit Toggle, Excel & Add */}
      <div className="p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Search & Filter controls */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm mã, tên chỉ số (tiếng Việt không dấu, gõ / để tìm)..."
              className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden transition placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type pills: All / General / Allergen */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold shrink-0">
            <button
              type="button"
              onClick={() => onViewFilterChange('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                viewFilter === 'all' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => onViewFilterChange('general')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                viewFilter === 'general' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Thường ({generalCount})
            </button>
            <button
              type="button"
              onClick={() => onViewFilterChange('allergen')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                viewFilter === 'allergen' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Dị nguyên ({allergenCount})
            </button>
          </div>
        </div>

        {/* Right: Quick Edit mode, Excel dropdown + Add button */}
        <div className="flex items-center gap-2">
          {/* Nút bật/tắt Chế độ sửa nhanh trực tiếp trên bảng */}
          <button
            type="button"
            onClick={onToggleQuickEditMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isQuickEditMode
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40'
                : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200'
            }`}
            title="Chế độ sửa nhanh: Cho phép gõ trực tiếp Giá, Đơn vị, Khoảng tham chiếu, Máy đo ngay trên bảng kiểu Excel"
          >
            <Zap className={`w-3.5 h-3.5 ${isQuickEditMode ? 'fill-slate-950 text-slate-950' : 'text-amber-600'}`} />
            <span>{isQuickEditMode ? 'Đang Sửa Nhanh (Bật)' : '⚡ Sửa Nhanh Bảng'}</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowExcelMenu(!showExcelMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
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
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
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
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
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
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 border-t border-slate-100 cursor-pointer"
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
            className="flex items-center gap-1 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-sky-600/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Chỉ Số</span>
          </button>
        </div>
      </div>

      {/* Row 2: 1-Click Group Pills & Quick Hints */}
      <div className="px-2.5 sm:px-3 py-1.5 bg-slate-50/70 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0">Nhóm:</span>
          <button
            type="button"
            onClick={() => onGroupChange('all')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
              selectedGroup === 'all'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({groups.length})
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onGroupChange(g.name)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedGroup === g.name
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 shrink-0 select-none">
          <span>💡 <strong className="text-slate-600">Nháy đúp dòng</strong> để sửa chi tiết</span>
          <span>•</span>
          <span><strong className="text-slate-600">Ctrl+S</strong> để lưu</span>
        </div>
      </div>
    </div>
  );
}
