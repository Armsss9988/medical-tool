import { Eye, Undo2, Trash2, AlertCircle } from 'lucide-react';
import type { Invoice } from '@domain';
import { InvoiceTableSkeleton } from './RevenueSkeleton';

export interface RevenueInvoiceTableProps {
  filteredInvoices: Invoice[];
  isLoading: boolean;
  onViewInvoice: (inv: Invoice) => void;
  onCancelInvoice?: (invoiceId: string) => void;
  onDeleteInvoice: (id: string) => void;
}

export function RevenueInvoiceTable({
  filteredInvoices,
  isLoading,
  onViewInvoice,
  onCancelInvoice,
  onDeleteInvoice
}: RevenueInvoiceTableProps) {
  if (isLoading) {
    return <InvoiceTableSkeleton />;
  }

  if (filteredInvoices.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 space-y-3">
        <AlertCircle className="w-10 h-10 mx-auto text-slate-600" />
        <p className="text-sm font-semibold">Không tìm thấy hóa đơn nào phù hợp với bộ lọc!</p>
        <p className="text-xs text-slate-500">Hãy thử chọn "Mọi thời gian" hoặc xóa từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <>
      {/* ═══ DESKTOP INVOICES TABLE (≥ md) ═══ */}
      <div className="hidden md:block border border-slate-800 rounded-xl overflow-hidden shadow-inner">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-800 text-slate-200 font-bold border-b border-slate-700 text-[11.5px]">
            <tr>
              <th className="p-2.5 w-10 text-center">STT</th>
              <th className="p-2.5">Mã HĐ & Ngày Lập</th>
              <th className="p-2.5">Bệnh Nhân & Mã BN</th>
              <th className="p-2.5">BS Chỉ Định & Gói</th>
              <th className="p-2.5">Số Dịch Vụ</th>
              <th className="p-2.5">Hình Thức</th>
              <th className="p-2.5 text-right">Giảm Giá</th>
              <th className="p-2.5 text-right">Thực Thu</th>
              <th className="p-2.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/40">
            {filteredInvoices.map((inv, idx) => (
              <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                <td className="p-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                
                <td className="p-2.5">
                  <span className="font-mono font-bold text-amber-400 block">{inv.code}</span>
                  <span className="text-[10.5px] text-slate-400">
                    {inv.createdAt ? new Date(inv.createdAt).toLocaleString('vi-VN') : '---'}
                  </span>
                </td>

                <td className="p-2.5">
                  <strong className="text-white uppercase font-bold block">{inv.patientName || '---'}</strong>
                  <span className="font-mono text-[10.5px] text-slate-400">{inv.patientCode || '---'} • {inv.patientPhone || ''}</span>
                </td>

                <td className="p-2.5">
                  <span className="font-semibold text-slate-200 block">{inv.doctorName || '---'}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700">
                    {inv.packageName || 'Tùy chọn'}
                  </span>
                </td>

                <td className="p-2.5 font-mono text-slate-300">
                  {inv.items?.length || 0} dịch vụ
                </td>

                <td className="p-2.5">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inv.paymentMethod === 'Chuyển khoản (VietQR)'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : inv.paymentMethod === 'Tiền mặt'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {inv.paymentMethod}
                    </span>
                    <span className={`inline-block text-[9.5px] font-semibold px-1.5 py-0.2 rounded ${
                      inv.status === 'Đã thanh toán'
                        ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
                        : inv.status === 'Đã hủy / Hoàn tiền'
                        ? 'text-rose-400 bg-rose-950/40 border border-rose-500/30'
                        : 'text-amber-400 bg-amber-950/40 border border-amber-500/30'
                    }`}>
                      {inv.status || 'Chưa thu phí'}
                    </span>
                  </div>
                </td>

                <td className="p-2.5 text-right font-mono text-rose-400 font-semibold">
                  {(inv.discountAmount || 0) > 0 ? `-${(inv.discountAmount || 0).toLocaleString('vi-VN')} đ` : '0 đ'}
                </td>

                <td className="p-2.5 text-right font-mono font-bold text-emerald-400 text-xs">
                  {(inv.finalAmount ?? 0).toLocaleString('vi-VN')} đ
                </td>

                <td className="p-2.5 text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onViewInvoice(inv)}
                      className="p-1.5 bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white rounded-lg transition"
                      title="Xem và in lại Biên lai viện phí"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {onCancelInvoice && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Hủy hóa đơn ${inv.code} của bệnh nhân ${inv.patientName} và hoàn trả trạng thái "Chưa thu tiền" cho phiếu xét nghiệm?`)) {
                            onCancelInvoice(inv.id);
                          }
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg transition"
                        title="Hủy hóa đơn này & hoàn lại trạng thái Chưa Thu Phí cho Phiếu XN"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Xóa hoàn toàn hóa đơn ${inv.code} khỏi cơ sở dữ liệu?`)) {
                          onDeleteInvoice(inv.id);
                        }
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition"
                      title="Xóa hóa đơn này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ MOBILE INVOICES CARDS (< md) ═══ */}
      <div className="md:hidden space-y-2.5">
        {filteredInvoices.map((inv) => (
          <div
            key={`mob_inv_${inv.id}`}
            className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-amber-400 text-xs">{inv.code}</span>
                <h4 className="text-sm font-bold text-white uppercase mt-0.5">{inv.patientName || '---'}</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {inv.patientCode || '---'} • {inv.patientPhone || ''}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold text-emerald-400 block">
                  {(inv.finalAmount ?? 0).toLocaleString('vi-VN')} đ
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('vi-VN') : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-1 flex-wrap pt-1 border-t border-slate-800/60">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                inv.paymentMethod === 'Chuyển khoản (VietQR)'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : inv.paymentMethod === 'Tiền mặt'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {inv.paymentMethod}
              </span>

              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                inv.status === 'Đã thanh toán'
                  ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
                  : 'text-amber-400 bg-amber-950/40 border border-amber-500/30'
              }`}>
                {inv.status || 'Đã thanh toán'}
              </span>

              <span className="text-[10px] text-slate-400 font-mono">
                {inv.items?.length || 0} DV
              </span>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => onViewInvoice(inv)}
                className="flex-1 py-2 px-3 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem & In Biên Lai</span>
              </button>

              {onCancelInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hủy hóa đơn ${inv.code} của bệnh nhân ${inv.patientName}?`)) {
                      onCancelInvoice(inv.id);
                    }
                  }}
                  className="p-2 bg-slate-800 hover:bg-amber-600 text-amber-300 hover:text-white rounded-xl border border-slate-700 transition active:scale-95 cursor-pointer"
                  title="Hủy hóa đơn"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Xóa hoàn toàn hóa đơn ${inv.code}?`)) {
                    onDeleteInvoice(inv.id);
                  }
                }}
                className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition active:scale-95 cursor-pointer"
                title="Xóa hóa đơn"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
