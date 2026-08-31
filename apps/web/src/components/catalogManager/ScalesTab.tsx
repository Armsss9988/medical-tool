import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Search, 
  Download, 
  Upload, 
  Layers, 
  Sparkles, 
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  AllergenGradingScale, 
  AllergenGradeLevel, 
  TestEquipment 
} from '@domain';
import { exportScalesTemplate, parseExcelScales } from '@infra/excelService';

interface ScalesTabProps {
  scales: AllergenGradingScale[];
  setScales: React.Dispatch<React.SetStateAction<AllergenGradingScale[]>> | ((scales: AllergenGradingScale[]) => void);
  equipments: TestEquipment[];
}

const COLOR_PRESETS: { key: string; label: string; bgClass: string; textClass: string; hex: string }[] = [
  { key: 'white', label: 'Trắng / Âm tính', bgClass: 'bg-white border-slate-300 text-slate-700', textClass: 'text-slate-700', hex: '#FFFFFF' },
  { key: 'emerald-light', label: 'Xanh ngọc nhạt', bgClass: 'bg-emerald-50 border-emerald-300 text-emerald-800', textClass: 'text-emerald-800', hex: '#ECFDF5' },
  { key: 'amber-light', label: 'Vàng nhạt (Độ 1)', bgClass: 'bg-amber-100 border-amber-300 text-amber-900', textClass: 'text-amber-900', hex: '#FEF3C7' },
  { key: 'amber', label: 'Vàng cam (Độ 2)', bgClass: 'bg-amber-200 border-amber-400 text-amber-950', textClass: 'text-amber-950', hex: '#FDE68A' },
  { key: 'orange', label: 'Cam (Độ 3)', bgClass: 'bg-orange-200 border-orange-400 text-orange-950', textClass: 'text-orange-950', hex: '#FED7AA' },
  { key: 'red-light', label: 'Đỏ nhạt (Độ 3/4)', bgClass: 'bg-rose-100 border-rose-300 text-rose-900', textClass: 'text-rose-900', hex: '#FFE4E6' },
  { key: 'red', label: 'Đỏ tươi (Độ 4)', bgClass: 'bg-rose-300 border-rose-500 text-rose-950', textClass: 'text-rose-950', hex: '#FDA4AF' },
  { key: 'red-bold', label: 'Đỏ đậm (Độ 5)', bgClass: 'bg-rose-500 border-rose-600 text-white', textClass: 'text-white', hex: '#F43F5E' },
  { key: 'red-extreme', label: 'Cực mạnh / Tím đỏ (Độ 6)', bgClass: 'bg-purple-700 border-purple-800 text-white', textClass: 'text-white', hex: '#7E22CE' }
];

export default function ScalesTab({ scales, setScales, equipments }: ScalesTabProps) {
  const [activeScaleId, setActiveScaleId] = useState<string>(() => scales[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filteredScales = useMemo(() => {
    if (!searchTerm.trim()) return scales;
    const q = searchTerm.toLowerCase();
    return scales.filter((s) => 
      s.name.toLowerCase().includes(q) || 
      (s.equipment && s.equipment.toLowerCase().includes(q)) ||
      s.id.toLowerCase().includes(q)
    );
  }, [scales, searchTerm]);

  const activeScale = useMemo(() => {
    return scales.find((s) => s.id === activeScaleId) || scales[0] || ({ id: '', name: '', unit: 'IU/ml', levels: [] } as AllergenGradingScale);
  }, [scales, activeScaleId]);

  // Cập nhật thông tin chung của thang đo hiện tại
  const handleUpdateScaleHeader = (field: keyof AllergenGradingScale, value: string) => {
    const updated = scales.map((s) => {
      if (s.id !== activeScale.id) return s;
      return { ...s, [field]: value };
    });
    setScales(updated);
  };

  // Cập nhật 1 bậc phân độ
  const handleUpdateLevel = (index: number, field: keyof AllergenGradeLevel, value: unknown) => {
    const updatedLevels = [...activeScale.levels];
    const target = { ...updatedLevels[index], [field]: value };

    // Tự động cập nhật rangeText nếu thay đổi minVal hoặc maxVal
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

  // Thêm 1 bậc phân độ mới vào cuối thang đo
  const handleAddLevel = () => {
    const lastLevel = activeScale.levels[activeScale.levels.length - 1];
    const newGrade = (lastLevel ? lastLevel.grade + 1 : 0);
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

    // Nếu bậc trước đó maxVal là null, đổi nó thành newMin
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

    const updated = scales.map((s) => (s.id === activeScale.id ? { ...s, levels: updatedLevels } : s));
    setScales(updated);
    showToast(`Đã thêm bậc ${newGrade} vào thang đo!`);
  };

  // Xóa 1 bậc phân độ
  const handleDeleteLevel = (index: number) => {
    if (activeScale.levels.length <= 2) {
      showToast('Thang đo phải có ít nhất 2 bậc phân độ!', 'error');
      return;
    }
    const updatedLevels = activeScale.levels.filter((_, idx) => idx !== index);
    const updated = scales.map((s) => (s.id === activeScale.id ? { ...s, levels: updatedLevels } : s));
    setScales(updated);
    showToast('Đã xóa bậc phân độ thành công!');
  };

  // Tạo thang đo mới
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

    const updated = [...scales, newScale];
    setScales(updated);
    setActiveScaleId(newId);
    showToast('Đã tạo thang đo phân độ mới!');
  };

  // Nhân bản thang đo (Clone)
  const handleCloneScale = () => {
    const cloneId = `scale_clone_${Date.now().toString(36)}`;
    const cloned: AllergenGradingScale = {
      ...activeScale,
      id: cloneId,
      name: `${activeScale.name} (Bản sao)`,
      levels: JSON.parse(JSON.stringify(activeScale.levels))
    };

    const updated = [...scales, cloned];
    setScales(updated);
    setActiveScaleId(cloneId);
    showToast(`Đã nhân bản thang đo [${activeScale.name}]!`);
  };

  // Xóa thang đo
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

  // Import file Excel thang đo
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedScales = await parseExcelScales(file);
      if (importedScales.length === 0) {
        showToast('Không tìm thấy dữ liệu thang đo hợp lệ trong file Excel!', 'error');
        return;
      }

      // Merge: update existing by ID or add new
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
      showToast(`Đã cập nhật ${updatedCount} thang đo cũ và thêm mới ${addedCount} thang đo từ file Excel (tổng ${merged.length} thang đo)!`);
    } catch (err) {
      showToast('Lỗi khi đọc file Excel thang đo: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-900 text-slate-100 min-h-0 relative">
      
      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className={`absolute top-3 right-4 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
          toastMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ── LEFT SIDEBAR: DANH SÁCH THANG ĐO ── */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-800 bg-slate-950/60 flex flex-col shrink-0">
        
        {/* Sidebar Header & Search */}
        <div className="p-3.5 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              Thang Đo Phân Độ ({scales.length})
            </span>
            <button
              type="button"
              onClick={handleCreateNewScale}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              title="Tạo thêm thang đo phân độ mới"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Thang</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, thiết bị, mã thang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition"
            />
          </div>
        </div>

        {/* Scale Cards List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {filteredScales.map((s) => {
            const isSelected = s.id === activeScale.id;
            const isPreset = s.id === 'scale_protia_91' || s.id === 'scale_allergen_44';
            return (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveScaleId(s.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveScaleId(s.id); }}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-950/20'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-bold text-xs truncate ${isSelected ? 'text-amber-300 font-extrabold' : 'text-slate-200'}`}>
                    {s.name}
                  </span>
                  {isPreset ? (
                    <span className="text-[9px] font-extrabold bg-sky-950 text-sky-400 border border-sky-800/80 px-1.5 py-0.5 rounded shrink-0">
                      Chuẩn
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold bg-amber-950 text-amber-400 border border-amber-800/80 px-1.5 py-0.5 rounded shrink-0">
                      Tùy Biến
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                  <span className="truncate max-w-[170px]">{s.equipment || 'Tất cả thiết bị'}</span>
                  <span className="font-mono text-slate-300 font-bold bg-slate-800/80 px-1.5 py-0.2 rounded">
                    {s.levels.length} bậc • {s.unit || 'IU/ml'}
                  </span>
                </div>

                {/* Mini gradient bar preview */}
                <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-800 mt-0.5">
                  {s.levels.map((lvl, idx) => {
                    const preset = COLOR_PRESETS.find((p) => p.key === lvl.colorKey);
                    return (
                      <div
                        key={idx}
                        className="h-full flex-1"
                        style={{ backgroundColor: preset ? preset.hex : '#94A3B8' }}
                        title={`${lvl.grade}: ${lvl.label} (${lvl.rangeText})`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                exportScalesTemplate(scales, true);
                showToast('Đã tải template mẫu thang đo!');
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
              title="Tải file Excel mẫu thang đo"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
            </button>
            <label className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer" title="Nhập danh sách thang đo từ Excel">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
            </label>
          </div>
        </div>

      </div>

      {/* ── RIGHT PANEL: CHI TIẾT & BẢNG CẤU HÌNH BẬC PHÂN ĐỘ ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-900">
        
        {/* Scale Details Header */}
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

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCloneScale}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Nhân bản thang đo này để tạo biến thể mới"
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
                title="Xuất thang đo này ra file Excel"
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

          {/* Form Fields: Tên, Thiết Bị, Đơn Vị */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Tên Thang Đo / Bảng Diễn Giải (*)
              </label>
              <input
                type="text"
                value={activeScale.name}
                onChange={(e) => handleUpdateScaleHeader('name', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                placeholder="VD: DIỄN GIẢI ĐỘ DƯƠNG TÍNH..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Thiết Bị / Máy Đo Áp Dụng
              </label>
              <input
                type="text"
                value={activeScale.equipment || ''}
                onChange={(e) => handleUpdateScaleHeader('equipment', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                placeholder="VD: Máy PROTIA Allergy-Q Smart..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Đơn Vị Đo Nồng Độ / Hiệu Giá
              </label>
              <input
                type="text"
                value={activeScale.unit || 'IU/ml'}
                onChange={(e) => handleUpdateScaleHeader('unit', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                placeholder="VD: IU/ml, kUA/L, Index..."
              />
            </div>
          </div>

          {/* Visual Gradient Bar Preview Full */}
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Mô Phỏng Trực Quan Dải Phân Độ Lâm Sàng
              </span>
              <span>{activeScale.levels.length} Cấp Độ</span>
            </div>
            
            <div className="flex rounded-lg overflow-hidden border border-slate-700/80 h-7 shadow-inner">
              {activeScale.levels.map((lvl, idx) => {
                const preset = COLOR_PRESETS.find((p) => p.key === lvl.colorKey);
                return (
                  <div
                    key={idx}
                    className={`flex-1 flex flex-col items-center justify-center text-[10px] font-bold px-1 transition relative group ${
                      preset ? preset.bgClass : 'bg-slate-800 text-white'
                    }`}
                  >
                    <span className="truncate font-mono">Độ {lvl.grade}</span>
                    <span className="text-[8.5px] truncate opacity-90">{lvl.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── BẢNG CẤU HÌNH CHI TIẾT CÁC BẬC PHÂN ĐỘ ── */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0 custom-scrollbar">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/90 text-slate-200 border-b border-slate-700 text-[11px] uppercase tracking-wider font-extrabold">
                  <th className="py-2.5 px-3 w-16 text-center">Bậc (Grade)</th>
                  <th className="py-2.5 px-3 w-28">Ngưỡng Min</th>
                  <th className="py-2.5 px-3 w-28">Ngưỡng Max</th>
                  <th className="py-2.5 px-3 w-32">Khoảng Text</th>
                  <th className="py-2.5 px-3">Diễn Giải Lâm Sàng (*)</th>
                  <th className="py-2.5 px-3 w-28 text-center">Trạng Thái</th>
                  <th className="py-2.5 px-3 w-44">Màu Chỉ Thị</th>
                  <th className="py-2.5 px-3 w-12 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {activeScale.levels.map((level, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-slate-850/60 transition">
                      
                      {/* Bậc (Grade) */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          value={level.grade}
                          onChange={(e) => handleUpdateLevel(idx, 'grade', Number(e.target.value))}
                          className="w-10 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center font-mono font-extrabold text-amber-300 focus:outline-none focus:border-amber-500"
                        />
                      </td>

                      {/* Ngưỡng Min */}
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          value={level.minVal}
                          onChange={(e) => handleUpdateLevel(idx, 'minVal', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                        />
                      </td>

                      {/* Ngưỡng Max */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={level.maxVal === null ? '' : level.maxVal}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            handleUpdateLevel(idx, 'maxVal', val === '' ? null : Number(val));
                          }}
                          placeholder="Không giới hạn"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      </td>

                      {/* Khoảng Text */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={level.rangeText}
                          onChange={(e) => handleUpdateLevel(idx, 'rangeText', e.target.value)}
                          className="w-full bg-slate-900/80 border border-slate-700/80 rounded px-2 py-1 font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Diễn Giải Lâm Sàng */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={level.label}
                          onChange={(e) => handleUpdateLevel(idx, 'label', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold focus:outline-none focus:border-amber-500"
                          placeholder="VD: Không phản ứng, Yếu, Rất mạnh..."
                        />
                      </td>

                      {/* Trạng Thái Dương Tính */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleUpdateLevel(idx, 'isPositive', !level.isPositive)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer border ${
                            level.isPositive
                              ? 'bg-rose-950/80 text-rose-300 border-rose-700 hover:bg-rose-900'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {level.isPositive ? 'Dương tính' : 'Âm tính'}
                        </button>
                      </td>

                      {/* Màu Chỉ Thị */}
                      <td className="py-2 px-3">
                        <select
                          value={level.colorKey || 'white'}
                          onChange={(e) => handleUpdateLevel(idx, 'colorKey', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          {COLOR_PRESETS.map((preset) => (
                            <option key={preset.key} value={preset.key} className="bg-slate-900 text-white">
                              {preset.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Nút Xóa Bậc */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteLevel(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition cursor-pointer"
                          title={`Xóa bậc ${level.grade}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer Add Level Button */}
            <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Mẹo: Hệ thống sẽ tự động đối chiếu giá trị đo của bệnh nhân với khoảng Min - Max để xác định bậc phân độ và màu sắc hiển thị.
              </span>
              <button
                type="button"
                onClick={handleAddLevel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold text-xs transition shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Bậc Mới</span>
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
