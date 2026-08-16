import React from 'react';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import { Patient, SelectedTest, ClinicInfo } from '@domain/types';

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
  selectedTests,
  currentDateStr = new Date().toLocaleDateString('vi-VN'),
  doctorName,
  qrCodeDataUrl,
  qrCodeUrl,
  clinicInfo = {
    name: 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
    address: 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị',
    phone: '032.855.3773',
    website: 'golab.com.vn',
    defaultDoctor: 'BS. CKII. Lê Anh Minh'
  }
}: FullAllergenReportViewProps) {
  const tests = allergenTests || selectedTests || [];
  const finalQrCode = qrCodeDataUrl || qrCodeUrl;
  const currentLogo = clinicInfo?.logoUrl || golabLogo;
  const currentStamp = clinicInfo?.stampUrl || doctorStamp;

  const totalAllergens = tests.length;
  const positiveTests = tests.filter((t) => {
    const note = t.note || '';
    return (
      note.includes('Độ 1') ||
      note.includes('Độ 2') ||
      note.includes('Độ 3') ||
      note.includes('Độ 4') ||
      note.includes('Độ 5') ||
      note.includes('Độ 6') ||
      note.includes('Dương tính')
    );
  });

  const getRowStyle = (note?: string) => {
    if (!note) return 'bg-white text-slate-800';
    if (note.includes('Độ 4') || note.includes('Độ 5') || note.includes('Độ 6')) {
      return 'bg-red-100 text-red-900 font-bold border-red-300';
    }
    if (note.includes('Độ 2') || note.includes('Độ 3')) {
      return 'bg-amber-100 text-amber-900 font-bold border-amber-300';
    }
    if (note.includes('Độ 1')) {
      return 'bg-amber-50 text-amber-800 font-semibold border-amber-200';
    }
    return 'bg-white text-slate-700';
  };

  const mid = Math.ceil(tests.length / 2);
  const col1Tests = tests.slice(0, mid);
  const col2Tests = tests.slice(mid);

  return (
    <div
      id={elementId}
      style={{ width: '210mm', minHeight: '297mm', maxWidth: '210mm', boxSizing: 'border-box' }}
      className="w-[210mm] max-w-[210mm] min-h-[297mm] bg-white text-slate-900 font-sans p-6 mx-auto text-[10.5px] leading-tight flex flex-col justify-between print:p-3 print:max-w-none print:shadow-none print:w-full"
    >
      
      {/* 1. HEADER LOGO & PHÒNG KHÁM */}
      <div>
        <div className="flex items-center justify-between border-b border-red-200 pb-2 mb-2">
          <div className="flex items-center space-x-3">
            <div className="h-14 w-28 flex items-center justify-start shrink-0">
              <img
                src={currentLogo}
                alt="GoLab Logo"
                className="h-14 max-w-[112px] w-auto object-contain"
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
              <p className="text-[9px] font-bold text-red-800 uppercase tracking-widest leading-none mb-0.5">
                HỆ THỐNG XÉT NGHIỆM GOLAB
              </p>
              <h1 className="text-xs font-black text-red-950 uppercase tracking-tight">
                {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
              </h1>
              <p className="text-[9.5px] text-slate-600">
                ĐC: {clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}
              </p>
              <p className="text-[9px] text-slate-600">
                Website: <strong className="text-red-800">{clinicInfo.website || 'golab.com.vn'}</strong> • Hotline: <strong className="text-red-800">{clinicInfo.phone || '032.855.3773'}</strong>
              </p>
            </div>
          </div>

          {/* QR Tra Cứu Kết Quả */}
          {finalQrCode && (
            <div className="flex flex-col items-center justify-center p-1 bg-red-50/50 border border-red-200 rounded shrink-0">
              <img
                src={finalQrCode}
                alt="QR Code Tra Cứu"
                className="w-14 h-14 object-contain"
                loading="eager"
                decoding="sync"
              />
              <span className="text-[7.5px] font-mono text-red-700 mt-0.5 font-bold">QR Tra Cứu</span>
            </div>
          )}
        </div>

        {/* TIÊU ĐỀ PHIẾU DỊ NGUYÊN */}
        <div className="text-center my-2">
          <h2 className="text-lg font-black text-red-900 uppercase tracking-wide">
            PHIẾU KẾT QUẢ XÉT NGHIỆM DỊ NGUYÊN IgE TOÀN DIỆN
          </h2>
          <p className="text-[9.5px] text-slate-600 italic">
            (Phương pháp xét nghiệm định lượng kháng thể dị ứng đặc hiệu Immunoblot / CLA)
          </p>
        </div>

        {/* 2. BẢNG THÔNG TIN BỆNH NHÂN (12 TRƯỜNG CHUẨN) */}
        <div className="border border-slate-300 rounded mb-2 overflow-hidden">
          <table className="w-full text-[10px] border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-24 py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">Họ và tên:</td>
                <td className="py-1 px-2 font-bold text-red-600 uppercase border-r border-slate-200 align-middle">{patient.name || '---'}</td>
                <td className="w-24 py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">Năm sinh:</td>
                <td className="py-1 px-2 font-medium text-slate-800 align-middle">{patient.dob || (patient as any).year || '---'}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="w-24 py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">Giới tính:</td>
                <td className="py-1 px-2 font-medium text-slate-800 border-r border-slate-200 align-middle">{patient.gender || 'Nam'}</td>
                <td className="w-24 py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">Số điện thoại:</td>
                <td className="py-1 px-2 font-mono text-slate-800 align-middle">{patient.phone || '---'}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="w-24 py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">Địa chỉ:</td>
                <td colSpan={3} className="py-1 px-2 text-slate-800 align-middle">{patient.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="w-24 py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">Bác sĩ chỉ định:</td>
                <td className="py-1 px-2 font-bold text-red-900 border-r border-slate-200 align-middle">{(patient as any).doctor || doctorName || clinicInfo.defaultDoctor || 'BS. Trần Hoài Long'}</td>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">Số bệnh phẩm:</td>
                <td className="py-1 px-2 font-mono font-bold text-red-600 align-middle">{patient.sampleCode || patient.code}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="w-24 py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">T/G chỉ định:</td>
                <td className="py-1 px-2 font-mono text-slate-700 border-r border-slate-200 align-middle">{patient.orderedAt || (patient as any).orderTime || currentDateStr}</td>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">T/G đóng phí:</td>
                <td className="py-1 px-2 font-mono text-slate-700 align-middle">{patient.paidAt || (patient as any).paidTime || currentDateStr}</td>
              </tr>
              <tr>
                <td className="w-24 py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">T/G nhận mẫu:</td>
                <td className="py-1 px-2 font-mono text-slate-700 border-r border-slate-200 align-middle">{patient.receivedAt || (patient as any).sampleTime || currentDateStr}</td>
                <td className="py-1 px-2 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200 align-middle">T/G trả kết quả:</td>
                <td className="py-1 px-2 font-mono text-slate-700 align-middle">{patient.returnedAt || (patient as any).resultTime || currentDateStr}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. TÓM TẮT DỊ NGUYÊN DƯƠNG TÍNH */}
        <div className="bg-red-50/70 border border-red-300 rounded p-2 mb-2 flex items-center justify-between text-[10px]">
          <div>
            <span className="font-bold text-red-950 uppercase">TỔNG SỐ DỊ NGUYÊN KHẢO SÁT: </span>
            <strong className="font-mono text-slate-900">{totalAllergens}</strong>
          </div>
          <div>
            <span className="font-bold text-red-950 uppercase">PHÁT HIỆN DƯƠNG TÍNH (&ge; ĐỘ 1): </span>
            <span className="px-2 py-0.5 rounded font-mono font-bold bg-red-600 text-white">
              {positiveTests.length} dị nguyên
            </span>
          </div>
        </div>

        {/* 4. BẢNG 2 CỘT HIỂN THỊ DỊ NGUYÊN */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Cột 1 */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-left text-[9.5px] border-collapse">
              <thead className="bg-red-100 text-red-950 uppercase font-bold border-b border-red-200">
                <tr>
                  <th className="py-1 px-1.5 w-6 text-center border-r border-red-200 align-middle">STT</th>
                  <th className="py-1 px-1.5 w-10 border-r border-red-200 font-mono align-middle">Mã</th>
                  <th className="py-1 px-1.5 border-r border-red-200 align-middle">Tên Dị Nguyên</th>
                  <th className="py-1 px-1.5 w-14 text-center border-r border-red-200 align-middle">Nồng Độ</th>
                  <th className="py-1 px-1.5 w-20 text-center align-middle">Đánh Giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {col1Tests.map((t, idx) => (
                  <tr key={t.code || idx} className={getRowStyle(t.note)}>
                    <td className="py-0.5 px-1.5 text-center text-slate-500 font-mono border-r border-slate-200 align-middle">{idx + 1}</td>
                    <td className="py-0.5 px-1.5 font-mono font-bold text-red-700 border-r border-slate-200 align-middle">{t.code}</td>
                    <td className="py-0.5 px-1.5 border-r border-slate-200 truncate max-w-[120px] font-medium align-middle" title={t.name}>
                      {t.name}
                    </td>
                    <td className="py-0.5 px-1.5 text-center font-mono border-r border-slate-200 align-middle">
                      {t.result ? `${t.result} IU` : '< 0.35'}
                    </td>
                    <td className="py-0.5 px-1.5 text-center font-semibold align-middle">{t.note || 'Âm tính (Độ 0)'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cột 2 */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-left text-[9.5px] border-collapse">
              <thead className="bg-red-100 text-red-950 uppercase font-bold border-b border-red-200">
                <tr>
                  <th className="py-1 px-1.5 w-6 text-center border-r border-red-200 align-middle">STT</th>
                  <th className="py-1 px-1.5 w-10 border-r border-red-200 font-mono align-middle">Mã</th>
                  <th className="py-1 px-1.5 border-r border-red-200 align-middle">Tên Dị Nguyên</th>
                  <th className="py-1 px-1.5 w-14 text-center border-r border-red-200 align-middle">Nồng Độ</th>
                  <th className="py-1 px-1.5 w-20 text-center align-middle">Đánh Giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {col2Tests.map((t, idx) => (
                  <tr key={t.code || idx} className={getRowStyle(t.note)}>
                    <td className="py-0.5 px-1.5 text-center text-slate-500 font-mono border-r border-slate-200 align-middle">{mid + idx + 1}</td>
                    <td className="py-0.5 px-1.5 font-mono font-bold text-red-700 border-r border-slate-200 align-middle">{t.code}</td>
                    <td className="py-0.5 px-1.5 border-r border-slate-200 truncate max-w-[120px] font-medium align-middle" title={t.name}>
                      {t.name}
                    </td>
                    <td className="py-0.5 px-1.5 text-center font-mono border-r border-slate-200 align-middle">
                      {t.result ? `${t.result} IU` : '< 0.35'}
                    </td>
                    <td className="py-0.5 px-1.5 text-center font-semibold align-middle">{t.note || 'Âm tính (Độ 0)'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <p className="text-[9px] text-slate-600 italic">Ngày {currentDateStr}</p>
            <p className="text-[10px] font-bold uppercase text-slate-900 mt-0.5">BÁC SĨ / KTV CHUYÊN KHOA DỊ ỨNG</p>
            <div className="h-16 flex items-center justify-center py-1">
              <img
                src={currentStamp}
                alt="Đã ký & Đóng dấu"
                className="h-16 w-auto object-contain max-w-[100px]"
                loading="eager"
                decoding="sync"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null;
                  target.src = doctorStamp;
                }}
              />
            </div>
            <p className="text-[11px] font-bold text-slate-900 uppercase">
              {doctorName || clinicInfo.defaultDoctor || 'BS. Nguyễn Thị Mai'}
            </p>
          </div>
        </div>

        <div className="mt-2 pt-1 border-t border-slate-200 text-center text-[8px] text-slate-500 uppercase font-mono tracking-tight">
          HỆ THỐNG XÉT NGHIỆM GOLAB • {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'} • ĐỊA CHỈ: {clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'} • WEBSITE: {(clinicInfo.website || 'GOLAB.COM.VN').toUpperCase()} • HOTLINE: {clinicInfo.phone || '032.855.3773'}
        </div>
      </div>
    </div>
  );
}
