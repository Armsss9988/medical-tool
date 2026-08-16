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

import { parseExcelCatalog } from "@infra/excelService";
import { openDataFolder, isElectron } from "@infra/storage";
import { SelectedTest, Invoice, ToastType, MedicalReport } from "@domain/types";

import { usePatientManager } from "./hooks/usePatientManager";
import { useCatalogData } from "./hooks/useCatalogData";
import { useReportExport } from "./hooks/useReportExport";
import { useReportManager } from "./hooks/useReportManager";

import { CheckCircle, AlertCircle, Info, FolderOpen } from "lucide-react";

export default function App() {
  // 1. DOMAIN CUSTOM HOOKS
  const { patient, setPatient, resetPatient } = usePatientManager();
  const {
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
    invoices,
    setInvoices,
    clinicInfo,
    setClinicInfo,
    cloudDbConfig,
    setCloudDbConfig
  } = useCatalogData();

  // 2. REPORT MANAGER HOOK (SỔ LƯU PHIẾU XN)
  const { 
    reports, 
    saveOrUpdateReport, 
    deleteReport, 
    clearAllReports 
  } = useReportManager();

  // 3. STATE KẾT QUẢ VÀ KẾT LUẬN
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [conclusion, setConclusion] = useState<string>("");
  const [doctorName, setDoctorName] = useState<string>("BS. Trần Hoài Long");

  // 4. POPUPS & NOTIFICATION
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogModalTargetTab, setCatalogModalTargetTab] = useState<CatalogTabType | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isReportManagerOpen, setIsReportManagerOpen] = useState(false);
  const [currentPackageId, setCurrentPackageId] = useState("all");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleOpenCatalogModal = (tab?: CatalogTabType) => {
    setCatalogModalTargetTab(tab || null);
    setIsCatalogModalOpen(true);
  };

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 4. REPORT EXPORT HOOK
  const {
    cloudLink,
    qrCodeDataUrl,
    handleExportPdfAndUploadCloud,
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

  const handleSelectPackage = (packageId: string) => {
    setCurrentPackageId(packageId);
    if (!packageId || packageId === "all") return;

    const pkg = testPackages.find((p) => p.id === packageId);
    if (!pkg || !pkg.codes || pkg.codes.length === 0) return;

    const selectedIndicators = catalog.filter((item) => pkg.codes.includes(item.code));

    if (selectedIndicators.length === 0) {
      showToast("Gói này không có chỉ số nào trong danh mục hiện tại!", "info");
      return;
    }

    const formattedTests: SelectedTest[] = selectedIndicators.map((item) => {
      const isAllergenItem = item.category?.includes("Dị Nguyên") || item.unit === "IU/mL";
      return {
        ...item,
        result: "",
        note: isAllergenItem ? "Âm tính (Độ 0)" : "Bình thường"
      };
    });

    setSelectedTests(formattedTests);
    showToast(`Đã nạp gói: ${pkg.name} (${formattedTests.length} chỉ số)!`, "success");
  };

  // 6. ACTION HANDLERS
  const handlePrintDirect = () => {
    window.print();
  };

  const handleSaveCurrentReport = () => {
    if (!patient.name?.trim()) {
      showToast("Vui lòng nhập họ tên bệnh nhân trước khi lưu!", "error");
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

  const handleExportPdfAndUpload = () => {
    const isAllergen = selectedTests.some(
      (t) => (t.category && t.category.includes("Dị Nguyên")) || t.unit === "IU/mL"
    );
    const elementId = isAllergen ? "printable-allergen-report" : "printable-medical-report";
    const filename = `PhieuXN_${(patient.name || "BenhNhan").replace(/\s+/g, "_")}_${patient.code}.pdf`;
    
    // Tự động lưu phiếu vào sổ lưu khi kích hoạt xuất Cloud
    saveOrUpdateReport({
      patient,
      selectedTests,
      conclusion,
      doctorName,
      cloudPdfUrl: cloudLink || undefined,
      qrCodeDataUrl: qrCodeDataUrl || undefined
    });

    handleExportPdfAndUploadCloud(elementId, filename);
  };

  const handleLoadReport = (rep: MedicalReport) => {
    setPatient(rep.patient);
    setSelectedTests(rep.selectedTests);
    setConclusion(rep.conclusion || "");
    setDoctorName(rep.doctorName || "BS. Trần Hoài Long");
    showToast(`Đã nạp phiếu của bệnh nhân ${rep.patient.name} (${rep.code}) lên màn hình chính!`, "success");
  };

  const handlePreviewSavedReport = (rep: MedicalReport) => {
    handleLoadReport(rep);
    setIsPreviewOpen(true);
  };

  const handleDuplicateReport = (rep: MedicalReport) => {
    resetPatient();
    setPatient((prev) => ({
      ...prev,
      name: rep.patient.name,
      dob: rep.patient.dob,
      gender: rep.patient.gender,
      phone: rep.patient.phone,
      address: rep.patient.address,
      diagnosis: rep.patient.diagnosis
    }));
    setSelectedTests(rep.selectedTests.map((t) => ({ ...t, result: "" })));
    setConclusion("");
    setDoctorName(rep.doctorName || "BS. Trần Hoài Long");
    resetExport();
    showToast(`Đã nhân bản thông tin bệnh nhân ${rep.patient.name} sang phiếu mới!`, "success");
  };

  const handleClearAll = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ thông tin bệnh nhân và kết quả xét nghiệm hiện tại để nhập bệnh nhân mới?")) {
      resetPatient();
      setSelectedTests([]);
      setConclusion("");
      resetExport();
      setCurrentPackageId("all");
      showToast("Đã làm mới màn hình!", "info");
    }
  };

  const handleSaveInvoice = (newInvoice: Invoice) => {
    setInvoices((prev) => [newInvoice, ...prev]);
    showToast(`Đã lưu hóa đơn ${newInvoice.code} (${newInvoice.finalAmount.toLocaleString("vi-VN")} VNĐ) & cộng sổ!`, "success");
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    showToast("Đã xóa hóa đơn khỏi sổ sách!", "info");
  };

  const handleClearAllInvoices = () => {
    setInvoices([]);
    showToast("Đã xóa toàn bộ lịch sử hóa đơn!", "info");
  };

  const handleOpenDataFolder = async () => {
    if (isElectron()) {
      const folderPath = await openDataFolder();
      if (folderPath) {
        showToast(`Đã mở thư mục dữ liệu: ${folderPath}`, "info");
      }
    } else {
      showToast("Tính năng mở thư mục chỉ khả dụng khi chạy file .exe Electron", "info");
    }
  };

  const isAllergenPackage = selectedTests.some(
    (t) => (t.category && t.category.includes("Dị Nguyên")) || t.unit === "IU/mL"
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans pb-10">
      {/* 1. HEADER CHÍNH ỨNG DỤNG */}
      <Header
        clinicInfo={clinicInfo}
        setClinicInfo={setClinicInfo}
        onLoadExcelFile={handleLoadExcelFile}
        catalog={catalog}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCatalogModal={() => handleOpenCatalogModal()}
        onOpenRevenueModal={() => setIsRevenueModalOpen(true)}
        onOpenReportManagerModal={() => setIsReportManagerOpen(true)}
        onOpenDataFolder={handleOpenDataFolder}
        invoiceCount={invoices.length}
        reportCount={reports.length}
      />

      {/* TOAST NOTIFICATION FLOATING BANNER */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500"
                : toast.type === "error"
                ? "bg-rose-600 text-white border-rose-500"
                : "bg-cyan-600 text-white border-cyan-500"
            }`}
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5" />}
            {toast.type === "info" && <Info className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER CONTENT */}
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
            onExportPdfAndUpload={handleExportPdfAndUpload}
            onOpenPreview={() => setIsPreviewOpen(true)}
            onSaveReport={handleSaveCurrentReport}
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
            selectedTests={selectedTests}
            setSelectedTests={setSelectedTests}
            onSelectPackage={handleSelectPackage}
          />
        </section>
      </main>

      {/* FOOTER ACTIONS */}
      <footer className="max-w-[1680px] w-full mx-auto px-4 md:px-6 mt-4 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-600">GoLab Medical Diagnostic System</span>
          <span>•</span>
          <span>Phiên bản v2.0 Chuẩn Y Khoa</span>
        </div>

        <button
          onClick={handleOpenDataFolder}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl shadow-2xs text-slate-700 font-bold transition-all active:scale-95"
          title="Mở thư mục lưu trữ dữ liệu JSON trên đĩa C:"
        >
          <FolderOpen className="w-4 h-4 text-emerald-600" />
          <span>Thư mục dữ liệu GoLabData</span>
        </button>
      </footer>

      {/* CÁC POPUP MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        clinicInfo={clinicInfo}
        setClinicInfo={setClinicInfo}
        cloudDbConfig={cloudDbConfig}
        onSaveCloudDbConfig={setCloudDbConfig}
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
        showToast={showToast}
        onExportPdfAndUpload={handleExportPdfAndUpload}
        onPrintDirect={handlePrintDirect}
        onDownloadQrCode={() => handleDownloadQrCode(patient.name, patient.code)}
      />

      <CatalogManagerModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        targetTab={catalogModalTargetTab}
        catalog={catalog}
        onSaveCatalog={(newCat) => {
          setCatalog(newCat);
          showToast(`Đã lưu bảng giá danh mục mới (${newCat.length} chỉ số)!`, "success");
        }}
        testPackages={testPackages}
        onSavePackages={(newPkgs) => {
          setTestPackages(newPkgs);
          showToast("Đã cập nhật danh sách các gói xét nghiệm!", "success");
        }}
        testGroups={testGroups}
        onSaveTestGroups={(newGroups) => {
          setTestGroups(newGroups);
        }}
        equipments={equipments}
        onSaveEquipments={(newEqs) => {
          setEquipments(newEqs);
        }}
        doctorsList={doctorsList}
        onSaveDoctors={(newDocs) => {
          setDoctorsList(newDocs);
          showToast("Đã cập nhật danh sách Bác sĩ chỉ định!", "success");
        }}
      />

      {/* MODAL HÓA ĐƠN & THANH TOÁN */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        patient={patient}
        selectedTests={selectedTests}
        currentPackageId={currentPackageId}
        testPackages={testPackages}
        doctorsList={doctorsList}
        onSaveInvoice={handleSaveInvoice}
      />

      {/* MODAL BÁO CÁO & SỔ SÁCH DOANH THU */}
      <RevenueManagerModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        invoices={invoices}
        onDeleteInvoice={handleDeleteInvoice}
        onClearAllInvoices={handleClearAllInvoices}
        doctorsList={doctorsList}
      />

      {/* MODAL QUẢN LÝ SỔ LƯU PHIẾU XÉT NGHIỆM */}
      <ReportManagerModal
        isOpen={isReportManagerOpen}
        onClose={() => setIsReportManagerOpen(false)}
        reports={reports}
        doctorsList={doctorsList}
        onLoadReport={handleLoadReport}
        onPreviewReport={handlePreviewSavedReport}
        onDuplicateReport={handleDuplicateReport}
        onDeleteReport={deleteReport}
        onClearAllReports={clearAllReports}
        showToast={showToast}
      />

      {/* 4. ANCHOR THẺ ẨN CHỜ IN VÀ CHỤP CANVAS SẮC NÉT (PRINT TEMPLATES) */}
      <div className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none">
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
