import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, FolderTree, FlaskConical } from 'lucide-react';
import { TestGroup, CatalogItem } from '@domain/types';
import { ManageCatalogUseCase } from '../../usecases/ManageCatalogUseCase';
import { GroupFormModal } from './GroupFormModal';

interface GroupTableProps {
  groups: TestGroup[];
  setGroups: React.Dispatch<React.SetStateAction<TestGroup[]>>;
  catalog: CatalogItem[];
  onSaveGroups?: (groups: TestGroup[]) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function GroupTable({
  groups,
  setGroups,
  catalog,
  onSaveGroups,
  showToast
}: GroupTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGroup, setEditingGroup] = useState<TestGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const useCase = useMemo(() => new ManageCatalogUseCase(), []);

  // Đếm số lượng chỉ số đang thuộc từng nhóm
  const usageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of groups) {
      const count = catalog.filter(
        (c) => (c.category || '').trim().toLowerCase() === g.name.trim().toLowerCase()
      ).length;
      counts.set(g.id, count);
    }
    return counts;
  }, [groups, catalog]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(term));
  }, [groups, searchTerm]);

  const handleOpenAdd = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: TestGroup) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleSaveGroup = (saved: TestGroup) => {
    const isEdit = groups.some((g) => g.id === saved.id);
    let next: TestGroup[];
    if (isEdit) {
      next = groups.map((g) => (g.id === saved.id ? saved : g));
      showToast?.(`Đã cập nhật nhóm "${saved.name}"`, 'success');
    } else {
      next = [...groups, saved];
      showToast?.(`Đã thêm nhóm mới "${saved.name}"`, 'success');
    }
    setGroups(next);
    if (onSaveGroups) onSaveGroups(next);
  };

  const handleDeleteGroup = (group: TestGroup) => {
    const check = useCase.canDeleteGroup(group.id, groups, catalog);
    if (!check.canDelete) {
      showToast?.(check.message || 'Không thể xóa nhóm đang có chỉ số xét nghiệm.', 'warning');
      alert(check.message);
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa nhóm "${group.name}" không?`)) {
      const next = groups.filter((g) => g.id !== group.id);
      setGroups(next);
      if (onSaveGroups) onSaveGroups(next);
      showToast?.(`Đã xóa nhóm "${group.name}"`, 'info');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top action toolbar */}
      <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm nhóm xét nghiệm..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nhóm</span>
        </button>
      </div>

      {/* Group Table */}
      <div className="flex-1 overflow-auto p-3 sm:p-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3">Tên Nhóm Xét Nghiệm</th>
                <th className="p-3 text-center w-40">Số Lượng Chỉ Số</th>
                <th className="p-3 text-center w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    Không tìm thấy nhóm xét nghiệm nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((g, idx) => {
                  const count = usageCounts.get(g.id) || 0;
                  return (
                    <tr key={g.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <FolderTree className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800 text-xs">{g.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          count > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <FlaskConical className="w-3 h-3" />
                          {count} chỉ số
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(g)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGroup(g)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa nhóm"
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
      </div>

      <GroupFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingGroup}
        onSave={handleSaveGroup}
      />
    </div>
  );
}
