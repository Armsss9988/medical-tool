import { useCallback } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { PRINT_ELEMENT_ID, REPORT_STATUS } from '@domain/constants';
import { hasAllergenTests, hasMixedTests } from '@domain/allergenDetector';
import { buildCurrentReport, resolveDoctorName } from '@domain/reportFactory';
import { generateZaloTextMessage, openZaloChat } from '@infra/zaloService';
import type { ClinicInfo, MedicalReport, ToastType } from '@domain';
import type { useReportExport } from './useReportExport';

// ─── EXPORT ACTIONS HOOK ────────────────────────────────────────────────────
// Handles PDF export transactions, direct downloads, and Zalo integrations.

export function useExportActions(
  clinicInfo: ClinicInfo,
  exportHook: ReturnType<typeof useReportExport>,
  onSaveCurrentReport: () => string | null
) {
  const {
    patient,
    selectedTests,
    conclusion,
    doctorName,
    setCurrentReportId,
    reports,
    saveOrUpdateReport
  } = useWorkspace();

  const { openZaloModal } = useModal();
  const { showToast } = useToast();

  const {
    cloudLink,
    qrCodeDataUrl,
    handleExportPdfAndUploadCloud,
    handleDownloadPdf,
    handleDownloadQrCode
  } = exportHook;

  // 1. ACTION: XUẤT PDF & TẢI LÊN CLOUD (TRANSACTION PIPELINE)
  const handleExportPdfAndUpload = useCallback(async () => {
    const reportId = onSaveCurrentReport();
    if (!reportId) return;

    const isMixed = hasMixedTests(selectedTests);
    const isAllergenOnly = !isMixed && hasAllergenTests(selectedTests);
    const elementId = isAllergenOnly ? PRINT_ELEMENT_ID.ALLERGEN_REPORT : PRINT_ELEMENT_ID.MEDICAL_REPORT;
    const filename = `PhieuXN_${(patient.name || 'BenhNhan').replace(/\s+/g, '_')}_${patient.code}.pdf`;

    const result = await handleExportPdfAndUploadCloud(
      elementId,
      filename,
      patient.code,
      patient.name
    );

    if (result && result.success) {
      const saved = saveOrUpdateReport({
        id: reportId,
        patient,
        selectedTests,
        conclusion,
        doctorName: resolveDoctorName(doctorName, patient.doctor),
        cloudPdfUrl: result.finalUrl || undefined,
        qrCodeDataUrl: result.finalQrCodeDataUrl || undefined,
        status: REPORT_STATUS.EXPORTED
      });
      setCurrentReportId(saved.id);
      showToast(`Đã xuất Cloud & cập nhật phiếu bệnh nhân ${saved.patient.name} (${saved.code}) trong Sổ Lưu!`, 'success');
    }
  }, [
    onSaveCurrentReport,
    selectedTests,
    patient,
    doctorName,
    conclusion,
    handleExportPdfAndUploadCloud,
    saveOrUpdateReport,
    setCurrentReportId,
    showToast
  ]);

  // 2. ACTION: TẢI FILE PDF TRỰC TIẾP VỀ MÁY
  const handleDownloadPdfDirect = useCallback(() => {
    const isMixed = hasMixedTests(selectedTests);
    const isAllergenOnly = !isMixed && hasAllergenTests(selectedTests);
    const elementId = isAllergenOnly ? PRINT_ELEMENT_ID.ALLERGEN_REPORT : PRINT_ELEMENT_ID.MEDICAL_REPORT;
    const filename = `PhieuXN_${(patient.name || 'BenhNhan').replace(/\s+/g, '_')}_${patient.code}.pdf`;
    handleDownloadPdf(elementId, filename);
  }, [selectedTests, patient, handleDownloadPdf]);

  // 3. ACTION: GỬI KẾT QUẢ TRỰC TIẾP QUA ZALO CHAT / WEB
  const handleDirectSendZalo = useCallback(async () => {
    if (!patient.phone || !patient.phone.trim()) {
      showToast('Bệnh nhân chưa có số điện thoại! Đang mở cửa sổ Zalo để nhập SĐT...', 'info');
      const currentRep = buildCurrentReport({
        patient,
        selectedTests,
        conclusion,
        doctorName,
        cloudPdfUrl: cloudLink || undefined,
        qrCodeDataUrl: qrCodeDataUrl || undefined
      });
      openZaloModal(currentRep);
      return;
    }

    const reportId = onSaveCurrentReport();
    if (!reportId) return;

    const currentReport = buildCurrentReport({
      id: reportId,
      patient,
      selectedTests,
      conclusion,
      doctorName,
      cloudPdfUrl: cloudLink || undefined,
      qrCodeDataUrl: qrCodeDataUrl || undefined
    });

    const message = generateZaloTextMessage(currentReport, clinicInfo, currentReport.cloudPdfUrl);
    const success = await openZaloChat(patient.phone, message);

    if (success) {
      saveOrUpdateReport({
        id: reportId,
        patient,
        selectedTests,
        conclusion,
        doctorName: resolveDoctorName(doctorName, patient.doctor),
        cloudPdfUrl: cloudLink || undefined,
        qrCodeDataUrl: qrCodeDataUrl || undefined,
        zaloSentAt: new Date().toISOString()
      });
      showToast(`Đã sao chép nội dung & mở Zalo gửi tới SĐT: ${patient.phone}`, 'success');
    } else {
      showToast('Không thể mở Zalo. Vui lòng kiểm tra lại số điện thoại!', 'error' as ToastType);
    }
  }, [
    patient,
    selectedTests,
    conclusion,
    doctorName,
    cloudLink,
    qrCodeDataUrl,
    clinicInfo,
    onSaveCurrentReport,
    openZaloModal,
    saveOrUpdateReport,
    showToast
  ]);

  // 4. ACTION: MỞ MODAL ZALO CHO PHIẾU HIỆN TẠI
  const handleOpenZaloModal = useCallback(() => {
    const currentRep = buildCurrentReport({
      patient,
      selectedTests,
      conclusion,
      doctorName,
      cloudPdfUrl: cloudLink || undefined,
      qrCodeDataUrl: qrCodeDataUrl || undefined
    });
    openZaloModal(currentRep);
  }, [patient, selectedTests, conclusion, doctorName, cloudLink, qrCodeDataUrl, openZaloModal]);

  // 5. ACTION: MỞ MODAL ZALO CHO PHIẾU ĐÃ LƯU TỪ SỔ LƯU
  const handleOpenZaloModalForReport = useCallback((report: MedicalReport) => {
    openZaloModal(report);
  }, [openZaloModal]);

  // 6. ACTION: XỬ LÝ KHI GỬI ZNS THÀNH CÔNG
  const handleZnsSuccess = useCallback((reportCode: string) => {
    const rep = reports.find((r) => r.code === reportCode);
    if (rep) {
      saveOrUpdateReport({
        ...rep,
        zaloSentAt: new Date().toISOString()
      });
    }
    showToast(`Đã gửi tin nhắn Zalo ZNS thành công tới phiếu ${reportCode}!`, 'success');
  }, [reports, saveOrUpdateReport, showToast]);

  const handlePrintDirect = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadQrCodeDirect = useCallback(() => {
    handleDownloadQrCode(patient.name, patient.code);
  }, [patient, handleDownloadQrCode]);

  return {
    handleExportPdfAndUpload,
    handleDownloadPdfDirect,
    handleDirectSendZalo,
    handleOpenZaloModal,
    handleOpenZaloModalForReport,
    handleZnsSuccess,
    handlePrintDirect,
    handleDownloadQrCodeDirect
  };
}
