import { useState } from "react";
import Header from "./components/Header";
import PatientForm from "./components/PatientForm";
import TestTable from "./components/TestTable";
import ConclusionForm from "./components/ConclusionForm";
import PrintReportView from "./components/PrintReportView";
import FullAllergenReportView from "./components/FullAllergenReportView";
import SettingsModal from "./components/SettingsModal";
import PdfPreviewModal from "./components/PdfPreviewModal";
import CatalogManagerModal, { CatalogTabType } from "./components/CatalogManagerModal";
import InvoiceModal from "./components/InvoiceModal";
import RevenueManagerModal from "./components/RevenueManagerModal";
import ReportManagerModal from "./components/ReportManagerModal";
import SendZaloModal from "./components/SendZaloModal";
import TransactionLoadingModal from "./components/TransactionLoadingModal";

import { parseExcelCatalog } from "@infra/excelService";
import { openDataFolder } from "@infra/storage";
import { generateZaloTextMessage, openZaloChat } from "@infra/zaloService";
import { SelectedTest, Invoice, ToastType, MedicalReport } from "@domain/types";

import { usePatientManager } from "./hooks/usePatientManager";
import { useCatalogData } from "./hooks/useCatalogData";
import { useReportExport } from "./hooks/useReportExport";
import { useReportManager } from "./hooks/useReportManager";

import { CheckCircle, AlertCircle, Info } from "lucide-react";

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

  // 2. STATE THÔNG TIN BỆNH NHÂN (Tự động tăng mã BN & BP)
  const {
    patient,
    setPatient,
    resetPatient
  } = usePatientManager();

  // 3. STATE KẾT QUẢ & CHỈ ĐỊNH XÉT NGHIỆM
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [conclusion, setConclusion] = useState<string>("");
  const [doctorName, setDoctorName] = useState<string>("");

  // 4. STATE CÁC MODAL
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogModalTargetTab, setCatalogModalTargetTab] = useState<CatalogTabType | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isReportManagerOpen, setIsReportManagerOpen] = useState(false);
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false);
  const [zaloTargetReport, setZaloTargetReport] = useState<MedicalReport | null>(null);

  // Sổ thu phí & hóa đơn
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // TOAST THÔNG BÁO NỔI
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
      console.error("Lỗi khi mở file Excel:", err);
      showToast("Đã xảy ra lỗi khi đọc file Excel!", "error");
    }
  };

  // 6. SỔ LƯU PHIẾU XÉT NGHIỆM (REPORT MANAGER)
  const {
    reports,
    saveOrUpdateReport,
    deleteReport,
    clearAllReports
  } = useReportManager();

  // Reset toàn bộ giao diện cho bệnh nhân mới
  const handleClearAll = () => {
    resetPatient();
    setSelectedTests([]);
    setConclusion("");
    setDoctorName("");
    resetExport();
    showToast("Đã làm mới thông tin cho bệnh nhân tiếp theo!", "info");
  };

  // Nạp 1 phiếu xét nghiệm đã lưu lên màn hình làm việc
  const handleLoadReport = (rep: MedicalReport) => {
    setPatient({ ...rep.patient });
    setSelectedTests([...rep.selectedTests]);
    setConclusion(rep.conclusion || "");
    setDoctorName(rep.doctorName || "");
    resetExport();
    setIsReportManagerOpen(false);
    showToast(`Đã nạp thành công phiếu của bệnh nhân ${rep.patient.name} (${rep.code})!`, "success");
  };

  // Xem trước phiếu đã lưu từ Sổ lưu
  const handlePreviewSavedReport = (rep: MedicalReport) => {
    setPatient({ ...rep.patient });
    setSelectedTests([...rep.selectedTests]);
    setConclusion(rep.conclusion || "");
    setDoctorName(rep.doctorName || "");
    setIsReportManagerOpen(false);
    setIsPreviewOpen(true);
  };

  // Nhân bản phiếu
  const handleDuplicateReport = (rep: MedicalReport) => {
    resetPatient();
    setSelectedTests([...rep.selectedTests]);
    setConclusion(rep.conclusion || "");
    setDoctorName(rep.doctorName || "");
    resetExport();
    setIsReportManagerOpen(false);
    showToast(`Đã nhân bản danh mục chỉ số từ bệnh nhân ${rep.patient.name}!`, "info");
  };

  // Lưu thủ công phiếu hiện tại
  const handleSaveCurrentReport = () => {
    if (!patient.name.trim()) {
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
      const saved = saveOrUpdateReport({
        patient,
        selectedTests,
        conclusion,
        doctorName: doctorName || patient.doctor || 'BS. Trần Hoài Long',
        cloudPdfUrl: result.finalUrl || undefined,
        qrCodeDataUrl: result.finalQrCodeDataUrl || undefined,
        status: 'Đã xuất Cloud'
      });
      showToast(`Đã xuất Cloud & tự động lưu phiếu bệnh nhân ${saved.patient.name} (${saved.code}) vào Sổ Lưu!`, "success");
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
      doctorName: doctorName || patient.doctor || 'BS. Trần Hoài Long',
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
        doctorName: doctorName || patient.doctor || 'BS. Trần Hoài Long',
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
      doctorName: doctorName || patient.doctor || 'BS. Trần Hoài Long',
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
      saveOrUpdateReport({
        ...rep,
        zaloSentAt: new Date().toISOString()
      });
    }
    showToast(`Đã gửi tin nhắn Zalo ZNS thành công tới phiếu ${reportCode}!`, "success");
  };

  const handlePrintDirect = () => {
    window.print();
  };

  const handleOpenDataDirectory = () => {
    try {
      openDataFolder();
    } catch {
      showToast("Tính năng mở thư mục chỉ khả dụng trong môi trường hệ thống hỗ trợ!", "info");
    }
  };

  const handleOpenCatalogModal = (tab?: CatalogTabType) => {
    setCatalogModalTargetTab(tab || null);
    setIsCatalogModalOpen(true);
  };

  const handleSaveInvoice = (inv: Invoice) => {
    setInvoices((prev) => [inv, ...prev]);
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
            doctorName={doctorName}
            setDoctorName={setDoctorName}
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
        onRetryExport={handleExportPdfAndUpload}
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
        doctorName={doctorName}
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
