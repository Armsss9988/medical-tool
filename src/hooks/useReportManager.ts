import { useState, useEffect, useRef } from 'react';
import { MedicalReport, Patient, SelectedTest, ReportStatus, STORAGE_KEYS } from '@domain';
import { hasAllergenTests } from '@domain/allergenDetector';
import { ReportStateMachine } from '@domain/stateMachine/ReportStateMachine';
import { loadData, saveData, loadState } from '@infra/storage';
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
  // 1. Tải danh sách phiếu đã lưu đồng bộ từ Storage ngay từ render đầu tiên
  const [reports, setReports] = useState<MedicalReport[]>(() => {
    return loadState<MedicalReport[]>(STORAGE_KEYS.REPORTS, []);
  });
  const isLoadedRef = useRef(false);

  // 2. Nếu trong môi trường Electron, tải bổ sung từ file hệ thống và merge an toàn
  useEffect(() => {
    async function initReports() {
      try {
        const savedReports = await loadData<MedicalReport[]>(STORAGE_KEYS.REPORTS, []);
        if (Array.isArray(savedReports) && savedReports.length > 0) {
          setReports((prev) => {
            const reportMap = new Map<string, MedicalReport>();
            savedReports.forEach((r) => reportMap.set(r.id, r));
            prev.forEach((r) => {
              if (!reportMap.has(r.id)) {
                reportMap.set(r.id, r);
              }
            });
            return Array.from(reportMap.values());
          });
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách phiếu xét nghiệm:', err);
      } finally {
        isLoadedRef.current = true;
      }
    }
    initReports();
  }, []);

  // 3. Tự động lưu khi danh sách reports thay đổi sau khi đã ready
  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveData(STORAGE_KEYS.REPORTS, reports);
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
          const updated = ReportStateMachine.onPaymentCollected(
            target,
            payload.invoice.id,
            payload.paidAt
          );

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
          const updated = ReportStateMachine.onPaymentVoided(target);

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
          const updated = ReportStateMachine.onPaymentVoided(target);

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

          const updated = ReportStateMachine.onExportCloud(
            prev[idx],
            payload.cloudPdfUrl,
            payload.qrCodeDataUrl
          );
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

          const updated = ReportStateMachine.onSendZalo(prev[idx], payload.msgId);
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

  // 5. Thêm mới hoặc cập nhật phiếu thông qua Domain State Machine & Phát Event
  //    FIX: Compute report update BEFORE setState to avoid closure race condition.
  //    Sử dụng reportsRef để đọc state đồng bộ, tránh side-effect bên trong setState callback.
  const reportsRef = useRef(reports);
  reportsRef.current = reports;

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
  }): MedicalReport => {
    const prev = reportsRef.current;

    // Tìm phiếu hiện có (theo ID hoặc mã bệnh nhân)
    const idx = params.id
      ? prev.findIndex((r) => r.id === params.id)
      : prev.findIndex(
          (r) => params.patient.code && (r.code === params.patient.code || r.patient?.code === params.patient.code)
        );

    const existingItem = idx >= 0 ? prev[idx] : null;
    const isNewReport = !existingItem;

    let updatedReport: MedicalReport;

    if (!existingItem) {
      // Tạo mới thông qua State Machine
      updatedReport = ReportStateMachine.createInitialReport({
        id: params.id,
        code: params.patient.code || `BN-${Date.now()}`,
        sampleCode: params.patient.sampleCode || params.patient.code || `BN-${Date.now()}`,
        patient: params.patient,
        doctorName: params.doctorName,
        selectedTests: params.selectedTests,
        conclusion: params.conclusion,
        isAllergen: hasAllergenTests(params.selectedTests),
        invoiceId: params.invoiceId
      });

      if (params.cloudPdfUrl) {
        updatedReport = ReportStateMachine.onExportCloud(updatedReport, params.cloudPdfUrl, params.qrCodeDataUrl);
      }
    } else {
      // Cập nhật thông qua State Machine
      updatedReport = ReportStateMachine.onUpdateReport(existingItem, {
        patient: params.patient,
        selectedTests: params.selectedTests,
        conclusion: params.conclusion,
        doctorName: params.doctorName,
        cloudPdfUrl: params.cloudPdfUrl ?? existingItem.cloudPdfUrl,
        qrCodeDataUrl: params.qrCodeDataUrl ?? existingItem.qrCodeDataUrl,
        invoiceId: params.invoiceId ?? existingItem.invoiceId,
        zaloSentAt: params.zaloSentAt ?? existingItem.zaloSentAt,
        zaloMsgId: params.zaloMsgId ?? existingItem.zaloMsgId,
        isPdfOutdated: params.isPdfOutdated,
        status: params.status
      });

      if (params.cloudPdfUrl && params.cloudPdfUrl !== existingItem.cloudPdfUrl) {
        updatedReport = ReportStateMachine.onExportCloud(updatedReport, params.cloudPdfUrl, params.qrCodeDataUrl);
      }
    }

    // Update state với report đã computed sẵn (không có side-effect trong callback)
    setReports((currentPrev) => {
      // Re-check index against latest state in case of concurrent updates
      const currentIdx = params.id
        ? currentPrev.findIndex((r) => r.id === params.id)
        : currentPrev.findIndex(
            (r) => params.patient.code && (r.code === params.patient.code || r.patient?.code === params.patient.code)
          );

      if (currentIdx >= 0) {
        const next = [...currentPrev];
        next[currentIdx] = updatedReport;
        return next;
      }
      return [updatedReport, ...currentPrev];
    });

    // Phát Domain Event: REPORT_SAVED (sử dụng report đã computed)
    domainEventBus.emit(REPORT_EVENT_TYPES.SAVED, {
      report: updatedReport,
      isNew: isNewReport
    });

    return updatedReport;
  };

  // 6. Cập nhật hàng loạt phiếu (Dùng sau khi chạy batch re-export)
  const bulkUpdateReports = (updatedList: MedicalReport[]) => {
    setReports((prev) => {
      const updatedMap = new Map(updatedList.map((r) => [r.id, r]));
      return prev.map((r) => updatedMap.get(r.id) || r);
    });
  };

  // 7. Xóa 1 phiếu & Phát Event
  const deleteReport = (id: string) => {
    let deletedReportCode: string | undefined;

    setReports((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) deletedReportCode = target.code;
      return prev.filter((r) => r.id !== id);
    });

    // Phát Domain Event: REPORT_DELETED
    domainEventBus.emit(REPORT_EVENT_TYPES.DELETED, {
      reportId: id,
      reportCode: deletedReportCode
    });
  };

  // 8. Xóa toàn bộ phiếu
  const clearAllReports = () => {
    setReports([]);
  };

  // 9. Cập nhật trạng thái phiếu
  const updateReportStatus = (id: string, newStatus: ReportStatus) => {
    setReports((prev) => {
      return prev.map((r) =>
        r.id === id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r
      );
    });
  };

  return {
    reports,
    saveOrUpdateReport,
    bulkUpdateReports,
    deleteReport,
    clearAllReports,
    updateReportStatus
  };
}
