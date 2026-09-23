import { useMemo, useCallback } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { PatientCode } from '@domain/valueObjects/PatientCode';
import { computeReportTotalPrice } from '@domain/pricing';
import type { MedicalReport, TestPackage, Patient } from '@domain';
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
    return computeReportTotalPrice(selectedTests, testPackages);
  }, [selectedTests, testPackages]);

  // 2. COMPUTED: HÓA ĐƠN TƯƠNG ỨNG VỚI PHIẾU ĐANG MỞ
  const currentInvoiceForReport = useMemo(() => {
    if (!currentReportId) return null;
    return (
      invoices.find(
        (inv) =>
          inv.reportId === currentReportId ||
          (currentLoadedReport?.invoiceId && inv.id === currentLoadedReport.invoiceId) ||
          (currentLoadedReport?.code && inv.patientCode === currentLoadedReport.code) ||
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

  // 3. COMPUTED: DANH SÁCH CHI TIẾT CÁC THAY ĐỔI SO VỚI BẢN PDF CLOUD CŨ
  const currentPdfDirtyReasons = useMemo((): string[] => {
    if (!currentLoadedReport || !currentLoadedReport.cloudPdfUrl) return [];

    const diffs: string[] = [];

    // Kiểm tra thông tin bệnh nhân
    if (patient.gender && patient.gender !== currentLoadedReport.patient.gender) {
      diffs.push(`Sửa giới tính: ${currentLoadedReport.patient.gender || '---'} → ${patient.gender}`);
    }
    if (patient.name.trim() && patient.name.trim() !== (currentLoadedReport.patient.name || '').trim()) {
      diffs.push(`Sửa họ tên: "${currentLoadedReport.patient.name || '---'}" → "${patient.name}"`);
    }
    if (patient.dob && patient.dob !== currentLoadedReport.patient.dob) {
      diffs.push(`Sửa năm sinh: ${currentLoadedReport.patient.dob || '---'} → ${patient.dob}`);
    }
    if (patient.phone && patient.phone !== currentLoadedReport.patient.phone) {
      diffs.push(`Sửa SĐT: ${currentLoadedReport.patient.phone || '---'} → ${patient.phone}`);
    }
    if (patient.address && patient.address !== currentLoadedReport.patient.address) {
      diffs.push(`Sửa địa chỉ: "${currentLoadedReport.patient.address || '---'}" → "${patient.address}"`);
    }
    if (patient.diagnosis && patient.diagnosis !== currentLoadedReport.patient.diagnosis) {
      diffs.push(`Sửa chẩn đoán: "${currentLoadedReport.patient.diagnosis || '---'}" → "${patient.diagnosis}"`);
    }
    if ((doctorName || '') !== (currentLoadedReport.doctorName || '')) {
      diffs.push(`Đổi bác sĩ: ${currentLoadedReport.doctorName || '---'} → ${doctorName}`);
    }
    if ((conclusion || '') !== (currentLoadedReport.conclusion || '')) {
      diffs.push(`Sửa kết luận bác sĩ`);
    }

    // Kiểm tra danh sách chỉ số
    for (const oldTest of currentLoadedReport.selectedTests) {
      const cur = selectedTests.find((t) => t.code === oldTest.code);
      if (!cur) {
        diffs.push(`Bỏ chỉ số: ${oldTest.name || oldTest.code}`);
      } else {
        const oldRes = String(oldTest.result ?? '').trim();
        const curRes = String(cur.result ?? '').trim();
        if (oldRes !== curRes) {
          diffs.push(`Đổi kết quả ${oldTest.name || oldTest.code}: ${oldRes || 'trống'} → ${curRes || 'trống'}`);
        } else if ((oldTest.note || '') !== (cur.note || '')) {
          diffs.push(`Sửa ghi chú ${oldTest.name || oldTest.code}`);
        }
      }
    }
    for (const cur of selectedTests) {
      if (!currentLoadedReport.selectedTests.some((t) => t.code === cur.code)) {
        diffs.push(`Thêm chỉ số: ${cur.name || cur.code}`);
      }
    }

    // Nếu không có diff mới ngay lúc này nhưng report đã được lưu với trạng thái OUTDATED
    if (diffs.length === 0 && (currentLoadedReport.isPdfOutdated || currentLoadedReport.status === 'Cần cập nhật PDF')) {
      return currentLoadedReport.dirtyReasons && currentLoadedReport.dirtyReasons.length > 0
        ? currentLoadedReport.dirtyReasons
        : ['Dữ liệu đã được chỉnh sửa sau lần xuất PDF gần nhất'];
    }

    return diffs;
  }, [currentLoadedReport, patient, conclusion, doctorName, selectedTests]);

  const isCurrentPdfOutdated = useMemo(() => {
    if (!currentLoadedReport || !currentLoadedReport.cloudPdfUrl) return false;
    if (currentLoadedReport.isPdfOutdated || currentLoadedReport.status === 'Cần cập nhật PDF') return true;
    return currentPdfDirtyReasons.length > 0;
  }, [currentLoadedReport, currentPdfDirtyReasons]);

  // 4. ACTION: LƯU PHIẾU HIỆN TẠI (TỰ ĐỘNG UPDATE HOẶC CREATE)
  const handleSaveCurrentReport = useCallback((): string | null => {
    if (!patient.name.trim()) {
      showToast('Vui lòng nhập họ và tên bệnh nhân trước khi lưu!', 'error');
      return null;
    }

    // Bảo đảm SSOT: Nếu hóa đơn tương ứng đã thanh toán, đồng bộ paidAt cho bệnh nhân
    const resolvedPaidAt = patient.paidAt || (isCurrentReportPaid ? (currentInvoiceForReport?.paidAt || new Date().toISOString()) : undefined);
    const resolvedPatient = resolvedPaidAt !== patient.paidAt ? { ...patient, paidAt: resolvedPaidAt } : patient;
    if (resolvedPaidAt !== patient.paidAt) {
      setPatient(resolvedPatient);
    }

    // Chống ghi đè ca cũ: nếu mã phiếu hiện tại khác mã của phiếu đã tải trước đó, tạo phiếu mới
    const isCodeMismatch = Boolean(
      currentLoadedReport?.code &&
      resolvedPatient.code &&
      currentLoadedReport.code.trim().toLowerCase() !== resolvedPatient.code.trim().toLowerCase()
    );
    const effectiveReportId = isCodeMismatch ? undefined : (currentReportId || undefined);

    const saved = saveOrUpdateReport({
      id: effectiveReportId,
      patient: resolvedPatient,
      selectedTests,
      conclusion,
      doctorName: resolveDoctorName(doctorName, patient.doctor),
      cloudPdfUrl: cloudLink || undefined,
      qrCodeDataUrl: qrCodeDataUrl || undefined,
      invoiceId: currentInvoiceForReport?.id
    });
    setCurrentReportId(saved.id);
    showToast(`Đã lưu phiếu của bệnh nhân ${saved.patient.name} (${saved.code}) vào Sổ Lưu!`, 'success');
    return saved.id;
  }, [
    patient,
    selectedTests,
    conclusion,
    doctorName,
    cloudLink,
    qrCodeDataUrl,
    currentReportId,
    saveOrUpdateReport,
    setCurrentReportId,
    showToast,
    isCurrentReportPaid,
    currentInvoiceForReport,
    currentLoadedReport,
    setPatient
  ]);

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

    // Trích xuất an toàn dữ liệu bệnh nhân từ report (hỗ trợ mọi phiên bản dữ liệu lưu trữ)
    const rawPatient = (rep.patient || {}) as Partial<Patient>;
    const rawRep = rep as unknown as Record<string, unknown>;

    // Tra cứu hóa đơn liên kết để bảo toàn SSOT tình trạng thanh toán
    const matchingInv = invoices.find(
      (inv) =>
        inv.reportId === rep.id ||
        (rep.invoiceId && inv.id === rep.invoiceId) ||
        (rep.code && inv.patientCode === rep.code) ||
        (rawPatient.code && inv.patientCode === rawPatient.code)
    );
    const isMatchingInvPaid = Boolean(matchingInv && matchingInv.status === 'Đã thanh toán');
    const resolvedPaidAt = rawPatient.paidAt || (rawRep.paidAt as string) || (isMatchingInvPaid ? (matchingInv?.paidAt || matchingInv?.createdAt || new Date().toISOString()) : undefined);

    const safePatient: Patient = {
      code: rawPatient.code || rep.code || rep.sampleCode || (rawRep.code as string) || 'BN-GOLAB',
      secretToken: rawPatient.secretToken || (rawRep.secretToken as string) || 'GOLAB',
      name: rawPatient.name || (rawRep.patientName as string) || (rawRep.name as string) || '',
      dob: rawPatient.dob || (rawRep.patientDob as string) || (rawRep.dob as string) || '',
      gender: rawPatient.gender || (rawRep.patientGender as Patient['gender']) || (rawRep.gender as Patient['gender']) || 'Nam',
      phone: rawPatient.phone || (rawRep.patientPhone as string) || (rawRep.phone as string) || '',
      address: rawPatient.address || (rawRep.patientAddress as string) || (rawRep.address as string) || '',
      diagnosis: rawPatient.diagnosis || (rawRep.patientDiagnosis as string) || (rawRep.diagnosis as string) || '',
      sampleCode: rawPatient.sampleCode || rep.sampleCode || rep.code || (rawRep.sampleCode as string) || 'BN-GOLAB',
      sampleStatus: rawPatient.sampleStatus || (rawRep.sampleStatus as string) || 'Đạt',
      orderedAt: rawPatient.orderedAt || rep.createdAt || '',
      paidAt: resolvedPaidAt,
      receivedAt: rawPatient.receivedAt || rep.createdAt || '',
      returnedAt: rawPatient.returnedAt || rep.createdAt || '',
      doctor: rawPatient.doctor || rep.doctorName || (rawRep.doctor as string) || ''
    };

    setPatient(safePatient);
    setSelectedTests(Array.isArray(rep.selectedTests) ? [...rep.selectedTests] : []);
    setConclusion(rep.conclusion || '');
    setDoctorName(rep.doctorName || safePatient.doctor || '');
    resetExport();
    closeReportManager();
    showToast(`Đã nạp thành công phiếu [${safePatient.code}] của bệnh nhân ${safePatient.name || 'chưa đặt tên'} để chỉnh sửa!`, 'success');
  }, [invoices, setCurrentReportId, setPatient, setSelectedTests, setConclusion, setDoctorName, resetExport, closeReportManager, showToast]);

  const handleLoadReport = useCallback((rep: MedicalReport) => {
    const rawPatient = (rep.patient || {}) as Partial<Patient>;
    const rawRep = rep as unknown as Record<string, unknown>;
    const pName = rawPatient.name || (rawRep.patientName as string) || (rawRep.name as string) || 'Bệnh nhân';
    const pCode = rawPatient.code || rep.code || 'BN';
    requestActionWithGuard(`Nạp phiếu [${pCode}] của bệnh nhân ${pName}`, () => performLoadReport(rep));
  }, [requestActionWithGuard, performLoadReport]);

  // 7. ACTION: NHÂN BẢN PHIẾU SANG MÃ MỚI
  const performDuplicateReport = useCallback((rep: MedicalReport) => {
    setCurrentReportId(null);
    const existingCodes = reports.map((r) => r.code || r.patient?.code || '');
    const nextCode = PatientCode.generateNextCode(existingCodes);
    resetPatient(nextCode);
    setSelectedTests(Array.isArray(rep.selectedTests) ? [...rep.selectedTests] : []);
    setConclusion(rep.conclusion || '');
    setDoctorName(rep.doctorName || rep.patient?.doctor || '');
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
    currentPdfDirtyReasons,
    handleSaveCurrentReport,
    handleClearAll,
    handleLoadReport,
    handleDuplicateReport
  };
}
