import { evaluateResult } from '@domain/testResult';
import { downloadQrCodeImage } from '@infra/qrService';
import { Download } from 'lucide-react';
import golabLogo from '@assets/golablogo.jpg';
import { ClinicInfo, Patient, SelectedTest } from '@domain/types';

interface PrintReportViewProps {
  elementId?: string;
  clinicInfo: ClinicInfo;
  patient: Patient;
  selectedTests: SelectedTest[];
  conclusion?: string;
  doctorName?: string;
  qrCodeDataUrl?: string;
}

export default function PrintReportView({ 
  elementId = 'printable-medical-report', 
  clinicInfo, 
  patient, 
  selectedTests, 
  conclusion, 
  doctorName,
  qrCodeDataUrl 
}: PrintReportViewProps) {
  const currentDateStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div 
      id={elementId}
      className="bg-white text-slate-900 font-sans p-8 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between box-border text-[12px] leading-relaxed relative border border-slate-200"
    >
      
      {/* KHUNG NỘI DUNG CHÍNH (TOP & MIDDLE) */}
      <div>
        
        {/* 1. HEADER PHÒNG KHÁM VÀ MÃ QR PHIẾU */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-3 max-w-[70%]">
            <img 
              src={golabLogo} 
              alt="GoLab Logo" 
              className="w-16 h-16 object-contain rounded border border-slate-200 shrink-0" 
            />
            <div>
              <h1 className="text-sm font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
                {clinicInfo.name || 'PHÒNG KHÁM XÉT NGHIỆM Y KHOA AN BÌNH'}
              </h1>
              <p className="text-[10.5px] text-slate-700 font-semibold mt-0.5">
                Địa chỉ phòng khám: <span className="font-medium text-slate-900">{clinicInfo.address || 'Số 123 Đường Giải Phóng, Đống Đa, Hà Nội'}</span>
              </p>
              <p className="text-[10px] text-slate-700 font-semibold">
                Điện thoại / Zalo: <strong className="text-slate-900 font-mono font-bold">{clinicInfo.phone || '0988 123 456'}</strong>
              </p>
            </div>
          </div>

          {/* Ô Mã QR Code Tra Cứu */}
          {qrCodeDataUrl ? (
            <div className="text-center flex flex-col items-center justify-center shrink-0 group relative">
              <div className="p-1 bg-white border border-slate-300 rounded shadow-sm">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Mã QR tra cứu kết quả" 
                  className="w-16 h-16 block"
                />
              </div>
              <span className="text-[8px] text-slate-500 font-mono font-bold mt-0.5 uppercase tracking-tighter">
                Quét mã xem PDF
              </span>
              
              <button
                type="button"
                onClick={() => downloadQrCodeImage(qrCodeDataUrl, `QRCode_${(patient.name || 'BenhNhan').replace(/\s+/g, '_')}.png`)}
                title="Tải ảnh QR Code về máy"
                className="hidden print:hidden group-hover:flex items-center gap-0.5 text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded mt-0.5 hover:bg-slate-900 transition-all font-semibold"
              >
                <Download className="w-2.5 h-2.5" />
                <span>Tải ảnh</span>
              </button>
            </div>
          ) : (
            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-slate-400 block">Mã phiếu XN:</span>
              <strong className="text-xs font-mono text-slate-900">{patient.code}</strong>
            </div>
          )}
        </div>

        {/* 2. TIÊU ĐỀ PHIẾU XÉT NGHIỆM */}
        <div className="text-center my-2">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
            PHIẾU KẾT QUẢ XÉT NGHIỆM
          </h2>
        </div>

        {/* 3. THÔNG TIN BỆNH NHÂN LÂM SÀNG (BẢNG 12 TRƯỜNG CHUẨN MẪU) */}
        <table className="w-full text-left border-collapse border border-sky-300 text-[11px] mb-4">
          <tbody>
            <tr className="border-b border-sky-200 divide-x divide-sky-200">
              <td className="py-1 px-3 w-[15%] text-slate-700 font-medium bg-sky-50/40">Họ và tên:</td>
              <td className="py-1 px-3 w-[35%] font-extrabold text-red-600 uppercase text-xs">
                {patient.name || '...........................................'}
              </td>
              <td className="py-1 px-3 w-[18%] text-slate-700 font-medium bg-sky-50/40">T/G chỉ định</td>
              <td className="py-1 px-3 w-[32%] font-bold text-slate-900 font-mono">
                {patient.orderedAt || currentDateStr}
              </td>
            </tr>

            <tr className="border-b border-sky-200 divide-x divide-sky-200">
              <td className="py-1 px-3 text-slate-700 font-medium bg-sky-50/40">Năm sinh:</td>
              <td className="py-1 px-3 font-bold text-slate-900">
                {patient.dob || '...........'}
              </td>
              <td className="py-1 px-3 text-slate-700 font-medium bg-sky-50/40">T/G đóng phí</td>
              <td className="py-1 px-3 font-bold text-slate-900 font-mono">
                {patient.paidAt || currentDateStr}
              </td>
            </tr>

            <tr className="border-b border-sky-200 divide-x divide-sky-200">
              <td className="py-1 px-3 text-slate-700 font-medium bg-sky-50/40">Địa chỉ</td>
              <td className="py-1 px-3 font-medium text-slate-900">
                {patient.diagnosis || patient.address || '...........................................'}
              </td>
              <td className="py-1 px-3 text-slate-700 font-medium bg-sky-50/40">Số bệnh phẩm</td>
              <td className="py-1 px-3 font-extrabold text-red-600 font-mono">
                {patient.sampleCode || patient.code}
              </td>
            </tr>

            <tr className="border-b border-sky-200 divide-x divide-sky-200">
              <td className="py-1 px-3 text-slate-700 font-medium bg-sky-50/40">Giới tính:</td>
              <td className="py-1 px-3 font-bold text-slate-900">
                {patient.gender || 'Nam'}
              </td>
              <td className="py-1 px-3 text-slate-700 font-medium bg-sky-50/40">Tình trạng mẫu</td>
              <td className="py-1 px-3 font-bold text-slate-900">
                {patient.sampleStatus || 'Đạt'}
              </td>
            </tr>

            <tr className="border-b border-sky-200 divide-x divide-sky-200">
              <td className="py-1 px-3 text-slate-700 font-medium bg-sky-50/40">Số điện thoại</td>
              <td className="py-1 px-3 font-bold text-slate-900 font-mono">
                {patient.phone || '......................'}
              </td>
              <td className="py-1 px-3 text-slate-700 font-medium bg-sky-50/40">T/G nhận mẫu</td>
              <td className="py-1 px-3 font-bold text-slate-900 font-mono">
                {patient.receivedAt || currentDateStr}
              </td>
            </tr>

            <tr className="divide-x divide-sky-200">
              <td className="py-1 px-3 text-slate-700 font-medium bg-sky-50/40">Bác sĩ chỉ định</td>
              <td className="py-1 px-3 font-bold text-slate-900">
                {doctorName || patient.address || clinicInfo.defaultDoctor || 'BS. Trần Hoài Long'}
              </td>
              <td className="py-1 px-3 text-slate-700 font-medium bg-sky-50/40">T/G trả kết quả</td>
              <td className="py-1 px-3 font-bold text-slate-900 font-mono">
                {patient.returnedAt || currentDateStr}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 4. BẢNG KẾT QUẢ XÉT NGHIỆM CHUẨN (GỠ CỘT GIÁ TIỀN LẺ) */}
        <table className="w-full text-left border-collapse border border-slate-400 text-[11px]">
          <thead>
            <tr className="bg-white text-slate-900 font-bold text-center border-b-2 border-slate-400">
              <th className="py-2 px-2 border-r border-slate-400 w-[6%]">STT</th>
              <th className="py-2 px-3 border-r border-slate-400 text-left w-[36%]">Tên Xét Nghiệm / Chỉ Số</th>
              <th className="py-2 px-2 border-r border-slate-400 w-[14%]">Kết Quả</th>
              <th className="py-2 px-2 border-r border-slate-400 w-[12%]">Đơn Vị</th>
              <th className="py-2 px-3 border-r border-slate-400 w-[18%]">Trị Số Tham Chiếu</th>
              <th className="py-2 px-2 w-[14%]">Ghi Chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {selectedTests.length > 0 ? (
              selectedTests.map((item, index) => {
                const evalInfo = evaluateResult(item.result, item.refMin, item.refMax);
                const isAbnormal = evalInfo.status === 'high' || evalInfo.status === 'low';

                return (
                  <tr key={item.code || index} className={isAbnormal ? 'bg-slate-100 font-semibold' : ''}>
                    {/* STT */}
                    <td className="py-1.5 px-2 text-center border-r border-slate-300 text-slate-500 font-mono">
                      {index + 1}
                    </td>

                    {/* Tên chỉ số */}
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <span className="font-bold text-slate-900">{item.name}</span>
                      {item.scientific && (
                        <span className="text-[10px] text-slate-500 block italic font-normal">({item.scientific})</span>
                      )}
                    </td>

                    {/* Kết quả */}
                    <td className={`py-1.5 px-2 text-center border-r border-slate-300 font-mono ${
                      isAbnormal ? 'font-bold text-slate-900 text-xs' : 'font-semibold text-slate-800'
                    }`}>
                      {item.result || '-'}
                    </td>

                    {/* Đơn vị */}
                    <td className="py-1.5 px-2 text-center border-r border-slate-300 font-mono text-[10px] text-slate-600">
                      {item.unit || '-'}
                    </td>

                    {/* Trị số tham chiếu */}
                    <td className="py-1.5 px-3 text-center border-r border-slate-300 text-[10px] text-slate-700">
                      {item.refText || (item.refMin !== null && item.refMax !== null ? `${item.refMin} - ${item.refMax}` : 'Bình thường')}
                    </td>

                    {/* Ghi chú */}
                    <td className="py-1.5 px-2 text-center font-bold text-[10px]">
                      {isAbnormal ? (
                        <span className="text-slate-900 underline font-black">{evalInfo.label}</span>
                      ) : (
                        <span className="text-slate-600 font-normal">{item.note || 'Bình thường'}</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                  Chưa chọn chỉ số xét nghiệm nào để in phiếu.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 5. GHI CHÚ VÀ KẾT LUẬN CỦA BÁC SĨ */}
        {conclusion && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-300 rounded text-[11px]">
            <strong className="text-slate-900 uppercase text-[10px] font-bold block mb-0.5">
              Kết luận / Lời khuyên của Bác sĩ:
            </strong>
            <p className="text-slate-800 whitespace-pre-line leading-normal italic font-medium">
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

          {/* Bên phải: Chữ ký Bác sĩ */}
          <div className="text-center min-w-[200px]">
            <p className="text-[10px] text-slate-600 italic">Hà Nội, ngày {currentDateStr}</p>
            <p className="text-[11px] font-bold uppercase text-slate-900 mt-1">BÁC SĨ / KTV XÉT NGHIỆM</p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-[10px] text-slate-300 italic">(Đã ký & Đóng dấu)</span>
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
