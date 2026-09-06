import { useCallback } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useModal } from '../contexts/ModalContext';

// ─── UNSAVED CHANGES GUARD HOOK ─────────────────────────────────────────────
// Detects dirty/unsaved state and intercepts destructive actions
// (New patient, Load report, Duplicate) with a confirmation dialog.

export function useUnsavedGuard(onSaveCurrentReport: () => string | null) {
  const { hasUnsavedData } = useWorkspace();

  const {
    isUnsavedModalOpen,
    pendingAction,
    openUnsavedModal,
    closeUnsavedModal,
    clearPendingAction
  } = useModal();

  // 1. COMPUTED: Sử dụng trực tiếp dirty state từ WorkspaceContext (DRY, đồng bộ với beforeunload)
  const hasUnsavedChanges = hasUnsavedData;

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
