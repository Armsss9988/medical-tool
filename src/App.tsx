import { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import { MainWorkspace } from './components/MainWorkspace';
import { ModalLayer } from './components/ModalLayer';
import { PrintLayer } from './components/PrintLayer';

import { ToastProvider, useToast } from './contexts/ToastContext';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';

import { useCatalogData } from './hooks/useCatalogData';
import { useReportExport } from './hooks/useReportExport';
import { useBatchExport } from './hooks/useBatchExport';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useWorkspaceActions } from './hooks/useWorkspaceActions';
import { useUnsavedGuard } from './hooks/useUnsavedGuard';
import { useExportActions } from './hooks/useExportActions';
import { useInvoiceActions } from './hooks/useInvoiceActions';

import { parseExcelCatalog } from '@infra/excelService';
import { openDataFolder } from '@infra/storage';
import type { MedicalReport, BatchImportRow, CatalogTabType } from '@domain';

// ─── MAIN APPLICATION CONTENT ───────────────────────────────────────────────
function AppContent() {
  // 1. SYSTEM CONFIG & CATALOG STATE
  const {
    clinicInfo,
    setClinicInfo,
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
    cloudDbConfig,
    setCloudDbConfig,
    zaloConfig,
    setZaloConfig
  } = useCatalogData();

  // 2. CONTEXT CONSUMPTION
  const { showToast } = useToast();
  const {
    reports,
    invoices,
    saveOrUpdateReport
  } = useWorkspace();

  const {
    isAnyModalOpen,
    openPreview,
    openSettings,
    openCatalogModal,
    openRevenueModal,
    openReportManager,
    closeReportManager,
    openBatchExportModal,
    closeAllModals
  } = useModal();

  // 3. EXPORT HOOK (TRANSACTION PIPELINE)
  const reportExportHook = useReportExport(showToast);
  const {
    cloudLink,
    qrCodeDataUrl,
    isExporting,
    currentStep,
    lastError,
    resetExport,
    handleDownloadPdf
  } = reportExportHook;

  // 4. BATCH RENDER DATA (Hidden off-screen canvas)
  const [batchRenderReport, setBatchRenderReport] = useState<MedicalReport | null>(null);

  const handleSetBatchRenderData = useCallback(async (report: MedicalReport) => {
    setBatchRenderReport(report);
  }, []);

  const handleBatchReportExported = useCallback(
    (report: MedicalReport, cloudUrl: string, qrDataUrl: string) => {
      saveOrUpdateReport({
        patient: report.patient,
        selectedTests: report.selectedTests,
        conclusion: report.conclusion,
        doctorName: report.doctorName,
        cloudPdfUrl: cloudUrl || undefined,
        qrCodeDataUrl: qrDataUrl || undefined,
        status: 'Đã xuất Cloud'
      });
    },
    [saveOrUpdateReport]
  );

  const {
    progress: batchProgress,
    isBatchExporting: isBatchExportRunning,
    handleBatchExport,
    handleCancelBatch,
    handleDownloadZip
  } = useBatchExport(clinicInfo, handleSetBatchRenderData, handleBatchReportExported);

  // 5. ACTIONS HOOKS
  // Unsaved Changes Guard
  const {
    requestActionWithGuard,
    handleUnsavedSaveAndProceed,
    handleUnsavedDiscardAndProceed,
    handleUnsavedCancel
  } = useUnsavedGuard(() => workspaceActions.handleSaveCurrentReport());

  // Workspace Actions (Save, Clear, Load, Duplicate, Pricing)
  const workspaceActions = useWorkspaceActions(
    testPackages,
    requestActionWithGuard,
    resetExport,
    cloudLink,
    qrCodeDataUrl
  );

  const {
    totalFee,
    currentInvoiceForReport,
    isCurrentReportPaid,
    isCurrentPdfOutdated,
    handleSaveCurrentReport,
    handleClearAll,
    handleLoadReport,
    handleDuplicateReport
  } = workspaceActions;

  // Export Actions
  const {
    handleExportPdfAndUpload,
    handleDownloadPdfDirect,
    handleDirectSendZalo,
    handleOpenZaloModal,
    handleZnsSuccess,
    handlePrintDirect,
    handleDownloadQrCodeDirect
  } = useExportActions(clinicInfo, reportExportHook, handleSaveCurrentReport);

  // Invoice Actions
  const {
    handleSaveInvoice,
    handleOpenInvoiceModalWithCheck,
    handleOpenInvoiceForReport,
    handleCancelInvoice
  } = useInvoiceActions(handleSaveCurrentReport, cloudLink, qrCodeDataUrl);

  // 6. EXCEL CATALOG LOADER
  const handleLoadExcelFile = async (fileOrBuffer: Blob | ArrayBuffer) => {
    try {
      showToast('Đang đọc dữ liệu danh mục từ file Excel...', 'info');
      const items = await parseExcelCatalog(fileOrBuffer);
      if (items && items.length > 0) {
        setCatalog(items);
        showToast(`Đã nhập thành công ${items.length} chỉ số xét nghiệm từ Excel!`, 'success');
      } else {
        showToast('File Excel không đúng định dạng hoặc không có dữ liệu!', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi mở file Excel:', err);
      showToast('Đã xảy ra lỗi khi đọc file Excel!', 'error');
    }
  };

  // 7. DIRECTORY & BATCH REPORT HELPERS
  const handleOpenDataDirectory = () => {
    try {
      openDataFolder();
    } catch {
      showToast('Tính năng mở thư mục chỉ khả dụng trong môi trường hệ thống hỗ trợ!', 'info');
    }
  };

  const handleBatchImport = (rows: BatchImportRow[]) => {
    for (const row of rows) {
      saveOrUpdateReport({
        patient: row.patient,
        selectedTests: row.selectedTests,
        conclusion: row.conclusion,
        doctorName: row.doctorName
      });
    }
  };

  const handleUpdateSingleReportPdf = async (rep: MedicalReport) => {
    try {
      showToast(`Đang cập nhật lại PDF cho bệnh nhân ${rep.patient.name}...`, 'info');
      openBatchExportModal();
      await handleBatchExport([rep]);
      showToast(`Đã cập nhật PDF mới nhất cho phiếu [${rep.code}]!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi cập nhật PDF!', 'error');
    }
  };

  const handleBatchUpdateOutdatedReports = async (outdatedList: MedicalReport[]) => {
    if (outdatedList.length === 0) {
      showToast('Không có phiếu nào cần cập nhật PDF!', 'info');
      return;
    }
    showToast(`Bắt đầu cập nhật PDF cho ${outdatedList.length} phiếu lỗi thời...`, 'info');
    closeReportManager();
    openBatchExportModal();
    await handleBatchExport(outdatedList);
    showToast(`Đã hoàn tất cập nhật PDF cho ${outdatedList.length} phiếu!`, 'success');
  };

  // 8. GLOBAL KEYBOARD SHORTCUTS
  const globalShortcuts = useMemo(
    () => [
      { key: 'n', ctrl: true, shift: false, action: handleClearAll, disableInModal: true },
      { key: 's', ctrl: true, action: handleSaveCurrentReport, disableInModal: true },
      { key: 'p', ctrl: true, action: () => openPreview(), disableInModal: true },
      { key: 'e', ctrl: true, shift: true, action: handleExportPdfAndUpload, disableInModal: true },
      { key: 'l', ctrl: true, action: () => openReportManager(), disableInModal: true },
      { key: 'Escape', action: closeAllModals }
    ],
    [
      handleClearAll,
      handleSaveCurrentReport,
      openPreview,
      handleExportPdfAndUpload,
      openReportManager,
      closeAllModals
    ]
  );

  useKeyboardShortcuts(globalShortcuts, isAnyModalOpen);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 pb-12 print:bg-white print:p-0 print:m-0">
      {/* TOP HEADER NAVIGATION */}
      <Header
        clinicInfo={clinicInfo}
        onOpenSettings={openSettings}
        onOpenCatalogModal={() => openCatalogModal('INDICATORS' as CatalogTabType)}
        onOpenRevenueModal={openRevenueModal}
        onOpenReportManagerModal={openReportManager}
        onOpenBatchExportModal={openBatchExportModal}
        onOpenDataFolder={handleOpenDataDirectory}
        onLoadExcelFile={handleLoadExcelFile}
        reportCount={reports.length}
        invoiceCount={invoices.length}
      />

      {/* MAIN WORKSPACE: PATIENT & TEST PANELS */}
      <MainWorkspace
        catalog={catalog}
        testPackages={testPackages}
        testGroups={testGroups}
        doctorsList={doctorsList}
        cloudLink={cloudLink}
        isExporting={isExporting}
        currentStep={currentStep}
        totalFee={totalFee}
        isCurrentPdfOutdated={isCurrentPdfOutdated}
        isCurrentReportPaid={isCurrentReportPaid}
        currentInvoiceForReport={currentInvoiceForReport}
        onOpenDoctorModal={() => openCatalogModal('DOCTORS' as CatalogTabType)}
        onOpenPreview={openPreview}
        onSaveReport={handleSaveCurrentReport}
        onExportPdfAndUpload={handleExportPdfAndUpload}
        onDownloadPdf={handleDownloadPdfDirect}
        onDirectSendZalo={handleDirectSendZalo}
        onOpenSendZaloModal={handleOpenZaloModal}
        onResetAll={handleClearAll}
        onDownloadQrCode={handleDownloadQrCodeDirect}
        onOpenInvoiceModal={handleOpenInvoiceModalWithCheck}
      />

      {/* MODAL POPUPS LAYER */}
      <ModalLayer
        clinicInfo={clinicInfo}
        setClinicInfo={setClinicInfo}
        cloudDbConfig={cloudDbConfig}
        setCloudDbConfig={setCloudDbConfig}
        zaloConfig={zaloConfig}
        setZaloConfig={setZaloConfig}
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
        cloudLink={cloudLink}
        qrCodeDataUrl={qrCodeDataUrl}
        isExporting={isExporting}
        currentStep={currentStep}
        lastError={lastError}
        batchProgress={batchProgress}
        isBatchExportRunning={isBatchExportRunning}
        onExportPdfAndUpload={handleExportPdfAndUpload}
        onDownloadPdf={handleDownloadPdf}
        onPrintDirect={handlePrintDirect}
        onDownloadQrCode={handleDownloadQrCodeDirect}
        onSaveCurrentReport={handleSaveCurrentReport}
        onSaveInvoice={handleSaveInvoice}
        onCancelInvoice={handleCancelInvoice}
        onLoadReport={handleLoadReport}
        onDuplicateReport={handleDuplicateReport}
        onOpenInvoiceForReport={handleOpenInvoiceForReport}
        onUpdateSingleReportPdf={handleUpdateSingleReportPdf}
        onBatchUpdateOutdatedReports={handleBatchUpdateOutdatedReports}
        onBatchImport={handleBatchImport}
        onBatchExport={handleBatchExport}
        onCancelBatch={handleCancelBatch}
        onDownloadZip={handleDownloadZip}
        onZnsSuccess={handleZnsSuccess}
        onUnsavedSaveAndProceed={handleUnsavedSaveAndProceed}
        onUnsavedDiscardAndProceed={handleUnsavedDiscardAndProceed}
        onUnsavedCancel={handleUnsavedCancel}
      />

      {/* PRINT & LOSSLESS CAPTURE TEMPLATES */}
      <PrintLayer
        clinicInfo={clinicInfo}
        qrCodeDataUrl={qrCodeDataUrl}
        batchRenderReport={batchRenderReport}
      />
    </div>
  );
}

// ─── COMPOSITION ROOT ───────────────────────────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <ModalProvider>
        <WorkspaceProvider>
          <AppContent />
        </WorkspaceProvider>
      </ModalProvider>
    </ToastProvider>
  );
}
