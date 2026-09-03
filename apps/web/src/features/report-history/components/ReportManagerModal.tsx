import { useState, useMemo, useCallback } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  Trash2, 
  Calendar, 
  RotateCcw, 
  Eye, 
  QrCode, 
  Copy, 
  FileSpreadsheet, 
  Sparkles, 
  Clock, 
  AlertCircle,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import { 
  MedicalReport, Doctor, ToastType, Invoice, 
  BILLING_STATUS, REPORT_STATUS, DATE_FILTER, DateFilterType 
} from '@domain';
import { ReportStateMachine } from '@domain/index';
import { exportReportsExcel } from '@infra/excelService';
import { downloadDataUrlAsImage } from '@infra/qrService';

interface ReportManagerModalProps {
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
}

type PdfStatusFilterType = 'ALL' | 'OUTDATED' | 'LATEST' | 'NOT_EXPORTED';
type PaymentFilterType = 'ALL' | 'PAID' | 'UNPAID';
type ReportTypeFilter = 'ALL' | 'STANDARD' | 'ALLERGEN';

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
  showToast
}: ReportManagerModalProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<ReportTypeFilter>('ALL');
  const [pdfFilter, setPdfFilter] = useState<PdfStatusFilterType>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>('ALL');

  // Helper tìm kiếm hóa đơn tương ứng với 1 phiếu xét nghiệm
  const getInvoiceForReport = useCallback((rep: MedicalReport): Invoice | undefined => {
    if (rep.invoiceId) {
      const byId = invoices.find((i) => i.id === rep.invoiceId);
      if (byId) return byId;
    }
    return invoices.find(
      (i) => i.reportId === rep.id || (i.patientCode && (i.patientCode === rep.code || i.patientCode === rep.patient?.code))
    );
  }, [invoices]);

  // 1. Thống kê KPI tổng quan (bao gồm số phiếu PDF Outdated & Tình trạng Thu Phí)
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayCount = reports.filter((r) => new Date(r.createdAt).toDateString() === todayStr).length;
    const allergenCount = reports.filter((r) => r.isAllergen).length;
    const cloudCount = reports.filter((r) => !!r.cloudPdfUrl).length;
    const outdatedCount = reports.filter((r) => r.isPdfOutdated || r.status === REPORT_STATUS.OUTDATED).length;
    const latestCount = reports.filter((r) => !!r.cloudPdfUrl && !r.isPdfOutdated && r.status !== REPORT_STATUS.OUTDATED).length;
    const notExportedCount = reports.filter((r) => !r.cloudPdfUrl).length;
    const paidCount = reports.filter((r) => {
      const inv = getInvoiceForReport(r);
      return Boolean(inv ? inv.status === BILLING_STATUS.PAID : r.patient?.paidAt);
    }).length;
    const unpaidCount = reports.length - paidCount;

    return {
      total: reports.length,
      today: todayCount,
      allergen: allergenCount,
      cloud: cloudCount,
      outdated: outdatedCount,
      latest: latestCount,
      notExported: notExportedCount,
      paidCount,
      unpaidCount
    };
  }, [reports, getInvoiceForReport]);

  // 2. Lọc danh sách phiếu theo các tiêu chí
  const filteredReports = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const now = new Date();
    const todayStr = now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    return reports.filter((rep) => {
      // Tìm kiếm văn bản
      if (term) {
        const matchName = rep.patient.name?.toLowerCase().includes(term);
        const matchCode = rep.code?.toLowerCase().includes(term);
        const matchSample = rep.sampleCode?.toLowerCase().includes(term);
        const matchPhone = rep.patient.phone?.toLowerCase().includes(term);
        const matchDoctor = rep.doctorName?.toLowerCase().includes(term);
        const matchDiagnosis = rep.patient.diagnosis?.toLowerCase().includes(term);
        const matchConclusion = rep.conclusion?.toLowerCase().includes(term);

        if (!matchName && !matchCode && !matchSample && !matchPhone && !matchDoctor && !matchDiagnosis && !matchConclusion) {
          return false;
        }
      }

      // Lọc theo Bác sĩ
      if (selectedDoctor !== DATE_FILTER.ALL && rep.doctorName !== selectedDoctor) {
        return false;
      }

      // Lọc theo Loại phiếu
      if (selectedType === 'ALLERGEN' && !rep.isAllergen) return false;
      if (selectedType === 'STANDARD' && rep.isAllergen) return false;

      // Lọc theo Tình trạng PDF (Outdated / Latest / Not Exported)
      if (pdfFilter === 'OUTDATED' && !rep.isPdfOutdated && rep.status !== REPORT_STATUS.OUTDATED) {
        return false;
      }
      if (pdfFilter === 'LATEST' && (!rep.cloudPdfUrl || rep.isPdfOutdated || rep.status === REPORT_STATUS.OUTDATED)) {
        return false;
      }
      if (pdfFilter === 'NOT_EXPORTED' && !!rep.cloudPdfUrl) {
        return false;
      }

      // Lọc theo Tình trạng Thu Phí
      const inv = getInvoiceForReport(rep);
      const isPaid = Boolean(inv ? inv.status === BILLING_STATUS.PAID : rep.patient?.paidAt);
      if (paymentFilter === 'PAID' && !isPaid) return false;
      if (paymentFilter === 'UNPAID' && isPaid) return false;

      // Lọc theo Thời gian
      const repDate = new Date(rep.createdAt);
      if (dateFilter === DATE_FILTER.TODAY) {
        if (repDate.toDateString() !== todayStr) return false;
      } else if (dateFilter === DATE_FILTER.YESTERDAY) {
        if (repDate.toDateString() !== yesterdayStr) return false;
      } else if (dateFilter === DATE_FILTER.LAST_7_DAYS) {
        if (repDate < sevenDaysAgo) return false;
      } else if (dateFilter === DATE_FILTER.THIS_MONTH) {
        if (repDate.getMonth() !== now.getMonth() || repDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      return true;
    });
  }, [reports, getInvoiceForReport, searchTerm, selectedDoctor, selectedType, pdfFilter, paymentFilter, dateFilter]);

  // 3. Danh sách tất cả các phiếu đang bị Outdated
  const allOutdatedReports = useMemo(() => {
    return reports.filter((r) => r.isPdfOutdated || r.status === REPORT_STATUS.OUTDATED);
  }, [reports]);

  // 4. Xuất toàn bộ phiếu đã lọc ra Excel
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

  // 5. Tải mã QR Code của phiếu đã lưu
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
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Sổ Lưu Phiếu Kết Quả Xét Nghiệm
                <span className="text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  {reports.length} Hồ Sơ
                </span>
                {stats.outdated > 0 && (
                  <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    {stats.outdated} Cần cập nhật PDF
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tra cứu, nạp lại dữ liệu, quản lý trạng thái PDF Cloud, mã QR và xuất báo cáo
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenBatchExportModal && (
              <button
                type="button"
                onClick={onOpenBatchExportModal}
                className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                title="Mở công cụ xuất hoặc nhập hàng loạt từ Excel"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Xuất/Nhập Hàng Loạt</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportFilteredExcel}
              className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
              title="Xuất danh sách đang lọc ra file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xuất Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* THỐNG KÊ KPI CARDS (Bao gồm thẻ PDF Outdated & Thu Phí) */}
        <div className="flex overflow-x-auto no-scrollbar touch-pan-x sm:grid sm:grid-cols-6 gap-2 sm:gap-2.5 p-3 sm:p-4 bg-slate-950/50 border-b border-slate-800 shrink-0 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 sm:p-3 flex items-center justify-between shrink-0 min-w-[130px] sm:min-w-0">
            <div>
              <span className="text-[10.5px] sm:text-[11px] text-slate-400 block font-medium">Tổng số phiếu</span>
              <strong className="text-base font-extrabold text-white font-mono">{stats.total}</strong>
            </div>
            <FileText className="w-5 h-5 text-sky-400/80" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Phiếu hôm nay</span>
              <strong className="text-base font-extrabold text-emerald-400 font-mono">{stats.today}</strong>
            </div>
            <Clock className="w-5 h-5 text-emerald-400/80" />
          </div>

          {/* KPI: Đã Thu Phí */}
          <div 
            onClick={() => setPaymentFilter(paymentFilter === 'PAID' ? 'ALL' : 'PAID')}
            className={`bg-slate-900 border rounded-xl p-3 flex items-center justify-between cursor-pointer transition ${
              paymentFilter === 'PAID' 
                ? 'border-emerald-500 bg-emerald-950/30' 
                : 'border-slate-800 hover:border-emerald-500/50'
            }`}
            title="Click để lọc các phiếu đã thu phí"
          >
            <div>
              <span className="text-[11px] text-emerald-400 block font-medium flex items-center gap-1">
                <span>Đã thu phí</span>
                {paymentFilter === 'PAID' && <span className="text-[9px] bg-emerald-400 text-slate-950 px-1 rounded font-black">Lọc</span>}
              </span>
              <strong className="text-base font-extrabold text-emerald-400 font-mono">{stats.paidCount}</strong>
            </div>
            <CreditCard className="w-5 h-5 text-emerald-400/80" />
          </div>

          {/* KPI: Chưa Thu Phí */}
          <div 
            onClick={() => setPaymentFilter(paymentFilter === 'UNPAID' ? 'ALL' : 'UNPAID')}
            className={`bg-slate-900 border rounded-xl p-3 flex items-center justify-between cursor-pointer transition ${
              paymentFilter === 'UNPAID' 
                ? 'border-amber-500 bg-amber-950/30' 
                : 'border-slate-800 hover:border-amber-500/50'
            }`}
            title="Click để lọc các phiếu chưa thu tiền"
          >
            <div>
              <span className="text-[11px] text-amber-400 block font-medium flex items-center gap-1">
                <span>Chưa thu phí</span>
                {paymentFilter === 'UNPAID' && <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black">Lọc</span>}
              </span>
              <strong className="text-base font-extrabold text-amber-400 font-mono">{stats.unpaidCount}</strong>
            </div>
            <Clock className="w-5 h-5 text-amber-400/80" />
          </div>

          {/* KPI: PDF Lỗi Thời (Outdated) */}
          <div 
            onClick={() => setPdfFilter(pdfFilter === 'OUTDATED' ? 'ALL' : 'OUTDATED')}
            className={`bg-slate-900 border rounded-xl p-3 flex items-center justify-between cursor-pointer transition ${
              stats.outdated > 0 
                ? 'border-amber-500/50 hover:bg-amber-950/20' 
                : 'border-slate-800 opacity-80'
            }`}
            title="Click để lọc các phiếu cần cập nhật lại PDF"
          >
            <div>
              <span className="text-[11px] text-amber-400 block font-medium flex items-center gap-1">
                <span>PDF lỗi thời</span>
                {pdfFilter === 'OUTDATED' && <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black">Lọc</span>}
              </span>
              <strong className="text-base font-extrabold text-amber-400 font-mono">{stats.outdated}</strong>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-400/90" />
          </div>

          <div 
            onClick={() => setPdfFilter(pdfFilter === 'LATEST' ? 'ALL' : 'LATEST')}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3 flex items-center justify-between cursor-pointer transition"
            title="Click để lọc các phiếu đã xuất PDF mới nhất"
          >
            <div>
              <span className="text-[11px] text-emerald-400 block font-medium flex items-center gap-1">
                <span>PDF Mới</span>
                {pdfFilter === 'LATEST' && <span className="text-[9px] bg-emerald-400 text-slate-950 px-1 rounded font-black">Lọc</span>}
              </span>
              <strong className="text-base font-extrabold text-emerald-400 font-mono">{stats.latest}</strong>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400/80" />
          </div>
        </div>

        {/* BỘ LỌC TÌM KIẾM & PHÂN LOẠI */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3 shrink-0 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Ô tìm kiếm từ khóa */}
            <div className="sm:col-span-3 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm họ tên, mã BN, SĐT, kết luận..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-medium"
              />
            </div>

            {/* Lọc thời gian */}
            <div className="sm:col-span-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="ALL">Mọi thời gian</option>
                <option value="TODAY">Hôm nay</option>
                <option value="YESTERDAY">Hôm qua</option>
                <option value="LAST_7_DAYS">7 ngày qua</option>
                <option value="THIS_MONTH">Tháng này</option>
              </select>
            </div>

            {/* Lọc loại phiếu */}
            <div className="sm:col-span-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ReportTypeFilter)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="ALL">Tất cả loại phiếu</option>
                <option value="STANDARD">Phiếu thường</option>
                <option value="ALLERGEN">Phiếu Dị nguyên</option>
              </select>
            </div>

            {/* Lọc Bác sĩ */}
            <div className="sm:col-span-2">
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="ALL">Tất cả bác sĩ</option>
                {doctorsList.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc Tình trạng Thu Phí */}
            <div className="sm:col-span-1.5">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as PaymentFilterType)}
                className="w-full px-2.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="ALL">Thu phí (Tất cả)</option>
                <option value="PAID">💳 Đã thu tiền ({stats.paidCount})</option>
                <option value="UNPAID">⏳ Chưa thu ({stats.unpaidCount})</option>
              </select>
            </div>

            {/* Lọc Tình trạng PDF */}
            <div className="sm:col-span-1.5">
              <select
                value={pdfFilter}
                onChange={(e) => setPdfFilter(e.target.value as PdfStatusFilterType)}
                className="w-full px-2.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="ALL">PDF (Tất cả)</option>
                <option value="OUTDATED">⚠️ Cần cập nhật ({stats.outdated})</option>
                <option value="LATEST">✅ PDF Mới</option>
                <option value="NOT_EXPORTED">⏳ Chưa xuất</option>
              </select>
            </div>
          </div>
        </div>

        {/* ═══ BULK OUTDATED ACTION BANNER ═══ */}
        {allOutdatedReports.length > 0 && (
          <div className="px-6 py-2.5 bg-amber-950/60 border-b border-amber-500/30 flex items-center justify-between shrink-0 text-xs">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-amber-200 font-medium">
                Phát hiện <strong className="text-amber-300 font-bold">{allOutdatedReports.length}</strong> phiếu có dữ liệu thay đổi sau khi xuất PDF.
              </span>
            </div>
            {onBatchUpdateOutdatedReports && (
              <button
                type="button"
                onClick={() => onBatchUpdateOutdatedReports(allOutdatedReports)}
                disabled={isUpdatingPdf}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg transition active:scale-95 flex items-center space-x-1 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingPdf ? 'animate-spin' : ''}`} />
                <span>⚡ Cập Nhật PDF Cho {allOutdatedReports.length} Phiếu Này</span>
              </button>
            )}
          </div>
        )}

        {/* DANH SÁCH BẢNG HỒ SƠ PHIẾU XÉT NGHIỆM */}
        <div className="flex-1 overflow-y-auto p-4 text-xs">
          {filteredReports.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">Không tìm thấy phiếu xét nghiệm nào phù hợp với bộ lọc!</p>
              <p className="text-xs text-slate-500">Hãy thử xóa từ khóa tìm kiếm hoặc chọn "Mọi thời gian"</p>
            </div>
          ) : (
            <>
              {/* ═══ DESKTOP TABLE VIEW (≥ md) ═══ */}
              <div className="hidden md:block border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800 text-slate-200 font-bold border-b border-slate-700">
                  <tr>
                    <th className="p-3 w-10 text-center">STT</th>
                    <th className="p-3">Mã Phiếu & Thời Gian</th>
                    <th className="p-3">Bệnh Nhân & Năm Sinh</th>
                    <th className="p-3">Số ĐT & Địa Chỉ</th>
                    <th className="p-3">Bác Sĩ & Loại Phiếu</th>
                    <th className="p-3 text-center">Số Chỉ Số</th>
                    <th className="p-3">Thu Phí & Doanh Thu</th>
                    <th className="p-3">Tình Trạng PDF</th>
                    <th className="p-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {filteredReports.map((rep, idx) => {
                    const isAllergen = rep.isAllergen;
                    const inv = getInvoiceForReport(rep);
                    const isPaid = Boolean(inv ? inv.status === 'Đã thanh toán' : rep.patient?.paidAt);
                    const { clinical, document, billing } = ReportStateMachine.computeSummary(rep, isPaid);
                    const isOutdated = document.isOutdated();
                    const versionStr = rep.pdfVersion ? `v${rep.pdfVersion}` : 'v1';

                    return (
                      <tr key={rep.id} className={`hover:bg-slate-800/40 transition-colors ${isOutdated ? 'bg-amber-950/20' : ''}`}>
                        <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>

                        {/* Mã phiếu & Ngày giờ */}
                        <td className="p-3">
                          <span className="font-mono font-bold text-sky-400 block">{rep.code}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {new Date(rep.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </td>

                        {/* Bệnh nhân */}
                        <td className="p-3">
                          <strong className="text-white text-xs block uppercase font-bold">
                            {rep.patient.name || '---'}
                          </strong>
                          <span className="text-[11px] text-slate-400">
                            {rep.patient.dob || '---'} • {rep.patient.gender}
                          </span>
                        </td>

                        {/* Số ĐT & Địa chỉ */}
                        <td className="p-3 max-w-[180px]">
                          <span className="font-mono text-slate-300 block">{rep.patient.phone || '---'}</span>
                          <span className="text-[10.5px] text-slate-400 truncate block mt-0.5" title={rep.patient.address}>
                            {rep.patient.address || 'Quảng Bình'}
                          </span>
                        </td>

                        {/* Bác sĩ, Tiến trình & Loại phiếu */}
                        <td className="p-3">
                          <span className="font-semibold text-slate-200 block">{rep.doctorName || 'BS. Trần Hoài Long'}</span>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span
                              className={`inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                isAllergen
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              }`}
                            >
                              {isAllergen ? 'Dị Nguyên' : 'Xét Nghiệm'}
                            </span>
                            <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${clinical.getBadgeStyle().bg} ${clinical.getBadgeStyle().text} ${clinical.getBadgeStyle().border}`}>
                              {clinical.label()}
                            </span>
                          </div>
                        </td>

                        {/* Số lượng chỉ số */}
                        <td className="p-3 text-center font-mono font-bold text-slate-300">
                          {rep.testCount || rep.selectedTests.length}
                        </td>

                        {/* Thu Phí & Hóa Đơn */}
                        <td className="p-3">
                          {inv ? (
                            <div className="space-y-0.5">
                              <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md border ${billing.getBadgeStyle().bg} ${billing.getBadgeStyle().text} ${billing.getBadgeStyle().border}`}>
                                <CreditCard className="w-3 h-3 text-emerald-400" />
                                <span>{billing.label()} ({(inv.finalAmount ?? 0).toLocaleString('vi-VN')} đ)</span>
                              </span>
                              <span className="block font-mono text-[9.5px] text-slate-400">{inv.code}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${billing.getBadgeStyle().bg} ${billing.getBadgeStyle().text} ${billing.getBadgeStyle().border}`}>
                                <span>{billing.label()}</span>
                              </span>
                              {onOpenInvoiceForReport && (
                                <button
                                  type="button"
                                  onClick={() => onOpenInvoiceForReport(rep)}
                                  className="px-2 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-[10px] font-bold shadow-sm transition active:scale-95 flex items-center gap-0.5"
                                  title="Tạo hóa đơn & thu phí cho phiếu này"
                                >
                                  <CreditCard className="w-2.5 h-2.5" />
                                  <span>Thu</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Tình Trạng PDF & Version */}
                        <td className="p-3">
                          {document.isOutdated() ? (
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md border ${document.getBadgeStyle().bg} ${document.getBadgeStyle().text} ${document.getBadgeStyle().border}`}>
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                <span>{document.label()} ({versionStr})</span>
                              </span>
                              <span className="block text-[9.5px] text-amber-400/80">Dữ liệu đã sửa đổi</span>
                            </div>
                          ) : document.isSynced() ? (
                            <div className="space-y-0.5">
                              <span className={`inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md border ${document.getBadgeStyle().bg} ${document.getBadgeStyle().text} ${document.getBadgeStyle().border}`}>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>{document.label()} ({versionStr})</span>
                              </span>
                              <span className="block text-[9.5px] text-slate-400">Khớp Cloud 100%</span>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md border ${document.getBadgeStyle().bg} ${document.getBadgeStyle().text} ${document.getBadgeStyle().border}`}>
                              <span>{document.label()}</span>
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Nút Cập Nhật PDF 1-Click (Khi phiếu bị Outdated) */}
                            {isOutdated && onUpdateSingleReportPdf && (
                              <button
                                type="button"
                                onClick={() => onUpdateSingleReportPdf(rep)}
                                disabled={isUpdatingPdf}
                                className="p-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-lg transition"
                                title="Cập nhật và xuất lại file PDF lên Cloud cho phiếu này"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingPdf ? 'animate-spin' : ''}`} />
                              </button>
                            )}

                            {/* Nút Xem trước A4 */}
                            <button
                              type="button"
                              onClick={() => onPreviewReport(rep)}
                              className="p-1.5 bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white rounded-lg transition"
                              title="Xem trước mẫu in A4"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Nạp lại lên Form */}
                            <button
                              type="button"
                              onClick={() => onLoadReport(rep)}
                              className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg transition"
                              title="Nạp phiếu này lên màn hình làm việc"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Nhân bản danh mục */}
                            <button
                              type="button"
                              onClick={() => onDuplicateReport(rep)}
                              className="p-1.5 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg transition"
                              title="Nhân bản danh mục chỉ số cho bệnh nhân mới"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Gửi Zalo */}
                            {onOpenSendZaloModal && (
                              <button
                                type="button"
                                onClick={() => onOpenSendZaloModal(rep)}
                                className="p-1.5 bg-slate-800 hover:bg-[#0068FF] text-slate-300 hover:text-white rounded-lg transition"
                                title="Gửi kết quả qua Zalo cho bệnh nhân"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Nút Tải QR Code */}
                            {rep.qrCodeDataUrl && (
                              <button
                                type="button"
                                onClick={() => handleDownloadQr(rep)}
                                className="p-1.5 bg-slate-800 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg transition"
                                title="Tải ảnh QR Code tra cứu kết quả"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Nút Xóa phiếu */}
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Bạn có chắc chắn muốn xóa phiếu xét nghiệm của bệnh nhân [${rep.patient?.name || rep.code}] khỏi Sổ lưu và Cloud?`
                                  )
                                ) {
                                  onDeleteReport(rep.id);
                                }
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition"
                              title="Xóa phiếu này khỏi Sổ lưu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ═══ MOBILE CARDS VIEW (< md) ═══ */}
            <div className="md:hidden space-y-2.5">
              {filteredReports.map((rep) => {
                const isAllergen = rep.isAllergen;
                const inv = getInvoiceForReport(rep);
                const isPaid = Boolean(inv ? inv.status === 'Đã thanh toán' : rep.patient?.paidAt);
                const { clinical, document, billing } = ReportStateMachine.computeSummary(rep, isPaid);
                const isOutdated = document.isOutdated();
                const versionStr = rep.pdfVersion ? `v${rep.pdfVersion}` : 'v1';

                return (
                  <div
                    key={`mob_rep_${rep.id}`}
                    className={`p-3.5 bg-slate-900 border rounded-2xl shadow-sm transition-all ${
                      isOutdated ? 'border-amber-500/60 bg-amber-950/20' : 'border-slate-800'
                    }`}
                  >
                    {/* Header: Mã phiếu, ngày giờ, loại phiếu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-sky-400">{rep.code}</span>
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                              isAllergen
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {isAllergen ? 'Dị Nguyên' : 'Xét Nghiệm'}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${clinical.getBadgeStyle().bg} ${clinical.getBadgeStyle().text} ${clinical.getBadgeStyle().border}`}>
                            {clinical.label()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white uppercase mt-1 truncate">
                          {rep.patient.name || '---'}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {rep.patient.dob || '---'} • {rep.patient.gender} • {rep.patient.phone || 'Không SĐT'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {new Date(rep.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(rep.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Dải trạng thái: Viện phí & PDF */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 flex-wrap text-[10.5px]">
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md border ${billing.getBadgeStyle().bg} ${billing.getBadgeStyle().text} ${billing.getBadgeStyle().border}`}>
                        <CreditCard className="w-3 h-3" />
                        <span>{billing.label()} {inv?.finalAmount ? `(${(inv.finalAmount).toLocaleString('vi-VN')} đ)` : ''}</span>
                      </span>

                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md border ${document.getBadgeStyle().bg} ${document.getBadgeStyle().text} ${document.getBadgeStyle().border}`}>
                        {isOutdated ? <AlertTriangle className="w-3 h-3 text-amber-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        <span>{document.label()} ({versionStr})</span>
                      </span>
                    </div>

                    {/* Dải nút hành động cảm ứng trên mobile */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => onLoadReport(rep)}
                        className="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow transition active:scale-[0.98] cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Nạp Phiếu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onPreviewReport(rep)}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-slate-700 transition active:scale-95 cursor-pointer"
                        title="Xem trước mẫu in A4"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>Xem</span>
                      </button>

                      {onOpenSendZaloModal && (
                        <button
                          type="button"
                          onClick={() => onOpenSendZaloModal(rep)}
                          className="p-2 bg-[#0068FF]/20 hover:bg-[#0068FF] text-[#0068FF] hover:text-white rounded-xl border border-blue-500/30 transition active:scale-95 cursor-pointer"
                          title="Gửi Zalo"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}

                      {isOutdated && onUpdateSingleReportPdf && (
                        <button
                          type="button"
                          onClick={() => onUpdateSingleReportPdf(rep)}
                          disabled={isUpdatingPdf}
                          className="p-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded-xl border border-amber-500/40 transition active:scale-95 cursor-pointer"
                          title="Cập nhật PDF"
                        >
                          <RefreshCw className={`w-4 h-4 ${isUpdatingPdf ? 'animate-spin' : ''}`} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Bạn có chắc chắn muốn xóa phiếu xét nghiệm của bệnh nhân [${rep.patient?.name || rep.code}]?`
                            )
                          ) {
                            onDeleteReport(rep.id);
                          }
                        }}
                        className="p-2 bg-rose-950/40 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-rose-800/40 transition active:scale-95 cursor-pointer"
                        title="Xóa phiếu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        </div>

        {/* FOOTER MODAL */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0 text-xs text-slate-400">
          <div>
            Hiển thị <strong className="text-white font-mono">{filteredReports.length}</strong> / {reports.length} hồ sơ phiếu xét nghiệm
          </div>

          <div className="flex items-center space-x-3">
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
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl font-bold transition"
              >
                Xóa Toàn Bộ Sổ Lưu
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
