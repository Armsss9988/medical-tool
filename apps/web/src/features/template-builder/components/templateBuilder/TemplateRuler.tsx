import { memo, useMemo } from 'react';

interface TemplateRulerProps {
  paperSize: 'A4' | 'A5';
  orientation?: 'portrait' | 'landscape';
  paddingMm: number;
}

function TemplateRuler({
  paperSize,
  orientation = 'portrait',
  paddingMm = 15
}: TemplateRulerProps) {
  const isA5 = paperSize === 'A5';
  const isLandscape = orientation === 'landscape';

  const widthMm = isA5
    ? (isLandscape ? 210 : 148)
    : (isLandscape ? 297 : 210);

  const heightMm = isA5
    ? (isLandscape ? 148 : 210)
    : (isLandscape ? 210 : 297);

  // Sinh các vạch chia cho thước ngang
  const horizontalTicks = useMemo(() => {
    const ticks: Array<{ mm: number; isMajor: boolean; isMid: boolean }> = [];
    for (let mm = 0; mm <= widthMm; mm++) {
      ticks.push({
        mm,
        isMajor: mm % 10 === 0,
        isMid: mm % 5 === 0 && mm % 10 !== 0
      });
    }
    return ticks;
  }, [widthMm]);

  // Sinh các vạch chia cho thước dọc
  const verticalTicks = useMemo(() => {
    const ticks: Array<{ mm: number; isMajor: boolean; isMid: boolean }> = [];
    for (let mm = 0; mm <= heightMm; mm++) {
      ticks.push({
        mm,
        isMajor: mm % 10 === 0,
        isMid: mm % 5 === 0 && mm % 10 !== 0
      });
    }
    return ticks;
  }, [heightMm]);

  return (
    <>
      {/* Thước Ngang (Top Ruler) */}
      <div
        className="sticky top-0 z-20 flex bg-slate-900 border-b border-slate-700 select-none print:hidden shadow-xs"
        style={{ width: `${widthMm}mm`, height: '22px' }}
      >
        <svg
          viewBox={`0 0 ${widthMm} 22`}
          className="w-full h-full"
          style={{ width: `${widthMm}mm`, height: '22px' }}
        >
          {/* Vùng lề an toàn trái & phải */}
          <rect x={0} y={0} width={paddingMm} height={22} fill="rgba(2, 132, 199, 0.18)" />
          <rect x={widthMm - paddingMm} y={0} width={paddingMm} height={22} fill="rgba(2, 132, 199, 0.18)" />
          <line x1={paddingMm} y1={0} x2={paddingMm} y2={22} stroke="#0284c7" strokeWidth="0.5" strokeDasharray="1,1" />
          <line x1={widthMm - paddingMm} y1={0} x2={widthMm - paddingMm} y2={22} stroke="#0284c7" strokeWidth="0.5" strokeDasharray="1,1" />

          {horizontalTicks.map(({ mm, isMajor, isMid }) => {
            const y1 = isMajor ? 6 : isMid ? 11 : 16;
            return (
              <g key={`h-${mm}`}>
                <line
                  x1={mm}
                  y1={y1}
                  x2={mm}
                  y2={22}
                  stroke={isMajor ? '#94a3b8' : isMid ? '#64748b' : '#475569'}
                  strokeWidth={isMajor ? '0.4' : '0.25'}
                />
                {isMajor && (
                  <text
                    x={mm + 0.5}
                    y={5.5}
                    fill="#cbd5e1"
                    fontSize="3.8px"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {mm}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Thước Dọc (Left Ruler) */}
      <div
        className="absolute -left-[22px] top-[22px] z-20 bg-slate-900 border-r border-slate-700 select-none print:hidden shadow-xs"
        style={{ width: '22px', height: `${heightMm}mm` }}
      >
        <svg
          viewBox={`0 0 22 ${heightMm}`}
          className="w-full h-full"
          style={{ width: '22px', height: `${heightMm}mm` }}
        >
          {/* Vùng lề an toàn trên & dưới */}
          <rect x={0} y={0} width={22} height={paddingMm} fill="rgba(2, 132, 199, 0.18)" />
          <rect x={0} y={heightMm - paddingMm} width={22} height={paddingMm} fill="rgba(2, 132, 199, 0.18)" />
          <line x1={0} y1={paddingMm} x2={22} y2={paddingMm} stroke="#0284c7" strokeWidth="0.5" strokeDasharray="1,1" />
          <line x1={0} y1={heightMm - paddingMm} x2={22} y2={heightMm - paddingMm} stroke="#0284c7" strokeWidth="0.5" strokeDasharray="1,1" />

          {verticalTicks.map(({ mm, isMajor, isMid }) => {
            const x1 = isMajor ? 6 : isMid ? 11 : 16;
            return (
              <g key={`v-${mm}`}>
                <line
                  x1={x1}
                  y1={mm}
                  x2={22}
                  y2={mm}
                  stroke={isMajor ? '#94a3b8' : isMid ? '#64748b' : '#475569'}
                  strokeWidth={isMajor ? '0.4' : '0.25'}
                />
                {isMajor && (
                  <text
                    x={5.5}
                    y={mm + 1.2}
                    fill="#cbd5e1"
                    fontSize="3.8px"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {mm}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </>
  );
}

export default memo(TemplateRuler);
