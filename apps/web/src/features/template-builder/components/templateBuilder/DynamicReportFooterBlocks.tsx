import { memo } from 'react';
import {
  TemplateBlock,
  Patient,
  ClinicInfo,
  ConclusionBlockProps,
  SignatureBlockProps,
  CustomTextBlockProps,
  DividerBlockProps,
  SpacerBlockProps,
  PageBreakBlockProps
} from '@domain';

export const DynamicReportConclusionBlock = memo(function DynamicReportConclusionBlock({
  block,
  conclusion
}: {
  block: TemplateBlock;
  conclusion?: string;
}) {
  const p = block.props as ConclusionBlockProps;
  if (!conclusion || conclusion.trim() === '') return null;
  const bgClass = p.bgColor === 'slate' ? 'bg-slate-50' : p.bgColor === 'amber' ? 'bg-amber-50' : p.bgColor === 'white' ? 'bg-white' : '';

  return (
    <div className={`border border-slate-300 rounded p-2 mb-3 ${bgClass} text-[12px]`}>
      <span className="font-bold text-slate-800">{p.title || 'KẾT LUẬN & LỜI DẶN:'} </span>
      <span className="text-slate-800 leading-snug">{conclusion}</span>
    </div>
  );
});

export const DynamicReportSignatureBlock = memo(function DynamicReportSignatureBlock({
  block,
  patient,
  clinicInfo,
  doctorName,
  currentStamp
}: {
  block: TemplateBlock;
  patient: Patient;
  clinicInfo?: ClinicInfo;
  doctorName?: string;
  currentStamp: string;
}) {
  const p = block.props as SignatureBlockProps;

  return (
    <div className={`flex ${p.align === 'between' ? 'justify-between' : 'justify-end'} pt-1`}>
      {p.align === 'between' && (
        <div className="text-center min-w-[180px]">
          {p.showDate && <p className="text-[12px] text-slate-700 italic">Ngày {new Date().toLocaleDateString('vi-VN')}</p>}
          <p className="text-[13px] font-bold uppercase text-slate-900 my-0.5">NGƯỜI LÀM XÉT NGHIỆM</p>
          <div className="h-20" />
          <p className="text-[13px] font-semibold text-slate-800">KTV. Xét Nghiệm</p>
        </div>
      )}
      <div className="text-center min-w-[220px]">
        {p.showDate && <p className="text-[12px] text-slate-700 italic">Ngày {new Date().toLocaleDateString('vi-VN')}</p>}
        <p className="text-[13px] font-bold uppercase text-slate-900 tracking-wide my-0.5">
          {p.title || 'PHỤ TRÁCH CHUYÊN MÔN'}
        </p>
        {p.showStamp !== false ? (
          <div className="h-[68px] flex items-center justify-center my-0.5">
            <img src={currentStamp} alt="Con Dấu & Chữ Ký" className="h-[68px] w-auto object-contain max-w-[120px]" />
          </div>
        ) : (
          <div className="h-16" />
        )}
        {p.showDoctorName !== false && (
          <p className="text-[13.5px] font-bold text-slate-900 uppercase">
            {p.title?.toUpperCase().includes('CHỈ ĐỊNH')
              ? (patient.doctor || doctorName || 'BS. Trần Hoài Long')
              : (clinicInfo?.defaultDoctor || 'Nguyễn Thị Thành Trung')}
          </p>
        )}
      </div>
    </div>
  );
});

export const DynamicReportCustomTextBlock = memo(function DynamicReportCustomTextBlock({
  block
}: {
  block: TemplateBlock;
}) {
  const p = block.props as CustomTextBlockProps;
  const alignClass = p.align === 'center' ? 'text-center' : p.align === 'right' ? 'text-right' : 'text-left';
  return (
    <div
      className={`${alignClass} my-2 text-[12px] ${p.fontStyle === 'italic' ? 'italic' : p.fontStyle === 'bold' ? 'font-bold' : ''}`}
      style={{ color: p.textColor || '#475569' }}
    >
      {p.content}
    </div>
  );
});

export const DynamicReportDividerBlock = memo(function DynamicReportDividerBlock({
  block
}: {
  block: TemplateBlock;
}) {
  const p = block.props as DividerBlockProps;
  return (
    <hr
      style={{
        borderTopWidth: `${p.thickness || 1}px`,
        borderTopStyle: p.style || 'solid',
        borderTopColor: p.color || '#cbd5e1',
        marginTop: `${p.marginVertical || 8}px`,
        marginBottom: `${p.marginVertical || 8}px`
      }}
    />
  );
});

export const DynamicReportSpacerBlock = memo(function DynamicReportSpacerBlock({
  block
}: {
  block: TemplateBlock;
}) {
  const p = block.props as SpacerBlockProps;
  return <div style={{ height: `${p.height || 16}px` }} />;
});

export const DynamicReportPageBreakBlock = memo(function DynamicReportPageBreakBlock({
  block
}: {
  block: TemplateBlock;
}) {
  const p = block.props as PageBreakBlockProps;
  return (
    <div className="my-4 py-2 border-y-2 border-dashed border-sky-400 bg-sky-50/60 rounded text-center text-xs font-bold text-sky-800 flex items-center justify-center gap-2 print:hidden select-none">
      <span>📄</span>
      <span>{p.label || 'Ngắt Trang In A4 (Page Break)'}</span>
    </div>
  );
});
