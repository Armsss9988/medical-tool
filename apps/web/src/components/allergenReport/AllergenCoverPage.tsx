import { memo } from 'react';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import { Patient, ClinicInfo } from '@domain/types';

interface AllergenCoverPageProps {
  patient: Patient;
  clinicInfo?: ClinicInfo;
  currentDateStr: string;
  doctorName?: string;
  finalQrCode: string;
  currentLogo: string;
  currentStamp: string;
  totalCount: number;
  packagePrice: number;
  totalPages: number;
}

function AllergenCoverPage({
  patient,
  clinicInfo,
  currentDateStr,
  doctorName,
  finalQrCode,
  currentLogo,
  currentStamp,
  totalCount,
  packagePrice,
  totalPages
}: AllergenCoverPageProps) {
  return (
    <div 
      data-page="true"
      className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 p-8 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-6 flex flex-col justify-between box-border"
      style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
    >
      <div>
        {/* Header Phòng khám */}
        <div className="flex items-center justify-between border-b-2 border-sky-600 pb-3 mb-3">
          <div className="flex items-center space-x-4">
            <div className="h-[74px] w-[142px] flex items-center justify-center shrink-0">
              <img
                src={currentLogo}
                alt="GoLab Logo"
                className="max-h-full max-w-full w-auto h-auto object-contain object-center"
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
              <p className="text-[13px] font-bold text-sky-800 uppercase tracking-widest leading-none mb-1">
                HỆ THỐNG XÉT NGHIỆM GOLAB
              </p>
              <h1 className="text-[18px] font-black text-sky-950 uppercase tracking-tight">
                {clinicInfo?.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
              </h1>
              <p className="text-[13px] text-slate-700 font-medium">
                Địa chỉ: {clinicInfo?.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}
              </p>
              <p className="text-[12.5px] text-slate-700 font-medium">
                Website: <strong className="text-sky-800">{clinicInfo?.website || 'golab.com.vn'}</strong> – Hotline: <strong className="text-sky-800">{clinicInfo?.phone || '032.855.3773'}</strong>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded shadow-2xs shrink-0 min-w-[62px]">
            {finalQrCode ? (
              <img src={finalQrCode} alt="QR Code Tra Cứu" data-qr="true" className="w-14 h-14 object-contain" />
            ) : (
              <div className="w-14 h-14 flex items-center justify-center bg-slate-50 text-[10px] text-slate-400 font-mono">
                QR
              </div>
            )}
            <span className="text-[9.5px] font-mono text-sky-800 font-extrabold mt-0.5 tracking-tight">QR Tra Cứu</span>
          </div>
        </div>

        {/* Tiêu đề trang 1 */}
        <div className="text-center my-3">
          <h2 className="text-[23px] font-black text-slate-900 uppercase tracking-wide">
            PHIẾU KẾT QUẢ XÉT NGHIỆM
          </h2>
        </div>

        {/* Bảng thông tin hành chính 12 trường */}
        <div className="border border-slate-300 rounded mb-4 bg-white">
          <table className="w-full text-[13px] border-collapse">
            <tbody>
              <tr>
                <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Họ và tên:</td>
                <td className="py-2 px-3 font-bold text-red-600 uppercase border-r border-b border-slate-300 align-middle text-[14px] leading-snug">{patient.name || '---'}</td>
                <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G chỉ định</td>
                <td className="py-2 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug">{patient.orderedAt || currentDateStr}</td>
              </tr>
              <tr>
                <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Năm sinh:</td>
                <td className="py-2 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.dob || '---'}</td>
                <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G đóng phí</td>
                <td className="py-2 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug">{patient.paidAt || currentDateStr}</td>
              </tr>
              <tr>
                <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Địa chỉ</td>
                <td className="py-2 px-3 text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}</td>
                <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Số bệnh phẩm</td>
                <td className="py-2 px-3 font-mono font-bold text-red-600 border-b border-slate-300 align-middle text-[14px] leading-snug">{patient.sampleCode || patient.code}</td>
              </tr>
              <tr>
                <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Giới tính:</td>
                <td className="py-2 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.gender || 'Nam'}</td>
                <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Tình trạng mẫu</td>
                <td className="py-2 px-3 font-medium text-emerald-700 font-bold border-b border-slate-300 align-middle leading-snug">Đạt</td>
              </tr>
              <tr>
                <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Số điện thoại</td>
                <td className="py-2 px-3 font-mono text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.phone || '---'}</td>
                <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G nhận mẫu</td>
                <td className="py-2 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug">{patient.receivedAt || currentDateStr}</td>
              </tr>
              <tr>
                <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Bác sĩ chỉ định</td>
                <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-300 align-middle leading-snug">{patient.doctor || doctorName || 'BS. Trần Hoài Long'}</td>
                <td className="w-32 py-2 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G trả kết quả</td>
                <td className="py-2 px-3 font-medium text-slate-800 align-middle leading-snug">{patient.returnedAt || currentDateStr}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bảng Dịch Vụ / Gói Xét Nghiệm */}
        <div className="border border-slate-300 rounded mb-4 bg-white">
          <table className="w-full text-[13px] border-collapse">
            <thead className="bg-slate-50 text-slate-900 font-bold border-b-2 border-slate-300">
              <tr>
                <th className="py-2 px-3 w-14 text-center border-r border-slate-300 align-middle leading-snug">STT</th>
                <th className="py-2 px-4 text-left border-r border-slate-300 align-middle leading-snug">Tên Xét Nghiệm</th>
                <th className="py-2 px-3 w-32 text-center border-r border-slate-300 align-middle leading-snug">Kết quả</th>
                <th className="py-2 px-4 text-left border-r border-slate-300 align-middle leading-snug">Ghi chú</th>
                <th className="py-2 px-4 w-36 text-right align-middle leading-snug">Giá tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-[13.5px]">
                <td className="py-2.5 px-3 text-center border-r border-slate-300 font-medium align-middle leading-snug">1</td>
                <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-300 align-middle leading-snug">
                  Panel {totalCount} dị nguyên
                </td>
                <td className="py-2.5 px-3 text-center border-r border-slate-300 text-slate-400 font-mono align-middle leading-snug">---</td>
                <td className="py-2.5 px-4 text-slate-700 border-r border-slate-300 font-medium align-middle leading-snug">
                  Kết quả chi tiết trong file đính kèm
                </td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 text-[14px] align-middle leading-snug">
                  {packagePrice.toLocaleString('vi-VN')} đ
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Chữ Ký & Con Dấu Phụ Trách Chuyên Môn */}
        <div className="flex justify-end pt-2">
          <div className="text-center min-w-[220px]">
            <p className="text-[13px] text-slate-700 italic leading-normal pb-0.5">Ngày {currentDateStr}</p>
            <p className="text-[14px] font-bold uppercase text-slate-900 tracking-wide my-1 leading-normal pb-0.5">
              PHỤ TRÁCH CHUYÊN MÔN
            </p>
            <div className="h-26 flex items-center justify-center my-0.5">
              <img
                src={currentStamp}
                alt="Con Dấu & Chữ Ký"
                className="h-26 w-auto object-contain max-w-[135px]"
                loading="eager"
                decoding="sync"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null;
                  target.src = doctorStamp;
                }}
              />
            </div>
            <p className="text-[14.5px] font-bold text-slate-900 uppercase leading-normal pt-1 pb-0.5">
              {clinicInfo?.defaultDoctor || 'Nguyễn Thị Thành Trung'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Page 1 */}
      <div className="mt-auto pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 uppercase font-mono">
        <span>
          HỆ THỐNG XÉT NGHIỆM GOLAB • {clinicInfo?.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'} • HOTLINE: {clinicInfo?.phone || '032.855.3773'}
        </span>
        <span className="font-bold text-sky-800">
          Trang 1/{totalPages}
        </span>
      </div>
    </div>
  );
}

export default memo(AllergenCoverPage);
