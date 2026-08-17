import { useState } from 'react';
import { X, CreditCard, Trash2 } from 'lucide-react';
import { Invoice, Doctor } from '@domain/types';

interface RevenueManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  onDeleteInvoice: (id: string) => void;
  onClearAllInvoices: () => void;
  doctorsList?: Doctor[];
}

export default function RevenueManagerModal({
  isOpen,
  onClose,
  invoices,
  onDeleteInvoice,
  onClearAllInvoices
}: RevenueManagerModalProps) {
  if (!isOpen) return null;

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Sổ Sách Báo Cáo Doanh Thu ({invoices.length} hóa đơn)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow text-xs space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="block text-slate-600 font-semibold">TỔNG DOANH THU ĐÃ THU</span>
              <span className="text-2xl font-black font-mono text-amber-900">{totalRevenue.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            {invoices.length > 0 && (
              <button
                onClick={onClearAllInvoices}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-lg transition text-xs"
              >
                Xóa Sạch Lịch Sử
              </button>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-white font-bold">
                <tr>
                  <th className="p-2.5">Mã Hóa Đơn</th>
                  <th className="p-2.5">Bệnh Nhân</th>
                  <th className="p-2.5">Ngày Lập</th>
                  <th className="p-2.5">Hình Thức</th>
                  <th className="p-2.5 text-right">Thực Thu (VNĐ)</th>
                  <th className="p-2.5 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Chưa có hóa đơn nào được lưu trong sổ sách.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{inv.code}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{inv.patientName} {inv.patientCode ? `(${inv.patientCode})` : ''}</td>
                      <td className="p-2.5 text-slate-500">{new Date(inv.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="p-2.5 text-slate-600">{inv.paymentMethod}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        {inv.finalAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-2.5 text-center">
                        <button onClick={() => onDeleteInvoice(inv.id)} className="text-slate-400 hover:text-rose-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
