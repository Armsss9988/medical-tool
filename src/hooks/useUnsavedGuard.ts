import { useMemo, useCallback } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useModal } from '../contexts/ModalContext';

// ─── UNSAVED CHANGES GUARD HOOK ─────────────────────────────────────────────
// Detects dirty/unsaved state and intercepts destructive actions
// (New patient, Load report, Duplicate) with a confirmation dialog.

export function useUnsavedGuard(onSaveCurrentReport: () => string | null) {
  const {
    patient,
    selectedTests,
    conclusion,
    doctorName,
    currentReportId,
    reports
  } = useWorkspace();

  const {
    isUnsavedModalOpen,
    pendingAction,
    openUnsavedModal,
    closeUnsavedModal,
    clearPendingAction
  } = useModal();

  // 1. COMPUTED: PHÁT HIỆN DỮ LIỆU ĐANG CÓ THAY ĐỔI CHƯA LƯU
  const hasUnsavedChanges = useMemo(() => {
    // A. Chế độ tạo phiếu mới (chưa có trong Sổ Lưu)
    if (!currentReportId) {
      const hasName = !!patient.name.trim();
      const hasTests = selectedTests.length > 0;
      const hasConclusion = !!conclusion.trim();
      const hasPhone = !!patient.phone?.trim();
      const hasAddress = !!patient.address?.trim();
      return hasName || hasTests || hasConclusion || hasPhone || hasAddress;
    }

    // B. Chế độ chỉnh sửa phiếu cũ đã nạp
    const orig = reports.find((r) => r.id === currentReportId);
    if (!orig) return false;

    const patientChanged =
      patient.name !== orig.patient.name ||
      patient.dob !== orig.patient.dob ||
      patient.gender !== orig.patient.gender ||
      (patient.phone || '') !== (orig.patient.phone || '') ||
      (patient.address || '') !== (orig.patient.address || '') ||
      (patient.diagnosis || '') !== (orig.patient.diagnosis || '') ||
      (doctorName && doctorName !== orig.doctorName);

    const conclusionChanged = (conclusion || '') !== (orig.conclusion || '');

    const testsChanged =
      selectedTests.length !== orig.selectedTests.length ||
      selectedTests.some((t, i) => {
        const o = orig.selectedTests[i];
        return !o || o.code !== t.code || o.result !== t.result || o.note !== t.note;
      });

    return patientChanged || conclusionChanged || testsChanged;
  }, [currentReportId, patient, selectedTests, conclusion, doctorName, reports]);

  // 2. GUARD HELPER: Chặn và hiển thị modal cảnh báo nếu đang có dữ liệu chưa lưu
  const requestActionWithGuard = useCallback(
    (actionName: string, actionFn: () => void) => {
      if (hasUnsavedChanges) {
        openUnsavedModal(actionName, actionFn);
      } else {
        actionFn();
      }
    },
    [hasUnsavedChanges, openUnsavedModal]
  );

  // 3. HANDLERS FOR UNSAVED CHANGES MODAL ACTIONS
  const handleUnsavedSaveAndProceed = useCallback(() => {
    onSaveCurrentReport();
    if (pendingAction) {
      pendingAction.run();
    }
    clearPendingAction();
    closeUnsavedModal();
  }, [onSaveCurrentReport, pendingAction, clearPendingAction, closeUnsavedModal]);

  const handleUnsavedDiscardAndProceed = useCallback(() => {
    if (pendingAction) {
      pendingAction.run();
    }
    clearPendingAction();
    closeUnsavedModal();
  }, [pendingAction, clearPendingAction, closeUnsavedModal]);

  const handleUnsavedCancel = useCallback(() => {
    clearPendingAction();
    closeUnsavedModal();
  }, [clearPendingAction, closeUnsavedModal]);

  return {
    hasUnsavedChanges,
    isUnsavedModalOpen,
    pendingAction,
    requestActionWithGuard,
    handleUnsavedSaveAndProceed,
    handleUnsavedDiscardAndProceed,
    handleUnsavedCancel
  };
}
