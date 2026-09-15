import { useState, useMemo } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Rocket, 
  Package 
} from 'lucide-react';
import {
  MedicalReport, CatalogItem, ClinicInfo, BatchImportRow, BatchExportProgress, ToastType,
  TestGroup, TestEquipment, TestPackage, Doctor, CatalogItemEquipmentLink, Invoice,
  AllergenGradingScale, AiTemplateTarget
} from '@domain';
import { useBatchExcelOperations } from '../hooks/useBatchExcelOperations';
import { BatchPatientImportSection } from './BatchPatientImportSection';
import { BatchSystemConfigSection } from './BatchSystemConfigSection';
import { BatchPdfExportSection, ExportFilterType } from './BatchPdfExportSection';

export type TabType = 'IMPORT' | 'EXPORT';

export interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: MedicalReport[];
  catalog: CatalogItem[];
  setCatalog?: (items: CatalogItem[]) => void;
  testGroups?: TestGroup[];
  setTestGroups?: (groups: TestGroup[]) => void;
  equipments?: TestEquipment[];
  setEquipments?: (equipments: TestEquipment[]) => void;
  testPackages?: TestPackage[];
  setTestPackages?: (packages: TestPackage[]) => void;
  doctorsList?: Doctor[];
  setDoctorsList?: (doctors: Doctor[]) => void;
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  setCatalogItemEquipments?: (links: CatalogItemEquipmentLink[]) => void;
  allergenScales?: AllergenGradingScale[];
  setAllergenScales?: (scales: AllergenGradingScale[]) => void;
  invoices?: Invoice[];
  clinicInfo: ClinicInfo;
  // Batch Import
  onBatchImport: (rows: BatchImportRow[]) => void;
  // Batch Export
  progress: BatchExportProgress;
  isBatchExporting: boolean;
  onBatchExport: (reports: MedicalReport[]) => void;
  onCancelBatch: () => void;
  onDownloadZip: () => void;
  onOpenAiSmartFill?: (target?: AiTemplateTarget) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export default function BatchExportModal({
  isOpen,
  onClose,
  reports,
  catalog,
  setCatalog,
  testGroups = [],
  setTestGroups,
  equipments = [],
  setEquipments,
  testPackages = [],
  setTestPackages,
  doctorsList = [],
  setDoctorsList,
  catalogItemEquipments = [],
  setCatalogItemEquipments,
  allergenScales = [],
  setAllergenScales,
  invoices = [],
  clinicInfo: _clinicInfo,
  onBatchImport,
  progress,
  isBatchExporting,
  onBatchExport,
  onCancelBatch,
  onDownloadZip,
  onOpenAiSmartFill,
  showToast
}: BatchExportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('IMPORT');

  // EXPORT TAB STATE
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportFilter, setExportFilter] = useState<ExportFilterType>('ALL');

  const {
    importedRows,
    importError,
    selectedBatchPackageId,
    setSelectedBatchPackageId,
    catalogGroupFilter,
    setCatalogGroupFilter,
    equipmentLinkFilter,
    setEquipmentLinkFilter,
    packageExportFilter,
    setPackageExportFilter,
    fileInputRef,
    handleFileSelect,
    handleImportToReports,
    handleDownloadPatientTemplate,
    handleImportCatalog,
    handleImportEquipmentLinks,
    handleImportPackages,
    handleImportDoctors,
    handleImportEquipments,
    handleImportGroups,
    handleImportScales
  } = useBatchExcelOperations({
    catalog,
    setCatalog,
    testGroups,
    setTestGroups,
    equipments,
    setEquipments,
    testPackages,
    setTestPackages,
    doctorsList,
    setDoctorsList,
    catalogItemEquipments,
    setCatalogItemEquipments,
    allergenScales,
    setAllergenScales,
    onBatchImport,
    showToast
  });

  // Filter reports for export tab
  const filteredReports = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    return reports.filter((r) => {
      if (exportFilter === 'TODAY') {
        return new Date(r.createdAt).toDateString() === todayStr;
      }
      if (exportFilter === 'NOT_EXPORTED') {
        return !r.cloudPdfUrl;
      }
      if (exportFilter === 'EXPORTED') {
        return !!r.cloudPdfUrl;
      }
      return true;
    });
  }, [reports, exportFilter]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredReports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReports.map((r) => r.id)));
    }
  };

  const handleStartBatchExport = () => {
    const toExport = filteredReports.filter((r) => selectedIds.has(r.id));
    if (toExport.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 phiếu để xuất PDF!', 'error');
      return;
    }
    onBatchExport(toExport);
  };

  const progressPercent = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[92vh] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Batch từ Excel &amp; Xuất PDF Đồng Loạt</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md font-bold font-mono">
                  GoLab Hub
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Trung tâm xử lý Excel hàng loạt (Khám đoàn, Bệnh nhân, Danh mục, Cấu hình máy, Bác sĩ, Gói khám) &amp; Xuất PDF Cloud
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isBatchExporting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB HEADERS */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 shrink-0">
          <button
            onClick={() => setActiveTab('IMPORT')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition border-b-2 cursor-pointer ${
              activeTab === 'IMPORT'
                ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Batch từ Excel</span>
          </button>
          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition border-b-2 cursor-pointer ${
              activeTab === 'EXPORT'
                ? 'text-sky-400 border-sky-500 bg-sky-500/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Rocket className="w-4 h-4 text-sky-400" />
            <span>Xuất PDF Đồng Loạt ({reports.length})</span>
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {/* TAB 1: BATCH TỪ EXCEL */}
          {activeTab === 'IMPORT' && (
            <div className="space-y-6">
              <BatchPatientImportSection
                selectedBatchPackageId={selectedBatchPackageId}
                setSelectedBatchPackageId={setSelectedBatchPackageId}
                testPackages={testPackages}
                handleDownloadPatientTemplate={handleDownloadPatientTemplate}
                onOpenAiSmartFill={onOpenAiSmartFill}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                importedRows={importedRows}
                handleImportToReports={handleImportToReports}
                importError={importError}
              />

              <BatchSystemConfigSection
                catalog={catalog}
                testGroups={testGroups}
                catalogGroupFilter={catalogGroupFilter}
                setCatalogGroupFilter={setCatalogGroupFilter}
                handleImportCatalog={handleImportCatalog}
                equipments={equipments}
                catalogItemEquipments={catalogItemEquipments}
                equipmentLinkFilter={equipmentLinkFilter}
                setEquipmentLinkFilter={setEquipmentLinkFilter}
                handleImportEquipmentLinks={handleImportEquipmentLinks}
                testPackages={testPackages}
                packageExportFilter={packageExportFilter}
                setPackageExportFilter={setPackageExportFilter}
                handleImportPackages={handleImportPackages}
                doctorsList={doctorsList}
                handleImportDoctors={handleImportDoctors}
                handleImportEquipments={handleImportEquipments}
                handleImportGroups={handleImportGroups}
                allergenScales={allergenScales}
                handleImportScales={handleImportScales}
                reports={reports}
                invoices={invoices}
                onOpenAiSmartFill={onOpenAiSmartFill}
                showToast={showToast}
              />
            </div>
          )}

          {/* TAB 2: EXPORT PDF ĐỒNG LOẠT */}
          {activeTab === 'EXPORT' && (
            <BatchPdfExportSection
              filteredReports={filteredReports}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              exportFilter={exportFilter}
              setExportFilter={setExportFilter}
              isBatchExporting={isBatchExporting}
              progress={progress}
              progressPercent={progressPercent}
              onStartBatchExport={handleStartBatchExport}
              onCancelBatch={onCancelBatch}
              onDownloadZip={onDownloadZip}
            />
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>GoLab Batch &amp; PDF Engine v2.0 • Bản quyền thuộc về GoLab</span>
          <button
            onClick={onClose}
            disabled={isBatchExporting}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition disabled:opacity-50 cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
