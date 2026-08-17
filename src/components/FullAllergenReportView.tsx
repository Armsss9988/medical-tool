import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import { Patient, SelectedTest, ClinicInfo } from '@domain/types';
import { calculateAllergenGrade } from '@domain/allergen';
import { ALLERGEN_91_DATABASE, AllergenDatabaseItem } from '@data/allergenCatalog';

interface FullAllergenReportViewProps {
  elementId?: string;
  patient: Patient;
  allergenTests?: SelectedTest[];
  selectedTests?: SelectedTest[];
  currentDateStr?: string;
  doctorName?: string;
  qrCodeDataUrl?: string;
  qrCodeUrl?: string;
  clinicInfo?: ClinicInfo;
}

export default function FullAllergenReportView({
  elementId = 'printable-allergen-report',
  patient,
  allergenTests,
  selectedTests = [],
  currentDateStr = new Date().toLocaleDateString('vi-VN'),
  doctorName,
  qrCodeDataUrl,
  qrCodeUrl,
  clinicInfo = {
    name: 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
    address: 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị',
    phone: '032.855.3773',
    website: 'golab.com.vn',
    defaultDoctor: 'Nguyễn Thị Thành Trung'
  }
}: FullAllergenReportViewProps) {
  const tests = allergenTests || selectedTests || [];
  const finalQrCode = qrCodeDataUrl || qrCodeUrl;
  const currentLogo = clinicInfo?.logoUrl || golabLogo;
  const currentStamp = clinicInfo?.stampUrl || doctorStamp;

  // Lấy dữ liệu chi tiết của từng dị nguyên (ghép nối từ ALLERGEN_91_DATABASE)
  const dbMap = new Map<string, AllergenDatabaseItem>();
  ALLERGEN_91_DATABASE.forEach((item) => {
    dbMap.set(item.code.toLowerCase(), item);
    dbMap.set(item.name.toLowerCase(), item);
  });

  const detailedList = tests.map((t, idx) => {
    const dbItem = dbMap.get((t.code || '').toLowerCase()) || dbMap.get((t.name || '').toLowerCase());
    const gradeRes = calculateAllergenGrade(t.result || t.note);
    const grade = gradeRes.grade;
    const isPositive = grade >= 1;

    return {
      tt: idx + 1,
      code: t.code || dbItem?.code || `DN${idx + 1}`,
      name: t.name || dbItem?.name || 'Dị nguyên',
      allergenName: (t as any).allergenName || dbItem?.allergenName || t.name,
      route: (t as any).route || dbItem?.route || 'Đường tiêu hóa / Hô hấp',
      normalRef: dbItem?.normalRef || (t.refMin !== null && t.refMax !== null ? `${t.refMin} - ${t.refMax}` : '<0,34'),
      result: t.result || '<0,15',
      grade: grade,
      isPositive: isPositive,
      note: t.note || dbItem?.note || ''
    };
  });

  // Lọc danh sách dương tính (Độ >= 1)
  const positiveList = detailedList.filter((item) => item.isPositive);
  const totalCount = detailedList.length || 41;
  const packagePrice = tests.reduce((sum, item) => sum + (item.price || 0), 0) || 1400000;

  // Phân chia danh sách chi tiết: mỗi trang chi tiết chứa 13 dòng
  const ITEMS_PER_PAGE = 13;
  const detailPages: typeof detailedList[] = [];
  for (let i = 0; i < detailedList.length; i += ITEMS_PER_PAGE) {
    detailPages.push(detailedList.slice(i, i + ITEMS_PER_PAGE));
  }

  // Nếu danh sách rỗng, tạo 1 trang mẫu
  if (detailPages.length === 0) {
    detailPages.push([]);
  }

  return (
    <div id={elementId} className="w-[210mm] max-w-[210mm] mx-auto bg-slate-200 print:bg-white print:m-0 print:p-0">
      
      {/* ========================================================================= */}
      {/* TRANG 1: PHIẾU KẾT QUẢ XÉT NGHIỆM (TRANG BÌA / TỔNG QUÁT) */}
      {/* ========================================================================= */}
      <div 
        data-page="true"
        className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 font-sans p-8 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-6 flex flex-col justify-between box-border"
      >
        <div>
          {/* Header Phòng khám */}
          <div className="flex items-center justify-between border-b-2 border-sky-600 pb-3 mb-4">
            <div className="flex items-center space-x-3">
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
                <p className="text-[11px] font-bold text-sky-800 uppercase tracking-widest leading-none mb-1">
                  HỆ THỐNG XÉT NGHIỆM GOLAB
                </p>
                <h1 className="text-sm font-black text-sky-950 uppercase tracking-tight">
                  {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
                </h1>
                <p className="text-[10px] text-slate-600 font-medium">
                  Địa chỉ: {clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}
                </p>
                <p className="text-[10px] text-slate-600 font-medium">
                  Website: <strong className="text-sky-800">{clinicInfo.website || 'golab.com.vn'}</strong> – hotline: <strong className="text-sky-800">{clinicInfo.phone || '032.855.3773'}</strong>
                </p>
              </div>
            </div>
            {finalQrCode && (
              <div className="flex flex-col items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded shrink-0">
                <img src={finalQrCode} alt="QR Code Tra Cứu" className="w-12 h-12 object-contain" />
                <span className="text-[7.5px] font-mono text-sky-700 font-bold mt-0.5">QR Tra Cứu</span>
              </div>
            )}
          </div>

          {/* Tiêu đề trang 1 */}
          <div className="text-center my-4">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              PHIẾU KẾT QUẢ XÉT NGHIỆM
            </h2>
          </div>

          {/* Bảng thông tin hành chính 12 trường */}
          <div className="border border-slate-300 rounded mb-6 overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-28 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Họ và tên:</td>
                  <td className="py-1.5 px-3 font-bold text-red-600 uppercase border-r border-slate-200">{patient.name || '---'}</td>
                  <td className="w-28 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">T/G chỉ định</td>
                  <td className="py-1.5 px-3 font-medium text-slate-800">{patient.orderedAt || currentDateStr}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="w-28 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Năm sinh:</td>
                  <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-slate-200">{patient.dob || '---'}</td>
                  <td className="w-28 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">T/G đóng phí</td>
                  <td className="py-1.5 px-3 font-medium text-slate-800">{patient.paidAt || currentDateStr}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="w-28 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Địa chỉ</td>
                  <td className="py-1.5 px-3 text-slate-800 border-r border-slate-200">{patient.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}</td>
                  <td className="w-28 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Số bệnh phẩm</td>
                  <td className="py-1.5 px-3 font-mono font-bold text-red-600">{patient.sampleCode || patient.code}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="w-28 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Giới tính:</td>
                  <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-slate-200">{patient.gender || 'Nam'}</td>
                  <td className="w-28 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Tình trạng mẫu</td>
                  <td className="py-1.5 px-3 font-medium text-emerald-700">Đạt</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="w-28 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Số điện thoại</td>
                  <td className="py-1.5 px-3 font-mono text-slate-800 border-r border-slate-200">{patient.phone || '---'}</td>
                  <td className="w-28 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">T/G nhận mẫu</td>
                  <td className="py-1.5 px-3 font-medium text-slate-800">{patient.receivedAt || currentDateStr}</td>
                </tr>
                <tr>
                  <td className="w-28 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Bác sĩ chỉ định</td>
                  <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">{doctorName || clinicInfo.defaultDoctor || 'BS. Trần Hoài Long'}</td>
                  <td className="w-28 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">T/G trả kết quả</td>
                  <td className="py-1.5 px-3 font-medium text-slate-800">{patient.returnedAt || currentDateStr}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bảng Dịch Vụ / Gói Xét Nghiệm */}
          <div className="border border-slate-300 rounded overflow-hidden mb-6">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2 px-3 w-12 text-center border-r border-slate-300">STT</th>
                  <th className="py-2 px-4 text-left border-r border-slate-300">Tên Xét Nghiệm</th>
                  <th className="py-2 px-3 w-28 text-center border-r border-slate-300">Kết quả</th>
                  <th className="py-2 px-4 text-left border-r border-slate-300">Ghi chú</th>
                  <th className="py-2 px-4 w-32 text-right">Giá tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-medium">1</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200">
                    Panel {totalCount} dị nguyên
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 text-slate-400">---</td>
                  <td className="py-2.5 px-4 text-slate-700 border-r border-slate-200 font-medium">
                    Kết quả chi tiết trong file đính kèm
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {packagePrice.toLocaleString('vi-VN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Chữ Ký & Con Dấu Phụ Trách Chuyên Môn */}
        <div className="flex justify-end pt-4">
          <div className="text-center min-w-[220px]">
            <p className="text-xs font-bold uppercase text-slate-900 tracking-wide mb-1">
              PHỤ TRÁCH CHUYÊN MÔN
            </p>
            <div className="h-28 flex items-center justify-center my-1">
              <img
                src={currentStamp}
                alt="Con Dấu & Chữ Ký"
                className="h-28 w-auto object-contain max-w-[140px]"
                loading="eager"
                decoding="sync"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null;
                  target.src = doctorStamp;
                }}
              />
            </div>
            <p className="text-xs font-bold text-slate-900">
              {clinicInfo.defaultDoctor || 'Nguyễn Thị Thành Trung'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TRANG 2: ĐỊNH LƯỢNG IgE ĐẶC HIỆU {N} DỊ NGUYÊN (TỔNG HỢP & DƯƠNG TÍNH) */}
      {/* ========================================================================= */}
      <div 
        data-page="true"
        className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 font-sans p-8 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-6 flex flex-col justify-between box-border"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-sky-600 pb-2 mb-3">
            <div className="flex items-center space-x-3">
              <div className="h-14 w-28 flex items-center justify-start shrink-0">
                <img src={currentLogo} alt="GoLab Logo" className="h-14 max-w-[112px] w-auto object-contain" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-sky-800 uppercase tracking-widest leading-none mb-0.5">
                  HỆ THỐNG XÉT NGHIỆM GOLAB
                </p>
                <h1 className="text-xs font-black text-sky-950 uppercase tracking-tight">
                  {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
                </h1>
                <p className="text-[9.5px] text-slate-600 font-medium">
                  Địa chỉ: {clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}
                </p>
                <p className="text-[9.5px] text-slate-600 font-medium">
                  Website: <strong className="text-sky-800">{clinicInfo.website || 'golab.com.vn'}</strong> – hotline: <strong className="text-sky-800">{clinicInfo.phone || '032.855.3773'}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Tiêu đề trang 2 */}
          <div className="text-center my-3">
            <h2 className="text-sm font-black text-sky-900 uppercase tracking-wide">
              ĐỊNH LƯỢNG IgE ĐẶC HIỆU {totalCount} DỊ NGUYÊN
            </h2>
            <p className="text-[11px] text-sky-700 italic font-medium">
              (Thực hiện trên máy PROTIA Allergy-Q Smart và Q-processor)
            </p>
          </div>

          {/* Thông tin vắn tắt bệnh nhân */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-4 py-2 mb-4 text-xs">
            <div>
              <span className="font-semibold text-slate-600">Họ tên: </span>
              <strong className="text-red-600 uppercase font-bold">{patient.name || '---'}</strong>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Năm sinh: </span>
              <strong className="text-slate-800">{patient.dob || '---'}</strong>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Giới tính: </span>
              <strong className="text-slate-800">{patient.gender || 'Nam'}</strong>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Loại mẫu: </span>
              <strong className="text-slate-800">Huyết thanh</strong>
            </div>
          </div>

          {/* Bảng Dị Nguyên Dương Tính */}
          <div className="border border-slate-300 rounded overflow-hidden mb-2">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2 px-3 w-12 text-center border-r border-slate-300">STT</th>
                  <th className="py-2 px-4 text-left border-r border-slate-300">LOẠI DỊ NGUYÊN</th>
                  <th className="py-2 px-4 text-left border-r border-slate-300">TÊN KHOA HỌC</th>
                  <th className="py-2 px-3 w-20 text-center border-r border-slate-300">MÃ</th>
                  <th className="py-2 px-4 w-32 text-center">ĐỘ DƯƠNG TÍNH</th>
                </tr>
              </thead>
              <tbody>
                {positiveList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                      Chưa phát hiện dị nguyên dương tính (Tất cả &lt; 0.35 IU/ml - Độ 0)
                    </td>
                  </tr>
                ) : (
                  positiveList.map((pos, idx) => (
                    <tr key={pos.code || idx} className="border-b border-slate-200 bg-red-50/40 font-bold text-red-700">
                      <td className="py-2 px-3 text-center border-r border-slate-200">{idx + 1}</td>
                      <td className="py-2 px-4 border-r border-slate-200">{pos.name}</td>
                      <td className="py-2 px-4 border-r border-slate-200 italic font-medium text-red-600">{pos.allergenName}</td>
                      <td className="py-2 px-3 text-center font-mono border-r border-slate-200">{pos.code}</td>
                      <td className="py-2 px-4 text-center font-mono text-sm">{pos.grade}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-500 italic text-right mb-4">
            (Chi tiết vui lòng xem trang sau)
          </p>

          {/* Phần MỘT SỐ LƯU Ý (2 cột song song) */}
          <div className="border-t-2 border-slate-300 pt-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase underline mb-2">
              MỘT SỐ LƯU Ý:
            </h3>
            
            <div className="grid grid-cols-12 gap-3">
              {/* Cột trái: Diễn giải độ dương tính */}
              <div className="col-span-5 border border-slate-300 rounded overflow-hidden">
                <div className="bg-slate-100 py-1.5 px-2 text-center font-bold text-red-700 text-[10.5px] uppercase border-b border-slate-300">
                  DIỄN GIẢI ĐỘ DƯƠNG TÍNH
                </div>
                <table className="w-full text-[10px] border-collapse">
                  <thead className="bg-slate-50 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-1 px-1.5 text-center border-r border-slate-200">ĐỘ (+)</th>
                      <th className="py-1 px-1.5 text-center border-r border-slate-200">NỒNG ĐỘ (IU/ml)</th>
                      <th className="py-1 px-1.5 text-center">DIỄN GIẢI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="py-1 text-center border-r border-slate-200">0</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-200">&lt;0,34</td><td className="py-1 text-center font-semibold text-slate-700">Không phản ứng</td></tr>
                    <tr className="bg-amber-50/50"><td className="py-1 text-center border-r border-slate-200 font-bold">1</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-200">0,35 - 0,69</td><td className="py-1 text-center font-bold text-amber-800">Yếu</td></tr>
                    <tr className="bg-amber-50/70"><td className="py-1 text-center border-r border-slate-200 font-bold">2</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-200">0,70 - 3,49</td><td className="py-1 text-center font-bold text-amber-900">Trung bình</td></tr>
                    <tr className="bg-red-50/50"><td className="py-1 text-center border-r border-slate-200 font-bold">3</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-200">3,50 - 17,49</td><td className="py-1 text-center font-bold text-red-700">Khá</td></tr>
                    <tr className="bg-red-50/70"><td className="py-1 text-center border-r border-slate-200 font-bold">4</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-200">17,50 - 49,99</td><td className="py-1 text-center font-bold text-red-800">Mạnh</td></tr>
                    <tr className="bg-red-100/60"><td className="py-1 text-center border-r border-slate-200 font-bold">5</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-200">50,00 - 99,99</td><td className="py-1 text-center font-bold text-red-900">Rất mạnh</td></tr>
                    <tr className="bg-red-100"><td className="py-1 text-center border-r border-slate-200 font-bold">6</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-200">&gt;100,0</td><td className="py-1 text-center font-black text-red-950">Cực mạnh</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Cột phải: Triệu chứng thường gặp */}
              <div className="col-span-7 border border-slate-300 rounded overflow-hidden p-2.5 text-[9.5px] leading-relaxed space-y-1 bg-slate-50/50">
                <div className="text-center font-bold text-red-700 text-[10.5px] uppercase pb-1 border-b border-slate-200 mb-1">
                  MỘT SỐ TRIỆU CHỨNG THƯỜNG GẶP KHI DỊ ỨNG
                </div>
                <p><strong className="text-slate-900">Da, niêm mạc:</strong> da nổi mề đay, phát ban, viêm da; Ngứa, sưng môi, lưỡi, miệng. Mắt đỏ, ngứa mắt, chảy nước mắt, viêm kết mạc.</p>
                <p><strong className="text-slate-900">Hô hấp:</strong> ho, khó thở, hắt hơi, sổ mũi, viêm mũi, thở khò khè, khó thở, hen suyễn, viêm phổi, phù phổi, bệnh phổi tắc nghẽn.</p>
                <p><strong className="text-slate-900">Đường tiêu hóa:</strong> Đau cổ họng, nuốt khó, nôn, đau bụng, đầy hơi, táo bón, phân lỏng, lẫn máu.</p>
                <p><strong className="text-slate-900">Tim mạch:</strong> Suy tim, mạch yếu.</p>
                <p><strong className="text-slate-900">Thần kinh:</strong> đau đầu, chóng mặt hoặc đau nửa đầu, rối loạn giấc ngủ;</p>
                <p><strong className="text-slate-900">Trường hợp nặng:</strong> Sốt, sốc phản vệ.</p>
                <p className="text-red-700 font-bold italic pt-1 border-t border-slate-200">
                  Nếu sau khi tiếp xúc, ăn, uống... mà xuất hiện các triệu chứng trên cần tư vấn bác sỹ ngay.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[8px] text-slate-400 font-mono pt-3 border-t border-slate-200">
          GOLAB CLINICAL LABORATORY • PHIẾU ĐỊNH LƯỢNG IgE ĐẶC HIỆU DỊ NGUYÊN • TRANG 2
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CÁC TRANG 3 .. N: BẢNG CHI TIẾT KẾT QUẢ XÉT NGHIỆM {N} DỊ NGUYÊN */}
      {/* ========================================================================= */}
      {detailPages.map((pageItems, pageIdx) => (
        <div 
          key={pageIdx}
          data-page="true"
          className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 font-sans p-6 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-5 flex flex-col justify-between box-border"
        >
          <div>
            {/* Tiêu đề bảng chi tiết */}
            <div className="text-center mb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                CHI TIẾT KẾT QUẢ XÉT NGHIỆM {totalCount} DỊ NGUYÊN {detailPages.length > 1 ? `(PHẦN ${pageIdx + 1})` : ''}
              </h2>
            </div>

            {/* Bảng Chi Tiết */}
            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-[9px] border-collapse">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-1.5 px-1 w-6 text-center border-r border-slate-300">TT</th>
                    <th className="py-1.5 px-1 w-10 text-center border-r border-slate-300">CODE</th>
                    <th className="py-1.5 px-2 text-left border-r border-slate-300">TÊN CHỈ SỐ</th>
                    <th className="py-1.5 px-2 text-left border-r border-slate-300">TÊN DỊ NGUYÊN</th>
                    <th className="py-1.5 px-2 w-24 text-left border-r border-slate-300">Đường dị ứng</th>
                    <th className="py-1.5 px-1.5 w-16 text-center border-r border-slate-300 leading-tight">BÌNH THƯỜNG<br/>(IU/ml)</th>
                    <th className="py-1.5 px-1.5 w-16 text-center border-r border-slate-300 leading-tight">KẾT QUẢ<br/>(IU/ml)</th>
                    <th className="py-1.5 px-1 w-8 text-center border-r border-slate-300 leading-tight">ĐỘ<br/>(+)</th>
                    <th className="py-1.5 px-2 text-left">GHI CHÚ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pageItems.map((item) => (
                    <tr 
                      key={item.code} 
                      className={`hover:bg-slate-50 ${item.isPositive ? 'bg-red-50/50' : 'bg-white'}`}
                    >
                      <td className="py-1 px-1 text-center font-mono text-slate-500 border-r border-slate-200">{item.tt}</td>
                      <td className="py-1 px-1 text-center font-mono font-bold text-sky-800 border-r border-slate-200">{item.code}</td>
                      <td className="py-1 px-2 font-semibold text-slate-900 border-r border-slate-200">{item.name}</td>
                      <td className="py-1 px-2 italic text-slate-600 border-r border-slate-200">{item.allergenName}</td>
                      <td className="py-1 px-2 text-slate-600 border-r border-slate-200 text-[8.5px]">{item.route}</td>
                      <td className="py-1 px-1.5 text-center font-mono text-slate-600 border-r border-slate-200">{item.normalRef}</td>
                      <td className={`py-1 px-1.5 text-center font-mono font-bold border-r border-slate-200 ${item.isPositive ? 'text-red-600 text-[10px]' : 'text-slate-800'}`}>
                        {item.result}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-bold text-red-600 border-r border-slate-200">
                        {item.isPositive ? item.grade : ''}
                      </td>
                      <td className="py-1 px-2 text-slate-600 text-[8.5px] leading-tight">{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center text-[8px] text-slate-400 font-mono pt-2 border-t border-slate-200">
            GOLAB CLINICAL LABORATORY • CHI TIẾT DỊ NGUYÊN • TRANG {pageIdx + 3}
          </div>
        </div>
      ))}

      {/* ========================================================================= */}
      {/* TRANG CUỐI: MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG */}
      {/* ========================================================================= */}
      <div 
        data-page="true"
        className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 font-sans p-8 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-6 flex flex-col justify-between box-border"
      >
        <div>
          {/* Tiêu đề trang lưu ý phòng ngừa */}
          <div className="text-center mb-6 pt-2">
            <h2 className="text-base font-black text-red-700 uppercase tracking-wide">
              MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG
            </h2>
          </div>

          {/* Nội dung 5 điều hướng dẫn phòng ngừa */}
          <div className="text-xs text-slate-800 leading-relaxed space-y-3.5 text-justify">
            <p>
              <strong>1.</strong> Tìm nguyên nhân gây dị ứng hoặc dị ứng chéo bằng các xét nghiệm tìm dị nguyên. Nhiều trường hợp xét nghiệm dị nguyên vẫn không tìm ra nguyên nhân là do có nhiều dị nguyên hiện chưa được đưa vào xét nghiệm.
            </p>
            <p>
              <strong>2.</strong> Khi xét nghiệm không tìm thấy nguyên nhân dị ứng thì cần tiến hành cô lập từng yếu tố theo đường ăn uống (thực phẩm, đồ uống...), đường thở và tiếp xúc với môi trường (phấn hoa thường liên quan đến mùa, bụi, mạt, nấm, vi khuẩn... ở nhà, nơi công tác hay nơi di chuyển) để tìm nguyên nhân.
            </p>
            <div>
              <p>
                <strong>3.</strong> Mức độ dị ứng tỷ lệ thuận với số lần tiếp xúc với nguồn gây dị ứng, nhiều dị nguyên ngoài việc kích thích cơ thể gây dị ứng còn gây ra tình trạng phản ứng chéo với các loại khác làm tình trạng dị ứng thêm trầm trọng. Vì vậy, cần hạn chế tiếp xúc với nguồn có chứa hoặc nghi có chứa chất gây dị ứng bằng các biện pháp sau:
              </p>
              <div className="pl-4 pt-1.5 space-y-1 text-[11.5px] text-slate-700">
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
            <p>
              <strong>4.</strong> Nếu phát hiện ra có biểu hiện dị ứng hay tiếp xúc với nguồn gây dị ứng cần nhanh chóng tẩy rửa bằng nước sạch để loại bỏ hoặc làm loãng các chất dị ứng đã tiếp xúc với cơ thể.
            </p>
            <p>
              <strong>5.</strong> Không nên tự dùng thuốc tây đặc biệt là thuốc đông y chống dị ứng vì nhiều loại thực vật là nguồn chứa các chất gây dị ứng. Hiện nay có nhiều liệu pháp điều trị dị ứng kể cả tiêm ngừa dị ứng tuy vậy cần tuân thủ chặt chẽ sự hướng dẫn của các bác sỹ chuyên ngành da liễu.
            </p>
          </div>
        </div>

        <div className="text-center text-[8px] text-slate-400 font-mono pt-4 border-t border-slate-200">
          GOLAB CLINICAL LABORATORY • HƯỚNG DẪN PHÒNG NGỪA DỊ ỨNG • TRANG {detailPages.length + 3}
        </div>
      </div>

    </div>
  );
}
