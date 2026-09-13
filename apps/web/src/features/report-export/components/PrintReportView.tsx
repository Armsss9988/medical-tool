import { useState, useEffect, useMemo, memo } from 'react';
import { evaluateResult } from '@domain/testResult';
import { generateQrCodeDataUrl, buildPortalUrl } from '@infra/qrService';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import {
  Patient,
  SelectedTest,
  ClinicInfo,
  TestEquipment,
  CatalogItemEquipmentLink,
  TestPackage,
  resolveTestEquipmentName,
  formatEquipmentForPrint,
  formatDisplayDate,
  DEFAULT_CLINIC_INFO,
  getSafeClinicInfo,
  ReportPaginationDomainService
} from '@domain';
import { sortTestsByPackageOrder } from '@domain/services/packageOrderResolver';

interface PrintReportViewProps {
  elementId?: string;
  patient: Patient;
  selectedTests?: SelectedTest[];
  currentDateStr?: string;
  doctorName?: string;
  conclusion?: string;
  qrCodeDataUrl?: string;
  qrCodeUrl?: string;
  clinicInfo?: ClinicInfo;
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  testPackages?: TestPackage[];
}

function PrintReportView({
  elementId = 'printable-medical-report',
  patient: rawPatient,
  selectedTests = [],
  currentDateStr = new Date().toLocaleDateString('vi-VN'),
  doctorName,
  conclusion,
  qrCodeDataUrl,
  qrCodeUrl,
  clinicInfo = DEFAULT_CLINIC_INFO,
  equipments = [],
  catalogItemEquipments = [],
  testPackages = []
}: PrintReportViewProps) {
  const safeClinic = getSafeClinicInfo(clinicInfo);
  const patient: Patient = rawPatient || {
    code: 'BN-GOLAB',
    secretToken: '',
    name: 'Bệnh nhân mới',
    dob: '',
    gender: 'Nam',
    phone: '',
    address: '',
    diagnosis: '',
    sampleCode: 'BN-GOLAB',
    sampleStatus: 'Đạt',
    orderedAt: '',
    paidAt: undefined,
    receivedAt: '',
    returnedAt: ''
  };
  const [autoQrCode, setAutoQrCode] = useState<string>(qrCodeDataUrl || '');

  // 1. Sắp xếp các chỉ số theo chuẩn chuyên khoa và order_index từ bảng package_items
  const sortedTests = useMemo(() => {
    return sortTestsByPackageOrder(selectedTests || [], testPackages);
  }, [selectedTests, testPackages]);

  useEffect(() => {
    if (qrCodeDataUrl) {
      setAutoQrCode(qrCodeDataUrl);
      return;
    }
    if (qrCodeUrl) {
      generateQrCodeDataUrl(qrCodeUrl).then((res) => {
        if (res) setAutoQrCode(res);
      });
      return;
    }
    // Tự động tạo mã QR tra cứu trực tuyến thời gian thực trỏ về Cổng Portal của phiếu này
    const code = patient.code || `BN-${Date.now()}`;
    const portalUrl = buildPortalUrl(code, safeClinic.website);

    generateQrCodeDataUrl(portalUrl).then((res) => {
      if (res) setAutoQrCode(res);
    });
  }, [qrCodeDataUrl, qrCodeUrl, patient.code, safeClinic.website]);

  const finalQrCode = qrCodeDataUrl || autoQrCode;

  const currentLogo =
    safeClinic.logoUrl &&
    typeof safeClinic.logoUrl === 'string' &&
    safeClinic.logoUrl.trim() !== '' &&
    safeClinic.logoUrl !== 'null' &&
    safeClinic.logoUrl !== 'undefined'
      ? safeClinic.logoUrl
      : golabLogo;

  const currentStamp =
    safeClinic.stampUrl &&
    typeof safeClinic.stampUrl === 'string' &&
    safeClinic.stampUrl.trim() !== '' &&
    safeClinic.stampUrl !== 'null' &&
    safeClinic.stampUrl !== 'undefined'
      ? safeClinic.stampUrl
      : doctorStamp;

  // Phân trang tự động chuẩn y khoa A4 thông qua Pure Domain Service
  const pages = useMemo(() => {
    return ReportPaginationDomainService.paginate(sortedTests, conclusion);
  }, [sortedTests, conclusion]);

  const totalPages = pages.length;

  return (
    <div id={elementId} className="flex flex-col gap-6 print:gap-0 font-serif">
      {pages.map((page, pIdx) => (
        <div
          key={pIdx}
          data-page="true"
          className="report-page bg-white text-slate-900 mx-auto text-[13px] leading-normal flex flex-col justify-between shadow-lg print:shadow-none"
          style={{
            fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
            width: '210mm',
            minWidth: '210mm',
            maxWidth: '210mm',
            minHeight: '297mm',
            padding: '10mm 14mm 10mm 14mm',
            boxSizing: 'border-box',
            pageBreakAfter: pIdx < totalPages - 1 ? 'always' : 'auto',
            breakAfter: pIdx < totalPages - 1 ? 'page' : 'auto'
          }}
        >
          {/* KHUNG NỘI DUNG CHÍNH TRÊN TRANG */}
          <div className="flex-1 flex flex-col justify-start">
            
            {/* 1. HEADER TRANG (TRANG 1: HEADER ĐẦY ĐỦ | TRANG 2+: MINI HEADER) */}
            {page.isFirstPage ? (
              <div
                data-avoid-break="true"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '2px solid #38bdf8',
                  paddingBottom: '8px',
                  marginBottom: '6px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                className="header-section relative flex items-center justify-between border-b-2 border-sky-400 pb-2 mb-1.5 overflow-hidden"
              >
                {/* Họa tiết lượn sóng trang trí nền header (hạ thấp sát đáy, độ mờ nhẹ nhàng không che chữ) */}
                <div
                  style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}
                  className="absolute inset-0 pointer-events-none -z-10 overflow-hidden"
                >
                  <svg
                    viewBox="0 0 800 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ width: '100%', height: '100%', position: 'absolute', bottom: 0, left: 0 }}
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,106 C160,115 260,100 420,108 C560,115 680,102 800,107 L800,120 L0,120 Z"
                      fill="#f0f9ff"
                      opacity="0.45"
                    />
                    <path
                      d="M0,112 C140,117 240,107 390,114 C540,118 670,109 800,113 L800,120 L0,120 Z"
                      fill="#e0f2fe"
                      opacity="0.3"
                    />
                  </svg>
                </div>

                {/* Cột trái: Logo GoLab + Slogan "Vì sức khỏe người Việt" */}
                <div
                  style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '130px', flexShrink: 0, zIndex: 1 }}
                  className="flex flex-col items-center justify-center w-[130px] shrink-0 z-1 relative"
                >
                  <div className="h-[62px] w-[125px] max-h-[62px] max-w-[125px] flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={currentLogo}
                      alt="GoLab Logo"
                      style={{ maxHeight: '62px', maxWidth: '125px', height: 'auto', width: 'auto', objectFit: 'contain' }}
                      className="max-h-[62px] max-w-[125px] h-auto w-auto object-contain object-center shrink-0"
                      loading="eager"
                      decoding="sync"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.onerror = null;
                        target.src = golabLogo;
                      }}
                    />
                  </div>
                  <span
                    style={{ fontSize: '11px', color: '#0284c7', fontStyle: 'italic', fontWeight: 600, textAlign: 'center', marginTop: '2px', lineHeight: 1.1, whiteSpace: 'nowrap' }}
                    className="text-[11px] font-semibold text-sky-600 italic tracking-tight text-center mt-0.5 whitespace-nowrap"
                  >
                    Vì sức khỏe người Việt
                  </span>
                </div>

                {/* Cột giữa: Badge hệ thống, Tên chi nhánh, Địa chỉ, Trụ sở chính & Liên hệ */}
                <div
                  style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, paddingLeft: '8px', paddingRight: '8px', zIndex: 1 }}
                  className="flex-1 flex flex-col items-center justify-center px-2 z-1 relative"
                >
                  {/* Badge: HỆ THỐNG XÉT NGHIỆM GOLAB - 69 CHI NHÁNH TRÊN TOÀN QUỐC */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginBottom: '2px' }}
                    className="flex items-center justify-center gap-2 w-full mb-0.5"
                  >
                    <div style={{ height: '1px', width: '36px', backgroundColor: '#94a3b8' }} className="h-[1px] w-9 bg-slate-400" />
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
                        style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.25, display: 'block' }}
                        className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider leading-tight block"
                      >
                        HỆ THỐNG XÉT NGHIỆM GOLAB
                      </span>
                      <span
                        style={{ fontSize: '10px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.25, display: 'block' }}
                        className="text-[10px] font-bold text-sky-800 uppercase tracking-wide leading-tight block"
                      >
                        69 CHI NHÁNH TRÊN TOÀN QUỐC
                      </span>
                    </div>
                    <div style={{ height: '1px', width: '36px', backgroundColor: '#94a3b8' }} className="h-[1px] w-9 bg-slate-400" />
                  </div>

                  {/* Tên cơ sở phòng khám (Serif, Đậm, Xanh đen) */}
                  <h1
                    style={{
                      fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
                      fontSize: '17.5px',
                      fontWeight: 900,
                      color: '#082f49',
                      textTransform: 'uppercase',
                      letterSpacing: '-0.01em',
                      lineHeight: '1.2',
                      textAlign: 'center',
                      marginTop: '2px',
                      marginBottom: '3px'
                    }}
                    className="font-serif text-[17.5px] font-black text-sky-950 uppercase tracking-tight text-center mt-0.5 mb-1 leading-tight"
                  >
                    {safeClinic.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
                  </h1>

                  {/* Chi nhánh / Điểm tiếp nhận */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', color: '#1e293b', lineHeight: 1.3 }}
                    className="flex items-center justify-center gap-1.5 text-[11px] text-slate-800"
                  >
                    <svg style={{ width: '13px', height: '13px', color: '#0284c7', flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>
                      <strong style={{ fontWeight: 700, color: '#0f172a' }}>Chi nhánh/điểm tiếp nhận:</strong>{' '}
                      {safeClinic.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}
                    </span>
                  </div>

                  {/* Trụ sở chính hệ thống */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '10.5px', color: '#334155', lineHeight: 1.3, marginTop: '1px' }}
                    className="flex items-center justify-center gap-1.5 text-[10.5px] text-slate-700 mt-0.5"
                  >
                    <svg style={{ width: '13px', height: '13px', color: '#0284c7', flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                    </svg>
                    <span style={{ textAlign: 'center' }}>
                      <strong style={{ fontWeight: 700, color: '#0f172a' }}>Trụ sở chính hệ thống:</strong>{' '}
                      {safeClinic.headquartersAddress || 'Số 36 BT5, Khu đô thị Pháp Vân, phường Hoàng Liệt, thành phố Hà Nội'}
                    </span>
                  </div>

                  {/* Website & Hotline */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '11px', color: '#334155', lineHeight: 1.3, marginTop: '1px' }}
                    className="flex items-center justify-center gap-2.5 text-[11px] text-slate-700 mt-0.5"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="flex items-center gap-1">
                      <svg style={{ width: '12px', height: '12px', color: '#0284c7', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      <span>
                        Website: <strong style={{ fontWeight: 700, color: '#0369a1' }}>{safeClinic.website || 'golab.com.vn'}</strong>
                      </span>
                    </div>
                    <span style={{ color: '#94a3b8' }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="flex items-center gap-1">
                      <svg style={{ width: '12px', height: '12px', color: '#0c4a6e', flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
                      <span>
                        Hotline: <strong style={{ fontWeight: 700, color: '#0c4a6e' }}>{safeClinic.phone || '032.855.3773'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Khung QR Code Tra Cứu */}
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    minWidth: '68px',
                    flexShrink: 0,
                    zIndex: 1
                  }}
                  className="flex flex-col items-center justify-center p-1 px-1.5 bg-white border border-slate-300 rounded-md shadow-2xs shrink-0 min-w-[68px] z-1 relative"
                >
                  {finalQrCode ? (
                    <img
                      src={finalQrCode}
                      alt="QR Code Tra Cứu"
                      data-qr="true"
                      style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                      className="w-[50px] h-[50px] object-contain shrink-0"
                      loading="eager"
                      decoding="sync"
                    />
                  ) : (
                    <div className="w-[50px] h-[50px] flex items-center justify-center bg-slate-50 text-[10px] text-slate-400 font-mono">
                      QR
                    </div>
                  )}
                  <span
                    style={{ fontSize: '9.5px', fontWeight: 800, color: '#0369a1', marginTop: '3px', letterSpacing: '-0.02em', lineHeight: 1.1, whiteSpace: 'nowrap' }}
                    className="text-[9.5px] font-extrabold text-sky-800 mt-0.5 tracking-tight leading-none whitespace-nowrap"
                  >
                    QR Tra Cứu
                  </span>
                  <span
                    style={{ fontSize: '8px', color: '#64748b', marginTop: '1px', lineHeight: 1, whiteSpace: 'nowrap' }}
                    className="text-[8px] text-slate-500 mt-0.5 leading-none whitespace-nowrap"
                  >
                    kết quả xét nghiệm
                  </span>
                </div>
              </div>
            ) : (
              <div
                data-avoid-break="true"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '4px' }}
                className="header-mini flex items-center justify-between border-b border-slate-300 pb-1 mb-1 text-[11px] text-slate-600 font-mono"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="flex items-center space-x-2">
                  <span className="font-bold text-sky-900 uppercase">GOLAB CLINICAL LAB</span>
                  <span>•</span>
                  <span>{patient.name}</span>
                  <span>•</span>
                  <span>{patient.gender}</span>
                  <span>•</span>
                  <span>{patient.dob}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="flex items-center space-x-2 font-mono">
                  <span>Mẫu: <strong className="text-red-600">{patient.sampleCode || patient.code}</strong></span>
                  <span>•</span>
                  <span>{currentDateStr}</span>
                </div>
              </div>
            )}

            {/* 2. TIÊU ĐỀ PHIẾU (CHỈ HIỆN Ở TRANG 1) */}
            {page.isFirstPage && (
              <div data-avoid-break="true" className="text-center my-1">
                <h2 className="text-[20px] font-black text-sky-950 uppercase tracking-wide">
                  PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM
                </h2>
              </div>
            )}

            {/* 3. BẢNG THÔNG TIN BỆNH NHÂN CHUẨN 12 TRƯỜNG (CHỈ HIỆN Ở TRANG 1) */}
            {page.isFirstPage && (
              <div
                data-avoid-break="true"
                style={{ border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '6px', backgroundColor: '#ffffff' }}
                className="patient-table-section border border-slate-300 rounded mb-1.5 bg-white"
              >
                <table
                  style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}
                  className="w-full table-fixed text-[13px] border-collapse"
                >
                  <colgroup>
                    <col style={{ width: '15%' }} className="w-[15%]" />
                    <col style={{ width: '35%' }} className="w-[35%]" />
                    <col style={{ width: '18%' }} className="w-[18%]" />
                    <col style={{ width: '32%' }} className="w-[32%]" />
                  </colgroup>
                  <tbody>
                    {/* Hàng 1 */}
                    <tr>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Họ và tên:</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-bold text-red-600 uppercase border-r border-b border-slate-300 align-middle truncate text-[13.5px] leading-snug">{patient.name || '---'}</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Năm sinh:</td>
                      <td style={{ borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-medium text-slate-800 border-b border-slate-300 align-middle truncate leading-snug">{patient.dob || '---'}</td>
                    </tr>
                    {/* Hàng 2 */}
                    <tr>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Giới tính:</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.gender || 'Nam'}</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Số điện thoại:</td>
                      <td style={{ borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-mono text-slate-800 border-b border-slate-300 align-middle leading-snug">{patient.phone || '---'}</td>
                    </tr>
                    {/* Hàng 3: Địa chỉ và Tình trạng mẫu */}
                    <tr>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Địa chỉ:</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 text-slate-800 border-r border-b border-slate-300 align-middle truncate leading-snug">{patient.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Tình trạng mẫu:</td>
                      <td style={{ borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-medium text-emerald-700 font-bold border-b border-slate-300 align-middle leading-snug">{patient.sampleStatus || 'Đạt'}</td>
                    </tr>
                    {/* Hàng 4 */}
                    <tr>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Bác sĩ chỉ định:</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-bold text-sky-950 border-r border-b border-slate-300 align-middle truncate leading-snug">{patient.doctor || doctorName || 'BS. Trần Hoài Long'}</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Số bệnh phẩm:</td>
                      <td style={{ borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-mono font-bold text-red-600 border-b border-slate-300 align-middle text-[13.5px] leading-snug">{patient.sampleCode || patient.code}</td>
                    </tr>
                    {/* Hàng 5 */}
                    <tr>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G chỉ định:</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-mono text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">{formatDisplayDate(patient.orderedAt, currentDateStr)}</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G đóng phí:</td>
                      <td style={{ borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-mono text-slate-700 border-b border-slate-300 align-middle leading-snug">{formatDisplayDate(patient.paidAt, 'Chưa thu phí')}</td>
                    </tr>
                    {/* Hàng 6 */}
                    <tr>
                      <td style={{ borderRight: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">T/G nhận mẫu:</td>
                      <td style={{ borderRight: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-mono text-slate-700 border-r border-slate-300 align-middle leading-snug">{formatDisplayDate(patient.receivedAt, currentDateStr)}</td>
                      <td style={{ borderRight: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">T/G trả kết quả:</td>
                      <td className="py-[5px] px-2.5 font-mono text-slate-700 align-middle leading-snug">{formatDisplayDate(patient.returnedAt, currentDateStr)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. BẢNG CHỈ SỐ XÉT NGHIỆM TRÊN TRANG HIỆN TẠI */}
            {page.entries.length !== 0 && (
              <div
                style={{ border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '6px', backgroundColor: '#ffffff', overflow: 'hidden' }}
                className="border border-slate-300 rounded mb-1.5 bg-white overflow-hidden"
              >
                <table
                  style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}
                  className="w-full table-fixed text-left text-[13px] border-collapse"
                >
                  <colgroup>
                    <col style={{ width: '5%' }} className="w-[5%]" />
                    <col style={{ width: '31%' }} className="w-[31%]" />
                    <col style={{ width: '13%' }} className="w-[13%]" />
                    <col style={{ width: '10%' }} className="w-[10%]" />
                    <col style={{ width: '17%' }} className="w-[17%]" />
                    <col style={{ width: '12%' }} className="w-[12%]" />
                    <col style={{ width: '12%' }} className="w-[12%]" />
                  </colgroup>
                  <thead
                    style={{ backgroundColor: '#f1f5f9', color: '#0f172a', borderBottom: '2px solid #cbd5e1' }}
                    className="bg-slate-100 text-slate-900 uppercase font-bold border-b-2 border-slate-300"
                  >
                    <tr>
                      <th style={{ borderRight: '1px solid #cbd5e1' }} className="py-1.5 px-1 text-center border-r border-slate-300 align-middle text-[11.5px] font-bold leading-tight">STT</th>
                      <th style={{ borderRight: '1px solid #cbd5e1' }} className="py-1.5 px-2.5 border-r border-slate-300 align-middle text-[11.5px] font-bold leading-tight">TÊN CHỈ SỐ XÉT NGHIỆM</th>
                      <th style={{ borderRight: '1px solid #cbd5e1' }} className="py-1.5 px-1 text-center border-r border-slate-300 align-middle text-[11.5px] font-bold leading-tight">KẾT QUẢ</th>
                      <th style={{ borderRight: '1px solid #cbd5e1' }} className="py-1.5 px-1 text-center border-r border-slate-300 align-middle text-[11.5px] font-bold leading-tight">ĐƠN VỊ</th>
                      <th style={{ borderRight: '1px solid #cbd5e1' }} className="py-1.5 px-1.5 text-center border-r border-slate-300 align-middle text-[11.5px] font-bold leading-tight">TRỊ SỐ THAM CHIẾU</th>
                      <th style={{ borderRight: '1px solid #cbd5e1' }} className="py-1.5 px-1 text-center border-r border-slate-300 align-middle text-[11.5px] font-bold leading-tight">THIẾT BỊ XỬ LÝ</th>
                      <th className="py-1.5 px-1 text-center align-middle text-[11.5px] font-bold leading-tight">GHI CHÚ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {page.entries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 italic text-[13.5px]">
                          Chưa có chỉ số xét nghiệm nào được chọn
                        </td>
                      </tr>
                    ) : (
                      page.entries.map((entry, eIdx) => {
                        if (entry.type === 'category') {
                          return (
                            <tr key={`cat-${eIdx}`} style={{ backgroundColor: 'rgba(224, 242, 254, 0.9)', borderBottom: '1px solid #cbd5e1' }} className="bg-sky-100/90 font-black text-sky-950 border-b border-slate-300">
                              <td colSpan={7} style={{ borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 uppercase text-[13px] tracking-wide font-bold leading-snug">
                                • {entry.category}
                              </td>
                            </tr>
                          );
                        }

                        const t = entry.test!;
                        const evalRes = evaluateResult(t.result, t.refMin, t.refMax);
                        const displayNote = t.note !== undefined && t.note !== null && t.note.trim() !== '' ? t.note : evalRes.label;
                        const isAbnormalByNote = displayNote
                          ? displayNote.includes('CAO') ||
                            displayNote.includes('THẤP') ||
                            displayNote.includes('Dương') ||
                            (displayNote.includes('Phát Hiện') && !displayNote.includes('Không')) ||
                            displayNote.includes('H ') ||
                            displayNote.includes('L ') ||
                            /Độ\s*[1-6]/i.test(displayNote)
                          : false;
                        const isAbnormal = isAbnormalByNote || evalRes.status !== 'normal';

                        return (
                          <tr
                            key={`test-${t.code || eIdx}`}
                            style={{ borderBottom: '1px solid #cbd5e1' }}
                            className={`hover:bg-slate-50 transition-colors border-b border-slate-300 ${
                              isAbnormal ? 'bg-amber-50/60 font-semibold' : 'bg-white'
                            }`}
                          >
                            <td style={{ borderRight: '1px solid #cbd5e1' }} className="py-[5px] px-1 text-center font-mono text-slate-600 border-r border-slate-300 align-middle text-[12.5px] leading-snug">
                              {entry.idx}
                            </td>
                            <td style={{ borderRight: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-semibold text-slate-900 border-r border-slate-300 align-middle text-[12.5px] leading-snug break-words">
                              {t.name}
                            </td>
                            <td
                              style={{ borderRight: '1px solid #cbd5e1' }}
                              className={`py-[5px] px-1 text-center font-mono font-bold border-r border-slate-300 align-middle text-[13px] leading-snug ${
                                isAbnormal ? 'text-red-600' : 'text-slate-900'
                              }`}
                            >
                              {t.result || '---'}
                            </td>
                            <td style={{ borderRight: '1px solid #cbd5e1' }} className="py-[5px] px-1 text-center font-mono text-slate-700 border-r border-slate-300 align-middle text-[12px] leading-snug">
                              {t.unit || '---'}
                            </td>
                            <td style={{ borderRight: '1px solid #cbd5e1' }} className="py-[5px] px-1.5 text-center font-mono text-slate-700 border-r border-slate-300 align-middle text-[12px] leading-snug">
                              {t.refText || (t.refMin !== null && t.refMax !== null ? `${t.refMin} - ${t.refMax}` : '---')}
                            </td>
                            <td style={{ borderRight: '1px solid #cbd5e1' }} className="py-[5px] px-1 text-center text-[11.5px] text-slate-600 border-r border-slate-300 align-middle leading-snug">
                              {formatEquipmentForPrint(resolveTestEquipmentName(t, equipments, catalogItemEquipments))}
                            </td>
                            <td
                              className={`py-[5px] px-1 text-center text-[11.5px] font-bold align-middle leading-snug ${
                                isAbnormal ? 'text-red-600' : 'text-slate-600'
                              }`}
                            >
                              {displayNote}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {/* 5. KHỐI KẾT LUẬN CỦA BÁC SĨ (CHỈ XUẤT HIỆN Ở TRANG CUỐI) */}
            {page.showConclusion && conclusion && (
              <div data-avoid-break="true" className="conclusion-section border border-sky-300 bg-sky-50/60 rounded p-2 mb-1.5 text-[13px] leading-snug">
                <span className="font-bold text-sky-950 uppercase tracking-wide">KẾT LUẬN / ĐỀ NGHỊ CỦA BÁC SĨ: </span>
                <span className="font-semibold text-slate-800">{conclusion}</span>
              </div>
            )}

            {/* 6. CHỮ KÝ VÀ DẤU BÁC SĨ (CHỈ XUẤT HIỆN Ở TRANG CUỐI - THIẾT LẬP NGAY DƯỚI CUỐI NỘI DUNG) */}
            {page.showSignature && (
              <div 
                data-avoid-break="true" 
                className="signature-section mt-1.5 pt-1.5 border-t border-slate-300"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
              >
                <div className="flex items-start justify-between text-center">
                  
                  {/* Bên trái: Chú thích & Lưu ý */}
                  <div className="text-left text-[11px] text-slate-600 space-y-0.5 max-w-[50%] leading-snug">
                    <p className="font-bold text-slate-800 uppercase text-[11.5px]">Lưu ý đối với bệnh nhân:</p>
                    <p>- Phiếu kết quả này chỉ có giá trị tại thời điểm xét nghiệm.</p>
                    <p>- Vui lòng mang phiếu này khi đến tái khám hoặc tư vấn bác sĩ chuyên khoa.</p>
                  </div>

                  {/* Bên phải: Chữ ký & Đóng dấu Phụ trách chuyên môn */}
                  <div className="text-center min-w-[220px] flex flex-col items-center">
                    <p className="text-[12px] text-slate-700 italic leading-normal pb-0.5">Ngày {currentDateStr}</p>
                    <p className="text-[13px] font-bold uppercase text-slate-900 my-0.5 tracking-wide leading-normal pb-0.5">PHỤ TRÁCH CHUYÊN MÔN</p>
                    <div 
                      className="h-[68px] w-[110px] flex items-center justify-center my-0.5 overflow-hidden mx-auto"
                      style={{ margin: '3px auto' }}
                    >
                      <img
                        src={currentStamp}
                        alt="Đã ký & Đóng dấu"
                        style={{ maxHeight: '68px', maxWidth: '110px', height: '68px', width: 'auto', objectFit: 'contain' }}
                        className="h-[68px] w-auto object-contain max-w-[110px]"
                        loading="eager"
                        decoding="sync"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = doctorStamp;
                        }}
                      />
                    </div>
                    <p className="text-[13.5px] font-bold text-slate-900 uppercase tracking-tight leading-normal pt-0.5 pb-0.5">
                      {safeClinic.defaultDoctor || 'Nguyễn Thị Thành Trung'}
                    </p>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* 7. DÒNG PHÂN TRANG & BẢN QUYỀN CHÂN TRANG */}
          <div className="mt-auto pt-1 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 uppercase font-mono tracking-tight">
            <span>
              HỆ THỐNG XÉT NGHIỆM GOLAB • {safeClinic.name} • HOTLINE: {safeClinic.phone}
            </span>
            <span className="font-bold text-sky-800">
              Trang {pIdx + 1}/{totalPages}
            </span>
          </div>

        </div>
      ))}
    </div>
  );
}

export default memo(PrintReportView);

