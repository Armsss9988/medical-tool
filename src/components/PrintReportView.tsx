import React from 'react';
import { evaluateResult } from '@domain/testResult';
import { downloadQrCodeImage } from '@infra/qrService';
import { Download } from 'lucide-react';
import golabLogo from '@assets/golablogo.jpg';
import doctorStamp from '@assets/doctorstamp.jpg';
import { Patient, SelectedTest, ClinicInfo } from '@domain/types';

interface PrintReportViewProps {
  elementId?: string;
  patient: Patient;
  selectedTests?: SelectedTest[];
  currentDateStr?: string;
  doctorName?: string;
  conclusion?: string;
  qrCodeUrl?: string;
  qrCodeDataUrl?: string;
  clinicInfo?: ClinicInfo;
}

export default function PrintReportView({
  elementId = 'printable-medical-report',
  patient,
  selectedTests = [],
  currentDateStr = new Date().toLocaleDateString('vi-VN'),
  doctorName = '',
  conclusion = '',
  qrCodeUrl,
  qrCodeDataUrl,
  clinicInfo = {
    name: 'CÔNG TY CỔ PHẦN TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
    address: 'P. Đồng Sơn – Quảng Trị',
    phone: '098 3633677',
    logoUrl: '',
    defaultDoctor: 'BS. Trần Hoài Long'
  }
}: PrintReportViewProps) {
  const finalQrCode = qrCodeUrl || qrCodeDataUrl;
  const tests = selectedTests || [];

  // Gom nhóm các chỉ số theo nhóm xét nghiệm
  const groupedCategories: Record<string, SelectedTest[]> = {};
  tests.forEach((t) => {
    const cat = t.category || 'XÉT NGHIỆM KHÁC';
    if (!groupedCategories[cat]) {
      groupedCategories[cat] = [];
    }
    groupedCategories[cat].push(t);
  });

  return (
    <div
      id={elementId}
      className="bg-white text-slate-900 font-sans p-6 max-w-[210mm] mx-auto text-xs leading-relaxed min-h-[297mm] flex flex-col justify-between print:p-4 print:max-w-none print:shadow-none print:w-full"
    >
      
      {/* KHUNG NỘI DUNG CHÍNH (TOP & MIDDLE) */}
      <div className="flex-1 flex flex-col justify-start">
        
        {/* HEADER PHÒNG KHÁM & MÃ QR */}
        <div className="flex items-start justify-between border-b border-slate-300 pb-3 mb-3">
          <div className="flex items-center space-x-3">
            <img
              src={golabLogo}
              alt="GoLab Logo"
              className="h-16 w-auto object-contain"
            />
            <div>
              <h1 className="text-sm font-black text-sky-950 uppercase tracking-tight">
                {clinicInfo.name || 'CÔNG TY CỔ PHẦN TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
              </h1>
              <p className="text-[10px] text-slate-600 font-medium">
                ĐC: {clinicInfo.address || 'P. Đồng Sơn – Quảng Trị'} • SĐT: {clinicInfo.phone || '098 3633677'}
              </p>
              <p className="text-[9.5px] text-sky-800 font-semibold italic">
                Chuyên khoa Xét nghiệm - Chất lượng - Nhanh chóng - Chính xác
              </p>
            </div>
          </div>

          {/* Khung QR Code bên phải Header */}
          {finalQrCode ? (
            <div className="flex flex-col items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded">
              <img src={finalQrCode} alt="Mã QR Tra Cứu" className="w-16 h-16 object-contain" />
              <button
                onClick={() => downloadQrCodeImage(finalQrCode, `QRCode_${patient.code || 'Golab'}.png`)}
                title="Tải ảnh QR Code về máy"
                className="mt-0.5 flex items-center space-x-0.5 text-[8.5px] text-sky-700 font-bold hover:underline print:hidden"
              >
                <Download className="w-2.5 h-2.5" />
                <span>Tải QR</span>
              </button>
            </div>
          ) : (
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 block">Mã phiếu XN:</span>
              <span className="text-xs font-mono font-bold text-sky-900">{patient.code}</span>
            </div>
          )}
        </div>

        {/* TIÊU ĐỀ PHIẾU KẾT QUẢ */}
        <div className="text-center my-2">
          <h2 className="text-lg font-black uppercase text-sky-900 tracking-wide">
            PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM
          </h2>
          <div className="w-16 h-0.5 bg-sky-600 mx-auto mt-1 rounded-full"></div>
        </div>

        {/* BẢNG THÔNG TIN BỆNH NHÂN 12 TRƯỜNG KHỚP HÌNH ẢNH MẪU Y KHOA */}
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

        {/* BẢNG KẾT QUẢ XÉT NGHIỆM */}
        <div className="my-2 flex-1">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead className="bg-sky-100 text-sky-950 font-bold uppercase border-b border-slate-300 text-[11px]">
              <tr>
                <th className="py-1.5 px-2 text-center w-9 border-r border-slate-300">STT</th>
                <th className="py-1.5 px-2.5 border-r border-slate-300">Tên Chỉ Số Xét Nghiệm</th>
                <th className="py-1.5 px-2.5 text-center w-28 border-r border-slate-300">Kết Quả</th>
                <th className="py-1.5 px-2.5 text-center w-20 border-r border-slate-300">Đơn Vị</th>
                <th className="py-1.5 px-2.5 text-center w-36">Trị Số Tham Chiếu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Object.keys(groupedCategories).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                    Chưa có chỉ số xét nghiệm nào được chọn.
                  </td>
                </tr>
              ) : (
                Object.entries(groupedCategories).map(([catName, tests]) => (
                  <React.Fragment key={catName}>
                    {/* Tiêu đề Nhóm Xét Nghiệm */}
                    <tr className="bg-slate-100 font-bold text-sky-900 border-y border-slate-300">
                      <td colSpan={5} className="py-1 px-3 text-[11px] uppercase tracking-wide">
                        • {catName}
                      </td>
                    </tr>
                    {/* Danh sách chỉ số thuộc Nhóm */}
                    {tests.map((test, index) => {
                      const valStr = test.result !== undefined && test.result !== null && test.result !== ''
                        ? String(test.result)
                        : (test as any).value !== undefined && (test as any).value !== null && (test as any).value !== ''
                        ? String((test as any).value)
                        : '';

                      const evalRes = evaluateResult(valStr, test.refMin ?? null, test.refMax ?? null);
                      const isHigh = evalRes.status === 'high';
                      const isLow = evalRes.status === 'low';

                      return (
                        <tr key={test.code} className="hover:bg-slate-50/50">
                          <td className="py-1 px-2 text-center text-slate-500 font-mono text-[11px] border-r border-slate-200">
                            {index + 1}
                          </td>
                          <td className="py-1 px-2.5 border-r border-slate-200">
                            <span className="font-semibold text-slate-900">{test.name}</span>
                            <span className="ml-1 text-[10px] text-slate-400 font-mono">({test.code})</span>
                          </td>
                          <td className="py-1 px-2.5 text-center font-mono font-bold border-r border-slate-200 text-xs">
                            <span
                              className={
                                isHigh
                                  ? 'text-red-600 font-black'
                                  : isLow
                                  ? 'text-amber-600 font-black'
                                  : 'text-slate-900'
                              }
                            >
                              {valStr || '---'}
                            </span>
                          </td>
                          <td className="py-1 px-2.5 text-center font-mono text-[11px] text-slate-600 border-r border-slate-200">
                            {test.unit || '---'}
                          </td>
                          <td className="py-1 px-2.5 text-center font-mono text-[11px] text-slate-600">
                            {test.refText || (test.refMin !== null && test.refMax !== null ? `${test.refMin} - ${test.refMax}` : 'Bình thường')}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* KẾT LUẬN VÀ LỜI KHUYÊN BÁC SĨ */}
        {conclusion && (
          <div className="my-2 p-2.5 bg-slate-50 border border-slate-200 rounded">
            <h4 className="text-[11px] font-bold text-sky-900 uppercase mb-0.5">Kết luận & Lời khuyên Bác sĩ:</h4>
            <p className="text-xs text-slate-800 whitespace-pre-line font-medium leading-relaxed">
              {conclusion}
            </p>
          </div>
        )}

      </div>

      {/* FOOTER CHỮ KÝ VÀ NGÀY THÁNG (BOTTOM) */}
      <div className="mt-6 pt-3 border-t border-slate-300">
        <div className="flex items-start justify-between text-center">
          
          {/* Bên trái: Chú thích & Lưu ý */}
          <div className="text-left text-[9px] text-slate-500 space-y-0.5 max-w-[50%]">
            <p className="font-bold text-slate-700 uppercase">Lưu ý đối với bệnh nhân:</p>
            <p>- Phiếu kết quả này chỉ có giá trị tại thời điểm xét nghiệm.</p>
            <p>- Vui lòng mang phiếu này khi đến tái khám hoặc tư vấn bác sĩ chuyên khoa.</p>
          </div>

          {/* Bên phải: Chữ ký & Đóng dấu Bác sĩ */}
          <div className="text-center min-w-[200px]">
            <p className="text-[10px] text-slate-600 italic">Hà Nội, ngày {currentDateStr}</p>
            <p className="text-[11px] font-bold uppercase text-slate-900 mt-1">BÁC SĨ / KTV XÉT NGHIỆM</p>
            <div className="h-20 flex items-center justify-center py-1">
              <img
                src={doctorStamp}
                alt="Đã ký & Đóng dấu"
                className="h-20 w-auto object-contain max-w-[120px]"
              />
            </div>
            <p className="text-xs font-bold text-slate-900 uppercase">
              {doctorName || clinicInfo.defaultDoctor || 'BS. CKII. Lê Anh Minh'}
            </p>
          </div>

        </div>

        {/* Dòng copyright chân trang */}
        <div className="mt-4 pt-1 border-t border-slate-200 text-center text-[8.5px] text-slate-500 uppercase font-mono tracking-tight">
          {clinicInfo.name || 'PHÒNG KHÁM XÉT NGHIỆM GOLAB'} • ĐỊA CHỈ: {clinicInfo.address || 'Số 123 Đường Giải Phóng, Đống Đa, Hà Nội'} • HOTLINE: {clinicInfo.phone || '0988 123 456'}
        </div>
      </div>

    </div>
  );
}
