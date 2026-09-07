import { useState, useMemo } from 'react';
import { Sliders, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { ReferenceRangeItem } from '@domain/types';
import { ReferenceRangeFormModal } from './ReferenceRangeFormModal';

interface ReferenceRangeTableProps {
  referenceRanges: ReferenceRangeItem[];
  setReferenceRanges: React.Dispatch<React.SetStateAction<ReferenceRangeItem[]>>;
  showToast?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function ReferenceRangeTable({
  referenceRanges,
  setReferenceRanges,
  showToast
}: ReferenceRangeTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rangeToEdit, setRangeToEdit] = useState<ReferenceRangeItem | null>(null);

  const filteredRanges = useMemo(() => {
    if (!searchTerm.trim()) return referenceRanges;
    const term = searchTerm.toLowerCase().trim();
    return referenceRanges.filter((r) => {
      return (
        r.name.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term) ||
        (r.unit && r.unit.toLowerCase().includes(term)) ||
        (r.refText && r.refText.toLowerCase().includes(term))
      );
    });
  }, [referenceRanges, searchTerm]);

  const handleOpenAdd = () => {
    setRangeToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ReferenceRangeItem) => {
    setRangeToEdit(item);
    setIsModalOpen(true);
  };

  const handleSaveRange = (item: ReferenceRangeItem) => {
    if (rangeToEdit) {
      setReferenceRanges((prev) => prev.map((r) => (r.id === item.id ? item : r)));
      showToast?.(`Đã cập nhật bộ tham chiếu ${item.name}!`, 'success');
    } else {
      setReferenceRanges((prev) => [item, ...prev]);
      showToast?.(`Đã thêm bộ tham chiếu ${item.name}!`, 'success');
    }
  };

  const handleDeleteRange = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ tham chiếu "${name}"?`)) {
      setReferenceRanges((prev) => prev.filter((r) => r.id !== id));
      showToast?.(`Đã xóa bộ tham chiếu ${name}!`, 'info');
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50 overflow-hidden">
      {/* Top Header Controls */}
      <div className="p-3 sm:p-4 shrink-0 space-y-3">
        {/* Banner Giới Thiệu */}
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs flex items-center justify-between flex-wrap gap-3 shadow-2xs">
          <div>
            <h4 className="font-extrabold text-sky-950 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600" />
              <span>Cơ Sở Dữ Liệu Bộ Tham Chiếu Xét Nghiệm (Reference Ranges)</span>
            </h4>
            <p className="text-sky-700/90 text-xs mt-0.5">
              Quản lý độc lập các khoảng tham chiếu chuẩn (Min – Max, Đơn vị, Diễn giải). Các chỉ số định lượng liên kết trực tiếp tới bảng này.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sky-800 bg-sky-100 border border-sky-300 px-3 py-1.5 rounded-xl">
              {referenceRanges.length} Bộ Tham Chiếu
            </span>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Tham Chiếu</span>
            </button>
          </div>
        </div>

        {/* Toolbar Tìm Kiếm */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, mã, đơn vị, hiển thị..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Hiển thị {filteredRanges.length}/{referenceRanges.length} bộ tham chiếu
          </span>
        </div>
      </div>

      {/* Bảng Dữ Liệu (Scroll Area) */}
      <div className="flex-1 min-h-0 overflow-auto px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
            <tr>
              <th className="p-3 text-center w-12">#</th>
              <th className="p-3">Tên Bộ Tham Chiếu</th>
              <th className="p-3 w-36">Ngưỡng Số (Min - Max)</th>
              <th className="p-3 w-28">Đơn Vị</th>
              <th className="p-3 w-36">Hiển Thị</th>
              <th className="p-3 w-40">Đối Tượng</th>
              <th className="p-3 text-center w-24">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRanges.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                  Không tìm thấy bộ tham chiếu nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredRanges.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{r.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">ID: {r.id}</div>
                  </td>
                  <td className="p-3 font-mono text-slate-700">
                    {r.refMin !== null && r.refMin !== undefined ? r.refMin : '---'}
                    {' - '}
                    {r.refMax !== null && r.refMax !== undefined ? r.refMax : '---'}
                  </td>
                  <td className="p-3 font-mono text-slate-600">{r.unit || '---'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-semibold text-[11px]">
                      {r.refText || '---'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">
                    <div className="text-[11px] font-medium">{r.gender || 'Tất cả'}</div>
                    <div className="text-[10px] text-slate-400">{r.ageGroup || 'Người lớn'}</div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                        title="Chỉnh sửa bộ tham chiếu"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRange(r.id, r.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Xóa bộ tham chiếu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Modal Thêm / Sửa */}
      <ReferenceRangeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rangeToEdit={rangeToEdit}
        onSave={handleSaveRange}
      />
    </div>
  );
}
