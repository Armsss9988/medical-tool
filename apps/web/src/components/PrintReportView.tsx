import { useState, useEffect, memo } from 'react';
import { evaluateResult } from '@domain/testResult';
import { generateQrCodeDataUrl } from '@infra/qrService';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import { Patient, SelectedTest, ClinicInfo, TestEquipment, CatalogItemEquipmentLink, resolveTestEquipmentName } from '@domain/types';

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
}

interface FlatEntry {
  type: 'category' | 'test';
  category: string;
  isContinued?: boolean;
  test?: SelectedTest;
  idx?: number;
}

function PrintReportView({
  elementId = 'printable-medical-report',
  patient,
  selectedTests = [],
  currentDateStr = new Date().toLocaleDateString('vi-VN'),
  doctorName,
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
  equipments = [],
  catalogItemEquipments = []
}: PrintReportViewProps) {
  const tests = selectedTests || [];
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
    // Tự động tạo mã QR tra cứu trực tuyến thời gian thực
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

  // 1. Gom nhóm các chỉ số theo danh mục
  const groupedCategories: Record<string, SelectedTest[]> = {};
  tests.forEach((t) => {
    const cat = t.category || 'XÉT NGHIỆM KHÁC';
    if (!groupedCategories[cat]) {
      groupedCategories[cat] = [];
    }
    groupedCategories[cat].push(t);
  });

  // 2. Chuyển đổi thành danh sách phẳng (Flat entries)
  const flatEntries: FlatEntry[] = [];
  Object.entries(groupedCategories).forEach(([cat, items]) => {
    flatEntries.push({ type: 'category', category: cat });
    items.forEach((item, i) => {
      flatEntries.push({ type: 'test', category: cat, test: item, idx: i + 1 });
    });
  });

  // -------------------------------------------------------------
  // THUẬT TOÁN ĐO CHIỀU CAO ĐỘNG & TỰ ĐỘNG PHÂN TRANG CHUẨN XÁC
  // -------------------------------------------------------------
  // Chiều cao nội dung khả dụng trên 1 trang A4 (297mm ≈ 1122px, trừ padding 20mm + footer 30px + buffer an toàn 60px)
  const PAGE_MAX_USABLE_HEIGHT = 880; // pixels an toàn

  // Chiều cao các khối tĩnh thực tế trên DOM (Pixels):
  // Trang 1: Full Header (125) + Tiêu đề (45) + Bảng BN 12 trường (200) + Header bảng XN (40) = 410px
  const P1_STATIC_HEIGHT = 410;
  // Trang 2: Mini Header (50) + Header bảng XN (40) = 90px
  const P2_STATIC_HEIGHT = 90;
  // Khối Chữ Ký: Lưu ý + Ngày tháng + Phụ trách chuyên môn + Stamp 80px + Tên BS + Padding = 210px
  const SIGNATURE_BLOCK_HEIGHT = 210;

  const getEntryHeight = (entry: FlatEntry): number => {
    if (entry.type === 'category') return 36;
    const test = entry.test;
    if (!test) return 36;
    // Kiểm tra nếu tên chỉ số dài hoặc có ghi chú dài làm tăng chiều cao dòng
    const nameLen = (test.name || '').length;
    const noteLen = (test.note || '').length;
    if (nameLen > 30 || noteLen > 20) {
      return 52; // Dòng 2 hàng chữ
    }
    return 36; // Dòng chuẩn 1 hàng
  };

  const getConclusionHeight = (conclusionText?: string): number => {
    if (!conclusionText || !conclusionText.trim()) return 0;
    const lines = Math.ceil(conclusionText.length / 60) || 1;
    return 36 + lines * 20;
  };

  const conclusionHeight = getConclusionHeight(conclusion);
  const totalFinalBlockHeight = (conclusion ? conclusionHeight : 0) + SIGNATURE_BLOCK_HEIGHT;

  const pages: Array<{
    isFirstPage: boolean;
    isLastPage: boolean;
    entries: FlatEntry[];
    showConclusion: boolean;
    showSignature: boolean;
  }> = [];

  let remaining = [...flatEntries];
  let pageIdx = 0;

  while (remaining.length > 0 || pageIdx === 0) {
    pageIdx++;
    const isFirstPage = pageIdx === 1;
    const initialPageHeight = isFirstPage ? P1_STATIC_HEIGHT : P2_STATIC_HEIGHT;

    // 1. Kiểm tra xem toàn bộ các mục còn lại + Kết Luận + Chữ Ký có thể vừa trọn vẹn trên trang hiện tại không:
    const remainingEntriesHeight = remaining.reduce((sum, e) => sum + getEntryHeight(e), 0);

    if (initialPageHeight + remainingEntriesHeight + totalFinalBlockHeight <= PAGE_MAX_USABLE_HEIGHT) {
      // Vừa vặn 100% cùng Chữ Ký & Kết Luận trên trang này!
      const currentChunk = [...remaining];
      if (!isFirstPage && currentChunk[0] && currentChunk[0].type === 'test') {
        currentChunk.unshift({
          type: 'category',
          category: `${currentChunk[0].category} (tiếp theo)`,
          isContinued: true
        });
      }
      pages.push({
        isFirstPage,
        isLastPage: true,
        entries: currentChunk,
        showConclusion: Boolean(conclusion),
        showSignature: true
      });
      break;
    }

    // 2. Không vừa cả khối Chữ Ký -> Đóng gói các mục vừa với trang hiện tại (chưa có chữ ký)
    let currentHeight = initialPageHeight;
    let takeCount = 0;

    for (let i = 0; i < remaining.length; i++) {
      const entryH = getEntryHeight(remaining[i]);
      if (currentHeight + entryH > PAGE_MAX_USABLE_HEIGHT) {
        break;
      }
      currentHeight += entryH;
      takeCount = i + 1;
    }

    // Tránh ngắt trang ngay trước mục Category lẻ loi ở đáy trang
    if (takeCount > 1 && takeCount < remaining.length && remaining[takeCount - 1].type === 'category') {
      takeCount -= 1;
    }

    // Đảm bảo mỗi trang lấy ít nhất 1 mục nếu còn
    takeCount = Math.max(1, Math.min(takeCount, remaining.length));

    const chunk = remaining.slice(0, takeCount);
    if (!isFirstPage && chunk[0] && chunk[0].type === 'test') {
      chunk.unshift({
        type: 'category',
        category: `${chunk[0].category} (tiếp theo)`,
        isContinued: true
      });
    }

    remaining = remaining.slice(takeCount);

    // Nếu sau khi lấy mà hết sạch mục, nhưng chữ ký không vừa trên trang này -> Chữ ký sẽ được chuyển sang trang tiếp theo
    const isLastItemTaken = remaining.length === 0;
    if (isLastItemTaken) {
      pages.push({
        isFirstPage,
        isLastPage: false,
        entries: chunk,
        showConclusion: false,
        showSignature: false
      });

      // Tạo trang cuối dành riêng cho Kết Luận + Chữ Ký
      pages.push({
        isFirstPage: false,
        isLastPage: true,
        entries: [],
        showConclusion: Boolean(conclusion),
        showSignature: true
      });
      break;
    } else {
      pages.push({
        isFirstPage,
        isLastPage: false,
        entries: chunk,
        showConclusion: false,
        showSignature: false
      });
    }
  }

  const totalPages = pages.length;

  return (
    <div id={elementId} className="flex flex-col gap-6 print:gap-0 font-serif">
      {pages.map((page, pIdx) => (
        <div
          key={pIdx}
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
              <div data-avoid-break="true" className="header-section flex items-center justify-between border-b-2 border-slate-300 pb-2.5 mb-2">
                <div className="flex items-center space-x-4">
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
                    <p className="text-[13px] font-extrabold text-sky-800 uppercase tracking-widest leading-none mb-1">
                      HỆ THỐNG XÉT NGHIỆM GOLAB
                    </p>
                    <h1 className="text-[18px] font-black text-sky-950 uppercase tracking-tight leading-tight">
                      {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
                    </h1>
                    <p className="text-[13px] text-slate-700 font-medium leading-relaxed mt-0.5">
                      ĐC: {clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}
                    </p>
                    <p className="text-[12.5px] text-slate-700 font-medium leading-relaxed">
                      Website: <strong className="text-sky-800">{clinicInfo.website || 'golab.com.vn'}</strong> • Hotline: <strong className="text-sky-800">{clinicInfo.phone || '032.855.3773'}</strong>
                    </p>
                  </div>
                </div>

                {/* Khung QR Code bên phải Header */}
                <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded shadow-2xs shrink-0 min-w-[62px]">
                  {finalQrCode ? (
                    <img
                      src={finalQrCode}
                      alt="QR Code Tra Cứu"
                      data-qr="true"
                      style={{ width: '56px', height: '56px', objectFit: 'contain' }}
                      className="w-14 h-14 object-contain shrink-0"
                      loading="eager"
                      decoding="sync"
                    />
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center bg-slate-50 text-[10px] text-slate-400 font-mono">
                      QR
                    </div>
                  )}
                  <span className="text-[9.5px] font-mono text-sky-800 font-extrabold mt-0.5 tracking-tight">QR Tra Cứu</span>
                </div>
              </div>
            ) : (
              /* MINI HEADER CHO TRANG 2 TRỞ ĐI */
              <div 
                data-avoid-break="true" 
                className="header-mini flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2.5 gap-4"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #cbd5e1',
                  paddingBottom: '6px',
                  marginBottom: '10px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div 
                  className="flex items-center space-x-2.5 shrink-0"
                  style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', flexShrink: 0 }}
                >
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
                    <span 
                      className="font-extrabold text-[13px] text-sky-950 uppercase tracking-tight block leading-tight"
                      style={{ fontWeight: 800, fontSize: '13px', color: '#082f49', textTransform: 'uppercase', lineHeight: '1.2' }}
                    >
                      {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
                    </span>
                    <span 
                      className="text-[10.5px] text-slate-500 font-medium leading-none"
                      style={{ fontSize: '10.5px', color: '#64748b' }}
                    >
                      Hotline: {clinicInfo.phone || '032.855.3773'}
                    </span>
                  </div>
                </div>

                <div 
                  className="text-right shrink-0 leading-tight"
                  style={{ textAlign: 'right', flexShrink: 0, lineHeight: '1.25' }}
                >
                  <div className="text-[12.5px] text-slate-700">
                    Bệnh nhân: <strong className="text-red-600 font-bold uppercase text-[13px]" style={{ color: '#dc2626', fontWeight: 'bold' }}>{patient.name}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5" style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                    Mã BN: <strong className="text-slate-800" style={{ color: '#1e293b' }}>{patient.code}</strong> • Số BP: <strong className="text-red-600 font-bold" style={{ color: '#dc2626', fontWeight: 'bold' }}>{patient.sampleCode || patient.code}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* 2. TIÊU ĐỀ PHIẾU (CHỈ HIỆN Ở TRANG 1) */}
            {page.isFirstPage && (
              <div data-avoid-break="true" className="text-center my-1.5">
                <h2 className="text-[22px] font-black text-sky-950 uppercase tracking-wide">
                  PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM
                </h2>
              </div>
            )}

            {/* 3. BẢNG THÔNG TIN BỆNH NHÂN CHUẨN 12 TRƯỜNG (CHỈ HIỆN Ở TRANG 1) */}
            {page.isFirstPage && (
              <div data-avoid-break="true" className="patient-table-section border border-slate-300 rounded mb-2.5 bg-white">
                <table className="w-full table-fixed text-[13px] border-collapse">
                  <colgroup>
                    <col className="w-[15%]" />
                    <col className="w-[35%]" />
                    <col className="w-[18%]" />
                    <col className="w-[32%]" />
                  </colgroup>
                  <tbody>
                    {/* Hàng 1 */}
                    <tr>
                      <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Họ và tên:</td>
                      <td className="py-2 px-3 font-bold text-red-600 uppercase border-r border-b border-slate-300 align-middle truncate text-[14px] leading-snug">{patient.name || '---'}</td>
                      <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Năm sinh:</td>
                      <td className="py-2 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle truncate leading-snug">{patient.dob || '---'}</td>
                    </tr>
                    {/* Hàng 2 */}
                    <tr>
                      <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Giới tính:</td>
                      <td className="py-2 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.gender || 'Nam'}</td>
                      <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Số điện thoại:</td>
                      <td className="py-2 px-3 font-mono text-slate-800 border-b border-slate-300 align-middle leading-snug">{patient.phone || '---'}</td>
                    </tr>
                    {/* Hàng 3: Địa chỉ span 3 cột */}
                    <tr>
                      <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Địa chỉ:</td>
                      <td colSpan={3} className="py-2 px-3 text-slate-800 border-b border-slate-300 align-middle truncate leading-snug">{patient.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}</td>
                    </tr>
                    {/* Hàng 4 */}
                    <tr>
                      <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Bác sĩ chỉ định:</td>
                      <td className="py-2 px-3 font-bold text-sky-950 border-r border-b border-slate-300 align-middle truncate leading-snug">{patient.doctor || doctorName || 'BS. Trần Hoài Long'}</td>
                      <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">Số bệnh phẩm:</td>
                      <td className="py-2 px-3 font-mono font-bold text-red-600 border-b border-slate-300 align-middle text-[14px] leading-snug">{patient.sampleCode || patient.code}</td>
                    </tr>
                    {/* Hàng 5 */}
                    <tr>
                      <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G chỉ định:</td>
                      <td className="py-2 px-3 font-mono text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">{patient.orderedAt || currentDateStr}</td>
                      <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">T/G đóng phí:</td>
                      <td className="py-2 px-3 font-mono text-slate-700 border-b border-slate-300 align-middle leading-snug">{patient.paidAt || currentDateStr}</td>
                    </tr>
                    {/* Hàng 6 */}
                    <tr>
                      <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">T/G nhận mẫu:</td>
                      <td className="py-2 px-3 font-mono text-slate-700 border-r border-slate-300 align-middle leading-snug">{patient.receivedAt || currentDateStr}</td>
                      <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">T/G trả kết quả:</td>
                      <td className="py-2 px-3 font-mono text-slate-700 align-middle leading-snug">{patient.returnedAt || currentDateStr}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. BẢNG CHỈ SỐ XÉT NGHIỆM TRÊN TRANG HIỆN TẠI (TĂNG CHIỀU CAO HÀNG ĐỂ ĐỌC DỄ DÀNG) */}
            {page.entries.length !== 0 && <div className="border border-slate-300 rounded mb-2.5 bg-white overflow-hidden">
              <table className="w-full table-fixed text-left text-[13px] border-collapse">
                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[31%]" />
                  <col className="w-[13%]" />
                  <col className="w-[10%]" />
                  <col className="w-[17%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="bg-slate-100 text-slate-900 uppercase font-bold border-b-2 border-slate-300">
                  <tr>
                    <th className="py-2 px-1 text-center border-r border-slate-300 align-middle text-[11.5px] font-bold leading-tight">STT</th>
                    <th className="py-2 px-2.5 border-r border-slate-300 align-middle text-[11.5px] font-bold leading-tight">TÊN CHỈ SỐ XÉT NGHIỆM</th>
                    <th className="py-2 px-1 text-center border-r border-slate-300 align-middle text-[11.5px] font-bold leading-tight">KẾT QUẢ</th>
                    <th className="py-2 px-1 text-center border-r border-slate-300 align-middle text-[11.5px] font-bold leading-tight">ĐƠN VỊ</th>
                    <th className="py-2 px-1.5 text-center border-r border-slate-300 align-middle text-[11.5px] font-bold leading-tight">TRỊ SỐ THAM CHIẾU</th>
                    <th className="py-2 px-1 text-center border-r border-slate-300 align-middle text-[11.5px] font-bold leading-tight">THIẾT BỊ XỬ LÝ</th>
                    <th className="py-2 px-1 text-center align-middle text-[11.5px] font-bold leading-tight">GHI CHÚ</th>
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
                          <tr key={`cat-${eIdx}`} className="bg-sky-100/90 font-black text-sky-950 border-b border-slate-300">
                            <td colSpan={7} className="py-2 px-3 uppercase text-[13.5px] tracking-wide font-bold leading-snug">
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
                          displayNote.includes('H ') ||
                          displayNote.includes('L ') ||
                          /Độ\s*[1-6]/i.test(displayNote)
                        : false;
                      const isAbnormal = isAbnormalByNote || evalRes.status !== 'normal';

                      return (
                        <tr
                          key={`test-${t.code || eIdx}`}
                          className={`hover:bg-slate-50 transition-colors ${
                            isAbnormal ? 'bg-amber-50/60 font-semibold' : 'bg-white'
                          }`}
                        >
                          <td className="py-2 px-1 text-center font-mono text-slate-600 border-r border-slate-300 align-middle text-[13px] leading-snug">
                            {entry.idx}
                          </td>
                          <td className="py-2 px-2.5 font-semibold text-slate-900 border-r border-slate-300 align-middle text-[13px] leading-snug break-words">
                            {t.name}
                          </td>
                          <td
                            className={`py-2 px-1 text-center font-mono font-bold border-r border-slate-300 align-middle text-[13.5px] leading-snug ${
                              isAbnormal ? 'text-red-600' : 'text-slate-900'
                            }`}
                          >
                            {t.result || '---'}
                          </td>
                          <td className="py-2 px-1 text-center font-mono text-slate-700 border-r border-slate-300 align-middle text-[12.5px] leading-snug">
                            {t.unit || '---'}
                          </td>
                          <td className="py-2 px-1.5 text-center font-mono text-slate-700 border-r border-slate-300 align-middle text-[12.5px] leading-snug">
                            {t.refText || (t.refMin !== null && t.refMax !== null ? `${t.refMin} - ${t.refMax}` : '---')}
                          </td>
                          <td className="py-2 px-1 text-center text-[12px] text-slate-600 border-r border-slate-300 align-middle leading-snug">
                            {resolveTestEquipmentName(t, equipments, catalogItemEquipments)}
                          </td>
                          <td
                            className={`py-2 px-1 text-center text-[12px] font-bold align-middle leading-snug ${
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
}
            {/* 5. KHỐI KẾT LUẬN CỦA BÁC SĨ (CHỈ XUẤT HIỆN Ở TRANG CUỐI) */}
            {page.showConclusion && conclusion && (
              <div data-avoid-break="true" className="conclusion-section border border-sky-300 bg-sky-50/60 rounded p-2.5 mb-2 text-[13.5px] leading-snug">
                <span className="font-bold text-sky-950 uppercase tracking-wide">KẾT LUẬN / ĐỀ NGHỊ CỦA BÁC SĨ: </span>
                <span className="font-semibold text-slate-800">{conclusion}</span>
              </div>
            )}

            {/* 6. CHỮ KÝ VÀ DẤU BÁC SĨ (CHỈ XUẤT HIỆN Ở TRANG CUỐI - THIẾT LẬP NGAY DƯỚI CUỐI NỘI DUNG) */}
            {page.showSignature && (
              <div 
                data-avoid-break="true" 
                className="signature-section mt-2 pt-2 border-t border-slate-300"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
              >
                <div className="flex items-start justify-between text-center">
                  
                  {/* Bên trái: Chú thích & Lưu ý */}
                  <div className="text-left text-[11.5px] text-slate-600 space-y-0.5 max-w-[50%] leading-snug">
                    <p className="font-bold text-slate-800 uppercase text-[12px]">Lưu ý đối với bệnh nhân:</p>
                    <p>- Phiếu kết quả này chỉ có giá trị tại thời điểm xét nghiệm.</p>
                    <p>- Vui lòng mang phiếu này khi đến tái khám hoặc tư vấn bác sĩ chuyên khoa.</p>
                  </div>

                  {/* Bên phải: Chữ ký & Đóng dấu Phụ trách chuyên môn */}
                  <div className="text-center min-w-[220px] flex flex-col items-center">
                    <p className="text-[12.5px] text-slate-700 italic leading-normal pb-0.5">Ngày {currentDateStr}</p>
                    <p className="text-[13.5px] font-bold uppercase text-slate-900 my-1 tracking-wide leading-normal pb-0.5">PHỤ TRÁCH CHUYÊN MÔN</p>
                    <div 
                      className="h-20 w-[120px] flex items-center justify-center my-1.5 overflow-hidden mx-auto"
                      style={{ margin: '6px auto' }}
                    >
                      <img
                        src={currentStamp}
                        alt="Đã ký & Đóng dấu"
                        style={{ maxHeight: '80px', maxWidth: '120px', height: '80px', width: 'auto', objectFit: 'contain' }}
                        className="h-20 w-auto object-contain max-w-[120px]"
                        loading="eager"
                        decoding="sync"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = doctorStamp;
                        }}
                      />
                    </div>
                    <p className="text-[14px] font-bold text-slate-900 uppercase tracking-tight leading-normal pt-1 pb-0.5">
                      {clinicInfo.defaultDoctor || 'Nguyễn Thị Thành Trung'}
                    </p>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* 7. DÒNG PHÂN TRANG & BẢN QUYỀN CHÂN TRANG */}
          <div className="mt-auto pt-1 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 uppercase font-mono tracking-tight">
            <span>
              HỆ THỐNG XÉT NGHIỆM GOLAB • {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'} • HOTLINE: {clinicInfo.phone || '032.855.3773'}
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

