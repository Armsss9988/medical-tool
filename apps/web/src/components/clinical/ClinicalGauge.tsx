import React from 'react';

export interface ClinicalGaugeProps {
  result?: string;
  refMin?: number | null;
  refMax?: number | null;
  evaluationType?: 'range' | 'scale' | string;
  scaleId?: string | null;
  note?: string;
  unit?: string;
  className?: string;
}

export function parseNumericResult(result?: string): number | null {
  if (!result) return null;
  const cleaned = result.replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

export const ClinicalGauge: React.FC<ClinicalGaugeProps> = ({
  result = '',
  refMin = null,
  refMax = null,
  evaluationType,
  scaleId,
  note = '',
  unit = '',
  className = ''
}) => {
  // ── 1. THANG ĐO DỊ NGUYÊN LÂM SÀNG (Allergen Grade 0 - 6) ──
  if (evaluationType === 'scale' || scaleId) {
    const match = note.match(/Độ\s*([0-6])/i) || result.match(/Độ\s*([0-6])/i);
    const grade = match ? parseInt(match[1], 10) : note.toLowerCase().includes('âm') ? 0 : null;

    if (grade !== null) {
      const gradeLabels = [
        'Độ 0 (Âm tính)',
        'Độ 1 (Dị ứng rất nhẹ)',
        'Độ 2 (Dị ứng nhẹ)',
        'Độ 3 (Dị ứng trung bình)',
        'Độ 4 (Dị ứng rõ rệt)',
        'Độ 5 (Dị ứng mạnh)',
        'Độ 6 (Dị ứng rất mạnh)'
      ];

      const safeGrade = Math.min(Math.max(0, grade), 6);
      const isNegative = safeGrade === 0;
      const isMild = safeGrade <= 2;

      return (
        <div className={`w-full flex flex-col gap-2 pt-1 pb-1 ${className}`} data-testid="allergen-gauge">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Thang phân độ dị ứng:</span>
            <span
              className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] border ${
                isNegative
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isMild
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {gradeLabels[safeGrade]}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 h-3 rounded-full p-0.5 bg-slate-100 border border-slate-200">
            {[0, 1, 2, 3, 4, 5, 6].map((g) => {
              const active = g <= safeGrade;
              const bg =
                g === 0
                  ? 'bg-emerald-600 text-white'
                  : g <= 2
                  ? 'bg-amber-500 text-white'
                  : 'bg-rose-600 text-white';

              return (
                <div
                  key={g}
                  className={`rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                    active ? bg : 'bg-slate-200/80 text-slate-400'
                  }`}
                  title={`Cấp độ ${g}`}
                >
                  {g}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
            <span className="text-emerald-700 font-medium">Độ 0 (Âm tính)</span>
            <span className="text-amber-700 font-medium">Độ 1 - 2 (Nhẹ)</span>
            <span className="text-rose-700 font-medium">Độ 3 - 6 (Dương tính)</span>
          </div>
        </div>
      );
    }
  }

  // ── 2. XÉT NGHIỆM ĐỊNH LƯỢNG ──
  const numVal = parseNumericResult(result);
  if (numVal === null || refMax === null || refMax === undefined) {
    return null;
  }

  // Phân biệt xét nghiệm đơn ngưỡng Cut-off
  const isCutoff = refMin === null || refMin === undefined || refMin === 0;

  if (isCutoff) {
    const threshold = refMax;
    let percent = 50;

    if (numVal <= threshold) {
      const ratio = threshold > 0 ? Math.max(0, numVal / threshold) : 0;
      percent = Math.max(6, Math.min(46, ratio * 50));
    } else {
      const excessRatio = threshold > 0 ? Math.min(1, (numVal - threshold) / (threshold * 1.5 || 1)) : 0.5;
      percent = Math.min(94, 54 + excessRatio * 40);
    }

    const isAbnormal = numVal > threshold;
    const pinColor = isAbnormal ? 'bg-rose-600' : 'bg-emerald-600';
    const borderTopColor = isAbnormal ? 'border-t-rose-600' : 'border-t-emerald-600';

    return (
      <div className={`w-full flex flex-col gap-2 pt-6 pb-1 ${className}`} data-testid="cutoff-gauge">
        {/* Thanh thước đo 2 vùng */}
        <div className="relative w-full h-3 rounded-full bg-slate-100 border border-slate-200 flex overflow-visible">
          {/* Vùng Âm tính / Bình thường [0 .. threshold] */}
          <div
            className="w-1/2 bg-emerald-500/15 rounded-l-full border-r border-slate-300 relative flex items-center justify-center"
            title={`Khoảng Âm tính: < ${threshold}`}
          >
            <span className="text-[9px] font-semibold text-emerald-800 uppercase tracking-wider select-none">
              Âm tính
            </span>
          </div>

          {/* Vùng Dương tính / Vượt ngưỡng [> threshold] */}
          <div
            className="w-1/2 bg-rose-500/15 rounded-r-full relative flex items-center justify-center"
            title={`Khoảng Dương tính: ≥ ${threshold}`}
          >
            <span className="text-[9px] font-semibold text-rose-800 uppercase tracking-wider select-none">
              Dương tính
            </span>
          </div>

          {/* Vạch kẻ phân định ngưỡng Cut-off */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 z-1" />

          {/* Kim định vị số thực của bệnh nhân */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none transition-all duration-300"
            style={{ left: `${percent}%` }}
          >
            <div className="absolute bottom-full mb-1 flex flex-col items-center">
              <div
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-xs whitespace-nowrap text-white leading-none ${pinColor}`}
              >
                {numVal} {unit}
              </div>
              <div className={`w-0 h-0 border-x-3 border-x-transparent border-t-3 ${borderTopColor}`} />
            </div>

            <div className={`w-3.5 h-3.5 rounded-full shadow-xs border-2 border-white flex items-center justify-center ${pinColor}`}>
              <div className="w-1 h-1 rounded-full bg-white opacity-95" />
            </div>
          </div>
        </div>

        {/* Chú thích ngưỡng tham chiếu */}
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 px-0.5">
          <span className="text-slate-400">0</span>
          <span className="font-sans font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
            Ngưỡng Cut-off: {threshold} {unit}
          </span>
          <span className="text-slate-400">&gt; {threshold}</span>
        </div>
      </div>
    );
  }

  // ── 3. XÉT NGHIỆM DẢI THAM CHIẾU KÉP (refMin .. refMax) ──
  if (refMin >= refMax) return null;

  let percent = 50;
  if (numVal < refMin) {
    const range = (refMax - refMin) * 0.5 || 1;
    const ratio = Math.max(0, (numVal - (refMin - range)) / range);
    percent = Math.max(6, Math.min(23, ratio * 25));
  } else if (numVal > refMax) {
    const range = (refMax - refMin) * 0.5 || 1;
    const ratio = Math.min(1, (numVal - refMax) / range);
    percent = Math.min(94, 77 + ratio * 23);
  } else {
    const ratio = (numVal - refMin) / (refMax - refMin);
    percent = 25 + ratio * 50;
  }

  const isLow = numVal < refMin;
  const isHigh = numVal > refMax;
  const pinColor = isLow ? 'bg-amber-500' : isHigh ? 'bg-rose-600' : 'bg-emerald-600';
  const borderTopColor = isLow ? 'border-t-amber-500' : isHigh ? 'border-t-rose-600' : 'border-t-emerald-600';

  return (
    <div className={`w-full flex flex-col gap-2 pt-6 pb-1 ${className}`} data-testid="range-gauge">
      {/* Thước đo 3 phân vùng với tỷ lệ cân đối */}
      <div className="relative w-full h-3 rounded-full bg-slate-100 border border-slate-200 flex overflow-visible">
        {/* Vùng Thấp (25%) */}
        <div className="w-1/4 bg-amber-500/15 border-r border-slate-300 rounded-l-full relative flex items-center justify-center">
          <span className="text-[9px] font-semibold text-amber-800 uppercase tracking-wider select-none">Thấp</span>
        </div>
        {/* Vùng Chuẩn (50%) */}
        <div className="w-1/2 bg-emerald-500/15 border-r border-slate-300 relative flex items-center justify-center">
          <span className="text-[9px] font-semibold text-emerald-800 uppercase tracking-wider select-none">Chuẩn</span>
        </div>
        {/* Vùng Cao (25%) */}
        <div className="w-1/4 bg-rose-500/15 rounded-r-full relative flex items-center justify-center">
          <span className="text-[9px] font-semibold text-rose-800 uppercase tracking-wider select-none">Cao</span>
        </div>

        {/* Kim định vị số thực của bệnh nhân */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none transition-all duration-300"
          style={{ left: `${percent}%` }}
        >
          <div className="absolute bottom-full mb-1 flex flex-col items-center">
            <div
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-xs whitespace-nowrap text-white leading-none ${pinColor}`}
            >
              {numVal} {unit}
            </div>
            <div className={`w-0 h-0 border-x-3 border-x-transparent border-t-3 ${borderTopColor}`} />
          </div>

          <div className={`w-3.5 h-3.5 rounded-full shadow-xs border-2 border-white flex items-center justify-center ${pinColor}`}>
            <div className="w-1 h-1 rounded-full bg-white opacity-95" />
          </div>
        </div>
      </div>

      {/* Chú thích ngưỡng số tham chiếu */}
      <div className="flex justify-between items-center text-[11px] font-mono px-0.5 text-slate-500">
        <span className={isLow ? 'text-amber-700 font-bold' : 'text-slate-400'}>
          Min: {refMin}
        </span>
        <span className="text-[10px] text-emerald-800 font-sans font-semibold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Khoảng Chuẩn Y Khoa
        </span>
        <span className={isHigh ? 'text-rose-700 font-bold' : 'text-slate-400'}>
          Max: {refMax}
        </span>
      </div>
    </div>
  );
};
