import { evaluateResult } from '@domain/testResult';
import { downloadQrCodeImage } from '@infra/qrService';
import { Download } from 'lucide-react';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import { Patient, SelectedTest, ClinicInfo } from '@domain/types';

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
}

interface FlatEntry {
  type: 'category' | 'test';
  category: string;
  isContinued?: boolean;
  test?: SelectedTest;
  idx?: number;
}

export default function PrintReportView({
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
  }
}: PrintReportViewProps) {
  const tests = selectedTests || [];
  const finalQrCode = qrCodeDataUrl || qrCodeUrl;
  const currentLogo = clinicInfo?.logoUrl || golabLogo;
  const currentStamp = clinicInfo?.stampUrl || doctorStamp;

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

  // 3. Phân chia trang thông minh (Smart Multi-page Pagination)
  // Nếu có tối đa 8 dòng và có kết luận, hoặc 9 dòng không có kết luận -> Giữ 1 trang duy nhất
  const MAX_SINGLE_PAGE_ROWS = conclusion ? 8 : 9;

  const pages: Array<{
    isFirstPage: boolean;
    isLastPage: boolean;
    entries: FlatEntry[];
    showConclusion: boolean;
    showSignature: boolean;
  }> = [];

  if (flatEntries.length <= MAX_SINGLE_PAGE_ROWS || tests.length === 0) {
    // TH1: Toàn bộ nội dung nằm gọn trên 1 trang duy nhất
    pages.push({
      isFirstPage: true,
      isLastPage: true,
      entries: flatEntries,
      showConclusion: Boolean(conclusion),
      showSignature: true
    });
  } else {
    // TH2: Độ dài vượt quá 1 trang -> Chia thành nhiều trang rõ ràng, không bị đè chữ ký
    let remaining = [...flatEntries];
    let pageIdx = 0;

    while (remaining.length > 0) {
      pageIdx++;

      if (pageIdx === 1) {
        // Trang 1: Chứa Header đầy đủ + Thông tin bệnh nhân 12 trường
        // Sức chứa tối đa khoảng 7-9 dòng để không chạm vào lề dưới
        let takeCount = Math.min(8, remaining.length);
        // Tối ưu điểm ngắt trang: nếu có category header từ dòng 5 đến 8 thì ngắt ngay trước category đó
        for (let i = 5; i <= takeCount; i++) {
          if (i < remaining.length && remaining[i].type === 'category') {
            takeCount = i;
            break;
          }
        }

        const chunk = remaining.slice(0, takeCount);
        remaining = remaining.slice(takeCount);

        pages.push({
          isFirstPage: true,
          isLastPage: false,
          entries: chunk,
          showConclusion: false,
          showSignature: false
        });
      } else {
        // Các trang tiếp theo (Trang 2, 3...)
        // Kiểm tra xem số dòng còn lại có vừa trên 1 trang cuối (kèm Chữ ký & Kết luận) không
        const MAX_FINAL_PAGE_ROWS = conclusion ? 10 : 12;

        if (remaining.length <= MAX_FINAL_PAGE_ROWS) {
          // Trang cuối cùng kèm Khối kết luận & Chữ ký
          const chunk = [...remaining];
          // Nếu dòng đầu tiên của trang mới là test mà chưa có header category, gắn thêm category continued
          if (chunk[0] && chunk[0].type === 'test') {
            chunk.unshift({
              type: 'category',
              category: `${chunk[0].category} (tiếp theo)`,
              isContinued: true
            });
          }
          remaining = [];

          pages.push({
            isFirstPage: false,
            isLastPage: true,
            entries: chunk,
            showConclusion: Boolean(conclusion),
            showSignature: true
          });
        } else {
          // Trang trung gian (chưa có chữ ký, sức chứa tối đa 18 dòng)
          let takeCount = Math.min(16, remaining.length);
          for (let i = 12; i <= takeCount; i++) {
            if (i < remaining.length && remaining[i].type === 'category') {
              takeCount = i;
              break;
            }
          }

          const chunk = remaining.slice(0, takeCount);
          if (chunk[0] && chunk[0].type === 'test') {
            chunk.unshift({
              type: 'category',
              category: `${chunk[0].category} (tiếp theo)`,
              isContinued: true
            });
          }
          remaining = remaining.slice(takeCount);

          pages.push({
            isFirstPage: false,
            isLastPage: false,
            entries: chunk,
            showConclusion: false,
            showSignature: false
          });
        }
      }
    }
  }

  const totalPages = pages.length;

  return (
    <div id={elementId} className="flex flex-col gap-6 print:gap-0">
      {pages.map((page, pIdx) => (
        <div
          key={pIdx}
          className="report-page bg-white text-slate-900 font-sans mx-auto text-xs leading-normal flex flex-col justify-between shadow-lg print:shadow-none"
          style={{
            width: '210mm',
            minWidth: '210mm',
            maxWidth: '210mm',
            height: '297mm',
            minHeight: '297mm',
            maxHeight: '297mm',
            padding: '12mm 14mm 10mm 14mm',
            boxSizing: 'border-box',
            pageBreakAfter: pIdx < totalPages - 1 ? 'always' : 'auto',
            breakAfter: pIdx < totalPages - 1 ? 'page' : 'auto'
          }}
        >
          {/* KHUNG NỘI DUNG CHÍNH TRÊN TRANG */}
          <div className="flex-1 flex flex-col justify-start">
            
            {/* 1. HEADER TRANG (TRANG 1: HEADER ĐẦY ĐỦ | TRANG 2+: MINI HEADER) */}
            {page.isFirstPage ? (
              <div data-avoid-break="true" className="header-section flex items-center justify-between border-b-2 border-slate-300 pb-3 mb-2.5">
                <div className="flex items-center space-x-3.5">
                  <div className="h-16 w-32 flex items-center justify-start shrink-0">
                    <img
                      src={currentLogo}
                      alt="GoLab Logo"
                      className="h-16 max-w-[128px] w-auto object-contain"
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
                    <p className="text-[10px] font-extrabold text-sky-800 uppercase tracking-widest leading-none mb-1">
                      HỆ THỐNG XÉT NGHIỆM GOLAB
                    </p>
                    <h1 className="text-sm font-black text-sky-950 uppercase tracking-tight leading-tight">
                      {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
                    </h1>
                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed mt-0.5">
                      ĐC: {clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}
                    </p>
                    <p className="text-[9.5px] text-slate-600 font-medium leading-relaxed">
                      Website: <strong className="text-sky-800">{clinicInfo.website || 'golab.com.vn'}</strong> • Hotline: <strong className="text-sky-800">{clinicInfo.phone || '032.855.3773'}</strong>
                    </p>
                  </div>
                </div>

                {/* Khung QR Code bên phải Header */}
                {finalQrCode ? (
                  <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded shadow-2xs shrink-0">
                    <img
                      src={finalQrCode}
                      alt="QR Code Tra Cứu"
                      className="w-14 h-14 object-contain"
                      loading="eager"
                      decoding="sync"
                    />
                    <span className="text-[7.5px] font-mono text-sky-800 font-extrabold mt-0.5 tracking-tight">QR Tra Cứu</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded text-center shrink-0 w-24">
                    <span className="text-[8.5px] text-slate-400 font-medium leading-tight">Chưa tạo mã QR</span>
                    <button
                      type="button"
                      onClick={() => downloadQrCodeImage('', 'QRCode.png')}
                      disabled
                      className="mt-1 flex items-center space-x-0.5 text-[8px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded cursor-not-allowed"
                    >
                      <Download className="w-2.5 h-2.5" />
                      <span>Tải QR</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* MINI HEADER CHO TRANG 2 TRỞ ĐI */
              <div data-avoid-break="true" className="header-mini flex items-center justify-between border-b border-slate-300 pb-2 mb-2">
                <div className="flex items-center space-x-2">
                  <img src={currentLogo} alt="GoLab Logo" className="h-7 w-auto object-contain shrink-0" />
                  <span className="font-extrabold text-[11px] text-sky-950 uppercase tracking-tight">
                    {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-700 font-medium">
                  Bệnh nhân: <strong className="text-red-600 font-bold uppercase">{patient.name}</strong> • Mã BN: <strong className="font-mono">{patient.code}</strong> • Số BP: <strong className="font-mono text-red-600 font-bold">{patient.sampleCode || patient.code}</strong>
                </div>
              </div>
            )}

            {/* 2. TIÊU ĐỀ PHIẾU (CHỈ HIỆN Ở TRANG 1) */}
            {page.isFirstPage && (
              <div data-avoid-break="true" className="text-center my-2">
                <h2 className="text-lg font-black text-sky-950 uppercase tracking-wide">
                  PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM
                </h2>
              </div>
            )}

            {/* 3. BẢNG THÔNG TIN BỆNH NHÂN CHUẨN 12 TRƯỜNG (CHỈ HIỆN Ở TRANG 1) */}
            {page.isFirstPage && (
              <div data-avoid-break="true" className="patient-table-section border border-slate-300 rounded overflow-hidden mb-2.5">
                <table className="w-full table-fixed text-[11.5px] border-collapse">
                  <colgroup>
                    <col className="w-[15%]" />
                    <col className="w-[35%]" />
                    <col className="w-[18%]" />
                    <col className="w-[32%]" />
                  </colgroup>
                  <tbody>
                    {/* Hàng 1 */}
                    <tr>
                      <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Họ và tên:</td>
                      <td className="py-1.5 px-3 font-bold text-red-600 uppercase border-r border-b border-slate-200 align-middle truncate">{patient.name || '---'}</td>
                      <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Năm sinh:</td>
                      <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-200 align-middle truncate">{patient.dob || (patient as any).year || '---'}</td>
                    </tr>
                    {/* Hàng 2 */}
                    <tr>
                      <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Giới tính:</td>
                      <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-b border-slate-200 align-middle">{patient.gender || 'Nam'}</td>
                      <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Số điện thoại:</td>
                      <td className="py-1.5 px-3 font-mono text-slate-800 border-b border-slate-200 align-middle">{patient.phone || '---'}</td>
                    </tr>
                    {/* Hàng 3: Địa chỉ span 3 cột */}
                    <tr>
                      <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Địa chỉ:</td>
                      <td colSpan={3} className="py-1.5 px-3 text-slate-800 border-b border-slate-200 align-middle truncate">{patient.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}</td>
                    </tr>
                    {/* Hàng 4 */}
                    <tr>
                      <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Bác sĩ chỉ định:</td>
                      <td className="py-1.5 px-3 font-bold text-sky-950 border-r border-b border-slate-200 align-middle truncate">{(patient as any).doctor || doctorName || clinicInfo.defaultDoctor || 'BS. Trần Hoài Long'}</td>
                      <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Số bệnh phẩm:</td>
                      <td className="py-1.5 px-3 font-mono font-bold text-red-600 border-b border-slate-200 align-middle">{patient.sampleCode || patient.code}</td>
                    </tr>
                    {/* Hàng 5 */}
                    <tr>
                      <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">T/G chỉ định:</td>
                      <td className="py-1.5 px-3 font-mono text-slate-700 border-r border-b border-slate-200 align-middle">{patient.orderedAt || (patient as any).orderTime || currentDateStr}</td>
                      <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">T/G đóng phí:</td>
                      <td className="py-1.5 px-3 font-mono text-slate-700 border-b border-slate-200 align-middle">{patient.paidAt || (patient as any).paidTime || currentDateStr}</td>
                    </tr>
                    {/* Hàng 6 */}
                    <tr>
                      <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">T/G nhận mẫu:</td>
                      <td className="py-1.5 px-3 font-mono text-slate-700 border-r border-slate-200 align-middle">{patient.receivedAt || (patient as any).sampleTime || currentDateStr}</td>
                      <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">T/G trả kết quả:</td>
                      <td className="py-1.5 px-3 font-mono text-slate-700 align-middle">{patient.returnedAt || (patient as any).resultTime || currentDateStr}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. BẢNG CHỈ SỐ XÉT NGHIỆM TRÊN TRANG HIỆN TẠI (TĂNG CHIỀU CAO HÀNG ĐỂ ĐỌC DỄ DÀNG) */}
            <div className="border border-slate-300 rounded overflow-hidden mb-2.5">
              <table className="w-full table-fixed text-left text-xs border-collapse">
                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[33%]" />
                  <col className="w-[13%]" />
                  <col className="w-[11%]" />
                  <col className="w-[16%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="bg-slate-100 text-slate-900 uppercase font-bold border-b-2 border-slate-300">
                  <tr>
                    <th className="py-2 px-1 text-center border-r border-slate-300 align-middle whitespace-nowrap text-[11px]">STT</th>
                    <th className="py-2 px-3 border-r border-slate-300 align-middle whitespace-nowrap text-[11px]">TÊN CHỈ SỐ XÉT NGHIỆM</th>
                    <th className="py-2 px-2 text-center border-r border-slate-300 align-middle whitespace-nowrap text-[11px]">KẾT QUẢ</th>
                    <th className="py-2 px-1.5 text-center border-r border-slate-300 align-middle whitespace-nowrap text-[11px]">ĐƠN VỊ</th>
                    <th className="py-2 px-2 text-center border-r border-slate-300 align-middle whitespace-nowrap text-[11px]">TRỊ SỐ THAM CHIẾU</th>
                    <th className="py-2 px-1.5 text-center border-r border-slate-300 align-middle whitespace-nowrap text-[11px]">THIẾT BỊ XỬ LÝ</th>
                    <th className="py-2 px-1.5 text-center align-middle whitespace-nowrap text-[11px]">GHI CHÚ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {page.entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        Chưa có chỉ số xét nghiệm nào được chọn
                      </td>
                    </tr>
                  ) : (
                    page.entries.map((entry, eIdx) => {
                      if (entry.type === 'category') {
                        return (
                          <tr key={`cat-${eIdx}`} className="bg-sky-100/90 font-black text-sky-950 border-b border-slate-300">
                            <td colSpan={7} className="py-1.5 px-3 uppercase text-[11.5px] tracking-wide">
                              • {entry.category}
                            </td>
                          </tr>
                        );
                      }

                      const t = entry.test!;
                      const evalRes = evaluateResult(t.result, t.refMin, t.refMax);
                      const isAbnormal = evalRes.status !== 'normal';

                      return (
                        <tr
                          key={`test-${t.code || eIdx}`}
                          className={`hover:bg-slate-50 transition-colors ${
                            isAbnormal ? 'bg-amber-50/60 font-semibold' : 'bg-white'
                          }`}
                        >
                          <td className="py-2 px-1 text-center font-mono text-slate-500 border-r border-slate-200 align-middle text-[11.5px]">
                            {entry.idx}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200 align-middle text-[12px] truncate">
                            {t.name}
                          </td>
                          <td
                            className={`py-2 px-2 text-center font-mono font-bold border-r border-slate-200 align-middle text-[12px] ${
                              isAbnormal ? 'text-red-600' : 'text-slate-800'
                            }`}
                          >
                            {t.result || '---'}
                          </td>
                          <td className="py-2 px-1.5 text-center font-mono text-slate-600 border-r border-slate-200 align-middle text-[11.5px]">
                            {t.unit || '---'}
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-slate-600 border-r border-slate-200 align-middle text-[11.5px]">
                            {t.refText || (t.refMin !== null && t.refMax !== null ? `${t.refMin} - ${t.refMax}` : '---')}
                          </td>
                          <td className="py-2 px-1.5 text-center text-[10.5px] text-slate-500 border-r border-slate-200 align-middle">
                            {t.equipment || 'Tự động'}
                          </td>
                          <td
                            className={`py-2 px-1.5 text-center text-[10.5px] font-bold align-middle ${
                              isAbnormal ? 'text-red-600' : 'text-slate-500'
                            }`}
                          >
                            {evalRes.label}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. KHỐI KẾT LUẬN CỦA BÁC SĨ (CHỈ XUẤT HIỆN Ở TRANG CUỐI) */}
            {page.showConclusion && conclusion && (
              <div data-avoid-break="true" className="conclusion-section border border-sky-300 bg-sky-50/60 rounded p-2.5 mb-2 text-xs">
                <span className="font-bold text-sky-950 uppercase tracking-wide">KẾT LUẬN / ĐỀ NGHỊ CỦA BÁC SĨ: </span>
                <span className="font-semibold text-slate-800">{conclusion}</span>
              </div>
            )}

            {/* 6. CHỮ KÝ VÀ DẤU BÁC SĨ (CHỈ XUẤT HIỆN Ở TRANG CUỐI - THIẾT LẬP NGAY DƯỚI CUỐI NỘI DUNG) */}
            {page.showSignature && (
              <div data-avoid-break="true" className="signature-section mt-3.5 pt-2.5 border-t border-slate-300">
                <div className="flex items-start justify-between text-center">
                  
                  {/* Bên trái: Chú thích & Lưu ý */}
                  <div className="text-left text-[9.5px] text-slate-500 space-y-0.5 max-w-[50%]">
                    <p className="font-bold text-slate-700 uppercase">Lưu ý đối với bệnh nhân:</p>
                    <p>- Phiếu kết quả này chỉ có giá trị tại thời điểm xét nghiệm.</p>
                    <p>- Vui lòng mang phiếu này khi đến tái khám hoặc tư vấn bác sĩ chuyên khoa.</p>
                  </div>

                  {/* Bên phải: Chữ ký & Đóng dấu Phụ trách chuyên môn */}
                  <div className="text-center min-w-[220px]">
                    <p className="text-[10.5px] text-slate-600 italic">Ngày {currentDateStr}</p>
                    <p className="text-[11.5px] font-bold uppercase text-slate-900 mt-0.5 mb-1 tracking-wide">PHỤ TRÁCH CHUYÊN MÔN</p>
                    <div className="h-24 flex items-center justify-center my-0.5">
                      <img
                        src={currentStamp}
                        alt="Đã ký & Đóng dấu"
                        className="h-24 w-auto object-contain max-w-[130px]"
                        loading="eager"
                        decoding="sync"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = doctorStamp;
                        }}
                      />
                    </div>
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      {doctorName || clinicInfo.defaultDoctor || 'Nguyễn Thị Thành Trung'}
                    </p>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* 7. DÒNG PHÂN TRANG & BẢN QUYỀN CHÂN TRANG */}
          <div className="mt-auto pt-1 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500 uppercase font-mono tracking-tight">
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
