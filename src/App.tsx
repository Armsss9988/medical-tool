import { useState } from "react";
import Header from "./components/Header";
import PatientForm from "./components/PatientForm";
import ConclusionForm from "./components/ConclusionForm";
import TestTable from "./components/TestTable";
import SettingsModal from "./components/SettingsModal";
import CatalogManagerModal from "./components/CatalogManagerModal";
import InvoiceModal from "./components/InvoiceModal";
import PdfPreviewModal from "./components/PdfPreviewModal";
import RevenueManagerModal from "./components/RevenueManagerModal";
import ReportManagerModal from "./components/ReportManagerModal";
import SendZaloModal from "./components/SendZaloModal";
import TransactionLoadingModal from "./components/TransactionLoadingModal";
import PrintReportView from "./components/PrintReportView";
import FullAllergenReportView from "./components/FullAllergenReportView";
import { useCatalogData } from "./hooks/useCatalogData";
import { useReportExport } from "./hooks/useReportExport";
import { useExcelLoader } from "./hooks/useExcelLoader";
import { usePatientLedger } from "./hooks/usePatientLedger";
import { useZaloMessaging } from "./hooks/useZaloMessaging";
import {
  Patient,
  SelectedTest,
  ToastType,
  CatalogTabType,
  MedicalReport,
  DEFAULT_PATIENT
} from "@domain/types";

export default function App() {
  // 1. STATE DANH MỤC & CẤU HÌNH HỆ THỐNG
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

  // 2. STATE KẾT QUẢ & CHỈ ĐỊNH XÉT NGHIỆM
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [conclusion, setConclusion] = useState<string>("");
  const [doctorName, setDoctorName] = useState<string>("");

  // 3. STATE CÁC MODAL
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogModalTargetTab, setCatalogModalTargetTab] = useState<CatalogTabType | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isReportManagerOpen, setIsReportManagerOpen] = useState(false);
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false);
  const [zaloTargetReport, setZaloTargetReport] = useState<MedicalReport | null>(null);

  // TOAST THÔNG BÁO
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 4. REPORT EXPORT HOOK (TRANSACTION PIPELINE)
  const {
    cloudLink,
    qrCodeDataUrl,
    isExporting,
    currentStep,
    lastError,
    handleExportPdfAndUploadCloud,
    handleDownloadPdf,
    handleRetryExport,
    handleDownloadQrCode,
    resetExport
  } = useReportExport(showToast);

  // 5. EXCEL DATA LOADER
  const {
    patient,
    setPatient,
    handleFileUpload,
    handleClearAll: resetPatientData
  } = useExcelLoader(catalog, (data) => {
    setSelectedTests(data.selectedTests);
    if (data.conclusion) setConclusion(data.conclusion);
    if (data.doctorName) setDoctorName(data.doctorName);
    showToast("Đã tải dữ liệu kết quả xét nghiệm từ file Excel thành công!", "success");
  }, showToast);

  // 6. PATIENT LEDGER HOOK (QUẢN LÝ SỔ LƯU TRỮ KẾT QUẢ)
  const {
    savedReports,
    saveOrUpdateReport,
    deleteReport,
    searchReports
  } = usePatientLedger(cloudDbConfig, showToast);

  // 7. ZALO MESSAGING HOOK
  const {
    generateZaloTextMessage,
    openZaloChat
  } = useZaloMessaging(zaloConfig);

  // HANDLERS ĐIỀU HƯỚNG & THAO TÁC
  const handleOpenCatalogModal = (tab?: CatalogTabType) => {
    setCatalogModalTargetTab(tab || null);
    setIsCatalogModalOpen(true);
  };

  const handleClearAll = () => {
    resetPatientData();
    setSelectedTests([]);
    setConclusion("");
    setDoctorName("");
    resetExport();
    showToast("Đã làm mới toàn bộ biểu mẫu để nhập bệnh nhân mới!", "info");
  };

  const handleSelectSavedReport = (report: MedicalReport) => {
    setPatient({ ...report.patient });
    setSelectedTests([...report.selectedTests]);
    setConclusion(report.conclusion || "");
    setDoctorName(report.doctorName || "");
    setIsReportManagerOpen(false);
    showToast(`Đã nạp phiếu của bệnh nhân ${report.patient.name} (${report.code})!`, "success");
  };

  const handlePrintDirect = () => {
    window.print();
  };

  const handleSaveCurrentReport = () => {
    if (!patient.name || !patient.name.trim()) {
      showToast("Vui lòng nhập họ và tên bệnh nhân trước khi lưu!", "error");
      return;
    }
    const saved = saveOrUpdateReport({
      patient,
      selectedTests,
      conclusion,
      doctorName,
      cloudPdfUrl: cloudLink || undefined,
      qrCodeDataUrl: qrCodeDataUrl || undefined
    });
    showToast(`Đã lưu phiếu của bệnh nhân ${saved.patient.name} (${saved.code}) vào Sổ Lưu!`, "success");
  };

  const handleExportPdfAndUpload = async () => {
    const isAllergen = selectedTests.some(
      (t) => (t.category && t.category.includes("Dị Nguyên")) || t.unit === "IU/mL"
    );
    const elementId = isAllergen ? "printable-allergen-report" : "printable-medical-report";
    const filename = `PhieuXN_${(patient.name || "BenhNhan").replace(/\s+/g, "_")}_${patient.code}.pdf`;
    
    // Thực thi transaction xuất PDF & upload Cloud với rollback an toàn
    const result = await handleExportPdfAndUploadCloud(
      elementId,
      filename,
      patient.code,
      patient.name
    );

    if (result && result.success) {
      saveOrUpdateReport({
        patient,
        selectedTests,
        conclusion,
        doctorName,
        cloudPdfUrl: result.finalUrl || undefined,
        qrCodeDataUrl: result.finalQrCodeDataUrl || undefined,
        status: 'Đã xuất Cloud'
      });
    }
  };

  const handleDownloadPdfDirect = () => {
    const isAllergen = selectedTests.some(
      (t) => (t.category && t.category.includes("Dị Nguyên")) || t.unit === "IU/mL"
    );
    const elementId = isAllergen ? "printable-allergen-report" : "printable-medical-report";
    const filename = `PhieuXN_${(patient.name || "BenhNhan").replace(/\s+/g, "_")}_${patient.code}.pdf`;
    handleDownloadPdf(elementId, filename);
  };

  const handleDirectSendZalo = async () => {
    if (!patient.phone || !patient.phone.trim()) {
      showToast("Bệnh nhân chưa có số điện thoại! Đang mở cửa sổ Zalo để nhập SĐT...", "info");
      handleOpenZaloModal();
      return;
    }

    const isAllergen = selectedTests.some(
      (t) => (t.category && t.category.includes("Dị Nguyên")) || t.unit === "IU/mL"
    );
    const currentReport: MedicalReport = {
      id: patient.code || `BN-${Date.now()}`,
      code: patient.code || `BN-${Date.now()}`,
      sampleCode: patient.sampleCode || patient.code || `BN-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patient: { ...patient },
      doctorName: doctorName || clinicInfo.defaultDoctor || 'BS. Trần Hoài Long',
      selectedTests: [...selectedTests],
      conclusion: conclusion || '',
      isAllergen,
      cloudPdfUrl: cloudLink || undefined,
      qrCodeDataUrl: qrCodeDataUrl || undefined,
      status: cloudLink ? 'Đã xuất Cloud' : 'Đã có kết quả',
      testCount: selectedTests.length
    };

    const message = generateZaloTextMessage(currentReport, clinicInfo, currentReport.cloudPdfUrl);
    const success = await openZaloChat(patient.phone, message);

    if (success) {
      saveOrUpdateReport({
        patient,
        selectedTests,
        conclusion,
        doctorName,
        cloudPdfUrl: cloudLink || undefined,
        qrCodeDataUrl: qrCodeDataUrl || undefined,
        zaloSentAt: new Date().toISOString()
      });
      showToast(`Đã sao chép nội dung & mở Zalo gửi tới SĐT: ${patient.phone}`, "success");
    } else {
      showToast("Không thể mở Zalo. Vui lòng kiểm tra lại số điện thoại!", "error");
    }
  };

  const handleOpenZaloModal = () => {
    const isAllergen = selectedTests.some(
      (t) => (t.category && t.category.includes("Dị Nguyên")) || t.unit === "IU/mL"
    );
    const currentReport: MedicalReport = {
      id: patient.code || `BN-${Date.now()}`,
      code: patient.code || `BN-${Date.now()}`,
      sampleCode: patient.sampleCode || patient.code || `BN-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patient: { ...patient },
      doctorName: doctorName || clinicInfo.defaultDoctor || 'BS. Trần Hoài Long',
      selectedTests: [...selectedTests],
      conclusion: conclusion || '',
      isAllergen,
      cloudPdfUrl: cloudLink || undefined,
      qrCodeDataUrl: qrCodeDataUrl || undefined,
      status: cloudLink ? 'Đã xuất Cloud' : 'Đã có kết quả',
      testCount: selectedTests.length
    };
    setZaloTargetReport(currentReport);
    setIsZaloModalOpen(true);
  };

  const handleZnsSuccess = (reportCode: string) => {
    saveOrUpdateReport({
      patient,
      selectedTests,
      conclusion,
      doctorName,
      cloudPdfUrl: cloudLink || undefined,
      qrCodeDataUrl: qrCodeDataUrl || undefined,
      zaloSentAt: new Date().toISOString()
    });
    showToast(`Đã gửi tin nhắn Zalo ZNS thành công tới phiếu ${reportCode}!`, "success");
  };

  // Xác định xem có phải báo cáo dị nguyên không (Booklet 6 trang)
  const isAllergenPackage = selectedTests.some(
    (t) => (t.category && t.category.includes("Dị Nguyên")) || t.unit === "IU/mL"
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* 1. HEADER CHÍNH */}
      <Header
        clinicInfo={clinicInfo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCatalogModal={handleOpenCatalogModal}
        onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
        onOpenRevenueModal={() => setIsRevenueModalOpen(true)}
        onOpenReportManagerModal={() => setIsReportManagerOpen(true)}
        reportCount={savedReports.length}
        invoiceCount={0}
      />

      {/* TOAST THÔNG BÁO TOÀN CỤC */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center space-x-2 ${
              toast.type === "success"
                ? "bg-emerald-600 border-emerald-500 text-white"
                : toast.type === "error"
                ? "bg-red-600 border-red-500 text-white"
                : toast.type === "warning"
                ? "bg-amber-500 border-amber-400 text-white"
                : "bg-slate-800 border-slate-700 text-white"
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 2. KHUNG NỘI DUNG CHÍNH (2 CỘT 4:8) */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 md:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* PANEL TRÁI (COL-4): FORM THÔNG TIN BỆNH NHÂN & KẾT LUẬN */}
        <section className="lg:col-span-4 space-y-4 flex flex-col">
          <PatientForm
            patient={patient}
            setPatient={setPatient}
            onFileUpload={handleFileUpload}
            onClearAll={handleClearAll}
            showToast={showToast}
            doctorsList={doctorsList}
            onOpenDoctorModal={() => handleOpenCatalogModal("DOCTORS")}
          />

          <ConclusionForm
            conclusion={conclusion}
            setConclusion={setConclusion}
            doctorName={doctorName}
            setDoctorName={setDoctorName}
            cloudLink={cloudLink}
            isExporting={isExporting}
            currentStep={currentStep}
            onExportPdfAndUpload={handleExportPdfAndUpload}
            onDownloadPdf={handleDownloadPdfDirect}
            onOpenPreview={() => setIsPreviewOpen(true)}
            onSaveReport={handleSaveCurrentReport}
            onDirectSendZalo={handleDirectSendZalo}
            onOpenSendZaloModal={handleOpenZaloModal}
            onResetAll={handleClearAll}
            onDownloadQrCode={() => handleDownloadQrCode(patient.name, patient.code)}
            onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
            doctorsList={doctorsList}
            onOpenDoctorModal={() => handleOpenCatalogModal("DOCTORS")}
          />
        </section>

        {/* PANEL PHẢI (COL-8): BẢNG CHỌN CHỈ SỐ XÉT NGHIỆM */}
        <section className="lg:col-span-8 flex flex-col">
          <TestTable
            catalog={catalog}
            testPackages={testPackages}
            testGroups={testGroups}
            selectedTests={selectedTests}
            setSelectedTests={setSelectedTests}
            showToast={showToast}
            onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
          />
        </section>
      </main>

      {/* 3. MODALS POPUP QUẢN LÝ */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        clinicInfo={clinicInfo}
        setClinicInfo={setClinicInfo}
        cloudDbConfig={cloudDbConfig}
        setCloudDbConfig={setCloudDbConfig}
        zaloConfig={zaloConfig}
        setZaloConfig={setZaloConfig}
        showToast={showToast}
      />

      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        clinicInfo={clinicInfo}
        patient={patient}
        selectedTests={selectedTests}
        conclusion={conclusion}
        doctorName={doctorName}
        qrCodeDataUrl={qrCodeDataUrl}
        cloudLink={cloudLink}
        isExporting={isExporting}
        currentStep={currentStep}
        lastError={lastError}
        showToast={showToast}
        onExportPdfAndUpload={handleExportPdfAndUpload}
        onDownloadPdf={handleDownloadPdf}
        onRetryExport={handleRetryExport}
        onPrintDirect={handlePrintDirect}
        onDownloadQrCode={() => handleDownloadQrCode(patient.name, patient.code)}
      />

      <CatalogManagerModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
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
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        clinicInfo={clinicInfo}
        patient={patient}
        selectedTests={selectedTests}
        showToast={showToast}
      />

      <RevenueManagerModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        showToast={showToast}
      />

      <ReportManagerModal
        isOpen={isReportManagerOpen}
        onClose={() => setIsReportManagerOpen(false)}
        reports={savedReports}
        onSelectReport={handleSelectSavedReport}
        onDeleteReport={deleteReport}
        onOpenZaloModal={(rep) => {
          setZaloTargetReport(rep);
          setIsZaloModalOpen(true);
        }}
        showToast={showToast}
      />

      {isZaloModalOpen && zaloTargetReport && (
        <SendZaloModal
          isOpen={isZaloModalOpen}
          onClose={() => {
            setIsZaloModalOpen(false);
            setZaloTargetReport(null);
          }}
          report={zaloTargetReport}
          clinicInfo={clinicInfo}
          zaloConfig={zaloConfig}
          showToast={showToast}
          onZnsSuccess={handleZnsSuccess}
        />
      )}

      {/* MODAL GIAO DIỆN LOADING TRANSACTION */}
      <TransactionLoadingModal
        isOpen={isExporting}
        currentStep={currentStep}
        patient={patient}
      />

      {/* 4. ANCHOR THẺ ẨN CHỜ IN VÀ CHỤP CANVAS SẮC NÉT (PRINT TEMPLATES) */}
      <div 
        className="fixed -left-[9999px] top-0 pointer-events-none overflow-hidden"
        style={{ width: '210mm', minWidth: '210mm', maxWidth: '210mm', opacity: 1, zIndex: -100 }}
      >
        {isAllergenPackage ? (
          <FullAllergenReportView
            elementId="printable-allergen-report"
            clinicInfo={clinicInfo}
            patient={patient}
            selectedTests={selectedTests}
            doctorName={doctorName}
            qrCodeDataUrl={qrCodeDataUrl}
          />
        ) : (
          <PrintReportView
            elementId="printable-medical-report"
            clinicInfo={clinicInfo}
            patient={patient}
            selectedTests={selectedTests}
            conclusion={conclusion}
            doctorName={doctorName}
            qrCodeDataUrl={qrCodeDataUrl}
          />
        )}
      </div>
    </div>
  );
}
