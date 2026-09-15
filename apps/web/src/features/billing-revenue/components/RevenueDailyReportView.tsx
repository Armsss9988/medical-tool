import { Printer } from 'lucide-react';
import type { ClinicInfo, DateFilterType } from '@domain';
import type { DoctorStatRow } from './RevenueDoctorTable';

export interface RevenueDailyReportViewProps {
  safeClinic: ClinicInfo;
  clinicInfo?: ClinicInfo;
  dateFilter: DateFilterType;
  kpis: {
    totalFinal: number;
    totalRaw: number;
    totalDiscount: number;
    count: number;
  };
  doctorStats: DoctorStatRow[];
}

export function RevenueDailyReportView({
  safeClinic,
  clinicInfo,
  dateFilter,
  kpis,
  doctorStats
}: RevenueDailyReportViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-slate-800/80 border border-slate-700 rounded-xl">
        <div>
          <span className="font-bold text-white text-xs block">Báo Cáo Tổng Hợp Doanh Thu & Quyết Toán Ca</span>
          <span className="text-[11px] text-slate-400">Xem trước mẫu in khổ A4 phục vụ bàn giao ca trực hoặc nộp thủ quỹ</span>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5"
        >
          <Printer className="w-4 h-4" />
          <span>In Báo Cáo Doanh Thu (A4)</span>
        </button>
      </div>

      {/* KHỐI PREVIEW BÁO CÁO IN A4 */}
      <div className="bg-white text-slate-900 rounded-xl p-8 border border-slate-300 shadow-xl max-w-4xl mx-auto font-serif text-[13px] space-y-4">
        <div className="flex justify-between items-start border-b-2 border-slate-400 pb-3">
          <div>
            <h1 className="text-[16px] font-black uppercase text-sky-950">{safeClinic.name}</h1>
            <p className="text-[12px] text-slate-600">ĐC: {safeClinic.address}</p>
            <p className="text-[12px] text-slate-600">Hotline: {safeClinic.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500 italic">Mẫu: <strong>BC-TC/GOLAB</strong></p>
            <p className="text-[12px] text-slate-700">Ngày lập: <strong>{new Date().toLocaleDateString('vi-VN')}</strong></p>
          </div>
        </div>

        <div className="text-center my-3">
          <h2 className="text-[18px] font-black uppercase tracking-wide text-sky-950">
            BÁO CÁO TỔNG KẾT DOANH THU & VIỆN PHÍ
          </h2>
          <p className="text-[12px] text-slate-600 italic">
            (Phạm vi: {dateFilter === 'ALL' ? 'Toàn bộ dữ liệu' : dateFilter === 'TODAY' ? 'Hôm nay' : 'Theo khoảng thời gian đã lọc'})
          </p>
        </div>

        {/* TỔNG HỢP SỐ LIỆU */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-300 rounded font-sans text-xs">
          <div>
            <span className="text-slate-500 block">Tổng số hóa đơn:</span>
            <strong className="text-[15px] text-slate-900 font-mono">{kpis.count} lượt</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Tổng tiền giảm giá:</span>
            <strong className="text-[15px] text-rose-700 font-mono">{kpis.totalDiscount.toLocaleString('vi-VN')} đ</strong>
          </div>
          <div>
            <span className="text-slate-500 block">TỔNG THỰC THU:</span>
            <strong className="text-[17px] text-red-600 font-mono font-black">{kpis.totalFinal.toLocaleString('vi-VN')} đ</strong>
          </div>
        </div>

        {/* BẢNG TỔNG HỢP THEO BÁC SĨ */}
        <div>
          <h3 className="font-bold text-slate-800 mb-1 font-sans text-xs uppercase">1. Thống kê theo Bác sĩ chỉ định:</h3>
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead className="bg-slate-100 font-bold border-b border-slate-300">
              <tr>
                <th className="p-1.5 border-r border-slate-300 w-8 text-center">STT</th>
                <th className="p-1.5 border-r border-slate-300">Bác sĩ</th>
                <th className="p-1.5 border-r border-slate-300 text-center">Số ca</th>
                <th className="p-1.5 border-r border-slate-300 text-right">Doanh số</th>
                <th className="p-1.5 text-right">Hoa hồng trích</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {doctorStats.map((d, i) => (
                <tr key={i}>
                  <td className="p-1.5 text-center font-mono border-r border-slate-300">{i + 1}</td>
                  <td className="p-1.5 font-semibold border-r border-slate-300">{d.doctor.name}</td>
                  <td className="p-1.5 text-center font-mono border-r border-slate-300">{d.invoiceCount}</td>
                  <td className="p-1.5 text-right font-mono font-bold border-r border-slate-300">{d.totalRevenue.toLocaleString('vi-VN')} đ</td>
                  <td className="p-1.5 text-right font-mono font-bold text-emerald-800">{d.commissionAmount.toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CHỮ KÝ GIAO BAN */}
        <div className="pt-6 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold uppercase text-slate-900">THỦ QUỸ</p>
            <div className="h-16" />
            <p className="font-semibold text-slate-700">(Ký, ghi rõ họ tên)</p>
          </div>
          <div>
            <p className="font-bold uppercase text-slate-900">KẾ TOÁN VIỆN</p>
            <div className="h-16" />
            <p className="font-semibold text-slate-700">(Ký, ghi rõ họ tên)</p>
          </div>
          <div>
            <p className="font-bold uppercase text-slate-900">GIÁM ĐỐC / ĐẠI DIỆN</p>
            <div className="h-16" />
            <p className="font-bold text-slate-900">{clinicInfo?.defaultDoctor || 'Nguyễn Thị Thành Trung'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
