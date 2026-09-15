import { AlertTriangle, CheckCircle, Calendar, CreditCard } from 'lucide-react';
import type { MedicalReport } from '@domain';
import { ReportKindResolver } from '@domain/valueObjects/ReportKind';
import { InvoiceTableSkeleton } from './RevenueSkeleton';

export interface RevenuePendingReportsTableProps {
  pendingReports: MedicalReport[];
  totalPendingAmount: number;
  isLoading: boolean;
  getEstimatedFee: (rep: MedicalReport) => number;
  onOpenInvoiceForReport?: (report: MedicalReport) => void;
}

export function RevenuePendingReportsTable({
  pendingReports,
  totalPendingAmount,
  isLoading,
  getEstimatedFee,
  onOpenInvoiceForReport
}: RevenuePendingReportsTableProps) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl flex items-center justify-between text-xs text-rose-200">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            Danh sách <strong>{pendingReports.length}</strong> phiếu xét nghiệm đã tiếp nhận / trả kết quả nhưng <strong>chưa thu tiền</strong> (Tổng công nợ tạm tính: <strong className="font-mono text-rose-300">{totalPendingAmount.toLocaleString('vi-VN')} đ</strong>).
          </span>
        </div>
      </div>

      {isLoading ? (
        <InvoiceTableSkeleton />
      ) : pendingReports.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <CheckCircle className="w-10 h-10 mx-auto text-emerald-500" />
          <p className="text-sm font-semibold text-emerald-400">Tuyệt vời! Không có phiếu xét nghiệm nào đang nợ viện phí.</p>
          <p className="text-xs text-slate-500">Tất cả các ca khám đều đã được thanh toán đầy đủ.</p>
        </div>
      ) : (
        <>
          {/* ═══ DESKTOP PENDING TABLE (≥ md) ═══ */}
          <div className="hidden md:block border border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-800 text-slate-200 font-bold border-b border-slate-700 text-[11.5px]">
                <tr>
                  <th className="p-2.5 w-10 text-center">STT</th>
                  <th className="p-2.5">Mã Phiếu & Thời Gian</th>
                  <th className="p-2.5">Bệnh Nhân & Năm Sinh</th>
                  <th className="p-2.5">Số ĐT & Địa Chỉ</th>
                  <th className="p-2.5">Bác Sĩ & Loại Phiếu</th>
                  <th className="p-2.5 text-center">Số Chỉ Số</th>
                  <th className="p-2.5 text-right">Tạm Tính Viện Phí</th>
                  <th className="p-2.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {pendingReports.map((rep, idx) => {
                  const estFee = getEstimatedFee(rep);
                  const kind = ReportKindResolver.resolve(rep.selectedTests);

                  return (
                    <tr key={rep.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>

                      <td className="p-2.5">
                        <span className="font-mono font-bold text-sky-400 block">{rep.code}</span>
                        <span className="text-[10.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {rep.createdAt ? new Date(rep.createdAt).toLocaleString('vi-VN') : '---'}
                        </span>
                      </td>

                      <td className="p-2.5">
                        <strong className="text-white uppercase font-bold block">{rep.patient?.name || '---'}</strong>
                        <span className="text-[10.5px] text-slate-400">{rep.patient?.dob || '---'} • {rep.patient?.gender || '---'}</span>
                      </td>

                      <td className="p-2.5 max-w-[180px]">
                        <span className="font-mono text-slate-300 block">{rep.patient?.phone || '---'}</span>
                        <span className="text-[10.5px] text-slate-400 truncate block mt-0.5" title={rep.patient?.address}>
                          {rep.patient?.address || 'Quảng Bình'}
                        </span>
                      </td>

                      <td className="p-2.5">
                        <span className="font-semibold text-slate-200 block">{rep.doctorName || 'BS. Trần Hoài Long'}</span>
                        <span className={`inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded mt-0.5 ${
                          kind.type === 'hybrid'
                            ? 'bg-purple-500/20 text-purple-300'
                            : kind.type === 'allergen'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-sky-500/20 text-sky-300'
                        }`}>
                          {kind.type === 'hybrid' ? 'Hỗn Hợp' : kind.type === 'allergen' ? 'Dị Nguyên' : 'Xét Nghiệm'}
                        </span>
                      </td>

                      <td className="p-2.5 text-center font-mono font-bold text-slate-300">
                        {rep.testCount || rep.selectedTests?.length || 0}
                      </td>

                      <td className="p-2.5 text-right font-mono font-bold text-rose-400 text-xs">
                        {(estFee || 0).toLocaleString('vi-VN')} đ
                      </td>

                      <td className="p-2.5 text-right">
                        {onOpenInvoiceForReport && (
                          <button
                            type="button"
                            onClick={() => onOpenInvoiceForReport(rep)}
                            className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg shadow transition active:scale-95 flex items-center gap-1.5 ml-auto text-xs"
                            title="Mở cửa sổ lập hóa đơn và thu tiền ngay"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Thu Phí Ngay</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ═══ MOBILE PENDING CARDS (< md) ═══ */}
          <div className="md:hidden space-y-2.5">
            {pendingReports.map((rep) => {
              const estFee = getEstimatedFee(rep);
              const kind = ReportKindResolver.resolve(rep.selectedTests);

              return (
                <div
                  key={`mob_pending_${rep.id}`}
                  className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-sky-400">{rep.code}</span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          kind.type === 'hybrid'
                            ? 'bg-purple-500/20 text-purple-300'
                            : kind.type === 'allergen'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-sky-500/20 text-sky-300'
                        }`}>
                          {kind.type === 'hybrid' ? 'Hỗn Hợp' : kind.type === 'allergen' ? 'Dị Nguyên' : 'Xét Nghiệm'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white uppercase mt-0.5">{rep.patient?.name || '---'}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {rep.patient?.dob || '---'} • {rep.patient?.gender || '---'} • {rep.patient?.phone || ''}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-rose-400 block">
                        {(estFee || 0).toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString('vi-VN') : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10.5px]">
                    <span className="text-slate-400">{rep.doctorName || 'BS. Trần Hoài Long'}</span>
                    <span className="text-slate-400 font-mono">{rep.testCount || rep.selectedTests?.length || 0} chỉ số</span>
                  </div>

                  {onOpenInvoiceForReport && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => onOpenInvoiceForReport(rep)}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Lập Hóa Đơn & Thu Phí Ngay</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
