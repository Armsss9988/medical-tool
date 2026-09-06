import { useState, useEffect, useRef } from 'react';
import { MedicalReport, Patient, SelectedTest, ReportStatus, STORAGE_KEYS, CloudDbConfig } from '@domain';
import { LabReportAggregate } from '@domain/aggregates/LabReportAggregate';
import { loadState } from '@infra/storage';
import { syncReportsToSupabase, fetchReportsFromSupabase, DEFAULT_CLOUD_DB_CONFIG } from '@infra/cloudDbService';
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
  const isLoadedRef = useRef(false);

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
      } finally {
        isLoadedRef.current = true;
      }
    }
    initReports();
  }, []);

  // 3. Tự động đồng bộ khi danh sách reports thay đổi sau khi đã ready
  const lastSyncedHashRef = useRef<string>('');

  useEffect(() => {
    if (!isLoadedRef.current) return;

    const currentHash = reports.map((r) => `${r.id}:${r.updatedAt || ''}:${r.status || ''}`).join('|');
    if (lastSyncedHashRef.current === currentHash) {
      return;
    }
    lastSyncedHashRef.current = currentHash;

    // Tự động đồng bộ lên Supabase Cloud DB
    const cloudConfig = loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
    if (cloudConfig?.enabled !== false && cloudConfig?.supabaseUrl) {
      syncReportsToSupabase(reports, cloudConfig).catch((e) =>
        console.warn('[CloudDB] Lỗi đồng bộ reports lên Cloud:', e)
      );
    }
  }, [reports]);

  // 4. LẮNG NGHE DOMAIN EVENTS ĐỂ TỰ ĐỘNG ĐỒNG BỘ HIỆU ỨNG LIÊN ĐỚI (CASCADE SYNC)
  useEffect(() => {
    // 4.1. Khi Hóa đơn được thanh toán -> Cập nhật trạng thái phiếu sang Đã thu (khớp chính xác theo ID)
    const unsubPaid = domainEventBus.subscribe<InvoicePaidPayload>(
      INVOICE_EVENT_TYPES.PAID,
      ({ payload }) => {
        setReports((prev) => {
          const targetReportId = payload.reportId || payload.invoice.reportId;
          const targetIndex = prev.findIndex(
            (r) =>
              (targetReportId && r.id === targetReportId) ||
              (payload.invoice.id && r.invoiceId === payload.invoice.id)
          );
          if (targetIndex < 0) return prev;

          const target = prev[targetIndex];
          const agg = LabReportAggregate.fromSnapshot(target);
          agg.markPaymentCollected(payload.invoice.id, payload.paidAt);
          const updated = agg.toSnapshot();

          const next = [...prev];
          next[targetIndex] = updated;
          return next;
        });
      }
    );

    // 4.2. Khi Hóa đơn bị hủy -> Reset trạng thái thu tiền của phiếu
    const unsubCancelled = domainEventBus.subscribe<InvoiceCancelledPayload>(
      INVOICE_EVENT_TYPES.CANCELLED,
      ({ payload }) => {
        setReports((prev) => {
          const targetIndex = prev.findIndex(
            (r) =>
              (payload.invoiceId && r.invoiceId === payload.invoiceId) ||
              (payload.reportId && r.id === payload.reportId)
          );
          if (targetIndex < 0) return prev;

          const target = prev[targetIndex];
          const agg = LabReportAggregate.fromSnapshot(target);
          agg.markPaymentVoided();
          const updated = agg.toSnapshot();

          const next = [...prev];
          next[targetIndex] = updated;
          return next;
        });
      }
    );

    // 4.3. Khi Hóa đơn bị xóa -> Giải phóng liên kết trên phiếu
    const unsubDeleted = domainEventBus.subscribe<InvoiceDeletedPayload>(
      INVOICE_EVENT_TYPES.DELETED,
      ({ payload }) => {
        setReports((prev) => {
          const targetIndex = prev.findIndex(
            (r) =>
              (payload.invoiceId && r.invoiceId === payload.invoiceId) ||
              (payload.reportId && r.id === payload.reportId)
          );
          if (targetIndex < 0) return prev;

          const target = prev[targetIndex];
          const agg = LabReportAggregate.fromSnapshot(target);
          agg.markPaymentVoided();
          const updated = agg.toSnapshot();

          const next = [...prev];
          next[targetIndex] = updated;
          return next;
        });
      }
    );

    // 4.4. Khi Xuất PDF Cloud -> Cập nhật phiên bản PDF & trạng thái
    const unsubPdf = domainEventBus.subscribe<ReportPdfExportedPayload>(
      REPORT_EVENT_TYPES.PDF_EXPORTED,
      ({ payload }) => {
        setReports((prev) => {
          const idx = prev.findIndex((r) => r.id === payload.reportId);
          if (idx < 0) return prev;

          const agg = LabReportAggregate.fromSnapshot(prev[idx]);
          agg.recordCloudExport(payload.cloudPdfUrl, payload.qrCodeDataUrl);
          const updated = agg.toSnapshot();
          const next = [...prev];
          next[idx] = updated;
          return next;
        });
      }
    );

    // 4.5. Khi Gửi Zalo thành công -> Cập nhật trạng thái Đã trả kết quả
    const unsubZalo = domainEventBus.subscribe<ReportZaloSentPayload>(
      REPORT_EVENT_TYPES.ZALO_SENT,
      ({ payload }) => {
        setReports((prev) => {
          const idx = prev.findIndex((r) => r.id === payload.reportId);
          if (idx < 0) return prev;

          const agg = LabReportAggregate.fromSnapshot(prev[idx]);
          agg.recordZaloSent(payload.msgId);
          const updated = agg.toSnapshot();
          const next = [...prev];
          next[idx] = updated;
          return next;
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

  // Helper: Đồng bộ ngay lập tức và trực tiếp lên Cloud DB
  const syncReportsDirectly = (nextList: MedicalReport[]) => {
    lastSyncedHashRef.current = nextList.map((r) => `${r.id}:${r.updatedAt || ''}:${r.status || ''}`).join('|');
    const cloudConfig = loadState<CloudDbConfig>(STORAGE_KEYS.CLOUD_DB, DEFAULT_CLOUD_DB_CONFIG);
    if (cloudConfig?.enabled !== false && cloudConfig?.supabaseUrl) {
      syncReportsToSupabase(nextList, cloudConfig).catch((err) =>
        console.warn('[useReportManager] Lỗi đồng bộ trực tiếp phiếu lên Cloud:', err)
      );
    }
  };

  // 5. Thêm mới hoặc cập nhật phiếu thông qua Domain State Machine & Phát Event
  const reportsRef = useRef(reports);
  reportsRef.current = reports;

  // Chuẩn hóa tên và ngày sinh phục vụ nhận diện định danh bệnh nhân
  const normalizeIdentityName = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const normalizeIdentityDob = (raw: string | undefined): string => {
    if (!raw) return '';
    return raw.trim().replace(/[^\d]/g, '');
  };

  interface MatchCriteria {
    id?: string;
    code?: string;
    patient?: Patient;
    hasExplicitCode?: boolean;
    allowIdentityMerge?: boolean;
  }

  const findMatchingReportIndex = (
    list: MedicalReport[],
    criteria: MatchCriteria
  ): number => {
    // 1. Đối soát theo ID nếu có
    if (criteria.id) {
      const idx = list.findIndex((r) => r.id === criteria.id);
      if (idx >= 0) return idx;
    }

    // 2. Đối soát theo Mã BN cụ thể (người dùng tự nhập hoặc file có cột mã BN)
    const code = criteria.code || criteria.patient?.code;
    if (criteria.hasExplicitCode && code) {
      const cleanTargetCode = code.trim().toLowerCase();
      const idx = list.findIndex(
        (r) =>
          (r.code && r.code.trim().toLowerCase() === cleanTargetCode) ||
          (r.patient?.code && r.patient.code.trim().toLowerCase() === cleanTargetCode)
      );
      if (idx >= 0) return idx;
    }

    // 3. Chỉ đối soát theo Bộ Ba Định Danh khi được phép gộp (allowIdentityMerge)
    // Áp dụng cho các trường hợp Import hàng loạt từ file Excel không có cột mã BN
    if (criteria.allowIdentityMerge && criteria.patient?.name && criteria.patient?.dob) {
      const targetName = normalizeIdentityName(criteria.patient.name);
      const targetDob = normalizeIdentityDob(criteria.patient.dob);
      const targetGender = criteria.patient.gender;

      if (targetName && targetDob) {
        const idx = list.findIndex((r) => {
          if (!r.patient?.name || !r.patient?.dob) return false;
          const nameMatch = normalizeIdentityName(r.patient.name) === targetName;
          if (!nameMatch) return false;

          const dobMatch = normalizeIdentityDob(r.patient.dob) === targetDob;
          if (!dobMatch) return false;

          if (targetGender && r.patient.gender && targetGender !== r.patient.gender) {
            return false;
          }

          return true;
        });

        if (idx >= 0) return idx;
      }
    }

    return -1;
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
        agg.recordCloudExport(params.cloudPdfUrl, params.qrCodeDataUrl);
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

      if (params.cloudPdfUrl && params.cloudPdfUrl !== existingItem.cloudPdfUrl) {
        agg.recordCloudExport(params.cloudPdfUrl, params.qrCodeDataUrl);
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

    reportsRef.current = nextReports; // Cập nhật ngay ref đồng bộ
    setReports(nextReports);
    syncReportsDirectly(nextReports);

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

    // Cập nhật State và đồng bộ Cloud đúng 1 lần duy nhất sau khi xử lý xong batch
    reportsRef.current = currentList;
    setReports(currentList);
    syncReportsDirectly(currentList);

    return savedList;
  };

  // 7. Cập nhật hàng loạt phiếu (Dùng sau khi chạy batch re-export)
  const bulkUpdateReports = (updatedList: MedicalReport[]) => {
    setReports((prev) => {
      const updatedMap = new Map(updatedList.map((r) => [r.id, r]));
      const next = prev.map((r) => updatedMap.get(r.id) || r);
      reportsRef.current = next;
      syncReportsDirectly(next);
      return next;
    });
  };

  // 8. Xóa 1 phiếu & Phát Event
  const deleteReport = (id: string) => {
    let deletedReportCode: string | undefined;

    setReports((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) deletedReportCode = target.code;
      const next = prev.filter((r) => r.id !== id);
      reportsRef.current = next;
      syncReportsDirectly(next);
      return next;
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
    setReports((prev) => {
      const next = prev.map((r) => {
        if (r.id !== id) return r;
        const agg = LabReportAggregate.fromSnapshot(r);
        agg.updateLegacyStatus(newStatus);
        return agg.toSnapshot();
      });
      reportsRef.current = next;
      syncReportsDirectly(next);
      return next;
    });
  };

  return {
    reports,
    setReports,
    saveOrUpdateReport,
    bulkSaveOrUpdateReports,
    bulkUpdateReports,
    deleteReport,
    clearAllReports,
    updateReportStatus
  };
}
