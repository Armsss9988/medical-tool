import { useState } from "react";
import Header from "./components/Header";
import PatientForm from "./components/PatientForm";
import TestTable from "./components/TestTable";
import ConclusionForm from "./components/ConclusionForm";
import PrintReportView from "./components/PrintReportView";
import FullAllergenReportView from "./components/FullAllergenReportView";
import SettingsModal from "./components/SettingsModal";
import PdfPreviewModal from "./components/PdfPreviewModal";
import CatalogManagerModal from "./components/CatalogManagerModal";
import InvoiceModal from "./components/InvoiceModal";
import RevenueManagerModal from "./components/RevenueManagerModal";

import { parseExcelCatalog } from "@infra/excelService";
import { openDataFolder, isElectron } from "@infra/storage";
import { SelectedTest, Invoice, ToastType } from "@domain/types";

import { usePatientManager } from "./hooks/usePatientManager";
import { useCatalogData } from "./hooks/useCatalogData";
import { useReportExport } from "./hooks/useReportExport";

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

  // 2. STATE KếT QUẢ VÀ KếT LUẬN
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [conclusion, setConclusion] = useState<string>("");
  const [doctorName, setDoctorName] = useState<string>("BS. Trần Hoài Long");

  // 3. POPUPS & NOTIFICATION
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [currentPackageId, setCurrentPackageId] = useState("all");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

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
      const isAllergenItem = item.category?.includes("Đị Nguyên") || item.unit === "IU/mL";
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

  const handleExportPdfAndUpload = () => {
    const isAllergenPackage = selectedTests.some(
      (t) => (t.category && t.category.includes("Đị Nguyên")) || t.unit === "IU/mL"
    );
    const elementId = isAllergenPackage ? "printable-allergen-report" : "printable-medical-report";
    const filename = `PhieuXN_${(patient.name || "BenhNhan").replace(/\s+/g, "_")}_${patient.code}.pdf`;
    handleExportPdfAndUploadCloud(elementId, filename);
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
    (t) => (t.category && t.category.includes("Đị Nguyên")) || t.unit === "IU/mL"
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
        onOpenCatalogModal={() => setIsCatalogModalOpen(true)}
        onOpenRevenueModal={() => setIsRevenueModalOpen(true)}
        onOpenDataFolder={handleOpenDataFolder}
        invoiceCount={invoices.length}
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
            onOpenDoctorModal={() => setIsCatalogModalOpen(true)}
          />

          <ConclusionForm
            conclusion={conclusion}
            setConclusion={setConclusion}
            doctorName={doctorName}
            setDoctorName={setDoctorName}
            cloudLink={cloudLink}
            onExportPdfAndUpload={handleExportPdfAndUpload}
            onOpenPreview={() => setIsPreviewOpen(true)}
            onPrintDirect={handlePrintDirect}
            onResetAll={handleClearAll}
            onDownloadQrCode={() => handleDownloadQrCode(patient.name, patient.code)}
            onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
            doctorsList={doctorsList}
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

      {/* 4. ANCHOR THẺ ẨN CHờ IN VA CHỤP CANVAS SẮC NÉT (PRINT TEMPLATES) */}
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
