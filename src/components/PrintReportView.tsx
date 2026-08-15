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
      className="a4-preview mx-auto bg-white text-slate-900 font-sans p-8 box-border flex flex-col justify-between"
      style={{ width: '210mm', minHeight: '297mm' }}
    >
      <div>
        {/* HEADER PHÒNG KHÁM */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
              {clinicInfo.name || 'PHÒNG KHÁM XÉT NGHIỆM Y KHOA AN BÌNH'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Địa chỉ: {clinicInfo.address || 'Số 123 Đường Giải Phóng, Đống Đa, Hà Nội'}
            </p>
            <p className="text-xs text-slate-600 font-medium">
              Điện thoại: {clinicInfo.phone || '0988 123 456'} • Hotline: 1900 6789
            </p>
          </div>
          {qrCodeDataUrl && (
            <div className="text-center">
              <img src={qrCodeDataUrl} alt="QR Tra cứu" className="w-20 h-20 border border-slate-300 rounded p-1" />
              <span className="text-[10px] font-mono text-slate-500 font-bold block mt-1">QR Tra Cứu</span>
            </div>
          )}
        </div>

        {/* TIÊU ĐỀ PHIẾU */}
        <div className="text-center my-4">
          <h2 className="text-xl font-extrabold uppercase text-slate-900 tracking-wider">
            PHIẾU KẾT QUẢ XÉT NGHIỆM
          </h2>
          <p className="text-xs text-slate-500 italic">Ngày thực hiện: {currentDateStr}</p>
        </div>

        {/* THÔNG TIN BỆNH NHÂN */}
        <div className="border border-slate-300 rounded-lg p-3 mb-4 bg-slate-50/50 text-xs grid grid-cols-2 gap-y-2 gap-x-4">
          <div>
            <span className="font-semibold text-slate-600">Họ và tên:</span>{' '}
            <span className="font-bold text-slate-900 text-sm uppercase">{patient.name || '---'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Mã Bệnh Nhân:</span>{' '}
            <span className="font-mono font-bold text-slate-900">{patient.code || '---'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Năm sinh / Tuổi:</span>{' '}
            <span className="font-medium text-slate-900">{patient.dob || '---'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Giới tính:</span>{' '}
            <span className="font-medium text-slate-900">{patient.gender || 'Nam'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Số điện thoại:</span>{' '}
            <span className="font-medium text-slate-900">{patient.phone || '---'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Địa chỉ:</span>{' '}
            <span className="font-medium text-slate-900">{patient.address || '---'}</span>
          </div>
          <div className="col-span-2 border-t border-slate-200 pt-1.5">
            <span className="font-semibold text-slate-600">Chẩn đoán lâm sàng:</span>{' '}
            <span className="font-medium text-slate-900">{patient.diagnosis || 'Chưa ghi nhận'}</span>
          </div>
        </div>

        {/* BẢNG KẾT QUẢ XÉT NGHIỆM */}
        <div className="mb-4">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-800 text-white font-bold">
                <th className="py-2 px-2 border border-slate-400 w-10 text-center">STT</th>
                <th className="py-2 px-3 border border-slate-400">Tên Chỉ Số Xét Nghiệm</th>
                <th className="py-2 px-3 border border-slate-400 w-28 text-center">Kết Quả</th>
                <th className="py-2 px-3 border border-slate-400 w-24 text-center">Đơn Vị</th>
                <th className="py-2 px-3 border border-slate-400 w-32 text-center">Tham Chiếu</th>
                <th className="py-2 px-3 border border-slate-400 w-36 text-center">Đánh Giá</th>
              </tr>
            </thead>
            <tbody>
              {selectedTests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                    Chưa có kết quả xét nghiệm
                  </td>
                </tr>
              ) : (
                selectedTests.map((test, idx) => {
                  const isHighOrLow = test.note.includes('Tăng') || test.note.includes('Giảm') || test.note.includes('Mạnh') || test.note.includes('Dương tính');

                  return (
                    <tr key={test.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-medium">{idx + 1}</td>
                      <td className="py-1.5 px-3 border border-slate-300 font-semibold text-slate-900">
                        {test.name}
                        {test.scientific && (
                          <span className="block text-[10px] text-slate-500 font-normal italic">
                            {test.scientific}
                          </span>
                        )}
                      </td>
                      <td className={`py-1.5 px-3 border border-slate-300 text-center font-bold ${isHighOrLow ? 'text-rose-700' : 'text-slate-900'}`}>
                        {test.result || '---'}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 text-center text-slate-700 font-medium">
                        {test.unit || '-'}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 text-center text-slate-600">
                        {test.refText || '-'}
                      </td>
                      <td className={`py-1.5 px-3 border border-slate-300 text-center font-bold ${isHighOrLow ? 'text-rose-700 bg-rose-50' : 'text-emerald-700'}`}>
                        {test.note || 'Bình thường'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* KẾT LUẬN */}
        {conclusion && (
          <div className="border border-slate-300 rounded-lg p-3 bg-amber-50/30 text-xs mb-4">
            <span className="font-bold text-slate-900 block mb-1">KẾT LUẬN CỦA BÁC SĨ:</span>
            <p className="text-slate-800 font-medium whitespace-pre-line leading-relaxed">{conclusion}</p>
          </div>
        )}
      </div>

      {/* CHỮ KÝ & FOOTER */}
      <div className="border-t border-slate-300 pt-4 mt-auto">
        <div className="grid grid-cols-2 text-center text-xs">
          <div>
            <p className="font-semibold text-slate-600">Bệnh Nhân / Người Nhà</p>
            <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
          </div>
          <div>
            <p className="font-semibold text-slate-600">Bác Sĩ Xét Nghiệm</p>
            <p className="text-[10px] text-slate-400 italic mb-12">(Ký và đóng dấu)</p>
            <p className="font-bold text-slate-900 text-sm uppercase">{doctorName || clinicInfo.defaultDoctor || 'BS. CKII. Lê Anh Minh'}</p>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-2 flex justify-between items-center">
          <span>Hệ thống quản lý Xét nghiệm GoLab v1.0</span>
          <span>Token tra cứu: <strong className="font-mono text-slate-700">{patient.secretToken}</strong></span>
          <span>Trang 1 / 1</span>
        </div>
      </div>
    </div>
  );
}
