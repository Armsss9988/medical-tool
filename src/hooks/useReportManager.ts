import { useState, useEffect, useRef } from 'react';
import { MedicalReport, Patient, SelectedTest, ReportStatus } from '@domain/types';
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
    return loadState<MedicalReport[]>('medical_reports', []);
  });
  const isLoadedRef = useRef(true);

  // 2. Nếu trong môi trường Electron, tải bổ sung từ file hệ thống
  useEffect(() => {
    async function initReports() {
      try {
        const savedReports = await loadData<MedicalReport[]>('medical_reports', []);
        if (Array.isArray(savedReports) && savedReports.length > 0) {
          setReports(savedReports);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách phiếu xét nghiệm:', err);
      }
    }
    initReports();
  }, []);

  // 3. Tự động lưu khi danh sách reports thay đổi
  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveData('medical_reports', reports);
  }, [reports]);

  // 4. LẮNG NGHE DOMAIN EVENTS ĐỂ TỰ ĐỘNG ĐỒNG BỘ HIỆU ỨNG LIÊN ĐỚI (CASCADE SYNC)
  useEffect(() => {
    // 4.1. Khi Hóa đơn được thanh toán -> Cập nhật trạng thái phiếu sang Đã thu
    const unsubPaid = domainEventBus.subscribe<InvoicePaidPayload>(
      INVOICE_EVENT_TYPES.PAID,
      ({ payload }) => {
        setReports((prev) => {
          const targetReportId = payload.reportId || payload.invoice.reportId;
          const targetIndex = prev.findIndex(
            (r) =>
              (targetReportId && r.id === targetReportId) ||
              (payload.invoice.id && r.invoiceId === payload.invoice.id) ||
              (payload.invoice.patientCode && r.code === payload.invoice.patientCode)
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
          saveData('medical_reports', next);
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
              r.invoiceId === payload.invoiceId ||
              (payload.reportId && r.id === payload.reportId)
          );
          if (targetIndex < 0) return prev;

          const target = prev[targetIndex];
          const updated = ReportStateMachine.onPaymentVoided(target);

          const next = [...prev];
          next[targetIndex] = updated;
          saveData('medical_reports', next);
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
              r.invoiceId === payload.invoiceId ||
              (payload.reportId && r.id === payload.reportId)
          );
          if (targetIndex < 0) return prev;

          const target = prev[targetIndex];
          const updated = ReportStateMachine.onPaymentVoided(target);

          const next = [...prev];
          next[targetIndex] = updated;
          saveData('medical_reports', next);
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
          saveData('medical_reports', next);
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
          saveData('medical_reports', next);
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
    let returnedReport: MedicalReport | null = null;
    let isNewReport = false;

    setReports((prev) => {
      const idx = params.id
        ? prev.findIndex((r) => r.id === params.id)
        : prev.findIndex(
            (r) => params.patient.code && (r.code === params.patient.code || r.patient?.code === params.patient.code)
          );

      const existingItem = idx >= 0 ? prev[idx] : null;
      isNewReport = !existingItem;

      let updatedReport: MedicalReport;

      if (!existingItem) {
        // Tạo mới thông qua State Machine
        const isAllergen = params.selectedTests.some(
          (t) => (t.category && t.category.includes('Dị Nguyên')) || t.unit === 'IU/mL'
        );
        updatedReport = ReportStateMachine.createInitialReport({
          id: params.id,
          code: params.patient.code || `BN-${Date.now()}`,
          sampleCode: params.patient.sampleCode || params.patient.code || `BN-${Date.now()}`,
          patient: params.patient,
          doctorName: params.doctorName,
          selectedTests: params.selectedTests,
          conclusion: params.conclusion,
          isAllergen,
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

      returnedReport = updatedReport;

      let next: MedicalReport[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = updatedReport;
      } else {
        next = [updatedReport, ...prev];
      }
      saveData('medical_reports', next);
      return next;
    });

    const finalReport = returnedReport || ReportStateMachine.createInitialReport({
      id: params.id,
      code: params.patient.code || `BN-${Date.now()}`,
      sampleCode: params.patient.sampleCode || params.patient.code || `BN-${Date.now()}`,
      patient: params.patient,
      doctorName: params.doctorName,
      selectedTests: params.selectedTests,
      conclusion: params.conclusion,
      invoiceId: params.invoiceId
    });

    // Phát Domain Event: REPORT_SAVED
    domainEventBus.emit(REPORT_EVENT_TYPES.SAVED, {
      report: finalReport,
      isNew: isNewReport
    });

    return finalReport;
  };

  // 6. Cập nhật hàng loạt phiếu (Dùng sau khi chạy batch re-export)
  const bulkUpdateReports = (updatedList: MedicalReport[]) => {
    setReports((prev) => {
      const updatedMap = new Map(updatedList.map((r) => [r.id, r]));
      const next = prev.map((r) => updatedMap.get(r.id) || r);
      saveData('medical_reports', next);
      return next;
    });
  };

  // 7. Xóa 1 phiếu & Phát Event
  const deleteReport = (id: string) => {
    let deletedReportCode: string | undefined;

    setReports((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) deletedReportCode = target.code;
      const next = prev.filter((r) => r.id !== id);
      saveData('medical_reports', next);
      return next;
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
    saveData('medical_reports', []);
  };

  // 9. Cập nhật trạng thái phiếu
  const updateReportStatus = (id: string, newStatus: ReportStatus) => {
    setReports((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r
      );
      saveData('medical_reports', next);
      return next;
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
