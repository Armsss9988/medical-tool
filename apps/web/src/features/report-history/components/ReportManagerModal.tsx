import { useState } from 'react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  Sparkles, 
  AlertCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { 
  MedicalReport, Doctor, ToastType, Invoice
} from '@domain';
import { exportReportsExcel } from '@infra/excelService';
import { downloadDataUrlAsImage } from '@infra/qrService';
import { ReportTableSkeleton } from './ReportTableSkeleton';
import { useReportFilterAndStats } from '../hooks/useReportFilterAndStats';
import { ReportKpiBanner } from './ReportKpiBanner';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportOutdatedAlertBanner } from './ReportOutdatedAlertBanner';
import { ReportHistoryTable } from './ReportHistoryTable';
import { ReportHistoryMobileList } from './ReportHistoryMobileList';
import { ReportActionSheet } from './ReportActionSheet';

export interface ReportManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: MedicalReport[];
  invoices?: Invoice[];
  doctorsList?: Doctor[];
  onLoadReport: (report: MedicalReport) => void;
  onPreviewReport: (report: MedicalReport) => void;
  onDuplicateReport: (report: MedicalReport) => void;
  onOpenSendZaloModal?: (report: MedicalReport) => void;
  onOpenBatchExportModal?: () => void;
  onUpdateSingleReportPdf?: (report: MedicalReport) => void;
  onBatchUpdateOutdatedReports?: (reports: MedicalReport[]) => void;
  onOpenInvoiceForReport?: (report: MedicalReport) => void;
  isUpdatingPdf?: boolean;
  onDeleteReport: (id: string) => void;
  onClearAllReports: () => void;
  showToast: (message: string, type?: ToastType) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  onRefetch?: () => void;
}

export default function ReportManagerModal({
  isOpen,
  onClose,
  reports,
  invoices = [],
  doctorsList = [],
  onLoadReport,
  onPreviewReport,
  onDuplicateReport,
  onOpenSendZaloModal,
  onOpenBatchExportModal,
  onUpdateSingleReportPdf,
  onBatchUpdateOutdatedReports,
  onOpenInvoiceForReport,
  isUpdatingPdf = false,
  onDeleteReport,
  onClearAllReports,
  showToast,
  isLoading = false,
  isFetching = false,
  onRefetch
}: ReportManagerModalProps) {
  const [activeActionSheetReport, setActiveActionSheetReport] = useState<MedicalReport | null>(null);

  const {
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    selectedDoctor,
    setSelectedDoctor,
    selectedType,
    setSelectedType,
    pdfFilter,
    setPdfFilter,
    paymentFilter,
    setPaymentFilter,
    isMobileFilterOpen,
    setIsMobileFilterOpen,
    activeFilterCount,
    handleResetFilters,
    getInvoiceForReport,
    stats,
    filteredReports,
    allOutdatedReports,
    handleFilterToOutdated
  } = useReportFilterAndStats({ reports, invoices });

  // Xuất toàn bộ phiếu đã lọc ra Excel
  const handleExportFilteredExcel = async () => {
    if (filteredReports.length === 0) {
      showToast('Không có dữ liệu phiếu xét nghiệm để xuất Excel!', 'error');
      return;
    }
    try {
      showToast('Đang tạo file Excel danh sách phiếu xét nghiệm...', 'info');
      await exportReportsExcel(filteredReports);
      showToast(`Đã xuất thành công ${filteredReports.length} phiếu ra Excel!`, 'success');
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
      showToast('Đã xảy ra lỗi khi xuất file Excel!', 'error');
    }
  };

  // Tải mã QR Code của phiếu đã lưu
  const handleDownloadQr = (rep: MedicalReport) => {
    if (!rep.qrCodeDataUrl) {
      showToast('Phiếu này chưa được tải lên Cloud hoặc chưa có mã QR!', 'error');
      return;
    }
    const safeName = (rep.patient.name || 'BenhNhan').replace(/\s+/g, '_');
    const qrFilename = `QRCode_PhieuKham_${safeName}_${rep.code}.png`;
    downloadDataUrlAsImage(rep.qrCodeDataUrl, qrFilename);
    showToast('Đã tải ảnh mã QR Code về máy!', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[92vh] flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-200">
        
        {/* HEADER MODAL */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span>Sổ Lưu Phiếu Xét Nghiệm</span>
                <span className="text-[10px] sm:text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  {reports.length} Hồ Sơ
                </span>
                {stats.outdated > 0 && (
                  <span className="text-[10px] sm:text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>{stats.outdated} Cần cập nhật PDF</span>
                  </span>
                )}
                {isFetching && (
                  <span
                    data-testid="reports-syncing-badge"
                    className="text-[10px] sm:text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse"
                  >
                    <RefreshCw className="w-2.5 h-2.5 text-sky-400 animate-spin" />
                    <span>Đang đồng bộ...</span>
                  </span>
                )}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">
                Tra cứu, nạp lại dữ liệu, quản lý trạng thái PDF Cloud, mã QR và xuất báo cáo
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {onOpenBatchExportModal && (
              <button
                type="button"
                onClick={onOpenBatchExportModal}
                className="p-2 sm:px-3 sm:py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                title="Mở công cụ xuất hoặc nhập hàng loạt từ Excel"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Xuất/Nhập Hàng Loạt</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportFilteredExcel}
              className="p-2 sm:px-3 sm:py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              title="Xuất danh sách đang lọc ra file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>

            {onRefetch && (
              <button
                type="button"
                onClick={onRefetch}
                disabled={isFetching}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-xl transition disabled:opacity-50 cursor-pointer"
                title="Tải lại dữ liệu phiếu từ máy chủ"
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isFetching ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* THỐNG KÊ KPI CARDS */}
        <ReportKpiBanner
          stats={stats}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          pdfFilter={pdfFilter}
          setPdfFilter={setPdfFilter}
        />

        {/* BỘ LỌC TÌM KIẾM & PHÂN LOẠI */}
        <ReportFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedDoctor={selectedDoctor}
          setSelectedDoctor={setSelectedDoctor}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          pdfFilter={pdfFilter}
          setPdfFilter={setPdfFilter}
          doctorsList={doctorsList}
          stats={stats}
          isMobileFilterOpen={isMobileFilterOpen}
          setIsMobileFilterOpen={setIsMobileFilterOpen}
          activeFilterCount={activeFilterCount}
          handleResetFilters={handleResetFilters}
        />

        {/* BULK OUTDATED ACTION BANNER */}
        <ReportOutdatedAlertBanner
          allOutdatedReports={allOutdatedReports}
          onFilterToOutdated={handleFilterToOutdated}
          onPreviewReport={onPreviewReport}
          onLoadReport={onLoadReport}
          onUpdateSingleReportPdf={onUpdateSingleReportPdf}
          onBatchUpdateOutdatedReports={onBatchUpdateOutdatedReports}
          isUpdatingPdf={isUpdatingPdf}
        />

        {/* DANH SÁCH BẢNG HỒ SƠ PHIẾU XÉT NGHIỆM */}
        <div className="flex-1 overflow-y-auto p-4 text-xs">
          {isLoading ? (
            <ReportTableSkeleton />
          ) : filteredReports.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">Không tìm thấy phiếu xét nghiệm nào phù hợp với bộ lọc!</p>
              <p className="text-xs text-slate-500">Hãy thử xóa từ khóa tìm kiếm hoặc chọn "Mọi thời gian"</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (≥ md) */}
              <ReportHistoryTable
                reports={filteredReports}
                getInvoiceForReport={getInvoiceForReport}
                onLoadReport={onLoadReport}
                onPreviewReport={onPreviewReport}
                onDuplicateReport={onDuplicateReport}
                onOpenSendZaloModal={onOpenSendZaloModal}
                onUpdateSingleReportPdf={onUpdateSingleReportPdf}
                onOpenInvoiceForReport={onOpenInvoiceForReport}
                onDeleteReport={onDeleteReport}
                onDownloadQr={handleDownloadQr}
                isUpdatingPdf={isUpdatingPdf}
              />

              {/* MOBILE CARDS VIEW (< md) */}
              <ReportHistoryMobileList
                reports={filteredReports}
                getInvoiceForReport={getInvoiceForReport}
                onLoadReport={onLoadReport}
                onPreviewReport={onPreviewReport}
                onOpenActionSheet={setActiveActionSheetReport}
              />
            </>
          )}
        </div>

        {/* FOOTER MODAL */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-0 bg-slate-900/90 shrink-0 text-xs text-slate-400">
          <div>
            Hiển thị <strong className="text-white font-mono">{filteredReports.length}</strong> / {reports.length} hồ sơ phiếu xét nghiệm
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
            {reports.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ hồ sơ phiếu xét nghiệm trong Sổ lưu? Thao tác này sẽ xóa vĩnh viễn trên Cloud và không thể hoàn tác!'
                    )
                  ) {
                    onClearAllReports();
                  }
                }}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl font-bold transition text-xs cursor-pointer"
              >
                Xóa Toàn Bộ
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition text-xs cursor-pointer"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>

      </div>

      {/* MOBILE ACTION SHEET DRAWER */}
      <ReportActionSheet
        report={activeActionSheetReport}
        onClose={() => setActiveActionSheetReport(null)}
        onParentModalClose={onClose}
        onLoadReport={onLoadReport}
        onPreviewReport={onPreviewReport}
        onDuplicateReport={onDuplicateReport}
        onOpenSendZaloModal={onOpenSendZaloModal}
        onUpdateSingleReportPdf={onUpdateSingleReportPdf}
        onOpenInvoiceForReport={onOpenInvoiceForReport}
        onDeleteReport={onDeleteReport}
        onDownloadQr={handleDownloadQr}
        isUpdatingPdf={isUpdatingPdf}
      />
    </div>
  );
}
