import { Trash2, Plus } from 'lucide-react';
import { AllergenGradeLevel } from '@domain/types';
import { COLOR_PRESETS } from './scalePresets';

interface ScaleGradeTableProps {
  levels: AllergenGradeLevel[];
  onUpdateLevel: (index: number, field: keyof AllergenGradeLevel, value: unknown) => void;
  onDeleteLevel: (index: number) => void;
  onAddLevel: () => void;
}

export function ScaleGradeTable({
  levels,
  onUpdateLevel,
  onDeleteLevel,
  onAddLevel
}: ScaleGradeTableProps) {
  return (
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
            {levels.map((level, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition">
                {/* Bậc (Grade) */}
                <td className="py-2 px-3 text-center">
                  <input
                    type="number"
                    value={level.grade}
                    onChange={(e) => onUpdateLevel(idx, 'grade', Number(e.target.value))}
                    className="w-10 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center font-mono font-extrabold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </td>

                {/* Ngưỡng Min */}
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="0.01"
                    value={level.minVal}
                    onChange={(e) => onUpdateLevel(idx, 'minVal', Number(e.target.value))}
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
                      onUpdateLevel(idx, 'maxVal', val === '' ? null : Number(val));
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
                    onChange={(e) => onUpdateLevel(idx, 'rangeText', e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded px-2 py-1 font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </td>

                {/* Diễn Giải Lâm Sàng */}
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={level.label}
                    onChange={(e) => onUpdateLevel(idx, 'label', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold focus:outline-none focus:border-amber-500"
                    placeholder="VD: Không phản ứng, Yếu, Rất mạnh..."
                  />
                </td>

                {/* Trạng Thái Dương Tính */}
                <td className="py-2 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => onUpdateLevel(idx, 'isPositive', !level.isPositive)}
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
                    onChange={(e) => onUpdateLevel(idx, 'colorKey', e.target.value)}
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
                    onClick={() => onDeleteLevel(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition cursor-pointer"
                    title={`Xóa bậc ${level.grade}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Add Level Button */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Mẹo: Hệ thống tự động đối chiếu giá trị đo với khoảng Min - Max để gán bậc phân độ và màu sắc.
          </span>
          <button
            type="button"
            onClick={onAddLevel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold text-xs transition shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Bậc Mới</span>
          </button>
        </div>
      </div>
    </div>
  );
}
