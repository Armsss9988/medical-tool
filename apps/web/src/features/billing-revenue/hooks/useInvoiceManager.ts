import { useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Invoice, InvoiceStatus, STORAGE_KEYS, BILLING_STATUS, CloudDbConfig, MedicalReport } from '@domain';
import { loadState, saveState } from '@infra/storage';
import { syncInvoicesToSupabase, DEFAULT_CLOUD_DB_CONFIG } from '@infra/cloudDbService';
import { putTable } from '@infra/apiClient';
import { domainEventBus } from '@domain/events/DomainEventBus';
import { INVOICE_EVENT_TYPES } from '@domain/events/DomainEvent';
import {
  useInvoicesQuery,
  useSaveInvoiceMutation,
  usePayInvoiceMutation,
  useCancelInvoiceMutation,
  useDeleteInvoiceMutation
} from './useInvoicesQuery';
import { INVOICES_QUERY_KEY } from '@infra/queryClient';

export interface UseInvoiceManagerOptions {
  onReportUpdated?: (report: MedicalReport) => void;
}

export function useInvoiceManager(options?: UseInvoiceManagerOptions) {
  // 1. Quản lý danh sách hóa đơn bằng TanStack Query v5 (Server State)
  const { invoices, isLoading, isFetching, isError, refetch } = useInvoicesQuery();
  const qc = useQueryClient();
  const saveMutation = useSaveInvoiceMutation();
  const payMutation = usePayInvoiceMutation();
  const cancelMutation = useCancelInvoiceMutation();
  const deleteMutation = useDeleteInvoiceMutation();

  const invoicesRef = useRef(invoices);
  invoicesRef.current = invoices;

  const setInvoices = useCallback((updater: Invoice[] | ((prev: Invoice[]) => Invoice[])) => {
    qc.setQueryData<Invoice[]>(INVOICES_QUERY_KEY, (prev = []) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      invoicesRef.current = next;
      return next;
    });
  }, [qc]);

  // Helper: Lưu ngay lập tức và trực tiếp lên Cloud DB nếu bật
  const syncInvoicesDirectly = (nextList: Invoice[]) => {
    const cloudConfig = loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
    if (cloudConfig?.enabled !== false && cloudConfig?.supabaseUrl) {
      syncInvoicesToSupabase(nextList, cloudConfig).catch((err) =>
        console.warn('[useInvoiceManager] Lỗi lưu trực tiếp hóa đơn lên Cloud:', err)
      );
    }
  };

  // 2. Thêm mới hoặc cập nhật hóa đơn & Phát Domain Events
  const saveOrUpdateInvoice = (invoice: Invoice, skipRemote: boolean = false): Invoice => {
    const prev = invoicesRef.current;
    const idx = prev.findIndex((inv) => inv.id === invoice.id || (inv.code && inv.code === invoice.code));
    let next: Invoice[];
    if (idx >= 0) {
      next = [...prev];
      next[idx] = { ...invoice };
    } else {
      next = [invoice, ...prev];
    }
    invoicesRef.current = next;
    setInvoices(next);

    if (!skipRemote) {
      saveMutation.mutate(invoice);
    }

    // Phát sự kiện tương ứng với trạng thái hóa đơn cho UI
    if (invoice.status === BILLING_STATUS.PAID) {
      domainEventBus.emit(INVOICE_EVENT_TYPES.PAID, {
        invoice,
        paymentMethod: invoice.paymentMethod,
        paidAt: invoice.paidAt || new Date().toISOString(),
        reportId: invoice.reportId
      });
    } else if (invoice.status === BILLING_STATUS.REFUNDED) {
      domainEventBus.emit(INVOICE_EVENT_TYPES.CANCELLED, {
        invoiceId: invoice.id,
        reportId: invoice.reportId,
        reason: invoice.notes
      });
    } else {
      domainEventBus.emit(INVOICE_EVENT_TYPES.CREATED, { invoice });
    }

    return invoice;
  };

  // 3. Xóa 1 hóa đơn & Phát Event
  const deleteInvoice = (id: string) => {
    const prev = invoicesRef.current;
    const deletedInvoice = prev.find((inv) => inv.id === id);
    const next = prev.filter((inv) => inv.id !== id);
    invoicesRef.current = next;
    setInvoices(next);

    deleteMutation.mutate(id);

    // Phát Domain Event: INVOICE_DELETED
    domainEventBus.emit(INVOICE_EVENT_TYPES.DELETED, {
      invoiceId: id,
      reportId: deletedInvoice?.reportId
    });
  };

  // 4. Xóa tất cả hóa đơn
  const clearAllInvoices = () => {
    invoicesRef.current = [];
    setInvoices([]);
    saveState(STORAGE_KEYS.INVOICES, []);
    putTable('invoices', []).catch((err) => {
      console.warn('[useInvoiceManager] Lỗi xóa sạch invoices trên server:', err);
    });
    syncInvoicesDirectly([]);
  };

  // 5. Cập nhật trạng thái hóa đơn
  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    const prev = invoicesRef.current;
    let updatedInv: Invoice | undefined;
    const next = prev.map((inv) => {
      if (inv.id === id) {
        updatedInv = { ...inv, status };
        return updatedInv;
      }
      return inv;
    });
    invoicesRef.current = next;
    setInvoices(next);

    if (updatedInv) {
      saveMutation.mutate(updatedInv);

      if (status === 'Đã thanh toán') {
        domainEventBus.emit(INVOICE_EVENT_TYPES.PAID, {
          invoice: updatedInv,
          paymentMethod: updatedInv.paymentMethod,
          paidAt: updatedInv.paidAt || new Date().toISOString(),
          reportId: updatedInv.reportId
        });
      } else if (status === 'Đã hủy / Hoàn tiền') {
        domainEventBus.emit(INVOICE_EVENT_TYPES.CANCELLED, {
          invoiceId: updatedInv.id,
          reportId: updatedInv.reportId
        });
      }
    }
  };

  // 6. Thu tiền hóa đơn qua Backend Command (Transaction)
  // Tự động đồng bộ nguyên tử cả Hóa đơn và Phiếu khám qua TanStack Query Invalidation
  const payInvoice = async (
    id: string,
    paymentData: { paymentMethod?: string; cashier?: string; paidAt?: string; discount?: number; invoice?: Invoice }
  ) => {
    try {
      const res = await payMutation.mutateAsync({
        id,
        paymentMethod: paymentData.paymentMethod,
        cashier: paymentData.cashier,
        paidAt: paymentData.paidAt
      });
      if (res.success) {
        if (res.invoice) {
          saveOrUpdateInvoice(res.invoice, true);
        }
        if (res.report && options?.onReportUpdated) {
          options.onReportUpdated(res.report);
        }
      }
      return res;
    } catch (err) {
      console.error('[useInvoiceManager] Lỗi khi thực hiện payInvoice:', err);
      throw err;
    }
  };

  // 7. Hủy hóa đơn qua Backend Command (Transaction)
  const cancelInvoice = async (
    id: string,
    cancelData: { reason?: string; cancelledBy?: string; fallbackInvoice?: Invoice }
  ) => {
    try {
      const res = await cancelMutation.mutateAsync({
        id,
        reason: cancelData.reason,
        cancelledBy: cancelData.cancelledBy,
        fallbackInvoice: cancelData.fallbackInvoice
      });
      if (res.success) {
        if (res.invoice) {
          saveOrUpdateInvoice(res.invoice, true);
        }
        if (res.report && options?.onReportUpdated) {
          options.onReportUpdated(res.report);
        }
      }
      return res;
    } catch (err) {
      console.error('[useInvoiceManager] Lỗi khi thực hiện cancelInvoice:', err);
      throw err;
    }
  };

  return {
    invoices,
    setInvoices,
    saveOrUpdateInvoice,
    deleteInvoice,
    clearAllInvoices,
    updateInvoiceStatus,
    payInvoice,
    cancelInvoice,
    isLoading,
    isFetching,
    isError,
    refetch
  };
}
