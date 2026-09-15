import { useMemo, useCallback } from 'react';
import {
  Invoice,
  Doctor,
  MedicalReport,
  TestPackage,
  BILLING_STATUS,
  PAYMENT_METHOD,
  DATE_FILTER,
  DateFilterType
} from '@domain';
import { computePricingWithPackages } from '@domain/pricing';

export interface UseRevenueCalculationsProps {
  invoices: Invoice[];
  reports: MedicalReport[];
  testPackages: TestPackage[];
  doctorsList: Doctor[];
  searchTerm: string;
  dateFilter: DateFilterType;
  customStartDate: string;
  customEndDate: string;
  selectedDoctor: string;
  selectedPaymentMethod: string;
  selectedStatus: string;
  doctorCommissionRates: Record<string, number>;
}

export function useRevenueCalculations({
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
}: UseRevenueCalculationsProps) {
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

    return (invoices || []).filter((inv) => {
      if (!inv) return false;
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

      if (selectedDoctor !== DATE_FILTER.ALL && inv.doctorName !== selectedDoctor) {
        return false;
      }

      if (selectedPaymentMethod !== DATE_FILTER.ALL && inv.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      if (selectedStatus !== DATE_FILTER.ALL && inv.status !== selectedStatus) {
        return false;
      }

      if (!inv.createdAt) {
        return dateFilter === DATE_FILTER.ALL;
      }
      const invDate = new Date(inv.createdAt);
      if (isNaN(invDate.getTime())) {
        return dateFilter === DATE_FILTER.ALL;
      }
      if (dateFilter === DATE_FILTER.TODAY) {
        if (invDate.toDateString() !== todayStr) return false;
      } else if (dateFilter === DATE_FILTER.YESTERDAY) {
        if (invDate.toDateString() !== yesterdayStr) return false;
      } else if (dateFilter === DATE_FILTER.LAST_7_DAYS) {
        if (invDate < sevenDaysAgo) return false;
      } else if (dateFilter === DATE_FILTER.THIS_MONTH) {
        if (invDate.getMonth() !== now.getMonth() || invDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === DATE_FILTER.LAST_MONTH) {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        if (invDate.getMonth() !== lastMonth || invDate.getFullYear() !== lastMonthYear) return false;
      } else if (dateFilter === DATE_FILTER.CUSTOM) {
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

  // 1.5. DANH SÁCH CÁC PHIẾU XÉT NGHIỆM CHƯA THU TIỀN
  const pendingReports = useMemo(() => {
    return reports.filter((rep) => {
      const isPaid = invoices.some(
        (inv) =>
          inv.status === BILLING_STATUS.PAID &&
          (inv.id === rep.invoiceId || inv.reportId === rep.id)
      );
      if (isPaid) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = rep.patient?.name?.toLowerCase().includes(term);
        const matchCode = rep.code?.toLowerCase().includes(term);
        const matchPhone = rep.patient?.phone?.toLowerCase().includes(term);
        const matchDoc = rep.doctorName?.toLowerCase().includes(term);
        if (!matchName && !matchCode && !matchPhone && !matchDoc) return false;
      }

      if (selectedDoctor !== DATE_FILTER.ALL && rep.doctorName !== selectedDoctor) {
        return false;
      }

      const repDate = new Date(rep.createdAt);
      const now = new Date();
      const todayStr = now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);

      if (dateFilter === DATE_FILTER.TODAY && repDate.toDateString() !== todayStr) return false;
      if (dateFilter === DATE_FILTER.YESTERDAY && repDate.toDateString() !== yesterdayStr) return false;
      if (dateFilter === DATE_FILTER.LAST_7_DAYS && repDate < sevenDaysAgo) return false;
      if (dateFilter === DATE_FILTER.THIS_MONTH && (repDate.getMonth() !== now.getMonth() || repDate.getFullYear() !== now.getFullYear())) return false;
      if (dateFilter === DATE_FILTER.CUSTOM) {
        if (customStartDate && new Date(customStartDate) > repDate) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (repDate > end) return false;
        }
      }

      return true;
    });
  }, [reports, invoices, searchTerm, selectedDoctor, dateFilter, customStartDate, customEndDate]);

  const getEstimatedFee = useCallback((rep: MedicalReport) => {
    if (!rep.selectedTests || rep.selectedTests.length === 0) return 0;
    return computePricingWithPackages(
      rep.selectedTests.map((t) => t.code),
      rep.selectedTests,
      testPackages
    ).total;
  }, [testPackages]);

  const totalPendingAmount = useMemo(() => {
    return pendingReports.reduce((sum, rep) => sum + getEstimatedFee(rep), 0);
  }, [pendingReports, getEstimatedFee]);

  // 2. TÍNH TOÁN CÁC THẺ KPI TÀI CHÍNH
  const kpis = useMemo(() => {
    const paidInvoices = filteredInvoices.filter((i) => i.status === BILLING_STATUS.PAID);
    const totalFinal = paidInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
    const totalRaw = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalDiscount = paidInvoices.reduce((sum, inv) => sum + (inv.discountAmount || 0), 0);
    const count = paidInvoices.length;
    const aov = count > 0 ? Math.round(totalFinal / count) : 0;

    const cashTotal = paidInvoices.filter((i) => i.paymentMethod === PAYMENT_METHOD.CASH).reduce((s, i) => s + (i.finalAmount || 0), 0);
    const vietQrTotal = paidInvoices.filter((i) => i.paymentMethod === PAYMENT_METHOD.BANK_TRANSFER).reduce((s, i) => s + (i.finalAmount || 0), 0);
    const posTotal = paidInvoices.filter((i) => i.paymentMethod === PAYMENT_METHOD.POS_CARD).reduce((s, i) => s + (i.finalAmount || 0), 0);

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
      if (inv.status !== BILLING_STATUS.PAID) return;
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
      const rate = doctorCommissionRates[d.name] ?? 10;
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

  return {
    filteredInvoices,
    pendingReports,
    getEstimatedFee,
    totalPendingAmount,
    kpis,
    doctorStats
  };
}
