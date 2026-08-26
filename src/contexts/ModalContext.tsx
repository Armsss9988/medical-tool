import { createContext, useState, useContext, useCallback, type ReactNode } from 'react';
import type { MedicalReport, CatalogTabType } from '@domain';

// ─── MODAL CONTEXT ──────────────────────────────────────────────────────────
// Quản lý 9 modal open/close states tập trung.
// RULE: Không nên thêm useState cho modal trực tiếp vào App.tsx.
//       Dùng useModal() hook.

interface ModalState {
  isPreviewOpen: boolean;
  previewTargetReport: MedicalReport | null;
  isSettingsOpen: boolean;
  isCatalogModalOpen: boolean;
  catalogModalTargetTab: CatalogTabType | null;
  isInvoiceModalOpen: boolean;
  isRevenueModalOpen: boolean;
  isReportManagerOpen: boolean;
  isZaloModalOpen: boolean;
  zaloTargetReport: MedicalReport | null;
  isBatchExportModalOpen: boolean;
  isUnsavedModalOpen: boolean;
  pendingAction: { name: string; run: () => void } | null;
}

interface ModalContextValue extends ModalState {
  // Preview
  openPreview: (targetReport?: MedicalReport | null) => void;
  closePreview: () => void;

  // Settings
  openSettings: () => void;
  closeSettings: () => void;

  // Catalog
  openCatalogModal: (tab?: CatalogTabType) => void;
  closeCatalogModal: () => void;

  // Invoice
  openInvoiceModal: () => void;
  closeInvoiceModal: () => void;

  // Revenue
  openRevenueModal: () => void;
  closeRevenueModal: () => void;

  // Report Manager
  openReportManager: () => void;
  closeReportManager: () => void;

  // Zalo
  openZaloModal: (targetReport: MedicalReport) => void;
  closeZaloModal: () => void;

  // Batch Export
  openBatchExportModal: () => void;
  closeBatchExportModal: () => void;

  // Unsaved Guard
  openUnsavedModal: (actionName: string, actionFn: () => void) => void;
  closeUnsavedModal: () => void;
  clearPendingAction: () => void;

  // Utility
  isAnyModalOpen: boolean;
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within <ModalProvider>');
  return ctx;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  // Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTargetReport, setPreviewTargetReport] = useState<MedicalReport | null>(null);

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Catalog
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogModalTargetTab, setCatalogModalTargetTab] = useState<CatalogTabType | null>(null);

  // Invoice
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Revenue
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);

  // Report Manager
  const [isReportManagerOpen, setIsReportManagerOpen] = useState(false);

  // Zalo
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false);
  const [zaloTargetReport, setZaloTargetReport] = useState<MedicalReport | null>(null);

  // Batch Export
  const [isBatchExportModalOpen, setIsBatchExportModalOpen] = useState(false);

  // Unsaved Guard
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ name: string; run: () => void } | null>(null);

  // Computed
  const isAnyModalOpen =
    isUnsavedModalOpen || isPreviewOpen || isSettingsOpen ||
    isCatalogModalOpen || isInvoiceModalOpen || isRevenueModalOpen ||
    isReportManagerOpen || isZaloModalOpen || isBatchExportModalOpen;

  // Actions
  const openPreview = useCallback((targetReport?: MedicalReport | null) => {
    setPreviewTargetReport(targetReport || null);
    setIsPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewTargetReport(null);
  }, []);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const openCatalogModal = useCallback((tab?: CatalogTabType) => {
    setCatalogModalTargetTab(tab || null);
    setIsCatalogModalOpen(true);
  }, []);
  const closeCatalogModal = useCallback(() => setIsCatalogModalOpen(false), []);

  const openInvoiceModal = useCallback(() => setIsInvoiceModalOpen(true), []);
  const closeInvoiceModal = useCallback(() => setIsInvoiceModalOpen(false), []);

  const openRevenueModal = useCallback(() => setIsRevenueModalOpen(true), []);
  const closeRevenueModal = useCallback(() => setIsRevenueModalOpen(false), []);

  const openReportManager = useCallback(() => setIsReportManagerOpen(true), []);
  const closeReportManager = useCallback(() => setIsReportManagerOpen(false), []);

  const openZaloModal = useCallback((targetReport: MedicalReport) => {
    setZaloTargetReport(targetReport);
    setIsZaloModalOpen(true);
  }, []);
  const closeZaloModal = useCallback(() => {
    setIsZaloModalOpen(false);
    setZaloTargetReport(null);
  }, []);

  const openBatchExportModal = useCallback(() => setIsBatchExportModalOpen(true), []);
  const closeBatchExportModal = useCallback(() => setIsBatchExportModalOpen(false), []);

  const openUnsavedModal = useCallback((actionName: string, actionFn: () => void) => {
    setPendingAction({ name: actionName, run: actionFn });
    setIsUnsavedModalOpen(true);
  }, []);
  const closeUnsavedModal = useCallback(() => {
    setPendingAction(null);
    setIsUnsavedModalOpen(false);
  }, []);
  const clearPendingAction = useCallback(() => setPendingAction(null), []);

  const closeAllModals = useCallback(() => {
    if (isUnsavedModalOpen) { closeUnsavedModal(); return; }
    if (isPreviewOpen) { closePreview(); return; }
    if (isSettingsOpen) { closeSettings(); return; }
    if (isCatalogModalOpen) { closeCatalogModal(); return; }
    if (isInvoiceModalOpen) { closeInvoiceModal(); return; }
    if (isRevenueModalOpen) { closeRevenueModal(); return; }
    if (isReportManagerOpen) { closeReportManager(); return; }
    if (isZaloModalOpen) { closeZaloModal(); return; }
    if (isBatchExportModalOpen) { closeBatchExportModal(); return; }
  }, [
    isUnsavedModalOpen, isPreviewOpen, isSettingsOpen, isCatalogModalOpen,
    isInvoiceModalOpen, isRevenueModalOpen, isReportManagerOpen,
    isZaloModalOpen, isBatchExportModalOpen,
    closeUnsavedModal, closePreview, closeSettings, closeCatalogModal,
    closeInvoiceModal, closeRevenueModal, closeReportManager,
    closeZaloModal, closeBatchExportModal
  ]);

  const value: ModalContextValue = {
    // State
    isPreviewOpen, previewTargetReport,
    isSettingsOpen,
    isCatalogModalOpen, catalogModalTargetTab,
    isInvoiceModalOpen,
    isRevenueModalOpen,
    isReportManagerOpen,
    isZaloModalOpen, zaloTargetReport,
    isBatchExportModalOpen,
    isUnsavedModalOpen, pendingAction,
    // Computed
    isAnyModalOpen,
    // Actions
    openPreview, closePreview,
    openSettings, closeSettings,
    openCatalogModal, closeCatalogModal,
    openInvoiceModal, closeInvoiceModal,
    openRevenueModal, closeRevenueModal,
    openReportManager, closeReportManager,
    openZaloModal, closeZaloModal,
    openBatchExportModal, closeBatchExportModal,
    openUnsavedModal, closeUnsavedModal, clearPendingAction,
    closeAllModals,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}
