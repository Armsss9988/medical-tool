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
  resolveTestEquipmentName
} from '@domain/types';
import { isAllergenTest } from '@domain/allergenDetector';
import { evaluateResult } from '@domain/testResult';
import { computePricingWithPackages } from '@domain/pricing';
import { AllergenReportDomainService } from '@domain/services/AllergenReportDomainService';
import { generateQrCodeDataUrl } from '@infra/qrService';
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
  patient,
  selectedTests = [],
  currentDateStr = new Date().toLocaleDateString('vi-VN'),
  doctorName: _doctorName,
  conclusion,
  qrCodeDataUrl,
  qrCodeUrl,
  clinicInfo = {
    name: 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
    address: 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị',
    phone: '032.855.3773',
    website: 'golab.com.vn',
    defaultDoctor: 'Nguyễn Thị Thành Trung'
  },
  testPackages = [],
  packagePrice: explicitPackagePrice,
  allergenScales = [],
  equipments = [],
  catalogItemEquipments = []
}: HybridReportViewProps) {
  const allTests = useMemo(() => selectedTests || [], [selectedTests]);

  // Phân loại: Chỉ số thường vs Chỉ số dị nguyên
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
    return { regularTests: reg, allergenTests: alg };
  }, [allTests]);

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
    const rawWebsite = typeof clinicInfo?.website === 'string' ? clinicInfo.website.trim() : '';
    const baseUrl = rawWebsite
      ? (rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`)
      : 'https://golab.com.vn';
    const code = patient.code || `BN-${Date.now()}`;
    const sample = patient.sampleCode || code;
    const lookupUrl = `${baseUrl}/tra-cuu?code=${encodeURIComponent(code)}&sample=${encodeURIComponent(sample)}`;

    generateQrCodeDataUrl(lookupUrl).then((res) => {
      if (res) setAutoQrCode(res);
    });
  }, [qrCodeDataUrl, qrCodeUrl, patient.code, patient.sampleCode, clinicInfo?.website]);

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
    const pkg = testPackages.find((p) => p.items?.some((i) => allergenTests.some((at) => at.code === i.code)));
    return pkg?.name;
  }, [testPackages, allergenTests]);

  // Tổng giá dịch vụ toàn bộ phiếu: Phí gói dị nguyên + Phí các xét nghiệm thường
  const totalPrice = useMemo(() => {
    const allergenPrice = Number(reportDTO.packagePrice) || 0;
    const regularCodes = regularTests.map((t) => t.code);

    if (testPackages && testPackages.length > 0 && regularCodes.length > 0) {
      const regPricing = computePricingWithPackages(
        regularCodes,
        regularTests.map((t) => ({ code: t.code, price: t.price })),
        testPackages
      );
      return allergenPrice + regPricing.total;
    }

    const regSubtotal = regularTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
    return allergenPrice + regSubtotal;
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
    // 1. Hàm đo chiều cao động của một dòng xét nghiệm thường
    const getTestRowHeight = (t: SelectedTest): number => {
      let h = 32; // Chiều cao cơ bản: font 12px, line-height 17px, py-1.5 (12px), border 1px
      if (t.scientific && t.scientific.trim()) {
        h += 15; // Dòng tên khoa học in nghiêng 10.5px
      }
      const nameLen = (t.name || '').length;
      if (nameLen > 30) {
        h += Math.ceil((nameLen - 30) / 22) * 16; // Tên dài rớt dòng
      }
      const noteLen = (t.note || '').length;
      if (noteLen > 22) {
        h += Math.ceil((noteLen - 22) / 18) * 16; // Ghi chú dài rớt dòng
      }
      return h;
    };

    // 2. Hàm đo chiều cao khối tĩnh Trang 1
    const getP1StaticHeight = (): number => {
      let headerH = 95;
      if ((clinicInfo?.name || '').length > 40) headerH += 22;
      if ((clinicInfo?.address || '').length > 65) headerH += 18;

      const titleH = 48;

      let patientH = 170;
      if ((patient.address || '').length > 35) patientH += 18;

      const tableHeaderH = 36;
      return headerH + titleH + patientH + tableHeaderH;
    };

    // 3. Hàm đo chiều cao khối tĩnh Trang 2+
    const getP2StaticHeight = (): number => {
      let miniH = 62;
      if ((clinicInfo?.name || '').length > 45) miniH += 18;
      const tableHeaderH = 36;
      return miniH + tableHeaderH;
    };

    // 4. Hàm đo chiều cao khối kết thúc (Bảng Gói Dị Nguyên + Lời Dặn + Tổng Giá + Chữ Ký & Con Dấu)
    const getFinalBlockHeight = (): number => {
      const pkgNameLen = (matchedPackageName || '').length;
      const pkgRowH = pkgNameLen > 40 ? 52 : 38;
      const pkgTableH = 36 + pkgRowH + 16;

      let conclusionH = 0;
      if (conclusion && conclusion.trim()) {
        const lines = Math.ceil(conclusion.trim().length / 60) || 1;
        conclusionH = 28 + lines * 18 + 8;
      }

      const totalPriceH = 40;
      const signatureH = 186;

      return pkgTableH + conclusionH + totalPriceH + signatureH;
    };

    // Chiều cao nội dung khả dụng trên 1 trang A4 (297mm ≈ 1122.5px, trừ padding in 48px + footer 30px + buffer an toàn)
    const PAGE_MAX_USABLE_HEIGHT = 900;

    const p1StaticH = getP1StaticHeight();
    const p2StaticH = getP2StaticHeight();
    const finalBlockH = getFinalBlockHeight();

    const testHeights = regularTests.map(getTestRowHeight);
    const totalAllTestsHeight = testHeights.reduce((a, b) => a + b, 0);

    // ─── TRƯỜNG HỢP 1: TẤT CẢ VỪA TRỌN VẸN TRÊN TRANG 1 ───
    if (p1StaticH + totalAllTestsHeight + finalBlockH <= PAGE_MAX_USABLE_HEIGHT) {
      return [{
        pageIdx: 0,
        tests: regularTests,
        isFirstPage: true,
        isLastRegularPage: true,
        startRowIndex: 1
      }];
    }

    // ─── TRƯỜNG HỢP 2: KHÔNG VỪA TRANG 1 -> TÁCH TRANG DYNAMIC DỰA TRÊN DUNG LƯỢNG PIXEL ───
    const p1UsableForTests = PAGE_MAX_USABLE_HEIGHT - p1StaticH;
    const p2UsableWithFinal = PAGE_MAX_USABLE_HEIGHT - p2StaticH - finalBlockH;

    // Kiểm tra xem liệu có thể gói gọn trong 2 trang không:
    const canFitIn2Pages = totalAllTestsHeight <= (p1UsableForTests + p2UsableWithFinal);

    if (canFitIn2Pages) {
      // Cân đối chiều cao động (Dynamic Balancing) giữa Trang 1 và Trang 2:
      // Tìm điểm ngắt sao cho cả 2 trang đều thoáng đãng, không bị trang thì kín mít trang thì trơ trọi
      let p1Height = 0;
      let splitIdx = 0;

      for (let i = 0; i < regularTests.length; i++) {
        const h = testHeights[i];
        const remainingH = testHeights.slice(i + 1).reduce((a, b) => a + b, 0);

        p1Height += h;
        splitIdx = i + 1;

        const p1CurrentTotal = p1StaticH + p1Height;
        const p2EstimatedTotal = p2StaticH + remainingH + finalBlockH;

        // Điểm ngắt tối ưu: phần còn lại chắc chắn vừa Trang 2 VÀ chiều cao Trang 1 đã cân bằng với Trang 2
        if (remainingH <= p2UsableWithFinal && (p1CurrentTotal >= p2EstimatedTotal || p1Height >= p1UsableForTests * 0.7)) {
          break;
        }
      }

      // Đảm bảo không để Trang 2 trống dòng xét nghiệm nào
      if (splitIdx >= regularTests.length && regularTests.length > 1) {
        splitIdx = regularTests.length - 1;
      }

      const p1Tests = regularTests.slice(0, splitIdx);
      const p2Tests = regularTests.slice(splitIdx);

      return [
        {
          pageIdx: 0,
          tests: p1Tests,
          isFirstPage: true,
          isLastRegularPage: false,
          startRowIndex: 1
        },
        {
          pageIdx: 1,
          tests: p2Tests,
          isFirstPage: false,
          isLastRegularPage: true,
          startRowIndex: splitIdx + 1
        }
      ];
    }

    // ─── TRƯỜNG HỢP 3: DANH SÁCH RẤT NHIỀU CHỈ SỐ (> 2 TRANG) ───
    // Thuật toán dồn dòng theo dung lượng pixel thực tế từng trang:
    const chunks: RegularPageChunk[] = [];
    let remaining = [...regularTests];
    let currentStart = 1;
    let pIdx = 0;

    while (remaining.length > 0) {
      const isFirst = pIdx === 0;
      const initialH = isFirst ? p1StaticH : p2StaticH;
      const remainingH = remaining.map(getTestRowHeight).reduce((a, b) => a + b, 0);

      // Nếu toàn bộ phần còn lại vừa vặn cùng khối cuối trang trên trang này:
      if (initialH + remainingH + finalBlockH <= PAGE_MAX_USABLE_HEIGHT) {
        chunks.push({
          pageIdx: pIdx,
          tests: remaining,
          isFirstPage: isFirst,
          isLastRegularPage: true,
          startRowIndex: currentStart
        });
        break;
      }

      // Chưa vừa, lấp đầy trang hiện tại dựa trên chiều cao khả dụng
      let currentH = initialH;
      let take = 0;

      for (let i = 0; i < remaining.length; i++) {
        const h = getTestRowHeight(remaining[i]);
        if (currentH + h > PAGE_MAX_USABLE_HEIGHT) break;
        currentH += h;
        take = i + 1;
      }

      take = Math.max(1, Math.min(take, remaining.length));
      chunks.push({
        pageIdx: pIdx,
        tests: remaining.slice(0, take),
        isFirstPage: isFirst,
        isLastRegularPage: remaining.length === take,
        startRowIndex: currentStart
      });

      currentStart += take;
      remaining = remaining.slice(take);
      pIdx++;
    }

    return chunks;
  }, [regularTests, clinicInfo, patient, matchedPackageName, conclusion]);

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
          className="report-page bg-white text-slate-900 p-8 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-6 flex flex-col justify-between"
          style={{
            fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
            width: '210mm',
            minWidth: '210mm',
            maxWidth: '210mm',
            minHeight: '297mm',
            boxSizing: 'border-box'
          }}
        >
          <div className="flex-1 flex flex-col justify-start">
            {page.isFirstPage ? (
              <>
                {/* Header Phòng Khám & QR Tra Cứu */}
                <div 
                  className="flex items-center justify-between border-b-2 border-sky-600 pb-3 mb-3"
                  style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0284c7' }}
                >
                  <div className="flex items-center space-x-4" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <div className="h-[74px] w-[142px] max-h-[74px] max-w-[142px] flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={currentLogo}
                        alt="GoLab Logo"
                        style={{ maxHeight: '74px', maxWidth: '142px', height: '74px', width: 'auto', objectFit: 'contain' }}
                        className="h-[74px] max-w-[142px] w-auto object-contain object-center shrink-0"
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
                      <p className="text-[13px] font-bold text-sky-800 uppercase tracking-widest leading-none mb-1">
                        HỆ THỐNG XÉT NGHIỆM GOLAB
                      </p>
                      <h1 className="text-[18px] font-black text-sky-950 uppercase tracking-tight">
                        {clinicInfo?.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
                      </h1>
                      <p className="text-[13px] text-slate-700 font-medium">
                        Địa chỉ: {clinicInfo?.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}
                      </p>
                      <p className="text-[12.5px] text-slate-700 font-medium">
                        Website: <strong className="text-sky-800">{clinicInfo?.website || 'golab.com.vn'}</strong> – Hotline: <strong className="text-sky-800">{clinicInfo?.phone || '032.855.3773'}</strong>
                      </p>
                    </div>
                  </div>

                  {finalQrCode && (
                    <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded shadow-2xs shrink-0 min-w-[62px]" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={finalQrCode}
                        alt="QR Code Tra Cứu"
                        data-qr="true"
                        style={{ width: '56px', height: '56px', objectFit: 'contain' }}
                        className="w-14 h-14 object-contain shrink-0"
                      />
                      <span className="text-[9.5px] font-mono text-sky-800 font-extrabold mt-0.5 tracking-tight">QR Tra Cứu</span>
                    </div>
                  )}
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
                        <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug" style={{ borderBottom: '1px solid #cbd5e1' }}>{patient.paidAt || patient.orderedAt || currentDateStr}</td>
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
                        <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-slate-300 align-middle leading-snug" style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>{patient.doctor || 'BS. Phòng khám'}</td>
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
                className="flex items-center justify-between border-b-2 border-sky-600 pb-2 mb-3"
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0284c7' }}
              >
                <div className="flex items-center space-x-3" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <div className="h-[44px] w-[85px] max-h-[44px] max-w-[85px] flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={currentLogo}
                      alt="GoLab Logo"
                      style={{ maxHeight: '44px', maxWidth: '85px', height: '44px', width: 'auto', objectFit: 'contain' }}
                      className="h-11 w-auto object-contain shrink-0"
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
                    <h1 className="text-[14px] font-black text-sky-950 uppercase tracking-tight">
                      {clinicInfo?.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
                    </h1>
                    <p className="text-[11.5px] text-slate-600">Hotline: {clinicInfo?.phone || '032.855.3773'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[12.5px] font-bold text-slate-800 font-mono">
                    BN: <strong className="text-red-600 uppercase" style={{ color: '#dc2626' }}>{patient.name || '---'}</strong> ({patient.sampleCode || patient.code})
                  </span>
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
                      const evaluation = evaluateResult(t.result, t.refMin, t.refMax);
                      const isAbnormal = evaluation.status === 'high' || evaluation.status === 'low';
                      const resolvedEquipment = resolveTestEquipmentName(t, equipments, catalogItemEquipments);
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
                            {t.note || (isAbnormal ? evaluation.label : 'Bình thường')}
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
                          Panel {reportDTO.totalCount} dị nguyên {matchedPackageName ? `(${matchedPackageName})` : ''}
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

                {/* Chữ Ký & Con Dấu Phụ Trách Chuyên Môn */}
                <div className="flex justify-end pt-1">
                  <div className="text-center min-w-[220px] flex flex-col items-center">
                    <p className="text-[13px] text-slate-700 italic leading-normal pb-0.5">Ngày {currentDateStr}</p>
                    <p className="text-[13.5px] font-bold uppercase text-slate-900 tracking-wide my-1 leading-normal pb-0.5">
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
                    <p className="text-[14px] font-bold text-slate-900 uppercase leading-normal pt-1 pb-0.5">
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
              HỆ THỐNG XÉT NGHIỆM GOLAB • {clinicInfo?.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'} • HOTLINE: {clinicInfo?.phone || '032.855.3773'}
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
