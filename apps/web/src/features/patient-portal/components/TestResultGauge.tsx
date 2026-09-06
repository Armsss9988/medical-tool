'use client';

import { PortalTestItem } from '../types';

interface TestResultGaugeProps {
  test: PortalTestItem;
  className?: string;
}

export default function TestResultGauge({ test, className = '' }: TestResultGaugeProps) {
  const { result, refMin, refMax, evaluationType, note } = test;

  // 1. Phân độ dị nguyên (Allergen Scale Grade 0 - 6)
  if (evaluationType === 'scale' || test.scaleId) {
    const match = note.match(/Độ\s*([0-6])/i) || result.match(/Độ\s*([0-6])/i);
    const grade = match ? parseInt(match[1], 10) : (note.toLowerCase().includes('âm') ? 0 : null);

    if (grade !== null) {
      const gradeLabels = [
        'Độ 0 (Âm tính)',
        'Độ 1 (Dị ứng rất nhẹ)',
        'Độ 2 (Dị ứng nhẹ)',
        'Độ 3 (Dị ứng rõ rệt)',
        'Độ 4 (Dị ứng mạnh)',
        'Độ 5 (Dị ứng rất mạnh)',
        'Độ 6 (Dị ứng cực kỳ nguy hiểm)'
      ];

      return (
        <div className={`w-full flex flex-col gap-1.5 ${className}`}>
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
            <span>Cấp độ: {gradeLabels[Math.min(grade, 6)]}</span>
            <span className="font-mono text-xs font-bold text-slate-800">Độ {grade}/6</span>
          </div>

          <div className="grid grid-cols-7 gap-1 h-3 rounded-lg overflow-hidden bg-slate-100 p-0.5 border border-slate-300">
            {[0, 1, 2, 3, 4, 5, 6].map((g) => (
              <div
                key={g}
                className={`rounded-sm transition-all ${
                  g <= grade
                    ? g === 0
                      ? 'bg-emerald-500'
                      : g <= 2
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                    : 'bg-slate-200'
                }`}
                title={`Độ ${g}`}
              />
            ))}
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span className="text-emerald-700 font-semibold">0 (Chuẩn)</span>
            <span className="text-amber-700 font-semibold">3 (Rõ)</span>
            <span className="text-red-600 font-semibold">6 (Nguy hiểm)</span>
          </div>
        </div>
      );
    }
  }

  // 2. Định lượng thông thường có ngưỡng min - max
  const numVal = parseFloat(result.replace(/,/g, '.').replace(/[^\d.-]/g, ''));
  if (isNaN(numVal) || refMin === null || refMax === null || refMin >= refMax) {
    return null;
  }

  // Tính tỷ lệ phần trăm trên thước đo 3 vùng (0..25% Thấp, 25..75% Chuẩn, 75..100% Cao)
  let percent = 50;
  if (numVal < refMin) {
    const range = (refMax - refMin) * 0.5 || 1;
    const ratio = Math.max(0, (numVal - (refMin - range)) / range);
    percent = Math.max(4, Math.min(23, ratio * 25));
  } else if (numVal > refMax) {
    const range = (refMax - refMin) * 0.5 || 1;
    const ratio = Math.min(1, (numVal - refMax) / range);
    percent = Math.min(96, 77 + ratio * 23);
  } else {
    // Khoảng bình thường [25% .. 75%]
    const ratio = (numVal - refMin) / (refMax - refMin);
    percent = 25 + ratio * 50;
  }

  const isLow = numVal < refMin;
  const isHigh = numVal > refMax;
  const pinBg = isLow
    ? 'bg-amber-500 text-white'
    : isHigh
    ? 'bg-red-600 text-white'
    : 'bg-emerald-600 text-white';

  return (
    <div className={`w-full flex flex-col gap-1.5 py-1 ${className}`}>
      {/* Thước đo 3 phân vùng với phong cách Trắng - Xanh Lá - Đỏ */}
      <div className="relative w-full h-3 rounded-full overflow-visible flex bg-slate-100 border border-slate-300">
        {/* Vùng Thấp (25%) */}
        <div className="w-1/4 bg-amber-100 border-r border-slate-300 rounded-l-full relative" title="Vùng Dưới Ngưỡng">
          <span className="sr-only">Thấp</span>
        </div>
        {/* Vùng Chuẩn (50%) */}
        <div className="w-1/2 bg-emerald-100 border-r border-slate-300 relative" title="Vùng Chuẩn An Toàn">
          <span className="sr-only">Bình thường</span>
        </div>
        {/* Vùng Cao (25%) */}
        <div className="w-1/4 bg-red-100 rounded-r-full relative" title="Vùng Vượt Ngưỡng">
          <span className="sr-only">Cao</span>
        </div>

        {/* Kim định vị số thực của bệnh nhân */}
        <div
          className="absolute -top-1 bottom-0 -translate-x-1/2 transition-all duration-300 z-10 flex flex-col items-center"
          style={{ left: `${percent}%` }}
        >
          <div className={`w-3.5 h-5 rounded-full shadow-md border-2 border-white ${pinBg} flex items-center justify-center`}>
            <div className="w-1 h-1 rounded-full bg-white opacity-90" />
          </div>
        </div>
      </div>

      {/* Chú thích ngưỡng số tham chiếu */}
      <div className="flex justify-between items-center text-[11px] font-mono px-0.5">
        <span className={isLow ? 'text-amber-700 font-bold' : 'text-slate-500'}>
          Ngưỡng dưới: {refMin}
        </span>
        <span className="text-[10px] text-emerald-700 font-sans font-bold uppercase tracking-wider">
          Khoảng Chuẩn
        </span>
        <span className={isHigh ? 'text-red-600 font-bold' : 'text-slate-500'}>
          Ngưỡng trên: {refMax}
        </span>
      </div>
    </div>
  );
}
