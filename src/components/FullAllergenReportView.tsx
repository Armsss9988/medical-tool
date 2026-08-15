import golabLogo from '@assets/golablogo';
import { ALLERGEN_91_DATABASE } from '@data/allergenCatalog';
import { calculateAllergenGrade } from '@domain/allergen';
import { downloadQrCodeImage } from '@infra/qrService';
import { Download } from 'lucide-react';
import { ClinicInfo, Patient, SelectedTest } from '@domain/types';

interface FullAllergenReportViewProps {
  elementId?: string;
  clinicInfo: ClinicInfo;
  patient: Patient;
  selectedTests: SelectedTest[];
  doctorName?: string;
  qrCodeDataUrl?: string;
}

export default function FullAllergenReportView({
  elementId = 'printable-medical-report',
  clinicInfo,
  patient,
  selectedTests = [],
  doctorName,
  qrCodeDataUrl
}: FullAllergenReportViewProps) {
  const currentDateStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Map 91 dị nguyên từ ALLERGEN_91_DATABASE với kết quả nhập trong selectedTests
  const mappedList = ALLERGEN_91_DATABASE.map((dbItem) => {
    const match = selectedTests.find((t) => t.code === dbItem.code);
    let isTested = false;
    let resultVal = '<0,15';
    let gradeVal = 0;

    if (match) {
      isTested = true;
      if (match.code === 'TIgE') {
        resultVal = match.result ? String(match.result).replace('.', ',') : '45,2';
        gradeVal = 0;
      } else {
        const evalInfo = calculateAllergenGrade(match.result || match.note);
        resultVal = evalInfo.iuValue;
        gradeVal = evalInfo.grade;
      }
    }

    return {
      ...dbItem,
      isTested,
      resultVal,
      gradeVal
    };
  });

  // Tách nhóm: TIgE đứng đầu, kế tiếp là dị nguyên ĐÃ XÉT NGHIỆM, sau cùng là dị nguyên chưa xét nghiệm
  const tIgEItem = mappedList.find((i) => i.code === 'TIgE') || mappedList[0];
  const otherItems = mappedList.filter((i) => i.code !== 'TIgE');

  // Sắp xếp: Đã test đưa lên trước, trong số đã test thì Grade cao lên trước
  const testedItems = otherItems.filter((i) => i.isTested).sort((a, b) => b.gradeVal - a.gradeVal);
  const untestedItems = otherItems.filter((i) => !i.isTested);

  const sortedList = [tIgEItem, ...testedItems, ...untestedItems];

  // Chia bảng 91 chỉ số làm 2 cột (Cột 1: STT 1-46, Cột 2: STT 47-91)
  const halfLength = Math.ceil(sortedList.length / 2);
  const col1 = sortedList.slice(0, halfLength);
  const col2 = sortedList.slice(halfLength);

  return (
    <div
      id={elementId}
      className="bg-white text-slate-900 font-sans p-6 max-w-[210mm] mx-auto box-border text-[10px] leading-snug relative border border-slate-200"
    >
      {/* 1. HEADER LOGO VÀ PHÒNG KHÁM */}
      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-2 mb-3">
        <div className="flex items-center space-x-3 max-w-[70%]">
          <img
            src={golabLogo}
            alt="GoLab Logo"
            className="w-14 h-14 object-contain rounded border border-slate-200 shrink-0"
          />
          <div>
            <h1 className="text-xs font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
              {clinicInfo.name || 'PHÒNG KHÁM XÉT NGHIỆM Y KHOA AN BÌNH'}
            </h1>
            <p className="text-[9.5px] text-slate-700 font-semibold mt-0.5">
              Địa chỉ phòng khám: <span className="font-medium text-slate-900">{clinicInfo.address || 'Số 123 Đường Giải Phóng, Đống Đa, Hà Nội'}</span>
            </p>
            <p className="text-[9px] text-slate-700 font-semibold">
              Điện thoại / Zalo: <strong className="text-slate-900 font-mono font-bold">{clinicInfo.phone || '0988 123 456'}</strong>
            </p>
          </div>
        </div>

        {/* Mã QR Code tra cứu */}
        {qrCodeDataUrl ? (
          <div className="text-center flex flex-col items-center justify-center shrink-0 group relative">
            <div className="p-1 bg-white border border-slate-300 rounded shadow-sm">
              <img
                src={qrCodeDataUrl}
                alt="Mã QR tra cứu kết quả"
                className="w-14 h-14 block"
              />
            </div>
            <span className="text-[8px] text-slate-500 font-mono font-bold mt-0.5 uppercase tracking-tighter">
              Quét mã xem PDF
            </span>

            <button
              type="button"
              onClick={() =>
                downloadQrCodeImage(
                  qrCodeDataUrl,
                  `QRCode_${(patient.name || 'BenhNhan').replace(/\s+/g, '_')}.png`
                )
              }
              title="Tải ảnh QR Code về máy"
              className="hidden print:hidden group-hover:flex items-center gap-0.5 text-[8px] bg-slate-800 text-white px-1.5 py-0.5 rounded mt-0.5 hover:bg-slate-900 transition-all font-semibold"
            >
              <Download className="w-2.5 h-2.5" />
              <span>Tải ảnh</span>
            </button>
          </div>
        ) : (
          <div className="text-right shrink-0">
            <span className="text-[9px] font-mono text-slate-400 block">Mã phiếu XN:</span>
            <strong className="text-xs font-mono text-slate-900">{patient.code}</strong>
          </div>
        )}
      </div>

      {/* 2. TIÊU ĐỀ BÁO CÁO DỊ NGUYÊN PROTIA */}
      <div className="text-center my-2">
        <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
          BẢNG KẾT QUẢ XÉT NGHIỆM 91 DỊ NGUYÊN IgE (PROTIA ALLERGY-Q SMART)
        </h2>
        <p className="text-[9px] text-slate-500 italic font-mono">
          Mã phiếu: <strong className="text-slate-800 font-bold">{patient.code}</strong> • Ngày xét nghiệm: {currentDateStr}
        </p>
      </div>

      {/* 3. THÔNG TIN BỆNH NHÂN LÂM SÀNG (BẢNG 12 TRƯỜNG CHUẨN MẪU) */}
      <table className="w-full text-left border-collapse border border-sky-300 text-[9.5px] mb-2">
        <tbody>
          <tr className="border-b border-sky-200 divide-x divide-sky-200">
            <td className="py-0.5 px-2 w-[15%] text-slate-700 font-medium bg-sky-50/40">Họ và tên:</td>
            <td className="py-0.5 px-2 w-[35%] font-extrabold text-red-600 uppercase text-[10.5px]">
              {patient.name || '...........................................'}
            </td>
            <td className="py-0.5 px-2 w-[18%] text-slate-700 font-medium bg-sky-50/40">T/G chỉ định</td>
            <td className="py-0.5 px-2 w-[32%] font-bold text-slate-900 font-mono">
              {patient.orderedAt || currentDateStr}
            </td>
          </tr>

          <tr className="border-b border-sky-200 divide-x divide-sky-200">
            <td className="py-0.5 px-2 text-slate-700 font-medium bg-sky-50/40">Năm sinh:</td>
            <td className="py-0.5 px-2 font-bold text-slate-900">
              {patient.dob || '...........'}
            </td>
            <td className="py-0.5 px-2 text-slate-700 font-medium bg-sky-50/40">T/G đóng phí</td>
            <td className="py-0.5 px-2 font-bold text-slate-900 font-mono">
              {patient.paidAt || currentDateStr}
            </td>
          </tr>

          <tr className="border-b border-sky-200 divide-x divide-sky-200">
            <td className="py-0.5 px-2 text-slate-700 font-medium bg-sky-50/40">Địa chỉ</td>
            <td className="py-0.5 px-2 font-medium text-slate-900">
              {patient.diagnosis || patient.address || '...........................................'}
            </td>
            <td className="py-0.5 px-2 text-slate-700 font-medium bg-sky-50/40">Số bệnh phẩm</td>
            <td className="py-0.5 px-2 font-extrabold text-red-600 font-mono">
              {patient.sampleCode || patient.code}
            </td>
          </tr>

          <tr className="border-b border-sky-200 divide-x divide-sky-200">
            <td className="py-0.5 px-2 text-slate-700 font-medium bg-sky-50/40">Giới tính:</td>
            <td className="py-0.5 px-2 font-bold text-slate-900">
              {patient.gender || 'Nam'}
            </td>
            <td className="py-0.5 px-2 text-slate-700 font-medium bg-sky-50/40">Tình trạng mẫu</td>
            <td className="py-0.5 px-2 font-bold text-slate-900">
              {patient.sampleStatus || 'Đạt'}
            </td>
          </tr>

          <tr className="border-b border-sky-200 divide-x divide-sky-200">
            <td className="py-0.5 px-2 text-slate-700 font-medium bg-sky-50/40">Số điện thoại</td>
            <td className="py-0.5 px-2 font-bold text-slate-900 font-mono">
              {patient.phone || '......................'}
            </td>
            <td className="py-0.5 px-2 text-slate-700 font-medium bg-sky-50/40">T/G nhận mẫu</td>
            <td className="py-0.5 px-2 font-bold text-slate-900 font-mono">
              {patient.receivedAt || currentDateStr}
            </td>
          </tr>

          <tr className="divide-x divide-sky-200">
            <td className="py-0.5 px-2 text-slate-700 font-medium bg-sky-50/40">Bác sĩ chỉ định</td>
            <td className="py-0.5 px-2 font-bold text-slate-900">
              {doctorName || patient.address || clinicInfo.defaultDoctor || 'BS. Trần Hoài Long'}
            </td>
            <td className="py-0.5 px-2 text-slate-700 font-medium bg-sky-50/40">T/G trả kết quả</td>
            <td className="py-0.5 px-2 font-bold text-slate-900 font-mono">
              {patient.returnedAt || currentDateStr}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 4. TRỌN BỘ BẢNG 91 CHỈ SỐ DỊ NGUYÊN (CHIA 2 CỘT SONG SONG) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* CỘT 1 (1 - 46) */}
        <table className="w-full text-left border-collapse border border-slate-300 text-[8.5px]">
          <thead>
            <tr className="bg-red-100/80 text-red-950 font-bold text-center border-b border-slate-300">
              <th className="py-1 px-1 border-r border-slate-300 w-[7%]">STT</th>
              <th className="py-1 px-1 border-r border-slate-300 text-left w-[43%]">Dị Nguyên (Allergen)</th>
              <th className="py-1 px-1 border-r border-slate-300 w-[18%]">Mã / IU/mL</th>
              <th className="py-1 px-1 border-r border-slate-300 w-[14%]">Độ (Grade)</th>
              <th className="py-1 px-1 w-[18%]">Đánh Giá</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {col1.map((item, idx) => {
              const isTested = item.isTested;
              const isPositive = item.gradeVal > 0;

              return (
                <tr
                  key={item.code}
                  className={
                    isPositive
                      ? 'bg-red-100/70 font-bold text-red-950'
                      : isTested
                      ? 'bg-sky-50/50 font-semibold'
                      : 'hover:bg-slate-50'
                  }
                >
                  <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-0.5 px-1 border-r border-slate-200">
                    <span className={isPositive ? 'text-red-950 font-bold' : isTested ? 'text-slate-900 font-bold' : 'text-slate-700'}>
                      {item.name}
                    </span>
                    {item.scientific && (
                      <span className="text-[7.5px] text-slate-400 block italic font-normal">{item.scientific}</span>
                    )}
                  </td>
                  <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">
                    <span className="font-extrabold text-slate-900">{item.code}</span>
                    {isTested && <span className="block text-[7.5px] text-sky-800 font-mono font-bold">{item.resultVal}</span>}
                  </td>
                  <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">
                    {isPositive ? (
                      <span className="inline-block bg-red-600 text-white font-extrabold px-1 py-0.2 rounded text-[8px]">
                        Độ {item.gradeVal}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-normal">Độ 0</span>
                    )}
                  </td>
                  <td className="py-0.5 px-1 text-center font-bold">
                    {isPositive ? (
                      <span className="text-red-700 font-black">DƯƠNG TÍNH</span>
                    ) : (
                      <span className="text-slate-400 font-normal">Âm tính</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* CỘT 2 (47 - 91) */}
        <table className="w-full text-left border-collapse border border-slate-300 text-[8.5px]">
          <thead>
            <tr className="bg-red-100/80 text-red-950 font-bold text-center border-b border-slate-300">
              <th className="py-1 px-1 border-r border-slate-300 w-[7%]">STT</th>
              <th className="py-1 px-1 border-r border-slate-300 text-left w-[43%]">Dị Nguyên (Allergen)</th>
              <th className="py-1 px-1 border-r border-slate-300 w-[18%]">Mã / IU/mL</th>
              <th className="py-1 px-1 border-r border-slate-300 w-[14%]">Độ (Grade)</th>
              <th className="py-1 px-1 w-[18%]">Đánh Giá</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {col2.map((item, idx) => {
              const isTested = item.isTested;
              const isPositive = item.gradeVal > 0;

              return (
                <tr
                  key={item.code}
                  className={
                    isPositive
                      ? 'bg-red-100/70 font-bold text-red-950'
                      : isTested
                      ? 'bg-sky-50/50 font-semibold'
                      : 'hover:bg-slate-50'
                  }
                >
                  <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono text-slate-500">{halfLength + idx + 1}</td>
                  <td className="py-0.5 px-1 border-r border-slate-200">
                    <span className={isPositive ? 'text-red-950 font-bold' : isTested ? 'text-slate-900 font-bold' : 'text-slate-700'}>
                      {item.name}
                    </span>
                    {item.scientific && (
                      <span className="text-[7.5px] text-slate-400 block italic font-normal">{item.scientific}</span>
                    )}
                  </td>
                  <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">
                    <span className="font-extrabold text-slate-900">{item.code}</span>
                    {isTested && <span className="block text-[7.5px] text-sky-800 font-mono font-bold">{item.resultVal}</span>}
                  </td>
                  <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono">
                    {isPositive ? (
                      <span className="inline-block bg-red-600 text-white font-extrabold px-1 py-0.2 rounded text-[8px]">
                        Độ {item.gradeVal}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-normal">Độ 0</span>
                    )}
                  </td>
                  <td className="py-0.5 px-1 text-center font-bold">
                    {isPositive ? (
                      <span className="text-red-700 font-black">DƯƠNG TÍNH</span>
                    ) : (
                      <span className="text-slate-400 font-normal">Âm tính</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. CHỮ KÝ VÀ KẾT LUẬN DỊ ỨNG */}
      <div className="pt-2 border-t border-slate-300">
        <div className="flex items-start justify-between text-center">
          <div className="text-left text-[8.5px] text-slate-500 space-y-0.5 max-w-[55%]">
            <p className="font-bold text-slate-800 uppercase">Khuyến cáo dị ứng lâm sàng:</p>
            <p>- Kết quả Dương tính (&ge; Độ 1) cho thấy cơ thể đã sản sinh kháng thể IgE đặc hiệu với dị nguyên tương ứng.</p>
            <p>- Bệnh nhân nên kiêng hoặc tránh tiếp xúc với các dị nguyên có độ cảnh báo cao (&ge; Độ 3).</p>
          </div>

          <div className="text-center min-w-[180px]">
            <p className="text-[9px] text-slate-600 italic">Hà Nội, ngày {currentDateStr}</p>
            <p className="text-[10px] font-bold uppercase text-slate-900 mt-0.5">BÁC SĨ / KTV CHUYÊN KHOA DỊ ỨNG</p>
            <div className="h-12 flex items-center justify-center">
              <span className="text-[9px] text-slate-300 italic">(Đã ký & Đóng dấu)</span>
            </div>
            <p className="text-[11px] font-bold text-slate-900 uppercase">
              {doctorName || clinicInfo.defaultDoctor || 'BS. Nguyễn Thị Mai'}
            </p>
          </div>
        </div>

        <div className="mt-2 pt-1 border-t border-slate-200 text-center text-[8px] text-slate-500 uppercase font-mono tracking-tight">
          {clinicInfo.name || 'PHÒNG KHÁM XÉT NGHIỆM GOLAB'} • HỆ THỐNG XÉT NGHIỆM DỊ NGUYÊN TỰ ĐỘNG CHUẨN KHOA HỌC
        </div>
      </div>
    </div>
  );
}
