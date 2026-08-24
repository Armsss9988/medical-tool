import { useState, useEffect, useRef } from 'react';
import { MedicalReport, Patient, SelectedTest, ReportStatus } from '@domain/types';
import { loadData, saveData, loadState } from '@infra/storage';

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

  // 4. Thêm mới hoặc cập nhật phiếu (Tự động tính toán Outdated & Version)
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
    const isAllergen = params.selectedTests.some(
      (t) => (t.category && t.category.includes('Dị Nguyên')) || t.unit === 'IU/mL'
    );

    const nowIso = new Date().toISOString();

    let defaultStatus: ReportStatus = 'Đã có kết quả';
    if (params.cloudPdfUrl) {
      defaultStatus = 'Đã xuất Cloud';
    } else if (params.selectedTests.length === 0 || params.selectedTests.every((t) => !t.result)) {
      defaultStatus = 'Chờ xét nghiệm';
    }

    let returnedReport: MedicalReport | null = null;

    setReports((prev) => {
      const idx = params.id
        ? prev.findIndex((r) => r.id === params.id)
        : prev.findIndex(
            (r) => params.patient.code && (r.code === params.patient.code || r.patient?.code === params.patient.code)
          );

      const existingItem = idx >= 0 ? prev[idx] : null;

      // ─── TÍNH TOÁN TRẠNG THÁI PDF & VERSIONING ──────────────────────────
      const isNewlyExported = !!params.cloudPdfUrl && params.cloudPdfUrl !== existingItem?.cloudPdfUrl;
      const hadPreviousPdf = !!(existingItem?.cloudPdfUrl || existingItem?.pdfGeneratedAt);

      let calcPdfGeneratedAt: string | undefined = existingItem?.pdfGeneratedAt;
      let calcPdfVersion: number | undefined = existingItem?.pdfVersion || (hadPreviousPdf ? 1 : undefined);
      let calcIsOutdated: boolean = false;
      let finalStatus: ReportStatus = params.status || defaultStatus;

      if (params.cloudPdfUrl || isNewlyExported) {
        // Vừa xuất PDF Cloud mới -> Cập nhật version, đánh dấu mới nhất
        calcPdfGeneratedAt = nowIso;
        calcPdfVersion = (existingItem?.pdfVersion || 0) + 1;
        calcIsOutdated = false;
        finalStatus = 'Đã xuất Cloud';
      } else if (hadPreviousPdf) {
        // Đã từng có PDF nhưng giờ chỉ sửa thông tin dữ liệu mà chưa xuất lại PDF
        calcIsOutdated = params.isPdfOutdated !== undefined ? params.isPdfOutdated : true;
        if (calcIsOutdated) {
          finalStatus = 'Cần cập nhật PDF';
        }
      } else if (existingItem) {
        finalStatus = params.status || existingItem.status || defaultStatus;
      }

      if (params.isPdfOutdated !== undefined) {
        calcIsOutdated = params.isPdfOutdated;
      }

      const updatedReport: MedicalReport = {
        id: params.id || (existingItem ? existingItem.id : crypto.randomUUID()),
        code: params.patient.code || `BN-${Date.now()}`,
        sampleCode: params.patient.sampleCode || params.patient.code || `BN-${Date.now()}`,
        createdAt: existingItem ? existingItem.createdAt : nowIso,
        updatedAt: nowIso,
        patient: { ...params.patient },
        doctorName: params.doctorName || 'BS. Trần Hoài Long',
        selectedTests: [...params.selectedTests],
        conclusion: params.conclusion || '',
        isAllergen,
        cloudPdfUrl: params.cloudPdfUrl ?? (existingItem ? existingItem.cloudPdfUrl : undefined),
        qrCodeDataUrl: params.qrCodeDataUrl ?? (existingItem ? existingItem.qrCodeDataUrl : undefined),
        invoiceId: params.invoiceId ?? (existingItem ? existingItem.invoiceId : undefined),
        status: finalStatus,
        testCount: params.selectedTests.length,
        zaloSentAt: params.zaloSentAt ?? (existingItem ? existingItem.zaloSentAt : undefined),
        zaloMsgId: params.zaloMsgId ?? (existingItem ? existingItem.zaloMsgId : undefined),
        pdfGeneratedAt: params.pdfGeneratedAt ?? calcPdfGeneratedAt,
        pdfVersion: params.pdfVersion ?? calcPdfVersion,
        isPdfOutdated: calcIsOutdated
      };

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

    if (returnedReport) {
      return returnedReport;
    }

    return {
      id: params.id || crypto.randomUUID(),
      code: params.patient.code || `BN-${Date.now()}`,
      sampleCode: params.patient.sampleCode || params.patient.code || `BN-${Date.now()}`,
      createdAt: nowIso,
      updatedAt: nowIso,
      patient: { ...params.patient },
      doctorName: params.doctorName || 'BS. Trần Hoài Long',
      selectedTests: [...params.selectedTests],
      conclusion: params.conclusion || '',
      isAllergen,
      cloudPdfUrl: params.cloudPdfUrl,
      qrCodeDataUrl: params.qrCodeDataUrl,
      invoiceId: params.invoiceId,
      status: defaultStatus,
      testCount: params.selectedTests.length,
      zaloSentAt: params.zaloSentAt,
      zaloMsgId: params.zaloMsgId,
      pdfGeneratedAt: params.cloudPdfUrl ? nowIso : undefined,
      pdfVersion: params.cloudPdfUrl ? 1 : undefined,
      isPdfOutdated: false
    };
  };

  // 5. Cập nhật hàng loạt phiếu (Dùng sau khi chạy batch re-export)
  const bulkUpdateReports = (updatedList: MedicalReport[]) => {
    setReports((prev) => {
      const updatedMap = new Map(updatedList.map((r) => [r.id, r]));
      const next = prev.map((r) => updatedMap.get(r.id) || r);
      saveData('medical_reports', next);
      return next;
    });
  };

  // 6. Xóa 1 phiếu
  const deleteReport = (id: string) => {
    setReports((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveData('medical_reports', next);
      return next;
    });
  };

  // 7. Xóa toàn bộ phiếu
  const clearAllReports = () => {
    setReports([]);
    saveData('medical_reports', []);
  };

  // 8. Cập nhật trạng thái phiếu
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
