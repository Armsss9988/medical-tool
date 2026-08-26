import { useState, useEffect, useRef } from 'react';
import { Invoice, InvoiceStatus } from '@domain/types';
import { loadData, saveData, loadState } from '@infra/storage';
import { domainEventBus } from '@domain/events/DomainEventBus';
import {
  INVOICE_EVENT_TYPES,
  REPORT_EVENT_TYPES,
  ReportDeletedPayload
} from '@domain/events/DomainEvent';

export function useInvoiceManager() {
  // 1. Tải danh sách hóa đơn từ storage ngay render đầu tiên
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    return loadState<Invoice[]>('invoices', []);
  });
  const isLoadedRef = useRef(true);

  // 2. Môi trường Electron: tải thêm từ file hệ thống nếu có
  useEffect(() => {
    async function initInvoices() {
      try {
        const saved = await loadData<Invoice[]>('invoices', []);
        if (Array.isArray(saved) && saved.length > 0) {
          setInvoices(saved);
        }
      } catch (err) {
        console.error('Lỗi khi nạp danh sách hóa đơn từ storage:', err);
      }
    }
    initInvoices();
  }, []);

  // 3. Tự động lưu khi invoices thay đổi
  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveData('invoices', invoices);
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

          const next = prev.map((inv) =>
            inv.reportId === payload.reportId ? { ...inv, reportId: undefined } : inv
          );
          saveData('invoices', next);
          return next;
        });
      }
    );

    return () => {
      unsubReportDeleted();
    };
  }, []);

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
      saveData('invoices', next);
      return next;
    });

    // Phát sự kiện tương ứng với trạng thái hóa đơn
    if (invoice.status === 'Đã thanh toán') {
      domainEventBus.emit(INVOICE_EVENT_TYPES.PAID, {
        invoice,
        paymentMethod: invoice.paymentMethod,
        paidAt: invoice.paidAt || new Date().toISOString(),
        reportId: invoice.reportId
      });
    } else if (invoice.status === 'Đã hủy / Hoàn tiền') {
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
      saveData('invoices', next);
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
    saveData('invoices', []);
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
      saveData('invoices', next);
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
