import { Fragment, memo } from 'react';
import {
  TemplateBlock,
  SelectedTest,
  TestEquipment,
  CatalogItemEquipmentLink,
  TestTableBlockProps,
  ReportPaginationEntry,
  resolveTestEquipmentName,
  formatEquipmentForPrint
} from '@domain';
import { evaluateResult } from '@domain/testResult';

interface DynamicReportClinicalTableBlockProps {
  block: TemplateBlock;
  tableChunkEntries?: ReadonlyArray<ReportPaginationEntry>;
  groupedRegularTests: Array<[string, SelectedTest[]]>;
  regularTests: SelectedTest[];
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
}

export const DynamicReportClinicalTableBlock = memo(function DynamicReportClinicalTableBlock({
  block,
  tableChunkEntries,
  groupedRegularTests,
  regularTests,
  equipments = [],
  catalogItemEquipments = []
}: DynamicReportClinicalTableBlockProps) {
  const p = block.props as TestTableBlockProps;
  const cols = p.columns || { stt: true, name: true, result: true, refRange: true, unit: true, equipment: true };
  const densityClass = p.density === 'compact' ? 'py-0.5 px-1.5' : p.density === 'relaxed' ? 'py-2 px-3' : 'py-1 px-2';
  const fontSizeClass = p.fontSize === 'xs' ? 'text-[11px]' : p.fontSize === 'md' ? 'text-[13px]' : 'text-[12px]';

  let rowCounter = 0;

  return (
    <div className="border border-slate-300 rounded mb-3 bg-white overflow-hidden">
      <table className={`w-full ${fontSizeClass} border-collapse`}>
        <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-300">
          <tr>
            {cols.stt && <th className="py-2 px-2 w-8 text-center border-r border-slate-300 align-middle leading-snug">STT</th>}
            {cols.name && <th className="py-2 px-2.5 text-left border-r border-slate-300 align-middle leading-snug">TÊN CHỈ SỐ XÉT NGHIỆM</th>}
            {cols.result && <th className="py-2 px-2 w-24 text-center border-r border-slate-300 align-middle leading-snug">KẾT QUẢ</th>}
            {cols.unit && <th className="py-2 px-1.5 w-16 text-center border-r border-slate-300 align-middle leading-snug">ĐƠN VỊ</th>}
            {cols.refRange && <th className="py-2 px-2 w-32 text-center border-r border-slate-300 align-middle leading-snug">TRỊ SỐ THAM CHIẾU</th>}
            {cols.equipment && <th className="py-2 px-2 w-36 text-center border-r border-slate-300 align-middle leading-snug">THIẾT BỊ XỬ LÝ</th>}
            {cols.price && <th className="py-2 px-2 w-24 text-right border-r border-slate-300 align-middle leading-snug">GIÁ TIỀN</th>}
            {cols.note && <th className="py-2 px-2 text-left align-middle leading-snug">GHI CHÚ</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {tableChunkEntries ? (
            tableChunkEntries.map((entry, entryIdx) => {
              if (entry.type === 'category') {
                return (
                  <tr key={`cat-${entry.category}-${entryIdx}`} className="bg-sky-50 font-bold text-sky-950">
                    <td colSpan={10} className="py-1 px-2.5 uppercase tracking-wide text-[11.5px] border-y border-slate-300">
                      • {entry.category}
                    </td>
                  </tr>
                );
              }
              const t = entry.test;
              const isAbnormalByNote = t.note ? (t.note.includes('Phát Hiện') && !t.note.includes('Không')) : false;
              const evaluation = evaluateResult(t.result, t.refMin, t.refMax);
              const isAbnormal = evaluation.status === 'high' || evaluation.status === 'low' || isAbnormalByNote;
              const resolvedEquipment = formatEquipmentForPrint(resolveTestEquipmentName(t, equipments, catalogItemEquipments));

              return (
                <tr key={`${t.code}-${entry.idx}`} className={`hover:bg-slate-50 ${isAbnormal && p.highlightAbnormal !== false ? 'bg-red-50/40' : ''}`}>
                  {cols.stt && <td className={`${densityClass} text-center font-mono text-slate-500 border-r border-slate-200`}>{entry.idx}</td>}
                  {cols.name && (
                    <td className={`${densityClass} font-bold text-slate-900 border-r border-slate-200`}>
                      {t.name}
                      {t.scientific && <span className="text-[10px] text-slate-500 italic block font-normal">{t.scientific}</span>}
                    </td>
                  )}
                  {cols.result && (
                    <td className={`${densityClass} text-center font-mono text-[13px] border-r border-slate-200 ${isAbnormal && p.highlightAbnormal !== false ? 'text-red-600 font-black' : 'text-slate-900 font-bold'}`}>
                      {t.result || '---'}
                    </td>
                  )}
                  {cols.unit && <td className={`${densityClass} text-center font-mono text-slate-700 text-[11.5px] border-r border-slate-200`}>{t.unit || '---'}</td>}
                  {cols.refRange && (
                    <td className={`${densityClass} text-center font-mono text-slate-700 text-[11.5px] border-r border-slate-200`}>
                      {t.refText || (t.refMin !== undefined && t.refMax !== undefined ? `${t.refMin} - ${t.refMax}` : '---')}
                    </td>
                  )}
                  {cols.equipment && <td className={`${densityClass} text-center text-slate-600 text-[11px] truncate max-w-[150px] border-r border-slate-200`}>{resolvedEquipment || '---'}</td>}
                  {cols.price && <td className={`${densityClass} text-right font-mono text-slate-800 text-[11.5px] border-r border-slate-200`}>{t.price ? `${t.price.toLocaleString('vi-VN')} đ` : '---'}</td>}
                  {cols.note && (
                    <td className={`${densityClass} text-slate-700 font-semibold text-[11px]`}>
                      {t.note || (isAbnormal ? evaluation.label : (t.result && String(t.result).trim() !== '' ? 'Bình thường' : ''))}
                    </td>
                  )}
                </tr>
              );
            })
          ) : p.groupByCategory !== false ? (
            groupedRegularTests.map(([category, items]) => (
              <Fragment key={category}>
                <tr className="bg-sky-50 font-bold text-sky-950">
                  <td colSpan={10} className="py-1 px-2.5 uppercase tracking-wide text-[11.5px] border-y border-slate-300">
                    • {category}
                  </td>
                </tr>
                {items.map((t, idx) => {
                  rowCounter++;
                  const isAbnormalByNote = t.note ? (t.note.includes('Phát Hiện') && !t.note.includes('Không')) : false;
                  const evaluation = evaluateResult(t.result, t.refMin, t.refMax);
                  const isAbnormal = evaluation.status === 'high' || evaluation.status === 'low' || isAbnormalByNote;
                  const resolvedEquipment = formatEquipmentForPrint(resolveTestEquipmentName(t, equipments, catalogItemEquipments));

                  return (
                    <tr key={`${t.code}-${idx}`} className={`hover:bg-slate-50 ${isAbnormal && p.highlightAbnormal !== false ? 'bg-red-50/40' : ''}`}>
                      {cols.stt && <td className={`${densityClass} text-center font-mono text-slate-500 border-r border-slate-200`}>{rowCounter}</td>}
                      {cols.name && (
                        <td className={`${densityClass} font-bold text-slate-900 border-r border-slate-200`}>
                          {t.name}
                          {t.scientific && <span className="text-[10px] text-slate-500 italic block font-normal">{t.scientific}</span>}
                        </td>
                      )}
                      {cols.result && (
                        <td className={`${densityClass} text-center font-mono text-[13px] border-r border-slate-200 ${isAbnormal && p.highlightAbnormal !== false ? 'text-red-600 font-black' : 'text-slate-900 font-bold'}`}>
                          {t.result || '---'}
                        </td>
                      )}
                      {cols.unit && <td className={`${densityClass} text-center font-mono text-slate-700 text-[11.5px] border-r border-slate-200`}>{t.unit || '---'}</td>}
                      {cols.refRange && (
                        <td className={`${densityClass} text-center font-mono text-slate-700 text-[11.5px] border-r border-slate-200`}>
                          {t.refText || (t.refMin !== undefined && t.refMax !== undefined ? `${t.refMin} - ${t.refMax}` : '---')}
                        </td>
                      )}
                      {cols.equipment && <td className={`${densityClass} text-center text-slate-600 text-[11px] truncate max-w-[150px] border-r border-slate-200`}>{resolvedEquipment || '---'}</td>}
                      {cols.price && <td className={`${densityClass} text-right font-mono text-slate-800 text-[11.5px] border-r border-slate-200`}>{t.price ? `${t.price.toLocaleString('vi-VN')} đ` : '---'}</td>}
                      {cols.note && (
                        <td className={`${densityClass} text-slate-700 font-semibold text-[11px]`}>
                          {t.note || (isAbnormal ? evaluation.label : (t.result && String(t.result).trim() !== '' ? 'Bình thường' : ''))}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </Fragment>
            ))
          ) : (
            regularTests.map((t, idx) => {
              const isAbnormalByNote = t.note ? (t.note.includes('Phát Hiện') && !t.note.includes('Không')) : false;
              const evaluation = evaluateResult(t.result, t.refMin, t.refMax);
              const isAbnormal = evaluation.status === 'high' || evaluation.status === 'low' || isAbnormalByNote;
              const resolvedEquipment = formatEquipmentForPrint(resolveTestEquipmentName(t, equipments, catalogItemEquipments));

              return (
                <tr key={`${t.code}-${idx}`} className={`hover:bg-slate-50 ${isAbnormal && p.highlightAbnormal !== false ? 'bg-red-50/40' : ''}`}>
                  {cols.stt && <td className={`${densityClass} text-center font-mono text-slate-500 border-r border-slate-200`}>{idx + 1}</td>}
                  {cols.name && (
                    <td className={`${densityClass} font-semibold text-slate-900 border-r border-slate-200`}>
                      {t.name}
                    </td>
                  )}
                  {cols.result && (
                    <td className={`${densityClass} text-center font-mono text-[13px] border-r border-slate-200 ${isAbnormal && p.highlightAbnormal !== false ? 'text-red-600 font-black' : 'text-slate-900 font-bold'}`}>
                      {t.result || '---'}
                    </td>
                  )}
                  {cols.refRange && (
                    <td className={`${densityClass} text-center font-mono text-slate-600 text-[11.5px] border-r border-slate-200`}>
                      {t.refText || (t.refMin !== undefined && t.refMax !== undefined ? `${t.refMin} - ${t.refMax}` : '---')}
                    </td>
                  )}
                  {cols.unit && <td className={`${densityClass} text-center font-mono text-slate-600 text-[11.5px] border-r border-slate-200`}>{t.unit || '---'}</td>}
                  {cols.equipment && <td className={`${densityClass} text-slate-600 text-[11px] truncate max-w-[160px] border-r border-slate-200`}>{resolvedEquipment}</td>}
                  {cols.price && <td className={`${densityClass} text-right font-mono text-slate-800 text-[11.5px] border-r border-slate-200`}>{t.price ? `${t.price.toLocaleString('vi-VN')} đ` : '---'}</td>}
                  {cols.note && <td className={`${densityClass} text-slate-600 text-[11px]`}>{t.note || '---'}</td>}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});
