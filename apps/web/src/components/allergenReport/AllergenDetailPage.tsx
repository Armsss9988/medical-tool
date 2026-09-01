import { memo } from 'react';
import { getAllergenGradeClasses, getAllergenBadgeSvg } from '@domain/allergenDetector';
import { AllergenReportItemDTO } from '@domain/services/AllergenReportDomainService';

interface AllergenDetailPageProps {
  pageItems: AllergenReportItemDTO[];
  pageIdx: number;
  totalDetailPages: number;
  totalCount: number;
  pageNumber?: number;
}

function AllergenDetailPage({
  pageItems,
  pageIdx,
  totalDetailPages,
  totalCount,
  pageNumber
}: AllergenDetailPageProps) {
  return (
    <div 
      data-page="true"
      className="report-page bg-white text-slate-900 p-6 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-5 flex flex-col justify-between"
      style={{
        fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
        width: '210mm',
        minWidth: '210mm',
        maxWidth: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box'
      }}
    >
      <div>
        {/* Tiêu đề bảng chi tiết */}
        <div className="text-center mb-2.5">
          <h2 className="text-[17px] font-black text-slate-900 uppercase tracking-wide">
            CHI TIẾT KẾT QUẢ XÉT NGHIỆM {totalCount} DỊ NGUYÊN {totalDetailPages > 1 ? `(PHẦN ${pageIdx + 1})` : ''}
          </h2>
        </div>

        {/* Bảng Chi Tiết */}
        <div className="border border-slate-300 rounded bg-white">
          <table className="w-full text-[11.5px] border-collapse">
            <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-300">
              <tr>
                <th className="py-2 px-1 w-7 text-center border-r border-slate-300 align-middle leading-snug">TT</th>
                <th className="py-2 px-1 w-12 text-center border-r border-slate-300 align-middle leading-snug">CODE</th>
                <th className="py-2 px-2 text-left border-r border-slate-300 align-middle leading-snug">TÊN CHỈ SỐ</th>
                <th className="py-2 px-2 text-left border-r border-slate-300 align-middle leading-snug">TÊN DỊ NGUYÊN</th>
                <th className="py-2 px-2 w-28 text-left border-r border-slate-300 align-middle leading-snug">Đường dị ứng</th>
                <th className="py-2 px-1.5 w-20 text-center border-r border-slate-300 leading-tight align-middle">BÌNH THƯỜNG<br/>(IU/ml)</th>
                <th className="py-2 px-1.5 w-20 text-center border-r border-slate-300 leading-tight align-middle">KẾT QUẢ<br/>(IU/ml)</th>
                <th className="py-2 px-1 w-10 text-center border-r border-slate-300 leading-tight align-middle">ĐỘ<br/>(+)</th>
                <th className="py-2 px-2 text-left align-middle leading-snug">GHI CHÚ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {pageItems.map((item) => {
                const gradeStyle = getAllergenGradeClasses(item.grade, item.isTIgE, item.isPositive);
                const resultTextColor = item.isPositive ? `${gradeStyle.textColor} font-bold` : 'text-slate-800';

                return (
                  <tr 
                    key={item.code} 
                    className={`hover:bg-slate-50 ${gradeStyle.rowBg}`}
                  >
                    <td className="py-1.5 px-1 text-center font-mono text-slate-500 border-r border-slate-300 align-middle leading-snug">{item.tt}</td>
                    <td className="py-1.5 px-1 text-center font-mono font-bold text-sky-800 border-r border-slate-300 text-[12px] align-middle leading-snug">{item.code}</td>
                    <td className={`py-1.5 px-2 font-semibold ${item.isPositive ? gradeStyle.nameColor : 'text-slate-900'} border-r border-slate-300 text-[12px] align-middle leading-snug`}>{item.name}</td>
                    <td className="py-1.5 px-2 italic text-slate-600 border-r border-slate-300 text-[12px] align-middle leading-snug">{item.allergenName}</td>
                    <td className="py-1.5 px-2 text-slate-600 border-r border-slate-300 text-[11px] align-middle leading-snug">{item.route}</td>
                    <td className="py-1.5 px-1.5 text-center font-mono text-slate-600 border-r border-slate-300 text-[11.5px] align-middle leading-snug">{item.normalRef}</td>
                    <td className={`py-1.5 px-1.5 text-center font-mono border-r border-slate-300 text-[12.5px] align-middle leading-snug ${resultTextColor}`}>
                      {item.result}
                    </td>
                    <td className="py-1.5 px-1 text-center align-middle leading-snug">
                      {item.isTIgE ? '' : (item.isPositive ? (
                        <div className="flex items-center justify-center">
                          <img 
                            src={getAllergenBadgeSvg(item.grade, 18)} 
                            width={18} 
                            height={18} 
                            alt={`Độ ${item.grade}`} 
                            className="inline-block align-middle"
                          />
                        </div>
                      ) : '')}
                    </td>
                    <td className="py-1.5 px-2 text-slate-600 text-[11px] leading-snug align-middle">
                      {item.isTIgE ? (
                        item.isPositive ? (
                          <span className="font-bold text-red-600">Tăng (&gt; 15,0 IU/ml)</span>
                        ) : (
                          <span className="italic text-slate-600">{item.note || 'Bình thường'}</span>
                        )
                      ) : (
                        item.note
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-200">
        GOLAB CLINICAL LABORATORY • CHI TIẾT DỊ NGUYÊN • TRANG {pageNumber ?? (pageIdx + 3)}
      </div>
    </div>
  );
}

export default memo(AllergenDetailPage);
