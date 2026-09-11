import { useState, useEffect, useRef } from 'react';
import { MedicalReport, Patient, SelectedTest, ReportStatus, REPORT_STATUS, STORAGE_KEYS, CloudDbConfig, PatientIdentityDomainService } from '@domain';
import { LabReportAggregate } from '@domain/aggregates/LabReportAggregate';
import { loadState } from '@infra/storage';
import { syncReportsToSupabase, fetchReportsFromSupabase, DEFAULT_CLOUD_DB_CONFIG } from '@infra/cloudDbService';
import { postReport, deleteReportApi, recordPdfExportApi } from '@infra/apiClient';
import { domainEventBus } from '@domain/events/DomainEventBus';
import {
  REPORT_EVENT_TYPES,
  INVOICE_EVENT_TYPES,
  InvoicePaidPayload,
  InvoiceCancelledPayload,
  InvoiceDeletedPayload,
  ReportPdfExportedPayload,
  ReportZaloSentPayload
} from '@domain/events/DomainEvent';

export function useReportManager() {
  // 1. Khởi tạo danh sách phiếu xét nghiệm
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const reportsRef = useRef(reports);
  reportsRef.current = reports;

  // 2. Nạp trực tiếp từ Cloud Database (PostgreSQL)
  useEffect(() => {
    async function initReports() {
      try {
        const cloudConfig = loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
        if (cloudConfig?.enabled !== false && cloudConfig?.supabaseUrl) {
          const cloudReports = await fetchReportsFromSupabase(cloudConfig).catch(() => null);
          if (Array.isArray(cloudReports)) {
            setReports(cloudReports);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách phiếu xét nghiệm từ Cloud DB:', err);
      }
    }
    initReports();
  }, []);

  // 4. LẮNG NGHE DOMAIN EVENTS ĐỂ TỰ ĐỘNG CẬP NHẬT HIỆU ỨNG LIÊN ĐỚI (CASCADE UPDATE)
  useEffect(() => {
    // 4.1. Khi Hóa đơn được thanh toán -> Cập nhật trạng thái phiếu sang Đã thu (khớp chính xác theo ID)
    const unsubPaid = domainEventBus.subscribe<InvoicePaidPayload>(
      INVOICE_EVENT_TYPES.PAID,
      ({ payload }) => {
        const prev = reportsRef.current;
        const targetReportId = payload.reportId || payload.invoice.reportId;
        const targetIndex = prev.findIndex(
          (r) =>
            (targetReportId && r.id === targetReportId) ||
            (payload.invoice.id && r.invoiceId === payload.invoice.id)
        );
        if (targetIndex < 0) return;

        const target = prev[targetIndex];
        const agg = LabReportAggregate.fromSnapshot(target);
        agg.markPaymentCollected(payload.invoice.id, payload.paidAt);
        const updated = agg.toSnapshot();

        const next = [...prev];
        next[targetIndex] = updated;
        reportsRef.current = next;
        setReports(next);

        postReport(updated).catch((err) => {
          console.warn('[useReportManager] Lỗi lưu cập nhật thu tiền phiếu:', err);
        });
      }
    );

    // 4.2. Khi Hóa đơn bị hủy -> Reset trạng thái thu tiền của phiếu
    const unsubCancelled = domainEventBus.subscribe<InvoiceCancelledPayload>(
      INVOICE_EVENT_TYPES.CANCELLED,
      ({ payload }) => {
        const prev = reportsRef.current;
        const targetIndex = prev.findIndex(
          (r) =>
            (payload.invoiceId && r.invoiceId === payload.invoiceId) ||
            (payload.reportId && r.id === payload.reportId)
        );
        if (targetIndex < 0) return;

        const target = prev[targetIndex];
        const agg = LabReportAggregate.fromSnapshot(target);
        agg.markPaymentVoided();
        const updated = agg.toSnapshot();

        const next = [...prev];
        next[targetIndex] = updated;
        reportsRef.current = next;
        setReports(next);

        postReport(updated).catch((err) => {
          console.warn('[useReportManager] Lỗi lưu hủy thu tiền phiếu:', err);
        });
      }
    );

    // 4.3. Khi Hóa đơn bị xóa -> Giải phóng liên kết trên phiếu
    const unsubDeleted = domainEventBus.subscribe<InvoiceDeletedPayload>(
      INVOICE_EVENT_TYPES.DELETED,
      ({ payload }) => {
        const prev = reportsRef.current;
        const targetIndex = prev.findIndex(
          (r) =>
            (payload.invoiceId && r.invoiceId === payload.invoiceId) ||
            (payload.reportId && r.id === payload.reportId)
        );
        if (targetIndex < 0) return;

        const target = prev[targetIndex];
        const agg = LabReportAggregate.fromSnapshot(target);
        agg.markPaymentVoided();
        const updated = agg.toSnapshot();

        const next = [...prev];
        next[targetIndex] = updated;
        reportsRef.current = next;
        setReports(next);

        postReport(updated).catch((err) => {
          console.warn('[useReportManager] Lỗi lưu hủy liên kết hóa đơn trên phiếu:', err);
        });
      }
    );

    // 4.4. Khi Xuất PDF Cloud -> Cập nhật phiên bản PDF & trạng thái
    const unsubPdf = domainEventBus.subscribe<ReportPdfExportedPayload>(
      REPORT_EVENT_TYPES.PDF_EXPORTED,
      ({ payload }) => {
        const prev = reportsRef.current;
        const idx = prev.findIndex((r) => r.id === payload.reportId);
        if (idx < 0) return;

        const agg = LabReportAggregate.fromSnapshot(prev[idx]);
        agg.recordCloudExport(payload.cloudPdfUrl, payload.qrCodeDataUrl, payload.pdfVersion);
        const updated = agg.toSnapshot();

        const next = [...prev];
        next[idx] = updated;
        reportsRef.current = next;
        setReports(next);

        postReport(updated).catch((err) => {
          console.warn('[useReportManager] Lỗi lưu cập nhật PDF xuất bản:', err);
        });
      }
    );

    // 4.5. Khi Gửi Zalo thành công -> Cập nhật trạng thái Đã trả kết quả
    const unsubZalo = domainEventBus.subscribe<ReportZaloSentPayload>(
      REPORT_EVENT_TYPES.ZALO_SENT,
      ({ payload }) => {
        const prev = reportsRef.current;
        const idx = prev.findIndex((r) => r.id === payload.reportId);
        if (idx < 0) return;

        const agg = LabReportAggregate.fromSnapshot(prev[idx]);
        agg.recordZaloSent(payload.msgId);
        const updated = agg.toSnapshot();

        const next = [...prev];
        next[idx] = updated;
        reportsRef.current = next;
        setReports(next);

        postReport(updated).catch((err) => {
          console.warn('[useReportManager] Lỗi lưu trạng thái Zalo gửi phiếu:', err);
        });
      }
    );

    return () => {
      unsubPaid();
      unsubCancelled();
      unsubDeleted();
      unsubPdf();
      unsubZalo();
    };
  }, []);

  // Helper: Lưu ngay lập tức và trực tiếp lên Cloud DB
  const syncReportsDirectly = (nextList: MedicalReport[]) => {
    const cloudConfig = loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
    if (cloudConfig?.enabled !== false && cloudConfig?.supabaseUrl) {
      syncReportsToSupabase(nextList, cloudConfig).catch((err) =>
        console.warn('[useReportManager] Lỗi lưu trực tiếp phiếu lên Cloud:', err)
      );
    }
  };

  // 5. Thêm mới hoặc cập nhật phiếu thông qua Domain State Machine & Phát Event

  // Đối soát nhận diện định danh bệnh nhân thông qua Pure Domain Service
  const findMatchingReportIndex = (
    list: MedicalReport[],
    criteria: Parameters<typeof PatientIdentityDomainService.findMatchingIndex>[1]
  ): number => {
    return PatientIdentityDomainService.findMatchingIndex(list, criteria);
  };

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
  }): MedicalReport => {
    const prev = reportsRef.current;

    // Tìm phiếu hiện có:
    // - Nếu có params.id: cập nhật đúng phiếu theo ID
    // - Nếu có params.patient?.code: đối soát theo mã phiếu
    // - allowIdentityMerge mặc định là false, ngăn ngừa việc ghi đè bệnh án khi tái khám
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
          code: existingItem.patient?.code || existingItem.code || params.patient.code
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

    reportsRef.current = nextReports; // Cập nhật ngay ref
    setReports(nextReports);
    // Lưu lên server: Nếu xuất Cloud PDF thì gọi Command endpoint chuyên biệt để ghi nhận Ledger & Version
    const isNewPdfExport = Boolean(params.cloudPdfUrl && params.cloudPdfUrl !== existingItem?.cloudPdfUrl);
    if (isNewPdfExport) {
      recordPdfExportApi(updatedReport.id, {
        cloudPdfUrl: params.cloudPdfUrl!,
        qrCodeDataUrl: params.qrCodeDataUrl,
        version: updatedReport.pdfVersion,
        report: updatedReport
      }).catch((err) => {
        console.warn('[useReportManager] Lỗi recordPdfExportApi, fallback postReport:', err);
        postReport(updatedReport).catch(() => syncReportsDirectly(nextReports));
      });
    } else {
      postReport(updatedReport).catch((err) => {
        console.warn('[useReportManager] Không thể lưu đơn lẻ phiếu lên server, fallback lưu mảng:', err);
        syncReportsDirectly(nextReports);
      });
    }

    // Phát Domain Event: REPORT_SAVED (sử dụng report đã computed)
    domainEventBus.emit(REPORT_EVENT_TYPES.SAVED, {
      report: updatedReport,
      isNew: isNewReport
    });

    return updatedReport;
  };

  // 6. Lưu / Cập nhật hàng loạt phiếu an toàn (Dùng cho Batch Import Excel)
  const bulkSaveOrUpdateReports = (
    rows: Array<{
      patient: Patient;
      selectedTests: SelectedTest[];
      conclusion: string;
      doctorName: string;
      hasExplicitCode?: boolean;
    }>
  ): MedicalReport[] => {
    if (rows.length === 0) return [];

    let currentList = [...reportsRef.current];
    const savedList: MedicalReport[] = [];

    for (const row of rows) {
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
      let updatedReport: MedicalReport;

      if (!existingItem) {
        const agg = LabReportAggregate.create({
          code: row.patient.code || `BN-${Date.now()}`,
          sampleCode: row.patient.sampleCode || row.patient.code || `BN-${Date.now()}`,
          patient: row.patient,
          doctorName: row.doctorName,
          selectedTests: row.selectedTests,
          conclusion: row.conclusion
        });
        updatedReport = agg.toSnapshot();
        currentList = [updatedReport, ...currentList];
      } else {
        const agg = LabReportAggregate.fromSnapshot(existingItem);
        agg.updateReport({
          patient: {
            ...row.patient,
            code: existingItem.patient?.code || existingItem.code || row.patient.code
          },
          selectedTests: row.selectedTests,
          conclusion: row.conclusion,
          doctorName: row.doctorName
        });
        updatedReport = agg.toSnapshot();
        currentList[idx] = updatedReport;
      }

      savedList.push(updatedReport);

      domainEventBus.emit(REPORT_EVENT_TYPES.SAVED, {
        report: updatedReport,
        isNew: !existingItem
      });
    }

    // Cập nhật State và lưu Cloud đúng 1 lần duy nhất sau khi xử lý xong batch
    reportsRef.current = currentList;
    setReports(currentList);
    syncReportsDirectly(currentList);

    return savedList;
  };

  // 7. Cập nhật hàng loạt phiếu (Dùng sau khi chạy batch re-export)
  const bulkUpdateReports = (updatedList: MedicalReport[]) => {
    const prev = reportsRef.current;
    const updatedMap = new Map(updatedList.map((r) => [r.id, r]));
    const next = prev.map((r) => updatedMap.get(r.id) || r);
    reportsRef.current = next;
    setReports(next);
    syncReportsDirectly(next);
  };

  // 8. Xóa 1 phiếu & Phát Event
  const deleteReport = (id: string) => {
    let deletedReportCode: string | undefined;
    const prev = reportsRef.current;
    const target = prev.find((r) => r.id === id);
    if (target) deletedReportCode = target.code;
    const next = prev.filter((r) => r.id !== id);
    reportsRef.current = next;
    setReports(next);

    // Xóa đơn lẻ trên server bên ngoài state updater
    deleteReportApi(id).catch((err) => {
      console.warn('[useReportManager] Lỗi xóa đơn lẻ phiếu trên server, fallback:', err);
      syncReportsDirectly(next);
    });

    // Phát Domain Event: REPORT_DELETED
    domainEventBus.emit(REPORT_EVENT_TYPES.DELETED, {
      reportId: id,
      reportCode: deletedReportCode
    });
  };

  // 9. Xóa toàn bộ phiếu
  const clearAllReports = () => {
    reportsRef.current = [];
    setReports([]);
    syncReportsDirectly([]);
  };

  // 10. Cập nhật trạng thái phiếu thông qua State Machine & Aggregate
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
      postReport(updatedReport).catch((err) => {
        console.warn('[useReportManager] Lỗi cập nhật trạng thái phiếu đơn lẻ:', err);
        syncReportsDirectly(next);
      });
    }
  };

  // 10. Tiếp nhận cập nhật phiếu từ Backend Transaction (Authoritative Response)
  const handleExternalReportUpdate = (updatedReport: MedicalReport) => {
    const prev = reportsRef.current;
    const idx = prev.findIndex((r) => r.id === updatedReport.id);
    let next: MedicalReport[];
    if (idx >= 0) {
      next = [...prev];
      next[idx] = updatedReport;
    } else {
      next = [updatedReport, ...prev];
    }
    reportsRef.current = next;
    setReports(next);
  };

  return {
    reports,
    setReports,
    saveOrUpdateReport,
    bulkSaveOrUpdateReports,
    bulkUpdateReports,
    deleteReport,
    clearAllReports,
    updateReportStatus,
    handleExternalReportUpdate
  };
}
