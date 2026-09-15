import { useState, useMemo, useCallback } from 'react';
import {
  X, Trash2, FileSpreadsheet, TrendingUp, Users, AlertTriangle, RefreshCw
} from 'lucide-react';
import { 
  Invoice, Doctor, ClinicInfo, MedicalReport, TestPackage, ToastType,
  DATE_FILTER, DateFilterType, REVENUE_TAB, RevenueTabType,
  getSafeClinicInfo
} from '@domain';
import { exportRevenueExcel } from '@infra/excelService';
import PrintReceiptView from './PrintReceiptView';
import { RevenueFilterBar } from './RevenueFilterBar';
import { RevenueKpiCards } from './RevenueKpiCards';
import { RevenueInvoiceTable } from './RevenueInvoiceTable';
import { RevenuePendingReportsTable } from './RevenuePendingReportsTable';
import { RevenueDoctorTable } from './RevenueDoctorTable';
import { RevenueDailyReportView } from './RevenueDailyReportView';
import { useRevenueCalculations } from '../hooks/useRevenueCalculations';

interface RevenueManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  reports?: MedicalReport[];
  testPackages?: TestPackage[];
  onDeleteInvoice: (id: string) => void;
  onCancelInvoice?: (invoiceId: string) => void;
  onOpenInvoiceForReport?: (report: MedicalReport) => void;
  onClearAllInvoices: () => void;
  doctorsList?: Doctor[];
  clinicInfo?: ClinicInfo;
  showToast?: (message: string, type?: ToastType) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  onRefetch?: () => void;
}

export default function RevenueManagerModal({
  isOpen,
  onClose,
  invoices = [],
  reports = [],
  testPackages = [],
  onDeleteInvoice,
  onCancelInvoice,
  onOpenInvoiceForReport,
  onClearAllInvoices,
  doctorsList = [],
  clinicInfo,
  showToast,
  isLoading = false,
  isFetching = false,
  onRefetch: _onRefetch
}: RevenueManagerModalProps) {
  const safeClinic = getSafeClinicInfo(clinicInfo);
  const [activeTab, setActiveTab] = useState<RevenueTabType>(REVENUE_TAB.INVOICES);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>(DATE_FILTER.ALL);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>(DATE_FILTER.ALL);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(DATE_FILTER.ALL);
  const [selectedStatus, setSelectedStatus] = useState<string>(DATE_FILTER.ALL);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [doctorCommissionRates, setDoctorCommissionRates] = useState<Record<string, number>>({});
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateFilter !== DATE_FILTER.ALL) count++;
    if (selectedDoctor !== DATE_FILTER.ALL) count++;
    if (selectedPaymentMethod !== DATE_FILTER.ALL) count++;
    if (selectedStatus !== DATE_FILTER.ALL) count++;
    return count;
  }, [dateFilter, selectedDoctor, selectedPaymentMethod, selectedStatus]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setDateFilter(DATE_FILTER.ALL);
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedDoctor(DATE_FILTER.ALL);
    setSelectedPaymentMethod(DATE_FILTER.ALL);
    setSelectedStatus(DATE_FILTER.ALL);
  }, []);

  const handleCommissionRateChange = useCallback((docName: string, newRate: number) => {
    setDoctorCommissionRates((prev) => ({
      ...prev,
      [docName]: Math.max(0, Math.min(100, newRate))
    }));
  }, []);

  const {
    filteredInvoices,
    pendingReports,
    getEstimatedFee,
    totalPendingAmount,
    kpis,
    doctorStats
  } = useRevenueCalculations({
    invoices,
    reports,
    testPackages,
    doctorsList,
    searchTerm,
    dateFilter,
    customStartDate,
    customEndDate,
    selectedDoctor,
    selectedPaymentMethod,
    selectedStatus,
    doctorCommissionRates
  });

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[92vh] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER MODAL */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span>Sổ Sách Doanh Thu</span>
                <span className="text-[10px] sm:text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono">
                  {filteredInvoices.length} Hóa Đơn
                </span>
                {isFetching && (
                  <span
                    data-testid="invoices-syncing-badge"
                    className="text-[10px] sm:text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse font-sans"
                  >
                    <RefreshCw className="w-2.5 h-2.5 text-amber-400 animate-spin" />
                    <span>Đang đồng bộ...</span>
                  </span>
                )}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
                Theo dõi viện phí, đối soát doanh số bác sĩ, in phiếu thu & xuất báo cáo tài chính
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xuất File Excel</span>
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

        {/* TAB SWITCHER */}
        <div className="px-4 sm:px-6 pt-3 bg-slate-900/60 border-b border-slate-800 flex items-center space-x-1 sm:space-x-2 shrink-0 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab(REVENUE_TAB.INVOICES)}
            className={`pb-2.5 px-3 font-bold border-b-2 transition flex items-center space-x-1.5 shrink-0 ${
              activeTab === REVENUE_TAB.INVOICES
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Lịch Sử Hóa Đơn ({filteredInvoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(REVENUE_TAB.PENDING_PAYMENT)}
            className={`pb-2.5 px-3 font-bold border-b-2 transition flex items-center space-x-1.5 shrink-0 ${
              activeTab === REVENUE_TAB.PENDING_PAYMENT
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Chờ Thu Phí</span>
            {pendingReports.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black">
                {pendingReports.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(REVENUE_TAB.DOCTORS)}
            className={`pb-2.5 px-3 font-bold border-b-2 transition flex items-center space-x-1.5 shrink-0 ${
              activeTab === REVENUE_TAB.DOCTORS
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Doanh Thu Theo Bác Sĩ ({doctorStats.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(REVENUE_TAB.DAILY_REPORT)}
            className={`pb-2.5 px-3 font-bold border-b-2 transition flex items-center space-x-1.5 shrink-0 ${
              activeTab === REVENUE_TAB.DAILY_REPORT
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Tổng Kết Ca (In A4)</span>
          </button>
        </div>

        {/* THỐNG KÊ NHANH KPI */}
        {activeTab !== REVENUE_TAB.DAILY_REPORT && (
          <RevenueKpiCards
            kpis={kpis}
            totalPendingAmount={totalPendingAmount}
            pendingReports={pendingReports}
            onSelectPendingTab={setActiveTab}
          />
        )}

        {/* BỘ LỌC ĐA NĂNG */}
        <RevenueFilterBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          customStartDate={customStartDate}
          onCustomStartDateChange={setCustomStartDate}
          customEndDate={customEndDate}
          onCustomEndDateChange={setCustomEndDate}
          selectedDoctor={selectedDoctor}
          onSelectedDoctorChange={setSelectedDoctor}
          doctorsList={doctorsList}
          selectedPaymentMethod={selectedPaymentMethod}
          onSelectedPaymentMethodChange={setSelectedPaymentMethod}
          selectedStatus={selectedStatus}
          onSelectedStatusChange={setSelectedStatus}
          isMobileFilterOpen={isMobileFilterOpen}
          onToggleMobileFilter={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
        />

        {/* NỘI DUNG TỪNG TAB */}
        <div className="flex-1 overflow-y-auto p-4 text-xs">
          {activeTab === REVENUE_TAB.INVOICES && (
            <RevenueInvoiceTable
              filteredInvoices={filteredInvoices}
              isLoading={isLoading}
              onViewInvoice={setViewingInvoice}
              onCancelInvoice={onCancelInvoice}
              onDeleteInvoice={onDeleteInvoice}
            />
          )}

          {activeTab === REVENUE_TAB.PENDING_PAYMENT && (
            <RevenuePendingReportsTable
              pendingReports={pendingReports}
              totalPendingAmount={totalPendingAmount}
              isLoading={isLoading}
              getEstimatedFee={getEstimatedFee}
              onOpenInvoiceForReport={onOpenInvoiceForReport}
            />
          )}

          {activeTab === REVENUE_TAB.DOCTORS && (
            <RevenueDoctorTable
              doctorStats={doctorStats}
              onCommissionRateChange={handleCommissionRateChange}
            />
          )}

          {activeTab === REVENUE_TAB.DAILY_REPORT && (
            <RevenueDailyReportView
              safeClinic={safeClinic}
              clinicInfo={clinicInfo}
              dateFilter={dateFilter}
              kpis={kpis}
              doctorStats={doctorStats}
            />
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
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white sm:rounded-2xl shadow-2xl max-w-5xl w-full h-full sm:h-[92vh] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm">Xem Lại Biên Lai Thu Tiền: {viewingInvoice.code}</h4>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 bg-slate-200/90 flex justify-center items-start">
              <div className="bg-white shadow-2xl rounded-xl border border-slate-300 origin-top my-2 scale-[0.85] sm:scale-100">
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
                <Trash2 className="hidden" />
                <span>In Biên Lai</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
