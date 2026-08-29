import { useState } from 'react';
import { ReferenceRangeItem } from '@domain/types';
import { Search, Plus, Trash2, Sliders, ShieldCheck } from 'lucide-react';

interface ReferenceRangesTabProps {
  referenceRanges: ReferenceRangeItem[];
  setReferenceRanges: React.Dispatch<React.SetStateAction<ReferenceRangeItem[]>>;
}

export function ReferenceRangesTab({
  referenceRanges,
  setReferenceRanges
}: ReferenceRangesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newRange, setNewRange] = useState<Partial<ReferenceRangeItem>>({
    name: '',
    refMin: null,
    refMax: null,
    unit: '',
    refText: '',
    gender: 'Tất cả',
    ageGroup: 'Người lớn'
  });

  const filteredRanges = referenceRanges.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.id.toLowerCase().includes(term) ||
      (r.unit && r.unit.toLowerCase().includes(term)) ||
      (r.refText && r.refText.toLowerCase().includes(term))
    );
  });

  const handleRangeChange = (
    id: string,
    field: keyof ReferenceRangeItem,
    value: string | number | null | undefined
  ) => {
    setReferenceRanges((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        // Tự động cập nhật refText nếu thay đổi refMin hoặc refMax
        if (field === 'refMin' || field === 'refMax') {
          const min = field === 'refMin' ? (value === '' ? null : Number(value)) : r.refMin;
          const max = field === 'refMax' ? (value === '' ? null : Number(value)) : r.refMax;
          if (min !== null && max !== null) {
            updated.refText = `${min} - ${max}`;
          } else if (min !== null) {
            updated.refText = `>= ${min}`;
          } else if (max !== null) {
            updated.refText = `< ${max}`;
          }
        }
        return updated;
      })
    );
  };

  const handleAddRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRange.name?.trim()) return;

    const id = `ref_${Date.now()}`;
    const min = newRange.refMin !== undefined && newRange.refMin !== null && String(newRange.refMin) !== '' ? Number(newRange.refMin) : null;
    const max = newRange.refMax !== undefined && newRange.refMax !== null && String(newRange.refMax) !== '' ? Number(newRange.refMax) : null;
    
    let text = newRange.refText?.trim() || '';
    if (!text) {
      if (min !== null && max !== null) text = `${min} - ${max}`;
      else if (min !== null) text = `>= ${min}`;
      else if (max !== null) text = `< ${max}`;
      else text = 'Bình thường';
    }

    const created: ReferenceRangeItem = {
      id,
      name: newRange.name.trim(),
      refMin: min,
      refMax: max,
      unit: newRange.unit?.trim() || '',
      refText: text,
      gender: newRange.gender || 'Tất cả',
      ageGroup: newRange.ageGroup || 'Tất cả'
    };

    setReferenceRanges((prev) => [created, ...prev]);
    setNewRange({
      name: '',
      refMin: null,
      refMax: null,
      unit: '',
      refText: '',
      gender: 'Tất cả',
      ageGroup: 'Người lớn'
    });
  };

  const handleDeleteRange = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bộ tham chiếu này?')) {
      setReferenceRanges((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="p-4 flex-grow overflow-y-auto flex flex-col space-y-3">
      {/* Banner Giới Thiệu */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs flex items-center justify-between">
        <div>
          <h4 className="font-extrabold text-sky-900 text-xs flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-sky-600" />
            Cơ Sở Dữ Liệu Bộ Tham Chiếu Xét Nghiệm (Reference Ranges)
          </h4>
          <p className="text-sky-700/80 text-[11px] mt-0.5">
            Quản lý độc lập các khoảng tham chiếu chuẩn (Min – Max, Đơn vị, Diễn giải). Các chỉ số định lượng sẽ liên kết trực tiếp tới bảng này.
          </p>
        </div>
        <span className="font-mono font-bold text-sky-800 bg-sky-100 border border-sky-300 px-2.5 py-1 rounded-lg">
          {referenceRanges.length} Bộ Tham Chiếu
        </span>
      </div>

      {/* Toolbar & Form Thêm Tham Chiếu */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm bộ tham chiếu..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Form Thêm Nhanh */}
        <form onSubmit={handleAddRange} className="grid grid-cols-12 gap-2 pt-2 border-t border-slate-200 items-end">
          <div className="col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">TÊN BỘ THAM CHIẾU *</label>
            <input
              type="text"
              value={newRange.name || ''}
              onChange={(e) => setNewRange({ ...newRange, name: e.target.value })}
              placeholder="VD: Glucose máu chuẩn..."
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">MIN (DƯỚI)</label>
            <input
              type="number"
              step="any"
              value={newRange.refMin ?? ''}
              onChange={(e) => setNewRange({ ...newRange, refMin: e.target.value === '' ? null : Number(e.target.value) })}
              placeholder="VD: 3.9"
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">MAX (TRÊN)</label>
            <input
              type="number"
              step="any"
              value={newRange.refMax ?? ''}
              onChange={(e) => setNewRange({ ...newRange, refMax: e.target.value === '' ? null : Number(e.target.value) })}
              placeholder="VD: 6.4"
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">ĐƠN VỊ</label>
            <input
              type="text"
              value={newRange.unit || ''}
              onChange={(e) => setNewRange({ ...newRange, unit: e.target.value })}
              placeholder="VD: mmol/L"
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">HIỂN THỊ (TEXT)</label>
            <input
              type="text"
              value={newRange.refText || ''}
              onChange={(e) => setNewRange({ ...newRange, refText: e.target.value })}
              placeholder="VD: 3.9 - 6.4"
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="col-span-1">
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1 shadow-xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Bảng Dữ Liệu Tham Chiếu */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex-grow">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10">
              <tr>
                <th className="p-2.5 w-10 text-center">STT</th>
                <th className="p-2.5 min-w-[200px]">TÊN BỘ THAM CHIẾU</th>
                <th className="p-2.5 w-24 text-center">MIN (DƯỚI)</th>
                <th className="p-2.5 w-24 text-center">MAX (TRÊN)</th>
                <th className="p-2.5 w-24 text-center">ĐƠN VỊ</th>
                <th className="p-2.5 min-w-[140px]">CHUỖI THAM CHIẾU (TEXT)</th>
                <th className="p-2.5 w-28 text-center">ĐỐI TƯỢNG</th>
                <th className="p-2.5 w-12 text-center">XÓA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRanges.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-2 font-bold text-slate-800">
                    <input
                      type="text"
                      value={r.name}
                      onChange={(e) => handleRangeChange(r.id, 'name', e.target.value)}
                      className="w-full bg-transparent border-0 font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      step="any"
                      value={r.refMin ?? ''}
                      onChange={(e) => handleRangeChange(r.id, 'refMin', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full text-center bg-transparent border-0 font-mono font-semibold text-slate-700 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      step="any"
                      value={r.refMax ?? ''}
                      onChange={(e) => handleRangeChange(r.id, 'refMax', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full text-center bg-transparent border-0 font-mono font-semibold text-slate-700 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="text"
                      value={r.unit}
                      onChange={(e) => handleRangeChange(r.id, 'unit', e.target.value)}
                      className="w-full text-center bg-transparent border-0 font-semibold text-slate-700 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={r.refText}
                      onChange={(e) => handleRangeChange(r.id, 'refText', e.target.value)}
                      className="w-full bg-transparent border-0 font-semibold text-sky-800 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                      <ShieldCheck className="w-3 h-3 text-sky-600" />
                      {r.ageGroup || 'Người lớn'}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRange(r.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
