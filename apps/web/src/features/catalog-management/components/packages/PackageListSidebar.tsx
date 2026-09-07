import { Search, Plus, Copy, Trash2, Layers, Dna } from 'lucide-react';
import { TestPackage, getPkgCodes } from '@domain/types';

interface PackageListSidebarProps {
  packages: TestPackage[];
  selectedId: string;
  onSelect: (id: string) => void;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filter: 'all' | 'general' | 'allergen';
  onFilterChange: (v: 'all' | 'general' | 'allergen') => void;
  onAdd: () => void;
  onDuplicate: (pkg: TestPackage) => void;
  onDelete: (id: string) => void;
  totalCount: number;
  generalCount: number;
  allergenCount: number;
  isAllergenPkg: (pkg: TestPackage) => boolean;
}

export function PackageListSidebar({
  packages,
  selectedId,
  onSelect,
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  onAdd,
  onDuplicate,
  onDelete,
  totalCount,
  generalCount,
  allergenCount,
  isAllergenPkg
}: PackageListSidebarProps) {
  return (
    <div className="w-80 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 min-h-0">
      {/* Search & Actions */}
      <div className="p-3 border-b border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>Danh Sách Gói ({totalCount})</span>
          </span>
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Gói</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm tên gói xét nghiệm..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-hidden"
          />
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10.5px] font-bold">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`flex-1 py-1 rounded transition text-center ${
              filter === 'all' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('general')}
            className={`flex-1 py-1 rounded transition text-center ${
              filter === 'general' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Thường ({generalCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('allergen')}
            className={`flex-1 py-1 rounded transition text-center ${
              filter === 'allergen' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Dị nguyên ({allergenCount})
          </button>
        </div>
      </div>

      {/* Package Items Scrollable List */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
        {packages.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            Không tìm thấy gói nào phù hợp.
          </div>
        ) : (
          packages.map((pkg) => {
            const isSelected = pkg.id === selectedId;
            const isAllergen = isAllergenPkg(pkg);
            const codes = getPkgCodes(pkg);

            return (
              <div
                key={pkg.id}
                onClick={() => onSelect(pkg.id)}
                className={`p-3 cursor-pointer transition flex items-start justify-between gap-2 text-xs ${
                  isSelected ? 'bg-sky-50/80 border-l-4 border-sky-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {isAllergen && <Dna className="w-3 h-3 text-purple-600 shrink-0" />}
                    <span className={`font-bold truncate ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                      {pkg.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 font-mono text-[11px]">
                    <span className="font-semibold text-emerald-700">
                      {pkg.price > 0 ? `${pkg.price.toLocaleString('vi-VN')} đ` : 'Chưa định giá'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{codes.length} chỉ số</span>
                  </div>
                </div>

                <div className="flex items-center space-x-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onDuplicate(pkg)}
                    className="p-1 text-slate-400 hover:text-sky-600 rounded transition"
                    title="Nhân bản gói này"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(pkg.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Xóa gói này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
