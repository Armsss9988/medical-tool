import { useState, useEffect, useMemo, memo } from 'react';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import {
  Patient,
  SelectedTest,
  ClinicInfo,
  TestPackage,
  AllergenGradingScale,
  TestEquipment,
  CatalogItemEquipmentLink,
  resolveTestEquipmentName,
  formatEquipmentForPrint,
  formatDisplayDate,
  DEFAULT_CLINIC_INFO,
  getSafeClinicInfo
} from '@domain';
import { isAllergenTest } from '@domain/allergenDetector';
import { evaluateTestIndicator } from '@domain/testResult';
import { computeHybridReportTotalPrice } from '@domain/pricing';
import { AllergenReportDomainService } from '@domain/services/AllergenReportDomainService';
import { ReportPaginationDomainService } from '@domain/services/ReportPaginationDomainService';
import { sortTestsByPackageOrder } from '@domain/services/packageOrderResolver';
import { generateQrCodeDataUrl, buildPortalUrl } from '@infra/qrService';
import AllergenSummaryPage from './allergenReport/AllergenSummaryPage';
import AllergenDetailPage from './allergenReport/AllergenDetailPage';
import AllergenGuidancePage from './allergenReport/AllergenGuidancePage';

export interface HybridReportViewProps {
  elementId?: string;
  patient: Patient;
  selectedTests?: SelectedTest[];
  currentDateStr?: string;
  doctorName?: string;
  conclusion?: string;
  qrCodeDataUrl?: string;
  qrCodeUrl?: string;
  clinicInfo?: ClinicInfo;
  testPackages?: TestPackage[];
  packagePrice?: number;
  allergenScales?: AllergenGradingScale[];
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 🏥 MẪU PHIẾU XÉT NGHIỆM HỖN HỢP (HYBRID REPORT BOOKLET)
 * ═════════════════════════════════════════════════════════════════════════════
 * - Sử dụng đầy đủ cấu trúc của gói Full Dị Nguyên (Booklet chuyên sâu).
 * - TRANG 1 (Trang bìa):
 *    1. Header & QR tra cứu
 *    2. Bảng thông tin hành chính 12 trường (6 hàng, 4 cột)
 *    3. BẢNG CHỈ SỐ XÉT NGHIỆM THƯỜNG (7 Cột chuẩn)
 *    4. BẢNG GÓI DỊ NGUYÊN TỔNG QUAN (5 Cột: STT, Tên xét nghiệm, Kết quả, Ghi chú, Giá tiền)
 *    5. Lời dặn & Con dấu, Chữ ký BS Phụ trách chuyên môn
 * - TRANG 2: Báo cáo Dị nguyên Dương tính (+) + Diễn giải thang đo + Triệu chứng + TIgE
 * - TRANG 3..N: Bảng 9 cột chi tiết toàn bộ các dị nguyên trong gói
 * - TRANG CUỐI: Một số lưu ý về phòng ngừa dị ứng (10 điều y khoa)
 */
function HybridReportView({
  elementId = 'preview-hybrid-element',
  patient: rawPatient,
  selectedTests = [],
  currentDateStr = new Date().toLocaleDateString('vi-VN'),
  doctorName,
  conclusion,
  qrCodeDataUrl,
  qrCodeUrl,
  clinicInfo = DEFAULT_CLINIC_INFO,
  testPackages = [],
  packagePrice: explicitPackagePrice,
  allergenScales = [],
  equipments = [],
  catalogItemEquipments = []
}: HybridReportViewProps) {
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
  const allTests = useMemo(() => selectedTests || [], [selectedTests]);

  // Phân loại: Chỉ số thường vs Chỉ số dị nguyên (đã sắp xếp theo order_index của package_items)
  const { regularTests, allergenTests } = useMemo(() => {
    const reg: SelectedTest[] = [];
    const alg: SelectedTest[] = [];
    for (const t of allTests) {
      if (isAllergenTest(t)) {
        alg.push(t);
      } else {
        reg.push(t);
      }
    }
    const sortedReg = sortTestsByPackageOrder(reg, testPackages);
    return { regularTests: sortedReg, allergenTests: alg };
  }, [allTests, testPackages]);

  const [autoQrCode, setAutoQrCode] = useState<string>(qrCodeDataUrl || '');

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
    const code = patient.code || `BN-${Date.now()}`;
    const portalUrl = buildPortalUrl(code, clinicInfo?.website);

    generateQrCodeDataUrl(portalUrl).then((res) => {
      if (res) setAutoQrCode(res);
    });
  }, [qrCodeDataUrl, qrCodeUrl, patient.code, clinicInfo?.website]);

  const finalQrCode = qrCodeDataUrl || autoQrCode;
  const currentLogo =
    clinicInfo?.logoUrl &&
    typeof clinicInfo.logoUrl === 'string' &&
    clinicInfo.logoUrl.trim() !== '' &&
    clinicInfo.logoUrl !== 'null' &&
    clinicInfo.logoUrl !== 'undefined'
      ? clinicInfo.logoUrl
      : golabLogo;

  const currentStamp =
    clinicInfo?.stampUrl &&
    typeof clinicInfo.stampUrl === 'string' &&
    clinicInfo.stampUrl.trim() !== '' &&
    clinicInfo.stampUrl !== 'null' &&
    clinicInfo.stampUrl !== 'undefined'
      ? clinicInfo.stampUrl
      : doctorStamp;

  // DTO danh sách dị nguyên
  const reportDTO = useMemo(() => {
    return AllergenReportDomainService.buildReportDTO({
      tests: allergenTests,
      allTests: allTests,
      testPackages,
      packagePrice: explicitPackagePrice,
      customScales: allergenScales
    });
  }, [allergenTests, allTests, testPackages, explicitPackagePrice, allergenScales]);

  const matchedPackageName = useMemo(() => {
    return reportDTO.packageName;
  }, [reportDTO.packageName]);

  // Tổng giá dịch vụ toàn bộ phiếu: Phí gói dị nguyên + Phí các xét nghiệm thường (không tính trùng TIgE vì TIgE đã nằm trong gói dị nguyên)
  const totalPrice = useMemo(() => {
    return computeHybridReportTotalPrice(regularTests, reportDTO.packagePrice, testPackages);
  }, [regularTests, reportDTO.packagePrice, testPackages]);

  // ---------------------------------------------------------------------------
  // THUẬT TOÁN ĐO LƯỜNG CHIỀU CAO ĐỘNG & TỰ ĐỘNG PHÂN TRANG CHUẨN XÁC A4 (PIXELS)
  // (Không ngắt cứng theo số lượng chỉ số; phân trang hoàn toàn theo dung lượng trang)
  // ---------------------------------------------------------------------------
  interface RegularPageChunk {
    pageIdx: number;
    tests: SelectedTest[];
    isFirstPage: boolean;
    isLastRegularPage: boolean;
    startRowIndex: number;
  }

  const regularPages: RegularPageChunk[] = useMemo(() => {
    // Đo chiều cao khối kết thúc chuyên biệt của Hybrid Report (Bảng Gói Dị Nguyên + Lời Dặn + Tổng Giá + Chữ Ký & Con Dấu)
    const pkgNameLen = (matchedPackageName || '').length;
    const pkgRowH = pkgNameLen > 40 ? 52 : 38;
    const pkgTableH = 36 + pkgRowH + 16;
    const totalPriceH = 40;
    const signatureH = 186;
    const hybridSignatureBlockHeight = pkgTableH + totalPriceH + signatureH;

    const pages = ReportPaginationDomainService.paginate(regularTests, conclusion, {
      signatureBlockHeight: hybridSignatureBlockHeight
    });

    let currentStart = 1;
    return pages.map((p, idx) => {
      const chunk: RegularPageChunk = {
        pageIdx: idx,
        tests: [...p.tests],
        isFirstPage: p.isFirstPage,
        isLastRegularPage: p.isLastPage,
        startRowIndex: currentStart
      };
      currentStart += p.tests.length;
      return chunk;
    });
  }, [regularTests, matchedPackageName, conclusion]);

  // Tổng số trang = Số trang thường + 1 (Trang tổng hợp thang đo) + N (Trang chi tiết) + 1 (Trang phòng ngừa)
  const totalPages = regularPages.length + 1 + reportDTO.detailPages.length + 1;

  return (
    <div id={elementId} className="w-[210mm] max-w-[210mm] mx-auto bg-slate-200 print:bg-white print:m-0 print:p-0 font-serif">
      {/* ─────────────────────────────────────────────────────────────────────────
          📄 CÁC TRANG XÉT NGHIỆM THƯỜNG & TRANG BÌA (TỰ ĐỘNG PHÂN TRANG)
          ───────────────────────────────────────────────────────────────────────── */}
      {regularPages.map((page, pIdx) => (
        <div 
          key={`reg-page-${pIdx}`}
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
            pageBreakAfter: pIdx < regularPages.length - 1 ? 'always' : 'auto',
            breakAfter: pIdx < regularPages.length - 1 ? 'page' : 'auto'
          }}
        >
          <div className="flex-1 flex flex-col justify-start">
            {page.isFirstPage ? (
              <>
                {/* Header Phòng Khám & QR Tra Cứu */}
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

                {/* Tiêu Đề Phiếu */}
                <div className="text-center my-3">
                  <h2 className="text-[22px] font-black text-slate-900 uppercase tracking-wide">
                    PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM
                  </h2>
                </div>

                {/* Bảng Thông Tin Bệnh Nhân Hành Chính (12 Trường - 6 Hàng, 4 Cột) */}
                <div className="border border-slate-300 rounded mb-3.5 bg-white text-[12.5px]" style={{ border: '1px solid #cbd5e1' }}>
                  <table className="w-full table-fixed border-collapse" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                    <colgroup>
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '35%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '32%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Họ và tên:</td>
                        <td className="py-1.5 px-3 font-bold text-red-600 uppercase border-r border-b border-slate-300 align-middle text-[13.5px] leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', color: '#dc2626' }}>{patient.name || '---'}</td>
                        <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>T/G chỉ định:</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug" style={{ borderBottom: '1px solid #cbd5e1' }}>{patient.orderedAt || currentDateStr}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Năm sinh:</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>{patient.dob || '---'}</td>
                        <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>T/G đóng phí:</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug" style={{ borderBottom: '1px solid #cbd5e1' }}>{formatDisplayDate(patient.paidAt, 'Chưa thu phí')}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Giới tính:</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>{patient.gender || 'Nam'}</td>
                        <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>T/G nhận mẫu:</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug" style={{ borderBottom: '1px solid #cbd5e1' }}>{patient.receivedAt || patient.orderedAt || currentDateStr}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Số điện thoại:</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>{patient.phone || '---'}</td>
                        <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>T/G trả KQ:</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug" style={{ borderBottom: '1px solid #cbd5e1' }}>{patient.returnedAt || currentDateStr}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Địa chỉ:</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>{patient.address || '---'}</td>
                        <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Số bệnh phẩm:</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-red-600 border-b border-slate-300 align-middle leading-snug" style={{ borderBottom: '1px solid #cbd5e1', color: '#dc2626' }}>{patient.sampleCode || patient.code}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Bác sĩ chỉ định:</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>{patient.doctor || doctorName || 'BS. Trần Hoài Long'}</td>
                        <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Chất lượng mẫu:</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug" style={{ borderBottom: '1px solid #cbd5e1' }}>{patient.sampleStatus || 'Đạt'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              /* Mini Header cho các trang sau */
              <div 
                className="header-mini flex items-center justify-between border-b-2 border-sky-600 pb-1.5 mb-2.5 gap-4"
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', width: '100%', boxSizing: 'border-box' }}
              >
                <div className="flex items-center space-x-2.5 shrink-0" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div className="h-[34px] w-[70px] max-h-[34px] max-w-[70px] flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={currentLogo}
                      alt="GoLab Logo"
                      style={{ maxHeight: '34px', maxWidth: '70px', height: '34px', width: 'auto', objectFit: 'contain' }}
                      className="h-[34px] w-auto object-contain shrink-0"
                      loading="eager"
                      decoding="sync"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.onerror = null;
                        target.src = golabLogo;
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[13px] font-black text-sky-950 uppercase tracking-tight block leading-tight" style={{ fontWeight: 800, fontSize: '13px', color: '#082f49', textTransform: 'uppercase', lineHeight: '1.2' }}>
                      {safeClinic.name}
                    </span>
                    <span className="text-[10.5px] text-slate-500 font-medium leading-none" style={{ fontSize: '10.5px', color: '#64748b' }}>Hotline: {safeClinic.phone}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 leading-tight" style={{ textAlign: 'right', flexShrink: 0, lineHeight: '1.25' }}>
                  <div className="text-[12.5px] text-slate-700">
                    Bệnh nhân: <strong className="text-red-600 font-bold uppercase text-[13px]" style={{ color: '#dc2626' }}>{patient.name || '---'}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5" style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                    Mã BN: <strong className="text-slate-800" style={{ color: '#1e293b' }}>{patient.code}</strong> • Số BP: <strong className="text-red-600 font-bold" style={{ color: '#dc2626' }}>{patient.sampleCode || patient.code}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* 1. BẢNG CHỈ SỐ XÉT NGHIỆM THƯỜNG */}
            {page.tests.length > 0 && (
              <div className="border border-slate-300 rounded mb-3 bg-white overflow-hidden" style={{ border: '1px solid #cbd5e1' }}>
                <table className="w-full text-[12px] border-collapse" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-300" style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <tr>
                      <th className="py-2 px-2 w-8 text-center border-r border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1' }}>STT</th>
                      <th className="py-2 px-2.5 text-left border-r border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1' }}>TÊN CHỈ SỐ XÉT NGHIỆM</th>
                      <th className="py-2 px-2 w-24 text-center border-r border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1' }}>KẾT QUẢ</th>
                      <th className="py-2 px-1.5 w-16 text-center border-r border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1' }}>ĐƠN VỊ</th>
                      <th className="py-2 px-2 w-32 text-center border-r border-slate-300 align-middle leading-snug">TRỊ SỐ THAM CHIẾU</th>
                      <th className="py-2 px-2.5 w-44 text-center border-r border-slate-300 align-middle leading-snug">THIẾT BỊ XỬ LÝ</th>
                      <th className="py-2 px-2.5 text-left align-middle leading-snug w-28">GHI CHÚ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {page.tests.map((t, idx) => {
                      const evaluation = evaluateTestIndicator(
                        t.code,
                        t.category,
                        t.unit,
                        t.result,
                        t.refMin,
                        t.refMax,
                        undefined,
                        undefined,
                        t.evaluationType
                      );
                      const isAbnormalByNote = t.note
                        ? t.note.includes('CAO') ||
                          t.note.includes('THẤP') ||
                          t.note.includes('Dương') ||
                          (t.note.includes('Phát Hiện') && !t.note.includes('Không'))
                        : false;
                      const isAbnormal = evaluation.isAbnormal || isAbnormalByNote;
                      const resolvedEquipment = formatEquipmentForPrint(
                        resolveTestEquipmentName(t, equipments, catalogItemEquipments)
                      );
                      const sttNumber = page.startRowIndex + idx;

                      return (
                        <tr key={`reg-${t.code}-${idx}`} className={`hover:bg-slate-50 ${isAbnormal ? 'bg-red-50/40' : ''}`}>
                          <td className="py-1.5 px-2 text-center font-mono text-slate-500 border-r border-slate-200 align-middle leading-snug">{sttNumber}</td>
                          <td className="py-1.5 px-2.5 font-bold text-slate-900 border-r border-slate-200 align-middle leading-snug">
                            {t.name}
                            {t.scientific && <span className="text-[10.5px] text-slate-500 italic block font-normal">{t.scientific}</span>}
                          </td>
                          <td className={`py-1.5 px-2 text-center font-mono text-[13px] border-r border-slate-200 align-middle leading-snug ${isAbnormal ? 'text-red-600 font-black' : 'text-slate-900 font-bold'}`}>
                            {t.result || '---'}
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-mono text-slate-700 text-[11.5px] border-r border-slate-200 align-middle leading-snug">{t.unit || '---'}</td>
                          <td className="py-1.5 px-2 text-center font-mono text-slate-700 text-[11.5px] border-r border-slate-200 align-middle leading-snug">
                            {t.refText || (t.refMin !== undefined && t.refMax !== undefined ? `${t.refMin} - ${t.refMax}` : '---')}
                          </td>
                          <td className="py-1.5 px-2.5 text-center text-slate-700 text-[11px] leading-snug border-r border-slate-200 align-middle whitespace-normal">
                            {resolvedEquipment || '---'}
                          </td>
                          <td className="py-1.5 px-2.5 text-slate-700 font-semibold text-[11px] align-middle leading-snug whitespace-normal">
                            {t.note || (isAbnormal ? evaluation.label : (t.result && String(t.result).trim() !== '' ? 'Bình thường' : ''))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* NẾU LÀ TRANG THƯỜNG CUỐI CÙNG: HIỂN THỊ BẢNG GÓI DỊ NGUYÊN, LỜI DẶN, TỔNG GIÁ, CHỮ KÝ */}
            {page.isLastRegularPage && (
              <>
                {/* 2. BẢNG GÓI DỊCH VỤ DỊ NGUYÊN (BẢNG TRONG ẢNH GỐC) */}
                <div className="border border-slate-300 rounded mb-4 bg-white">
                  <table className="w-full text-[13px] border-collapse">
                    <thead className="bg-slate-50 text-slate-900 font-bold border-b-2 border-slate-300">
                      <tr>
                        <th className="py-2 px-3 w-14 text-center border-r border-slate-300 align-middle leading-snug">STT</th>
                        <th className="py-2 px-4 text-left border-r border-slate-300 align-middle leading-snug">Tên Xét Nghiệm</th>
                        <th className="py-2 px-3 w-32 text-center border-r border-slate-300 align-middle leading-snug">Kết quả</th>
                        <th className="py-2 px-4 text-left border-r border-slate-300 align-middle leading-snug">Ghi chú</th>
                        <th className="py-2 px-4 w-36 text-right align-middle leading-snug">Giá tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-[13.5px]">
                        <td className="py-2.5 px-3 text-center border-r border-slate-300 font-medium align-middle leading-snug">
                          {regularTests.length > 0 ? regularTests.length + 1 : 1}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-300 align-middle leading-snug">
                           {matchedPackageName ? `${matchedPackageName}` : `Panel ${reportDTO.totalCount} dị nguyên`}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-300 text-slate-400 font-mono align-middle leading-snug">---</td>
                        <td className="py-2.5 px-4 text-slate-700 border-r border-slate-300 font-medium align-middle leading-snug">
                          Kết quả chi tiết trong file đính kèm
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 text-[14px] align-middle leading-snug">
                          {reportDTO.packagePrice.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Lời Dặn & Kết Luận */}
                {conclusion && conclusion.trim() !== '' && (
                  <div className="border border-slate-300 rounded p-2 mb-2 bg-slate-50/50 text-[12px]">
                    <span className="font-bold text-slate-800">KẾT LUẬN &amp; LỜI DẶN: </span>
                    <span className="text-slate-800 leading-snug">{conclusion}</span>
                  </div>
                )}

                {/* Tổng Giá Dịch Vụ Phía Trên Vùng Đóng Dấu Ký */}
                <div className="flex justify-end items-center mb-2">
                  <div className="flex items-baseline space-x-2 bg-slate-50 border border-slate-300 rounded px-4 py-1.5 shadow-2xs">
                    <span className="font-bold uppercase text-slate-800 text-[13px] tracking-wide">
                      Tổng giá:
                    </span>
                    <span className="font-mono font-black text-red-600 text-[16px]">
                      {totalPrice.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Chữ Ký: Bác sĩ chỉ định & Phụ trách chuyên môn */}
                <div className="flex items-start justify-between text-center pt-1 border-t border-slate-200/60 mt-1">
                  {/* Bên trái: Chú thích & Lưu ý */}
                  <div className="text-left text-[11.5px] text-slate-600 space-y-0.5 max-w-[50%] leading-snug pt-1">
                    <p className="font-bold text-slate-800 uppercase text-[12px]">Lưu ý đối với bệnh nhân:</p>
                    <p>- Phiếu kết quả này chỉ có giá trị tại thời điểm xét nghiệm.</p>
                    <p>- Vui lòng mang phiếu này khi đến tái khám hoặc tư vấn bác sĩ chuyên khoa.</p>
                  </div>

                  {/* Bên phải: Chữ ký & Đóng dấu Phụ trách chuyên môn */}
                  <div className="text-center min-w-[220px] flex flex-col items-center">
                    <p className="text-[12.5px] text-slate-700 italic leading-normal pb-0.5">Ngày {currentDateStr}</p>
                    <p className="text-[13px] font-bold uppercase text-slate-900 my-0.5 tracking-wide leading-normal pb-0.5">
                      PHỤ TRÁCH CHUYÊN MÔN
                    </p>
                    <div 
                      className="h-24 w-[135px] flex items-center justify-center my-0.5 overflow-hidden mx-auto"
                      style={{ margin: '2px auto' }}
                    >
                      <img
                        src={currentStamp}
                        alt="Con Dấu & Chữ Ký"
                        style={{ maxHeight: '96px', maxWidth: '135px', height: '96px', width: 'auto', objectFit: 'contain' }}
                        className="h-24 w-auto object-contain max-w-[135px]"
                        loading="eager"
                        decoding="sync"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = doctorStamp;
                        }}
                      />
                    </div>
                    <p className="text-[13.5px] font-bold text-slate-900 uppercase leading-normal pt-1 pb-0.5">
                      {clinicInfo?.defaultDoctor || 'Nguyễn Thị Thành Trung'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Page */}
          <div 
            className="mt-auto pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 uppercase font-mono"
            style={{ marginTop: 'auto', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', width: '100%' }}
          >
            <span>
              HỆ THỐNG XÉT NGHIỆM GOLAB • {safeClinic.name} • HOTLINE: {safeClinic.phone}
            </span>
            <span className="font-bold text-sky-800" style={{ fontWeight: 'bold', color: '#075985' }}>
              Trang {pIdx + 1}/{totalPages}
            </span>
          </div>
        </div>
      ))}

      {/* ─────────────────────────────────────────────────────────────────────────
          📄 TRANG BÁO CÁO DỊ NGUYÊN & CHÚ THÍCH THANG ĐO ĐỘ DƯƠNG TÍNH (+)
          ───────────────────────────────────────────────────────────────────────── */}
      <AllergenSummaryPage
        patient={patient}
        clinicInfo={clinicInfo}
        currentLogo={currentLogo}
        totalCount={reportDTO.totalCount}
        positiveList={reportDTO.positiveList}
        appliedScales={reportDTO.appliedScales}
        pageNumber={regularPages.length + 1}
        packageName={reportDTO.packageName}
      />

      {/* ─────────────────────────────────────────────────────────────────────────
          📄 CÁC TRANG CHI TIẾT KẾT QUẢ XÉT NGHIỆM TỪNG DỊ NGUYÊN (9 CỘT)
          ───────────────────────────────────────────────────────────────────────── */}
      {reportDTO.detailPages.map((pageItems, pageIdx) => (
        <AllergenDetailPage
          key={pageIdx}
          pageItems={pageItems}
          pageIdx={pageIdx}
          totalDetailPages={reportDTO.detailPages.length}
          totalCount={reportDTO.totalCount}
          pageNumber={regularPages.length + 1 + 1 + pageIdx}
        />
      ))}

      {/* ─────────────────────────────────────────────────────────────────────────
          📄 TRANG CUỐI: MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG (10 ĐIỀU Y KHOA)
          ───────────────────────────────────────────────────────────────────────── */}
      <AllergenGuidancePage totalPages={totalPages} />
    </div>
  );
}

export default memo(HybridReportView);
