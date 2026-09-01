import { memo } from 'react';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import {
  Patient,
  ClinicInfo,
  SelectedTest,
  TestEquipment,
  CatalogItemEquipmentLink,
  resolveTestEquipmentName
} from '@domain/types';
import { evaluateResult } from '@domain/testResult';

interface AllergenCoverPageProps {
  patient: Patient;
  clinicInfo?: ClinicInfo;
  currentDateStr: string;
  doctorName?: string;
  conclusion?: string;
  finalQrCode: string;
  currentLogo: string;
  currentStamp: string;
  totalCount: number;
  packagePrice: number;
  packageName?: string;
  totalPages: number;
  regularTests?: SelectedTest[];
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
}

function AllergenCoverPage({
  patient,
  clinicInfo,
  currentDateStr,
  doctorName,
  conclusion,
  finalQrCode,
  currentLogo,
  currentStamp,
  totalCount,
  packagePrice,
  packageName,
  totalPages,
  regularTests = [],
  equipments = [],
  catalogItemEquipments = []
}: AllergenCoverPageProps) {
  const hasRegularTests = regularTests && regularTests.length > 0;

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
          <h2 className="text-[22px] font-black text-slate-900 uppercase tracking-wide">
            PHIẾU KẾT QUẢ XÉT NGHIỆM
          </h2>
        </div>

        {/* Bảng thông tin hành chính 12 trường */}
        <div className="border border-slate-300 rounded mb-3.5 bg-white text-[12.5px]">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Họ và tên:</td>
                <td className="py-1.5 px-3 font-bold text-red-600 uppercase border-r border-b border-slate-300 align-middle text-[13.5px] leading-snug">{patient.name || '---'}</td>
                <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G chỉ định</td>
                <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug">{patient.orderedAt || currentDateStr}</td>
              </tr>
              <tr>
                <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Năm sinh:</td>
                <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.dob || '---'}</td>
                <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G đóng phí</td>
                <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug">{patient.paidAt || currentDateStr}</td>
              </tr>
              <tr>
                <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Địa chỉ</td>
                <td className="py-1.5 px-3 text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.address || 'Đồng Hới, Quảng Bình'}</td>
                <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Số bệnh phẩm</td>
                <td className="py-1.5 px-3 font-mono font-bold text-red-600 border-b border-slate-300 align-middle text-[13.5px] leading-snug">{patient.sampleCode || patient.code}</td>
              </tr>
              <tr>
                <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Giới tính:</td>
                <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.gender || 'Nam'}</td>
                <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Tình trạng mẫu</td>
                <td className="py-1.5 px-3 font-medium text-emerald-700 font-bold border-b border-slate-300 align-middle leading-snug">{patient.sampleStatus || 'Đạt'}</td>
              </tr>
              <tr>
                <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">Số điện thoại</td>
                <td className="py-1.5 px-3 font-mono text-slate-800 border-r border-b border-slate-300 align-middle leading-snug">{patient.phone || '---'}</td>
                <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle leading-snug">T/G nhận mẫu</td>
                <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle leading-snug">{patient.receivedAt || currentDateStr}</td>
              </tr>
              <tr>
                <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">Bác sĩ chỉ định</td>
                <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-300 align-middle leading-snug">{patient.doctor || doctorName || 'BS. Chỉ định'}</td>
                <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle leading-snug">T/G trả kết quả</td>
                <td className="py-1.5 px-3 font-medium text-slate-800 align-middle leading-snug">{patient.returnedAt || currentDateStr}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* BẢNG KẾT QUẢ XÉT NGHIỆM TRÊN TRANG BÌA */}
        {/* ───────────────────────────────────────────────────────────── */}
        {hasRegularTests ? (
          /* TRƯỜNG HỢP 1: CÓ CẢ CHỈ SỐ THƯỜNG & GÓI DỊ NGUYÊN (BẢNG 6 CỘT CHUẨN Y TẾ) */
          <div className="border border-slate-300 rounded mb-3 bg-white">
            <table className="w-full text-[12px] border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-300">
                <tr>
                  <th className="py-1.5 px-2 w-8 text-center border-r border-slate-300 align-middle">STT</th>
                  <th className="py-1.5 px-2.5 text-left border-r border-slate-300 align-middle">TÊN XÉT NGHIỆM</th>
                  <th className="py-1.5 px-2 w-28 text-center border-r border-slate-300 align-middle">KẾT QUẢ</th>
                  <th className="py-1.5 px-2 w-32 text-center border-r border-slate-300 align-middle">TRỊ SỐ THAM CHIẾU</th>
                  <th className="py-1.5 px-1.5 w-16 text-center border-r border-slate-300 align-middle">ĐƠN VỊ</th>
                  <th className="py-1.5 px-2 w-44 text-left align-middle">THIẾT BỊ ĐO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {regularTests.map((t, idx) => {
                  const evaluation = evaluateResult(t.result, t.refMin, t.refMax);
                  const isAbnormal = evaluation.status === 'high' || evaluation.status === 'low';
                  const resolvedEquipment = resolveTestEquipmentName(t, equipments, catalogItemEquipments);

                  return (
                    <tr key={`reg-${t.code}-${idx}`} className={`hover:bg-slate-50 ${isAbnormal ? 'bg-red-50/40' : ''}`}>
                      <td className="py-1 px-2 text-center font-mono text-slate-500 border-r border-slate-200">{idx + 1}</td>
                      <td className="py-1 px-2.5 font-semibold text-slate-900 border-r border-slate-200">
                        {t.name}
                        {t.scientific && <span className="text-[10px] text-slate-500 italic block font-normal">{t.scientific}</span>}
                      </td>
                      <td className={`py-1 px-2 text-center font-mono text-[13px] border-r border-slate-200 ${isAbnormal ? 'text-red-600 font-black' : 'text-slate-900 font-bold'}`}>
                        {t.result || '---'}
                      </td>
                      <td className="py-1 px-2 text-center font-mono text-slate-600 text-[11.5px] border-r border-slate-200">
                        {t.refText || (t.refMin !== undefined && t.refMax !== undefined ? `${t.refMin} - ${t.refMax}` : '---')}
                      </td>
                      <td className="py-1 px-1.5 text-center font-mono text-slate-600 text-[11.5px] border-r border-slate-200">{t.unit || '---'}</td>
                      <td className="py-1 px-2 text-slate-600 text-[11px] truncate max-w-[160px]">{resolvedEquipment}</td>
                    </tr>
                  );
                })}

                {/* Dòng tóm tắt Gói Dị Nguyên */}
                <tr className="bg-sky-50/60 font-semibold border-t-2 border-sky-200">
                  <td className="py-1.5 px-2 text-center font-mono text-sky-900 border-r border-slate-200">{regularTests.length + 1}</td>
                  <td className="py-1.5 px-2.5 text-sky-950 font-bold border-r border-slate-200">
                    Panel {totalCount} Dị Nguyên {packageName ? `(${packageName})` : ''}
                  </td>
                  <td className="py-1.5 px-2 text-center font-bold text-sky-800 italic border-r border-slate-200 text-[11.5px]">
                    Xem trang sau
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono text-slate-500 text-[11px] border-r border-slate-200">---</td>
                  <td className="py-1.5 px-1.5 text-center font-mono text-slate-700 text-[11px] border-r border-slate-200">Gói</td>
                  <td className="py-1.5 px-2 text-sky-900 text-[11px]">Máy Đọc Dị Nguyên PROTIA</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          /* TRƯỜNG HỢP 2: THUẦN DỊ NGUYÊN (BẢNG GÓI DỊ NGUYÊN GỐC) */
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
                    Panel {totalCount} dị nguyên {packageName ? `(${packageName})` : ''}
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
        )}

        {/* Khối Kết Luận & Lời Dặn (nếu có nội dung) */}
        {conclusion && conclusion.trim() !== '' && (
          <div className="border border-slate-300 rounded p-2 mb-3 bg-slate-50/50 text-[12px]">
            <span className="font-bold text-slate-800">KẾT LUẬN &amp; LỜI DẶN: </span>
            <span className="text-slate-800 leading-snug">{conclusion}</span>
          </div>
        )}

        {/* Chữ Ký & Con Dấu Phụ Trách Chuyên Môn */}
        <div className="flex justify-end pt-1">
          <div className="text-center min-w-[220px]">
            <p className="text-[13px] text-slate-700 italic leading-normal pb-0.5">Ngày {currentDateStr}</p>
            <p className="text-[13.5px] font-bold uppercase text-slate-900 tracking-wide my-1 leading-normal pb-0.5">
              PHỤ TRÁCH CHUYÊN MÔN
            </p>
            <div className="h-24 flex items-center justify-center my-0.5">
              <img
                src={currentStamp}
                alt="Con Dấu & Chữ Ký"
                className="h-24 w-auto object-contain max-w-[135px]"
                loading="eager"
                decoding="sync"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null;
                  target.src = doctorStamp;
                }}
              />
            </div>
            <p className="text-[14px] font-bold text-slate-900 uppercase leading-normal pt-1 pb-0.5">
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
