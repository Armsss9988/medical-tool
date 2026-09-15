import type { Doctor } from '@domain';

export interface DoctorStatRow {
  doctor: { id: string; name: string };
  doctorObj?: Doctor;
  totalRevenue: number;
  invoiceCount: number;
  percentage: number;
  rate: number;
  commissionAmount: number;
}

export interface RevenueDoctorTableProps {
  doctorStats: DoctorStatRow[];
  onCommissionRateChange: (docName: string, newRate: number) => void;
}

export function RevenueDoctorTable({
  doctorStats,
  onCommissionRateChange
}: RevenueDoctorTableProps) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-sky-950/30 border border-sky-800/40 rounded-xl flex items-center justify-between text-xs text-sky-200">
        <span>
          💡 Tỷ lệ hoa hồng (%): Bạn có thể tùy chỉnh % trích thưởng trực tiếp trên từng hàng để tự động tính tiền chiết khấu bác sĩ.
        </span>
      </div>

      <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-800 text-slate-200 font-bold border-b border-slate-700 text-[11.5px]">
            <tr>
              <th className="p-2.5 w-10 text-center">STT</th>
              <th className="p-2.5">Bác Sĩ Chỉ Định</th>
              <th className="p-2.5">Chuyên Khoa / SĐT</th>
              <th className="p-2.5 text-center">Số Ca Chỉ Định</th>
              <th className="p-2.5 text-right">Tổng Doanh Số (VNĐ)</th>
              <th className="p-2.5 text-center">Tỷ Lệ Đóng Góp (%)</th>
              <th className="p-2.5 text-center w-28">% Hoa Hồng</th>
              <th className="p-2.5 text-right">Tiền Hoa Hồng (VNĐ)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/40">
            {doctorStats.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  Chưa có dữ liệu bác sĩ trong khoảng thời gian này
                </td>
              </tr>
            ) : (
              doctorStats.map((stat, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="p-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                  
                  <td className="p-2.5 font-bold text-white text-xs">
                    {stat.doctor.name}
                  </td>

                  <td className="p-2.5 text-slate-300">
                    {stat.doctorObj?.specialty || 'Bác sĩ đa khoa'} • <span className="font-mono text-slate-400">{stat.doctorObj?.phone || '---'}</span>
                  </td>

                  <td className="p-2.5 text-center font-mono font-bold text-amber-400">
                    {stat.invoiceCount} ca
                  </td>

                  <td className="p-2.5 text-right font-mono font-bold text-white text-xs">
                    {stat.totalRevenue.toLocaleString('vi-VN')} đ
                  </td>

                  <td className="p-2.5 text-center font-mono font-semibold text-sky-400">
                    {stat.percentage.toFixed(1)}%
                  </td>

                  <td className="p-2.5 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={stat.rate}
                        onChange={(e) => onCommissionRateChange(stat.doctor.name, Number(e.target.value))}
                        className="w-14 py-1 px-1.5 text-center bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </td>

                  <td className="p-2.5 text-right font-mono font-bold text-emerald-400 text-xs">
                    {stat.commissionAmount.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
