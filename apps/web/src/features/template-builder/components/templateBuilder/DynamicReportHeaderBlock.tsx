import { memo } from 'react';
import {
  TemplateBlock,
  ClinicInfo,
  HeaderBlockProps,
  TitleBlockProps,
  getSafeClinicInfo
} from '@domain';

interface DynamicReportHeaderBlockProps {
  block: TemplateBlock;
  clinicInfo?: ClinicInfo;
  currentLogo: string;
  finalQrCode: string;
}

export const DynamicReportHeaderBlock = memo(function DynamicReportHeaderBlock({
  block,
  clinicInfo,
  currentLogo,
  finalQrCode
}: DynamicReportHeaderBlockProps) {
  const safeClinic = getSafeClinicInfo(clinicInfo);
  const p = block.props as HeaderBlockProps;

  return (
    <div
      className={`relative flex items-center justify-between overflow-hidden ${p.borderBottom !== false ? 'border-b-2 border-sky-400 pb-2 mb-2' : 'pb-1.5 mb-1.5'}`}
    >
      {/* Họa tiết lượn sóng trang trí (hạ thấp sát đáy, độ mờ nhẹ nhàng không che chữ) */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <svg viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full absolute bottom-0 left-0" preserveAspectRatio="none">
          <path d="M0,106 C160,115 260,100 420,108 C560,115 680,102 800,107 L800,120 L0,120 Z" fill="#f0f9ff" opacity="0.45" />
          <path d="M0,112 C140,117 240,107 390,114 C540,118 670,109 800,113 L800,120 L0,120 Z" fill="#e0f2fe" opacity="0.3" />
        </svg>
      </div>

      {p.showLogo !== false && (
        <div className="flex flex-col items-center justify-center w-[125px] shrink-0 z-1 relative">
          <div className="h-[60px] w-[120px] flex items-center justify-center shrink-0">
            <img src={currentLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
          </div>
          <span className="text-[10.5px] font-semibold text-sky-600 italic tracking-tight text-center mt-0.5 whitespace-nowrap">
            Vì sức khỏe người Việt
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-2 z-1 relative">
        <div className="flex items-center justify-center gap-2 w-full mb-0.5">
          <div className="h-[1px] w-8 bg-slate-400" />
          <div
            style={{
              backgroundColor: '#e0f2fe',
              padding: '5px 18px 6px 18px',
              borderRadius: '9999px',
              textAlign: 'center',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box'
            }}
            className="bg-sky-100/80 px-4.5 py-1.5 rounded-full text-center inline-flex flex-col items-center justify-center shadow-2xs"
          >
            <span
              style={{ fontSize: '10.5px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.25, display: 'block' }}
              className="text-[10.5px] font-extrabold text-sky-800 uppercase tracking-wider leading-tight block"
            >
              HỆ THỐNG XÉT NGHIỆM GOLAB
            </span>
            <span
              style={{ fontSize: '9.5px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.25, display: 'block' }}
              className="text-[9.5px] font-bold text-sky-800 uppercase tracking-wide leading-tight block"
            >
              69 CHI NHÁNH TRÊN TOÀN QUỐC
            </span>
          </div>
          <div className="h-[1px] w-8 bg-slate-400" />
        </div>

        {p.showClinicName !== false && (
          <h1 className={`font-serif ${p.clinicNameSize === 'lg' ? 'text-[18px]' : p.clinicNameSize === 'sm' ? 'text-[14px]' : 'text-[16.5px]'} font-black text-sky-950 uppercase tracking-tight text-center mt-0.5 mb-0.5 leading-tight`}>
            {safeClinic.name}
          </h1>
        )}

        {p.showAddress !== false && (
          <>
            <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-slate-800">
              <svg className="w-3 h-3 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>
                <strong className="font-bold text-slate-900">Chi nhánh/điểm tiếp nhận:</strong> {safeClinic.address}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-700 mt-0.5">
              <svg className="w-3 h-3 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
              </svg>
              <span>
                <strong className="font-bold text-slate-900">Trụ sở chính hệ thống:</strong> {safeClinic.headquartersAddress || 'Số 36 BT5, Khu đô thị Pháp Vân, phường Hoàng Liệt, thành phố Hà Nội'}
              </span>
            </div>
          </>
        )}

        {p.showContact !== false && (
          <div className="flex items-center justify-center gap-2 text-[10.5px] text-slate-700 mt-0.5">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Website: <strong className="font-bold text-sky-900">{safeClinic.website}</strong></span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-sky-900 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span>Hotline: <strong className="font-bold text-sky-900">{safeClinic.phone}</strong></span>
            </div>
          </div>
        )}
      </div>

      {p.showQr !== false && (
        <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded-md shadow-2xs shrink-0 min-w-[64px] z-1 relative">
          {finalQrCode ? (
            <img src={finalQrCode} alt="QR Code" className="w-12 h-12 object-contain" />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-[9px] text-slate-400 font-mono">
              QR
            </div>
          )}
          <span className="text-[9px] font-extrabold text-sky-800 mt-0.5 tracking-tight leading-none whitespace-nowrap">QR Tra Cứu</span>
          <span className="text-[7.5px] text-slate-500 mt-0.5 leading-none whitespace-nowrap">kết quả xét nghiệm</span>
        </div>
      )}
    </div>
  );
});

interface DynamicReportTitleBlockProps {
  block: TemplateBlock;
}

export const DynamicReportTitleBlock = memo(function DynamicReportTitleBlock({
  block
}: DynamicReportTitleBlockProps) {
  const p = block.props as TitleBlockProps;
  const alignClass = p.align === 'left' ? 'text-left' : p.align === 'right' ? 'text-right' : 'text-center';
  const sizeClass = p.fontSize === 'xl' ? 'text-[22px]' : p.fontSize === 'lg' ? 'text-[18px]' : p.fontSize === 'sm' ? 'text-[14px]' : 'text-[16px]';

  return (
    <div className={`${alignClass} my-3`}>
      <h2 className={`${sizeClass} font-black text-slate-900 ${p.uppercase !== false ? 'uppercase' : ''} tracking-wide`} style={{ color: p.textColor || undefined }}>
        {p.text || 'PHIẾU KẾT QUẢ XÉT NGHIỆM'}
      </h2>
      {p.subtitle && (
        <p className="text-[12px] font-semibold text-slate-600 mt-0.5">
          {p.subtitle}
        </p>
      )}
    </div>
  );
});
