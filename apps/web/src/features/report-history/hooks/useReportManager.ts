import { useRef, useCallback, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MedicalReport, Patient, SelectedTest, ReportStatus, REPORT_STATUS, STORAGE_KEYS, CloudDbConfig, PatientIdentityDomainService, INVOICE_EVENT_TYPES, BatchImportRow, PatientCode } from '@domain';
import { LabReportAggregate } from '@domain/aggregates/LabReportAggregate';
import { loadState, saveState } from '@infra/storage';
import { syncReportsToSupabase, DEFAULT_CLOUD_DB_CONFIG } from '@infra/cloudDbService';
import { recordPdfExportApi, putTable } from '@infra/apiClient';
import { domainEventBus } from '@domain/events/DomainEventBus';
import { REPORT_EVENT_TYPES } from '@domain/events/DomainEvent';
import { useReportsQuery, useSaveReportMutation, useDeleteReportMutation } from './useReportsQuery';
import { REPORTS_QUERY_KEY } from '@infra/queryClient';

export function useReportManager() {
  // 1. Quản lý danh sách phiếu xét nghiệm bằng TanStack Query v5 (Server State)
  const { reports: queryReports, isLoading, isFetching, isError, refetch } = useReportsQuery();
  const qc = useQueryClient();
  const saveMutation = useSaveReportMutation();
  const deleteMutation = useDeleteReportMutation();

  const [localReports, setLocalReports] = useState<MedicalReport[]>(queryReports);
  const reportsRef = useRef(queryReports);

  // Đồng bộ localReports khi queryReports cập nhật từ cache hoặc API
  useEffect(() => {
    setLocalReports(queryReports);
    reportsRef.current = queryReports;
  }, [queryReports]);

  // setReports cập nhật đồng bộ cache của TanStack Query, local state và ref
  const setReports = useCallback((updater: MedicalReport[] | ((prev: MedicalReport[]) => MedicalReport[])) => {
    const next = typeof updater === 'function' ? updater(reportsRef.current) : updater;
    reportsRef.current = next;
    setLocalReports(next);
    qc.setQueryData<MedicalReport[]>(REPORTS_QUERY_KEY, next);
    saveState(STORAGE_KEYS.REPORTS, next);
  }, [qc]);

  // Lắng nghe Domain Event: INVOICE_PAID để cập nhật trạng thái thanh toán phiếu
  useEffect(() => {
    const unsub = domainEventBus.subscribe(INVOICE_EVENT_TYPES.PAID, (event: unknown) => {
      const e = event as { payload?: { reportId?: string; invoice?: { reportId?: string }; paidAt?: string }; reportId?: string; invoice?: { reportId?: string }; paidAt?: string };
      const p = (e && typeof e === 'object' && 'payload' in e && e.payload) ? e.payload : e;
      const targetReportId = p?.reportId || p?.invoice?.reportId;
      if (!targetReportId) return;
      const prev = reportsRef.current;
      const target = prev.find((r) => r.id === targetReportId);
      if (!target) return;
      const updated: MedicalReport = {
        ...target,
        patient: {
          ...target.patient,
          paidAt: p.paidAt
        }
      };
      const next = prev.map((r) => (r.id === targetReportId ? updated : r));
      reportsRef.current = next;
      setReports(next);
    });
    return unsub;
  }, [setReports]);

  // Helper: Lọc bỏ các bản ghi không hợp lệ hoặc thiếu tên bệnh nhân trước khi lưu DB
  const cleanReportsList = (list: MedicalReport[]): MedicalReport[] => {
    return list.filter(
      (r) => r && r.patient && typeof r.patient.name === 'string' && r.patient.name.trim().length > 0
    );
  };

  // Helper: Lưu trực tiếp lên Cloud DB nếu được bật
  const syncReportsDirectly = (nextList: MedicalReport[]) => {
    const validList = cleanReportsList(nextList);
    const cloudConfig = loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
    if (cloudConfig?.enabled !== false && cloudConfig?.supabaseUrl) {
      syncReportsToSupabase(validList, cloudConfig).catch((err) =>
        console.warn('[useReportManager] Lỗi lưu trực tiếp phiếu lên Cloud:', err)
      );
    }
  };

  // 2. Đối soát nhận diện định danh bệnh nhân thông qua Pure Domain Service
  const findMatchingReportIndex = (
    list: MedicalReport[],
    criteria: Parameters<typeof PatientIdentityDomainService.findMatchingIndex>[1]
  ): number => {
    return PatientIdentityDomainService.findMatchingIndex(list, criteria);
  };

  // 3. Thêm mới hoặc cập nhật phiếu thông qua Domain State Machine & TanStack Query Mutation
  const saveOrUpdateReport = (params: {
    id?: string;
    patient: Patient;
    selectedTests: SelectedTest[];
    conclusion: string;
    doctorName: string;
    cloudPdfUrl?: string;
    qrCodeDataUrl?: string;
    invoiceId?: string;
    status?: ReportStatus;
    zaloSentAt?: string;
    zaloMsgId?: string;
    pdfGeneratedAt?: string;
    pdfVersion?: number;
    isPdfOutdated?: boolean;
    hasExplicitCode?: boolean;
    allowIdentityMerge?: boolean;
    skipRemote?: boolean;
  }): MedicalReport => {
    const prev = reportsRef.current;

    const hasExplicitCode = params.hasExplicitCode !== undefined
      ? params.hasExplicitCode
      : Boolean(params.patient?.code);

    const idx = findMatchingReportIndex(prev, {
      id: params.id,
      code: params.patient?.code,
      patient: params.patient,
      hasExplicitCode,
      allowIdentityMerge: params.allowIdentityMerge ?? false
    });

    const existingItem = idx >= 0 ? prev[idx] : null;
    const isNewReport = !existingItem;

    let updatedReport: MedicalReport;

    if (!existingItem) {
      // Tạo mới thông qua Aggregate Root
      const agg = LabReportAggregate.create({
        id: params.id,
        code: params.patient.code || `BN-${Date.now()}`,
        sampleCode: params.patient.sampleCode || params.patient.code || `BN-${Date.now()}`,
        patient: params.patient,
        doctorName: params.doctorName,
        selectedTests: params.selectedTests,
        conclusion: params.conclusion,
        invoiceId: params.invoiceId
      });

      if (params.cloudPdfUrl) {
        agg.recordCloudExport(params.cloudPdfUrl, params.qrCodeDataUrl, params.pdfVersion);
      }
      updatedReport = agg.toSnapshot();
    } else {
      // Cập nhật thông qua Aggregate Root, bảo toàn Mã BN gốc nếu phiếu cũ đã có
      const agg = LabReportAggregate.fromSnapshot(existingItem);
      agg.updateReport({
        patient: {
          ...params.patient,
          code: params.patient.code?.trim() || existingItem.patient?.code || existingItem.code || ''
        },
        selectedTests: params.selectedTests,
        conclusion: params.conclusion,
        doctorName: params.doctorName,
        cloudPdfUrl: params.cloudPdfUrl ?? existingItem.cloudPdfUrl,
        qrCodeDataUrl: params.qrCodeDataUrl ?? existingItem.qrCodeDataUrl,
        invoiceId: params.invoiceId ?? existingItem.invoiceId,
        zaloSentAt: params.zaloSentAt ?? existingItem.zaloSentAt,
        zaloMsgId: params.zaloMsgId ?? existingItem.zaloMsgId,
        status: params.status
      });

      if (params.cloudPdfUrl && (params.status === REPORT_STATUS.EXPORTED || params.cloudPdfUrl !== existingItem.cloudPdfUrl)) {
        agg.recordCloudExport(params.cloudPdfUrl, params.qrCodeDataUrl, params.pdfVersion);
      }
      updatedReport = agg.toSnapshot();
    }

    let nextReports: MedicalReport[];
    if (idx >= 0) {
      nextReports = [...prev];
      nextReports[idx] = updatedReport;
    } else {
      nextReports = [updatedReport, ...prev];
    }

    reportsRef.current = nextReports;
    setReports(nextReports);

    // Lưu lên server: Nếu skipRemote = true thì bỏ qua vì đã có Command endpoint nguyên tử (e.g. payInvoice)
    if (params.skipRemote) {
      // Remote persistence được đồng bộ bằng ACID command transaction
    } else {
      const isNewPdfExport = Boolean(params.cloudPdfUrl && params.cloudPdfUrl !== existingItem?.cloudPdfUrl);
      if (isNewPdfExport) {
        recordPdfExportApi(updatedReport.id, {
          cloudPdfUrl: params.cloudPdfUrl!,
          qrCodeDataUrl: params.qrCodeDataUrl,
          version: updatedReport.pdfVersion,
          report: updatedReport
        }).catch((err) => {
          console.warn('[useReportManager] Lỗi recordPdfExportApi, fallback saveMutation:', err);
          saveMutation.mutate(updatedReport);
        });
      } else {
        saveMutation.mutate(updatedReport);
      }
    }

    // Phát Domain Event: REPORT_SAVED
    domainEventBus.emit(REPORT_EVENT_TYPES.SAVED, {
      report: updatedReport,
      isNew: isNewReport
    });

    return updatedReport;
  };

  // 4. Lưu / Cập nhật hàng loạt phiếu an toàn (Dùng cho Batch Import Excel)
  const bulkSaveOrUpdateReports = (
    rows: BatchImportRow[]
  ): MedicalReport[] => {
    if (rows.length === 0) return [];

    let currentList = [...reportsRef.current];
    const savedList: MedicalReport[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const hasExplicit = row.hasExplicitCode !== undefined
        ? row.hasExplicitCode
        : Boolean(row.patient.code && !row.patient.code.startsWith('BN-AUTO-'));
      const idx = findMatchingReportIndex(currentList, {
        code: row.patient.code,
        patient: row.patient,
        hasExplicitCode: hasExplicit,
        allowIdentityMerge: !hasExplicit
      });

      const existingItem = idx >= 0 ? currentList[idx] : null;

      // Quyết định: Ghi đè hay Thêm mới
      // - Nếu action === 'OVERWRITE': Ghi đè phiếu cũ nếu tìm thấy
      // - Nếu action === 'CREATE_NEW': Luôn tạo mới (dù có trùng thông tin)
      // - Nếu không truyền action (legacy fallback): Ghi đè nếu có existingItem
      const isExplicitOverwrite = row.action === 'OVERWRITE';
      const isExplicitCreateNew = row.action === 'CREATE_NEW';
      const shouldOverwrite = isExplicitOverwrite
        ? Boolean(existingItem)
        : (!isExplicitCreateNew && Boolean(existingItem));

      let updatedReport: MedicalReport;

      if (!shouldOverwrite) {
        // Tạo mới phiếu
        const allCodes = currentList.map((r) => r.code || r.patient?.code || '');
        let codeVal = row.patient.code || '';
        // Nếu mã rỗng hoặc trùng mã đã có trong danh sách khi người dùng chọn "Thêm mới", sinh mã BN tiếp theo không va chạm
        if (!codeVal || (existingItem && allCodes.includes(codeVal))) {
          codeVal = PatientCode.generateNextCode(allCodes);
        }
        const sampleCodeVal = row.patient.sampleCode && !allCodes.includes(row.patient.sampleCode)
          ? row.patient.sampleCode
          : codeVal;

        const agg = LabReportAggregate.create({
          code: codeVal,
          sampleCode: sampleCodeVal,
          patient: {
            ...row.patient,
            code: codeVal,
            sampleCode: sampleCodeVal
          },
          doctorName: row.doctorName,
          selectedTests: row.selectedTests,
          conclusion: row.conclusion
        });
        updatedReport = agg.toSnapshot();
        currentList = [updatedReport, ...currentList];
      } else {
        // Ghi đè phiếu cũ
        const agg = LabReportAggregate.fromSnapshot(existingItem!);
        agg.updateReport({
          patient: {
            ...row.patient,
            code: existingItem!.patient?.code || existingItem!.code || row.patient.code
          },
          doctorName: row.doctorName,
          selectedTests: row.selectedTests,
          conclusion: row.conclusion
        });
        updatedReport = agg.toSnapshot();
        currentList = currentList.map((r, i) => (i === idx ? updatedReport : r));
      }

      savedList.push(updatedReport);

      domainEventBus.emit(REPORT_EVENT_TYPES.SAVED, {
        report: updatedReport,
        isNew: !shouldOverwrite
      });
    }

    // Cập nhật State và lưu Cloud đúng 1 lần duy nhất sau khi xử lý xong batch
    reportsRef.current = currentList;
    setReports(currentList);
    saveState(STORAGE_KEYS.REPORTS, currentList);
    const validList = cleanReportsList(currentList);
    putTable('medical-reports', validList).catch((err) => {
      console.warn('[useReportManager] Lỗi lưu batch reports vào server local:', err);
    });
    syncReportsDirectly(validList);

    return savedList;
  };

  // 5. Cập nhật hàng loạt phiếu (Dùng sau khi chạy batch re-export)
  const bulkUpdateReports = (updatedList: MedicalReport[]) => {
    const prev = reportsRef.current;
    const updatedMap = new Map(updatedList.map((r) => [r.id, r]));
    const next = prev.map((r) => updatedMap.get(r.id) || r);
    reportsRef.current = next;
    setReports(next);
    saveState(STORAGE_KEYS.REPORTS, next);
    const validNext = cleanReportsList(next);
    putTable('medical-reports', validNext).catch((err) => {
      console.warn('[useReportManager] Lỗi lưu bulk update reports vào server local:', err);
    });
    syncReportsDirectly(validNext);
  };

  // 6. Xóa 1 phiếu & Phát Event
  const deleteReport = (id: string) => {
    let deletedReportCode: string | undefined;
    const prev = reportsRef.current;
    const target = prev.find((r) => r.id === id);
    if (target) deletedReportCode = target.code;
    const next = prev.filter((r) => r.id !== id);
    reportsRef.current = next;
    setReports(next);

    deleteMutation.mutate(id);
    syncReportsDirectly(next);

    // Phát Domain Event: REPORT_DELETED
    domainEventBus.emit(REPORT_EVENT_TYPES.DELETED, {
      reportId: id,
      reportCode: deletedReportCode
    });
  };

  // 7. Xóa toàn bộ phiếu
  const clearAllReports = () => {
    reportsRef.current = [];
    setReports([]);
    saveState(STORAGE_KEYS.REPORTS, []);
    putTable('medical-reports', []).catch((err) => {
      console.warn('[useReportManager] Lỗi xóa sạch reports trên server:', err);
    });
    syncReportsDirectly([]);
  };

  // 8. Cập nhật trạng thái phiếu thông qua State Machine & Aggregate
  const updateReportStatus = (id: string, newStatus: ReportStatus) => {
    const prev = reportsRef.current;
    let updatedReport: MedicalReport | undefined;
    const next = prev.map((r) => {
      if (r.id !== id) return r;
      const agg = LabReportAggregate.fromSnapshot(r);
      agg.updateLegacyStatus(newStatus);
      updatedReport = agg.toSnapshot();
      return updatedReport;
    });
    reportsRef.current = next;
    setReports(next);

    if (updatedReport) {
      saveMutation.mutate(updatedReport);
    }
  };

  // 9. Tiếp nhận cập nhật phiếu từ Backend Transaction (Authoritative Response)
  const handleExternalReportUpdate = (updatedReport: MedicalReport) => {
    qc.setQueryData<MedicalReport[]>(REPORTS_QUERY_KEY, (prev = []) => {
      const idx = prev.findIndex((r) => r.id === updatedReport.id);
      const next = idx >= 0 ? prev.map((r, i) => (i === idx ? updatedReport : r)) : [updatedReport, ...prev];
      reportsRef.current = next;
      setLocalReports(next);
      return next;
    });
  };

  return {
    reports: localReports,
    setReports,
    saveOrUpdateReport,
    bulkSaveOrUpdateReports,
    bulkUpdateReports,
    deleteReport,
    clearAllReports,
    updateReportStatus,
    handleExternalReportUpdate,
    isLoading,
    isFetching,
    isError,
    refetch
  };
}
