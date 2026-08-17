import { Fragment } from 'react';
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
      style={{ 
        width: '210mm', 
        minHeight: '297mm', 
        padding: '12mm 14mm 10mm 14mm', 
        boxSizing: 'border-box' 
      }}
      className="w-[210mm] max-w-[210mm] min-h-[297mm] bg-white text-slate-900 font-sans mx-auto text-xs leading-normal flex flex-col justify-between print:p-0 print:max-w-none print:shadow-none print:w-full"
    >
      
      {/* KHUNG NỘI DUNG CHÍNH (TOP & MIDDLE) */}
      <div className="flex-1 flex flex-col justify-start">
        
        {/* 1. HEADER PHÒNG KHÁM & MÃ QR */}
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

        {/* 2. TIÊU ĐỀ PHIẾU KẾT QUẢ */}
        <div data-avoid-break="true" className="text-center my-2">
          <h2 className="text-lg font-black text-sky-950 uppercase tracking-wide">
            PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM
          </h2>
        </div>

        {/* 3. BẢNG THÔNG TIN BỆNH NHÂN CHUẨN 12 TRƯỜNG (6 HÀNG x 4 CỘT) */}
        <div data-avoid-break="true" className="patient-table-section border border-slate-300 rounded overflow-hidden mb-2.5">
          <table className="w-full table-fixed text-[11px] border-collapse">
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[35%]" />
              <col className="w-[18%]" />
              <col className="w-[32%]" />
            </colgroup>
            <tbody>
              {/* Hàng 1 */}
              <tr>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Họ và tên:</td>
                <td className="py-1 px-2.5 font-bold text-red-600 uppercase border-r border-b border-slate-200 align-middle truncate">{patient.name || '---'}</td>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Năm sinh:</td>
                <td className="py-1 px-2.5 font-medium text-slate-800 border-b border-slate-200 align-middle truncate">{patient.dob || (patient as any).year || '---'}</td>
              </tr>
              {/* Hàng 2 */}
              <tr>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Giới tính:</td>
                <td className="py-1 px-2.5 font-medium text-slate-800 border-r border-b border-slate-200 align-middle">{patient.gender || 'Nam'}</td>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Số điện thoại:</td>
                <td className="py-1 px-2.5 font-mono text-slate-800 border-b border-slate-200 align-middle">{patient.phone || '---'}</td>
              </tr>
              {/* Hàng 3: Địa chỉ span 3 cột */}
              <tr>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Địa chỉ:</td>
                <td colSpan={3} className="py-1 px-2.5 text-slate-800 border-b border-slate-200 align-middle truncate">{patient.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}</td>
              </tr>
              {/* Hàng 4 */}
              <tr>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">Bác sĩ chỉ định:</td>
                <td className="py-1 px-2.5 font-bold text-sky-950 border-r border-b border-slate-200 align-middle truncate">{(patient as any).doctor || doctorName || clinicInfo.defaultDoctor || 'BS. Trần Hoài Long'}</td>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">Số bệnh phẩm:</td>
                <td className="py-1 px-2.5 font-mono font-bold text-red-600 border-b border-slate-200 align-middle">{patient.sampleCode || patient.code}</td>
              </tr>
              {/* Hàng 5 */}
              <tr>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-200 align-middle">T/G chỉ định:</td>
                <td className="py-1 px-2.5 font-mono text-slate-700 border-r border-b border-slate-200 align-middle">{patient.orderedAt || (patient as any).orderTime || currentDateStr}</td>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">T/G đóng phí:</td>
                <td className="py-1 px-2.5 font-mono text-slate-700 border-b border-slate-200 align-middle">{patient.paidAt || (patient as any).paidTime || currentDateStr}</td>
              </tr>
              {/* Hàng 6 */}
              <tr>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">T/G nhận mẫu:</td>
                <td className="py-1 px-2.5 font-mono text-slate-700 border-r border-slate-200 align-middle">{patient.receivedAt || (patient as any).sampleTime || currentDateStr}</td>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">T/G trả kết quả:</td>
                <td className="py-1 px-2.5 font-mono text-slate-700 align-middle">{patient.returnedAt || (patient as any).resultTime || currentDateStr}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. BẢNG KẾT QUẢ XÉT NGHIỆM THEO TỪNG NHÓM */}
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
            <thead className="bg-slate-100 text-slate-900 uppercase font-bold border-b border-slate-300">
              <tr>
                <th className="py-1.5 px-1 text-center border-r border-slate-300 align-middle whitespace-nowrap text-[10.5px]">STT</th>
                <th className="py-1.5 px-3 border-r border-slate-300 align-middle whitespace-nowrap text-[10.5px]">TÊN CHỈ SỐ XÉT NGHIỆM</th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300 align-middle whitespace-nowrap text-[10.5px]">KẾT QUẢ</th>
                <th className="py-1.5 px-1.5 text-center border-r border-slate-300 align-middle whitespace-nowrap text-[10.5px]">ĐƠN VỊ</th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300 align-middle whitespace-nowrap text-[10.5px]">TRỊ SỐ THAM CHIẾU</th>
                <th className="py-1.5 px-1.5 text-center border-r border-slate-300 align-middle whitespace-nowrap text-[10.5px]">THIẾT BỊ XỬ LÝ</th>
                <th className="py-1.5 px-1.5 text-center align-middle whitespace-nowrap text-[10.5px]">GHI CHÚ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                    Chưa có chỉ số xét nghiệm nào được chọn
                  </td>
                </tr>
              ) : (
                Object.entries(groupedCategories).map(([category, items]) => (
                  <Fragment key={category}>
                    {/* Header nhóm chỉ số */}
                    <tr data-avoid-break="true" className="bg-sky-50/90 font-bold text-sky-950 border-b border-slate-200">
                      <td colSpan={7} className="py-1 px-3 uppercase text-[11px] tracking-wide">
                        • {category}
                      </td>
                    </tr>

                    {/* Danh sách các chỉ số trong nhóm */}
                    {items.map((t, idx) => {
                      const evalRes = evaluateResult(t.result, t.refMin, t.refMax);
                      const isAbnormal = evalRes.status !== 'normal';

                      return (
                        <tr
                          data-avoid-break="true"
                          key={t.code || idx}
                          className={`hover:bg-slate-50 transition-colors ${
                            isAbnormal ? 'bg-amber-50/60 font-semibold' : 'bg-white'
                          }`}
                        >
                          <td className="py-1 px-1 text-center font-mono text-slate-500 border-r border-slate-200 align-middle text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-1 px-3 font-semibold text-slate-900 border-r border-slate-200 align-middle text-[11px] truncate">
                            {t.name}
                          </td>
                          <td
                            className={`py-1 px-2 text-center font-mono font-bold border-r border-slate-200 align-middle text-[11px] ${
                              isAbnormal ? 'text-red-600' : 'text-slate-800'
                            }`}
                          >
                            {t.result || '---'}
                          </td>
                          <td className="py-1 px-1.5 text-center font-mono text-slate-600 border-r border-slate-200 align-middle text-[11px]">
                            {t.unit || '---'}
                          </td>
                          <td className="py-1 px-2 text-center font-mono text-slate-600 border-r border-slate-200 align-middle text-[11px]">
                            {t.refText || (t.refMin !== null && t.refMax !== null ? `${t.refMin} - ${t.refMax}` : '---')}
                          </td>
                          <td className="py-1 px-1.5 text-center text-[10px] text-slate-500 border-r border-slate-200 align-middle">
                            {t.equipment || 'Tự động'}
                          </td>
                          <td
                            className={`py-1 px-1.5 text-center text-[10px] font-bold align-middle ${
                              isAbnormal ? 'text-red-600' : 'text-slate-500'
                            }`}
                          >
                            {evalRes.label}
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. KHỐI KẾT LUẬN CỦA BÁC SĨ */}
        {conclusion && (
          <div data-avoid-break="true" className="conclusion-section border border-sky-200 bg-sky-50/50 rounded p-2.5 mb-2.5 text-xs">
            <span className="font-bold text-sky-950 uppercase tracking-wide">KẾT LUẬN / ĐỀ NGHỊ CỦA BÁC SĨ: </span>
            <span className="font-semibold text-slate-800">{conclusion}</span>
          </div>
        )}
      </div>

      {/* 6. FOOTER: CHỮ KÝ VÀ DẤU BÁC SĨ */}
      <div data-avoid-break="true" className="signature-section mt-auto pt-2 border-t border-slate-300">
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
              {clinicInfo.defaultDoctor || 'Nguyễn Thị Thành Trung'}
            </p>
          </div>

        </div>

        {/* Dòng copyright chân trang */}
        <div className="mt-2 pt-1 border-t border-slate-200 text-center text-[8px] text-slate-500 uppercase font-mono tracking-tight">
          HỆ THỐNG XÉT NGHIỆM GOLAB • {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'} • ĐỊA CHỈ: {clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'} • WEBSITE: {(clinicInfo.website || 'GOLAB.COM.VN').toUpperCase()} • HOTLINE: {clinicInfo.phone || '032.855.3773'}
        </div>
      </div>

    </div>
  );
}
