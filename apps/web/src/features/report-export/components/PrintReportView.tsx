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
  patient,
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
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', marginBottom: '6px' }}
                className="header-section flex items-center justify-between border-b-2 border-slate-300 pb-2 mb-1.5"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }} className="flex items-center space-x-3.5">
                  <div className="h-[68px] w-[138px] max-h-[68px] max-w-[138px] flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={currentLogo}
                      alt="GoLab Logo"
                      style={{ maxHeight: '68px', maxWidth: '138px', height: '68px', width: 'auto', objectFit: 'contain' }}
                      className="h-[68px] max-w-[138px] w-auto object-contain object-center shrink-0"
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
                    <p className="text-[12.5px] font-extrabold text-sky-800 uppercase tracking-widest leading-none mb-0.5">
                      HỆ THỐNG XÉT NGHIỆM GOLAB
                    </p>
                    <h1 className="text-[17px] font-black text-sky-950 uppercase tracking-tight leading-tight">
                      {safeClinic.name}
                    </h1>
                    <p className="text-[12.5px] text-slate-700 font-medium leading-normal mt-0.5">
                      ĐC: {safeClinic.address}
                    </p>
                    <p className="text-[12px] text-slate-700 font-medium leading-normal">
                      Website: <strong className="text-sky-800">{safeClinic.website}</strong> • Hotline: <strong className="text-sky-800">{safeClinic.phone}</strong>
                    </p>
                  </div>
                </div>

                {/* Khung QR Code bên phải Header */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', minWidth: '58px', flexShrink: 0 }}
                  className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded shadow-2xs shrink-0 min-w-[58px]"
                >
                  {finalQrCode ? (
                    <img
                      src={finalQrCode}
                      alt="QR Code Tra Cứu"
                      data-qr="true"
                      style={{ width: '52px', height: '52px', objectFit: 'contain' }}
                      className="w-[52px] h-[52px] object-contain shrink-0"
                      loading="eager"
                      decoding="sync"
                    />
                  ) : (
                    <div className="w-[52px] h-[52px] flex items-center justify-center bg-slate-50 text-[10px] text-slate-400 font-mono">
                      QR
                    </div>
                  )}
                  <span className="text-[9px] font-mono text-sky-800 font-extrabold mt-0.5 tracking-tight">QR Tra Cứu</span>
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
                    {/* Hàng 3: Địa chỉ span 3 cột */}
                    <tr>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Địa chỉ:</td>
                      <td colSpan={3} style={{ borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 text-slate-800 border-b border-slate-300 align-middle truncate leading-snug">{patient.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}</td>
                    </tr>
                    {/* Hàng 4 */}
                    <tr>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Bác sĩ chỉ định:</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-bold text-sky-950 border-r border-b border-slate-300 align-middle truncate leading-snug">{patient.doctor || doctorName || 'BS. Trần Hoài Long'}</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">Số bệnh phẩm:</td>
                      <td style={{ borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-mono font-bold text-red-600 border-b border-slate-300 align-middle text-[13.5px] leading-snug">{patient.sampleCode || patient.code}</td>
                    </tr>
                    {/* Hàng 5 */}
                    <tr>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G chỉ định:</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-mono text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">{patient.orderedAt || currentDateStr}</td>
                      <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">T/G đóng phí:</td>
                      <td style={{ borderBottom: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-mono text-slate-700 border-b border-slate-300 align-middle leading-snug">{patient.paidAt || currentDateStr}</td>
                    </tr>
                    {/* Hàng 6 */}
                    <tr>
                      <td style={{ borderRight: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">T/G nhận mẫu:</td>
                      <td style={{ borderRight: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 font-mono text-slate-700 border-r border-slate-300 align-middle leading-snug">{patient.receivedAt || currentDateStr}</td>
                      <td style={{ borderRight: '1px solid #cbd5e1' }} className="py-[5px] px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">T/G trả kết quả:</td>
                      <td className="py-[5px] px-2.5 font-mono text-slate-700 align-middle leading-snug">{patient.returnedAt || currentDateStr}</td>
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

