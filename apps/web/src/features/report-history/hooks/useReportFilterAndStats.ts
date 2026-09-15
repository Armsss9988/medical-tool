import { useState, useMemo, useCallback } from 'react';
import { 
  MedicalReport, Invoice, 
  BILLING_STATUS, REPORT_STATUS, DATE_FILTER, DateFilterType,
  DEFAULTS
} from '@domain';
import { ReportKindResolver } from '@domain/valueObjects/ReportKind';

export type PdfStatusFilterType = 'ALL' | 'OUTDATED' | 'LATEST' | 'NOT_EXPORTED';
export type PaymentFilterType = 'ALL' | 'PAID' | 'UNPAID';
export type ReportTypeFilter = 'ALL' | 'STANDARD' | 'ALLERGEN' | 'HYBRID';

export interface ReportFilterStats {
  total: number;
  today: number;
  allergen: number;
  hybrid: number;
  cloud: number;
  outdated: number;
  latest: number;
  notExported: number;
  paidCount: number;
  unpaidCount: number;
}

interface UseReportFilterAndStatsProps {
  reports: MedicalReport[];
  invoices?: Invoice[];
}

export function useReportFilterAndStats({
  reports,
  invoices = []
}: UseReportFilterAndStatsProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<ReportTypeFilter>('ALL');
  const [pdfFilter, setPdfFilter] = useState<PdfStatusFilterType>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>('ALL');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Helper tìm kiếm hóa đơn tương ứng với 1 phiếu xét nghiệm
  const getInvoiceForReport = useCallback((rep: MedicalReport): Invoice | undefined => {
    if (rep.invoiceId) {
      const byId = invoices.find((i) => i.id === rep.invoiceId);
      if (byId) return byId;
    }
    const byReportId = invoices.find((i) => i.reportId === rep.id);
    if (byReportId) return byReportId;

    const patientCode = rep.code?.trim() || rep.patient?.code?.trim();
    if (patientCode && patientCode !== DEFAULTS.PATIENT_CODE_FALLBACK && !patientCode.startsWith('BN-TEMP')) {
      return invoices.find((i) => i.patientCode && i.patientCode.trim() === patientCode);
    }
    return undefined;
  }, [invoices]);

  // Đếm số lượng bộ lọc đang áp dụng
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateFilter !== 'ALL') count++;
    if (selectedDoctor !== 'ALL') count++;
    if (selectedType !== 'ALL') count++;
    if (pdfFilter !== 'ALL') count++;
    if (paymentFilter !== 'ALL') count++;
    return count;
  }, [dateFilter, selectedDoctor, selectedType, pdfFilter, paymentFilter]);

  // Xóa toàn bộ bộ lọc về mặc định
  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setDateFilter('ALL');
    setSelectedDoctor('ALL');
    setSelectedType('ALL');
    setPdfFilter('ALL');
    setPaymentFilter('ALL');
  }, []);

  // 1. Thống kê KPI tổng quan (bao gồm số phiếu PDF Outdated & Tình trạng Thu Phí)
  const stats: ReportFilterStats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayCount = reports.filter((r) => new Date(r.createdAt).toDateString() === todayStr).length;
    const allergenCount = reports.filter((r) => {
      const k = ReportKindResolver.resolve(r.selectedTests);
      return k.type === 'allergen';
    }).length;
    const hybridCount = reports.filter((r) => {
      const k = ReportKindResolver.resolve(r.selectedTests);
      return k.type === 'hybrid';
    }).length;
    const cloudCount = reports.filter((r) => !!r.cloudPdfUrl).length;
    const outdatedCount = reports.filter((r) => r.isPdfOutdated || r.status === REPORT_STATUS.OUTDATED).length;
    const latestCount = reports.filter((r) => !!r.cloudPdfUrl && !r.isPdfOutdated && r.status !== REPORT_STATUS.OUTDATED).length;
    const notExportedCount = reports.filter((r) => !r.cloudPdfUrl).length;
    const paidCount = reports.filter((r) => {
      const inv = getInvoiceForReport(r);
      return Boolean(inv && inv.status === BILLING_STATUS.PAID);
    }).length;
    const unpaidCount = reports.length - paidCount;

    return {
      total: reports.length,
      today: todayCount,
      allergen: allergenCount,
      hybrid: hybridCount,
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

      // Lọc theo Loại phiếu (sử dụng ADT ReportKind khép kín)
      if (selectedType !== 'ALL') {
        const kind = ReportKindResolver.resolve(rep.selectedTests);
        if (selectedType === 'ALLERGEN' && kind.type !== 'allergen') return false;
        if (selectedType === 'STANDARD' && kind.type !== 'clinical') return false;
        if (selectedType === 'HYBRID' && kind.type !== 'hybrid') return false;
      }

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
      const isPaid = Boolean(inv && inv.status === BILLING_STATUS.PAID);
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

  // Lọc nhanh danh sách bảng về đúng các phiếu Outdated
  const handleFilterToOutdated = useCallback((specificCode?: string) => {
    setPdfFilter('OUTDATED');
    setDateFilter(DATE_FILTER.ALL);
    setSelectedDoctor('ALL');
    setSelectedType('ALL');
    setPaymentFilter('ALL');
    setSearchTerm(specificCode || '');
  }, []);

  return {
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
  };
}
