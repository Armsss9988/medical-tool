import { createContext, useContext, useRef, useCallback, useMemo, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import type { Patient, SelectedTest, MedicalReport } from '@domain/types';
import { PatientCode } from '@domain/valueObjects/PatientCode';
import { domainEventBus, INVOICE_EVENT_TYPES, STORAGE_KEYS } from '@domain';
import { loadState, saveState } from '@infra/storage';
import { usePatientManager } from '@features/patient-session';
import { useReportManager } from '@features/report-history';
import { useInvoiceManager } from '@features/billing-revenue';
import { useRecentTests } from '../hooks/useRecentTests';

// ─── WORKSPACE CONTEXT ──────────────────────────────────────────────────────
// Core workspace state: patient data, selected tests, conclusion, doctor,
// reports, invoices, and the currently-loaded report ID.
// RULE: All workspace data flows through this context.

interface WorkspaceContextValue {
  // Patient
  patient: Patient;
  setPatient: Dispatch<SetStateAction<Patient>>;
  resetPatient: (customCode?: string) => void;

  // Tests & Conclusion
  selectedTests: SelectedTest[];
  setSelectedTests: Dispatch<SetStateAction<SelectedTest[]>>;
  conclusion: string;
  setConclusion: Dispatch<SetStateAction<string>>;
  doctorName: string;
  setDoctorName: Dispatch<SetStateAction<string>>;

  // Current Report Tracking
  currentReportId: string | null;
  setCurrentReportId: Dispatch<SetStateAction<string | null>>;
  currentLoadedReport: MedicalReport | null;

  // Reports (Sổ Lưu)
  reports: MedicalReport[];
  setReports: Dispatch<SetStateAction<MedicalReport[]>>;
  saveOrUpdateReport: ReturnType<typeof useReportManager>['saveOrUpdateReport'];
  bulkSaveOrUpdateReports: ReturnType<typeof useReportManager>['bulkSaveOrUpdateReports'];
  deleteReport: (id: string) => void;
  clearAllReports: () => void;
  isReportsLoading: boolean;
  isReportsFetching: boolean;
  refetchReports: () => void;

  // Invoices (Sổ Doanh Thu)
  invoices: ReturnType<typeof useInvoiceManager>['invoices'];
  setInvoices: Dispatch<SetStateAction<ReturnType<typeof useInvoiceManager>['invoices']>>;
  saveOrUpdateInvoice: ReturnType<typeof useInvoiceManager>['saveOrUpdateInvoice'];
  deleteInvoice: (id: string) => void;
  clearAllInvoices: () => void;
  payInvoice: ReturnType<typeof useInvoiceManager>['payInvoice'];
  cancelInvoice: ReturnType<typeof useInvoiceManager>['cancelInvoice'];
  isInvoicesLoading: boolean;
  isInvoicesFetching: boolean;
  refetchInvoices: () => void;

  // Recent Tests
  recentTests: ReturnType<typeof useRecentTests>['recentTests'];
  addToRecent: ReturnType<typeof useRecentTests>['addToRecent'];
  addMultipleToRecent: ReturnType<typeof useRecentTests>['addMultipleToRecent'];

  // Refs
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  autoFocusName: boolean;
  setAutoFocusName: Dispatch<SetStateAction<boolean>>;

  // Dirty state tracking
  hasUnsavedData: boolean;
  generateNewPatientCode: () => string;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within <WorkspaceProvider>');
  return ctx;
}

interface ActiveWorkspaceDraft {
  patient: Patient;
  selectedTests: SelectedTest[];
  conclusion: string;
  doctorName: string;
  currentReportId: string | null;
  savedAt: string;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // Đọc nháp phiên làm việc gần nhất từ LocalStorage để bảo vệ dữ liệu khi reload/chuyển app mobile
  const [initialDraft] = useState<ActiveWorkspaceDraft | null>(() => {
    try {
      const draft = loadState<ActiveWorkspaceDraft | null>(STORAGE_KEYS.ACTIVE_DRAFT, null);
      if (
        draft &&
        (draft.patient?.name?.trim() || (draft.selectedTests && draft.selectedTests.length > 0) || draft.currentReportId)
      ) {
        return draft;
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Patient
  const { patient, setPatient, resetPatient: rawResetPatient } = usePatientManager(initialDraft?.patient);

  const resetPatient = useCallback((customCode?: string, existingCodes?: string[]) => {
    saveState(STORAGE_KEYS.ACTIVE_DRAFT, null);
    rawResetPatient(customCode, existingCodes);
  }, [rawResetPatient]);

  // Tests & Conclusion (workspace form state owned by this provider)
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>(() => initialDraft?.selectedTests || []);
  const [conclusion, setConclusion] = useState<string>(() => initialDraft?.conclusion || '');
  const [doctorName, setDoctorName] = useState<string>(() => initialDraft?.doctorName || '');

  // Current Report ID (phân biệt Update vs Create)
  const [currentReportId, setCurrentReportId] = useState<string | null>(() => initialDraft?.currentReportId || null);

  // Tự động lưu nháp Workspace vào localStorage (chống mất ca khi chuyển app/reload tab trên điện thoại)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (patient.name?.trim() || selectedTests.length > 0 || currentReportId) {
        saveState(STORAGE_KEYS.ACTIVE_DRAFT, {
          patient,
          selectedTests,
          conclusion,
          doctorName,
          currentReportId,
          savedAt: new Date().toISOString()
        });
      } else {
        saveState(STORAGE_KEYS.ACTIVE_DRAFT, null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patient, selectedTests, conclusion, doctorName, currentReportId]);

  // Flush ngay lập tức khi người dùng chuyển tab hoặc ẩn trình duyệt mobile
  useEffect(() => {
    const handleVisibilityOrUnload = () => {
      if (patient.name?.trim() || selectedTests.length > 0 || currentReportId) {
        saveState(STORAGE_KEYS.ACTIVE_DRAFT, {
          patient,
          selectedTests,
          conclusion,
          doctorName,
          currentReportId,
          savedAt: new Date().toISOString()
        });
      } else {
        saveState(STORAGE_KEYS.ACTIVE_DRAFT, null);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleVisibilityOrUnload();
      }
    };
    window.addEventListener('beforeunload', handleVisibilityOrUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleVisibilityOrUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [patient, selectedTests, conclusion, doctorName, currentReportId]);

  // Keyboard-first refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [autoFocusName, setAutoFocusName] = useState<boolean>(true);

  // Recent tests
  const { recentTests, addToRecent, addMultipleToRecent, clearRecent: _clearRecent } = useRecentTests();

  // Reports
  const {
    reports,
    setReports,
    saveOrUpdateReport,
    bulkSaveOrUpdateReports,
    deleteReport,
    clearAllReports,
    handleExternalReportUpdate,
    isLoading: isReportsLoading,
    isFetching: isReportsFetching,
    refetch: refetchReports
  } = useReportManager();

  // Invoices
  const {
    invoices,
    setInvoices,
    saveOrUpdateInvoice,
    deleteInvoice,
    clearAllInvoices,
    payInvoice,
    cancelInvoice,
    isLoading: isInvoicesLoading,
    isFetching: isInvoicesFetching,
    refetch: refetchInvoices
  } = useInvoiceManager({
    onReportUpdated: handleExternalReportUpdate
  });

  // Tự động khởi tạo mã BN ban đầu khi tải xong danh sách phiếu từ Storage
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

  // Lắng nghe sự kiện INVOICE_PAID để cập nhật tức thì patient.paidAt trên form khám nếu hóa đơn của phiếu này được thanh toán
  useEffect(() => {
    const unsub = domainEventBus.subscribe(INVOICE_EVENT_TYPES.PAID, (event: unknown) => {
      const e = event as { payload?: { reportId?: string; patientCode?: string; paidAt?: string }; reportId?: string; patientCode?: string; paidAt?: string };
      const p = (e && typeof e === 'object' && 'payload' in e && e.payload) ? e.payload : e;
      const targetReportId = p?.reportId;
      const targetPatientCode = p?.patientCode;
      const paidAt = p?.paidAt || new Date().toISOString();

      if ((targetReportId && currentReportId === targetReportId) || (targetPatientCode && patient.code === targetPatientCode)) {
        setPatient((prev) => ({
          ...prev,
          paidAt
        }));
      }
    });

    return unsub;
  }, [currentReportId, patient.code, setPatient]);

  // Computed: phiếu đang mở trên workspace
  const currentLoadedReport = useMemo(() => {
    if (!currentReportId) return null;
    return reports.find((r) => r.id === currentReportId) || null;
  }, [currentReportId, reports]);

  // Cảnh báo trình duyệt nếu đóng tab khi có dữ liệu chưa lưu (so sánh sâu chống mất dữ liệu)
  const hasUnsavedData = useMemo(() => {
    if (!currentReportId) {
      return Boolean(patient.name.trim()) || selectedTests.length > 0 || Boolean(conclusion.trim());
    }
    const orig = reports.find((r) => r.id === currentReportId);
    if (!orig) return false;

    const patientChanged =
      patient.name !== orig.patient.name ||
      patient.dob !== orig.patient.dob ||
      patient.gender !== orig.patient.gender ||
      patient.phone !== orig.patient.phone ||
      patient.address !== orig.patient.address ||
      patient.diagnosis !== orig.patient.diagnosis ||
      patient.sampleCode !== orig.patient.sampleCode;
    if (patientChanged) return true;

    if ((conclusion || '') !== (orig.conclusion || '')) return true;
    if ((doctorName || '') !== (orig.doctorName || '')) return true;

    if (selectedTests.length !== orig.selectedTests.length) return true;
    for (let i = 0; i < selectedTests.length; i++) {
      const cur = selectedTests[i];
      const o = orig.selectedTests[i];
      if (
        !o ||
        cur.code !== o.code ||
        cur.result !== o.result ||
        cur.note !== o.note ||
        cur.equipmentId !== o.equipmentId ||
        (cur.unit || '') !== (o.unit || '') ||
        (cur.refText || '') !== (o.refText || '')
      ) {
        return true;
      }
    }

    return false;
  }, [currentReportId, patient, selectedTests, conclusion, doctorName, reports]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedData]);

  const generateNewPatientCode = useCallback(() => {
    const existingCodes = reports.map((r) => r.code || r.patient?.code || '');
    return PatientCode.generateNextCode(existingCodes);
  }, [reports]);

  const handleResetPatient = useCallback(
    (customCode?: string) => resetPatient(customCode || generateNewPatientCode()),
    [resetPatient, generateNewPatientCode]
  );

  const value = useMemo<WorkspaceContextValue>(() => ({
    patient, setPatient, resetPatient: handleResetPatient,
    selectedTests, setSelectedTests,
    conclusion, setConclusion,
    doctorName, setDoctorName,
    currentReportId, setCurrentReportId,
    currentLoadedReport,
    reports, setReports, saveOrUpdateReport, bulkSaveOrUpdateReports, deleteReport, clearAllReports,
    isReportsLoading, isReportsFetching, refetchReports,
    invoices, setInvoices, saveOrUpdateInvoice, deleteInvoice, clearAllInvoices, payInvoice, cancelInvoice,
    isInvoicesLoading, isInvoicesFetching, refetchInvoices,
    recentTests, addToRecent, addMultipleToRecent,
    nameInputRef, autoFocusName, setAutoFocusName,
    hasUnsavedData,
    generateNewPatientCode,
  }), [
    patient, setPatient, handleResetPatient,
    selectedTests, setSelectedTests,
    conclusion, setConclusion,
    doctorName, setDoctorName,
    currentReportId, setCurrentReportId,
    currentLoadedReport,
    reports, setReports, saveOrUpdateReport, bulkSaveOrUpdateReports, deleteReport, clearAllReports,
    isReportsLoading, isReportsFetching, refetchReports,
    invoices, setInvoices, saveOrUpdateInvoice, deleteInvoice, clearAllInvoices, payInvoice, cancelInvoice,
    isInvoicesLoading, isInvoicesFetching, refetchInvoices,
    recentTests, addToRecent, addMultipleToRecent,
    nameInputRef, autoFocusName, setAutoFocusName,
    hasUnsavedData,
    generateNewPatientCode,
  ]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
