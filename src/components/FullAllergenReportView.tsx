import { ClinicInfo, Patient, SelectedTest } from '@domain/types';

interface FullAllergenReportViewProps {
  elementId?: string;
  clinicInfo: ClinicInfo;
  patient: Patient;
  selectedTests: SelectedTest[];
  conclusion?: string;
  doctorName?: string;
  qrCodeDataUrl?: string;
}

export default function FullAllergenReportView({
  elementId = 'printable-allergen-report',
  clinicInfo,
  patient,
  selectedTests,
  conclusion,
  doctorName,
  qrCodeDataUrl
}: FullAllergenReportViewProps) {
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

        {/* TIÊU ĐỀ PHIẾU DỊ NGUYÊN */}
        <div className="text-center my-4">
          <h2 className="text-xl font-extrabold uppercase text-slate-900 tracking-wider">
            BÁO CÁO KẾT QUẢ XÉT NGHIỆM DỊ NGUYÊN (PROTIA IgE)
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
        </div>

        {/* BẢNG DỊ NGUYÊN */}
        <div className="mb-4">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-800 text-white font-bold">
                <th className="py-2 px-2 border border-slate-400 w-10 text-center">STT</th>
                <th className="py-2 px-3 border border-slate-400">Tên Dị Nguyên (Allergen)</th>
                <th className="py-2 px-3 border border-slate-400 w-24 text-center">Nồng Độ (IU/mL)</th>
                <th className="py-2 px-3 border border-slate-400 w-36 text-center">Phân Độ Mẫn Cảm</th>
              </tr>
            </thead>
            <tbody>
              {selectedTests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                    Chưa có kết quả dị nguyên
                  </td>
                </tr>
              ) : (
                selectedTests.map((test, idx) => {
                  const isPositive = test.note.includes('Độ 1') || test.note.includes('Độ 2') || test.note.includes('Độ 3') || test.note.includes('Độ 4') || test.note.includes('Độ 5') || test.note.includes('Độ 6');

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
                      <td className="py-1.5 px-3 border border-slate-300 text-center font-bold text-slate-900">
                        {test.result || '<0.35'}
                      </td>
                      <td className={`py-1.5 px-3 border border-slate-300 text-center font-bold ${isPositive ? 'text-rose-700 bg-rose-50' : 'text-emerald-700'}`}>
                        {test.note || 'Độ 0 (Âm tính)'}
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
            <span className="font-bold text-slate-900 block mb-1">KẾT LUẬN & DẶN DÒ CỦA BÁC SĨ:</span>
            <p className="text-slate-800 font-medium whitespace-pre-line leading-relaxed">{conclusion}</p>
          </div>
        )}
      </div>

      {/* CHỮ KÝ */}
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
      </div>
    </div>
  );
}
