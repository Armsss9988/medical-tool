import { useState, useEffect } from 'react';
import { X, Sliders, Save } from 'lucide-react';
import { ReferenceRangeItem } from '@domain/types';

interface ReferenceRangeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  rangeToEdit: ReferenceRangeItem | null;
  onSave: (item: ReferenceRangeItem) => void;
}

export function ReferenceRangeFormModal({
  isOpen,
  onClose,
  rangeToEdit,
  onSave
}: ReferenceRangeFormModalProps) {
  const [name, setName] = useState('');
  const [refMin, setRefMin] = useState<string>('');
  const [refMax, setRefMax] = useState<string>('');
  const [unit, setUnit] = useState('');
  const [refText, setRefText] = useState('');
  const [gender, setGender] = useState<'Tất cả' | 'Nam' | 'Nữ'>('Tất cả');
  const [ageGroup, setAgeGroup] = useState('Người lớn');
  const [error, setError] = useState('');

  useEffect(() => {
    if (rangeToEdit) {
      setName(rangeToEdit.name || '');
      setRefMin(rangeToEdit.refMin !== null && rangeToEdit.refMin !== undefined ? String(rangeToEdit.refMin) : '');
      setRefMax(rangeToEdit.refMax !== null && rangeToEdit.refMax !== undefined ? String(rangeToEdit.refMax) : '');
      setUnit(rangeToEdit.unit || '');
      setRefText(rangeToEdit.refText || '');
      setGender((rangeToEdit.gender as 'Tất cả' | 'Nam' | 'Nữ') || 'Tất cả');
      setAgeGroup(rangeToEdit.ageGroup || 'Người lớn');
    } else {
      setName('');
      setRefMin('');
      setRefMax('');
      setUnit('');
      setRefText('');
      setGender('Tất cả');
      setAgeGroup('Người lớn');
    }
    setError('');
  }, [rangeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleMinMaxChange = (newMin: string, newMax: string) => {
    setRefMin(newMin);
    setRefMax(newMax);
    const minNum = newMin.trim() !== '' ? Number(newMin) : null;
    const maxNum = newMax.trim() !== '' ? Number(newMax) : null;
    if (minNum !== null && maxNum !== null) {
      setRefText(`${minNum} - ${maxNum}`);
    } else if (minNum !== null) {
      setRefText(`>= ${minNum}`);
    } else if (maxNum !== null) {
      setRefText(`< ${maxNum}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Vui lòng nhập tên bộ tham chiếu!');
      return;
    }

    const minNum = refMin.trim() !== '' ? Number(refMin) : null;
    const maxNum = refMax.trim() !== '' ? Number(refMax) : null;

    let text = refText.trim();
    if (!text) {
      if (minNum !== null && maxNum !== null) text = `${minNum} - ${maxNum}`;
      else if (minNum !== null) text = `>= ${minNum}`;
      else if (maxNum !== null) text = `< ${maxNum}`;
      else text = 'Bình thường';
    }

    const item: ReferenceRangeItem = {
      id: rangeToEdit ? rangeToEdit.id : `ref_${Date.now()}`,
      name: trimmedName,
      refMin: minNum,
      refMax: maxNum,
      unit: unit.trim(),
      refText: text,
      gender,
      ageGroup: ageGroup.trim() || 'Tất cả'
    };

    onSave(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">
                {rangeToEdit ? 'Chỉnh Sửa Bộ Tham Chiếu' : 'Thêm Bộ Tham Chiếu Mới'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {rangeToEdit ? `Mã ID: ${rangeToEdit.id}` : 'Định nghĩa ngưỡng Min - Max, đơn vị và diễn giải lâm sàng'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên Bộ Tham Chiếu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="VD: Glucose máu chuẩn, Ure huyết thanh..."
              className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngưỡng Min (Dưới)</label>
              <input
                type="number"
                step="any"
                value={refMin}
                onChange={(e) => handleMinMaxChange(e.target.value, refMax)}
                placeholder="VD: 3.9"
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngưỡng Max (Trên)</label>
              <input
                type="number"
                step="any"
                value={refMax}
                onChange={(e) => handleMinMaxChange(refMin, e.target.value)}
                placeholder="VD: 6.4"
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Đơn Vị Đo</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="VD: mmol/L, mg/dL..."
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hiển Thị Text</label>
              <input
                type="text"
                value={refText}
                onChange={(e) => setRefText(e.target.value)}
                placeholder="VD: 3.9 - 6.4"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none font-semibold text-sky-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giới Tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Tất cả' | 'Nam' | 'Nữ')}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
              >
                <option value="Tất cả">Tất cả giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nhóm Tuổi</label>
              <input
                type="text"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                placeholder="VD: Người lớn, Trẻ em, Sơ sinh..."
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{rangeToEdit ? 'Lưu Thay Đổi' : 'Tạo Bộ Tham Chiếu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
