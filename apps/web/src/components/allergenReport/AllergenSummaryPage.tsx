import { memo } from 'react';
import { Patient, ClinicInfo, AllergenGradingScale } from '@domain/types';
import { getAllergenGradeClasses } from '@domain/allergenDetector';
import { AllergenReportItemDTO } from '@domain/services/AllergenReportDomainService';

interface AllergenSummaryPageProps {
  patient: Patient;
  clinicInfo?: ClinicInfo;
  currentLogo: string;
  totalCount: number;
  positiveList: AllergenReportItemDTO[];
  appliedScales?: AllergenGradingScale[];
}

function AllergenSummaryPage({
  patient,
  clinicInfo,
  currentLogo,
  totalCount,
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
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-sky-600 pb-2 mb-2">
          <div className="flex items-center space-x-3">
            <div className="h-14 w-28 flex items-center justify-start shrink-0">
              <img src={currentLogo} alt="GoLab Logo" className="h-14 max-w-[112px] w-auto object-contain" />
            </div>
            <div>
              <p className="text-[12.5px] font-bold text-sky-800 uppercase tracking-widest leading-none mb-0.5">
                HỆ THỐNG XÉT NGHIỆM GOLAB
              </p>
              <h1 className="text-[16px] font-black text-sky-950 uppercase tracking-tight">
                {clinicInfo?.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
              </h1>
              <p className="text-[12px] text-slate-700 font-medium">
                Địa chỉ: {clinicInfo?.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}
              </p>
              <p className="text-[12px] text-slate-700 font-medium">
                Website: <strong className="text-sky-800">{clinicInfo?.website || 'golab.com.vn'}</strong> – Hotline: <strong className="text-sky-800">{clinicInfo?.phone || '032.855.3773'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Tiêu đề trang 2 */}
        <div className="text-center my-2">
          <h2 className="text-[18px] font-black text-sky-900 uppercase tracking-wide">
            ĐỊNH LƯỢNG IgE ĐẶC HIỆU {totalCount} DỊ NGUYÊN
          </h2>
          <p className="text-[13px] text-sky-700 italic font-medium">
            (Thực hiện trên máy PROTIA Allergy-Q Smart và Q-processor)
          </p>
        </div>

        {/* Thông tin vắn tắt bệnh nhân */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-300 rounded px-4 py-2 mb-2 text-[13px] leading-snug">
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
        <div className="border border-slate-300 rounded mb-1.5 bg-white">
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
                      <td className="py-2 px-4 text-center font-mono text-[14.5px] align-middle leading-snug">
                        {pos.isTIgE ? (
                          <span className={`text-[12.5px] font-bold ${pos.isPositive ? 'text-red-700' : 'text-sky-900'}`}>
                            {pos.result || '---'} <span className="text-slate-500 text-[10px] font-normal">(IU/ml)</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center justify-center min-w-[26px] h-[22px] px-1.5 rounded font-black border leading-none text-center ${gradeStyle.badgeBg}`}>
                            {pos.grade}
                          </span>
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
                        <th className="py-1 px-1.5 text-center border-r border-slate-300 align-middle leading-snug w-12">ĐỘ (+)</th>
                        <th className="py-1 px-1.5 text-center border-r border-slate-300 align-middle leading-snug">NỒNG ĐỘ ({scale.unit || 'IU/ml'})</th>
                        <th className="py-1 px-1.5 text-center align-middle leading-snug">DIỄN GIẢI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {scale.levels.map((level) => {
                        const gradeStyle = getAllergenGradeClasses(level.grade);
                        return (
                          <tr key={level.grade} className={gradeStyle.rowBg}>
                            <td className="py-0.5 text-center border-r border-slate-300 font-bold align-middle leading-snug">
                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-black border leading-none text-center ${gradeStyle.badgeBg}`}>
                                {level.grade}
                              </span>
                            </td>
                            <td className={`py-0.5 text-center font-mono border-r border-slate-300 align-middle leading-snug ${level.isPositive ? gradeStyle.textColor + ' font-bold' : 'text-slate-600'}`}>
                              {level.rangeText}
                            </td>
                            <td className={`py-0.5 text-center align-middle leading-snug ${level.isPositive ? gradeStyle.textColor + ' font-bold' : 'text-slate-700 font-semibold'}`}>
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
            <div className="col-span-7 border border-slate-300 rounded p-2 text-[12px] leading-relaxed space-y-0.5 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="text-center font-bold text-red-700 text-[12.5px] uppercase pb-0.5 border-b border-slate-300 mb-1">
                  MỘT SỐ TRIỆU CHỨNG THƯỜNG GẶP KHI DỊ ỨNG
                </div>
                <p><strong className="text-slate-900">Da, niêm mạc:</strong> nổi mề đay, phát ban, viêm da; ngứa, sưng môi, lưỡi, miệng, mắt đỏ, viêm kết mạc.</p>
                <p><strong className="text-slate-900">Hô hấp:</strong> ho, khó thở, hắt hơi, sổ mũi, khò khè, hen suyễn, viêm phổi.</p>
                <p><strong className="text-slate-900">Tiêu hóa:</strong> nuốt khó, nôn, đau bụng, đầy hơi, tiêu chảy.</p>
                <p><strong className="text-slate-900">Thần kinh & Nặng:</strong> đau đầu, chóng mặt; Sốt, sốc phản vệ.</p>
              </div>
              <p className="text-red-700 font-bold italic pt-1 border-t border-slate-300 mt-2">
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
