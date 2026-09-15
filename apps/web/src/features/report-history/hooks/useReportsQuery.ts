import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MedicalReport } from '@domain/types';
import { STORAGE_KEYS } from '@domain/constants/storageKeys';
import { safeParseMedicalReports } from '@schemas/reportSchemas';
import { getTable, postReport, deleteReportApi } from '@infra/apiClient';
import { loadState, saveState } from '@infra/storage';
import { REPORTS_QUERY_KEY } from '@infra/queryClient';

/**
 * Nạp danh sách phiếu xét nghiệm từ Server/DB thông qua TanStack Query v5,
 * chạy qua bộ lọc Zod Schemas để bảo đảm dữ liệu luôn sạch, tự động fallback LocalStorage nếu offline.
 */
export function useReportsQuery() {
  const [cachedLocal] = useState<MedicalReport[]>(() => {
    const local = loadState<MedicalReport[]>(STORAGE_KEYS.REPORTS, []);
    return safeParseMedicalReports(local);
  });

  const query = useQuery<MedicalReport[]>({
    queryKey: REPORTS_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await getTable('medical-reports');
        if (res && Array.isArray(res.rows)) {
          if ((res as unknown as { warning?: string }).warning) {
            console.warn('[useReportsQuery] Server trả về warning, nạp an toàn từ LocalStorage:', (res as unknown as { warning?: string }).warning);
            const local = loadState<MedicalReport[]>(STORAGE_KEYS.REPORTS, []);
            return safeParseMedicalReports(local);
          }

          const parsed = safeParseMedicalReports(res.rows);
          const local = loadState<MedicalReport[]>(STORAGE_KEYS.REPORTS, []);

          if (parsed.length === 0 && local.length > 0) {
            console.warn('[useReportsQuery] Server rỗng nhưng LocalStorage có dữ liệu, bảo vệ dữ liệu local');
            return safeParseMedicalReports(local);
          }

          const reportMap = new Map<string, MedicalReport>();
          for (const r of parsed) {
            reportMap.set(r.id, r);
          }
          for (const loc of local) {
            if (!reportMap.has(loc.id)) {
              reportMap.set(loc.id, loc);
            }
          }
          const merged = Array.from(reportMap.values());
          saveState(STORAGE_KEYS.REPORTS, merged);
          return merged;
        }
        // Fallback đọc từ LocalStorage nếu API server trả về không hợp lệ
        const local = loadState<MedicalReport[]>(STORAGE_KEYS.REPORTS, []);
        return safeParseMedicalReports(local);
      } catch (_err) {
        // Fallback đọc từ LocalStorage/Cache cục bộ khi chạy offline hoặc mất kết nối DB
        const local = loadState<MedicalReport[]>(STORAGE_KEYS.REPORTS, []);
        return safeParseMedicalReports(local);
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false
  });

  return {
    ...query,
    reports: query.data ?? cachedLocal
  };
}

/**
 * Mutation lưu phiếu xét nghiệm (Thêm mới hoặc Cập nhật)
 */
export function useSaveReportMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (report: MedicalReport) => {
      // 1. Lưu xuống LocalStorage để bảo đảm offline tức thì
      const currentList = qc.getQueryData<MedicalReport[]>(REPORTS_QUERY_KEY) || loadState<MedicalReport[]>(STORAGE_KEYS.REPORTS, []);
      const idx = currentList.findIndex((r) => r.id === report.id || (r.code && r.code === report.code));
      const nextList = idx >= 0
        ? currentList.map((r, i) => (i === idx ? report : r))
        : [report, ...currentList];
      saveState(STORAGE_KEYS.REPORTS, nextList);

      // 2. Lưu xuống Backend qua API
      try {
        await postReport(report);
      } catch (err) {
        // Bỏ qua lỗi mạng nếu đang chạy ở local-only mode
        console.warn('[useSaveReportMutation] Lưu server lỗi, dữ liệu được giữ an toàn ở Local:', err);
      }

      return report;
    },
    onSuccess: (savedReport) => {
      // 1. Optimistic update dữ liệu hiện có vào React Query cache trước
      qc.setQueryData<MedicalReport[]>(REPORTS_QUERY_KEY, (prev = []) => {
        const idx = prev.findIndex((r) => r.id === savedReport.id || (r.code && r.code === savedReport.code));
        return idx >= 0 ? prev.map((r, i) => (i === idx ? savedReport : r)) : [savedReport, ...prev];
      });
      // 2. Làm mới sau đó với cờ re-fetch mềm không ghi đè dữ liệu vừa lưu
      qc.invalidateQueries({ queryKey: REPORTS_QUERY_KEY, refetchType: 'none' });
    }
  });
}

/**
 * Mutation xóa phiếu xét nghiệm
 */
export function useDeleteReportMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Xóa trong LocalStorage
      const currentList = qc.getQueryData<MedicalReport[]>(REPORTS_QUERY_KEY) || loadState<MedicalReport[]>(STORAGE_KEYS.REPORTS, []);
      const nextList = currentList.filter((r) => r.id !== id);
      saveState(STORAGE_KEYS.REPORTS, nextList);

      // 2. Xóa trên Server
      try {
        await deleteReportApi(id);
      } catch (err) {
        console.warn('[useDeleteReportMutation] Xóa server lỗi:', err);
      }

      return id;
    },
    onSuccess: (deletedId) => {
      qc.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
      qc.setQueryData<MedicalReport[]>(REPORTS_QUERY_KEY, (prev = []) => prev.filter((r) => r.id !== deletedId));
    }
  });
}
