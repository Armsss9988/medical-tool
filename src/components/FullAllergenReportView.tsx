import React from 'react';
import golabLogo from '@assets/golablogo.jpg';
import doctorStamp from '@assets/doctorstamp.jpg';
import { Patient, SelectedTest, ClinicInfo } from '@domain/types';

interface FullAllergenReportViewProps {
  patient: Patient;
  allergenTests: SelectedTest[];
  currentDateStr: string;
  doctorName: string;
  clinicInfo?: ClinicInfo;
}

export default function FullAllergenReportView({
  patient,
  allergenTests,
  currentDateStr,
  doctorName,
  clinicInfo = {
    name: 'CÔNG TY CỔ PHẦN TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
    address: 'P. Đồng Sơn – Quảng Trị',
    phone: '098 3633677',
    logoUrl: '',
    defaultDoctor: 'BS. Nguyễn Thị Mai'
  }
}: FullAllergenReportViewProps) {
  // Lấy ra danh sách các dị nguyên có giá trị
  const activeTests = allergenTests.filter((t) => t.value !== undefined && t.value !== null && t.value !== '');

  // Đếm phân loại theo cấp độ dị ứng (Grade 0 -> Grade 6)
  const gradeCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  activeTests.forEach((t) => {
    const val = parseFloat(String(t.value || '0'));
    if (val < 0.35) gradeCounts[0]++;
    else if (val < 0.7) gradeCounts[1]++;
    else if (val < 3.5) gradeCounts[2]++;
    else if (val < 17.5) gradeCounts[3]++;
    else if (val < 50) gradeCounts[4]++;
    else if (val < 100) gradeCounts[5]++;
    else gradeCounts[6]++;
  });

  return (
    <div className="bg-white text-slate-900 font-sans p-6 max-w-[210mm] mx-auto text-xs leading-relaxed min-h-[297mm] flex flex-col justify-between print:p-4 print:max-w-none print:w-full">
      
      {/* 1. HEADER LOGO & PHÒNG KHÁM */}
      <div>
        <div className="flex items-center justify-between border-b border-red-200 pb-2 mb-2">
          <div className="flex items-center space-x-3">
            <img src={golabLogo} alt="GoLab Logo" className="h-14 w-auto object-contain" />
            <div>
              <h1 className="text-xs font-black text-red-950 uppercase tracking-tight">
                {clinicInfo.name || 'CÔNG TY CỔ PHẦN TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
              </h1>
              <p className="text-[9.5px] text-slate-600">
                ĐC: {clinicInfo.address || 'P. Đồng Sơn – Quảng Trị'} • SĐT: {clinicInfo.phone || '098 3633677'}
              </p>
              <p className="text-[9px] text-red-700 font-bold italic">
                TRUNG TÂM XÉT NGHIỆM DỊ NGUYÊN PROTIA SMART ANALYZER (91 CHỈ SỐ IGE)
              </p>
            </div>
          </div>
          <div className="text-right border-l border-red-200 pl-3">
            <span className="text-[9px] text-slate-500 font-mono block">Mã phiếu XN:</span>
            <span className="text-xs font-mono font-extrabold text-red-700">{patient.code || 'DN-91'}</span>
          </div>
        </div>

        {/* TIÊU ĐỀ BÁO CÁO */}
        <div className="text-center my-1.5">
          <h2 className="text-base font-black uppercase text-red-900 tracking-wider">
            BÁO CÁO KẾT QUẢ XÉT NGHIỆM DỊ NGUYÊN IgE (91 CHỈ SỐ)
          </h2>
          <p className="text-[9.5px] text-slate-500 font-medium">Bảng Phân Tích Mức Độ Nhạy Cảm Dị Ứng Toàn Diện</p>
        </div>

        {/* 2. BẢNG THÔNG TIN BỆNH NHÂN 12 TRƯỜNG KHỚP 100% MẪU ẢNH Y KHOA */}
        <div className="my-2 border border-slate-300 rounded overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <tbody>
              {/* Hàng 1 */}
              <tr className="border-b border-slate-200">
                <td className="py-1 px-2.5 bg-slate-50 font-medium text-slate-700 w-[18%]">Họ và tên:</td>
                <td className="py-1 px-2.5 font-extrabold text-red-600 uppercase text-xs w-[32%]">{patient.name || '---'}</td>
                <td className="py-1 px-2.5 bg-slate-50 font-medium text-slate-700 w-[18%]">Năm sinh:</td>
                <td className="py-1 px-2.5 font-bold text-slate-900 w-[32%]">{patient.dob || '---'}</td>
              </tr>
              {/* Hàng 2 */}
              <tr className="border-b border-slate-200">
                <td className="py-1 px-2.5 bg-slate-50 font-medium text-slate-700">Giới tính:</td>
                <td className="py-1 px-2.5 font-semibold text-slate-900">{patient.gender || 'Nam'}</td>
                <td className="py-1 px-2.5 bg-slate-50 font-medium text-slate-700">Số điện thoại:</td>
                <td className="py-1 px-2.5 font-mono text-slate-900">{patient.phone || '---'}</td>
              </tr>
              {/* Hàng 3 */}
              <tr className="border-b border-slate-200">
                <td className="py-1 px-2.5 bg-slate-50 font-medium text-slate-700">Địa chỉ:</td>
                <td className="py-1 px-2.5 font-medium text-slate-900" colSpan={3}>
                  {patient.address || patient.diagnosis || 'P. Đồng Sơn – Quảng Trị'}
                </td>
              </tr>
              {/* Hàng 4 */}
              <tr className="border-b border-slate-200">
                <td className="py-1 px-2.5 bg-slate-50 font-medium text-slate-700">Bác sĩ chỉ định:</td>
                <td className="py-1 px-2.5 font-bold text-sky-900">{patient.address || clinicInfo.defaultDoctor || 'BS. Trần Hoài Long'}</td>
                <td className="py-1 px-2.5 bg-slate-50 font-medium text-slate-700">Số bệnh phẩm:</td>
                <td className="py-1 px-2.5 font-mono font-extrabold text-red-600 text-xs">{patient.code || '14509'}</td>
              </tr>
              {/* Hàng 5 */}
              <tr className="border-b border-slate-200">
                <td className="py-1 px-2.5 bg-slate-50 font-medium text-slate-700">T/G chỉ định:</td>
                <td className="py-1 px-2.5 font-mono text-[11px] text-slate-800">{patient.orderedAt || currentDateStr}</td>
                <td className="py-1 px-2.5 bg-slate-50 font-medium text-slate-700">T/G đóng phí:</td>
                <td className="py-1 px-2.5 font-mono text-[11px] text-slate-800">{patient.paidAt || currentDateStr}</td>
              </tr>
              {/* Hàng 6 */}
              <tr>
                <td className="py-1 px-2.5 bg-slate-50 font-medium text-slate-700">T/G nhận mẫu:</td>
                <td className="py-1 px-2.5 font-mono text-[11px] text-slate-800">{patient.receivedAt || currentDateStr}</td>
                <td className="py-1 px-2.5 bg-slate-50 font-medium text-slate-700">T/G trả kết quả:</td>
                <td className="py-1 px-2.5 font-mono text-[11px] text-slate-800">{patient.returnedAt || currentDateStr}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. TỔNG QUAN PHÂN NĂNG CẤP ĐỘ DỊ ỨNG */}
        <div className="my-2 p-2 bg-red-50/60 border border-red-200 rounded">
          <h4 className="text-[10px] font-bold text-red-950 uppercase mb-1">
            Tổng quan kết quả 91 Dị nguyên (Cấp độ phản ứng IgE):
          </h4>
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px]">
            <div className="bg-white p-1 rounded border border-slate-200">
              <span className="block font-bold text-slate-700">Độ 0</span>
              <span className="text-[9px] text-slate-500">&lt; 0.35</span>
              <strong className="block text-slate-800 font-extrabold">{gradeCounts[0]}</strong>
            </div>
            <div className="bg-emerald-50 p-1 rounded border border-emerald-200">
              <span className="block font-bold text-emerald-800">Độ 1</span>
              <span className="text-[9px] text-emerald-600">0.35-0.69</span>
              <strong className="block text-emerald-900 font-extrabold">{gradeCounts[1]}</strong>
            </div>
            <div className="bg-emerald-100 p-1 rounded border border-emerald-300">
              <span className="block font-bold text-emerald-900">Độ 2</span>
              <span className="text-[9px] text-emerald-700">0.70-3.49</span>
              <strong className="block text-emerald-950 font-extrabold">{gradeCounts[2]}</strong>
            </div>
            <div className="bg-amber-50 p-1 rounded border border-amber-300">
              <span className="block font-bold text-amber-800">Độ 3</span>
              <span className="text-[9px] text-amber-600">3.50-17.49</span>
              <strong className="block text-amber-900 font-extrabold">{gradeCounts[3]}</strong>
            </div>
            <div className="bg-orange-100 p-1 rounded border border-orange-300">
              <span className="block font-bold text-orange-900">Độ 4</span>
              <span className="text-[9px] text-orange-700">17.5-49.9</span>
              <strong className="block text-orange-950 font-extrabold">{gradeCounts[4]}</strong>
            </div>
            <div className="bg-rose-100 p-1 rounded border border-rose-300">
              <span className="block font-bold text-rose-900">Độ 5</span>
              <span className="text-[9px] text-rose-700">50.0-99.9</span>
              <strong className="block text-rose-950 font-extrabold">{gradeCounts[5]}</strong>
            </div>
            <div className="bg-red-200 p-1 rounded border border-red-400">
              <span className="block font-bold text-red-950">Độ 6</span>
              <span className="text-[9px] text-red-800">&ge; 100</span>
              <strong className="block text-red-950 font-black">{gradeCounts[6]}</strong>
            </div>
          </div>
        </div>

        {/* 4. BẢNG CHI TIẾT KẾT QUẢ DỊ NGUYÊN */}
        <div className="my-2 flex-1">
          <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
            <thead className="bg-red-100 text-red-950 font-bold uppercase border-b border-red-300">
              <tr>
                <th className="py-1 px-1.5 text-center w-7 border-r border-red-200">STT</th>
                <th className="py-1 px-1.5 w-14 border-r border-red-200 font-mono text-center">Mã</th>
                <th className="py-1 px-2 border-r border-red-200">Tên Dị Nguyên (Tiếng Việt)</th>
                <th className="py-1 px-2 border-r border-red-200">Tên Khoa Học (Latin)</th>
                <th className="py-1 px-1.5 text-center w-16 border-r border-red-200">Hàm Lượng (IU/mL)</th>
                <th className="py-1 px-1.5 text-center w-16">Cấp Độ (Grade)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activeTests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                    Chưa nhập dữ liệu kết quả dị nguyên.
                  </td>
                </tr>
              ) : (
                activeTests.map((t, idx) => {
                  const val = parseFloat(String(t.value || '0'));
                  let grade = 'Độ 0';
                  let gradeBg = 'bg-white text-slate-700';

                  if (val >= 100) { grade = 'Độ 6'; gradeBg = 'bg-red-600 text-white font-extrabold'; }
                  else if (val >= 50) { grade = 'Độ 5'; gradeBg = 'bg-rose-500 text-white font-bold'; }
                  else if (val >= 17.5) { grade = 'Độ 4'; gradeBg = 'bg-orange-500 text-white font-bold'; }
                  else if (val >= 3.5) { grade = 'Độ 3'; gradeBg = 'bg-amber-400 text-slate-900 font-bold'; }
                  else if (val >= 0.7) { grade = 'Độ 2'; gradeBg = 'bg-emerald-200 text-emerald-950 font-bold'; }
                  else if (val >= 0.35) { grade = 'Độ 1'; gradeBg = 'bg-emerald-100 text-emerald-900'; }

                  return (
                    <tr key={t.code} className="hover:bg-slate-50">
                      <td className="py-0.5 px-1.5 text-center font-mono text-[9.5px] border-r border-slate-200 text-slate-500">{idx + 1}</td>
                      <td className="py-0.5 px-1.5 text-center font-mono font-bold text-red-700 border-r border-slate-200">{t.code}</td>
                      <td className="py-0.5 px-2 font-bold text-slate-900 border-r border-slate-200">{t.name}</td>
                      <td className="py-0.5 px-2 italic text-slate-600 border-r border-slate-200">{t.scientific || t.refText || '---'}</td>
                      <td className="py-0.5 px-1.5 text-center font-mono font-bold text-slate-900 border-r border-slate-200">{t.value}</td>
                      <td className="py-0.5 px-1.5 text-center font-mono">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${gradeBg}`}>{grade}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
            <div className="h-16 flex items-center justify-center py-1">
              <img
                src={doctorStamp}
                alt="Đã ký & Đóng dấu"
                className="h-16 w-auto object-contain max-w-[100px]"
              />
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
