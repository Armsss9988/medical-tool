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
import { useMedicalReports } from "./hooks/useMedicalReports";
import { useInvoices } from "./hooks/useInvoices";
import { useZaloMessaging } from "./hooks/useZaloMessaging";
import { parseExcelCatalog } from "./infrastructure/excelService";
import {
  Patient,
  SelectedTest,
  Invoice,
  MedicalReport,
  ToastType,
  CatalogTabType,
  DEFAULT_PATIENT
} from "./domain/types";
import {
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

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
  const [patient, setPatient] = useState<Patient>({ ...DEFAULT_PATIENT });
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
  const handleLoadExcelFile = async (fileOrBuffer: Blob | ArrayBuffer) => {
    try {
      showToast("Đang đọc dữ liệu danh mục từ file Excel...", "info");
      const items = await parseExcelCatalog(fileOrBuffer);
      if (items && items.length > 0) {
        setCatalog(items);
        showToast(`Đã nhập thành công ${items.length} chỉ số xét nghiệm từ Excel!`, "success");
      } else {
        showToast("File Excel không đúng định dạng hoặc không có dữ liệu!", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi đọc file Excel!", "error");
    }
  };

  const handleOpenDataDirectory = () => {
    showToast("Tính năng mở thư mục dữ liệu nội bộ được bảo vệ bởi trình duyệt. Vui lòng chọn file Excel qua nút Tải File.", "info");
  };

  // 6. MEDICAL REPORTS (SỔ LƯU TRỮ KẾT QUẢ)
  const {
    reports,
    saveReport,
    deleteReport,
    clearAllReports
  } = useMedicalReports(cloudDbConfig);

  // 7. INVOICES (QUẢN LÝ THU PHÍ)
  const {
    invoices,
    setInvoices,
    saveInvoice
  } = useInvoices();

  // 8. ZALO MESSAGING HOOK
  const {
    generateZaloTextMessage,
    openZaloChat
  } = useZaloMessaging(zaloConfig);

  // HANDLERS ĐIỀU HƯỚNG & THAO TÁC
  const handleOpenCatalogModal = (tab?: CatalogTabType) => {
    setCatalogModalTargetTab(tab || null);
    setIsCatalogModalOpen(true);
  };

  const resetPatient = () => {
    const timestamp = Date.now().toString().slice(-6);
    setPatient({
      ...DEFAULT_PATIENT,
      code: `BN-${timestamp}`,
      sampleCode: `BP-${timestamp}`
    });
  };

  const handleClearAll = () => {
    resetPatient();
    setSelectedTests([]);
    setConclusion("");
    setDoctorName("");
    resetExport();
    showToast("Đã làm mới toàn bộ biểu mẫu để nhập bệnh nhân mới!", "info");
  };

  const handleLoadReport = (report: MedicalReport) => {
    setPatient({ ...report.patient });
    setSelectedTests([...report.selectedTests]);
    setConclusion(report.conclusion || "");
    setDoctorName(report.doctorName || "");
    setIsReportManagerOpen(false);
    showToast(`Đã nạp phiếu của bệnh nhân ${report.patient.name} (${report.code})!`, "success");
  };

  const handlePreviewSavedReport = (report: MedicalReport) => {
    setPatient({ ...report.patient });
    setSelectedTests([...report.selectedTests]);
    setConclusion(report.conclusion || "");
    setDoctorName(report.doctorName || "");
    setIsReportManagerOpen(false);
    setIsPreviewOpen(true);
  };

  const handleDuplicateReport = (report: MedicalReport) => {
    const timestamp = Date.now().toString().slice(-6);
    setPatient({
      ...report.patient,
      code: `BN-${timestamp}`,
      sampleCode: `BP-${timestamp}`
    });
    setSelectedTests([...report.selectedTests]);
    setConclusion(report.conclusion || "");
    setDoctorName(report.doctorName || "");
    setIsReportManagerOpen(false);
    showToast(`Đã nhân bản phiếu cho mã mới BN-${timestamp}!`, "success");
  };

  const handlePrintDirect = () => {
    window.print();
  };

  const handleSaveCurrentReport = () => {
    if (!patient.name || !patient.name.trim()) {
      showToast("Vui lòng nhập họ và tên bệnh nhân trước khi lưu!", "error");
      return;
    }
    const isAllergen = selectedTests.some(
      (t) => (t.category && t.category.includes("Dị Nguyên")) || t.unit === "IU/mL"
    );
    const saved = saveReport({
      code: patient.code,
      sampleCode: patient.sampleCode,
      patient: { ...patient },
      doctorName: doctorName || clinicInfo.defaultDoctor || 'BS. Trần Hoài Long',
      selectedTests: [...selectedTests],
      conclusion: conclusion || '',
      isAllergen,
      cloudPdfUrl: cloudLink || undefined,
      qrCodeDataUrl: qrCodeDataUrl || undefined,
      status: cloudLink ? 'Đã xuất Cloud' : 'Đã có kết quả',
      testCount: selectedTests.length
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
      saveReport({
        code: patient.code,
        sampleCode: patient.sampleCode,
        patient: { ...patient },
        doctorName: doctorName || clinicInfo.defaultDoctor || 'BS. Trần Hoài Long',
        selectedTests: [...selectedTests],
        conclusion: conclusion || '',
        isAllergen,
        cloudPdfUrl: result.finalUrl || undefined,
        qrCodeDataUrl: result.finalQrCodeDataUrl || undefined,
        status: 'Đã xuất Cloud',
        testCount: selectedTests.length
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
      saveReport({
        ...currentReport,
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

  const handleOpenZaloModalForReport = (report: MedicalReport) => {
    setZaloTargetReport(report);
    setIsZaloModalOpen(true);
  };

  const handleZnsSuccess = (reportCode: string) => {
    const rep = reports.find((r) => r.code === reportCode);
    if (rep) {
      saveReport({
        ...rep,
        zaloSentAt: new Date().toISOString()
      });
    }
    showToast(`Đã gửi tin nhắn Zalo ZNS thành công tới phiếu ${reportCode}!`, "success");
  };

  const handleSaveInvoice = (inv: Invoice) => {
    saveInvoice(inv);
    showToast(`Đã tạo và lưu hóa đơn ${inv.code} cho bệnh nhân ${inv.patientName}!`, "success");
  };

  const isAllergenPackage = selectedTests.some(
    (t) => (t.category && t.category.includes("Dị Nguyên")) || t.unit === "IU/mL"
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 pb-12 print:bg-white print:p-0 print:m-0">
      {/* 1. TOP HEADER NAVIGATION */}
      <Header
        clinicInfo={clinicInfo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCatalogModal={() => handleOpenCatalogModal("INDICATORS")}
        onOpenRevenueModal={() => setIsRevenueModalOpen(true)}
        onOpenReportManagerModal={() => setIsReportManagerOpen(true)}
        onOpenDataFolder={handleOpenDataDirectory}
        onLoadExcelFile={handleLoadExcelFile}
        reportCount={reports.length}
        invoiceCount={invoices.length}
      />

      {/* TOAST THÔNG BÁO NỔI GÓC PHẢI */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/50"
              : toast.type === "error"
              ? "bg-rose-950/90 text-rose-200 border-rose-500/50"
              : "bg-slate-900/90 text-slate-100 border-slate-700"
          }`}
        >
          {toast.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
          {toast.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toast.type === "info" && <Info className="w-4 h-4 text-sky-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 2. KHUNG NỘI DUNG CHÍNH (MAIN WORKSPACE) */}
      <main className="max-w-[1680px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 flex-grow">
        {/* PANEL TRÁI (COL-4): BỆNH NHÂN & KẾT LUẬN */}
        <section className="lg:col-span-4 flex flex-col space-y-5">
          <PatientForm
            patient={patient}
            setPatient={setPatient}
            onGenerateNewCode={resetPatient}
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
        patient={patient}
        selectedTests={selectedTests}
        currentPackageId="all"
        testPackages={testPackages}
        doctorsList={doctorsList}
        onSaveInvoice={handleSaveInvoice}
      />

      <RevenueManagerModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        invoices={invoices}
        onDeleteInvoice={(id) => setInvoices((prev) => prev.filter((inv) => inv.id !== id))}
        onClearAllInvoices={() => setInvoices([])}
        doctorsList={doctorsList}
      />

      {/* MODAL SỔ LƯU KẾT QUẢ XÉT NGHIỆM */}
      <ReportManagerModal
        isOpen={isReportManagerOpen}
        onClose={() => setIsReportManagerOpen(false)}
        reports={reports}
        onLoadReport={handleLoadReport}
        onPreviewReport={handlePreviewSavedReport}
        onDuplicateReport={handleDuplicateReport}
        onOpenSendZaloModal={handleOpenZaloModalForReport}
        onDeleteReport={deleteReport}
        onClearAllReports={clearAllReports}
        showToast={showToast}
      />

      {/* MODAL GỬI KẾT QUẢ QUA ZALO */}
      {zaloTargetReport && (
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
