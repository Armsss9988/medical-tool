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
    <div id={elementId} className="w-[210mm] max-w-[210mm] mx-auto bg-slate-200 print:bg-white print:m-0 print:p-0 font-serif">
      
      {/* ========================================================================= */}
      {/* TRANG 1: PHIẾU KẾT QUẢ XÉT NGHIỆM (TRANG BÌA / TỔNG QUÁT) */}
      {/* ========================================================================= */}
      <div 
        data-page="true"
        className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 p-8 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-6 flex flex-col justify-between box-border"
        style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
      >
        <div>
          {/* Header Phòng khám */}
          <div className="flex items-center justify-between border-b-2 border-sky-600 pb-3 mb-3">
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
                <p className="text-[13px] font-bold text-sky-800 uppercase tracking-widest leading-none mb-1">
                  HỆ THỐNG XÉT NGHIỆM GOLAB
                </p>
                <h1 className="text-[18px] font-black text-sky-950 uppercase tracking-tight">
                  {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
                </h1>
                <p className="text-[13px] text-slate-700 font-medium">
                  Địa chỉ: {clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}
                </p>
                <p className="text-[12.5px] text-slate-700 font-medium">
                  Website: <strong className="text-sky-800">{clinicInfo.website || 'golab.com.vn'}</strong> – Hotline: <strong className="text-sky-800">{clinicInfo.phone || '032.855.3773'}</strong>
                </p>
              </div>
            </div>
            {finalQrCode && (
              <div className="flex flex-col items-center justify-center p-1 bg-slate-50 border border-slate-300 rounded shrink-0">
                <img src={finalQrCode} alt="QR Code Tra Cứu" className="w-13 h-13 object-contain" />
                <span className="text-[9.5px] font-mono text-sky-700 font-bold mt-0.5">QR Tra Cứu</span>
              </div>
            )}
          </div>

          {/* Tiêu đề trang 1 */}
          <div className="text-center my-3">
            <h2 className="text-[23px] font-black text-slate-900 uppercase tracking-wide">
              PHIẾU KẾT QUẢ XÉT NGHIỆM
            </h2>
          </div>

          {/* Bảng thông tin hành chính 12 trường */}
          <div className="border border-slate-300 rounded mb-4 bg-white">
            <table className="w-full text-[13px] border-collapse">
              <tbody>
                <tr>
                  <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Họ và tên:</td>
                  <td className="py-2 px-3 font-bold text-red-600 uppercase border-r border-b border-slate-300 align-middle text-[14px] leading-snug">{patient.name || '---'}</td>
                  <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G chỉ định</td>
                  <td className="py-2 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug">{patient.orderedAt || currentDateStr}</td>
                </tr>
                <tr>
                  <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Năm sinh:</td>
                  <td className="py-2 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.dob || '---'}</td>
                  <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G đóng phí</td>
                  <td className="py-2 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug">{patient.paidAt || currentDateStr}</td>
                </tr>
                <tr>
                  <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Địa chỉ</td>
                  <td className="py-2 px-3 text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}</td>
                  <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Số bệnh phẩm</td>
                  <td className="py-2 px-3 font-mono font-bold text-red-600 border-b border-slate-300 align-middle text-[14px] leading-snug">{patient.sampleCode || patient.code}</td>
                </tr>
                <tr>
                  <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Giới tính:</td>
                  <td className="py-2 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.gender || 'Nam'}</td>
                  <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Tình trạng mẫu</td>
                  <td className="py-2 px-3 font-medium text-emerald-700 font-bold border-b border-slate-300 align-middle leading-snug">Đạt</td>
                </tr>
                <tr>
                  <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Số điện thoại</td>
                  <td className="py-2 px-3 font-mono text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.phone || '---'}</td>
                  <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">T/G nhận mẫu</td>
                  <td className="py-2 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug">{patient.receivedAt || currentDateStr}</td>
                </tr>
                <tr>
                  <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">Bác sĩ chỉ định</td>
                  <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-300 align-middle leading-snug">{patient.doctor || doctorName || 'BS. Trần Hoài Long'}</td>
                  <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">T/G trả kết quả</td>
                  <td className="py-2 px-3 font-medium text-slate-800 align-middle leading-snug">{patient.returnedAt || currentDateStr}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bảng Dịch Vụ / Gói Xét Nghiệm */}
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
                  <td className="py-2.5 px-3 text-center border-r border-slate-300 font-medium align-middle leading-snug">1</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-300 align-middle leading-snug">
                    Panel {totalCount} dị nguyên
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-300 text-slate-400 font-mono align-middle leading-snug">---</td>
                  <td className="py-2.5 px-4 text-slate-700 border-r border-slate-300 font-medium align-middle leading-snug">
                    Kết quả chi tiết trong file đính kèm
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 text-[14px] align-middle leading-snug">
                    {packagePrice.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Chữ Ký & Con Dấu Phụ Trách Chuyên Môn (Ngay dưới cuối bảng nội dung) */}
          <div className="flex justify-end pt-2">
            <div className="text-center min-w-[220px]">
              <p className="text-[13px] text-slate-700 italic leading-snug">Ngày {currentDateStr}</p>
              <p className="text-[14px] font-bold uppercase text-slate-900 tracking-wide mb-0.5 leading-snug">
                PHỤ TRÁCH CHUYÊN MÔN
              </p>
              <div className="h-26 flex items-center justify-center my-0.5">
                <img
                  src={currentStamp}
                  alt="Con Dấu & Chữ Ký"
                  className="h-26 w-auto object-contain max-w-[135px]"
                  loading="eager"
                  decoding="sync"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.onerror = null;
                    target.src = doctorStamp;
                  }}
                />
              </div>
              <p className="text-[14.5px] font-bold text-slate-900 uppercase leading-snug">
                {clinicInfo.defaultDoctor || 'Nguyễn Thị Thành Trung'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Page 1 */}
        <div className="mt-auto pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 uppercase font-mono">
          <span>
            HỆ THỐNG XÉT NGHIỆM GOLAB • {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'} • HOTLINE: {clinicInfo.phone || '032.855.3773'}
          </span>
          <span className="font-bold text-sky-800">
            Trang 1/{detailPages.length + 3}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TRANG 2: ĐỊNH LƯỢNG IgE ĐẶC HIỆU {N} DỊ NGUYÊN (TỔNG HỢP & DƯƠNG TÍNH) */}
      {/* ========================================================================= */}
      <div 
        data-page="true"
        className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 p-7 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-5 flex flex-col justify-between box-border"
        style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-sky-600 pb-2 mb-2">
            <div className="flex items-center space-x-3">
              <div className="h-14 w-28 flex items-center justify-start shrink-0">
                <img src={currentLogo} alt="GoLab Logo" className="h-14 max-w-[112px] w-auto object-contain" />
              </div>
              <div>
                <p className="text-[12.5px] font-bold text-sky-800 uppercase tracking-widest leading-none mb-0.5">
                  HỆ THỐNG XÉT NGHIỆM GOLAB
                </p>
                <h1 className="text-[16px] font-black text-sky-950 uppercase tracking-tight">
                  {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
                </h1>
                <p className="text-[12px] text-slate-700 font-medium">
                  Địa chỉ: {clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}
                </p>
                <p className="text-[12px] text-slate-700 font-medium">
                  Website: <strong className="text-sky-800">{clinicInfo.website || 'golab.com.vn'}</strong> – Hotline: <strong className="text-sky-800">{clinicInfo.phone || '032.855.3773'}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Tiêu đề trang 2 */}
          <div className="text-center my-2">
            <h2 className="text-[18px] font-black text-sky-900 uppercase tracking-wide">
              ĐỊNH LƯỢNG IgE ĐẶC HIỆU {totalCount} DỊ NGUYÊN
            </h2>
            <p className="text-[13px] text-sky-700 italic font-medium">
              (Thực hiện trên máy PROTIA Allergy-Q Smart và Q-processor)
            </p>
          </div>

          {/* Thông tin vắn tắt bệnh nhân */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-300 rounded px-4 py-2 mb-2 text-[13px] leading-snug">
            <div>
              <span className="font-semibold text-slate-600">Họ tên: </span>
              <strong className="text-red-600 uppercase font-bold text-[14px]">{patient.name || '---'}</strong>
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
          <div className="border border-slate-300 rounded mb-1.5 bg-white">
            <table className="w-full text-[13px] border-collapse">
              <thead className="bg-slate-50 text-slate-900 font-bold border-b-2 border-slate-300">
                <tr>
                  <th className="py-2 px-3 w-12 text-center border-r border-slate-300 align-middle leading-snug">STT</th>
                  <th className="py-2 px-4 text-left border-r border-slate-300 align-middle leading-snug">LOẠI DỊ NGUYÊN</th>
                  <th className="py-2 px-4 text-left border-r border-slate-300 align-middle leading-snug">TÊN KHOA HỌC</th>
                  <th className="py-2 px-3 w-20 text-center border-r border-slate-300 align-middle leading-snug">MÃ</th>
                  <th className="py-2 px-4 w-32 text-center align-middle leading-snug">ĐỘ DƯƠNG TÍNH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {positiveList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-3 text-center text-slate-500 italic text-[13px]">
                      Chưa phát hiện dị nguyên dương tính (Tất cả &lt; 0.35 IU/ml - Độ 0)
                    </td>
                  </tr>
                ) : (
                  positiveList.map((pos, idx) => (
                    <tr key={pos.code || idx} className="bg-red-50/40 font-bold text-red-700 text-[13.5px]">
                      <td className="py-2 px-3 text-center border-r border-slate-300 align-middle leading-snug">{idx + 1}</td>
                      <td className="py-2 px-4 border-r border-slate-300 align-middle leading-snug">{pos.name}</td>
                      <td className="py-2 px-4 border-r border-slate-300 italic font-medium text-red-600 align-middle leading-snug">{pos.allergenName}</td>
                      <td className="py-2 px-3 text-center font-mono border-r border-slate-300 align-middle leading-snug">{pos.code}</td>
                      <td className="py-2 px-4 text-center font-mono text-[14.5px] align-middle leading-snug">{pos.grade}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-slate-500 italic text-right mb-2">
            (Chi tiết vui lòng xem trang sau)
          </p>

          {/* Phần MỘT SỐ LƯU Ý (2 cột song song) */}
          <div className="border-t-2 border-slate-300 pt-2">
            <h3 className="text-[14px] font-bold text-slate-900 uppercase underline mb-1.5">
              MỘT SỐ LƯU Ý:
            </h3>
            
            <div className="grid grid-cols-12 gap-3">
              {/* Cột trái: Diễn giải độ dương tính */}
              <div className="col-span-5 border border-slate-300 rounded bg-white">
                <div className="bg-slate-100 py-1.5 px-2 text-center font-bold text-red-700 text-[12.5px] uppercase border-b-2 border-slate-300">
                  DIỄN GIẢI ĐỘ DƯƠNG TÍNH
                </div>
                <table className="w-full text-[12px] border-collapse">
                  <thead className="bg-slate-50 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-1 px-1.5 text-center border-r border-slate-300 align-middle leading-snug">ĐỘ (+)</th>
                      <th className="py-1 px-1.5 text-center border-r border-slate-300 align-middle leading-snug">NỒNG ĐỘ (IU/ml)</th>
                      <th className="py-1 px-1.5 text-center align-middle leading-snug">DIỄN GIẢI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    <tr><td className="py-1 text-center border-r border-slate-300 align-middle leading-snug">0</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-300 align-middle leading-snug">&lt;0,34</td><td className="py-1 text-center font-semibold text-slate-700 align-middle leading-snug">Không phản ứng</td></tr>
                    <tr className="bg-amber-50/50"><td className="py-1 text-center border-r border-slate-300 font-bold align-middle leading-snug">1</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-300 align-middle leading-snug">0,35 - 0,69</td><td className="py-1 text-center font-bold text-amber-800 align-middle leading-snug">Yếu</td></tr>
                    <tr className="bg-amber-50/70"><td className="py-1 text-center border-r border-slate-300 font-bold align-middle leading-snug">2</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-300 align-middle leading-snug">0,70 - 3,49</td><td className="py-1 text-center font-bold text-amber-900 align-middle leading-snug">Trung bình</td></tr>
                    <tr className="bg-red-50/50"><td className="py-1 text-center border-r border-slate-300 font-bold align-middle leading-snug">3</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-300 align-middle leading-snug">3,50 - 17,49</td><td className="py-1 text-center font-bold text-red-700 align-middle leading-snug">Khá</td></tr>
                    <tr className="bg-red-50/70"><td className="py-1 text-center border-r border-slate-300 font-bold align-middle leading-snug">4</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-300 align-middle leading-snug">17,50 - 49,99</td><td className="py-1 text-center font-bold text-red-800 align-middle leading-snug">Mạnh</td></tr>
                    <tr className="bg-red-100/60"><td className="py-1 text-center border-r border-slate-300 font-bold align-middle leading-snug">5</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-300 align-middle leading-snug">50,00 - 99,99</td><td className="py-1 text-center font-bold text-red-900 align-middle leading-snug">Rất mạnh</td></tr>
                    <tr className="bg-red-100"><td className="py-1 text-center border-r border-slate-300 font-bold align-middle leading-snug">6</td><td className="py-1 text-center font-mono text-red-600 border-r border-slate-300 align-middle leading-snug">&gt;100,0</td><td className="py-1 text-center font-black text-red-950 align-middle leading-snug">Cực mạnh</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Cột phải: Triệu chứng thường gặp */}
              <div className="col-span-7 border border-slate-300 rounded p-2 text-[12px] leading-relaxed space-y-0.5 bg-slate-50/50">
                <div className="text-center font-bold text-red-700 text-[12.5px] uppercase pb-0.5 border-b border-slate-300 mb-0.5">
                  MỘT SỐ TRIỆU CHỨNG THƯỜNG GẶP KHI DỊ ỨNG
                </div>
                <p><strong className="text-slate-900">Da, niêm mạc:</strong> nổi mề đay, phát ban, viêm da; ngứa, sưng môi, lưỡi, miệng, mắt đỏ, viêm kết mạc.</p>
                <p><strong className="text-slate-900">Hô hấp:</strong> ho, khó thở, hắt hơi, sổ mũi, khò khè, hen suyễn, viêm phổi.</p>
                <p><strong className="text-slate-900">Tiêu hóa:</strong> nuốt khó, nôn, đau bụng, đầy hơi, tiêu chảy.</p>
                <p><strong className="text-slate-900">Thần kinh & Nặng:</strong> đau đầu, chóng mặt; Sốt, sốc phản vệ.</p>
                <p className="text-red-700 font-bold italic pt-0.5 border-t border-slate-300">
                  Nếu xuất hiện các triệu chứng trên sau tiếp xúc cần tư vấn bác sỹ ngay.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-200">
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
          className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 p-6 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-5 flex flex-col justify-between box-border"
          style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
        >
          <div>
            {/* Tiêu đề bảng chi tiết */}
            <div className="text-center mb-2.5">
              <h2 className="text-[17px] font-black text-slate-900 uppercase tracking-wide">
                CHI TIẾT KẾT QUẢ XÉT NGHIỆM {totalCount} DỊ NGUYÊN {detailPages.length > 1 ? `(PHẦN ${pageIdx + 1})` : ''}
              </h2>
            </div>

            {/* Bảng Chi Tiết */}
            <div className="border border-slate-300 rounded bg-white">
              <table className="w-full text-[11.5px] border-collapse">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-300">
                  <tr>
                    <th className="py-2 px-1 w-7 text-center border-r border-slate-300 align-middle leading-snug">TT</th>
                    <th className="py-2 px-1 w-12 text-center border-r border-slate-300 align-middle leading-snug">CODE</th>
                    <th className="py-2 px-2 text-left border-r border-slate-300 align-middle leading-snug">TÊN CHỈ SỐ</th>
                    <th className="py-2 px-2 text-left border-r border-slate-300 align-middle leading-snug">TÊN DỊ NGUYÊN</th>
                    <th className="py-2 px-2 w-28 text-left border-r border-slate-300 align-middle leading-snug">Đường dị ứng</th>
                    <th className="py-2 px-1.5 w-20 text-center border-r border-slate-300 leading-tight align-middle">BÌNH THƯỜNG<br/>(IU/ml)</th>
                    <th className="py-2 px-1.5 w-20 text-center border-r border-slate-300 leading-tight align-middle">KẾT QUẢ<br/>(IU/ml)</th>
                    <th className="py-2 px-1 w-10 text-center border-r border-slate-300 leading-tight align-middle">ĐỘ<br/>(+)</th>
                    <th className="py-2 px-2 text-left align-middle leading-snug">GHI CHÚ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {pageItems.map((item) => (
                    <tr 
                      key={item.code} 
                      className={`hover:bg-slate-50 ${item.isPositive ? 'bg-red-50/50' : 'bg-white'}`}
                    >
                      <td className="py-1.5 px-1 text-center font-mono text-slate-500 border-r border-slate-300 align-middle leading-snug">{item.tt}</td>
                      <td className="py-1.5 px-1 text-center font-mono font-bold text-sky-800 border-r border-slate-300 text-[12px] align-middle leading-snug">{item.code}</td>
                      <td className="py-1.5 px-2 font-semibold text-slate-900 border-r border-slate-300 text-[12px] align-middle leading-snug">{item.name}</td>
                      <td className="py-1.5 px-2 italic text-slate-600 border-r border-slate-300 text-[12px] align-middle leading-snug">{item.allergenName}</td>
                      <td className="py-1.5 px-2 text-slate-600 border-r border-slate-300 text-[11px] align-middle leading-snug">{item.route}</td>
                      <td className="py-1.5 px-1.5 text-center font-mono text-slate-600 border-r border-slate-300 text-[11.5px] align-middle leading-snug">{item.normalRef}</td>
                      <td className={`py-1.5 px-1.5 text-center font-mono font-bold border-r border-slate-300 text-[12.5px] align-middle leading-snug ${item.isPositive ? 'text-red-600' : 'text-slate-800'}`}>
                        {item.result}
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono font-bold text-red-600 border-r border-slate-300 text-[13px] align-middle leading-snug">
                        {item.isPositive ? item.grade : ''}
                      </td>
                      <td className="py-1.5 px-2 text-slate-600 text-[11px] leading-snug align-middle">{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-200">
            GOLAB CLINICAL LABORATORY • CHI TIẾT DỊ NGUYÊN • TRANG {pageIdx + 3}
          </div>
        </div>
      ))}

      {/* ========================================================================= */}
      {/* TRANG CUỐI: MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG */}
      {/* ========================================================================= */}
      <div 
        data-page="true"
        className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 p-8 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-6 flex flex-col justify-between box-border"
        style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
      >
        <div>
          {/* Tiêu đề trang lưu ý phòng ngừa */}
          <div className="text-center mb-5 pt-2">
            <h2 className="text-[20px] font-black text-red-700 uppercase tracking-wide">
              MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG
            </h2>
          </div>

          {/* Nội dung 5 điều hướng dẫn phòng ngừa */}
          <div className="text-[14px] text-slate-800 leading-relaxed space-y-3 text-justify">
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
              <div className="pl-4 pt-1.5 space-y-1 text-[13px] text-slate-700">
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

        <div className="text-center text-[10px] text-slate-400 font-mono pt-3 border-t border-slate-200">
          GOLAB CLINICAL LABORATORY • HƯỚNG DẪN PHÒNG NGỪA DỊ ỨNG • TRANG {detailPages.length + 3}
        </div>
      </div>

    </div>
  );
}
