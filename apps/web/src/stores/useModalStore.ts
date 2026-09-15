import { create } from 'zustand';
import type { MedicalReport, CatalogTabType, AiTemplateTarget } from '@domain';

export interface ModalState {
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
  isTemplateBuilderOpen: boolean;
  isAiSmartFillModalOpen: boolean;
  aiSmartFillTarget: AiTemplateTarget;
  isUnsavedModalOpen: boolean;
  pendingAction: { name: string; run: () => void } | null;
}

export interface ModalActions {
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

  // AI Smart Fill
  openAiSmartFillModal: (target?: AiTemplateTarget) => void;
  closeAiSmartFillModal: () => void;

  // Template Builder
  openTemplateBuilder: () => void;
  closeTemplateBuilder: () => void;

  // Unsaved Guard
  openUnsavedModal: (actionName: string, actionFn: () => void) => void;
  closeUnsavedModal: () => void;
  clearPendingAction: () => void;

  // Utility
  isAnyModalOpen: () => boolean;
  closeAllModals: () => void;
}

export type ModalStore = ModalState & ModalActions;

const initialState: ModalState = {
  isPreviewOpen: false,
  previewTargetReport: null,
  isSettingsOpen: false,
  isCatalogModalOpen: false,
  catalogModalTargetTab: null,
  isInvoiceModalOpen: false,
  isRevenueModalOpen: false,
  isReportManagerOpen: false,
  isZaloModalOpen: false,
  zaloTargetReport: null,
  isBatchExportModalOpen: false,
  isTemplateBuilderOpen: false,
  isAiSmartFillModalOpen: false,
  aiSmartFillTarget: 'CATALOG_ITEMS',
  isUnsavedModalOpen: false,
  pendingAction: null,
};

export const useModalStore = create<ModalStore>((set, get) => ({
  ...initialState,

  openPreview: (targetReport?: MedicalReport | null) =>
    set({ isPreviewOpen: true, previewTargetReport: targetReport || null }),

  closePreview: () =>
    set({ isPreviewOpen: false, previewTargetReport: null }),

  openSettings: () =>
    set({ isSettingsOpen: true }),

  closeSettings: () =>
    set({ isSettingsOpen: false }),

  openCatalogModal: (tab?: CatalogTabType) =>
    set({ isCatalogModalOpen: true, catalogModalTargetTab: tab || null }),

  closeCatalogModal: () =>
    set({ isCatalogModalOpen: false, catalogModalTargetTab: null }),

  openInvoiceModal: () =>
    set({ isInvoiceModalOpen: true }),

  closeInvoiceModal: () =>
    set({ isInvoiceModalOpen: false }),

  openRevenueModal: () =>
    set({ isRevenueModalOpen: true }),

  closeRevenueModal: () =>
    set({ isRevenueModalOpen: false }),

  openReportManager: () =>
    set({ isReportManagerOpen: true }),

  closeReportManager: () =>
    set({ isReportManagerOpen: false }),

  openZaloModal: (targetReport: MedicalReport) =>
    set({ isZaloModalOpen: true, zaloTargetReport: targetReport }),

  closeZaloModal: () =>
    set({ isZaloModalOpen: false, zaloTargetReport: null }),

  openBatchExportModal: () =>
    set({ isBatchExportModalOpen: true }),

  closeBatchExportModal: () =>
    set({ isBatchExportModalOpen: false }),

  openAiSmartFillModal: (target?: AiTemplateTarget) =>
    set({
      isAiSmartFillModalOpen: true,
      ...(target ? { aiSmartFillTarget: target } : {})
    }),

  closeAiSmartFillModal: () =>
    set({ isAiSmartFillModalOpen: false }),

  openTemplateBuilder: () =>
    set({ isTemplateBuilderOpen: true }),

  closeTemplateBuilder: () =>
    set({ isTemplateBuilderOpen: false }),

  openUnsavedModal: (actionName: string, actionFn: () => void) =>
    set({ isUnsavedModalOpen: true, pendingAction: { name: actionName, run: actionFn } }),

  closeUnsavedModal: () =>
    set({ isUnsavedModalOpen: false, pendingAction: null }),

  clearPendingAction: () =>
    set({ pendingAction: null }),

  isAnyModalOpen: () => {
    const s = get();
    return (
      s.isUnsavedModalOpen ||
      s.isPreviewOpen ||
      s.isSettingsOpen ||
      s.isCatalogModalOpen ||
      s.isInvoiceModalOpen ||
      s.isRevenueModalOpen ||
      s.isReportManagerOpen ||
      s.isZaloModalOpen ||
      s.isBatchExportModalOpen ||
      s.isAiSmartFillModalOpen ||
      s.isTemplateBuilderOpen
    );
  },

  closeAllModals: () => {
    const s = get();
    if (s.isUnsavedModalOpen) {
      set({ isUnsavedModalOpen: false, pendingAction: null });
      return;
    }
    if (s.isPreviewOpen) {
      set({ isPreviewOpen: false, previewTargetReport: null });
      return;
    }
    if (s.isSettingsOpen) {
      set({ isSettingsOpen: false });
      return;
    }
    if (s.isCatalogModalOpen) {
      set({ isCatalogModalOpen: false, catalogModalTargetTab: null });
      return;
    }
    if (s.isInvoiceModalOpen) {
      set({ isInvoiceModalOpen: false });
      return;
    }
    if (s.isRevenueModalOpen) {
      set({ isRevenueModalOpen: false });
      return;
    }
    if (s.isReportManagerOpen) {
      set({ isReportManagerOpen: false });
      return;
    }
    if (s.isZaloModalOpen) {
      set({ isZaloModalOpen: false, zaloTargetReport: null });
      return;
    }
    if (s.isBatchExportModalOpen) {
      set({ isBatchExportModalOpen: false });
      return;
    }
    if (s.isAiSmartFillModalOpen) {
      set({ isAiSmartFillModalOpen: false });
      return;
    }
    if (s.isTemplateBuilderOpen) {
      set({ isTemplateBuilderOpen: false });
      return;
    }
  }
}));
