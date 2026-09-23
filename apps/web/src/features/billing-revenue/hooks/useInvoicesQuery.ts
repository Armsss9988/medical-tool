import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Invoice, MedicalReport } from '@domain/types';
import { STORAGE_KEYS } from '@domain/constants/storageKeys';
import { safeParseInvoices } from '@schemas/invoiceSchemas';
import {
  getTable,
  postInvoice,
  deleteInvoiceApi,
  payInvoice as apiClientPayInvoice,
  cancelInvoice as apiClientCancelInvoice
} from '@infra/apiClient';
import { loadState, saveState } from '@infra/storage';
import { REPORTS_QUERY_KEY, INVOICES_QUERY_KEY } from '@infra/queryClient';

/**
 * Nạp danh sách hóa đơn từ Server/DB qua TanStack Query v5,
 * chạy qua Zod Sanitizing Schemas và fallback LocalStorage khi offline.
 */
export function useInvoicesQuery() {
  const [cachedLocal] = useState<Invoice[]>(() => {
    const local = loadState<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    return safeParseInvoices(local);
  });

  const query = useQuery<Invoice[]>({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await getTable('invoices');
        if (res && Array.isArray(res.rows)) {
          if ((res as unknown as { warning?: string }).warning) {
            console.warn('[useInvoicesQuery] Server trả về warning, nạp an toàn từ LocalStorage:', (res as unknown as { warning?: string }).warning);
            const local = loadState<Invoice[]>(STORAGE_KEYS.INVOICES, []);
            return safeParseInvoices(local);
          }

          const parsed = safeParseInvoices(res.rows);
          const local = loadState<Invoice[]>(STORAGE_KEYS.INVOICES, []);

          if (parsed.length === 0 && local.length > 0) {
            console.warn('[useInvoicesQuery] Server rỗng nhưng LocalStorage có dữ liệu, bảo vệ dữ liệu local');
            return safeParseInvoices(local);
          }

          const invMap = new Map<string, Invoice>();
          for (const inv of parsed) {
            invMap.set(inv.id, inv);
          }
          for (const loc of local) {
            if (!invMap.has(loc.id)) {
              invMap.set(loc.id, loc);
            }
          }
          const merged = Array.from(invMap.values());
          saveState(STORAGE_KEYS.INVOICES, merged);
          return merged;
        }
        // Fallback đọc từ LocalStorage nếu API server trả về không hợp lệ
        const local = loadState<Invoice[]>(STORAGE_KEYS.INVOICES, []);
        return safeParseInvoices(local);
      } catch (_err) {
        // Fallback đọc từ LocalStorage khi offline
        const local = loadState<Invoice[]>(STORAGE_KEYS.INVOICES, []);
        return safeParseInvoices(local);
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false
  });

  return {
    ...query,
    invoices: query.data ?? cachedLocal
  };
}

/**
 * Mutation lưu hoặc cập nhật hóa đơn
 */
export function useSaveInvoiceMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: Invoice) => {
      // 1. Lưu LocalStorage trước
      const currentList = qc.getQueryData<Invoice[]>(INVOICES_QUERY_KEY) || loadState<Invoice[]>(STORAGE_KEYS.INVOICES, []);
      const idx = currentList.findIndex((i) => i.id === invoice.id || (i.code && i.code === invoice.code));
      const nextList = idx >= 0
        ? currentList.map((item, i) => (i === idx ? invoice : item))
        : [invoice, ...currentList];
      saveState(STORAGE_KEYS.INVOICES, nextList);

      // 2. Lưu xuống Server qua API
      try {
        await postInvoice(invoice);
      } catch (err) {
        console.warn('[useSaveInvoiceMutation] Lưu server lỗi, dữ liệu được giữ ở Local:', err);
      }

      return invoice;
    },
    onSuccess: (savedInvoice) => {
      // 1. Optimistic update dữ liệu hiện có vào React Query cache trước
      qc.setQueryData<Invoice[]>(INVOICES_QUERY_KEY, (prev = []) => {
        const idx = prev.findIndex((i) => i.id === savedInvoice.id || (i.code && i.code === savedInvoice.code));
        return idx >= 0 ? prev.map((item, i) => (i === idx ? savedInvoice : item)) : [savedInvoice, ...prev];
      });
      // 2. Làm mới sau đó với cờ re-fetch mềm không ghi đè dữ liệu vừa lưu
      qc.invalidateQueries({ queryKey: INVOICES_QUERY_KEY, refetchType: 'none' });
    }
  });
}

/**
 * Mutation thu phí hóa đơn (Command Backend Transaction)
 * Tự động đồng bộ nguyên tử cả Hóa Đơn và Phiếu Khám
 */
export function usePayInvoiceMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      paymentMethod?: string;
      cashier?: string;
      paidAt?: string;
      discount?: number;
      invoice?: Invoice;
      report?: MedicalReport;
    }) => {
      const { id, ...payload } = params;
      const res = await apiClientPayInvoice(id, payload);
      return res;
    },
    onSuccess: (res) => {
      // 1. Cập nhật tức thì cả Hóa Đơn và Phiếu Khám vào cache và LocalStorage
      if (res?.invoice) {
        qc.setQueryData<Invoice[]>(INVOICES_QUERY_KEY, (prev = []) => {
          const idx = prev.findIndex((i) => i.id === res.invoice!.id || (i.code && i.code === res.invoice!.code));
          const next = idx >= 0 ? prev.map((item, i) => (i === idx ? res.invoice! : item)) : [res.invoice!, ...prev];
          saveState(STORAGE_KEYS.INVOICES, next);
          return next;
        });
      }
      if (res?.report) {
        qc.setQueryData<MedicalReport[]>(REPORTS_QUERY_KEY, (prev = []) => {
          const idx = prev.findIndex((r) => r.id === res.report!.id || (r.code && r.code === res.report!.code));
          const next = idx >= 0 ? prev.map((item, i) => (i === idx ? res.report! : item)) : [res.report!, ...prev];
          saveState(STORAGE_KEYS.REPORTS, next);
          return next;
        });
      }
      // 2. Đồng bộ ngầm mà không refetch cứng đè mất dữ liệu vừa cập nhật
      qc.invalidateQueries({ queryKey: INVOICES_QUERY_KEY, refetchType: 'none' });
      qc.invalidateQueries({ queryKey: REPORTS_QUERY_KEY, refetchType: 'none' });
    }
  });
}

/**
 * Mutation hủy hóa đơn (Command Backend Transaction)
 */
export function useCancelInvoiceMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; reason?: string; cancelledBy?: string; fallbackInvoice?: Invoice }) => {
      const { id, ...payload } = params;
      const res = await apiClientCancelInvoice(id, payload);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
    }
  });
}

/**
 * Mutation xóa hóa đơn
 */
export function useDeleteInvoiceMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Xóa trong LocalStorage
      const currentList = qc.getQueryData<Invoice[]>(INVOICES_QUERY_KEY) || loadState<Invoice[]>(STORAGE_KEYS.INVOICES, []);
      const nextList = currentList.filter((i) => i.id !== id);
      saveState(STORAGE_KEYS.INVOICES, nextList);

      // 2. Xóa trên Server
      try {
        await deleteInvoiceApi(id);
      } catch (err) {
        console.warn('[useDeleteInvoiceMutation] Xóa server lỗi:', err);
      }

      return id;
    },
    onSuccess: (deletedId) => {
      qc.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
      qc.setQueryData<Invoice[]>(INVOICES_QUERY_KEY, (prev = []) => prev.filter((i) => i.id !== deletedId));
    }
  });
}
