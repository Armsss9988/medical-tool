import {
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Zap,
  X,
  Filter,
  RotateCcw,
  Cpu,
  Tag,
  ArrowUpDown,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { TestGroup, TestEquipment } from '@domain/types';

export type IndicatorSortOption =
  | 'default'
  | 'name_asc'
  | 'name_desc'
  | 'code_asc'
  | 'code_desc'
  | 'category'
  | 'price_desc'
  | 'price_asc'
  | 'equipment_desc';

export interface IndicatorFilterBarProps {
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
  filteredCount: number;
  isQuickEditMode: boolean;
  onToggleQuickEditMode: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onAddNew: () => void;
  onExportExcel: () => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;

  // Bộ lọc nâng cao
  equipments: TestEquipment[];
  equipmentFilter: string;
  onEquipmentFilterChange: (val: string) => void;
  evalTypeFilter: 'all' | 'range' | 'scale' | 'detection';
  onEvalTypeFilterChange: (val: 'all' | 'range' | 'scale' | 'detection') => void;
  refRangeFilter: 'all' | 'complete' | 'missing';
  onRefRangeFilterChange: (val: 'all' | 'complete' | 'missing') => void;
  priceFilter: 'all' | 'paid' | 'free';
  onPriceFilterChange: (val: 'all' | 'paid' | 'free') => void;
  sortBy: IndicatorSortOption;
  onSortByChange: (val: IndicatorSortOption) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onResetFilters: () => void;
  activeFilterCount: number;
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
  filteredCount,
  isQuickEditMode,
  onToggleQuickEditMode,
  searchInputRef,
  onAddNew,
  onExportExcel,
  onImportExcel,
  onDownloadTemplate,
  equipments,
  equipmentFilter,
  onEquipmentFilterChange,
  evalTypeFilter,
  onEvalTypeFilterChange,
  refRangeFilter,
  onRefRangeFilterChange,
  priceFilter,
  onPriceFilterChange,
  sortBy,
  onSortByChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  onResetFilters,
  activeFilterCount
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

  // Lấy tên máy đo đang chọn nếu có
  const selectedEquipmentName = equipments.find((e) => e.id === equipmentFilter)?.name;

  return (
    <div className="bg-white border-b border-slate-200 shrink-0 divide-y divide-slate-100">
      {/* Row 1: Search, View Filter, Advanced Filter Toggle, Quick Edit Toggle, Excel & Add */}
      <div className="p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Search & Filter controls */}
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
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

          {/* Nút bật/tắt Bộ lọc nâng cao */}
          <button
            type="button"
            onClick={onToggleAdvancedFilters}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              showAdvancedFilters || activeFilterCount > 0
                ? 'bg-sky-50 text-sky-700 border border-sky-300 ring-2 ring-sky-100 shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
            }`}
            title="Mở bộ lọc nâng cao theo Máy đo, Kiểu đánh giá, Khoảng tham chiếu, Đơn giá và Sắp xếp"
          >
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span>Bộ Lọc</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 flex items-center justify-center bg-sky-600 text-white rounded-full text-[10px] font-black">
                {activeFilterCount}
              </span>
            )}
          </button>
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

      {/* Row 3: BỘ LỌC NÂNG CAO (Máy đo, Kiểu đánh giá, Tham chiếu, Giá, Sắp xếp) */}
      {(showAdvancedFilters || activeFilterCount > 0) && (
        <div className="p-2.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-0.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
            <span>Lọc chi tiết:</span>
          </span>

          {/* 1. Bộ lọc Thiết bị / Máy đo */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
            <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={equipmentFilter}
              onChange={(e) => onEquipmentFilterChange(e.target.value)}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
              title="Lọc theo thiết bị đo / máy xét nghiệm đã gán"
            >
              <option value="all">Tất cả máy đo</option>
              <option value="has_equipment">⚡ Đã gán máy đo</option>
              <option value="no_equipment">⚠️ Chưa gán máy đo</option>
              {equipments.length > 0 && (
                <optgroup label="── Theo máy cụ thể ──">
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}{eq.code ? ` (${eq.code})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* 2. Bộ lọc Kiểu đánh giá */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={evalTypeFilter}
              onChange={(e) => onEvalTypeFilterChange(e.target.value as 'all' | 'range' | 'scale' | 'detection')}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
              title="Lọc theo phương pháp đánh giá kết quả"
            >
              <option value="all">Tất cả kiểu đánh giá</option>
              <option value="range">Dải tham chiếu (Min-Max)</option>
              <option value="scale">Thang đo dị ứng (Độ 0-6)</option>
              <option value="detection">Định tính / Phát hiện</option>
            </select>
          </div>

          {/* 3. Bộ lọc Trạng thái tham chiếu */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
            <span className="text-slate-400 font-bold text-[11px] shrink-0">Ref:</span>
            <select
              value={refRangeFilter}
              onChange={(e) => onRefRangeFilterChange(e.target.value as 'all' | 'complete' | 'missing')}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
              title="Lọc chỉ số đã có hoặc còn thiếu khoảng tham chiếu"
            >
              <option value="all">Tất cả tham chiếu</option>
              <option value="complete">✅ Đã có tham chiếu</option>
              <option value="missing">⚠️ Chưa có tham chiếu</option>
            </select>
          </div>

          {/* 4. Bộ lọc Mức giá */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={priceFilter}
              onChange={(e) => onPriceFilterChange(e.target.value as 'all' | 'paid' | 'free')}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
              title="Lọc theo đơn giá xét nghiệm"
            >
              <option value="all">Tất cả mức giá</option>
              <option value="paid">Có tính phí lẻ (&gt; 0 đ)</option>
              <option value="free">0 đ / Trong gói</option>
            </select>
          </div>

          {/* 5. Sắp xếp linh hoạt */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as IndicatorSortOption)}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
              title="Sắp xếp danh mục chỉ số"
            >
              <option value="default">Sắp xếp: Mặc định</option>
              <option value="name_asc">Tên: A → Z</option>
              <option value="name_desc">Tên: Z → A</option>
              <option value="code_asc">Mã: A → Z</option>
              <option value="code_desc">Mã: Z → A</option>
              <option value="category">Theo Nhóm xét nghiệm</option>
              <option value="price_desc">Đơn giá: Cao → Thấp</option>
              <option value="price_asc">Đơn giá: Thấp → Cao</option>
              <option value="equipment_desc">Nhiều máy gán nhất</option>
            </select>
          </div>

          {/* 6. Nút Đặt lại tất cả bộ lọc */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer border border-rose-200 shrink-0 shadow-2xs"
              title="Đặt lại toàn bộ các bộ lọc về mặc định"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Đặt Lại</span>
            </button>
          )}
        </div>
      )}

      {/* Row 4: Active Filter Chips & Counter (Hiển thị khi có filter đang áp dụng) */}
      <div className="px-2.5 sm:px-3 py-1.5 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-medium">
            Hiển thị <strong className="text-sky-700 font-bold">{filteredCount}</strong> / {totalCount} chỉ số
          </span>

          {/* Active Chips */}
          {selectedGroup !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-semibold">
              <span>Nhóm: {selectedGroup}</span>
              <button
                type="button"
                onClick={() => onGroupChange('all')}
                className="hover:text-rose-600 cursor-pointer p-0.2"
                title="Bỏ lọc nhóm"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {equipmentFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold">
              <span>
                Máy:{' '}
                {equipmentFilter === 'has_equipment'
                  ? 'Đã gán máy'
                  : equipmentFilter === 'no_equipment'
                  ? 'Chưa gán máy'
                  : selectedEquipmentName || equipmentFilter}
              </span>
              <button
                type="button"
                onClick={() => onEquipmentFilterChange('all')}
                className="hover:text-rose-600 cursor-pointer p-0.2"
                title="Bỏ lọc máy đo"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {evalTypeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold">
              <span>
                Kiểu:{' '}
                {evalTypeFilter === 'range'
                  ? 'Dải tham chiếu'
                  : evalTypeFilter === 'scale'
                  ? 'Thang đo dị ứng'
                  : 'Định tính'}
              </span>
              <button
                type="button"
                onClick={() => onEvalTypeFilterChange('all')}
                className="hover:text-rose-600 cursor-pointer p-0.2"
                title="Bỏ lọc kiểu đánh giá"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {refRangeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-semibold">
              <span>Tham chiếu: {refRangeFilter === 'complete' ? 'Đã có' : 'Chưa có'}</span>
              <button
                type="button"
                onClick={() => onRefRangeFilterChange('all')}
                className="hover:text-rose-600 cursor-pointer p-0.2"
                title="Bỏ lọc tham chiếu"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {priceFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-[11px] font-semibold">
              <span>Giá: {priceFilter === 'paid' ? 'Có giá lẻ' : 'Trong gói (0 đ)'}</span>
              <button
                type="button"
                onClick={() => onPriceFilterChange('all')}
                className="hover:text-rose-600 cursor-pointer p-0.2"
                title="Bỏ lọc mức giá"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {sortBy !== 'default' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold">
              <span>Sắp xếp: {sortBy}</span>
              <button
                type="button"
                onClick={() => onSortByChange('default')}
                className="hover:text-rose-600 cursor-pointer p-0.2"
                title="Bỏ sắp xếp"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer shrink-0"
          >
            Xóa tất cả ({activeFilterCount})
          </button>
        )}
      </div>
    </div>
  );
}
