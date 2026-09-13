import React from 'react';
import { ClinicalBadge } from './ClinicalBadge';
import { ClinicalGauge, parseNumericResult } from './ClinicalGauge';

export interface ClinicalMetricCardProps {
  testCode: string;
  testName: string;
  category?: string;
  result: string;
  unit: string;
  refMin?: number | null;
  refMax?: number | null;
  refText?: string;
  note?: string;
  evaluation: 'NORMAL' | 'ABNORMAL';
  evaluationType?: 'range' | 'scale' | string;
  scaleId?: string | null;
  className?: string;
}

export const ClinicalMetricCard: React.FC<ClinicalMetricCardProps> = ({
  testCode,
  testName,
  category,
  result,
  unit,
  refMin = null,
  refMax = null,
  refText,
  note,
  evaluation,
  evaluationType,
  scaleId,
  className = ''
}) => {
  const isAbnormal = evaluation === 'ABNORMAL';
  const numVal = parseNumericResult(result);
  const isLow = numVal !== null && refMin !== null && refMin !== undefined && numVal < refMin;
  const isHigh = numVal !== null && refMax !== null && refMax !== undefined && numVal > refMax;

  // Quyết định biến thể badge
  let badgeVariant: 'normal' | 'abnormal' | 'low' | 'high' = 'normal';
  let badgeText = 'BÌNH THƯỜNG';

  if (isAbnormal) {
    if (isHigh) {
      badgeVariant = 'high';
      badgeText = 'VƯỢT NGƯỠNG';
    } else if (isLow) {
      badgeVariant = 'low';
      badgeText = 'DƯỚI NGƯỠNG';
    } else {
      badgeVariant = 'abnormal';
      badgeText = 'BẤT THƯỜNG';
    }
  }

  return (
    <div
      className={`relative bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-150 shadow-xs hover:border-slate-300 ${
        isAbnormal ? 'border-rose-200/90 border-l-4 border-l-rose-600' : 'border-slate-200/80 border-l-4 border-l-emerald-600'
      } ${className}`}
      data-testid="clinical-metric-card"
    >
      {/* 1. Header chỉ số */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-1 min-w-0">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
            {testName}
          </h4>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
              {testCode}
            </span>
            {category && <span className="text-slate-500">{category}</span>}
          </div>
        </div>

        {/* Badge trạng thái y tế */}
        <ClinicalBadge variant={badgeVariant} size="sm">
          {badgeText}
        </ClinicalBadge>
      </div>

      {/* 2. Giá trị xét nghiệm lớn chuẩn mono */}
      <div className="flex items-baseline justify-between gap-2 py-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              isAbnormal ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {result || '---'}
          </span>
          {unit && (
            <span className="text-xs sm:text-sm font-semibold font-mono text-slate-500 uppercase">
              {unit}
            </span>
          )}
        </div>

        {note && (
          <span
            className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
              isAbnormal
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {note}
          </span>
        )}
      </div>

      {/* 3. Thước đo khoảng tham chiếu sinh học */}
      <div className="pt-2 border-t border-slate-100">
        <ClinicalGauge
          result={result}
          refMin={refMin}
          refMax={refMax}
          evaluationType={evaluationType}
          scaleId={scaleId}
          note={note}
          unit={unit}
        />

        {refText && (
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span className="text-slate-400">Khoảng tham chiếu chuẩn:</span>
            <span className="font-mono font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
              {refText} {unit}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
