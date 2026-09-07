import { useState, useEffect } from 'react';
import { X, Save, FlaskConical } from 'lucide-react';
import { CatalogItem, TestGroup, TestEquipment, AllergenGradingScale } from '@domain/types';

interface IndicatorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: CatalogItem | null;
  existingItems: CatalogItem[];
  groups: TestGroup[];
  equipments: TestEquipment[];
  scales: AllergenGradingScale[];
  onSave: (item: CatalogItem, initialEquipId?: string) => void;
}

export function IndicatorFormModal({
  isOpen,
  onClose,
  initialData,
  existingItems,
  groups,
  equipments,
  scales,
  onSave
}: IndicatorFormModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [scientific, setScientific] = useState('');
  const [category, setCategory] = useState('Sinh Hóa');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState<number | string>(0);
  const [evalMode, setEvalMode] = useState<'range' | 'scale'>('range');
  const [refMin, setRefMin] = useState<string>('');
  const [refMax, setRefMax] = useState<string>('');
  const [refText, setRefText] = useState('');
  const [scaleId, setScaleId] = useState('scale_protia_91');
  const [equipment, setEquipment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setScientific(initialData.scientific || '');
      setCategory(initialData.category || 'Sinh Hóa');
      setUnit(initialData.unit || '');
      setPrice(initialData.price ?? 0);
      const isScale = initialData.evaluationType === 'scale' || Boolean(initialData.scaleId);
      setEvalMode(isScale ? 'scale' : 'range');
      setRefMin(initialData.refMin != null ? String(initialData.refMin) : '');
      setRefMax(initialData.refMax != null ? String(initialData.refMax) : '');
      setRefText(initialData.refText || '');
      setScaleId(initialData.scaleId || 'scale_protia_91');
      setEquipment(initialData.equipment || '');
    } else {
      setCode('');
      setName('');
      setScientific('');
      setCategory(groups[0]?.name || 'Sinh Hóa');
      setUnit('');
      setPrice(0);
      setEvalMode('range');
      setRefMin('');
      setRefMax('');
      setRefText('');
      setScaleId(scales[0]?.id || 'scale_protia_91');
      setEquipment(equipments[0]?.name || '');
    }
    setError('');
  }, [initialData, isOpen, groups, equipments, scales]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanCode || !cleanName) {
      setError('Mã và tên chỉ số không được để trống.');
      return;
    }

    if (!initialData && existingItems.some((i) => i.code.toUpperCase() === cleanCode)) {
      setError(`Mã chỉ số "${cleanCode}" đã tồn tại trên hệ thống.`);
      return;
    }

    const minNum = refMin !== '' ? Number(refMin) : null;
    const maxNum = refMax !== '' ? Number(refMax) : null;
    let finalRefText = refText.trim();

    if (!finalRefText) {
      if (evalMode === 'scale') {
        finalRefText = scaleId === 'scale_allergen_44' ? '< 0.35 (Độ 0)' : '< 0.34 (Độ 0)';
      } else if (minNum != null && maxNum != null) {
        finalRefText = `${minNum} - ${maxNum}`;
      } else if (minNum != null) {
        finalRefText = `>= ${minNum}`;
      } else if (maxNum != null) {
        finalRefText = `<= ${maxNum}`;
      }
    }

    const saved: CatalogItem = {
      code: cleanCode,
      name: cleanName,
      scientific: scientific.trim() || undefined,
      category: category.trim() || 'Sinh Hóa',
      price: Number(price) || 0,
      evaluationType: evalMode,
      scaleId: evalMode === 'scale' ? scaleId : undefined,
      refMin: evalMode === 'range' ? minNum : null,
      refMax: evalMode === 'range' ? maxNum : null,
      unit: evalMode === 'scale' && !unit ? 'IU/ml' : unit.trim(),
      refText: finalRefText,
      equipment: equipment || undefined
    };

    const selectedEquipObj = equipments.find((e) => e.name === equipment);
    onSave(saved, selectedEquipObj?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <FlaskConical className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm">
              {initialData ? `Chỉnh Sửa Chỉ Số [${initialData.code}]` : 'Thêm Chỉ Số Xét Nghiệm Mới'}
            </h4>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 font-medium">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mã chỉ số *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: GLU, URE, GOT..."
                disabled={Boolean(initialData)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono font-bold uppercase focus:ring-2 focus:ring-sky-500 outline-hidden disabled:bg-slate-100"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên hiển thị *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Định lượng Glucose..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên khoa học</label>
              <input
                type="text"
                value={scientific}
                onChange={(e) => setScientific(e.target.value)}
                placeholder="VD: Blood Sugar"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl italic focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nhóm xét nghiệm</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Đơn giá (VNĐ)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="1000"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
            </div>
          </div>

          {/* Đánh giá kết quả */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Phương thức đánh giá kết quả</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="evalMode"
                    value="range"
                    checked={evalMode === 'range'}
                    onChange={() => setEvalMode('range')}
                  />
                  <span>Khoảng thường (Min-Max)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="evalMode"
                    value="scale"
                    checked={evalMode === 'scale'}
                    onChange={() => setEvalMode('scale')}
                  />
                  <span>Thang đo dị nguyên</span>
                </label>
              </div>
            </div>

            {evalMode === 'range' ? (
              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Min (Dưới)</label>
                  <input
                    type="number"
                    step="any"
                    value={refMin}
                    onChange={(e) => setRefMin(e.target.value)}
                    placeholder="3.9"
                    className="w-full px-2.5 py-1 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Max (Trên)</label>
                  <input
                    type="number"
                    step="any"
                    value={refMax}
                    onChange={(e) => setRefMax(e.target.value)}
                    placeholder="6.4"
                    className="w-full px-2.5 py-1 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Đơn vị</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="mmol/L"
                    className="w-full px-2.5 py-1 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Hiển thị mẫu</label>
                  <input
                    type="text"
                    value={refText}
                    onChange={(e) => setRefText(e.target.value)}
                    placeholder="3.9 - 6.4"
                    className="w-full px-2.5 py-1 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Thang đo áp dụng</label>
                  <select
                    value={scaleId}
                    onChange={(e) => setScaleId(e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded-lg bg-white"
                  >
                    {scales.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Đơn vị đo</label>
                  <input
                    type="text"
                    value={unit || 'IU/ml'}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Thiết bị đo mặc định</label>
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
            >
              <option value="">-- Chưa gán máy đo mặc định --</option>
              {equipments.map((eq) => (
                <option key={eq.id} value={eq.name}>{eq.name} ({eq.code || 'MÁY ĐO'})</option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
              Hủy
            </button>
            <button type="submit" className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 transition active:scale-95 cursor-pointer">
              <Save className="w-3.5 h-3.5" />
              <span>{initialData ? 'Cập Nhật Chỉ Số' : 'Tạo Mới Chỉ Số'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
