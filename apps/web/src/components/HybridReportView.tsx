import { useState, useEffect, useMemo, memo } from 'react';
import { evaluateResult } from '@domain/testResult';
import { generateQrCodeDataUrl } from '@infra/qrService';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import {
  Patient,
  SelectedTest,
  ClinicInfo,
  TestEquipment,
  CatalogItemEquipmentLink,
  AllergenGradingScale,
  TestPackage,
  resolveTestEquipmentName
} from '@domain/types';
import { isAllergenTest, getAllergenGradeClasses, getAllergenBadgeSvg } from '@domain/allergenDetector';
import { AllergenReportDomainService } from '@domain/services/AllergenReportDomainService';
import AllergenDetailPage from './allergenReport/AllergenDetailPage';

interface HybridReportViewProps {
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
  allergenScales?: AllergenGradingScale[];
  testPackages?: TestPackage[];
}

interface FlatEntry {
  type: 'category' | 'test';
  category: string;
  isContinued?: boolean;
  test?: SelectedTest;
  idx?: number;
}

function HybridReportView({
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
  catalogItemEquipments = [],
  allergenScales = [],
  testPackages = []
}: HybridReportViewProps) {
  const [autoQrCode, setAutoQrCode] = useState<string>(qrCodeDataUrl || '');

  // 1. Phân tách danh sách chỉ số thường và chỉ số dị nguyên
  const { regularTests, allergenTests } = useMemo(() => {
    const regular: SelectedTest[] = [];
    const allergen: SelectedTest[] = [];
    for (const t of selectedTests) {
      if (isAllergenTest(t)) {
        allergen.push(t);
      } else {
        regular.push(t);
      }
    }
    return { regularTests: regular, allergenTests: allergen };
  }, [selectedTests]);

  // 2. Xây dựng DTO Dị nguyên chuyên sâu
  const allergenReportDTO = useMemo(() => {
    return AllergenReportDomainService.buildReportDTO({
      tests: allergenTests,
      testPackages,
      customScales: allergenScales
    });
  }, [allergenTests, testPackages, allergenScales]);

  // 3. Tự động sinh mã QR tra cứu trực tuyến
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

  // 4. Gom nhóm các chỉ số thường theo danh mục
  const groupedCategories: Record<string, SelectedTest[]> = {};
  regularTests.forEach((t) => {
    const cat = t.category || 'XÉT NGHIỆM KHÁC';
    if (!groupedCategories[cat]) {
      groupedCategories[cat] = [];
    }
    groupedCategories[cat].push(t);
  });

  const flatRegularEntries: FlatEntry[] = [];
  Object.entries(groupedCategories).forEach(([cat, items]) => {
    flatRegularEntries.push({ type: 'category', category: cat });
    items.forEach((item, i) => {
      flatRegularEntries.push({ type: 'test', category: cat, test: item, idx: i + 1 });
    });
  });

  // 5. Tính toán phân trang Phần 1 (Xét nghiệm thường + Khối Tóm tắt Dị nguyên dương tính)
  const PAGE_MAX_USABLE_HEIGHT = 880;
  const HEADER_PATIENT_HEIGHT = 285;
  const SIGNATURE_BLOCK_HEIGHT = 165;
  const getEntryHeight = (entry: FlatEntry) => (entry.type === 'category' ? 32 : 28);
  const getConclusionHeight = (text?: string) => {
    if (!text || text.trim() === '') return 0;
    const lines = Math.ceil(text.length / 95);
    return 38 + Math.max(1, lines) * 18;
  };

  const conclusionH = getConclusionHeight(conclusion);
  const positiveList = allergenReportDTO.positiveList;
  const positiveSummaryBlockHeight = positiveList.length > 0
    ? 50 + positiveList.length * 28
    : 55; // Khi âm tính toàn bộ thì khoảng 55px

  // Thuật toán chia trang Phần 1
  const regularPages: FlatEntry[][] = [];
  let currentPageEntries: FlatEntry[] = [];
  let currentAccumulatedHeight = HEADER_PATIENT_HEIGHT;

  for (let i = 0; i < flatRegularEntries.length; i++) {
    const entry = flatRegularEntries[i];
    const entryH = getEntryHeight(entry);

    if (currentAccumulatedHeight + entryH > PAGE_MAX_USABLE_HEIGHT && currentPageEntries.length > 0) {
      regularPages.push(currentPageEntries);
      currentPageEntries = [];
      currentAccumulatedHeight = 50; // Padding trang kế tiếp
    }

    currentPageEntries.push(entry);
    currentAccumulatedHeight += entryH;
  }

  if (currentPageEntries.length > 0) {
    regularPages.push(currentPageEntries);
  }
  if (regularPages.length === 0) {
    regularPages.push([]);
  }

  // Kiểm tra xem trang cuối cùng của phần thường có đủ chỗ cho: Khối Tóm tắt Dị nguyên + Kết luận + Chữ ký không
  const lastPageRegularIndex = regularPages.length - 1;
  let lastPageUsedHeight = regularPages.length === 1 ? HEADER_PATIENT_HEIGHT : 50;
  regularPages[lastPageRegularIndex].forEach((e) => {
    lastPageUsedHeight += getEntryHeight(e);
  });

  const summaryAndSignatureHeight = positiveSummaryBlockHeight + conclusionH + SIGNATURE_BLOCK_HEIGHT;
  const isSummaryFitsOnLastRegularPage = lastPageUsedHeight + summaryAndSignatureHeight <= PAGE_MAX_USABLE_HEIGHT;

  if (!isSummaryFitsOnLastRegularPage) {
    // Tự động đẩy khối Tóm tắt & Chữ ký sang một trang nối tiếp của phần thường
    regularPages.push([]);
  }

  const totalRegularPagesCount = regularPages.length;
  const totalDetailPagesCount = allergenReportDTO.detailPages.length;
  const totalAllPagesCount = totalRegularPagesCount + totalDetailPagesCount + 1; // +1 cho Trang Cẩm Nang & Diễn Giải

  return (
    <div id={elementId} className="w-[210mm] max-w-[210mm] mx-auto bg-slate-100 print:bg-white text-slate-900 print:p-0">
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PHẦN 1: CÁC TRANG XÉT NGHIỆM THƯỜNG & TÓM TẮT DỊ NGUYÊN DƯƠNG TÍNH */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {regularPages.map((pageEntries, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastRegularPage = pageIdx === regularPages.length - 1;

        return (
          <div
            key={`reg-page-${pageIdx}`}
            data-page="true"
            className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 p-8 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-6 flex flex-col justify-between box-border"
            style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
          >
            <div>
              {/* HEADER PHÒNG KHÁM (CHỈ IN TRÊN TRANG 1) */}
              {isFirstPage ? (
                <div>
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-2">
                    <div className="flex items-center space-x-3">
                      {currentLogo ? (
                        <img
                          src={currentLogo}
                          alt="Logo"
                          className="h-16 w-auto object-contain max-w-[130px]"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-sky-900 text-white font-black flex items-center justify-center rounded-lg text-xl tracking-wider">
                          GOLAB
                        </div>
                      )}
                      <div>
                        <h1 className="text-[17px] font-black uppercase text-sky-950 tracking-tight leading-none mb-1">
                          {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM Y KHOA GOLAB'}
                        </h1>
                        <p className="text-[11.5px] text-slate-600 leading-tight">
                          Địa chỉ: {clinicInfo.address || 'Đồng Hới, Quảng Bình'}
                        </p>
                        <p className="text-[11.5px] text-slate-600 leading-tight">
                          Hotline: <strong className="text-slate-800">{clinicInfo.phone || '032.855.3773'}</strong> {clinicInfo.website ? `| Website: ${clinicInfo.website}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      {finalQrCode && (
                        <div className="flex flex-col items-center">
                          <img
                            src={finalQrCode}
                            alt="QR Code tra cứu"
                            className="w-16 h-16 object-contain border border-slate-300 rounded p-0.5 bg-white shadow-xs"
                          />
                          <span className="text-[9.5px] text-slate-500 font-mono mt-0.5 tracking-tighter">
                            Quét tra cứu online
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TIÊU ĐỀ PHIẾU CHUẨN */}
                  <div className="text-center mb-2.5">
                    <h2 className="text-[18px] font-black text-slate-900 uppercase tracking-wide">
                      PHIẾU KẾT QUẢ XÉT NGHIỆM
                    </h2>
                  </div>

                  {/* BẢNG THÔNG TIN BỆNH NHÂN 12 TRƯỜNG */}
                  <div className="border border-slate-300 rounded mb-3 bg-slate-50/40 text-[12px]">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-2 font-semibold text-slate-600 w-[18%]">Họ và tên:</td>
                          <td className="py-1 px-2 font-bold text-red-600 uppercase text-[13px] w-[32%]">
                            {patient.name || '---'}
                          </td>
                          <td className="py-1 px-2 font-semibold text-slate-600 w-[18%]">Năm sinh / Tuổi:</td>
                          <td className="py-1 px-2 font-bold text-slate-800 w-[32%]">
                            {patient.dob || '---'}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-2 font-semibold text-slate-600">Giới tính:</td>
                          <td className="py-1 px-2 font-bold text-slate-800">
                            {patient.gender || 'Nam'}
                          </td>
                          <td className="py-1 px-2 font-semibold text-slate-600">Điện thoại:</td>
                          <td className="py-1 px-2 text-slate-800 font-mono">
                            {patient.phone || '---'}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-2 font-semibold text-slate-600">Địa chỉ:</td>
                          <td colSpan={3} className="py-1 px-2 text-slate-800">
                            {patient.address || '---'}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-2 font-semibold text-slate-600">Chẩn đoán:</td>
                          <td colSpan={3} className="py-1 px-2 text-slate-800 italic">
                            {patient.diagnosis || 'Kiểm tra sức khỏe tổng quát & Tầm soát dị ứng'}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-2 font-semibold text-slate-600">Số bệnh phẩm:</td>
                          <td className="py-1 px-2 font-bold text-red-600 font-mono">
                            {patient.sampleCode || patient.code || '---'}
                          </td>
                          <td className="py-1 px-2 font-semibold text-slate-600">Tình trạng mẫu:</td>
                          <td className="py-1 px-2 font-bold text-emerald-700">
                            {patient.sampleStatus || 'Đạt tiêu chuẩn'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 font-semibold text-slate-600">Thời gian lấy mẫu:</td>
                          <td className="py-1 px-2 text-slate-700">
                            {patient.receivedAt || currentDateStr}
                          </td>
                          <td className="py-1 px-2 font-semibold text-slate-600">Thời gian trả KQ:</td>
                          <td className="py-1 px-2 text-slate-700">
                            {patient.returnedAt || currentDateStr}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2.5 text-[11px] text-slate-600">
                  <div className="font-bold uppercase text-slate-800">
                    Bệnh nhân: <span className="text-red-600">{patient.name}</span> • Số BP: {patient.sampleCode || patient.code}
                  </div>
                  <div className="italic">
                    PHIẾU KẾT QUẢ XÉT NGHIỆM (Tiếp theo)
                  </div>
                </div>
              )}

              {/* BẢNG XÉT NGHIỆM THƯỜNG (NẾU CÓ CHỈ SỐ Ở TRANG NÀY) */}
              {pageEntries.length > 0 && (
                <div className="border border-slate-300 rounded mb-3 bg-white">
                  <table className="w-full text-[12px] border-collapse">
                    <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-300">
                      <tr>
                        <th className="py-1.5 px-2 w-8 text-center border-r border-slate-300 align-middle">STT</th>
                        <th className="py-1.5 px-2.5 text-left border-r border-slate-300 align-middle">TÊN XÉT NGHIỆM</th>
                        <th className="py-1.5 px-2 w-28 text-center border-r border-slate-300 align-middle">KẾT QUẢ</th>
                        <th className="py-1.5 px-2 w-32 text-center border-r border-slate-300 align-middle">TRỊ SỐ THAM CHIẾU</th>
                        <th className="py-1.5 px-1.5 w-16 text-center border-r border-slate-300 align-middle">ĐƠN VỊ</th>
                        <th className="py-1.5 px-2 w-44 text-left align-middle">THIẾT BỊ ĐO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pageEntries.map((entry, idx) => {
                        if (entry.type === 'category') {
                          return (
                            <tr key={`cat-${entry.category}-${idx}`} className="bg-slate-100/90 font-bold text-sky-950">
                              <td colSpan={6} className="py-1.5 px-2.5 uppercase tracking-wide text-[11.5px] border-y border-slate-300">
                                ♦ {entry.category}
                              </td>
                            </tr>
                          );
                        }

                        const t = entry.test!;
                        const evaluation = evaluateResult(t.result, t.refMin, t.refMax);
                        const isAbnormal = evaluation.status === 'high' || evaluation.status === 'low';
                        const resolvedEquipment = resolveTestEquipmentName(t, equipments, catalogItemEquipments);

                        return (
                          <tr key={`test-${t.code}-${idx}`} className={`hover:bg-slate-50 ${isAbnormal ? 'bg-red-50/40' : ''}`}>
                            <td className="py-1 px-2 text-center font-mono text-slate-500 border-r border-slate-200">{entry.idx}</td>
                            <td className="py-1 px-2.5 font-semibold text-slate-900 border-r border-slate-200">
                              {t.name}
                              {t.scientific && <span className="text-[10px] text-slate-500 italic block font-normal">{t.scientific}</span>}
                            </td>
                            <td className={`py-1 px-2 text-center font-mono text-[13px] border-r border-slate-200 ${isAbnormal ? 'text-red-600 font-black' : 'text-slate-900 font-bold'}`}>
                              {t.result || '---'}
                            </td>
                            <td className="py-1 px-2 text-center font-mono text-slate-600 text-[11.5px] border-r border-slate-200">
                              {t.refText || (t.refMin !== undefined && t.refMax !== undefined ? `${t.refMin} - ${t.refMax}` : '---')}
                            </td>
                            <td className="py-1 px-1.5 text-center font-mono text-slate-600 text-[11.5px] border-r border-slate-200">{t.unit || '---'}</td>
                            <td className="py-1 px-2 text-slate-600 text-[11px] truncate max-w-[160px]">{resolvedEquipment}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* KHỐI TỔNG HỢP CÁC DỊ NGUYÊN DƯƠNG TÍNH (NẰM Ở TRANG CUỐI CỦA PHẦN THƯỜNG) */}
              {/* ───────────────────────────────────────────────────────────── */}
              {isLastRegularPage && (
                <div className="mt-2.5 mb-3 border-2 border-red-200 bg-red-50/20 rounded-lg p-2.5">
                  <div className="flex items-center justify-between border-b border-red-200 pb-1 mb-1.5">
                    <h3 className="text-[13px] font-black text-red-700 uppercase tracking-wide flex items-center gap-1.5">
                      <span>⚡ TỔNG HỢP CÁC DỊ NGUYÊN DƯƠNG TÍNH (PHẢN ỨNG)</span>
                    </h3>
                    <span className="text-[10.5px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-red-200 font-mono">
                      Tầm soát {allergenReportDTO.totalCount} Dị Nguyên
                    </span>
                  </div>

                  {positiveList.length > 0 ? (
                    <div className="bg-white border border-slate-300 rounded overflow-hidden">
                      <table className="w-full text-[11.5px] border-collapse">
                        <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                          <tr>
                            <th className="py-1 px-1 w-7 text-center border-r border-slate-300">TT</th>
                            <th className="py-1 px-1.5 w-12 text-center border-r border-slate-300">CODE</th>
                            <th className="py-1 px-2 text-left border-r border-slate-300">TÊN DỊ NGUYÊN</th>
                            <th className="py-1 px-2 w-32 text-left border-r border-slate-300">ĐƯỜNG DỊ ỨNG</th>
                            <th className="py-1 px-1.5 w-20 text-center border-r border-slate-300">BÌNH THƯỜNG</th>
                            <th className="py-1 px-1.5 w-20 text-center border-r border-slate-300">KẾT QUẢ (IU/ml)</th>
                            <th className="py-1 px-1 w-10 text-center border-r border-slate-300">ĐỘ (+)</th>
                            <th className="py-1 px-2 text-left">MỨC ĐỘ PHẢN ỨNG</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {positiveList.map((item, pIdx) => {
                            const gradeStyle = getAllergenGradeClasses(item.grade, item.isTIgE, item.isPositive);
                            return (
                              <tr key={`pos-${item.code}-${pIdx}`} className={gradeStyle.rowBg}>
                                <td className="py-1 px-1 text-center font-mono text-slate-500 border-r border-slate-200">{pIdx + 1}</td>
                                <td className="py-1 px-1.5 text-center font-mono font-bold text-sky-800 border-r border-slate-200">{item.code}</td>
                                <td className={`py-1 px-2 font-bold ${gradeStyle.nameColor} border-r border-slate-200`}>
                                  {item.name} {item.allergenName && item.allergenName !== item.name ? <span className="italic font-normal text-slate-600">({item.allergenName})</span> : ''}
                                </td>
                                <td className="py-1 px-2 text-slate-600 text-[11px] border-r border-slate-200">{item.route}</td>
                                <td className="py-1 px-1.5 text-center font-mono text-slate-600 border-r border-slate-200">{item.normalRef}</td>
                                <td className={`py-1 px-1.5 text-center font-mono font-bold border-r border-slate-200 ${gradeStyle.textColor}`}>
                                  {item.result}
                                </td>
                                <td className="py-1 px-1 text-center border-r border-slate-200 align-middle">
                                  {item.isTIgE ? '' : (
                                    <img
                                      src={getAllergenBadgeSvg(item.grade, 16)}
                                      width={16}
                                      height={16}
                                      alt={`Độ ${item.grade}`}
                                      className="inline-block align-middle"
                                    />
                                  )}
                                </td>
                                <td className={`py-1 px-2 font-bold ${gradeStyle.textColor} text-[11px]`}>
                                  {item.isTIgE ? (item.isPositive ? 'Tăng cao' : 'Bình thường') : (item.note || `Dương tính (Độ ${item.grade})`)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-300 rounded p-2 text-center text-emerald-900 font-bold text-[12px]">
                      ✓ Âm tính (Độ 0 - Không phản ứng) với toàn bộ các dị nguyên trong gói tầm soát.
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 italic mt-1 text-right">
                    * Chi tiết toàn bộ các dị nguyên và nồng độ định lượng được trình bày tại Trang {totalRegularPagesCount + 1} trở đi.
                  </p>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* KHỐI KẾT LUẬN VÀ CHỮ KÝ BÁC SĨ (NẰM Ở CUỐI PHẦN XÉT NGHIỆM THƯỜNG) */}
              {/* ───────────────────────────────────────────────────────────── */}
              {isLastRegularPage && (
                <div className="mt-2">
                  {conclusion && conclusion.trim() !== '' && (
                    <div className="border border-slate-300 rounded p-2 mb-3 bg-slate-50/50 text-[12px]">
                      <span className="font-bold text-slate-800">KẾT LUẬN &amp; LỜI DẶN: </span>
                      <span className="text-slate-800 leading-snug">{conclusion}</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between text-[12px] pt-1">
                    <div className="text-center w-[40%]">
                      <p className="font-bold text-slate-800 uppercase text-[11.5px]">BÁC SĨ CHỈ ĐỊNH</p>
                      <p className="text-slate-500 italic text-[10.5px] mt-0.5">(Ký và ghi rõ họ tên)</p>
                      <div className="h-14"></div>
                      <p className="font-bold text-slate-900 text-[12.5px]">{doctorName || 'BS. Chỉ định'}</p>
                    </div>

                    <div className="text-center w-[45%]">
                      <p className="text-slate-600 italic text-[11.5px] mb-0.5">
                        Ngày {currentDateStr.split('/')[0] || new Date().getDate()} tháng {currentDateStr.split('/')[1] || (new Date().getMonth() + 1)} năm {currentDateStr.split('/')[2] || new Date().getFullYear()}
                      </p>
                      <p className="font-bold text-slate-900 uppercase text-[11.5px]">PHỤ TRÁCH CHUYÊN MÔN</p>
                      <p className="text-slate-500 italic text-[10.5px] mt-0.5">(Ký, đóng dấu)</p>
                      <div className="h-14 relative flex items-center justify-center">
                        {currentStamp && (
                          <img
                            src={currentStamp}
                            alt="Con dấu & Chữ ký"
                            className="h-16 w-auto object-contain absolute -top-1"
                          />
                        )}
                      </div>
                      <p className="font-bold text-slate-900 text-[12.5px]">
                        {clinicInfo.defaultDoctor || 'Nguyễn Thị Thành Trung'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER TRANG PHẦN THƯỜNG */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200 pt-1.5 font-mono">
              <div>GOLAB CLINICAL LABORATORY • PHIẾU XÉT NGHIỆM Y KHOA &amp; DỊ NGUYÊN</div>
              <div>TRANG {pageIdx + 1} / {totalAllPagesCount}</div>
            </div>
          </div>
        );
      })}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PHẦN 2: CÁC TRANG CHI TIẾT TOÀN BỘ DỊ NGUYÊN (DETAIL PAGES) */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {allergenReportDTO.detailPages.map((pageItems, detailIdx) => {
        const actualPageNum = totalRegularPagesCount + detailIdx + 1;

        return (
          <div key={`allergen-detail-${detailIdx}`} className="relative">
            <AllergenDetailPage
              pageItems={pageItems}
              pageIdx={detailIdx}
              totalDetailPages={totalDetailPagesCount}
              totalCount={allergenReportDTO.totalCount}
            />
            {/* Override Footer với số trang đồng nhất toàn bộ tài liệu */}
            <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200 pt-1.5 font-mono bg-white print:bottom-5 print:left-6 print:right-6">
              <div>GOLAB ALLERGEN PROFILE • BẢNG CHI TIẾT DỊ NGUYÊN</div>
              <div>TRANG {actualPageNum} / {totalAllPagesCount}</div>
            </div>
          </div>
        );
      })}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PHẦN 3: TRANG DIỄN GIẢI THANG ĐO 6 ĐỘ & CẨM NANG HƯỚNG DẪN DỊ ỨNG */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div
        data-page="true"
        className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 p-8 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-6 flex flex-col justify-between box-border"
        style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
      >
        <div>
          {/* Header Bảng Diễn Giải Thang Đo 6 Độ */}
          <div className="text-center mb-4 pt-1">
            <h2 className="text-[17px] font-black text-slate-900 uppercase tracking-wide">
              DIỄN GIẢI THANG PHÂN LOẠI ĐỘ DƯƠNG TÍNH &amp; HƯỚNG DẪN XỬ TRÍ
            </h2>
            <p className="text-[12px] text-slate-600 italic">
              (Theo tiêu chuẩn phân loại định lượng Kháng thể IgE của Viện Dị Ứng Quốc Tế)
            </p>
          </div>

          {/* Bảng Diễn Giải 6 Độ */}
          <div className="border border-slate-300 rounded mb-4 bg-white overflow-hidden">
            <table className="w-full text-[12px] border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-300">
                <tr>
                  <th className="py-2 px-2 w-14 text-center border-r border-slate-300">ĐỘ (+)</th>
                  <th className="py-2 px-3 w-28 text-center border-r border-slate-300">NỒNG ĐỘ (IU/ml)</th>
                  <th className="py-2 px-3 text-left border-r border-slate-300">MỨC ĐỘ PHẢN ỨNG</th>
                  <th className="py-2 px-3 text-left">BIỂU HIỆN &amp; KHUYẾN NGHỊ LÂM SÀNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-white">
                  <td className="py-1.5 px-2 text-center font-bold font-mono border-r border-slate-200">0</td>
                  <td className="py-1.5 px-3 text-center font-mono text-slate-600 border-r border-slate-200">&lt; 0,35</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200">Không có phản ứng (Âm tính)</td>
                  <td className="py-1.5 px-3 text-slate-600 text-[11.5px]">Không phát hiện kháng thể IgE đặc hiệu với dị nguyên này.</td>
                </tr>
                <tr className="bg-amber-50/40">
                  <td className="py-1.5 px-2 text-center font-bold font-mono text-amber-800 border-r border-slate-200 flex items-center justify-center">
                    <img src={getAllergenBadgeSvg(1, 16)} width={16} height={16} alt="Độ 1" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono text-slate-700 border-r border-slate-200">0,35 - 0,69</td>
                  <td className="py-1.5 px-3 font-bold text-amber-800 border-r border-slate-200">Phản ứng Yếu</td>
                  <td className="py-1.5 px-3 text-slate-600 text-[11.5px]">Nồng độ kháng thể thấp, có thể có triệu chứng nhẹ khi tiếp xúc lượng lớn.</td>
                </tr>
                <tr className="bg-amber-50/70">
                  <td className="py-1.5 px-2 text-center font-bold font-mono text-amber-900 border-r border-slate-200 flex items-center justify-center">
                    <img src={getAllergenBadgeSvg(2, 16)} width={16} height={16} alt="Độ 2" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono text-slate-700 border-r border-slate-200">0,70 - 3,49</td>
                  <td className="py-1.5 px-3 font-bold text-amber-900 border-r border-slate-200">Phản ứng Trung bình</td>
                  <td className="py-1.5 px-3 text-slate-600 text-[11.5px]">Có phản ứng dị ứng rõ ràng, nên hạn chế tiếp xúc trực tiếp nguồn dị nguyên.</td>
                </tr>
                <tr className="bg-red-50/50">
                  <td className="py-1.5 px-2 text-center font-bold font-mono text-red-800 border-r border-slate-200 flex items-center justify-center">
                    <img src={getAllergenBadgeSvg(3, 16)} width={16} height={16} alt="Độ 3" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono text-slate-700 border-r border-slate-200">3,50 - 17,49</td>
                  <td className="py-1.5 px-3 font-bold text-red-800 border-r border-slate-200">Phản ứng Khá mạnh</td>
                  <td className="py-1.5 px-3 text-slate-600 text-[11.5px]">Triệu chứng dị ứng lâm sàng điển hình (ngứa, mày đay, viêm mũi, khó thở).</td>
                </tr>
                <tr className="bg-red-50/80">
                  <td className="py-1.5 px-2 text-center font-bold font-mono text-red-900 border-r border-slate-200 flex items-center justify-center">
                    <img src={getAllergenBadgeSvg(4, 16)} width={16} height={16} alt="Độ 4" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono text-slate-700 border-r border-slate-200">17,50 - 49,99</td>
                  <td className="py-1.5 px-3 font-bold text-red-900 border-r border-slate-200">Phản ứng Mạnh</td>
                  <td className="py-1.5 px-3 text-slate-600 text-[11.5px]">Cần kiêng tuyệt đối nguồn dị nguyên và tuân thủ phác đồ của bác sĩ.</td>
                </tr>
                <tr className="bg-red-100/60">
                  <td className="py-1.5 px-2 text-center font-bold font-mono text-red-950 border-r border-slate-200 flex items-center justify-center">
                    <img src={getAllergenBadgeSvg(5, 16)} width={16} height={16} alt="Độ 5" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono text-slate-700 border-r border-slate-200">50,00 - 99,99</td>
                  <td className="py-1.5 px-3 font-bold text-red-950 border-r border-slate-200">Phản ứng Rất mạnh</td>
                  <td className="py-1.5 px-3 text-slate-600 text-[11.5px]">Nguy cơ phản ứng dị ứng cấp tính nghiêm trọng khi tiếp xúc.</td>
                </tr>
                <tr className="bg-red-100">
                  <td className="py-1.5 px-2 text-center font-bold font-mono text-red-950 border-r border-slate-200 flex items-center justify-center">
                    <img src={getAllergenBadgeSvg(6, 16)} width={16} height={16} alt="Độ 6" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono text-slate-700 border-r border-slate-200">&ge; 100,0</td>
                  <td className="py-1.5 px-3 font-black text-red-950 border-r border-slate-200">Phản ứng Cực mạnh</td>
                  <td className="py-1.5 px-3 text-slate-600 text-[11.5px]">Nguy cơ sốc phản vệ và dị ứng toàn thân nguy hiểm. Cần can thiệp chuyên khoa.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cẩm Nang Hướng Dẫn Phòng Ngừa Dị Ứng */}
          <div className="border border-slate-300 rounded p-3.5 bg-slate-50/50 text-[12.5px] leading-relaxed text-slate-800 text-justify space-y-2">
            <h4 className="font-bold text-red-700 uppercase text-[13px] mb-1">
              CẨM NANG HƯỚNG DẪN DÀNH CHO NGƯỜI CÓ CƠ ĐỊA DỊ ỨNG:
            </h4>
            <p>
              <strong>1. Cách ly nguồn dị ứng:</strong> Loại bỏ hoặc hạn chế tối đa tiếp xúc với các dị nguyên có kết quả dương tính (Độ 1 - 6). Tránh ăn thực phẩm dị ứng và các chế phẩm có thành phần liên quan.
            </p>
            <p>
              <strong>2. Vệ sinh môi trường sống:</strong> Thường xuyên giặt giũ chăn ga gối đệm bằng nước nóng, dùng máy hút bụi mạt bụi nhà, giữ nhà cửa thông thoáng và hạn chế nuôi chó mèo trong nhà nếu có dị ứng lông thú.
            </p>
            <p>
              <strong>3. Phòng ngừa phản ứng chéo:</strong> Một số dị nguyên đường thở (như phấn hoa, mạt bụi) có thể phản ứng chéo với một số loại trái cây, hạt hoặc hải sản. Cần lưu ý khi có biểu hiện ngứa môi, sưng họng khi ăn uống.
            </p>
            <p>
              <strong>4. Tư vấn y khoa:</strong> Kết quả xét nghiệm cần được kết hợp với biểu hiện lâm sàng thực tế của bệnh nhân. Vui lòng mang phiếu xét nghiệm đến bác sĩ chuyên khoa Dị ứng - Miễn dịch lâm sàng để được tư vấn phác đồ điều trị phù hợp nhất.
            </p>
          </div>
        </div>

        {/* Footer Trang Hướng Dẫn */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200 pt-1.5 font-mono">
          <div>GOLAB CLINICAL LABORATORY • HƯỚNG DẪN DIỄN GIẢI KẾT QUẢ DỊ NGUYÊN</div>
          <div>TRANG {totalAllPagesCount} / {totalAllPagesCount}</div>
        </div>
      </div>
    </div>
  );
}

export default memo(HybridReportView);
