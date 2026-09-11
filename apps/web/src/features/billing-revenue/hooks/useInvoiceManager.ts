import { useState, useEffect, useRef } from 'react';
import { Invoice, InvoiceStatus, STORAGE_KEYS, BILLING_STATUS, CloudDbConfig, MedicalReport } from '@domain';
import { loadState } from '@infra/storage';
import { syncInvoicesToSupabase, fetchInvoicesFromSupabase, DEFAULT_CLOUD_DB_CONFIG } from '@infra/cloudDbService';
import { postInvoice, deleteInvoiceApi, payInvoice as apiClientPayInvoice, cancelInvoice as apiClientCancelInvoice } from '@infra/apiClient';
import { domainEventBus } from '@domain/events/DomainEventBus';
import {
  INVOICE_EVENT_TYPES,
  REPORT_EVENT_TYPES,
  ReportDeletedPayload
} from '@domain/events/DomainEvent';

export interface UseInvoiceManagerOptions {
  onReportUpdated?: (report: MedicalReport) => void;
}

export function useInvoiceManager(options?: UseInvoiceManagerOptions) {
  // 1. Khởi tạo danh sách hóa đơn
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const invoicesRef = useRef(invoices);
  invoicesRef.current = invoices;

  // 2. Nạp trực tiếp từ Cloud Database (PostgreSQL)
  useEffect(() => {
    async function initInvoices() {
      try {
        const cloudConfig = loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
        if (cloudConfig?.enabled !== false && cloudConfig?.supabaseUrl) {
          const cloudInvoices = await fetchInvoicesFromSupabase(cloudConfig).catch(() => null);
          if (Array.isArray(cloudInvoices)) {
            setInvoices(cloudInvoices);
          }
        }
      } catch (err) {
        console.error('Lỗi khi nạp danh sách hóa đơn từ Cloud DB:', err);
      }
    }
    initInvoices();
  }, []);

  // 4. LẮNG NGHE DOMAIN EVENTS TỪ CÁC THỰC THỂ KHÁC
  useEffect(() => {
    // Khi một phiếu xét nghiệm bị xóa -> Giải phóng reportId trên hóa đơn để không bị ID mồ côi
    const unsubReportDeleted = domainEventBus.subscribe<ReportDeletedPayload>(
      REPORT_EVENT_TYPES.DELETED,
      ({ payload }) => {
        const prev = invoicesRef.current;
        const hasLinked = prev.some((inv) => inv.reportId === payload.reportId);
        if (!hasLinked) return;

        const affectedInvoices: Invoice[] = [];
        const next = prev.map((inv) => {
          if (inv.reportId === payload.reportId) {
            const unlinked = { ...inv, reportId: undefined };
            affectedInvoices.push(unlinked);
            return unlinked;
          }
          return inv;
        });

        invoicesRef.current = next;
        setInvoices(next);

        // Lưu cập nhật các hóa đơn bị ảnh hưởng xuống cơ sở dữ liệu
        for (const unlinkedInv of affectedInvoices) {
          postInvoice(unlinkedInv).catch((err) => {
            console.warn('[useInvoiceManager] Lỗi lưu giải phóng liên kết hóa đơn:', err);
          });
        }
      }
    );

    return () => {
      unsubReportDeleted();
    };
  }, []);

  // Helper: Lưu ngay lập tức và trực tiếp lên Cloud DB
  const syncInvoicesDirectly = (nextList: Invoice[]) => {
    const cloudConfig = loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
    if (cloudConfig?.enabled !== false && cloudConfig?.supabaseUrl) {
      syncInvoicesToSupabase(nextList, cloudConfig).catch((err) =>
        console.warn('[useInvoiceManager] Lỗi lưu trực tiếp hóa đơn lên Cloud:', err)
      );
    }
  };

  // 5. Thêm mới hoặc cập nhật hóa đơn & Phát Domain Events
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
      // Lưu đơn lẻ lên server bên ngoài state updater
      postInvoice(invoice).catch((err) => {
        console.warn('[useInvoiceManager] Lỗi lưu đơn lẻ hóa đơn, fallback:', err);
        syncInvoicesDirectly(next);
      });
    }

    // Phát sự kiện tương ứng với trạng thái hóa đơn
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

  // 6. Xóa 1 hóa đơn & Phát Event
  const deleteInvoice = (id: string) => {
    const prev = invoicesRef.current;
    const deletedInvoice = prev.find((inv) => inv.id === id);
    const next = prev.filter((inv) => inv.id !== id);
    invoicesRef.current = next;
    setInvoices(next);

    // Xóa đơn lẻ trên server bên ngoài state updater
    deleteInvoiceApi(id).catch((err) => {
      console.warn('[useInvoiceManager] Lỗi xóa đơn lẻ hóa đơn, fallback:', err);
      syncInvoicesDirectly(next);
    });

    // Phát Domain Event: INVOICE_DELETED
    domainEventBus.emit(INVOICE_EVENT_TYPES.DELETED, {
      invoiceId: id,
      reportId: deletedInvoice?.reportId
    });
  };

  // 7. Xóa tất cả hóa đơn
  const clearAllInvoices = () => {
    invoicesRef.current = [];
    setInvoices([]);
    syncInvoicesDirectly([]);
  };

  // 8. Cập nhật trạng thái hóa đơn
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
      postInvoice(updatedInv).catch((err) => {
        console.warn('[useInvoiceManager] Lỗi cập nhật trạng thái hóa đơn, fallback:', err);
        syncInvoicesDirectly(next);
      });
    }

    if (updatedInv) {
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

  // 9. Thu tiền hóa đơn qua Backend Command (Transaction)
  const payInvoice = async (
    id: string,
    paymentData: { paymentMethod?: string; cashier?: string; paidAt?: string; discount?: number; invoice?: Invoice }
  ) => {
    try {
      const res = await apiClientPayInvoice(id, paymentData);
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

  // 10. Hủy hóa đơn qua Backend Command (Transaction)
  const cancelInvoice = async (
    id: string,
    cancelData: { reason?: string; cancelledBy?: string }
  ) => {
    try {
      const res = await apiClientCancelInvoice(id, cancelData);
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
    cancelInvoice
  };
}
