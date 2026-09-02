import { useState } from 'react';
import { PatientForm } from '@features/patient-session';
import { TestTable, ConclusionForm } from '@features/lab-testing';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../contexts/ToastContext';
import { User, FlaskConical, FileText, CreditCard, Eye, CloudUpload } from 'lucide-react';
import type { CatalogItem, TestPackage, TestGroup, Doctor, ExportStepName, Invoice, TestEquipment, CatalogItemEquipmentLink, ReferenceRangeItem, AllergenGradingScale } from '@domain';

// ─── MAIN WORKSPACE COMPONENT ───────────────────────────────────────────────
// Renders the responsive 2-column layout (Desktop) or 3-tab layout (Mobile)
// for patient input, test selection, and report conclusion.

interface MainWorkspaceProps {
  catalog: CatalogItem[];
  testPackages: TestPackage[];
  testGroups: TestGroup[];
  doctorsList: Doctor[];
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  referenceRanges?: ReferenceRangeItem[];
  allergenScales?: AllergenGradingScale[];
  cloudLink?: string;
  isExporting: boolean;
  currentStep: ExportStepName | null;
  totalFee: number;
  isCurrentPdfOutdated: boolean;
  isCurrentReportPaid: boolean;
  currentInvoiceForReport: Invoice | null;
  onOpenDoctorModal: () => void;
  onOpenPreview: () => void;
  onSaveReport: () => string | null;
  onExportPdfAndUpload: () => void;
  onDownloadPdf: () => void;
  onDirectSendZalo: () => void;
  onOpenSendZaloModal: () => void;
  onResetAll: () => void;
  onDownloadQrCode: () => void;
  onOpenInvoiceModal: () => void;
}

export function MainWorkspace({
  catalog,
  testPackages,
  testGroups,
  doctorsList,
  equipments = [],
  catalogItemEquipments = [],
  referenceRanges = [],
  allergenScales = [],
  cloudLink,
  isExporting,
  currentStep,
  totalFee,
  isCurrentPdfOutdated,
  isCurrentReportPaid,
  currentInvoiceForReport,
  onOpenDoctorModal,
  onOpenPreview,
  onSaveReport,
  onExportPdfAndUpload,
  onDownloadPdf,
  onDirectSendZalo,
  onOpenSendZaloModal,
  onResetAll,
  onDownloadQrCode,
  onOpenInvoiceModal
}: MainWorkspaceProps) {
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
    recentTests,
    addToRecent,
    addMultipleToRecent,
    nameInputRef,
    autoFocusName
  } = useWorkspace();

  const { showToast } = useToast();

  // Mobile responsive tab switcher state
  const [activeMobileTab, setActiveMobileTab] = useState<'PATIENT' | 'TESTS' | 'CONCLUSION'>('TESTS');

  return (
    <>
      <main className="max-w-[1680px] w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col flex-grow pb-24 lg:pb-6">
        {/* MOBILE TAB SWITCHER (chỉ hiện trên màn hình < lg) */}
        <div className="lg:hidden grid grid-cols-3 gap-1.5 p-1 bg-slate-200/90 rounded-2xl mb-3 shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveMobileTab('PATIENT')}
            className={`py-2 px-1 text-center rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
              activeMobileTab === 'PATIENT'
                ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="truncate">{patient.name ? patient.name.split(' ').slice(-1)[0] : 'Bệnh Nhân'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('TESTS')}
            className={`py-2 px-1 text-center rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
              activeMobileTab === 'TESTS'
                ? 'bg-white text-sky-950 shadow-md scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
            <span>Chỉ Số ({selectedTests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('CONCLUSION')}
            className={`py-2 px-1 text-center rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
              activeMobileTab === 'CONCLUSION'
                ? 'bg-white text-emerald-950 shadow-md scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kết Luận & In</span>
          </button>
        </div>

        {/* WORKSPACE PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 flex-grow">
          {/* PANEL TRÁI: BỆNH NHÂN & KẾT LUẬN */}
          <section
            className={`lg:col-span-4 flex flex-col space-y-4 lg:space-y-5 ${
              activeMobileTab === 'PATIENT' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <PatientForm
              patient={patient}
              setPatient={setPatient}
              onGenerateNewCode={() => {
                resetPatient();
                setCurrentReportId(null);
              }}
              doctorsList={doctorsList}
              onOpenDoctorModal={onOpenDoctorModal}
              doctorName={doctorName}
              setDoctorName={setDoctorName}
              nameInputRef={nameInputRef}
              autoFocusName={autoFocusName}
              editingReportCode={
                currentReportId
                  ? reports.find((r) => r.id === currentReportId)?.code || patient.code
                  : null
              }
            />

            {/* Trên Desktop: ConclusionForm nằm bên trái dưới PatientForm */}
            <div className="hidden lg:block">
              <ConclusionForm
                conclusion={conclusion}
                setConclusion={setConclusion}
                cloudLink={cloudLink || ''}
                isExporting={isExporting}
                currentStep={currentStep}
                onExportPdfAndUpload={onExportPdfAndUpload}
                onDownloadPdf={onDownloadPdf}
                onOpenPreview={onOpenPreview}
                onSaveReport={onSaveReport}
                onDirectSendZalo={onDirectSendZalo}
                onOpenSendZaloModal={onOpenSendZaloModal}
                onResetAll={onResetAll}
                onDownloadQrCode={onDownloadQrCode}
                onOpenInvoiceModal={onOpenInvoiceModal}
                selectedTests={selectedTests}
                isPdfOutdated={isCurrentPdfOutdated}
                pdfVersion={currentLoadedReport?.pdfVersion || 1}
                isPaid={isCurrentReportPaid}
                isReportSaved={Boolean(currentReportId)}
                invoiceCode={currentInvoiceForReport?.code}
                invoiceStatus={currentInvoiceForReport?.status}
                paidAmount={currentInvoiceForReport?.finalAmount}
              />
            </div>
          </section>

          {/* PANEL PHẢI: BẢNG CHỈ SỐ XÉT NGHIỆM */}
          <section
            className={`lg:col-span-8 flex flex-col ${
              activeMobileTab === 'TESTS' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <TestTable
              catalog={catalog}
              testPackages={testPackages}
              testGroups={testGroups}
              equipments={equipments}
              catalogItemEquipments={catalogItemEquipments}
              referenceRanges={referenceRanges}
              allergenScales={allergenScales}
              selectedTests={selectedTests}
              setSelectedTests={setSelectedTests}
              showToast={showToast}
              onOpenInvoiceModal={onOpenInvoiceModal}
              recentTests={recentTests}
              onAddToRecent={addToRecent}
              onAddMultipleToRecent={addMultipleToRecent}
            />
          </section>

          {/* TAB 3 TRÊN MOBILE: CONCLUSION & EXPORT FORM */}
          <section className={`lg:hidden ${activeMobileTab === 'CONCLUSION' ? 'block' : 'hidden'}`}>
            <ConclusionForm
              conclusion={conclusion}
              setConclusion={setConclusion}
              cloudLink={cloudLink || ''}
              isExporting={isExporting}
              currentStep={currentStep}
              onExportPdfAndUpload={onExportPdfAndUpload}
              onDownloadPdf={onDownloadPdf}
              onOpenPreview={onOpenPreview}
              onSaveReport={onSaveReport}
              onDirectSendZalo={onDirectSendZalo}
              onOpenSendZaloModal={onOpenSendZaloModal}
              onResetAll={onResetAll}
              onDownloadQrCode={onDownloadQrCode}
              onOpenInvoiceModal={onOpenInvoiceModal}
              selectedTests={selectedTests}
              isPdfOutdated={isCurrentPdfOutdated}
              pdfVersion={currentLoadedReport?.pdfVersion || 1}
              isPaid={isCurrentReportPaid}
              isReportSaved={Boolean(currentReportId)}
              invoiceCode={currentInvoiceForReport?.code}
              invoiceStatus={currentInvoiceForReport?.status}
              paidAmount={currentInvoiceForReport?.finalAmount}
            />
          </section>
        </div>
      </main>

      {/* MOBILE STICKY BOTTOM ACTION BAR (Cố định ở đáy màn hình trên mobile < lg) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shadow-2xl">
        <button
          type="button"
          onClick={onOpenInvoiceModal}
          disabled={selectedTests.length === 0}
          className="flex-1 py-2 px-2 bg-gradient-to-r from-teal-600 to-emerald-600 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow disabled:opacity-50 transition"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Thu Phí ({totalFee > 0 ? (totalFee / 1000).toFixed(0) + 'k' : '0k'})</span>
        </button>

        <button
          type="button"
          onClick={onOpenPreview}
          disabled={selectedTests.length === 0}
          className="py-2 px-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow disabled:opacity-50 transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Xem A4</span>
        </button>

        <button
          type="button"
          onClick={onExportPdfAndUpload}
          disabled={selectedTests.length === 0 || isExporting}
          className="py-2 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow disabled:opacity-50 transition"
        >
          <CloudUpload className="w-3.5 h-3.5" />
          <span>Xuất PDF</span>
        </button>
      </div>
    </>
  );
}
