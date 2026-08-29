import { createContext, useState, useContext, useRef, useCallback, useMemo, useEffect, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import type { Patient, SelectedTest, MedicalReport } from '@domain/types';
import { PatientCode } from '@domain/valueObjects/PatientCode';
import { usePatientManager } from '../hooks/usePatientManager';
import { useReportManager } from '../hooks/useReportManager';
import { useInvoiceManager } from '../hooks/useInvoiceManager';
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
  saveOrUpdateReport: ReturnType<typeof useReportManager>['saveOrUpdateReport'];
  deleteReport: (id: string) => void;
  clearAllReports: () => void;

  // Invoices (Sổ Doanh Thu)
  invoices: ReturnType<typeof useInvoiceManager>['invoices'];
  saveOrUpdateInvoice: ReturnType<typeof useInvoiceManager>['saveOrUpdateInvoice'];
  deleteInvoice: (id: string) => void;
  clearAllInvoices: () => void;

  // Recent Tests
  recentTests: ReturnType<typeof useRecentTests>['recentTests'];
  addToRecent: ReturnType<typeof useRecentTests>['addToRecent'];
  addMultipleToRecent: ReturnType<typeof useRecentTests>['addMultipleToRecent'];

  // Refs
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  autoFocusName: boolean;
  setAutoFocusName: Dispatch<SetStateAction<boolean>>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within <WorkspaceProvider>');
  return ctx;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // Patient
  const { patient, setPatient, resetPatient } = usePatientManager();

  // Tests & Conclusion
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [conclusion, setConclusion] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>('');

  // Current Report ID (phân biệt Update vs Create)
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  // Keyboard-first refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [autoFocusName, setAutoFocusName] = useState(true);

  // Recent tests
  const { recentTests, addToRecent, addMultipleToRecent, clearRecent: _clearRecent } = useRecentTests();

  // Reports
  const { reports, saveOrUpdateReport, deleteReport, clearAllReports } = useReportManager();

  // Invoices
  const { invoices, saveOrUpdateInvoice, deleteInvoice, clearAllInvoices } = useInvoiceManager();

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

  // Computed: phiếu đang mở trên workspace
  const currentLoadedReport = useMemo(() => {
    if (!currentReportId) return null;
    return reports.find((r) => r.id === currentReportId) || null;
  }, [currentReportId, reports]);

  // Cảnh báo trình duyệt nếu đóng tab khi có dữ liệu chưa lưu
  const hasUnsavedData = useMemo(() => {
    if (!currentReportId) {
      return !!patient.name.trim() || selectedTests.length > 0 || !!conclusion.trim();
    }
    const orig = reports.find((r) => r.id === currentReportId);
    if (!orig) return false;
    return patient.name !== orig.patient.name ||
           selectedTests.length !== orig.selectedTests.length ||
           (conclusion || '') !== (orig.conclusion || '');
  }, [currentReportId, patient, selectedTests, conclusion, reports]);

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

  const value: WorkspaceContextValue = {
    patient, setPatient, resetPatient: (customCode) => resetPatient(customCode || generateNewPatientCode()),
    selectedTests, setSelectedTests,
    conclusion, setConclusion,
    doctorName, setDoctorName,
    currentReportId, setCurrentReportId,
    currentLoadedReport,
    reports, saveOrUpdateReport, deleteReport, clearAllReports,
    invoices, saveOrUpdateInvoice, deleteInvoice, clearAllInvoices,
    recentTests, addToRecent, addMultipleToRecent,
    nameInputRef, autoFocusName, setAutoFocusName,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
