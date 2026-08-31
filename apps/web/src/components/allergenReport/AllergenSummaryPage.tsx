import { memo } from 'react';
import { Patient, ClinicInfo, AllergenGradingScale } from '@domain/types';
import { getAllergenGradeClasses, getAllergenBadgeSvg } from '@domain/allergenDetector';
import { AllergenReportItemDTO } from '@domain/services/AllergenReportDomainService';

interface AllergenSummaryPageProps {
  patient: Patient;
  clinicInfo?: ClinicInfo;
  currentLogo: string;
  totalCount?: number;
  positiveList: AllergenReportItemDTO[];
  appliedScales?: AllergenGradingScale[];
}

function AllergenSummaryPage({
  patient,
  clinicInfo,
  currentLogo,
  totalCount: _totalCount,
  positiveList,
  appliedScales = []
}: AllergenSummaryPageProps) {
  const scales = appliedScales || [];

  return (
    <div 
      data-page="true"
      className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 p-7 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-5 flex flex-col justify-between box-border"
      style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
    >
      <div>
        {/* Header Thông Tin Phòng Khám */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
          <div className="flex items-center space-x-3">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt="Logo"
                className="h-14 w-auto object-contain max-w-[120px]"
              />
            ) : (
              <div className="h-14 w-14 bg-sky-900 text-white font-black flex items-center justify-center rounded-lg text-lg tracking-wider">
                GOLAB
              </div>
            )}
            <div>
              <h1 className="text-[17px] font-black uppercase text-sky-950 tracking-tight leading-none mb-1">
                {clinicInfo?.name || 'PHÒNG XÉT NGHIỆM Y KHOA GOLAB'}
              </h1>
              <p className="text-[11.5px] text-slate-600 leading-tight">
                {clinicInfo?.address || 'Địa chỉ: 123 Đường Y Học, Phường 1, TP. Đông Hà, Quảng Trị'}
              </p>
              <p className="text-[11.5px] text-slate-600 leading-tight">
                Hotline: <strong className="text-slate-800">{clinicInfo?.phone || '0901 234 567'}</strong> {clinicInfo?.website ? `| Website: ${clinicInfo.website}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center justify-center bg-red-600 text-white font-black text-[12.5px] px-3.5 py-1 rounded tracking-wide uppercase leading-normal shadow-xs">
              Báo Cáo Dị Nguyên
            </div>
          </div>
        </div>

        {/* Tiêu đề trang tổng hợp */}
        <div className="text-center mb-3">
          <h2 className="text-[19px] font-black text-slate-900 uppercase tracking-wide">
            KẾT QUẢ ĐỊNH LƯỢNG KHÁNG THỂ IGE ĐẶC HIỆU
          </h2>
          <p className="text-[13px] font-bold text-red-700 italic">
            (Tổng hợp các dị nguyên dương tính & nồng độ IgE toàn phần)
          </p>
        </div>

        {/* Thanh Thông Tin Bệnh Nhân Tóm Tắt */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-300 rounded px-4 py-1.5 mb-2 text-[13px] leading-snug">
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
        <div className="border border-slate-300 rounded mb-2 bg-white">
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
                    Chưa phát hiện dị nguyên dương tính
                  </td>
                </tr>
              ) : (
                positiveList.map((pos, idx) => {
                  const gradeStyle = getAllergenGradeClasses(pos.grade, pos.isTIgE, pos.isPositive);
                  return (
                    <tr key={pos.code || idx} className={`${gradeStyle.rowBg} font-bold ${gradeStyle.textColor} text-[13.5px]`}>
                      <td className="py-2 px-3 text-center border-r border-slate-300 align-middle leading-snug">{idx + 1}</td>
                      <td className={`py-2 px-4 border-r border-slate-300 align-middle leading-snug ${gradeStyle.nameColor}`}>{pos.name}</td>
                      <td className="py-2 px-4 border-r border-slate-300 italic font-medium opacity-90 align-middle leading-snug">{pos.allergenName}</td>
                      <td className="py-2 px-3 text-center font-mono border-r border-slate-300 align-middle leading-snug">{pos.code}</td>
                      <td className="py-2 px-4 text-center align-middle leading-snug">
                        {pos.isTIgE ? (
                          <span className={`text-[12.5px] font-bold ${pos.isPositive ? 'text-red-700' : 'text-sky-900'}`}>
                            {pos.result || '---'} <span className="text-slate-500 text-[10px] font-normal">(IU/ml)</span>
                          </span>
                        ) : (
                          <div className="flex items-center justify-center">
                            <img 
                              src={getAllergenBadgeSvg(pos.grade, 20)} 
                              width={20} 
                              height={20} 
                              alt={`Độ ${pos.grade}`} 
                              className="inline-block align-middle"
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
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
            {/* Cột trái: Diễn giải độ dương tính theo các thang đo áp dụng */}
            <div className="col-span-5 space-y-2">
              {scales.map((scale, sIdx) => (
                <div key={scale.id || sIdx} className="border border-slate-300 rounded bg-white">
                  <div className="bg-slate-100 py-1.5 px-2 text-center font-bold text-red-700 text-[12px] uppercase border-b-2 border-slate-300">
                    {scale.name || 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH'}
                  </div>
                  <table className="w-full text-[11.5px] border-collapse">
                    <thead className="bg-slate-50 font-bold border-b border-slate-300">
                      <tr>
                        <th className="h-7 py-0 px-1.5 text-center border-r border-slate-300 align-middle w-12">ĐỘ (+)</th>
                        <th className="h-7 py-0 px-1.5 text-center border-r border-slate-300 align-middle">NỒNG ĐỘ ({scale.unit || 'IU/ml'})</th>
                        <th className="h-7 py-0 px-1.5 text-center align-middle">DIỄN GIẢI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {scale.levels.map((level) => {
                        const gradeStyle = getAllergenGradeClasses(level.grade);
                        return (
                          <tr key={level.grade} className={gradeStyle.rowBg}>
                            <td className="h-7 py-0 text-center border-r border-slate-300 font-bold align-middle">
                              <div className="flex items-center justify-center">
                                <img 
                                  src={getAllergenBadgeSvg(level.grade, 18)} 
                                  width={18} 
                                  height={18} 
                                  alt={`Độ ${level.grade}`} 
                                  className="inline-block align-middle"
                                />
                              </div>
                            </td>
                            <td className={`h-7 py-0 text-center font-mono border-r border-slate-300 align-middle ${level.isPositive ? gradeStyle.textColor + ' font-bold' : 'text-slate-600'}`}>
                              {level.rangeText}
                            </td>
                            <td className={`h-7 py-0 text-center align-middle ${level.isPositive ? gradeStyle.textColor + ' font-bold' : 'text-slate-700 font-semibold'}`}>
                              {level.label}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Cột phải: Triệu chứng thường gặp */}
            <div className="col-span-7 border border-slate-300 rounded text-[12px] leading-relaxed bg-slate-50/50 flex flex-col">
              <div className="text-center font-bold text-red-700 text-[12.5px] uppercase py-1.5 px-2 border-b border-slate-300">
                MỘT SỐ TRIỆU CHỨNG THƯỜNG GẶP KHI DỊ ỨNG
              </div>
              <div className="flex-1 flex flex-col justify-center px-3 py-2 space-y-1.5">
                <p className="flex items-start gap-1"><strong className="text-slate-900 shrink-0">Da, niêm mạc:</strong><span>nổi mề đay, phát ban, viêm da; ngứa, sưng môi, lưỡi, miệng, mắt đỏ, viêm kết mạc.</span></p>
                <p className="flex items-start gap-1"><strong className="text-slate-900 shrink-0">Hô hấp:</strong><span>ho, khó thở, hắt hơi, sổ mũi, khò khè, hen suyễn, viêm phổi.</span></p>
                <p className="flex items-start gap-1"><strong className="text-slate-900 shrink-0">Tiêu hóa:</strong><span>nuốt khó, nôn, đau bụng, đầy hơi, tiêu chảy.</span></p>
                <p className="flex items-start gap-1"><strong className="text-slate-900 shrink-0">Thần kinh &amp; Nặng:</strong><span>đau đầu, chóng mặt; Sốt, sốc phản vệ.</span></p>
              </div>
              <p className="text-red-700 font-bold italic px-3 py-1.5 border-t border-slate-300 text-[11.5px]">
                Nếu xuất hiện các triệu chứng trên sau tiếp xúc cần tư vấn bác sỹ ngay.
              </p>
            
            </div>
          </div>

          {/* Bảng ghi chú riêng cho Tổng nồng độ IgE */}
          <div className="mt-2 border border-sky-300 rounded bg-sky-50/40">
            <table className="w-full text-[12px] border-collapse">
              <thead className="bg-sky-100/70 font-bold border-b border-sky-300">
                <tr>
                  <th colSpan={2} className="py-1.5 px-2 text-center text-sky-900 text-[12.5px] uppercase tracking-wide align-middle leading-snug">
                    Ghi chú: Tổng nồng độ IgE (TIgE)
                  </th>
                </tr>
                <tr className="border-t border-sky-200">
                  <th className="py-1 px-2 text-center border-r border-sky-300 w-1/2 align-middle leading-snug">GIÁ TRỊ BÌNH THƯỜNG (IU/ml)</th>
                  <th className="py-1 px-2 text-center w-1/2 align-middle leading-snug">DIỄN GIẢI</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-red-600 border-r border-sky-300 text-[13px] align-middle leading-snug">&lt;15,0</td>
                  <td className="py-1.5 px-2 text-center font-semibold text-slate-700 text-[12.5px] align-middle leading-snug">Mức bình thường — Không tính Độ (+), chỉ có Kết Quả (IU/ml)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-200">
        GOLAB CLINICAL LABORATORY • PHIẾU ĐỊNH LƯỢNG IgE ĐẶC HIỆU DỊ NGUYÊN • TRANG 2
      </div>
    </div>
  );
}

export default memo(AllergenSummaryPage);
