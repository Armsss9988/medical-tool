import { useState, useMemo } from 'react';
import { Layers, Copy, Download, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AllergenGradingScale, AllergenGradeLevel, TestEquipment } from '@domain/types';
import { exportScalesTemplate, parseExcelScales } from '@infra/excelService';
import { ScaleListSidebar } from './ScaleListSidebar';
import { ScaleVisualPreview } from './ScaleVisualPreview';
import { ScaleGradeTable } from './ScaleGradeTable';

interface ScalesTableProps {
  scales: AllergenGradingScale[];
  setScales: React.Dispatch<React.SetStateAction<AllergenGradingScale[]>> | ((scales: AllergenGradingScale[]) => void);
  equipments: TestEquipment[];
}

export function ScalesTable({ scales, setScales, equipments }: ScalesTableProps) {
  const [activeScaleId, setActiveScaleId] = useState<string>(() => scales[0]?.id || '');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const activeScale = useMemo(() => {
    return scales.find((s) => s.id === activeScaleId) || scales[0] || ({ id: '', name: '', unit: 'IU/ml', levels: [] } as AllergenGradingScale);
  }, [scales, activeScaleId]);

  const handleUpdateScaleHeader = (field: keyof AllergenGradingScale, value: string) => {
    const updated = scales.map((s) => (s.id === activeScale.id ? { ...s, [field]: value } : s));
    setScales(updated);
  };

  const handleUpdateLevel = (index: number, field: keyof AllergenGradeLevel, value: unknown) => {
    const updatedLevels = [...activeScale.levels];
    const target = { ...updatedLevels[index], [field]: value };

    if (field === 'minVal' || field === 'maxVal') {
      const min = field === 'minVal' ? Number(value) : target.minVal;
      const max = field === 'maxVal' ? (value === null || value === '' ? null : Number(value)) : target.maxVal;

      if (max === null) {
        target.rangeText = `>${min.toFixed(2).replace(/\.00$/, '')}`;
      } else if (min === 0) {
        target.rangeText = `<${max.toFixed(2).replace(/\.00$/, '')}`;
      } else {
        target.rangeText = `${min.toFixed(2).replace(/\.00$/, '')} - ${max.toFixed(2).replace(/\.00$/, '')}`;
      }
    }

    updatedLevels[index] = target;
    const updated = scales.map((s) => (s.id === activeScale.id ? { ...s, levels: updatedLevels } : s));
    setScales(updated);
  };

  const handleAddLevel = () => {
    const lastLevel = activeScale.levels[activeScale.levels.length - 1];
    const newGrade = lastLevel ? lastLevel.grade + 1 : 0;
    const newMin = lastLevel && lastLevel.maxVal !== null ? lastLevel.maxVal + 0.01 : 100;

    const newLevel: AllergenGradeLevel = {
      grade: newGrade,
      minVal: Number(newMin.toFixed(2)),
      maxVal: null,
      rangeText: `>${newMin.toFixed(2)}`,
      label: `Mức độ ${newGrade}`,
      isPositive: true,
      colorKey: 'red-bold'
    };

    const updatedLevels = activeScale.levels.map((lvl, idx) => {
      if (idx === activeScale.levels.length - 1 && lvl.maxVal === null) {
        return {
          ...lvl,
          maxVal: Number(newMin.toFixed(2)),
          rangeText: `${lvl.minVal.toFixed(2)} - ${newMin.toFixed(2)}`
        };
      }
      return lvl;
    });

    updatedLevels.push(newLevel);
    setScales(scales.map((s) => (s.id === activeScale.id ? { ...s, levels: updatedLevels } : s)));
    showToast(`Đã thêm bậc ${newGrade} vào thang đo!`);
  };

  const handleDeleteLevel = (index: number) => {
    if (activeScale.levels.length <= 2) {
      showToast('Thang đo phải có ít nhất 2 bậc phân độ!', 'error');
      return;
    }
    const targetLevel = activeScale.levels[index];
    if (!window.confirm(`Bạn có chắc muốn xóa bậc [${targetLevel?.grade} - ${targetLevel?.label || ''}] khỏi thang đo này?`)) {
      return;
    }
    const updatedLevels = activeScale.levels.filter((_, idx) => idx !== index);
    setScales(scales.map((s) => (s.id === activeScale.id ? { ...s, levels: updatedLevels } : s)));
    showToast('Đã xóa bậc phân độ thành công!');
  };

  const handleCreateNewScale = () => {
    const newId = `scale_custom_${Date.now().toString(36)}`;
    const newScale: AllergenGradingScale = {
      id: newId,
      name: `Thang Phân Độ Mới #${scales.length + 1}`,
      equipment: equipments[0]?.name || 'Thiết Bị Tự Động',
      unit: 'IU/ml',
      levels: [
        { grade: 0, minVal: 0, maxVal: 0.35, rangeText: '<0.35', label: 'Không phản ứng', isPositive: false, colorKey: 'white' },
        { grade: 1, minVal: 0.36, maxVal: 3.49, rangeText: '0.36 - 3.49', label: 'Nhẹ / Trung bình', isPositive: true, colorKey: 'amber' },
        { grade: 2, minVal: 3.50, maxVal: null, rangeText: '>3.50', label: 'Dương tính mạnh', isPositive: true, colorKey: 'red-bold' }
      ]
    };
    setScales([...scales, newScale]);
    setActiveScaleId(newId);
    showToast('Đã tạo thang đo phân độ mới!');
  };

  const handleCloneScale = () => {
    const cloneId = `scale_clone_${Date.now().toString(36)}`;
    const cloned: AllergenGradingScale = {
      ...activeScale,
      id: cloneId,
      name: `${activeScale.name} (Bản sao)`,
      levels: JSON.parse(JSON.stringify(activeScale.levels))
    };
    setScales([...scales, cloned]);
    setActiveScaleId(cloneId);
    showToast(`Đã nhân bản thang đo [${activeScale.name}]!`);
  };

  const handleDeleteScale = () => {
    if (scales.length <= 1) {
      showToast('Hệ thống phải có ít nhất 1 thang đo!', 'error');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa thang đo "${activeScale.name}"?`)) {
      const remaining = scales.filter((s) => s.id !== activeScale.id);
      setScales(remaining);
      setActiveScaleId(remaining[0].id);
      showToast('Đã xóa thang đo thành công!');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedScales = await parseExcelScales(file);
      if (importedScales.length === 0) {
        showToast('Không tìm thấy dữ liệu thang đo hợp lệ trong file Excel!', 'error');
        return;
      }
      const map = new Map<string, AllergenGradingScale>();
      let updatedCount = 0;
      let addedCount = 0;
      scales.forEach((s) => map.set(s.id.toLowerCase(), s));
      importedScales.forEach((s) => {
        const key = s.id.toLowerCase();
        if (map.has(key)) {
          map.set(key, { ...map.get(key)!, ...s });
          updatedCount++;
        } else {
          map.set(key, s);
          addedCount++;
        }
      });
      const merged = Array.from(map.values());
      setScales(merged);
      setActiveScaleId(importedScales[0].id);
      showToast(`Đã cập nhật ${updatedCount} thang đo cũ và thêm mới ${addedCount} thang đo từ file Excel!`);
    } catch (err) {
      showToast('Lỗi khi đọc file Excel thang đo: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-900 text-slate-100 min-h-0 relative">
      {toastMsg && (
        <div className={`absolute top-3 right-4 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
          toastMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      <ScaleListSidebar
        scales={scales}
        activeScaleId={activeScale.id}
        onSelectScale={setActiveScaleId}
        onCreateScale={handleCreateNewScale}
        onExportTemplate={() => {
          exportScalesTemplate(scales, true);
          showToast('Đã tải template mẫu thang đo!');
        }}
        onImportExcel={handleImportExcel}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-900">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3.5 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>{activeScale.name}</span>
                  <span className="font-mono text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
                    ID: {activeScale.id}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Cấu hình các mức phân độ, ngưỡng giá trị đo, màu sắc cảnh báo lâm sàng và trạng thái dương tính
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCloneScale}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Nhân bản thang đo này"
              >
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>Nhân Bản</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  exportScalesTemplate(scales, false, activeScale.id);
                  showToast(`Đã xuất dữ liệu thang đo [${activeScale.name}] ra Excel!`);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                title="Xuất thang đo này ra Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteScale}
                className="p-1.5 bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/80 rounded-xl transition cursor-pointer"
                title="Xóa thang đo này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Tên Thang Đo (*)</label>
              <input
                type="text"
                value={activeScale.name}
                onChange={(e) => handleUpdateScaleHeader('name', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Thiết Bị Áp Dụng</label>
              <input
                type="text"
                value={activeScale.equipment || ''}
                onChange={(e) => handleUpdateScaleHeader('equipment', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Đơn Vị Đo</label>
              <input
                type="text"
                value={activeScale.unit || 'IU/ml'}
                onChange={(e) => handleUpdateScaleHeader('unit', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <ScaleVisualPreview levels={activeScale.levels} />
        </div>

        <ScaleGradeTable
          levels={activeScale.levels}
          onUpdateLevel={handleUpdateLevel}
          onDeleteLevel={handleDeleteLevel}
          onAddLevel={handleAddLevel}
        />
      </div>
    </div>
  );
}
