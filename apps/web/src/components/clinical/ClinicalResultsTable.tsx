import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info, Clock } from 'lucide-react';
import { ClinicalBadge } from './ClinicalBadge';
import { ClinicalInlineGauge } from './ClinicalInlineGauge';
import { ClinicalGauge, parseNumericResult } from './ClinicalGauge';

export interface ClinicalTestRowData {
  testCode: string;
  testName: string;
  category: string;
  result: string;
  unit: string;
  refMin: number | null;
  refMax: number | null;
  refText?: string;
  note?: string;
  evaluation: 'NORMAL' | 'ABNORMAL' | 'PENDING';
  evaluationType?: 'range' | 'scale' | string;
  scaleId?: string | null;
}

interface ClinicalResultsTableProps {
  tests: ClinicalTestRowData[];
  className?: string;
}

export const ClinicalResultsTable: React.FC<ClinicalResultsTableProps> = ({
  tests,
  className = ''
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (code: string) => {
    setExpandedRows((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  // Gom nhóm các xét nghiệm theo chuyên khoa lâm sàng
  const groupedPanels = React.useMemo(() => {
    const map = new Map<string, ClinicalTestRowData[]>();
    tests.forEach((t) => {
      const cat = (t.category || 'Xét Nghiệm Chung').trim();
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(t);
    });
    return Array.from(map.entries());
  }, [tests]);

  if (tests.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
        Không có chỉ số nào phù hợp với bộ lọc hiện tại.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="clinical-results-table">
      {groupedPanels.map(([categoryName, panelTests]) => {
        const pendingCount = panelTests.filter((t) => t.evaluation === 'PENDING' || !t.result || t.result.trim() === '').length;
        const abnormalCount = panelTests.filter((t) => t.evaluation === 'ABNORMAL').length;
        const isAllPending = pendingCount === panelTests.length;

        return (
          <div
            key={categoryName}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
          >
            {/* Tiêu đề nhóm chuyên khoa / Panel Header chuẩn bệnh viện */}
            <div className="bg-slate-50/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {categoryName}
                </h3>
                <span className="text-[11px] font-mono text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                  {panelTests.length} chỉ số
                </span>
              </div>

              <div className="text-xs">
                {isAllPending ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                    <Clock className="w-3 h-3" />
                    Đang chờ xét nghiệm
                  </span>
                ) : abnormalCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[11px]">
                    <AlertTriangle className="w-3 h-3" />
                    {abnormalCount} bất thường
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-teal-700 font-medium text-[11px]">
                    <CheckCircle2 className="w-3 h-3" />
                    Bình thường
                  </span>
                )}
              </div>
            </div>

            {/* BẢNG CHỈ SỐ TRÊN DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-100/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Tên Xét Nghiệm</th>
                    <th className="py-2.5 px-4 text-right">Kết Quả</th>
                    <th className="py-2.5 px-4 text-center">Khoảng Tham Chiếu</th>
                    <th className="py-2.5 px-4 text-center">Định Vị Lâm Sàng</th>
                    <th className="py-2.5 px-4 text-center">Đánh Giá</th>
                    <th className="py-2.5 px-3 text-center w-10">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {panelTests.map((test) => {
                    const isExpanded = Boolean(expandedRows[test.testCode]);
                    const isPending = test.evaluation === 'PENDING' || !test.result || test.result.trim() === '';
                    const isAbnormal = !isPending && test.evaluation === 'ABNORMAL';
                    const numVal = parseNumericResult(test.result);
                    const isLow = !isPending && numVal !== null && test.refMin !== null && test.refMin !== undefined && numVal < test.refMin;
                    const isHigh = !isPending && numVal !== null && test.refMax !== null && test.refMax !== undefined && numVal > test.refMax;

                    return (
                      <React.Fragment key={test.testCode}>
                        <tr
                          onClick={() => toggleRow(test.testCode)}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer select-none ${
                            isAbnormal ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          {/* Tên & Mã xét nghiệm */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 leading-snug">
                              {test.testName}
                            </div>
                            <span className="font-mono text-[10px] text-slate-400">
                              {test.testCode}
                            </span>
                          </td>

                          {/* Kết quả & Đơn vị */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isPending ? (
                              <span className="font-mono text-xs text-slate-400 italic">Đang chờ</span>
                            ) : (
                              <>
                                <span
                                  className={`font-mono font-bold text-sm ${
                                    isAbnormal ? 'text-rose-700' : 'text-slate-900'
                                  }`}
                                >
                                  {test.result}
                                </span>
                                {test.unit && (
                                  <span className="font-mono text-[11px] text-slate-500 ml-1">
                                    {test.unit}
                                  </span>
                                )}
                              </>
                            )}
                          </td>

                          {/* Khoảng tham chiếu */}
                          <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {test.refText ? (
                              <span>{test.refText} {test.unit}</span>
                            ) : test.refMin !== null && test.refMax !== null ? (
                              <span>{test.refMin} - {test.refMax} {test.unit}</span>
                            ) : (
                              <span className="text-slate-400 italic">---</span>
                            )}
                          </td>

                          {/* Thước đo inline chuẩn Apple Health */}
                          <td className="py-3 px-4 text-center">
                            {isPending ? (
                              <span className="text-[11px] text-slate-400 font-mono italic">Đang xử lý</span>
                            ) : (
                              <ClinicalInlineGauge
                                result={test.result}
                                refMin={test.refMin}
                                refMax={test.refMax}
                                unit={test.unit}
                              />
                            )}
                          </td>

                          {/* Huy hiệu đánh giá */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isPending ? (
                              <ClinicalBadge variant="pending" size="sm">
                                Chờ KQ
                              </ClinicalBadge>
                            ) : isAbnormal ? (
                              <ClinicalBadge variant={isHigh ? 'high' : isLow ? 'low' : 'abnormal'} size="sm">
                                {isHigh ? 'Cao' : isLow ? 'Thấp' : 'Bất thường'}
                              </ClinicalBadge>
                            ) : (
                              <ClinicalBadge variant="normal" size="sm">
                                Chuẩn
                              </ClinicalBadge>
                            )}
                          </td>

                          {/* Nút mở rộng */}
                          <td className="py-3 px-3 text-center text-slate-400">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 mx-auto text-slate-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 mx-auto text-slate-400" />
                            )}
                          </td>
                        </tr>

                        {/* Hàng chi tiết mở rộng (Accordion) */}
                        {isExpanded && (
                          <tr className="bg-slate-50/60 border-t border-b border-slate-200/80">
                            <td colSpan={6} className="p-4">
                              <div className="max-w-2xl mx-auto space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                  <Info className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Phân tích sinh học chi tiết: {test.testName}</span>
                                </div>

                                <ClinicalGauge
                                  result={test.result}
                                  refMin={test.refMin}
                                  refMax={test.refMax}
                                  evaluationType={test.evaluationType}
                                  scaleId={test.scaleId}
                                  note={test.note}
                                  unit={test.unit}
                                />

                                {test.note && (
                                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700">
                                    <span className="font-semibold text-slate-900">Ghi chú phòng xét nghiệm:</span>{' '}
                                    {test.note}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* DANH SÁCH COMPACT TRÊN MOBILE (< 768px) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {panelTests.map((test) => {
                const isExpanded = Boolean(expandedRows[test.testCode]);
                const isPending = test.evaluation === 'PENDING' || !test.result || test.result.trim() === '';
                const isAbnormal = !isPending && test.evaluation === 'ABNORMAL';
                const numVal = parseNumericResult(test.result);
                const isLow = !isPending && numVal !== null && test.refMin !== null && test.refMin !== undefined && numVal < test.refMin;
                const isHigh = !isPending && numVal !== null && test.refMax !== null && test.refMax !== undefined && numVal > test.refMax;

                return (
                  <div key={test.testCode} className={`p-3.5 ${isAbnormal ? 'bg-rose-50/20' : ''}`}>
                    <div
                      onClick={() => toggleRow(test.testCode)}
                      className="flex items-start justify-between gap-2 cursor-pointer"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-semibold text-xs text-slate-900 leading-snug">
                          {test.testName}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {test.testCode}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-baseline justify-end gap-1">
                          <span
                            className={`font-mono text-sm ${
                              isPending
                                ? 'text-slate-400 text-xs italic font-normal'
                                : isAbnormal
                                  ? 'font-bold text-rose-700'
                                  : 'font-bold text-slate-900'
                            }`}
                          >
                            {isPending ? 'Đang chờ' : (test.result || '---')}
                          </span>
                          {!isPending && test.unit && (
                            <span className="font-mono text-[10px] text-slate-500">
                              {test.unit}
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5">
                          {isPending ? (
                            <ClinicalBadge variant="pending" size="sm">
                              Chờ KQ
                            </ClinicalBadge>
                          ) : isAbnormal ? (
                            <ClinicalBadge variant={isHigh ? 'high' : isLow ? 'low' : 'abnormal'} size="sm">
                              {isHigh ? 'Cao' : isLow ? 'Thấp' : 'Bất thường'}
                            </ClinicalBadge>
                          ) : (
                            <ClinicalBadge variant="normal" size="sm">
                              Chuẩn
                            </ClinicalBadge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dòng mốc tham chiếu & Mini Gauge */}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[10px] font-mono text-slate-500 truncate">
                        Tham chiếu: {test.refText || `${test.refMin ?? 0} - ${test.refMax ?? '---'}`} {test.unit}
                      </div>

                      {isPending ? (
                        <span className="text-[10px] text-slate-400 font-mono italic">
                          Đang xử lý
                        </span>
                      ) : (
                        <ClinicalInlineGauge
                          result={test.result}
                          refMin={test.refMin}
                          refMax={test.refMax}
                          unit={test.unit}
                        />
                      )}
                    </div>

                    {/* Khung mở rộng trên mobile */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 bg-slate-50/70 -mx-3.5 -mb-3.5 p-3.5 rounded-b-xl">
                        <ClinicalGauge
                          result={test.result}
                          refMin={test.refMin}
                          refMax={test.refMax}
                          evaluationType={test.evaluationType}
                          scaleId={test.scaleId}
                          note={test.note}
                          unit={test.unit}
                        />

                        {test.note && (
                          <div className="bg-white border border-slate-200 rounded p-2 text-[11px] text-slate-600">
                            <strong className="text-slate-800">Ghi chú:</strong> {test.note}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
