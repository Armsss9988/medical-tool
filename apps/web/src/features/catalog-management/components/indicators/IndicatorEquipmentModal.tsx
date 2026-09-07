import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Cpu } from 'lucide-react';
import { CatalogItem, TestEquipment, CatalogItemEquipmentLink, AllergenGradingScale } from '@domain/types';

interface IndicatorEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CatalogItem | null;
  equipments: TestEquipment[];
  scales: AllergenGradingScale[];
  catalogItemEquipments: CatalogItemEquipmentLink[];
  onSaveLinks: (links: CatalogItemEquipmentLink[]) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function IndicatorEquipmentModal({
  isOpen,
  onClose,
  item,
  equipments,
  scales,
  catalogItemEquipments,
  onSaveLinks,
  showToast
}: IndicatorEquipmentModalProps) {
  const [selectedEquipId, setSelectedEquipId] = useState('');
  const [refMin, setRefMin] = useState('');
  const [refMax, setRefMax] = useState('');
  const [unit, setUnit] = useState('');
  const [refText, setRefText] = useState('');
  const [scaleId, setScaleId] = useState('scale_protia_91');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (equipments.length > 0) {
      setSelectedEquipId(equipments[0].id);
    }
    if (item) {
      setUnit(item.unit || '');
      setRefMin(item.refMin != null ? String(item.refMin) : '');
      setRefMax(item.refMax != null ? String(item.refMax) : '');
      setRefText(item.refText || '');
      setScaleId(item.scaleId || 'scale_protia_91');
    }
    setIsDefault(false);
  }, [item, equipments, isOpen]);

  if (!isOpen || !item) return null;

  const currentLinks = catalogItemEquipments.filter(
    (l) => l.catalogCode.toUpperCase() === item.code.toUpperCase()
  );

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipId) return;

    const equipObj = equipments.find((e) => e.id === selectedEquipId);
    if (!equipObj) return;

    if (currentLinks.some((l) => l.equipmentId === selectedEquipId)) {
      showToast?.(`Thiết bị "${equipObj.name}" đã được gán cho chỉ số này rồi.`, 'warning');
      return;
    }

    const minNum = refMin !== '' ? Number(refMin) : null;
    const maxNum = refMax !== '' ? Number(refMax) : null;
    const isScale = item.evaluationType === 'scale' || Boolean(item.scaleId);

    const newLink: CatalogItemEquipmentLink = {
      id: `cie_${item.code.toLowerCase()}_${selectedEquipId}_${Date.now()}`,
      catalogCode: item.code.toUpperCase(),
      equipmentId: selectedEquipId,
      refMin: !isScale ? minNum : null,
      refMax: !isScale ? maxNum : null,
      unit: unit.trim() || undefined,
      refText: refText.trim() || undefined,
      scaleId: isScale ? scaleId : undefined,
      isDefault: isDefault || currentLinks.length === 0
    };

    let next = [...catalogItemEquipments];
    if (newLink.isDefault) {
      next = next.map((l) =>
        l.catalogCode.toUpperCase() === item.code.toUpperCase() ? { ...l, isDefault: false } : l
      );
    }
    next.push(newLink);

    onSaveLinks(next);
    showToast?.(`Đã gán thiết bị "${equipObj.name}" cho chỉ số ${item.code}`, 'success');
  };

  const handleSetDefault = (linkId: string) => {
    const next = catalogItemEquipments.map((l) => {
      if (l.catalogCode.toUpperCase() !== item.code.toUpperCase()) return l;
      return { ...l, isDefault: l.id === linkId };
    });
    onSaveLinks(next);
    showToast?.('Đã đặt thiết bị đo mặc định.', 'success');
  };

  const handleDeleteLink = (linkId: string) => {
    const next = catalogItemEquipments.filter((l) => l.id !== linkId);
    onSaveLinks(next);
    showToast?.('Đã hủy liên kết thiết bị.', 'info');
  };

  const isAllergen = item.evaluationType === 'scale' || Boolean(item.scaleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Cấu Hình Thiết Bị Đo & Ngưỡng Tham Chiếu Riêng</h4>
              <p className="text-[11px] text-slate-400 font-mono">Chỉ số: {item.code} - {item.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Form thêm liên kết máy đo */}
          <form onSubmit={handleAddLink} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-sky-600" />
              Gán thêm máy đo cho chỉ số này
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Chọn máy đo</label>
                <select
                  value={selectedEquipId}
                  onChange={(e) => setSelectedEquipId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  {equipments.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Đơn vị riêng</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={item.unit || 'Đơn vị'}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {isAllergen ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Thang đo trên máy này</label>
                <select
                  value={scaleId}
                  onChange={(e) => setScaleId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  {scales.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Min riêng</label>
                  <input
                    type="number"
                    step="any"
                    value={refMin}
                    onChange={(e) => setRefMin(e.target.value)}
                    placeholder="Min"
                    className="w-full px-2.5 py-1 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Max riêng</label>
                  <input
                    type="number"
                    step="any"
                    value={refMax}
                    onChange={(e) => setRefMax(e.target.value)}
                    placeholder="Max"
                    className="w-full px-2.5 py-1 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Chuỗi tham chiếu</label>
                  <input
                    type="text"
                    value={refText}
                    onChange={(e) => setRefText(e.target.value)}
                    placeholder="VD: 3.9 - 6.4"
                    className="w-full px-2.5 py-1 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                <span>Đặt làm máy đo mặc định</span>
              </label>
              <button
                type="submit"
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
              >
                Gán Máy Đo
              </button>
            </div>
          </form>

          {/* Danh sách các máy đo đang gán */}
          <div>
            <h5 className="font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>Các máy đo đã liên kết ({currentLinks.length})</span>
            </h5>
            {currentLinks.length === 0 ? (
              <p className="text-slate-400 text-center py-4 bg-slate-50 rounded-xl">Chưa có máy đo nào được gán cho chỉ số này.</p>
            ) : (
              <div className="space-y-1.5">
                {currentLinks.map((l) => {
                  const eq = equipments.find((e) => e.id === l.equipmentId);
                  return (
                    <div key={l.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{eq?.name || l.equipmentId}</span>
                          {l.isDefault ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Mặc định
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(l.id)}
                              className="text-slate-400 hover:text-sky-600 text-[10.5px] underline cursor-pointer"
                            >
                              Đặt mặc định
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Ngưỡng: {l.refText || (l.refMin != null && l.refMax != null ? `${l.refMin} - ${l.refMax}` : 'Theo chỉ số')} ({l.unit || item.unit || '---'})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteLink(l.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Hủy liên kết máy này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer">
            Hoàn Tất
          </button>
        </div>
      </div>
    </div>
  );
}
