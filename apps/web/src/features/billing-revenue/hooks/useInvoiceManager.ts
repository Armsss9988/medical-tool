import { useState, useEffect, useRef } from 'react';
import { Invoice, InvoiceStatus, STORAGE_KEYS, BILLING_STATUS, CloudDbConfig } from '@domain';
import { loadData, saveData, loadState } from '@infra/storage';
import { syncInvoicesToSupabase, fetchInvoicesFromSupabase, DEFAULT_CLOUD_DB_CONFIG } from '@infra/cloudDbService';
import { domainEventBus } from '@domain/events/DomainEventBus';
import {
  INVOICE_EVENT_TYPES,
  REPORT_EVENT_TYPES,
  ReportDeletedPayload
} from '@domain/events/DomainEvent';

export function useInvoiceManager() {
  // 1. Tải danh sách hóa đơn từ storage ngay render đầu tiên
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    return loadState<Invoice[]>(STORAGE_KEYS.INVOICES, []);
  });
  const isLoadedRef = useRef(false);

  // 2. Tải thêm từ storage và Cloud-First từ Supabase
  useEffect(() => {
    async function initInvoices() {
      try {
        const saved = await loadData<Invoice[]>(STORAGE_KEYS.INVOICES, []);
        if (Array.isArray(saved) && saved.length > 0) {
          setInvoices((prev) => {
            const map = new Map<string, Invoice>();
            saved.forEach((i) => { if (i?.id) map.set(i.id, i); });
            prev.forEach((i) => {
              if (i?.id && !map.has(i.id)) {
                map.set(i.id, i);
              }
            });
            return Array.from(map.values());
          });
        }

        // Tải từ Cloud DB nếu có kết nối
        const cloudConfig = loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
        if (cloudConfig?.enabled !== false && cloudConfig?.supabaseUrl) {
          const cloudInvoices = await fetchInvoicesFromSupabase(cloudConfig).catch(() => null);
          if (Array.isArray(cloudInvoices) && cloudInvoices.length > 0) {
            setInvoices((prev) => {
              const map = new Map<string, Invoice>();
              cloudInvoices.forEach((i) => { if (i?.id) map.set(i.id, i); });
              prev.forEach((i) => {
                if (i?.id && !map.has(i.id)) {
                  map.set(i.id, i);
                }
              });
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {
        console.error('Lỗi khi nạp danh sách hóa đơn từ storage:', err);
      } finally {
        isLoadedRef.current = true;
      }
    }
    initInvoices();
  }, []);

  // 3. Tự động lưu khi invoices thay đổi sau khi storage đã ready
  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveData(STORAGE_KEYS.INVOICES, invoices);

    // Tự động đồng bộ ngầm lên Supabase Cloud DB
    const cloudConfig = loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
    if (cloudConfig?.enabled && cloudConfig?.autoSync && cloudConfig?.supabaseUrl) {
      syncInvoicesToSupabase(invoices, cloudConfig).catch((e) =>
        console.warn('[AutoSync] Lỗi đồng bộ invoices lên Cloud:', e)
      );
    }
  }, [invoices]);

  // 4. LẮNG NGHE DOMAIN EVENTS TỪ CÁC THỰC THỂ KHÁC
  useEffect(() => {
    // Khi một phiếu xét nghiệm bị xóa -> Giải phóng reportId trên hóa đơn để không bị ID mồ côi
    const unsubReportDeleted = domainEventBus.subscribe<ReportDeletedPayload>(
      REPORT_EVENT_TYPES.DELETED,
      ({ payload }) => {
        setInvoices((prev) => {
          const hasLinked = prev.some((inv) => inv.reportId === payload.reportId);
          if (!hasLinked) return prev;

          return prev.map((inv) =>
            inv.reportId === payload.reportId ? { ...inv, reportId: undefined } : inv
          );
        });
      }
    );

    return () => {
      unsubReportDeleted();
    };
  }, []);

  // Helper: Đồng bộ ngay lập tức và trực tiếp lên Cloud DB
  const syncInvoicesDirectly = (nextList: Invoice[]) => {
    saveData(STORAGE_KEYS.INVOICES, nextList);
    const cloudConfig = loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
    if (cloudConfig?.enabled !== false && cloudConfig?.supabaseUrl) {
      syncInvoicesToSupabase(nextList, cloudConfig).catch((err) =>
        console.warn('[useInvoiceManager] Lỗi đồng bộ trực tiếp hóa đơn lên Cloud:', err)
      );
    }
  };

  // 5. Thêm mới hoặc cập nhật hóa đơn & Phát Domain Events
  const saveOrUpdateInvoice = (invoice: Invoice): Invoice => {
    setInvoices((prev) => {
      const idx = prev.findIndex((inv) => inv.id === invoice.id || (inv.code && inv.code === invoice.code));
      let next: Invoice[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...invoice };
      } else {
        next = [invoice, ...prev];
      }
      syncInvoicesDirectly(next);
      return next;
    });

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
    let deletedInvoice: Invoice | undefined;

    setInvoices((prev) => {
      deletedInvoice = prev.find((inv) => inv.id === id);
      const next = prev.filter((inv) => inv.id !== id);
      syncInvoicesDirectly(next);
      return next;
    });

    // Phát Domain Event: INVOICE_DELETED
    domainEventBus.emit(INVOICE_EVENT_TYPES.DELETED, {
      invoiceId: id,
      reportId: deletedInvoice?.reportId
    });
  };

  // 7. Xóa tất cả hóa đơn
  const clearAllInvoices = () => {
    setInvoices([]);
    syncInvoicesDirectly([]);
  };

  // 8. Cập nhật trạng thái hóa đơn
  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    let updatedInv: Invoice | undefined;

    setInvoices((prev) => {
      const next = prev.map((inv) => {
        if (inv.id === id) {
          updatedInv = { ...inv, status };
          return updatedInv;
        }
        return inv;
      });
      syncInvoicesDirectly(next);
      return next;
    });

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

  return {
    invoices,
    setInvoices,
    saveOrUpdateInvoice,
    deleteInvoice,
    clearAllInvoices,
    updateInvoiceStatus
  };
}
