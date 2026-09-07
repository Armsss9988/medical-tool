import { Sparkles } from 'lucide-react';
import { AllergenGradeLevel } from '@domain/types';
import { COLOR_PRESETS } from './scalePresets';

interface ScaleVisualPreviewProps {
  levels: AllergenGradeLevel[];
}

export function ScaleVisualPreview({ levels }: ScaleVisualPreviewProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Mô Phỏng Trực Quan Dải Phân Độ Lâm Sàng
        </span>
        <span>{levels.length} Cấp Độ</span>
      </div>
      
      <div className="flex rounded-lg overflow-hidden border border-slate-700/80 h-7 shadow-inner">
        {levels.map((lvl, idx) => {
          const preset = COLOR_PRESETS.find((p) => p.key === lvl.colorKey);
          return (
            <div
              key={idx}
              className={`flex-1 flex flex-col items-center justify-center text-[10px] font-bold px-1 transition relative group ${
                preset ? preset.bgClass : 'bg-slate-800 text-white'
              }`}
              title={`${lvl.grade}: ${lvl.label} (${lvl.rangeText})`}
            >
              <span className="truncate font-mono">Độ {lvl.grade}</span>
              <span className="text-[8.5px] truncate opacity-90">{lvl.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
