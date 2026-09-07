import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Cpu, FlaskConical } from 'lucide-react';
import { TestEquipment, CatalogItem, CatalogItemEquipmentLink } from '@domain/types';
import { ManageCatalogUseCase } from '../../usecases/ManageCatalogUseCase';
import { EquipmentFormModal } from './EquipmentFormModal';

interface EquipmentTableProps {
  equipments: TestEquipment[];
  setEquipments: React.Dispatch<React.SetStateAction<TestEquipment[]>>;
  catalog: CatalogItem[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  onSaveEquipments?: (eqs: TestEquipment[]) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function EquipmentTable({
  equipments,
  setEquipments,
  catalog,
  catalogItemEquipments = [],
  onSaveEquipments,
  showToast
}: EquipmentTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEq, setEditingEq] = useState<TestEquipment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const useCase = useMemo(() => new ManageCatalogUseCase(), []);

  // Đếm số lượng chỉ số đang liên kết với từng thiết bị
  const usageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const eq of equipments) {
      const byName = catalog.filter(
        (c) => (c.equipment || '').trim().toLowerCase() === eq.name.trim().toLowerCase()
      ).length;
      const byLink = catalogItemEquipments.filter(
        (l) => l.equipmentId === eq.id
      ).length;
      counts.set(eq.id, Math.max(byName, byLink));
    }
    return counts;
  }, [equipments, catalog, catalogItemEquipments]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return equipments;
    return equipments.filter(
      (e) => e.name.toLowerCase().includes(term) || (e.code && e.code.toLowerCase().includes(term))
    );
  }, [equipments, searchTerm]);

  const handleOpenAdd = () => {
    setEditingEq(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (eq: TestEquipment) => {
    setEditingEq(eq);
    setIsModalOpen(true);
  };

  const handleSaveEquipment = (saved: TestEquipment) => {
    const isEdit = equipments.some((e) => e.id === saved.id);
    let next: TestEquipment[];
    if (isEdit) {
      next = equipments.map((e) => (e.id === saved.id ? saved : e));
      showToast?.(`Đã cập nhật thiết bị "${saved.name}"`, 'success');
    } else {
      next = [...equipments, saved];
      showToast?.(`Đã thêm thiết bị mới "${saved.name}"`, 'success');
    }
    setEquipments(next);
    if (onSaveEquipments) onSaveEquipments(next);
  };

  const handleDeleteEquipment = (eq: TestEquipment) => {
    const check = useCase.canDeleteEquipment(eq.id, equipments, catalog);
    if (!check.canDelete) {
      showToast?.(check.message || 'Không thể xóa thiết bị đang được sử dụng.', 'warning');
      alert(check.message);
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa thiết bị "${eq.name}" không?`)) {
      const next = equipments.filter((e) => e.id !== eq.id);
      setEquipments(next);
      if (onSaveEquipments) onSaveEquipments(next);
      showToast?.(`Đã xóa thiết bị "${eq.name}"`, 'info');
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50 overflow-hidden">
      {/* Top action toolbar */}
      <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm máy xét nghiệm theo tên hoặc mã ký hiệu..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden transition"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Thiết Bị</span>
        </button>
      </div>

      {/* Equipment Table */}
      <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3 w-36">Mã Ký Hiệu</th>
                <th className="p-3">Tên Máy Xét Nghiệm</th>
                <th className="p-3 text-center w-36">Chỉ Số Đang Gán</th>
                <th className="p-3 text-center w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Không tìm thấy thiết bị nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((eq, idx) => {
                  const count = usageCounts.get(eq.id) || 0;
                  return (
                    <tr key={eq.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-sky-600">
                        {eq.code || '---'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800">{eq.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          count > 0 ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <FlaskConical className="w-3 h-3" />
                          {count} chỉ số
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(eq)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEquipment(eq)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa thiết bị"
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

      <EquipmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingEq}
        onSave={handleSaveEquipment}
      />
    </div>
  );
}
