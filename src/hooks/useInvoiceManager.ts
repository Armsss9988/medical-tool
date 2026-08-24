import { useState, useEffect, useRef } from 'react';
import { Invoice, InvoiceStatus } from '@domain/types';
import { loadData, saveData, loadState } from '@infra/storage';

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

  // 4. Thêm mới hoặc cập nhật hóa đơn
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
    return invoice;
  };

  // 5. Xóa 1 hóa đơn
  const deleteInvoice = (id: string) => {
    setInvoices((prev) => {
      const next = prev.filter((inv) => inv.id !== id);
      saveData('invoices', next);
      return next;
    });
  };

  // 6. Xóa tất cả hóa đơn
  const clearAllInvoices = () => {
    setInvoices([]);
    saveData('invoices', []);
  };

  // 7. Cập nhật trạng thái hóa đơn
  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    setInvoices((prev) => {
      const next = prev.map((inv) => (inv.id === id ? { ...inv, status } : inv));
      saveData('invoices', next);
      return next;
    });
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
