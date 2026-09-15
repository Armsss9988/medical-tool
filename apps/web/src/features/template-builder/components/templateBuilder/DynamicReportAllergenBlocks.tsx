import { memo } from 'react';
import {
  TemplateBlock,
  ClinicInfo,
  Patient,
  TestPackage,
  SelectedTest,
  AllergenGradingScale,
  AllergenSummaryBlockProps,
  AllergenHeaderBlockProps,
  AllergenTitleBlockProps,
  AllergenPatientSummaryBlockProps,
  AllergenPositiveTableBlockProps,
  AllergenScaleTableBlockProps,
  AllergenSymptomsBoxBlockProps,
  AllergenTigeNoteBlockProps,
  AllergenDetailTableBlockProps,
  AllergenPreventionGuideBlockProps,
  AllergenCoverSummaryBlockProps
} from '@domain';
import { AllergenReportDTO, AllergenReportItemDTO } from '@domain/services/AllergenReportDomainService';
import { getAllergenBadgeSvg, getAllergenGradeClasses } from '@domain/allergenDetector';

export const DynamicReportAllergenSummaryBlock = memo(function DynamicReportAllergenSummaryBlock({
  block,
  allergenDTO
}: {
  block: TemplateBlock;
  allergenDTO: AllergenReportDTO | null;
}) {
  const p = block.props as AllergenSummaryBlockProps;
  if (!allergenDTO || allergenDTO.positiveList.length === 0) {
    if (p.showNegativeNotice !== false) {
      return (
        <div className="border border-emerald-300 rounded p-2.5 mb-3 bg-emerald-50/60 text-[12px] text-emerald-950 font-medium">
          🌿 <strong>TỔNG HỢP DỊ NGUYÊN:</strong> Âm tính (Độ 0 - Không phản ứng) với toàn bộ các dị nguyên trong gói tầm soát.
        </div>
      );
    }
    return null;
  }

  return (
    <div className="border-2 border-red-300 rounded mb-3 bg-red-50/30 p-2.5">
      <h3 className="text-[13px] font-bold text-red-900 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
        <span>⚠️</span>
        <span>{p.title || 'TỔNG HỢP CÁC DỊ NGUYÊN DƯƠNG TÍNH'}</span>
      </h3>
      <div className="grid grid-cols-2 gap-2 text-[11.5px]">
        {allergenDTO.positiveList.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-1.5 bg-white rounded border border-red-200">
            <div className="flex items-center space-x-2">
              <img src={getAllergenBadgeSvg(item.grade, 18)} alt={`Độ ${item.grade}`} className="w-4.5 h-4.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-900">{item.name}</span>
                {p.showRoute && item.route && <span className="text-[10px] text-slate-500 block">{item.route}</span>}
              </div>
            </div>
            {p.showConcentration && <span className="font-mono font-bold text-red-600">{item.result} IU/ml</span>}
          </div>
        ))}
      </div>
    </div>
  );
});

export const DynamicReportAllergenHeaderBlock = memo(function DynamicReportAllergenHeaderBlock({
  block,
  clinicInfo,
  currentLogo
}: {
  block: TemplateBlock;
  clinicInfo?: ClinicInfo;
  currentLogo: string;
}) {
  const p = block.props as AllergenHeaderBlockProps;
  return (
    <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
      <div className="flex items-center space-x-3">
        {p.showLogo !== false && (
          <img
            src={currentLogo}
            alt="Logo"
            className="h-14 w-auto object-contain max-w-[120px]"
          />
        )}
        <div>
          {p.showClinicName !== false && (
            <h1 className="text-[17px] font-black uppercase text-sky-950 tracking-tight leading-none mb-1">
              {clinicInfo?.name || 'PHÒNG XÉT NGHIỆM Y KHOA GOLAB'}
            </h1>
          )}
          {p.showAddress !== false && (
            <p className="text-[11.5px] text-slate-600 leading-tight">
              {clinicInfo?.address || 'Địa chỉ: 123 Đường Y Học, Phường 1, TP. Đồng Hới'}
            </p>
          )}
          {p.showContact !== false && (
            <p className="text-[11.5px] text-slate-600 leading-tight">
              Hotline: <strong className="text-slate-800">{clinicInfo?.phone || '032.855.3773'}</strong> {clinicInfo?.website ? `| Website: ${clinicInfo.website}` : ''}
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <div
          className="inline-flex items-center justify-center text-white font-black text-[12.5px] px-3.5 py-1 rounded tracking-wide uppercase leading-normal shadow-xs"
          style={{ backgroundColor: p.badgeColor || '#dc2626' }}
        >
          {p.badgeText || 'Báo Cáo Dị Nguyên'}
        </div>
      </div>
    </div>
  );
});

export const DynamicReportAllergenTitleBlock = memo(function DynamicReportAllergenTitleBlock({
  block
}: {
  block: TemplateBlock;
}) {
  const p = block.props as AllergenTitleBlockProps;
  const alignClass = p.align === 'left' ? 'text-left' : p.align === 'right' ? 'text-right' : 'text-center';
  return (
    <div className={`${alignClass} mb-3`}>
      <h2 className="text-[19px] font-black text-slate-900 uppercase tracking-wide" style={{ color: p.textColor || undefined }}>
        {p.text || 'KẾT QUẢ ĐỊNH LƯỢNG KHÁNG THỂ IGE ĐẶC HIỆU'}
      </h2>
      {p.subtitle && (
        <p className="text-[13px] font-bold italic mt-0.5" style={{ color: p.subtitleColor || '#b91c1c' }}>
          {p.subtitle}
        </p>
      )}
    </div>
  );
});

export const DynamicReportAllergenPatientSummaryBlock = memo(function DynamicReportAllergenPatientSummaryBlock({
  block,
  patient
}: {
  block: TemplateBlock;
  patient: Patient;
}) {
  const p = block.props as AllergenPatientSummaryBlockProps;
  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-300 rounded px-4 py-1.5 mb-2 text-[13px] leading-snug">
      {p.showName !== false && (
        <div>
          <span className="font-semibold text-slate-600">Họ tên: </span>
          <strong className={`uppercase font-bold text-[14px] ${p.highlightName !== false ? 'text-red-600' : 'text-slate-900'}`}>{patient.name || '---'}</strong>
        </div>
      )}
      {p.showDob !== false && (
        <div>
          <span className="font-semibold text-slate-600">Năm sinh: </span>
          <strong className="text-slate-800">{patient.dob || '---'}</strong>
        </div>
      )}
      {p.showGender !== false && (
        <div>
          <span className="font-semibold text-slate-600">Giới tính: </span>
          <strong className="text-slate-800">{patient.gender || 'Nam'}</strong>
        </div>
      )}
      <div>
        <span className="font-semibold text-slate-600">Loại mẫu: </span>
        <strong className="text-slate-800">{p.sampleType || 'Huyết thanh'}</strong>
      </div>
    </div>
  );
});

export const DynamicReportAllergenPositiveTableBlock = memo(function DynamicReportAllergenPositiveTableBlock({
  block,
  allergenDTO
}: {
  block: TemplateBlock;
  allergenDTO: AllergenReportDTO | null;
}) {
  const p = block.props as AllergenPositiveTableBlockProps;
  const posList = allergenDTO?.positiveList || [];
  return (
    <div className="mb-2">
      <div className="border border-slate-300 rounded bg-white overflow-hidden">
        <table className="w-full text-[13px] border-collapse">
          <thead className="bg-slate-50 text-slate-900 font-bold border-b-2 border-slate-300">
            <tr>
              <th className="py-2 px-3 w-12 text-center border-r border-slate-300 align-middle leading-snug">STT</th>
              <th className="py-2 px-4 text-left border-r border-slate-300 align-middle leading-snug">LOẠI DỊ NGUYÊN</th>
              {p.showScientific !== false && <th className="py-2 px-4 text-left border-r border-slate-300 align-middle leading-snug">TÊN KHOA HỌC</th>}
              {p.showCode !== false && <th className="py-2 px-3 w-20 text-center border-r border-slate-300 align-middle leading-snug">MÃ</th>}
              <th className="py-2 px-4 w-32 text-center align-middle leading-snug">ĐỘ DƯƠNG TÍNH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {posList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-3 text-center text-slate-500 italic text-[13px]">
                  {p.emptyNotice || 'Chưa phát hiện dị nguyên dương tính'}
                </td>
              </tr>
            ) : (
              posList.map((pos, idx) => {
                const gradeStyle = getAllergenGradeClasses(pos.grade, pos.isTIgE, pos.isPositive);
                return (
                  <tr key={pos.code || idx} className={`${gradeStyle.rowBg} font-bold ${gradeStyle.textColor} text-[13.5px]`}>
                    <td className="py-2 px-3 text-center border-r border-slate-300 align-middle leading-snug">{idx + 1}</td>
                    <td className={`py-2 px-4 border-r border-slate-300 align-middle leading-snug ${gradeStyle.nameColor}`}>{pos.name}</td>
                    {p.showScientific !== false && <td className="py-2 px-4 border-r border-slate-300 italic font-medium opacity-90 align-middle leading-snug">{pos.allergenName}</td>}
                    {p.showCode !== false && <td className="py-2 px-3 text-center font-mono border-r border-slate-300 align-middle leading-snug">{pos.code}</td>}
                    <td className="py-2 px-4 text-center align-middle leading-snug">
                      {pos.isTIgE ? (
                        <span className={`text-[12.5px] font-bold ${pos.isPositive ? 'text-red-700' : 'text-sky-900'}`}>
                          {pos.result || '---'} <span className="text-slate-500 text-[10px] font-normal">(IU/ml)</span>
                        </span>
                      ) : (
                        <div className="flex items-center justify-center">
                          <img
                            src={getAllergenBadgeSvg(pos.grade, 20)}
                            width={20}
                            height={20}
                            alt={`Độ ${pos.grade}`}
                            className="inline-block align-middle"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {p.footnote && (
        <p className="text-[12px] text-slate-500 italic text-right mt-1 mb-2">
          {p.footnote}
        </p>
      )}
    </div>
  );
});

export const DynamicReportAllergenScaleTableBlock = memo(function DynamicReportAllergenScaleTableBlock({
  block,
  allergenDTO,
  allergenScales
}: {
  block: TemplateBlock;
  allergenDTO: AllergenReportDTO | null;
  allergenScales?: AllergenGradingScale[];
}) {
  const p = block.props as AllergenScaleTableBlockProps;
  const scales = allergenDTO?.appliedScales || allergenScales || [];
  return (
    <div className="space-y-2 mb-2">
      {scales.map((scale, sIdx) => (
        <div key={scale.id || sIdx} className="border border-slate-300 rounded bg-white overflow-hidden">
          <div className="bg-slate-100 py-1.5 px-2 text-center font-bold text-red-700 text-[12px] uppercase border-b-2 border-slate-300">
            {scale.name || p.title || 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH'}
          </div>
          <table className="w-full text-[11.5px] border-collapse">
            <thead className="bg-slate-50 font-bold border-b border-slate-300">
              <tr>
                <th className="h-7 py-0 px-1.5 text-center border-r border-slate-300 align-middle w-12">ĐỘ (+)</th>
                <th className="h-7 py-0 px-1.5 text-center border-r border-slate-300 align-middle">NỒNG ĐỘ ({scale.unit || 'IU/ml'})</th>
                <th className="h-7 py-0 px-1.5 text-center align-middle">DIỄN GIẢI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {scale.levels.map((level) => {
                const gradeStyle = getAllergenGradeClasses(level.grade);
                return (
                  <tr key={level.grade} className={gradeStyle.rowBg}>
                    <td className="h-7 py-0 text-center border-r border-slate-300 font-bold align-middle">
                      <div className="flex items-center justify-center">
                        <img
                          src={getAllergenBadgeSvg(level.grade, 18)}
                          width={18}
                          height={18}
                          alt={`Độ ${level.grade}`}
                          className="inline-block align-middle"
                        />
                      </div>
                    </td>
                    <td className={`h-7 py-0 text-center font-mono border-r border-slate-300 align-middle ${level.isPositive ? gradeStyle.textColor + ' font-bold' : 'text-slate-600'}`}>
                      {level.rangeText}
                    </td>
                    <td className={`h-7 py-0 text-center align-middle ${level.isPositive ? gradeStyle.textColor + ' font-bold' : 'text-slate-700 font-semibold'}`}>
                      {level.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
});

export const DynamicReportAllergenSymptomsBoxBlock = memo(function DynamicReportAllergenSymptomsBoxBlock({
  block
}: {
  block: TemplateBlock;
}) {
  const p = block.props as AllergenSymptomsBoxBlockProps;
  return (
    <div className="border border-slate-300 rounded text-[12px] leading-relaxed bg-slate-50/50 flex flex-col mb-2 overflow-hidden">
      <div className="text-center font-bold text-red-700 text-[12.5px] uppercase py-1.5 px-2 border-b border-slate-300">
        {p.title || 'MỘT SỐ TRIỆU CHỨNG THƯỜNG GẶP KHI DỊ ỨNG'}
      </div>
      <div className="flex-1 flex flex-col justify-center px-3 py-2 space-y-1.5">
        {p.showSkin !== false && (
          <p className="flex items-start gap-1">
            <strong className="text-slate-900 shrink-0">Da, niêm mạc:</strong>
            <span>nổi mề đay, phát ban, viêm da; ngứa, sưng môi, lưỡi, miệng, mắt đỏ, viêm kết mạc.</span>
          </p>
        )}
        {p.showRespiratory !== false && (
          <p className="flex items-start gap-1">
            <strong className="text-slate-900 shrink-0">Hô hấp:</strong>
            <span>ho, khó thở, hắt hơi, sổ mũi, khò khè, hen suyễn, viêm phổi.</span>
          </p>
        )}
        {p.showDigestive !== false && (
          <p className="flex items-start gap-1">
            <strong className="text-slate-900 shrink-0">Tiêu hóa:</strong>
            <span>nuốt khó, nôn, đau bụng, đầy hơi, tiêu chảy.</span>
          </p>
        )}
        {p.showSevere !== false && (
          <p className="flex items-start gap-1">
            <strong className="text-slate-900 shrink-0">Thần kinh &amp; Nặng:</strong>
            <span>đau đầu, chóng mặt; Sốt, sốc phản vệ.</span>
          </p>
        )}
      </div>
      {p.warningText && (
        <p className="text-red-700 font-bold italic px-3 py-1.5 border-t border-slate-300 text-[11.5px]">
          {p.warningText}
        </p>
      )}
    </div>
  );
});

export const DynamicReportAllergenTigeNoteBlock = memo(function DynamicReportAllergenTigeNoteBlock({
  block
}: {
  block: TemplateBlock;
}) {
  const p = block.props as AllergenTigeNoteBlockProps;
  return (
    <div className="mt-2 border border-sky-300 rounded bg-sky-50/40 mb-3 overflow-hidden">
      <table className="w-full text-[12px] border-collapse">
        <thead className="bg-sky-100/70 font-bold border-b border-sky-300">
          <tr>
            <th colSpan={2} className="py-1.5 px-2 text-center text-sky-900 text-[12.5px] uppercase tracking-wide align-middle leading-snug">
              {p.title || 'Ghi chú: Tổng nồng độ IgE (TIgE)'}
            </th>
          </tr>
          <tr className="border-t border-sky-200">
            <th className="py-1 px-2 text-center border-r border-sky-300 w-1/2 align-middle leading-snug">GIÁ TRỊ BÌNH THƯỜNG (IU/ml)</th>
            <th className="py-1 px-2 text-center w-1/2 align-middle leading-snug">DIỄN GIẢI</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1.5 px-2 text-center font-mono font-bold text-red-600 border-r border-sky-300 text-[13px] align-middle leading-snug">
              {p.normalRange || '<15,0'}
            </td>
            <td className="py-1.5 px-2 text-center font-semibold text-slate-700 text-[12.5px] align-middle leading-snug">
              {p.interpretation || 'Mức bình thường — Không tính Độ (+), chỉ có Kết Quả (IU/ml)'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});

export const DynamicReportAllergenDetailTableBlock = memo(function DynamicReportAllergenDetailTableBlock({
  block,
  allergenDTO,
  allergenTableChunkEntries,
  allergenChunkInfo
}: {
  block: TemplateBlock;
  allergenDTO: AllergenReportDTO | null;
  allergenTableChunkEntries?: AllergenReportItemDTO[];
  allergenChunkInfo?: { pageIdx: number; totalDetailPages: number; totalCount: number };
}) {
  const p = block.props as AllergenDetailTableBlockProps;
  const allItems = allergenTableChunkEntries || allergenDTO?.detailPages.flat() || [];
  const cols = p.columns || {
    tt: true,
    code: true,
    name: true,
    allergenName: true,
    route: true,
    normalRef: true,
    result: true,
    grade: true,
    note: true
  };

  const titleText = allergenChunkInfo && allergenChunkInfo.totalDetailPages > 1
    ? `CHI TIẾT KẾT QUẢ XÉT NGHIỆM ${allergenChunkInfo.totalCount} DỊ NGUYÊN (PHẦN ${allergenChunkInfo.pageIdx + 1})`
    : (p.title || `CHI TIẾT KẾT QUẢ XÉT NGHIỆM ${allergenDTO?.totalCount || allItems.length} DỊ NGUYÊN`);

  return (
    <div className="mb-3">
      <div className="text-center mb-2.5">
        <h2 className="text-[17px] font-black text-slate-900 uppercase tracking-wide">
          {titleText}
        </h2>
      </div>
      <div className="border border-slate-300 rounded bg-white overflow-hidden">
        <table className="w-full text-[11.5px] border-collapse">
          <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-300">
            <tr>
              {cols.tt && <th className="py-2 px-1 w-7 text-center border-r border-slate-300 align-middle leading-snug">TT</th>}
              {cols.code && <th className="py-2 px-1 w-12 text-center border-r border-slate-300 align-middle leading-snug">CODE</th>}
              {cols.name && <th className="py-2 px-2 text-left border-r border-slate-300 align-middle leading-snug">TÊN CHỈ SỐ</th>}
              {cols.allergenName && <th className="py-2 px-2 text-left border-r border-slate-300 align-middle leading-snug">TÊN DỊ NGUYÊN</th>}
              {cols.route && <th className="py-2 px-2 w-28 text-left border-r border-slate-300 align-middle leading-snug">Đường dị ứng</th>}
              {cols.normalRef && <th className="py-2 px-1.5 w-20 text-center border-r border-slate-300 leading-tight align-middle">BÌNH THƯỜNG<br/>(IU/ml)</th>}
              {cols.result && <th className="py-2 px-1.5 w-20 text-center border-r border-slate-300 leading-tight align-middle">KẾT QUẢ<br/>(IU/ml)</th>}
              {cols.grade && <th className="py-2 px-1 w-10 text-center border-r border-slate-300 leading-tight align-middle">ĐỘ<br/>(+)</th>}
              {cols.note && <th className="py-2 px-2 text-left align-middle leading-snug">GHI CHÚ</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {allItems.map((item, idx) => {
              const gradeStyle = getAllergenGradeClasses(item.grade, item.isTIgE, item.isPositive);
              const resultTextColor = item.isPositive ? `${gradeStyle.textColor} font-bold` : 'text-slate-800';

              return (
                <tr key={item.code || idx} className={`hover:bg-slate-50 ${gradeStyle.rowBg}`}>
                  {cols.tt && <td className="py-1.5 px-1 text-center font-mono text-slate-500 border-r border-slate-300 align-middle leading-snug">{item.tt}</td>}
                  {cols.code && <td className="py-1.5 px-1 text-center font-mono font-bold text-sky-800 border-r border-slate-300 text-[12px] align-middle leading-snug">{item.code}</td>}
                  {cols.name && <td className={`py-1.5 px-2 font-semibold ${item.isPositive ? gradeStyle.nameColor : 'text-slate-900'} border-r border-slate-300 text-[12px] align-middle leading-snug`}>{item.name}</td>}
                  {cols.allergenName && <td className="py-1.5 px-2 italic text-slate-600 border-r border-slate-300 text-[12px] align-middle leading-snug">{item.allergenName}</td>}
                  {cols.route && <td className="py-1.5 px-2 text-slate-600 border-r border-slate-300 text-[11px] align-middle leading-snug">{item.route}</td>}
                  {cols.normalRef && <td className="py-1.5 px-1.5 text-center font-mono text-slate-600 border-r border-slate-300 text-[11.5px] align-middle leading-snug">{item.normalRef}</td>}
                  {cols.result && (
                    <td className={`py-1.5 px-1.5 text-center font-mono border-r border-slate-300 text-[12.5px] align-middle leading-snug ${resultTextColor}`}>
                      {item.result}
                    </td>
                  )}
                  {cols.grade && (
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
                  )}
                  {cols.note && (
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
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export const DynamicReportAllergenPreventionGuideBlock = memo(function DynamicReportAllergenPreventionGuideBlock({
  block
}: {
  block: TemplateBlock;
}) {
  const p = block.props as AllergenPreventionGuideBlockProps;
  return (
    <div className="mb-4 bg-white p-2">
      <div className="text-center mb-4 pt-1">
        <h2 className="text-[20px] font-black text-red-700 uppercase tracking-wide">
          {p.title || 'MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG'}
        </h2>
      </div>
      <div className="text-[13.5px] text-slate-800 leading-relaxed space-y-3 text-justify">
        <p>
          <strong>1.</strong> Tìm nguyên nhân gây dị ứng hoặc dị ứng chéo bằng các xét nghiệm tìm dị nguyên. Nhiều trường hợp xét nghiệm dị nguyên vẫn không tìm ra nguyên nhân là do có nhiều dị nguyên hiện chưa được đưa vào xét nghiệm.
        </p>
        <p>
          <strong>2.</strong> Khi xét nghiệm không tìm thấy nguyên nhân dị ứng thì cần tiến hành cô lập từng yếu tố theo đường ăn uống (thực phẩm, đồ uống...), đường thở và tiếp xúc với môi trường (phấn hoa thường liên quan đến mùa, bụi, mạt, nấm, vi khuẩn... ở nhà, nơi công tác hay nơi di chuyển) để tìm nguyên nhân.
        </p>
        <div>
          <p>
            <strong>3.</strong> Mức độ dị ứng tỷ thuận với số lần tiếp xúc với nguồn gây dị ứng, nhiều dị nguyên ngoài việc kích thích cơ thể gây dị ứng còn gây ra tình trạng phản ứng chéo với các loại khác làm tình trạng dị ứng thêm trầm trọng. Vì vậy, cần hạn chế tiếp xúc với nguồn có chứa hoặc nghi có chứa chất gây dị ứng bằng các biện pháp sau:
          </p>
          <div className="pl-4 pt-1.5 space-y-1 text-[13px] text-slate-700">
            <p><strong>a.</strong> Mặc áo kín, đeo khẩu trang, kính để tránh da tiếp xúc với các bụi và phấn hoa... khi làm vệ sinh trong nhà hay đi ngoài đường;</p>
            <p><strong>b.</strong> Không ăn các thức ăn, đồ uống đã từng hoặc nghi gây dị ứng đặc biệt là các thực phẩm có khả năng gây dị ứng cao như: động vật biển (tôm, cua...);</p>
            <p><strong>c.</strong> Thường xuyên vệ sinh cá nhân, giặt quần áo để hạn chế nguồn gây dị ứng tiếp xúc với các bộ phận của cơ thể;</p>
            <p><strong>d.</strong> Hạn chế vật nuôi trong nhà đối với những người có cơ địa dị ứng vì đó là nguồn dị ứng trực tiếp hoặc gây ra dị ứng chéo với các dị nguyên khác;</p>
            <p><strong>e.</strong> Thường xuyên vệ sinh cá nhân, nhà, nền nhà, các đồ vật trong nhà để chống bụi và loại bỏ các vi sinh vật tồn tại, phát triển. Nên sử dụng máy hút bụi thay cho việc quét hoặc lau nhà để hạn chế tiếp xúc với nguồn bụi;</p>
            <p><strong>f.</strong> Đóng cửa và hạn chế đi ra ngoài nếu ở vùng sinh sống có loài hoa, cỏ hoặc thực vật là nguồn gây dị ứng đặc biệt là mùa hoa nở các phấn hoa phát tán mạnh trong không khí;</p>
            <p><strong>g.</strong> Lựa chọn quần áo rộng và các chất liệu phù hợp vì vải và các thuốc nhuộm vải cũng là nguồn gây dị ứng;</p>
            <p><strong>h.</strong> Không phơi quần áo ngoài trời vì có khả năng phấn hoa có thể bám vào quần áo;</p>
            <p><strong>i.</strong> Cần thông báo và tư vấn bác sỹ trước khi dùng thuốc đối với những người có biểu hiện dị ứng.</p>
            <p><strong>j.</strong> Nếu tất cả các biện pháp trên không hiệu quả cần đi khám bác sỹ để được tư vấn.</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export const DynamicReportAllergenCoverSummaryBlock = memo(function DynamicReportAllergenCoverSummaryBlock({
  block,
  testPackages,
  allergenTests,
  allergenDTO
}: {
  block: TemplateBlock;
  testPackages?: TestPackage[];
  allergenTests: SelectedTest[];
  allergenDTO: AllergenReportDTO | null;
}) {
  const p = block.props as AllergenCoverSummaryBlockProps;
  const matchedPackage = testPackages?.find((pkg) => pkg.items?.some((i) => allergenTests.some((at) => at.code === i.code)));
  return (
    <div className="border-2 border-purple-300 rounded mb-3 bg-purple-50/40 p-3">
      <h3 className="text-[13px] font-bold text-purple-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
        <span>🔬</span>
        <span>{p.boxTitle || 'TỔNG QUAN GÓI TẦM SOÁT DỊ NGUYÊN'}</span>
      </h3>
      <div className="flex items-center justify-between text-[12px] text-slate-800">
        {p.showPackageName !== false && (
          <div>
            <span className="text-slate-500 font-medium">Tên gói: </span>
            <strong className="text-purple-900 font-bold">{matchedPackage?.name || 'Gói Dị Nguyên Chuyên Sâu'}</strong>
          </div>
        )}
        {p.showItemCount !== false && (
          <div>
            <span className="text-slate-500 font-medium">Số lượng dị nguyên: </span>
            <strong className="text-purple-900 font-mono font-bold">{allergenDTO?.totalCount || allergenTests.length} dị nguyên</strong>
          </div>
        )}
        {p.showPackagePrice !== false && matchedPackage?.price && (
          <div>
            <span className="text-slate-500 font-medium">Giá gói: </span>
            <strong className="text-emerald-700 font-mono font-bold">{matchedPackage.price.toLocaleString('vi-VN')} đ</strong>
          </div>
        )}
      </div>
    </div>
  );
});
