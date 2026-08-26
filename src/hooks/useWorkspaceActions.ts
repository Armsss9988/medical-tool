import { useMemo, useCallback } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { PatientCode } from '@domain/valueObjects/PatientCode';
import { computePricingWithPackages } from '@domain/pricing';
import type { MedicalReport, TestPackage } from '@domain';
import { resolveDoctorName } from '@domain/reportFactory';

// ─── WORKSPACE ACTIONS HOOK ─────────────────────────────────────────────────
// Encapsulates core CRUD actions on the active workspace:
// - Save report (Create/Update)
// - Load report from Sổ Lưu
// - Duplicate report
// - Clear all (New Patient)
// - Computed pricing & outdated checks

export function useWorkspaceActions(
  testPackages: TestPackage[],
  requestActionWithGuard: (actionName: string, actionFn: () => void) => void,
  resetExport: () => void,
  cloudLink?: string,
  qrCodeDataUrl?: string
) {
  const {
    patient,
    setPatient,
    resetPatient,
    selectedTests,
    setSelectedTests,
    conclusion,
    setConclusion,
    doctorName,
    setDoctorName,
    currentReportId,
    setCurrentReportId,
    currentLoadedReport,
    reports,
    saveOrUpdateReport,
    invoices,
    nameInputRef,
    setAutoFocusName
  } = useWorkspace();

  const { closeReportManager, closeAllModals: _closeAll } = useModal();
  const { showToast } = useToast();

  // 1. COMPUTED: TỔNG PHÍ DỊCH VỤ (ƯU TIÊN GIÁ GÓI)
  const totalFee = useMemo(() => {
    return computePricingWithPackages(
      selectedTests.map((t) => t.code),
      selectedTests,
      testPackages
    ).total;
  }, [selectedTests, testPackages]);

  // 2. COMPUTED: HÓA ĐƠN TƯƠNG ỨNG VỚI PHIẾU ĐANG MỞ
  const currentInvoiceForReport = useMemo(() => {
    if (!currentReportId) return null;
    return (
      invoices.find(
        (inv) =>
          inv.reportId === currentReportId ||
          inv.id === currentLoadedReport?.invoiceId ||
          (currentLoadedReport &&
            Boolean(inv.patientCode && currentLoadedReport.code && inv.patientCode === currentLoadedReport.code) &&
            Boolean(
              inv.patientName &&
                currentLoadedReport.patient.name &&
                inv.patientName.trim().toLowerCase() === currentLoadedReport.patient.name.trim().toLowerCase()
            ))
      ) || null
    );
  }, [invoices, currentReportId, currentLoadedReport]);

  const isCurrentReportPaid = Boolean(currentInvoiceForReport && currentInvoiceForReport.status === 'Đã thanh toán');

  // 3. COMPUTED: PHIẾU CÓ BỊ OUTDATED SO VỚI BẢN PDF CLOUD CŨ KHÔNG
  const isCurrentPdfOutdated = useMemo(() => {
    if (!currentLoadedReport || !currentLoadedReport.cloudPdfUrl) return false;
    if (currentLoadedReport.isPdfOutdated) return true;
    const patientChanged =
      patient.name !== currentLoadedReport.patient.name ||
      patient.dob !== currentLoadedReport.patient.dob ||
      patient.gender !== currentLoadedReport.patient.gender ||
      patient.sampleCode !== currentLoadedReport.patient.sampleCode ||
      (doctorName && doctorName !== currentLoadedReport.doctorName);
    const conclusionChanged = (conclusion || '') !== (currentLoadedReport.conclusion || '');
    const testsChanged =
      selectedTests.length !== currentLoadedReport.selectedTests.length ||
      selectedTests.some((t, i) => {
        const orig = currentLoadedReport.selectedTests[i];
        return !orig || orig.code !== t.code || orig.result !== t.result || orig.note !== t.note;
      });

    return patientChanged || conclusionChanged || testsChanged;
  }, [currentLoadedReport, patient, conclusion, doctorName, selectedTests]);

  // 4. ACTION: LƯU PHIẾU HIỆN TẠI (TỰ ĐỘNG UPDATE HOẶC CREATE)
  const handleSaveCurrentReport = useCallback((): string | null => {
    if (!patient.name.trim()) {
      showToast('Vui lòng nhập họ và tên bệnh nhân trước khi lưu!', 'error');
      return null;
    }
    const saved = saveOrUpdateReport({
      id: currentReportId || undefined,
      patient,
      selectedTests,
      conclusion,
      doctorName: resolveDoctorName(doctorName, patient.doctor),
      cloudPdfUrl: cloudLink || undefined,
      qrCodeDataUrl: qrCodeDataUrl || undefined
    });
    setCurrentReportId(saved.id);
    showToast(`Đã lưu phiếu của bệnh nhân ${saved.patient.name} (${saved.code}) vào Sổ Lưu!`, 'success');
    return saved.id;
  }, [patient, selectedTests, conclusion, doctorName, cloudLink, qrCodeDataUrl, currentReportId, saveOrUpdateReport, setCurrentReportId, showToast]);

  // 5. ACTION: RESET TOÀN BỘ CHO BỆNH NHÂN TIẾP THEO
  const performClearAll = useCallback(() => {
    setCurrentReportId(null);
    const existingCodes = reports.map((r) => r.code || r.patient?.code || '');
    const nextCode = PatientCode.generateNextCode(existingCodes);
    resetPatient(nextCode);
    setSelectedTests([]);
    setConclusion('');
    setDoctorName('');
    resetExport();
    showToast('Đã làm mới thông tin cho bệnh nhân tiếp theo!', 'info');
    setAutoFocusName(false);
    setTimeout(() => {
      setAutoFocusName(true);
      nameInputRef.current?.focus();
    }, 100);
  }, [reports, resetPatient, setSelectedTests, setConclusion, setDoctorName, setCurrentReportId, resetExport, showToast, setAutoFocusName, nameInputRef]);

  const handleClearAll = useCallback(() => {
    requestActionWithGuard('Làm mới phiếu (Bệnh nhân mới)', performClearAll);
  }, [requestActionWithGuard, performClearAll]);

  // 6. ACTION: NẠP PHIẾU ĐÃ LƯU ĐỂ CHỈNH SỬA
  const performLoadReport = useCallback((rep: MedicalReport) => {
    setCurrentReportId(rep.id);
    setPatient({ ...rep.patient });
    setSelectedTests([...rep.selectedTests]);
    setConclusion(rep.conclusion || '');
    setDoctorName(rep.doctorName || '');
    resetExport();
    closeReportManager();
    showToast(`Đã nạp thành công phiếu [${rep.code}] của bệnh nhân ${rep.patient.name} để chỉnh sửa!`, 'success');
  }, [setCurrentReportId, setPatient, setSelectedTests, setConclusion, setDoctorName, resetExport, closeReportManager, showToast]);

  const handleLoadReport = useCallback((rep: MedicalReport) => {
    requestActionWithGuard(`Nạp phiếu [${rep.code}] của bệnh nhân ${rep.patient.name}`, () => performLoadReport(rep));
  }, [requestActionWithGuard, performLoadReport]);

  // 7. ACTION: NHÂN BẢN PHIẾU SANG MÃ MỚI
  const performDuplicateReport = useCallback((rep: MedicalReport) => {
    setCurrentReportId(null);
    const existingCodes = reports.map((r) => r.code || r.patient?.code || '');
    const nextCode = PatientCode.generateNextCode(existingCodes);
    resetPatient(nextCode);
    setSelectedTests([...rep.selectedTests]);
    setConclusion(rep.conclusion || '');
    setDoctorName(rep.doctorName || '');
    resetExport();
    closeReportManager();
    showToast(`Đã nhân bản danh mục chỉ số sang mã mới [${nextCode}]!`, 'info');
  }, [reports, resetPatient, setSelectedTests, setConclusion, setDoctorName, setCurrentReportId, resetExport, closeReportManager, showToast]);

  const handleDuplicateReport = useCallback((rep: MedicalReport) => {
    requestActionWithGuard('Nhân bản danh mục chỉ số sang mã mới', () => performDuplicateReport(rep));
  }, [requestActionWithGuard, performDuplicateReport]);

  return {
    totalFee,
    currentInvoiceForReport,
    isCurrentReportPaid,
    isCurrentPdfOutdated,
    handleSaveCurrentReport,
    handleClearAll,
    handleLoadReport,
    handleDuplicateReport
  };
}
