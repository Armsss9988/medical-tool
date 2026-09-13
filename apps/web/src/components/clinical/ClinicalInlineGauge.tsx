import React from 'react';
import { parseNumericResult } from './ClinicalGauge';

interface ClinicalInlineGaugeProps {
  result?: string;
  refMin?: number | null;
  refMax?: number | null;
  unit?: string;
  className?: string;
}

export const ClinicalInlineGauge: React.FC<ClinicalInlineGaugeProps> = ({
  result,
  refMin = null,
  refMax = null,
  unit = '',
  className = ''
}) => {
  const numVal = parseNumericResult(result);
  if (numVal === null || refMax === null || refMax === undefined) {
    return <span className="text-[11px] text-slate-400 font-mono italic">---</span>;
  }

  // 1. Xét nghiệm Cut-off (refMin là 0 hoặc null)
  const isCutoff = refMin === null || refMin === undefined || refMin === 0;

  if (isCutoff) {
    const threshold = refMax;
    const isAbnormal = numVal > threshold;

    let percent = 50;
    if (numVal <= threshold) {
      const ratio = threshold > 0 ? Math.max(0, numVal / threshold) : 0;
      percent = Math.max(8, Math.min(46, ratio * 50));
    } else {
      const excessRatio = threshold > 0 ? Math.min(1, (numVal - threshold) / (threshold * 1.5 || 1)) : 0.5;
      percent = Math.min(92, 54 + excessRatio * 38);
    }

    const dotColor = isAbnormal ? 'bg-rose-600' : 'bg-teal-700';

    return (
      <div
        className={`inline-flex flex-col gap-0.5 w-28 sm:w-36 select-none ${className}`}
        title={`Kết quả: ${numVal} ${unit} (Ngưỡng Cut-off: ${threshold} ${unit})`}
      >
        <div className="relative w-full h-1.5 rounded-full bg-slate-200 overflow-visible flex items-center">
          {/* Vùng bình thường (trái) */}
          <div className="w-1/2 h-full bg-teal-500/20 rounded-l-full" />
          {/* Vạch ngưỡng ở giữa */}
          <div className="w-0.5 h-2.5 bg-slate-400 z-1" />
          {/* Vùng vượt ngưỡng (phải) */}
          <div className="w-1/2 h-full bg-rose-500/20 rounded-r-full" />

          {/* Chấm chỉ vị trí bệnh nhân */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs z-10 ${dotColor}`}
            style={{ left: `${percent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 leading-none px-0.5">
          <span>0</span>
          <span className="text-slate-500 font-medium">Cut-off: {threshold}</span>
          <span>&gt;{threshold}</span>
        </div>
      </div>
    );
  }

  // 2. Xét nghiệm dải tham chiếu kép (refMin .. refMax)
  if (refMin >= refMax) {
    return <span className="text-[11px] text-slate-400 font-mono italic">---</span>;
  }

  const isLow = numVal < refMin;
  const isHigh = numVal > refMax;
  const dotColor = isLow ? 'bg-amber-600' : isHigh ? 'bg-rose-600' : 'bg-teal-700';

  let percent = 50;
  if (numVal < refMin) {
    const range = (refMax - refMin) * 0.5 || 1;
    const ratio = Math.max(0, (numVal - (refMin - range)) / range);
    percent = Math.max(6, Math.min(22, ratio * 25));
  } else if (numVal > refMax) {
    const range = (refMax - refMin) * 0.5 || 1;
    const ratio = Math.min(1, (numVal - refMax) / range);
    percent = Math.min(94, 78 + ratio * 16);
  } else {
    const ratio = (numVal - refMin) / (refMax - refMin);
    percent = 25 + ratio * 50;
  }

  return (
    <div
      className={`inline-flex flex-col gap-0.5 w-28 sm:w-36 select-none ${className}`}
      title={`Kết quả: ${numVal} ${unit} (Khoảng tham chiếu: ${refMin} - ${refMax} ${unit})`}
    >
      <div className="relative w-full h-1.5 rounded-full bg-slate-200 overflow-visible flex items-center">
        {/* Vùng thấp */}
        <div className="w-1/4 h-full bg-amber-500/20 rounded-l-full" />
        {/* Vạch mốc Min */}
        <div className="w-0.5 h-2 bg-slate-400 z-1" />
        {/* Vùng chuẩn */}
        <div className="w-1/2 h-full bg-teal-500/25" />
        {/* Vạch mốc Max */}
        <div className="w-0.5 h-2 bg-slate-400 z-1" />
        {/* Vùng cao */}
        <div className="w-1/4 h-full bg-rose-500/20 rounded-r-full" />

        {/* Chấm vị trí bệnh nhân */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs z-10 ${dotColor}`}
          style={{ left: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 leading-none px-0.5">
        <span className={isLow ? 'text-amber-700 font-bold' : ''}>{refMin}</span>
        <span className="text-slate-500 font-sans font-medium">Chuẩn</span>
        <span className={isHigh ? 'text-rose-700 font-bold' : ''}>{refMax}</span>
      </div>
    </div>
  );
};
