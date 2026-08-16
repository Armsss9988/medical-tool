import { evaluateResult } from '@domain/testResult';
import { downloadQrCodeImage } from '@infra/qrService';
import { Download } from 'lucide-react';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import { Patient, SelectedTest, ClinicInfo } from '@domain/types';
import React from 'react';

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
    defaultDoctor: 'BS. Trần Hoài Long'
  }
}: PrintReportViewProps) {
  const tests = selectedTests || [];
  const finalQrCode = qrCodeDataUrl || qrCodeUrl;

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
              <p className="text-[10px] font-bold text-sky-800 uppercase tracking-widest leading-none mb-0.5">
                HỆ THỐNG XÉT NGHIỆM GOLAB
              </p>
              <h1 className="text-sm font-black text-sky-950 uppercase tracking-tight">
                {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
              </h1>
              <p className="text-[10px] text-slate-600 font-medium">
                ĐC: {clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}
              </p>
              <p className="text-[9.5px] text-slate-600 font-medium">
                Website: <strong className="text-sky-800">{clinicInfo.website || 'golab.com.vn'}</strong> • Hotline: <strong className="text-sky-800">{clinicInfo.phone || '032.855.3773'}</strong>
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
        <div className="text-center my-3">
          <h2 className="text-xl font-black text-sky-900 uppercase tracking-wide">
            PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM
          </h2>
        </div>

        {/* BẢNG THÔNG TIN BỆNH NHÂN CHUẨN 12 TRƯỜNG (6 HÀNG x 4 CỘT) */}
        <div className="border border-slate-300 rounded mb-4 overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <tbody>
              {/* Hàng 1 */}
              <tr className="border-b border-slate-200">
                <td className="w-28 py-1 px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Họ và tên:</td>
                <td className="py-1 px-2.5 font-bold text-red-600 uppercase border-r border-slate-200">{patient.name || '---'}</td>
                <td className="w-28 py-1 px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Năm sinh:</td>
                <td className="py-1 px-2.5 font-medium text-slate-800">{patient.year || '---'}</td>
              </tr>
              {/* Hàng 2 */}
              <tr className="border-b border-slate-200">
                <td className="py-1 px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Giới tính:</td>
                <td className="py-1 px-2.5 font-medium text-slate-800 border-r border-slate-200">{patient.gender || 'Nam'}</td>
                <td className="py-1 px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Số điện thoại:</td>
                <td className="py-1 px-2.5 font-mono text-slate-800">{patient.phone || '---'}</td>
              </tr>
              {/* Hàng 3: Địa chỉ span 3 cột */}
              <tr className="border-b border-slate-200">
                <td className="py-1 px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Địa chỉ:</td>
                <td colSpan={3} className="py-1 px-2.5 text-slate-800">{patient.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}</td>
              </tr>
              {/* Hàng 4 */}
              <tr className="border-b border-slate-200">
                <td className="py-1 px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Bác sĩ chỉ định:</td>
                <td className="py-1 px-2.5 font-bold text-sky-900 border-r border-slate-200">{patient.doctor || 'BS. Trần Hoài Long'}</td>
                <td className="py-1 px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Số bệnh phẩm:</td>
                <td className="py-1 px-2.5 font-mono font-bold text-red-600">{patient.sampleCode || patient.code}</td>
              </tr>
              {/* Hàng 5 */}
              <tr className="border-b border-slate-200">
                <td className="py-1 px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">T/G chỉ định:</td>
                <td className="py-1 px-2.5 font-mono text-slate-700 border-r border-slate-200">{patient.orderTime || currentDateStr}</td>
                <td className="py-1 px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">T/G đóng phí:</td>
                <td className="py-1 px-2.5 font-mono text-slate-700">{patient.paidTime || currentDateStr}</td>
              </tr>
              {/* Hàng 6 */}
              <tr>
                <td className="py-1 px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">T/G nhận mẫu:</td>
                <td className="py-1 px-2.5 font-mono text-slate-700 border-r border-slate-200">{patient.sampleTime || currentDateStr}</td>
                <td className="py-1 px-2.5 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">T/G trả kết quả:</td>
                <td className="py-1 px-2.5 font-mono text-slate-700">{patient.resultTime || currentDateStr}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BẢNG KẾT QUẢ XÉT NGHIỆM THEO TỪNG NHÓM */}
        <div className="border border-slate-300 rounded mb-4 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-900 uppercase font-bold border-b border-slate-300">
              <tr>
                <th className="py-1.5 px-2 w-8 text-center border-r border-slate-300">STT</th>
                <th className="py-1.5 px-3 border-r border-slate-300">TÊN CHỈ SỐ XÉT NGHIỆM</th>
                <th className="py-1.5 px-3 w-28 text-center border-r border-slate-300">KẾT QUẢ</th>
                <th className="py-1.5 px-3 w-20 text-center border-r border-slate-300">ĐƠN VỊ</th>
                <th className="py-1.5 px-3 w-36 text-center border-r border-slate-300">TRỊ SỐ THAM CHIẾU</th>
                <th className="py-1.5 px-3 w-40 text-center border-r border-slate-300">THIẾT BỊ XỬ LÝ</th>
                <th className="py-1.5 px-3 w-28 text-center">GHI CHÚ</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedCategories).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                    Chưa có chỉ số xét nghiệm nào được chọn.
                  </td>
                </tr>
              ) : (
                Object.keys(groupedCategories).map((categoryName) => {
                  const catTests = groupedCategories[categoryName];
                  return (
                    <React.Fragment key={categoryName}>
                      {/* Tiêu đề nhóm */}
                      <tr className="bg-sky-50/70 border-b border-t border-sky-200">
                        <td colSpan={7} className="py-1 px-3 font-bold text-sky-900 uppercase text-[11px]">
                          {categoryName}
                        </td>
                      </tr>

                      {/* Các dòng chỉ số */}
                      {catTests.map((t, idx) => {
                        const evalState = evaluateResult(t.result, t.refMin, t.refMax);
                        const isAbnormal = evalState === 'HIGH' || evalState === 'LOW';

                        return (
                          <tr key={t.code || idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                            <td className="py-1 px-2 text-center text-slate-500 font-mono border-r border-slate-200">
                              {idx + 1}
                            </td>
                            <td className="py-1 px-3 border-r border-slate-200 font-medium text-slate-900">
                              <span>{t.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono ml-1">({t.code})</span>
                            </td>
                            <td
                              className={`py-1 px-3 text-center font-mono font-bold border-r border-slate-200 ${
                                isAbnormal ? 'text-red-600 bg-red-50/40' : 'text-slate-900'
                              }`}
                            >
                              {t.result || '---'}
                            </td>
                            <td className="py-1 px-3 text-center text-slate-600 font-mono border-r border-slate-200">
                              {t.unit || ''}
                            </td>
                            <td className="py-1 px-3 text-center text-slate-600 font-mono border-r border-slate-200">
                              {t.refText || (t.refMin !== null && t.refMax !== null ? `${t.refMin} - ${t.refMax}` : 'Bình thường')}
                            </td>
                            <td className="py-1 px-3 text-center text-slate-600 text-[10.5px] border-r border-slate-200">
                              {t.equipment || 'Máy Sinh Hóa Tự Động'}
                            </td>
                            <td className="py-1 px-3 text-center text-[10px] text-slate-500">
                              {t.note || (isAbnormal ? (evalState === 'HIGH' ? 'Tăng cao' : 'Giảm') : 'Bình thường')}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PHẦN KẾT LUẬN & ĐỀ NGHỊ BÁC SĨ */}
        {conclusion && (
          <div className="border border-sky-200 bg-sky-50/30 rounded p-2.5 mb-4">
            <p className="font-bold text-sky-950 uppercase text-[11px] mb-1">
              KẾT LUẬN & ĐỀ NGHỊ CỦA BÁC SĨ:
            </p>
            <p className="text-slate-800 whitespace-pre-wrap leading-normal font-medium">
              {conclusion}
            </p>
          </div>
        )}

      </div>

      {/* FOOTER: CHỮ KÝ VÀ DẤU BÁC SĨ (LUÔN NẰM DƯỚI ĐÁY TRANG A4) */}
      <div className="mt-4 pt-3 border-t border-slate-300">
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
          HỆ THỐNG XÉT NGHIỆM GOLAB • {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'} • ĐỊA CHỈ: {clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'} • WEBSITE: {(clinicInfo.website || 'GOLAB.COM.VN').toUpperCase()} • HOTLINE: {clinicInfo.phone || '032.855.3773'}
        </div>
      </div>

    </div>
  );
}
