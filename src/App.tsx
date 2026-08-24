import { useState, useCallback, useRef, useMemo, useEffect } from "react";
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
import BatchExportModal from "./components/BatchExportModal";
import UnsavedChangesModal from "./components/UnsavedChangesModal";

import { parseExcelCatalog } from "@infra/excelService";
import { openDataFolder } from "@infra/storage";
import { generateZaloTextMessage, openZaloChat } from "@infra/zaloService";
import { SelectedTest, Invoice, ToastType, MedicalReport, BatchImportRow } from "@domain/types";
import { PatientCode } from "@domain/valueObjects/PatientCode";

import { usePatientManager } from "./hooks/usePatientManager";
import { useCatalogData } from "./hooks/useCatalogData";
import { useReportExport } from "./hooks/useReportExport";
import { useReportManager } from "./hooks/useReportManager";
import { useInvoiceManager } from "./hooks/useInvoiceManager";
import { useBatchExport } from "./hooks/useBatchExport";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useRecentTests } from "./hooks/useRecentTests";

import { CheckCircle, AlertCircle, Info, User, FlaskConical, FileText, CreditCard, Eye, CloudUpload } from "lucide-react";

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

  // RECORD IDENTIFICATION: Quản lý ID phiếu đang nạp để phân biệt Update vs Create
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  // KEYBOARD-FIRST: Refs & State
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [autoFocusName, setAutoFocusName] = useState(true);

  // RECENT TESTS HOOK
  const { recentTests, addToRecent, addMultipleToRecent, clearRecent: _clearRecent } = useRecentTests();

  // 4. STATE CÁC MODAL
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTargetReport, setPreviewTargetReport] = useState<MedicalReport | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogModalTargetTab, setCatalogModalTargetTab] = useState<CatalogTabType | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isReportManagerOpen, setIsReportManagerOpen] = useState(false);
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false);
  const [zaloTargetReport, setZaloTargetReport] = useState<MedicalReport | null>(null);
  const [isBatchExportModalOpen, setIsBatchExportModalOpen] = useState(false);

  // UNSAVED CHANGES GUARD MODAL STATE
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ name: string; run: () => void } | null>(null);

  // BATCH RENDER DATA (cho ẩn off-screen render)
  const [batchRenderReport, setBatchRenderReport] = useState<MedicalReport | null>(null);

  // Sổ thu phí & hóa đơn (quản lý bền vững qua useInvoiceManager)
  const {
    invoices,
    saveOrUpdateInvoice,
    deleteInvoice,
    clearAllInvoices
  } = useInvoiceManager();

  // MOBILE RESPONSIVE TAB STATE
  const [activeMobileTab, setActiveMobileTab] = useState<'PATIENT' | 'TESTS' | 'CONCLUSION'>('TESTS');

  const totalFee = useMemo(() => {
    return selectedTests.reduce((sum, t) => sum + (t.price || 0), 0);
  }, [selectedTests]);

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

  // Tự động đồng bộ mã BN ban đầu khi tải xong danh sách phiếu từ Storage
  const initialSyncRef = useRef(false);
  useEffect(() => {
    if (!initialSyncRef.current && reports.length > 0 && !patient.name.trim() && !currentReportId) {
      initialSyncRef.current = true;
      const existingCodes = reports.map((r) => r.code || r.patient?.code || '');
      const nextCode = PatientCode.generateNextCode(existingCodes);
      setPatient((prev) => ({
        ...prev,
        code: nextCode,
        sampleCode: nextCode
      }));
    }
  }, [reports, patient.name, currentReportId, setPatient]);

  // 7. BATCH EXPORT HOOK
  const handleSetBatchRenderData = useCallback(async (report: MedicalReport) => {
    setBatchRenderReport(report);
  }, []);

  const handleBatchReportExported = useCallback((report: MedicalReport, cloudUrl: string, qrDataUrl: string) => {
    saveOrUpdateReport({
      patient: report.patient,
      selectedTests: report.selectedTests,
      conclusion: report.conclusion,
      doctorName: report.doctorName,
      cloudPdfUrl: cloudUrl || undefined,
      qrCodeDataUrl: qrDataUrl || undefined,
      status: 'Đã xuất Cloud'
    });
  }, [saveOrUpdateReport]);

  const {
    progress: batchProgress,
    isBatchExporting: isBatchExportRunning,
    handleBatchExport,
    handleCancelBatch,
    handleDownloadZip,
  } = useBatchExport(clinicInfo, handleSetBatchRenderData, handleBatchReportExported);

  // BATCH IMPORT: Nhập hàng loạt phiếu từ Excel vào Sổ Lưu
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

  // ─── PHÁT HIỆN THAY ĐỔI CHƯA LƯU (DIRTY / UNSAVED STATE) ───────────────
  const hasUnsavedChanges = useMemo(() => {
    // 1. Chế độ tạo phiếu mới (chưa có trong Sổ Lưu)
    if (!currentReportId) {
      const hasName = !!patient.name.trim();
      const hasTests = selectedTests.length > 0;
      const hasConclusion = !!conclusion.trim();
      const hasPhone = !!patient.phone?.trim();
      const hasAddress = !!patient.address?.trim();
      return hasName || hasTests || hasConclusion || hasPhone || hasAddress;
    }

    // 2. Chế độ chỉnh sửa phiếu cũ đã nạp
    const orig = reports.find((r) => r.id === currentReportId);
    if (!orig) return false;

    const patientChanged =
      patient.name !== orig.patient.name ||
      patient.dob !== orig.patient.dob ||
      patient.gender !== orig.patient.gender ||
      (patient.phone || '') !== (orig.patient.phone || '') ||
      (patient.address || '') !== (orig.patient.address || '') ||
      (patient.diagnosis || '') !== (orig.patient.diagnosis || '') ||
      (doctorName && doctorName !== orig.doctorName);

    const conclusionChanged = (conclusion || '') !== (orig.conclusion || '');

    const testsChanged =
      selectedTests.length !== orig.selectedTests.length ||
      selectedTests.some((t, i) => {
        const o = orig.selectedTests[i];
        return !o || o.code !== t.code || o.result !== t.result || o.note !== t.note;
      });

    return patientChanged || conclusionChanged || testsChanged;
  }, [currentReportId, patient, selectedTests, conclusion, doctorName, reports]);

  // Cảnh báo trình duyệt nếu người dùng cố ý đóng/reload tab khi có dữ liệu chưa lưu
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Guard Helper: Chặn và hiển thị modal cảnh báo nếu đang có dữ liệu chưa lưu
  const requestActionWithGuard = useCallback((actionName: string, actionFn: () => void) => {
    if (hasUnsavedChanges) {
      setPendingAction({ name: actionName, run: actionFn });
      setIsUnsavedModalOpen(true);
    } else {
      actionFn();
    }
  }, [hasUnsavedChanges]);

  // Reset toàn bộ giao diện cho bệnh nhân mới (tự động tăng mã số trong ngày)
  const performClearAll = useCallback(() => {
    setCurrentReportId(null);
    const existingCodes = reports.map((r) => r.code || r.patient?.code || '');
    const nextCode = PatientCode.generateNextCode(existingCodes);
    resetPatient(nextCode);
    setSelectedTests([]);
    setConclusion("");
    setDoctorName("");
    resetExport();
    showToast("Đã làm mới thông tin cho bệnh nhân tiếp theo!", "info");
    // Auto-focus name input after reset
    setAutoFocusName(false);
    setTimeout(() => {
      setAutoFocusName(true);
      nameInputRef.current?.focus();
    }, 100);
  }, [reports, resetPatient, resetExport, showToast]);

  const handleClearAll = useCallback(() => {
    requestActionWithGuard("Làm mới phiếu (Bệnh nhân mới)", performClearAll);
  }, [requestActionWithGuard, performClearAll]);

  // Nạp 1 phiếu xét nghiệm đã lưu lên màn hình làm việc (chế độ Chỉnh Sửa theo ID)
  const performLoadReport = (rep: MedicalReport) => {
    setCurrentReportId(rep.id);
    setPatient({ ...rep.patient });
    setSelectedTests([...rep.selectedTests]);
    setConclusion(rep.conclusion || "");
    setDoctorName(rep.doctorName || "");
    resetExport();
    setIsReportManagerOpen(false);
    showToast(`Đã nạp thành công phiếu [${rep.code}] của bệnh nhân ${rep.patient.name} để chỉnh sửa!`, "success");
  };

  const handleLoadReport = (rep: MedicalReport) => {
    requestActionWithGuard(`Nạp phiếu [${rep.code}] của bệnh nhân ${rep.patient.name}`, () => performLoadReport(rep));
  };

  // Nhân bản phiếu (sinh mã mới và tạo record mới)
  const performDuplicateReport = (rep: MedicalReport) => {
    setCurrentReportId(null);
    const existingCodes = reports.map((r) => r.code || r.patient?.code || '');
    const nextCode = PatientCode.generateNextCode(existingCodes);
    resetPatient(nextCode);
    setSelectedTests([...rep.selectedTests]);
    setConclusion(rep.conclusion || "");
    setDoctorName(rep.doctorName || "");
    resetExport();
    setIsReportManagerOpen(false);
    showToast(`Đã nhân bản danh mục chỉ số sang mã mới [${nextCode}]!`, "info");
  };

  const handleDuplicateReport = (rep: MedicalReport) => {
    requestActionWithGuard(`Nhân bản danh mục chỉ số sang mã mới`, () => performDuplicateReport(rep));
  };

  // Xem trước phiếu đã lưu từ Sổ lưu (Chỉ xem trước A4 độc lập, KHÔNG ghi đè workspace đang làm việc)
  const handlePreviewSavedReport = (rep: MedicalReport) => {
    setPreviewTargetReport(rep);
    setIsPreviewOpen(true);
  };

  // Cập nhật lại PDF đơn lẻ cho 1 phiếu từ Sổ Lưu
  const handleUpdateSingleReportPdf = async (rep: MedicalReport) => {
    try {
      showToast(`Đang cập nhật lại PDF cho bệnh nhân ${rep.patient.name}...`, "info");
      setIsBatchExportModalOpen(true);
      await handleBatchExport([rep]);
      showToast(`Đã cập nhật PDF mới nhất cho phiếu [${rep.code}]!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi cập nhật PDF!", "error");
    }
  };

  // Cập nhật lại toàn bộ PDF cho các phiếu bị lỗi thời
  const handleBatchUpdateOutdatedReports = async (outdatedList: MedicalReport[]) => {
    if (outdatedList.length === 0) {
      showToast("Không có phiếu nào cần cập nhật PDF!", "info");
      return;
    }
    showToast(`Bắt đầu cập nhật PDF cho ${outdatedList.length} phiếu lỗi thời...`, "info");
    setIsReportManagerOpen(false);
    setIsBatchExportModalOpen(true);
    await handleBatchExport(outdatedList);
    showToast(`Đã hoàn tất cập nhật PDF cho ${outdatedList.length} phiếu!`, "success");
  };

  // Kiểm tra phiếu đang mở trên màn hình làm việc có bị Outdated so với bản PDF Cloud cũ không
  const currentLoadedReport = useMemo(() => {
    if (!currentReportId) return null;
    return reports.find((r) => r.id === currentReportId) || null;
  }, [currentReportId, reports]);

  const isCurrentPdfOutdated = useMemo(() => {
    if (!currentLoadedReport || !currentLoadedReport.cloudPdfUrl) return false;
    if (currentLoadedReport.isPdfOutdated) return true;
    const patientChanged =
      patient.name !== currentLoadedReport.patient.name ||
      patient.dob !== currentLoadedReport.patient.dob ||
      patient.gender !== currentLoadedReport.patient.gender ||
      patient.sampleCode !== currentLoadedReport.patient.sampleCode ||
      (doctorName && doctorName !== currentLoadedReport.doctorName);
    const conclusionChanged = (conclusion || '') !== (currentLoadedReport.conclusion || '');
    const testsChanged =
      selectedTests.length !== currentLoadedReport.selectedTests.length ||
      selectedTests.some((t, i) => {
        const orig = currentLoadedReport.selectedTests[i];
        return !orig || orig.code !== t.code || orig.result !== t.result || orig.note !== t.note;
      });

    return patientChanged || conclusionChanged || testsChanged;
  }, [currentLoadedReport, patient, conclusion, doctorName, selectedTests]);

  // Lưu thủ công phiếu hiện tại (Tự động Update nếu có ID hoặc Create mới)
  const handleSaveCurrentReport = () => {
    if (!patient.name.trim()) {
      showToast("Vui lòng nhập họ và tên bệnh nhân trước khi lưu!", "error");
      return;
    }
    const saved = saveOrUpdateReport({
      id: currentReportId || undefined,
      patient,
      selectedTests,
      conclusion,
      doctorName,
      cloudPdfUrl: cloudLink || undefined,
      qrCodeDataUrl: qrCodeDataUrl || undefined
    });
    setCurrentReportId(saved.id);
    showToast(`Đã lưu phiếu của bệnh nhân ${saved.patient.name} (${saved.code}) vào Sổ Lưu!`, "success");
  };

  // Xử lý các lựa chọn trong UnsavedChangesModal
  const handleUnsavedSaveAndProceed = () => {
    handleSaveCurrentReport();
    if (pendingAction) {
      pendingAction.run();
    }
    setPendingAction(null);
    setIsUnsavedModalOpen(false);
  };

  const handleUnsavedDiscardAndProceed = () => {
    if (pendingAction) {
      pendingAction.run();
    }
    setPendingAction(null);
    setIsUnsavedModalOpen(false);
  };

  const handleUnsavedCancel = () => {
    setPendingAction(null);
    setIsUnsavedModalOpen(false);
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
        id: currentReportId || undefined,
        patient,
        selectedTests,
        conclusion,
        doctorName: doctorName || patient.doctor || 'BS. Trần Hoài Long',
        cloudPdfUrl: result.finalUrl || undefined,
        qrCodeDataUrl: result.finalQrCodeDataUrl || undefined,
        status: 'Đã xuất Cloud'
      });
      setCurrentReportId(saved.id);
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
    const saved = saveOrUpdateInvoice(inv);
    showToast(`Đã tạo và lưu hóa đơn ${saved.code} (${saved.finalAmount.toLocaleString('vi-VN')} đ) cho bệnh nhân ${saved.patientName}!`, "success");
  };

  const isAllergenPackage = selectedTests.some(
    (t) => (t.category && t.category.includes("Dị Nguyên")) || t.unit === "IU/mL"
  );

  // ─── GLOBAL KEYBOARD SHORTCUTS ──────────────────────────────────────
  const isAnyModalOpen = useMemo(() => {
    return isUnsavedModalOpen || isPreviewOpen || isSettingsOpen || isCatalogModalOpen || isInvoiceModalOpen || isRevenueModalOpen || isReportManagerOpen || isZaloModalOpen || isBatchExportModalOpen;
  }, [isUnsavedModalOpen, isPreviewOpen, isSettingsOpen, isCatalogModalOpen, isInvoiceModalOpen, isRevenueModalOpen, isReportManagerOpen, isZaloModalOpen, isBatchExportModalOpen]);

  const globalShortcuts = useMemo(() => [
    { key: 'n', ctrl: true, shift: false, action: handleClearAll, disableInModal: true },
    { key: 's', ctrl: true, action: handleSaveCurrentReport, disableInModal: true },
    { key: 'p', ctrl: true, action: () => setIsPreviewOpen(true), disableInModal: true },
    { key: 'e', ctrl: true, shift: true, action: handleExportPdfAndUpload, disableInModal: true },
    { key: 'l', ctrl: true, action: () => setIsReportManagerOpen(true), disableInModal: true },
    { key: 'Escape', action: () => {
      if (isUnsavedModalOpen) handleUnsavedCancel();
      else if (isPreviewOpen) { setIsPreviewOpen(false); setPreviewTargetReport(null); }
      else if (isSettingsOpen) setIsSettingsOpen(false);
      else if (isCatalogModalOpen) setIsCatalogModalOpen(false);
      else if (isInvoiceModalOpen) setIsInvoiceModalOpen(false);
      else if (isRevenueModalOpen) setIsRevenueModalOpen(false);
      else if (isReportManagerOpen) setIsReportManagerOpen(false);
      else if (isZaloModalOpen) { setIsZaloModalOpen(false); setZaloTargetReport(null); }
      else if (isBatchExportModalOpen) setIsBatchExportModalOpen(false);
    }}
  ], [handleClearAll, handleSaveCurrentReport, handleExportPdfAndUpload,
      isUnsavedModalOpen, isPreviewOpen, isSettingsOpen, isCatalogModalOpen, isInvoiceModalOpen, isRevenueModalOpen,
      isReportManagerOpen, isZaloModalOpen, isBatchExportModalOpen]);

  useKeyboardShortcuts(globalShortcuts, isAnyModalOpen);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 pb-12 print:bg-white print:p-0 print:m-0">
      {/* 1. TOP HEADER NAVIGATION */}
      <Header
        clinicInfo={clinicInfo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCatalogModal={() => handleOpenCatalogModal("INDICATORS")}
        onOpenRevenueModal={() => setIsRevenueModalOpen(true)}
        onOpenReportManagerModal={() => setIsReportManagerOpen(true)}
        onOpenBatchExportModal={() => setIsBatchExportModalOpen(true)}
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
          <section className={`lg:col-span-4 flex flex-col space-y-4 lg:space-y-5 ${
            activeMobileTab === 'PATIENT' ? 'block' : 'hidden lg:flex'
          }`}>
            <PatientForm
              patient={patient}
              setPatient={setPatient}
              onGenerateNewCode={() => {
                const existingCodes = reports.map((r) => r.code || r.patient?.code || '');
                const nextCode = PatientCode.generateNextCode(existingCodes);
                resetPatient(nextCode);
                setCurrentReportId(null);
              }}
              doctorsList={doctorsList}
              onOpenDoctorModal={() => handleOpenCatalogModal("DOCTORS")}
              doctorName={doctorName}
              setDoctorName={setDoctorName}
              nameInputRef={nameInputRef}
              autoFocusName={autoFocusName}
              editingReportCode={currentReportId ? (reports.find((r) => r.id === currentReportId)?.code || patient.code) : null}
            />

            {/* Trên Desktop: ConclusionForm nằm bên trái dưới PatientForm */}
            <div className="hidden lg:block">
              <ConclusionForm
                conclusion={conclusion}
                setConclusion={setConclusion}
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
                selectedTests={selectedTests}
                isPdfOutdated={isCurrentPdfOutdated}
                pdfVersion={currentLoadedReport?.pdfVersion || 1}
              />
            </div>
          </section>

          {/* PANEL PHẢI: BẢNG CHỈ SỐ XÉT NGHIỆM */}
          <section className={`lg:col-span-8 flex flex-col ${
            activeMobileTab === 'TESTS' ? 'block' : 'hidden lg:flex'
          }`}>
            <TestTable
              catalog={catalog}
              testPackages={testPackages}
              testGroups={testGroups}
              selectedTests={selectedTests}
              setSelectedTests={setSelectedTests}
              showToast={showToast}
              onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
              recentTests={recentTests}
              onAddToRecent={addToRecent}
              onAddMultipleToRecent={addMultipleToRecent}
            />
          </section>

          {/* TAB 3 TRÊN MOBILE: CONCLUSION & EXPORT FORM */}
          <section className={`lg:hidden ${
            activeMobileTab === 'CONCLUSION' ? 'block' : 'hidden'
          }`}>
            <ConclusionForm
              conclusion={conclusion}
              setConclusion={setConclusion}
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
              selectedTests={selectedTests}
              isPdfOutdated={isCurrentPdfOutdated}
              pdfVersion={currentLoadedReport?.pdfVersion || 1}
            />
          </section>

        </div>
      </main>

      {/* 2.5. MOBILE STICKY BOTTOM ACTION BAR (Cố định ở đáy màn hình trên mobile < lg) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shadow-2xl">
        {/* Thu Phí Button */}
        <button
          type="button"
          onClick={() => setIsInvoiceModalOpen(true)}
          disabled={selectedTests.length === 0}
          className="flex-1 py-2 px-2 bg-gradient-to-r from-teal-600 to-emerald-600 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow disabled:opacity-50 transition"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Thu Phí ({totalFee > 0 ? (totalFee / 1000).toFixed(0) + 'k' : '0k'})</span>
        </button>

        {/* Xem Trước A4 Button */}
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          disabled={selectedTests.length === 0}
          className="py-2 px-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow disabled:opacity-50 transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Xem A4</span>
        </button>

        {/* Xuất PDF 1-Click Button */}
        <button
          type="button"
          onClick={handleExportPdfAndUpload}
          disabled={selectedTests.length === 0 || isExporting}
          className="py-2 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow disabled:opacity-50 transition"
        >
          <CloudUpload className="w-3.5 h-3.5" />
          <span>Xuất PDF</span>
        </button>
      </div>

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
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewTargetReport(null);
        }}
        clinicInfo={clinicInfo}
        patient={previewTargetReport ? previewTargetReport.patient : patient}
        selectedTests={previewTargetReport ? previewTargetReport.selectedTests : selectedTests}
        conclusion={previewTargetReport ? (previewTargetReport.conclusion || "") : conclusion}
        doctorName={previewTargetReport ? (previewTargetReport.doctorName || "") : doctorName}
        qrCodeDataUrl={previewTargetReport ? previewTargetReport.qrCodeDataUrl : qrCodeDataUrl}
        cloudLink={previewTargetReport ? previewTargetReport.cloudPdfUrl : cloudLink}
        isExporting={isExporting}
        currentStep={currentStep}
        lastError={lastError}
        showToast={showToast}
        onExportPdfAndUpload={handleExportPdfAndUpload}
        onDownloadPdf={handleDownloadPdf}
        onRetryExport={handleExportPdfAndUpload}
        onPrintDirect={handlePrintDirect}
        onDownloadQrCode={() => {
          const target = previewTargetReport ? previewTargetReport.patient : patient;
          handleDownloadQrCode(target.name, target.code);
        }}
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
        clinicInfo={clinicInfo}
        onSaveInvoice={handleSaveInvoice}
      />

      <RevenueManagerModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        invoices={invoices}
        onDeleteInvoice={deleteInvoice}
        onClearAllInvoices={clearAllInvoices}
        doctorsList={doctorsList}
        clinicInfo={clinicInfo}
        showToast={showToast}
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
        onOpenBatchExportModal={() => {
          setIsReportManagerOpen(false);
          setIsBatchExportModalOpen(true);
        }}
        onUpdateSingleReportPdf={handleUpdateSingleReportPdf}
        onBatchUpdateOutdatedReports={handleBatchUpdateOutdatedReports}
        isUpdatingPdf={isBatchExportRunning}
        onDeleteReport={deleteReport}
        onClearAllReports={clearAllReports}
        showToast={showToast}
      />

      {/* MODAL BATCH IMPORT & XUẤT PDF ĐỒNG LOẠT */}
      <BatchExportModal
        isOpen={isBatchExportModalOpen}
        onClose={() => setIsBatchExportModalOpen(false)}
        reports={reports}
        catalog={catalog}
        clinicInfo={clinicInfo}
        onBatchImport={handleBatchImport}
        progress={batchProgress}
        isBatchExporting={isBatchExportRunning}
        onBatchExport={handleBatchExport}
        onCancelBatch={handleCancelBatch}
        onDownloadZip={handleDownloadZip}
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

      {/* MODAL CẢNH BÁO THAY ĐỔI CHƯA LƯU */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onClose={handleUnsavedCancel}
        onSaveAndProceed={handleUnsavedSaveAndProceed}
        onDiscardAndProceed={handleUnsavedDiscardAndProceed}
        actionName={pendingAction?.name}
        patient={patient}
        isEditingExisting={!!currentReportId}
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

        {/* HIDDEN BATCH RENDER AREA — cho xuất PDF đồng loạt */}
        {batchRenderReport && (
          <>
            {batchRenderReport.isAllergen ? (
              <FullAllergenReportView
                elementId="batch-allergen-report"
                clinicInfo={clinicInfo}
                patient={batchRenderReport.patient}
                selectedTests={batchRenderReport.selectedTests}
                doctorName={batchRenderReport.doctorName}
                qrCodeDataUrl={undefined}
              />
            ) : (
              <PrintReportView
                elementId="batch-medical-report"
                clinicInfo={clinicInfo}
                patient={batchRenderReport.patient}
                selectedTests={batchRenderReport.selectedTests}
                conclusion={batchRenderReport.conclusion}
                doctorName={batchRenderReport.doctorName}
                qrCodeDataUrl={undefined}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
