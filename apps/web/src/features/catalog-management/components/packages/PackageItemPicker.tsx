import { useState, useMemo } from 'react';
import { Search, CheckSquare, Square, Plus } from 'lucide-react';
import { CatalogItem, TestGroup, PackageItem } from '@domain/types';

interface PackageItemPickerProps {
  catalogItems: CatalogItem[];
  groups: TestGroup[];
  selectedItems: PackageItem[];
  onToggleTest: (testCode: string) => void;
  onAddWholeGroup: (groupName: string) => void;
}

export function PackageItemPicker({
  catalogItems,
  groups,
  selectedItems,
  onToggleTest,
  onAddWholeGroup
}: PackageItemPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const selectedCodeSet = useMemo(
    () => new Set(selectedItems.map((i) => i.code.trim().toUpperCase())),
    [selectedItems]
  );

  const filteredItems = useMemo(() => {
    return catalogItems.filter((item) => {
      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term);
      const matchGroup = selectedGroup === 'all' || item.category === selectedGroup;
      return matchSearch && matchGroup;
    });
  }, [catalogItems, searchTerm, selectedGroup]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-xs">
      {/* Search & Group filters */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm chỉ số muốn thêm..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-hidden"
            />
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
          >
            <option value="all">Tất cả nhóm</option>
            {groups.map((g) => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>
        </div>

        {selectedGroup !== 'all' && (
          <button
            type="button"
            onClick={() => onAddWholeGroup(selectedGroup)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition active:scale-95 shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Cả Nhóm "{selectedGroup}"</span>
          </button>
        )}
      </div>

      {/* Test indicators list */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 divide-y divide-slate-100 bg-white">
        {filteredItems.length === 0 ? (
          <div className="p-6 text-center text-slate-400">Không tìm thấy chỉ số xét nghiệm nào.</div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = selectedCodeSet.has(item.code.toUpperCase());
            return (
              <div
                key={item.code}
                onClick={() => onToggleTest(item.code)}
                className={`p-2 rounded-lg cursor-pointer transition flex items-center justify-between gap-2 ${
                  isSelected ? 'bg-sky-50 text-sky-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span className="font-mono font-bold text-xs">{item.code}</span>
                  <span className="truncate">{item.name}</span>
                </div>

                <div className="flex items-center space-x-3 shrink-0 text-[11px] font-mono">
                  <span className="text-slate-400">{item.category}</span>
                  <span className="font-semibold text-slate-600">
                    {(item.price ?? 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
