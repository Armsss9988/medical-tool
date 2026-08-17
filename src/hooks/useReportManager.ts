import { useState, useEffect, useRef } from 'react';
import { MedicalReport, Patient, SelectedTest, ReportStatus } from '@domain/types';
import { loadData, saveData } from '@infra/storage';

export function useReportManager() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const isLoadedRef = useRef(false);

  // 1. Tải danh sách phiếu đã lưu khi khởi động
  useEffect(() => {
    async function initReports() {
      try {
        const savedReports = await loadData<MedicalReport[]>('medical_reports', []);
        if (Array.isArray(savedReports)) {
          setReports(savedReports);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách phiếu xét nghiệm:', err);
      } finally {
        isLoadedRef.current = true;
      }
    }
    initReports();
  }, []);

  // 2. Tự động lưu khi danh sách reports thay đổi
  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveData('medical_reports', reports);
  }, [reports]);

  // 3. Thêm mới hoặc cập nhật phiếu
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
  }): MedicalReport => {
    const isAllergen = params.selectedTests.some(
      (t) => (t.category && t.category.includes('Dị Nguyên')) || t.unit === 'IU/mL'
    );

    const nowIso = new Date().toISOString();
    const existingIndex = params.id
      ? reports.findIndex((r) => r.id === params.id)
      : reports.findIndex((r) => r.code === params.patient.code);

    let defaultStatus: ReportStatus = 'Đã có kết quả';
    if (params.cloudPdfUrl) {
      defaultStatus = 'Đã xuất Cloud';
    } else if (params.selectedTests.length === 0 || params.selectedTests.every((t) => !t.result)) {
      defaultStatus = 'Chờ xét nghiệm';
    }

    const finalStatus: ReportStatus = params.status || (existingIndex >= 0 ? reports[existingIndex].status : defaultStatus);

    const updatedReport: MedicalReport = {
      id: params.id || (existingIndex >= 0 ? reports[existingIndex].id : crypto.randomUUID()),
      code: params.patient.code || `BN-${Date.now()}`,
      sampleCode: params.patient.sampleCode || params.patient.code || `BN-${Date.now()}`,
      createdAt: existingIndex >= 0 ? reports[existingIndex].createdAt : nowIso,
      updatedAt: nowIso,
      patient: { ...params.patient },
      doctorName: params.doctorName || 'BS. Trần Hoài Long',
      selectedTests: [...params.selectedTests],
      conclusion: params.conclusion || '',
      isAllergen,
      cloudPdfUrl: params.cloudPdfUrl ?? (existingIndex >= 0 ? reports[existingIndex].cloudPdfUrl : undefined),
      qrCodeDataUrl: params.qrCodeDataUrl ?? (existingIndex >= 0 ? reports[existingIndex].qrCodeDataUrl : undefined),
      invoiceId: params.invoiceId ?? (existingIndex >= 0 ? reports[existingIndex].invoiceId : undefined),
      status: finalStatus,
      testCount: params.selectedTests.length,
      zaloSentAt: params.zaloSentAt ?? (existingIndex >= 0 ? reports[existingIndex].zaloSentAt : undefined),
      zaloMsgId: params.zaloMsgId ?? (existingIndex >= 0 ? reports[existingIndex].zaloMsgId : undefined)
    };

    setReports((prev) => {
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = updatedReport;
        return next;
      } else {
        return [updatedReport, ...prev];
      }
    });

    return updatedReport;
  };

  // 4. Xóa 1 phiếu
  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  // 5. Xóa toàn bộ phiếu
  const clearAllReports = () => {
    setReports([]);
  };

  // 6. Cập nhật trạng thái phiếu
  const updateReportStatus = (id: string, newStatus: ReportStatus) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r))
    );
  };

  return {
    reports,
    saveOrUpdateReport,
    deleteReport,
    clearAllReports,
    updateReportStatus
  };
}
