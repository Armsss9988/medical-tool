'use client';

import { PortalTestItem } from '../types';

interface TestResultGaugeProps {
  test: PortalTestItem;
  className?: string;
}

function parseNumericResult(result?: string): number | null {
  if (!result) return null;
  const parsed = parseFloat(result.replace(/,/g, '.').replace(/[^\d.-]/g, ''));
  return isNaN(parsed) ? null : parsed;
}

export default function TestResultGauge({ test, className = '' }: TestResultGaugeProps) {
  const { result, refMin, refMax, evaluationType, note } = test;

  // 1. PHÂN ĐỘ DỊ NGUYÊN (Allergen Scale Grade 0 - 6)
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
        <div className={`w-full flex flex-col gap-2 py-1.5 ${className}`}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Thang đo dị ứng chuẩn lâm sàng:</span>
            <span className={`font-mono font-bold px-2.5 py-0.5 rounded-md text-xs ${
              grade === 0
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : grade <= 2
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}>
              {gradeLabels[Math.min(grade, 6)]}
            </span>
          </div>

          {/* Thanh phân độ 7 cấp độ */}
          <div className="grid grid-cols-7 gap-1 h-3 rounded-full p-0.5 bg-slate-100 border border-slate-200">
            {[0, 1, 2, 3, 4, 5, 6].map((g) => (
              <div
                key={g}
                className={`rounded-full transition-all flex items-center justify-center text-[9px] font-bold ${
                  g <= grade
                    ? g === 0
                      ? 'bg-emerald-500 text-white'
                      : g <= 2
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-500 text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}
                title={`Độ ${g}`}
              >
                {g}
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
            <span className="text-emerald-700 font-bold">Độ 0 (Âm tính)</span>
            <span className="text-amber-700 font-semibold">Độ 1 - 3</span>
            <span className="text-rose-600 font-bold">Độ 4 - 6 (Dương tính)</span>
          </div>
        </div>
      );
    }
  }

  // 2. ĐỊNH LƯỢNG CHỈ SỐ Y KHOA
  const numVal = parseNumericResult(result);

  if (numVal === null || refMax === null || refMax === undefined) {
    return null;
  }

  // Phân loại: Xét nghiệm Cut-off (ngưỡng 1 phía: Âm tính / Dương tính như Toxocara, Troponin, CRP)
  const isCutoff = refMin === null || refMin === undefined || refMin === 0;

  if (isCutoff) {
    const threshold = refMax;
    let percent = 50;

    if (numVal <= threshold) {
      const ratio = Math.max(0, numVal / threshold);
      percent = Math.max(6, Math.min(46, ratio * 50));
    } else {
      const excessRatio = Math.min(1, (numVal - threshold) / (threshold * 1.5 || 1));
      percent = Math.min(94, 54 + excessRatio * 40);
    }

    const isAbnormal = numVal > threshold;

    return (
      <div className={`w-full flex flex-col gap-2 pt-6 pb-1 ${className}`}>
        {/* Thước đo 2 vùng Cut-off */}
        <div className="relative w-full h-3.5 rounded-full bg-slate-100 border border-slate-200 flex overflow-visible">
          {/* Vùng Âm tính / Bình thường [0 .. threshold] (50% bên trái) */}
          <div
            className="w-1/2 bg-emerald-100/90 rounded-l-full border-r border-slate-300 relative flex items-center justify-center"
            title={`Khoảng Âm tính: < ${threshold}`}
          >
            <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider select-none">
              Âm tính
            </span>
          </div>

          {/* Vùng Dương tính / Vượt ngưỡng [> threshold] (50% bên phải) */}
          <div
            className="w-1/2 bg-rose-100/90 rounded-r-full relative flex items-center justify-center"
            title={`Khoảng Dương tính: ≥ ${threshold}`}
          >
            <span className="text-[9px] font-bold text-rose-800 uppercase tracking-wider select-none">
              Dương tính
            </span>
          </div>

          {/* Vạch kẻ phân định ngưỡng Cut-off ở vị trí 50% */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 z-1" />

          {/* Con trỏ định vị giá trị của bệnh nhân - Căn chuẩn tâm viên bi vào chính giữa thanh */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none transition-all duration-300"
            style={{ left: `${percent}%` }}
          >
            {/* Tooltip Tag hiển thị số phía trên kim */}
            <div className="absolute bottom-full mb-1 flex flex-col items-center">
              <div
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-xs whitespace-nowrap border leading-none ${
                  isAbnormal
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-emerald-600 text-white border-emerald-700'
                }`}
              >
                {numVal}
              </div>
              {/* Mũi tên trỏ xuống */}
              <div
                className={`w-0 h-0 border-x-3 border-x-transparent border-t-3 ${
                  isAbnormal ? 'border-t-rose-600' : 'border-t-emerald-600'
                }`}
              />
            </div>

            {/* Viên bi kim chỉ - Căn chuẩn giữa thanh thước đo */}
            <div
              className={`w-4 h-4 rounded-full shadow-md border-2 border-white flex items-center justify-center ${
                isAbnormal ? 'bg-rose-600' : 'bg-emerald-600'
              }`}
            >
              <div className="w-1 h-1 rounded-full bg-white opacity-95" />
            </div>
          </div>
        </div>

        {/* Chú thích ngưỡng số phân định chuẩn */}
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 px-0.5">
          <span className="text-slate-400">0</span>
          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Ngưỡng Cut-off: {threshold}
          </span>
          <span className="text-slate-400">&gt; {threshold}</span>
        </div>
      </div>
    );
  }

  // ─── LOẠI 2: XÉT NGHIỆM DẢI THAM CHIẾU KÉP (refMin .. refMax) ───
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
    <div className={`w-full flex flex-col gap-2 pt-6 pb-1 ${className}`}>
      {/* Thước đo 3 phân vùng với phong cách Chuẩn Y Khoa */}
      <div className="relative w-full h-3.5 rounded-full bg-slate-100 border border-slate-200 flex overflow-visible">
        {/* Vùng Thấp (25%) */}
        <div className="w-1/4 bg-amber-100/90 border-r border-slate-300 rounded-l-full relative flex items-center justify-center">
          <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider select-none">Thấp</span>
        </div>
        {/* Vùng Chuẩn (50%) */}
        <div className="w-1/2 bg-emerald-100/90 border-r border-slate-300 relative flex items-center justify-center">
          <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider select-none">Chuẩn</span>
        </div>
        {/* Vùng Cao (25%) */}
        <div className="w-1/4 bg-rose-100/90 rounded-r-full relative flex items-center justify-center">
          <span className="text-[9px] font-bold text-rose-800 uppercase tracking-wider select-none">Cao</span>
        </div>

        {/* Kim định vị số thực của bệnh nhân */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none transition-all duration-300"
          style={{ left: `${percent}%` }}
        >
          {/* Tooltip Tag hiển thị số */}
          <div className="absolute bottom-full mb-1 flex flex-col items-center">
            <div className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-xs whitespace-nowrap border text-white leading-none ${pinColor}`}>
              {numVal}
            </div>
            <div className={`w-0 h-0 border-x-3 border-x-transparent border-t-3 ${borderTopColor}`} />
          </div>

          {/* Viên bi kim chỉ */}
          <div className={`w-4 h-4 rounded-full shadow-md border-2 border-white flex items-center justify-center ${pinColor}`}>
            <div className="w-1 h-1 rounded-full bg-white opacity-95" />
          </div>
        </div>
      </div>

      {/* Chú thích ngưỡng số tham chiếu */}
      <div className="flex justify-between items-center text-[11px] font-mono px-0.5 text-slate-500">
        <span className={isLow ? 'text-amber-700 font-bold' : 'text-slate-400'}>
          Min: {refMin}
        </span>
        <span className="text-[10px] text-emerald-800 font-sans font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Khoảng Chuẩn
        </span>
        <span className={isHigh ? 'text-rose-600 font-bold' : 'text-slate-400'}>
          Max: {refMax}
        </span>
      </div>
    </div>
  );
}
