import { SettingsModal, TransactionLoadingModal, UnsavedChangesModal } from '@features/settings-clinic';
import { PdfPreviewModal } from '@features/report-export';
import { CatalogManagerModal } from '@features/catalog-management';
import { InvoiceModal, RevenueManagerModal } from '@features/billing-revenue';
import { ReportManagerModal } from '@features/report-history';
import { SendZaloModal } from '@features/zalo-integration';
import { BatchExportModal, AiSmartFillModal } from '@features/batch-import-export';
import { TemplateBuilderModal } from '@features/template-builder';

import { useWorkspace } from '../contexts/WorkspaceContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';

import type { Dispatch, SetStateAction } from 'react';
import type {
  ClinicInfo,
  CatalogItem,
  TestPackage,
  TestGroup,
  TestEquipment,
  Doctor,
  CloudDbConfig,
  ZaloZnsConfig,
  Invoice,
  MedicalReport,
  BatchImportRow,
  ExportStepName,
  ExportErrorDetail,
  BatchExportProgress,
  CatalogItemEquipmentLink,
  AllergenGradingScale
} from '@domain';

// ─── MODAL LAYER COMPONENT ──────────────────────────────────────────────────
// Houses and manages all modal popups in a single, clean presentation layer.

interface ModalLayerProps {
  clinicInfo: ClinicInfo;
  setClinicInfo: Dispatch<SetStateAction<ClinicInfo>>;
  cloudDbConfig: CloudDbConfig;
  setCloudDbConfig: Dispatch<SetStateAction<CloudDbConfig>>;
  zaloConfig: ZaloZnsConfig;
  setZaloConfig: Dispatch<SetStateAction<ZaloZnsConfig>>;
  catalog: CatalogItem[];
  setCatalog: (items: CatalogItem[]) => void;
  testPackages: TestPackage[];
  setTestPackages: (packages: TestPackage[]) => void;
  testGroups: TestGroup[];
  setTestGroups: (groups: TestGroup[]) => void;
  equipments: TestEquipment[];
  setEquipments: (equipments: TestEquipment[]) => void;
  doctorsList: Doctor[];
  setDoctorsList: (doctors: Doctor[]) => void;
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  setCatalogItemEquipments?: (links: CatalogItemEquipmentLink[]) => void;
  allergenScales?: AllergenGradingScale[];
  setAllergenScales?: (scales: AllergenGradingScale[]) => void;
  reports?: MedicalReport[];
  setReports?: Dispatch<SetStateAction<MedicalReport[]>>;
  invoices?: Invoice[];
  setInvoices?: Dispatch<SetStateAction<Invoice[]>>;
  cloudLink?: string;
  qrCodeDataUrl?: string;
  isExporting: boolean;
  currentStep: ExportStepName | null;
  lastError: ExportErrorDetail | null;
  batchProgress: BatchExportProgress;
  isBatchExportRunning: boolean;
  onExportPdfAndUpload: () => void;
  onDownloadPdf: (elementId: string, filename: string) => void;
  onPrintDirect: () => void;
  onDownloadQrCode: (name: string, code: string) => void;
  onSaveCurrentReport: () => string | null;
  onSaveInvoice: (inv: Invoice) => void;
  onCancelInvoice: (invoiceId: string) => void;
  onLoadReport: (rep: MedicalReport) => void;
  onDuplicateReport: (rep: MedicalReport) => void;
  onOpenInvoiceForReport: (rep: MedicalReport) => void;
  onUpdateSingleReportPdf: (rep: MedicalReport) => void;
  onBatchUpdateOutdatedReports: (outdatedList: MedicalReport[]) => void;
  onBatchImport: (rows: BatchImportRow[]) => void;
  onBatchExport: (reports: MedicalReport[]) => Promise<BatchExportProgress | undefined | void>;
  onCancelBatch: () => void;
  onDownloadZip: () => void;
  onZnsSuccess: (reportCode: string) => void;
  onUnsavedSaveAndProceed: () => void;
  onUnsavedDiscardAndProceed: () => void;
  onUnsavedCancel: () => void;
}

export function ModalLayer({
  clinicInfo,
  setClinicInfo,
  cloudDbConfig,
  setCloudDbConfig,
  zaloConfig,
  setZaloConfig,
  catalog,
  setCatalog,
  testPackages,
  setTestPackages,
  testGroups,
  setTestGroups,
  equipments,
  setEquipments,
  doctorsList,
  setDoctorsList,
  catalogItemEquipments = [],
  setCatalogItemEquipments,
  allergenScales = [],
  setAllergenScales,
  cloudLink,
  qrCodeDataUrl,
  isExporting,
  currentStep,
  lastError,
  batchProgress,
  isBatchExportRunning,
  onExportPdfAndUpload,
  onDownloadPdf,
  onPrintDirect,
  onDownloadQrCode,
  onSaveCurrentReport,
  onSaveInvoice,
  onCancelInvoice,
  onLoadReport,
  onDuplicateReport,
  onOpenInvoiceForReport,
  onUpdateSingleReportPdf,
  onBatchUpdateOutdatedReports,
  onBatchImport,
  onBatchExport,
  onCancelBatch,
  onDownloadZip,
  onZnsSuccess,
  onUnsavedSaveAndProceed,
  onUnsavedDiscardAndProceed,
  onUnsavedCancel
}: ModalLayerProps) {
  const {
    patient,
    selectedTests,
    conclusion,
    doctorName,
    currentReportId,
    reports,
    setReports,
    deleteReport,
    clearAllReports,
    invoices,
    setInvoices,
    deleteInvoice,
    clearAllInvoices
  } = useWorkspace();

  const {
    isPreviewOpen,
    previewTargetReport,
    closePreview,
    openPreview,
    isSettingsOpen,
    closeSettings,
    isCatalogModalOpen,
    catalogModalTargetTab,
    closeCatalogModal,
    isInvoiceModalOpen,
    closeInvoiceModal,
    isRevenueModalOpen,
    closeRevenueModal,
    isReportManagerOpen,
    closeReportManager,
    isZaloModalOpen,
    zaloTargetReport,
    closeZaloModal,
    openZaloModal,
    isBatchExportModalOpen,
    closeBatchExportModal,
    openBatchExportModal,
    isAiSmartFillModalOpen,
    aiSmartFillTarget,
    openAiSmartFillModal,
    closeAiSmartFillModal,
    isTemplateBuilderOpen,
    closeTemplateBuilder,
    isUnsavedModalOpen,
    pendingAction
  } = useModal();

  const { showToast } = useToast();

  return (
    <>
      {/* 1. SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        clinicInfo={clinicInfo}
        setClinicInfo={setClinicInfo}
        cloudDbConfig={cloudDbConfig}
        setCloudDbConfig={setCloudDbConfig}
        zaloConfig={zaloConfig}
        setZaloConfig={setZaloConfig}
        showToast={showToast}
        catalog={catalog}
        setCatalog={setCatalog}
        testPackages={testPackages}
        setTestPackages={setTestPackages}
        testGroups={testGroups}
        setTestGroups={setTestGroups}
        equipments={equipments}
        setEquipments={setEquipments}
        doctorsList={doctorsList}
        setDoctorsList={setDoctorsList}
        catalogItemEquipments={catalogItemEquipments}
        setCatalogItemEquipments={setCatalogItemEquipments}
        allergenScales={allergenScales}
        setAllergenScales={setAllergenScales}
        reports={reports}
        setReports={setReports}
        invoices={invoices}
        setInvoices={setInvoices}
      />

      {/* 2. PDF PREVIEW MODAL */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        clinicInfo={clinicInfo}
        patient={previewTargetReport?.patient || patient}
        selectedTests={previewTargetReport?.selectedTests || selectedTests}
        conclusion={previewTargetReport ? previewTargetReport.conclusion || '' : conclusion}
        doctorName={previewTargetReport ? previewTargetReport.doctorName || '' : doctorName}
        qrCodeDataUrl={previewTargetReport ? previewTargetReport.qrCodeDataUrl : qrCodeDataUrl}
        cloudLink={previewTargetReport ? previewTargetReport.cloudPdfUrl : cloudLink}
        isExporting={isExporting}
        currentStep={currentStep}
        lastError={lastError}
        showToast={showToast}
        onExportPdfAndUpload={onExportPdfAndUpload}
        onDownloadPdf={onDownloadPdf}
        onRetryExport={onExportPdfAndUpload}
        onPrintDirect={onPrintDirect}
        onDownloadQrCode={() => {
          const target = previewTargetReport?.patient || patient;
          onDownloadQrCode(target?.name || '', target?.code || '');
        }}
        testPackages={testPackages}
        equipments={equipments}
        catalogItemEquipments={catalogItemEquipments}
        allergenScales={allergenScales}
      />

      {/* 3. CATALOG MANAGER MODAL */}
      <CatalogManagerModal
        isOpen={isCatalogModalOpen}
        onClose={closeCatalogModal}
        targetTab={catalogModalTargetTab}
        catalog={catalog}
        onSaveCatalog={setCatalog}
        testPackages={testPackages}
        onSavePackages={setTestPackages}
        testGroups={testGroups}
        onSaveTestGroups={setTestGroups}
        equipments={equipments}
        onSaveEquipments={setEquipments}
        doctorsList={doctorsList}
        onSaveDoctors={setDoctorsList}
        catalogItemEquipments={catalogItemEquipments}
        onSaveCatalogItemEquipments={setCatalogItemEquipments}
        allergenScales={allergenScales}
        onSaveScales={setAllergenScales}
      />

      {/* 4. INVOICE MODAL */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={closeInvoiceModal}
        patient={patient}
        selectedTests={selectedTests}
        currentPackageId="all"
        testPackages={testPackages}
        doctorsList={doctorsList}
        doctorName={doctorName}
        clinicInfo={clinicInfo}
        currentReportId={currentReportId}
        isReportSaved={Boolean(currentReportId && reports.some((r) => r.id === currentReportId))}
        onSaveReportFirst={onSaveCurrentReport}
        onSaveInvoice={onSaveInvoice}
      />

      {/* 5. REVENUE MANAGER MODAL */}
      <RevenueManagerModal
        isOpen={isRevenueModalOpen}
        onClose={closeRevenueModal}
        invoices={invoices}
        reports={reports}
        testPackages={testPackages}
        onDeleteInvoice={deleteInvoice}
        onCancelInvoice={onCancelInvoice}
        onOpenInvoiceForReport={onOpenInvoiceForReport}
        onClearAllInvoices={clearAllInvoices}
        doctorsList={doctorsList}
        clinicInfo={clinicInfo}
        showToast={showToast}
      />

      {/* 6. REPORT MANAGER MODAL */}
      <ReportManagerModal
        isOpen={isReportManagerOpen}
        onClose={closeReportManager}
        reports={reports}
        invoices={invoices}
        doctorsList={doctorsList}
        onLoadReport={onLoadReport}
        onPreviewReport={(rep) => openPreview(rep)}
        onDuplicateReport={onDuplicateReport}
        onOpenSendZaloModal={(rep) => openZaloModal(rep)}
        onOpenBatchExportModal={() => {
          closeReportManager();
          openBatchExportModal();
        }}
        onUpdateSingleReportPdf={onUpdateSingleReportPdf}
        onBatchUpdateOutdatedReports={onBatchUpdateOutdatedReports}
        onOpenInvoiceForReport={onOpenInvoiceForReport}
        isUpdatingPdf={isBatchExportRunning}
        onDeleteReport={deleteReport}
        onClearAllReports={clearAllReports}
        showToast={showToast}
      />

      {/* 7. BATCH EXPORT MODAL */}
      <BatchExportModal
        isOpen={isBatchExportModalOpen}
        onClose={closeBatchExportModal}
        reports={reports}
        catalog={catalog}
        setCatalog={setCatalog}
        testGroups={testGroups}
        setTestGroups={setTestGroups}
        equipments={equipments}
        setEquipments={setEquipments}
        testPackages={testPackages}
        setTestPackages={setTestPackages}
        doctorsList={doctorsList}
        setDoctorsList={setDoctorsList}
        catalogItemEquipments={catalogItemEquipments}
        setCatalogItemEquipments={setCatalogItemEquipments}
        allergenScales={allergenScales}
        setAllergenScales={setAllergenScales}
        invoices={invoices}
        clinicInfo={clinicInfo}
        onBatchImport={onBatchImport}
        progress={batchProgress}
        isBatchExporting={isBatchExportRunning}
        onBatchExport={onBatchExport}
        onCancelBatch={onCancelBatch}
        onDownloadZip={onDownloadZip}
        onOpenAiSmartFill={openAiSmartFillModal}
        showToast={showToast}
      />

      {/* 8. SEND ZALO MODAL */}
      {zaloTargetReport && (
        <SendZaloModal
          isOpen={isZaloModalOpen}
          onClose={closeZaloModal}
          report={zaloTargetReport}
          clinicInfo={clinicInfo}
          zaloConfig={zaloConfig}
          showToast={showToast}
          onZnsSuccess={onZnsSuccess}
        />
      )}

      {/* 9. TRANSACTION LOADING MODAL */}
      <TransactionLoadingModal
        isOpen={isExporting}
        currentStep={currentStep}
        patient={patient}
      />

      {/* 10. UNSAVED CHANGES GUARD MODAL */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onClose={onUnsavedCancel}
        onSaveAndProceed={onUnsavedSaveAndProceed}
        onDiscardAndProceed={onUnsavedDiscardAndProceed}
        actionName={pendingAction?.name}
        patient={patient}
        isEditingExisting={!!currentReportId}
      />

      {/* 11. AI SMART TEMPLATE FILLER & INGESTION MODAL */}
      <AiSmartFillModal
        isOpen={isAiSmartFillModalOpen}
        onClose={closeAiSmartFillModal}
        initialTarget={aiSmartFillTarget}
        catalog={catalog}
        setCatalog={setCatalog}
        equipments={equipments}
        setEquipments={setEquipments}
        testGroups={testGroups}
        setTestGroups={setTestGroups}
        testPackages={testPackages}
        setTestPackages={setTestPackages}
        doctorsList={doctorsList}
        setDoctorsList={setDoctorsList}
        catalogItemEquipments={catalogItemEquipments || []}
        setCatalogItemEquipments={setCatalogItemEquipments}
        allergenScales={allergenScales || []}
        setAllergenScales={setAllergenScales}
        onBatchImportToReports={(batchRows) => {
          onBatchImport(batchRows);
          openBatchExportModal();
        }}
        showToast={showToast}
      />

      {/* 12. VISUAL REPORT TEMPLATE BUILDER MODAL */}
      <TemplateBuilderModal
        isOpen={isTemplateBuilderOpen}
        onClose={closeTemplateBuilder}
        patient={patient}
        selectedTests={selectedTests}
        clinicInfo={clinicInfo}
        doctorName={doctorName}
        conclusion={conclusion}
        qrCodeDataUrl={qrCodeDataUrl}
        testPackages={testPackages}
        equipments={equipments}
        catalogItemEquipments={catalogItemEquipments}
        allergenScales={allergenScales}
        onShowToast={showToast}
      />
    </>
  );
}
