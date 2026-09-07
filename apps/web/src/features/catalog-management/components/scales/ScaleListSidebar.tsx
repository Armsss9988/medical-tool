import { useState, useMemo } from 'react';
import { Activity, Plus, Search, Download, Upload } from 'lucide-react';
import { AllergenGradingScale } from '@domain/types';
import { COLOR_PRESETS } from './scalePresets';

interface ScaleListSidebarProps {
  scales: AllergenGradingScale[];
  activeScaleId: string;
  onSelectScale: (id: string) => void;
  onCreateScale: () => void;
  onExportTemplate: () => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ScaleListSidebar({
  scales,
  activeScaleId,
  onSelectScale,
  onCreateScale,
  onExportTemplate,
  onImportExcel
}: ScaleListSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredScales = useMemo(() => {
    if (!searchTerm.trim()) return scales;
    const q = searchTerm.toLowerCase();
    return scales.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.equipment && s.equipment.toLowerCase().includes(q)) ||
        s.id.toLowerCase().includes(q)
    );
  }, [scales, searchTerm]);

  return (
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
            onClick={onCreateScale}
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
          const isSelected = s.id === activeScaleId;
          const isPreset = s.id === 'scale_protia_91' || s.id === 'scale_allergen_44';
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectScale(s.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectScale(s.id);
              }}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                isSelected
                  ? 'bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-950/20'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`font-bold text-xs truncate ${
                    isSelected ? 'text-amber-300 font-extrabold' : 'text-slate-200'
                  }`}
                >
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
                <span className="font-mono text-slate-300 font-bold bg-slate-800/80 px-1.5 py-0.5 rounded">
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
            onClick={onExportTemplate}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
            title="Tải file Excel mẫu thang đo"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
          </button>
          <label
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
            title="Nhập danh sách thang đo từ Excel"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <input type="file" accept=".xlsx,.xls" onChange={onImportExcel} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
