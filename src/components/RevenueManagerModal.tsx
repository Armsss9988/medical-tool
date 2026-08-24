import { useState, useMemo } from 'react';
import {
  X, CreditCard, Trash2, Search, Calendar, FileSpreadsheet, Printer,
  TrendingUp, Users, DollarSign, Wallet, Filter, Eye, AlertCircle, Sparkles, CheckCircle, Percent
} from 'lucide-react';
import { Invoice, Doctor, ClinicInfo, PaymentMethod, InvoiceStatus } from '@domain/types';
import { exportRevenueExcel } from '@infra/excelService';
import PrintReceiptView from './PrintReceiptView';

type DateFilterType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';
type RevenueTabType = 'INVOICES' | 'DOCTORS' | 'DAILY_REPORT';

interface RevenueManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  onDeleteInvoice: (id: string) => void;
  onClearAllInvoices: () => void;
  doctorsList?: Doctor[];
  clinicInfo?: ClinicInfo;
  showToast?: (message: string, type?: any) => void;
}

export default function RevenueManagerModal({
  isOpen,
  onClose,
  invoices,
  onDeleteInvoice,
  onClearAllInvoices,
  doctorsList = [],
  clinicInfo,
  showToast
}: RevenueManagerModalProps) {
  const [activeTab, setActiveTab] = useState<RevenueTabType>('INVOICES');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Hoa hồng bác sĩ (% mặc định = 10%)
  const [doctorCommissionRates, setDoctorCommissionRates] = useState<Record<string, number>>({});

  // Modal Xem lại & In biên lai
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  if (!isOpen) return null;

  // 1. LỌC DANH SÁCH HÓA ĐƠN
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const term = searchTerm.toLowerCase().trim();

    return invoices.filter((inv) => {
      // Tìm kiếm từ khóa
      if (term) {
        const matchCode = inv.code?.toLowerCase().includes(term);
        const matchName = inv.patientName?.toLowerCase().includes(term);
        const matchPhone = inv.patientPhone?.toLowerCase().includes(term);
        const matchDoc = inv.doctorName?.toLowerCase().includes(term);
        const matchPatientCode = inv.patientCode?.toLowerCase().includes(term);
        if (!matchCode && !matchName && !matchPhone && !matchDoc && !matchPatientCode) {
          return false;
        }
      }

      // Lọc theo Bác sĩ
      if (selectedDoctor !== 'ALL' && inv.doctorName !== selectedDoctor) {
        return false;
      }

      // Lọc theo Hình thức thanh toán
      if (selectedPaymentMethod !== 'ALL' && inv.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // Lọc theo Trạng thái
      if (selectedStatus !== 'ALL' && inv.status !== selectedStatus) {
        return false;
      }

      // Lọc theo Thời gian
      const invDate = new Date(inv.createdAt);
      if (dateFilter === 'TODAY') {
        if (invDate.toDateString() !== todayStr) return false;
      } else if (dateFilter === 'YESTERDAY') {
        if (invDate.toDateString() !== yesterdayStr) return false;
      } else if (dateFilter === 'LAST_7_DAYS') {
        if (invDate < sevenDaysAgo) return false;
      } else if (dateFilter === 'THIS_MONTH') {
        if (invDate.getMonth() !== now.getMonth() || invDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === 'LAST_MONTH') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        if (invDate.getMonth() !== lastMonth || invDate.getFullYear() !== lastMonthYear) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate && new Date(customStartDate) > invDate) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (invDate > end) return false;
        }
      }

      return true;
    });
  }, [invoices, searchTerm, selectedDoctor, selectedPaymentMethod, selectedStatus, dateFilter, customStartDate, customEndDate]);

  // 2. TÍNH TOÁN CÁC THẺ KPI TÀI CHÍNH
  const kpis = useMemo(() => {
    const totalFinal = filteredInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
    const totalRaw = filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + (inv.discountAmount || 0), 0);
    const count = filteredInvoices.length;
    const aov = count > 0 ? Math.round(totalFinal / count) : 0;

    // Cơ cấu thanh toán
    const cashTotal = filteredInvoices.filter((i) => i.paymentMethod === 'Tiền mặt').reduce((s, i) => s + (i.finalAmount || 0), 0);
    const vietQrTotal = filteredInvoices.filter((i) => i.paymentMethod === 'Chuyển khoản (VietQR)').reduce((s, i) => s + (i.finalAmount || 0), 0);
    const posTotal = filteredInvoices.filter((i) => i.paymentMethod === 'Quẹt thẻ').reduce((s, i) => s + (i.finalAmount || 0), 0);

    return {
      totalFinal,
      totalRaw,
      totalDiscount,
      count,
      aov,
      cashTotal,
      vietQrTotal,
      posTotal
    };
  }, [filteredInvoices]);

  // 3. THỐNG KÊ THEO BÁC SĨ CHỈ ĐỊNH
  const doctorStats = useMemo(() => {
    const docMap = new Map<string, { totalRevenue: number; invoiceCount: number; name: string; doctorObj?: Doctor }>();

    filteredInvoices.forEach((inv) => {
      const docName = inv.doctorName || 'BS. Trần Hoài Long';
      const cur = docMap.get(docName) || {
        name: docName,
        totalRevenue: 0,
        invoiceCount: 0,
        doctorObj: doctorsList.find((d) => d.name === docName)
      };
      cur.totalRevenue += (inv.finalAmount || 0);
      cur.invoiceCount += 1;
      docMap.set(docName, cur);
    });

    const list = Array.from(docMap.values());
    const totalAllDocs = list.reduce((s, d) => s + d.totalRevenue, 0);

    return list.map((d, idx) => {
      const rate = doctorCommissionRates[d.name] ?? 10; // 10% mặc định
      const commissionAmount = Math.round((d.totalRevenue * rate) / 100);
      const percentage = totalAllDocs > 0 ? (d.totalRevenue / totalAllDocs) * 100 : 0;

      return {
        doctor: { id: d.doctorObj?.id || `DOC-${idx + 1}`, name: d.name },
        doctorObj: d.doctorObj,
        totalRevenue: d.totalRevenue,
        invoiceCount: d.invoiceCount,
        percentage,
        rate,
        commissionAmount
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredInvoices, doctorsList, doctorCommissionRates]);

  // 4. XUẤT FILE EXCEL ĐA SHEET
  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) {
      if (showToast) showToast('Không có dữ liệu hóa đơn để xuất Excel!', 'error');
      return;
    }
    try {
      if (showToast) showToast('Đang tạo file Excel báo cáo doanh thu...', 'info');
      exportRevenueExcel(filteredInvoices, doctorStats);
      if (showToast) showToast(`Đã xuất thành công ${filteredInvoices.length} hóa đơn ra Excel!`, 'success');
    } catch (err) {
      console.error('Lỗi xuất Excel doanh thu:', err);
      if (showToast) showToast('Lỗi khi xuất file Excel báo cáo!', 'error');
    }
  };

  const handleCommissionRateChange = (docName: string, newRate: number) => {
    setDoctorCommissionRates((prev) => ({
      ...prev,
      [docName]: Math.max(0, Math.min(100, newRate))
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[92vh] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER MODAL */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Sổ Sách Doanh Thu & Báo Cáo Tài Chính
                <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono">
                  {filteredInvoices.length} Hóa Đơn
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Theo dõi viện phí, đối soát doanh số bác sĩ, in phiếu thu & xuất báo cáo tài chính
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Sổ Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 shrink-0 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 transition border-b-2 ${
              activeTab === 'INVOICES'
                ? 'text-amber-400 border-amber-500 bg-amber-500/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Sổ Sách Hóa Đơn ({filteredInvoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DOCTORS')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 transition border-b-2 ${
              activeTab === 'DOCTORS'
                ? 'text-sky-400 border-sky-500 bg-sky-500/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Báo Cáo Bác Sĩ & Hoa Hồng ({doctorStats.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DAILY_REPORT')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 transition border-b-2 ${
              activeTab === 'DAILY_REPORT'
                ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Báo Cáo Tổng Kết Ca / Cuối Ngày</span>
          </button>
        </div>

        {/* THẺ DASHBOARD KPIS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-slate-950/40 border-b border-slate-800/80 text-xs shrink-0">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Tổng thực thu</p>
              <p className="text-base lg:text-lg font-black text-amber-400 font-mono mt-0.5">
                {kpis.totalFinal.toLocaleString('vi-VN')} đ
              </p>
            </div>
            <DollarSign className="w-5 h-5 text-amber-400/80" />
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Tổng giảm giá</p>
              <p className="text-base lg:text-lg font-black text-rose-400 font-mono mt-0.5">
                {kpis.totalDiscount.toLocaleString('vi-VN')} đ
              </p>
            </div>
            <Percent className="w-5 h-5 text-rose-400/80" />
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Số ca thu viện phí</p>
              <p className="text-base lg:text-lg font-black text-white font-mono mt-0.5">
                {kpis.count} lượt
              </p>
            </div>
            <Users className="w-5 h-5 text-sky-400/80" />
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-slate-400 font-medium text-[11px]">TB / Lượt (AOV)</p>
              <p className="text-base lg:text-lg font-black text-emerald-400 font-mono mt-0.5">
                {kpis.aov.toLocaleString('vi-VN')} đ
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400/80" />
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 flex flex-col justify-between col-span-2 lg:col-span-1">
            <span className="text-[10.5px] font-bold text-slate-400">Cơ cấu thanh toán:</span>
            <div className="flex flex-col space-y-0.5 font-mono text-[10.5px]">
              <span className="text-slate-300">TM: <strong className="text-white">{kpis.cashTotal.toLocaleString('vi-VN')}</strong></span>
              <span className="text-indigo-300">QR: <strong className="text-white">{kpis.vietQrTotal.toLocaleString('vi-VN')}</strong></span>
            </div>
          </div>
        </div>

        {/* BỘ LỌC ĐA NĂNG (DÙNG CHUNG CHO CÁC TAB) */}
        <div className="p-3.5 bg-slate-900 border-b border-slate-800 space-y-2 shrink-0 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            {/* Tìm kiếm */}
            <div className="sm:col-span-4 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã HĐ, tên BN, mã BN, SĐT, Bác sĩ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
              />
            </div>

            {/* Lọc thời gian */}
            <div className="sm:col-span-3">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
              >
                <option value="ALL">Mọi thời gian</option>
                <option value="TODAY">Hôm nay</option>
                <option value="YESTERDAY">Hôm qua</option>
                <option value="LAST_7_DAYS">7 ngày qua</option>
                <option value="THIS_MONTH">Tháng này</option>
                <option value="LAST_MONTH">Tháng trước</option>
                <option value="CUSTOM">Tùy chọn ngày...</option>
              </select>
            </div>

            {/* Lọc Bác sĩ */}
            <div className="sm:col-span-3">
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
              >
                <option value="ALL">Tất cả bác sĩ chỉ định</option>
                {doctorsList.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc Hình thức thanh toán */}
            <div className="sm:col-span-2">
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
              >
                <option value="ALL">Tất cả PT thanh toán</option>
                <option value="Tiền mặt">Tiền mặt</option>
                <option value="Chuyển khoản (VietQR)">VietQR</option>
                <option value="Quẹt thẻ">Quẹt thẻ POS</option>
              </select>
            </div>
          </div>

          {/* Dòng tùy chọn ngày nếu chọn CUSTOM */}
          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-slate-400 font-semibold">Từ ngày:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
              />
              <span className="text-slate-400 font-semibold">Đến ngày:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
              />
            </div>
          )}
        </div>

        {/* NỘI DUNG TỪNG TAB */}
        <div className="flex-1 overflow-y-auto p-4 text-xs">
          
          {/* ══════════════ TAB 1: SỔ SÁCH HÓA ĐƠN ══════════════ */}
          {activeTab === 'INVOICES' && (
            <div>
              {filteredInvoices.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <AlertCircle className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold">Không tìm thấy hóa đơn nào phù hợp với bộ lọc!</p>
                  <p className="text-xs text-slate-500">Hãy thử chọn "Mọi thời gian" hoặc xóa từ khóa tìm kiếm</p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
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
                              {new Date(inv.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </td>

                          <td className="p-2.5">
                            <strong className="text-white uppercase font-bold block">{inv.patientName}</strong>
                            <span className="font-mono text-[10.5px] text-slate-400">{inv.patientCode || '---'} • {inv.patientPhone || ''}</span>
                          </td>

                          <td className="p-2.5">
                            <span className="font-semibold text-slate-200 block">{inv.doctorName || '---'}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700">
                              {inv.packageName || 'Tùy chọn'}
                            </span>
                          </td>

                          <td className="p-2.5 font-mono text-slate-300">
                            {inv.items.length} dịch vụ
                          </td>

                          <td className="p-2.5">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              inv.paymentMethod === 'Chuyển khoản (VietQR)'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : inv.paymentMethod === 'Tiền mặt'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}>
                              {inv.paymentMethod}
                            </span>
                          </td>

                          <td className="p-2.5 text-right font-mono text-rose-400 font-semibold">
                            {(inv.discountAmount || 0) > 0 ? `-${inv.discountAmount?.toLocaleString('vi-VN')} đ` : '0 đ'}
                          </td>

                          <td className="p-2.5 text-right font-mono font-bold text-emerald-400 text-xs">
                            {inv.finalAmount.toLocaleString('vi-VN')} đ
                          </td>

                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Xem & In Biên lai */}
                              <button
                                type="button"
                                onClick={() => setViewingInvoice(inv)}
                                className="p-1.5 bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white rounded-lg transition"
                                title="Xem và in lại Biên lai viện phí"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Xóa Hóa đơn */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Xóa hóa đơn ${inv.code} của bệnh nhân ${inv.patientName}?`)) {
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
              )}
            </div>
          )}

          {/* ══════════════ TAB 2: BÁO CÁO BÁC SĨ & HOA HỒNG ══════════════ */}
          {activeTab === 'DOCTORS' && (
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
                                onChange={(e) => handleCommissionRateChange(stat.doctor.name, Number(e.target.value))}
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
          )}

          {/* ══════════════ TAB 3: BÁO CÁO TỔNG KẾT CA / CUỐI NGÀY ══════════════ */}
          {activeTab === 'DAILY_REPORT' && (
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
                    <h1 className="text-[16px] font-black uppercase text-sky-950">{clinicInfo?.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}</h1>
                    <p className="text-[12px] text-slate-600">ĐC: {clinicInfo?.address}</p>
                    <p className="text-[12px] text-slate-600">Hotline: {clinicInfo?.phone}</p>
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
          )}

        </div>

        {/* FOOTER MODAL */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0 text-xs text-slate-400">
          <div>
            Tổng doanh thu đang hiển thị: <strong className="text-amber-400 font-mono text-sm font-black">{kpis.totalFinal.toLocaleString('vi-VN')} đ</strong> ({filteredInvoices.length} hóa đơn)
          </div>

          <div className="flex items-center space-x-3">
            {invoices.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử hóa đơn trong sổ sách? Hành động này không thể khôi phục!')) {
                    onClearAllInvoices();
                  }
                }}
                className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl font-bold transition"
              >
                Xóa Toàn Bộ Sổ Sách
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>

      </div>

      {/* MODAL POPUP XEM & IN LẠI BIÊN LAI VIỆN PHÍ */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm">Xem Lại Biên Lai Thu Tiền: {viewingInvoice.code}</h4>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-100 flex flex-col items-center">
              <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-300">
                <PrintReceiptView invoice={viewingInvoice} clinicInfo={clinicInfo} />
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs"
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>In Biên Lai</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
