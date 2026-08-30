import { useState, useMemo, useRef } from 'react';
import {
  X, Upload, Download, FileSpreadsheet, Rocket, CheckCircle, AlertCircle,
  Square, CheckSquare, Filter, FileText, Package, Ban, Archive,
  FlaskConical, Settings2, Stethoscope, Layers, FolderTree, Cpu, Activity,
  Sparkles
} from 'lucide-react';
import {
  MedicalReport, CatalogItem, ClinicInfo, BatchImportRow, BatchExportProgress, ToastType,
  TestGroup, TestEquipment, TestPackage, Doctor, CatalogItemEquipmentLink, Invoice, getPkgCodes,
  AllergenGradingScale, DEFAULT_ALLERGEN_SCALES, AiTemplateTarget
} from '@domain';
import {
  exportBatchTemplateExcel,
  parseExcelBatchPatients,
  exportCatalogItemsTemplate,
  parseExcelCatalog,
  exportCatalogItemEquipmentsTemplate,
  parseExcelCatalogItemEquipments,
  exportTestPackagesTemplate,
  parseExcelTestPackages,
  exportDoctorsTemplate,
  parseExcelDoctors,
  exportEquipmentsTemplate,
  parseExcelEquipments,
  exportTestGroupsTemplate,
  parseExcelTestGroups,
  exportScalesTemplate,
  parseExcelScales,
  exportReportsExcel,
  exportRevenueExcel
} from '@infra/excelService';

type TabType = 'IMPORT' | 'EXPORT';
type ExportFilterType = 'ALL' | 'TODAY' | 'NOT_EXPORTED' | 'EXPORTED';

interface BatchExportModalProps {
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
  allergenScales = DEFAULT_ALLERGEN_SCALES,
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

  // ─── IMPORT TAB STATE ──────────────────────────────────────────────────
  const [importedRows, setImportedRows] = useState<BatchImportRow[]>([]);
  const [importError, setImportError] = useState<string>('');
  const [selectedBatchPackageId, setSelectedBatchPackageId] = useState<string>('all');
  const [catalogGroupFilter, setCatalogGroupFilter] = useState<string>('all');
  const [equipmentLinkFilter, setEquipmentLinkFilter] = useState<string>('all');
  const [packageExportFilter, setPackageExportFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── EXPORT TAB STATE ──────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportFilter, setExportFilter] = useState<ExportFilterType>('ALL');

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

  // ─── IMPORT HANDLERS (BATCH PATIENTS) ──────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportError('');
      showToast('Đang đọc file Excel batch...', 'info');
      const rows = await parseExcelBatchPatients(file, catalog);
      setImportedRows(rows);
      showToast(`Đã parse thành công ${rows.length} bệnh nhân từ file Excel!`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi đọc file Excel';
      setImportError(msg);
      showToast(`Lỗi import: ${msg}`, 'error');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportToReports = () => {
    if (importedRows.length === 0) return;
    onBatchImport(importedRows);
    showToast(`Đã nhập ${importedRows.length} phiếu bệnh nhân vào Sổ Lưu!`, 'success');
    setImportedRows([]);
  };

  const handleDownloadPatientTemplate = () => {
    const selectedPkg = selectedBatchPackageId === 'all'
      ? null
      : testPackages.find((p) => p.id === selectedBatchPackageId) || null;
    exportBatchTemplateExcel(catalog, selectedPkg, doctorsList);
    const pkgLabel = selectedPkg ? `Gói [${selectedPkg.name}]` : 'Mẫu Khám Đoàn Tổng Quát';
    showToast(`Đã tải file Excel ${pkgLabel} (kèm Dropdown Bác sĩ & Giới tính) về máy!`, 'success');
  };

  // ─── CATALOG & CONFIG EXCEL HANDLERS (MERGE / UPSERT THÔNG MINH BẢO TOÀN DỮ LIỆU) ──────────

  const handleImportCatalog = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !setCatalog) return;
    try {
      showToast('Đang đọc file Excel chỉ số...', 'info');
      const items = await parseExcelCatalog(file);
      if (items.length > 0) {
        const map = new Map(catalog.map((it) => [it.code.toUpperCase(), it]));
        let updatedCount = 0;
        let addedCount = 0;
        items.forEach((newItem) => {
          const key = newItem.code.toUpperCase();
          const existing = map.get(key);
          if (existing) {
            map.set(key, {
              ...existing,
              ...newItem,
              category: newItem.category || existing.category,
              name: newItem.name || existing.name,
              scientific: newItem.scientific ?? existing.scientific,
              unit: newItem.unit || existing.unit,
              price: (newItem.price !== undefined && newItem.price > 0) ? newItem.price : existing.price,
              refText: newItem.refText || existing.refText,
              evaluationType: newItem.evaluationType || existing.evaluationType,
              scaleId: newItem.scaleId ?? existing.scaleId,
              refMin: newItem.refMin !== null ? newItem.refMin : (newItem.evaluationType === 'scale' ? null : existing.refMin),
              refMax: newItem.refMax !== null ? newItem.refMax : (newItem.evaluationType === 'scale' ? null : existing.refMax)
            });
            updatedCount++;
          } else {
            map.set(key, newItem);
            addedCount++;
          }
        });
        const merged = Array.from(map.values());
        setCatalog(merged);
        showToast(`Đã cập nhật ${updatedCount} chỉ số cũ và thêm mới ${addedCount} chỉ số từ Excel (tổng ${merged.length} chỉ số)!`, 'success');
      } else {
        showToast('Không tìm thấy dữ liệu hợp lệ trong file Excel.', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi đọc file Excel', 'error');
    }
    e.target.value = '';
  };

  const handleImportEquipmentLinks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !setCatalogItemEquipments) return;
    try {
      showToast('Đang đọc file cấu hình máy đo...', 'info');
      const links = await parseExcelCatalogItemEquipments(file, catalog, equipments);
      if (links.length > 0) {
        const map = new Map(catalogItemEquipments.map((l) => [`${l.catalogCode.toUpperCase()}_${l.equipmentId}`, l]));
        let updatedCount = 0;
        let addedCount = 0;
        links.forEach((newLink) => {
          const key = `${newLink.catalogCode.toUpperCase()}_${newLink.equipmentId}`;
          const existing = map.get(key);
          if (existing) {
            map.set(key, {
              ...existing,
              ...newLink,
              id: existing.id,
              unit: newLink.unit ?? existing.unit,
              refText: newLink.refText ?? existing.refText,
              scaleId: newLink.scaleId ?? existing.scaleId,
              refMin: newLink.refMin !== null ? newLink.refMin : (newLink.scaleId ? null : existing.refMin),
              refMax: newLink.refMax !== null ? newLink.refMax : (newLink.scaleId ? null : existing.refMax)
            });
            updatedCount++;
          } else {
            map.set(key, newLink);
            addedCount++;
          }
        });
        const merged = Array.from(map.values());
        setCatalogItemEquipments(merged);
        showToast(`Đã cập nhật ${updatedCount} cấu hình cũ và thêm mới ${addedCount} cấu hình máy đo (tổng ${merged.length} liên kết)!`, 'success');
      } else {
        showToast('Không tìm thấy dữ liệu hợp lệ trong file Excel.', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi đọc file Excel', 'error');
    }
    e.target.value = '';
  };

  const handleImportPackages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !setTestPackages) return;
    try {
      showToast('Đang đọc file gói xét nghiệm...', 'info');
      const pkgs = await parseExcelTestPackages(file, catalog, equipments);
      if (pkgs.length > 0) {
        const map = new Map(testPackages.map((p) => [p.name.toLowerCase(), p]));
        let updatedCount = 0;
        let addedCount = 0;
        pkgs.forEach((newPkg) => {
          const key = newPkg.name.toLowerCase();
          const existing = map.get(key);
          if (existing) {
            // Hợp nhất các chỉ số trong gói: không xóa các chỉ số cũ của gói
            const existingItemMap = new Map((existing.items || []).map((i) => [i.code.toUpperCase(), i]));
            (newPkg.items || []).forEach((i) => existingItemMap.set(i.code.toUpperCase(), i));
            map.set(key, {
              ...existing,
              ...newPkg,
              id: existing.id,
              name: newPkg.name || existing.name,
              defaultEquipmentId: newPkg.defaultEquipmentId ?? existing.defaultEquipmentId,
              price: newPkg.price > 0 ? newPkg.price : existing.price,
              items: Array.from(existingItemMap.values())
            });
            updatedCount++;
          } else {
            map.set(key, newPkg);
            addedCount++;
          }
        });
        const merged = Array.from(map.values());
        setTestPackages(merged);
        showToast(`Đã cập nhật ${updatedCount} gói cũ và thêm mới ${addedCount} gói xét nghiệm (tổng ${merged.length} gói)!`, 'success');
      } else {
        showToast('Không tìm thấy dữ liệu hợp lệ trong file Excel.', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi đọc file Excel', 'error');
    }
    e.target.value = '';
  };

  const handleImportDoctors = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !setDoctorsList) return;
    try {
      showToast('Đang đọc danh sách bác sĩ...', 'info');
      const docs = await parseExcelDoctors(file);
      if (docs.length > 0) {
        const map = new Map(doctorsList.map((d) => [d.name.toLowerCase(), d]));
        let updatedCount = 0;
        let addedCount = 0;
        docs.forEach((newDoc) => {
          const key = newDoc.name.toLowerCase();
          const existing = map.get(key);
          if (existing) {
            map.set(key, {
              ...existing,
              ...newDoc,
              id: existing.id,
              name: newDoc.name || existing.name,
              specialty: newDoc.specialty ?? existing.specialty,
              phone: newDoc.phone ?? existing.phone
            });
            updatedCount++;
          } else {
            map.set(key, newDoc);
            addedCount++;
          }
        });
        const merged = Array.from(map.values());
        setDoctorsList(merged);
        showToast(`Đã cập nhật ${updatedCount} bác sĩ cũ và thêm mới ${addedCount} bác sĩ (tổng ${merged.length} bác sĩ)!`, 'success');
      } else {
        showToast('Không tìm thấy dữ liệu hợp lệ trong file Excel.', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi đọc file Excel', 'error');
    }
    e.target.value = '';
  };

  const handleImportEquipments = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !setEquipments) return;
    try {
      showToast('Đang đọc danh sách máy đo...', 'info');
      const eqs = await parseExcelEquipments(file);
      if (eqs.length > 0) {
        const map = new Map(equipments.map((eq) => [eq.name.toLowerCase(), eq]));
        let updatedCount = 0;
        let addedCount = 0;
        eqs.forEach((newEq) => {
          const key = newEq.name.toLowerCase();
          const existing = map.get(key);
          if (existing) {
            map.set(key, {
              ...existing,
              ...newEq,
              id: existing.id,
              name: newEq.name || existing.name,
              code: newEq.code ?? existing.code
            });
            updatedCount++;
          } else {
            map.set(key, newEq);
            addedCount++;
          }
        });
        const merged = Array.from(map.values());
        setEquipments(merged);
        showToast(`Đã cập nhật ${updatedCount} thiết bị cũ và thêm mới ${addedCount} thiết bị (tổng ${merged.length} máy)!`, 'success');
      } else {
        showToast('Không tìm thấy dữ liệu hợp lệ trong file Excel.', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi đọc file Excel', 'error');
    }
    e.target.value = '';
  };

  const handleImportGroups = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !setTestGroups) return;
    try {
      showToast('Đang đọc nhóm xét nghiệm...', 'info');
      const grps = await parseExcelTestGroups(file);
      if (grps.length > 0) {
        const map = new Map(testGroups.map((g) => [g.name.toLowerCase(), g]));
        let updatedCount = 0;
        let addedCount = 0;
        grps.forEach((newGroup) => {
          const key = newGroup.name.toLowerCase();
          const existing = map.get(key);
          if (existing) {
            map.set(key, {
              ...existing,
              ...newGroup,
              id: existing.id,
              name: newGroup.name || existing.name
            });
            updatedCount++;
          } else {
            map.set(key, newGroup);
            addedCount++;
          }
        });
        const merged = Array.from(map.values());
        setTestGroups(merged);
        showToast(`Đã cập nhật ${updatedCount} nhóm cũ và thêm mới ${addedCount} nhóm xét nghiệm (tổng ${merged.length} nhóm)!`, 'success');
      } else {
        showToast('Không tìm thấy dữ liệu hợp lệ trong file Excel.', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi đọc file Excel', 'error');
    }
    e.target.value = '';
  };

  const handleImportScales = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !setAllergenScales) return;
    try {
      showToast('Đang đọc thang đo phân độ...', 'info');
      const scs = await parseExcelScales(file);
      if (scs.length > 0) {
        const map = new Map(allergenScales.map((s) => [s.id.toLowerCase(), s]));
        let updatedCount = 0;
        let addedCount = 0;
        scs.forEach((newScale) => {
          const key = newScale.id.toLowerCase();
          const existing = map.get(key);
          if (existing) {
            map.set(key, {
              ...existing,
              ...newScale,
              id: existing.id,
              name: newScale.name || existing.name,
              equipment: newScale.equipment ?? existing.equipment,
              unit: newScale.unit || existing.unit,
              levels: newScale.levels && newScale.levels.length > 0 ? newScale.levels : existing.levels
            });
            updatedCount++;
          } else {
            map.set(key, newScale);
            addedCount++;
          }
        });
        const merged = Array.from(map.values());
        setAllergenScales(merged);
        showToast(`Đã cập nhật ${updatedCount} thang đo cũ và thêm mới ${addedCount} thang đo (tổng ${merged.length} thang đo)!`, 'success');
      } else {
        showToast('Không tìm thấy dữ liệu hợp lệ trong file Excel.', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi đọc file Excel', 'error');
    }
    e.target.value = '';
  };

  // ─── EXPORT HANDLERS ──────────────────────────────────────────────────

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
                <span>Batch từ Excel & Xuất PDF Đồng Loạt</span>
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

          {/* ══════════════ TAB 1: BATCH TỪ EXCEL ══════════════ */}
          {activeTab === 'IMPORT' && (
            <div className="space-y-6">

              {/* ── SECTION 1: KHÁM ĐOÀN & BỆNH NHÂN HÀNG LOẠT ── */}
              <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 md:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>1. Nhập Bệnh Nhân &amp; Khám Đoàn Hàng Loạt</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Chọn gói xét nghiệm để tạo file mẫu chuyên biệt (hoặc mẫu tổng quát), sau đó nhập file kết quả đồng loạt.
                    </p>
                  </div>

                  {/* Actions & Package Dropdown */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Package Selector */}
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/90 rounded-xl px-3 py-1.5 text-xs shadow-inner">
                      <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="text-slate-400 font-bold shrink-0 hidden sm:inline">Mẫu Theo Gói:</span>
                      <select
                        value={selectedBatchPackageId}
                        onChange={(e) => setSelectedBatchPackageId(e.target.value)}
                        className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[210px] truncate"
                        title="Chọn gói xét nghiệm áp dụng cho mẫu Excel"
                      >
                        <option value="all" className="bg-slate-900 text-slate-200">
                          -- Tất cả chỉ số (Mẫu chung) --
                        </option>
                        {testPackages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id} className="bg-slate-900 text-purple-200">
                            {pkg.name} ({getPkgCodes(pkg).length} chỉ số)
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadPatientTemplate}
                      className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                      title="Tải template Excel khám đoàn theo gói đang chọn"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {selectedBatchPackageId !== 'all' && testPackages.some((p) => p.id === selectedBatchPackageId)
                          ? `Tải Mẫu Gói [${testPackages.find((p) => p.id === selectedBatchPackageId)?.name}]`
                          : 'Tải Template Mẫu'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenAiSmartFill?.('BATCH_PATIENTS')}
                      className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer border border-purple-400/40"
                      title="AI tự động đọc từ ảnh chụp, PDF hoặc văn bản và điền vào mẫu khám đoàn"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span>✨ AI Điền Mẫu Khám Đoàn</span>
                    </button>

                    <label className="flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95">
                      <Upload className="w-4 h-4" />
                      <span>Chọn File Excel Batch</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>

                    {importedRows.length > 0 && (
                      <button
                        type="button"
                        onClick={handleImportToReports}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer animate-pulse"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Nhập {importedRows.length} phiếu vào Sổ Lưu</span>
                      </button>
                    )}
                  </div>
                </div>

                {importError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {/* Preview imported rows */}
                {importedRows.length > 0 && (
                  <div className="border border-slate-700/80 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">
                        Xem trước: {importedRows.length} bệnh nhân đã parse thành công
                      </span>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-800 text-slate-300 font-bold sticky top-0 z-10">
                          <tr>
                            <th className="p-2.5 w-10 text-center">STT</th>
                            <th className="p-2.5">Mã BN</th>
                            <th className="p-2.5">Họ và Tên</th>
                            <th className="p-2.5">Năm sinh</th>
                            <th className="p-2.5 text-center">Số chỉ số</th>
                            <th className="p-2.5">BS Chỉ Định</th>
                            <th className="p-2.5">Kết Luận</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {importedRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40 transition">
                              <td className="p-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                              <td className="p-2.5 font-mono text-sky-400 font-bold">{row.patient.code}</td>
                              <td className="p-2.5 font-bold text-white uppercase">{row.patient.name}</td>
                              <td className="p-2.5 text-slate-300">{row.patient.dob}</td>
                              <td className="p-2.5 text-center font-mono font-bold text-emerald-400">{row.selectedTests.length}</td>
                              <td className="p-2.5 text-slate-300">{row.doctorName}</td>
                              <td className="p-2.5 text-slate-400 truncate max-w-[200px]">{row.conclusion || '---'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {importedRows.length === 0 && !importError && (
                  <div className="py-6 px-4 text-center text-slate-400 space-y-3 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl space-y-1">
                        <div className="font-bold text-xs text-emerald-400">1. Tải File Mẫu</div>
                        <p className="text-[11px] text-slate-400">Bấm nút "Tải Template Mẫu" để lấy file Excel đã sinh sẵn các cột thông tin và mã xét nghiệm.</p>
                      </div>
                      <div className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl space-y-1">
                        <div className="font-bold text-xs text-sky-400">2. Điền Dữ Liệu</div>
                        <p className="text-[11px] text-slate-400">Paste danh sách bệnh nhân và kết quả xét nghiệm. Parser tự động chuẩn hóa SĐT, giới tính, ngày sinh.</p>
                      </div>
                      <div className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl space-y-1">
                        <div className="font-bold text-xs text-purple-400">3. Xem &amp; Lưu</div>
                        <p className="text-[11px] text-slate-400">Bấm "Chọn File Excel Batch" $\rightarrow$ Xem trước bảng đối soát $\rightarrow$ Nhập vào Sổ Lưu.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── SECTION 2: TOÀN BỘ FILE MẪU & DANH MỤC RELATIONAL EXCEL ── */}
              <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 md:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-sky-400" />
                      <span>2. Trung Tâm Quản Lý File Mẫu Excel Danh Mục &amp; Cấu Hình Thiết Bị</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Mỗi bảng có 1 file template riêng biệt, tự động nhúng Sheet tra cứu <code className="text-sky-300 font-mono">_DataLookup</code> và khóa chuẩn Dropdown chọn từ cơ sở dữ liệu
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenAiSmartFill?.('CATALOG_ITEMS')}
                    className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer border border-purple-400/40"
                    title="Mở Trợ lý AI Điền File Mẫu Y Khoa Tự Động"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>✨ AI Điền Mẫu Tự Động</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Card 1: Chỉ Số Xét Nghiệm */}
                  <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          <FlaskConical className="w-4 h-4 text-sky-400" />
                          Chỉ Số Xét Nghiệm
                        </span>
                        <span className="font-mono text-[10px] text-sky-400 bg-sky-950/80 border border-sky-800/80 px-2 py-0.5 rounded">
                          {catalog.length} chỉ số
                        </span>
                      </div>
                      
                      {/* Relation Dropdown: Nhóm Xét Nghiệm */}
                      <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px]">
                        <FolderTree className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-slate-400 font-bold shrink-0">Nhóm:</span>
                        <select
                          value={catalogGroupFilter}
                          onChange={(e) => setCatalogGroupFilter(e.target.value)}
                          className="bg-transparent text-sky-300 font-bold focus:outline-none cursor-pointer w-full truncate"
                          title="Chọn nhóm xét nghiệm để tạo mẫu hoặc xuất dữ liệu"
                        >
                          <option value="all" className="bg-slate-900 text-slate-200">-- Tất Cả Nhóm ({catalog.length}) --</option>
                          {testGroups.map((g) => {
                            const count = catalog.filter((it) => it.category.toLowerCase() === g.name.toLowerCase()).length;
                            return (
                              <option key={g.id} value={g.name} className="bg-slate-900 text-white">
                                {g.name} ({count} chỉ số)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Template mẫu chứa 3-5 dòng hướng dẫn kèm Sheet <code className="text-sky-300 font-mono">_DataLookup</code> tra cứu nhóm &amp; kiểu đánh giá.
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          exportCatalogItemsTemplate(testGroups, catalog, { isSampleOnly: true, filterCategory: catalogGroupFilter });
                          const name = catalogGroupFilter === 'all' ? 'Tổng Hợp' : `Nhóm ${catalogGroupFilter}`;
                          showToast(`Đã tải file Template mẫu chỉ số [${name}]!`, 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Tải template mẫu trống"
                      >
                        <Download className="w-3 h-3" />
                        <span>Mẫu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          exportCatalogItemsTemplate(testGroups, catalog, { isSampleOnly: false, filterCategory: catalogGroupFilter });
                          const name = catalogGroupFilter === 'all' ? 'Tất cả' : `Nhóm ${catalogGroupFilter}`;
                          showToast(`Đã xuất dữ liệu chỉ số [${name}] ra Excel!`, 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Xuất toàn bộ dữ liệu chỉ số"
                      >
                        <Download className="w-3 h-3" />
                        <span>Data</span>
                      </button>

                      <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Nhập</span>
                        <input type="file" accept=".xlsx,.xls" onChange={handleImportCatalog} className="hidden" />
                      </label>

                      <button
                        type="button"
                        onClick={() => onOpenAiSmartFill?.('CATALOG_ITEMS')}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                        title="AI tự động trích xuất và điền vào mẫu chỉ số"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Cấu Hình Thiết Bị & Ngưỡng Đo */}
                  <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          <Settings2 className="w-4 h-4 text-indigo-400" />
                          Cấu Hình Máy &amp; Ngưỡng
                        </span>
                        <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded">
                          {catalogItemEquipments.length} liên kết
                        </span>
                      </div>

                      {/* Relation Dropdown: Máy Đo */}
                      <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px]">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-slate-400 font-bold shrink-0">Máy:</span>
                        <select
                          value={equipmentLinkFilter}
                          onChange={(e) => setEquipmentLinkFilter(e.target.value)}
                          className="bg-transparent text-indigo-300 font-bold focus:outline-none cursor-pointer w-full truncate"
                          title="Chọn máy đo để tạo mẫu hoặc xuất cấu hình"
                        >
                          <option value="all" className="bg-slate-900 text-slate-200">-- Tất Cả Máy ({catalogItemEquipments.length}) --</option>
                          {equipments.map((eq) => {
                            const count = catalogItemEquipments.filter((l) => l.equipmentId === eq.id).length;
                            return (
                              <option key={eq.id} value={eq.id} className="bg-slate-900 text-white">
                                {eq.name} ({count} liên kết)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Template mẫu hướng dẫn cấu hình ngưỡng Min/Max, text tham chiếu và máy đo mặc định.
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          exportCatalogItemEquipmentsTemplate(catalog, equipments, catalogItemEquipments, { isSampleOnly: true, filterEquipmentId: equipmentLinkFilter });
                          const eqName = equipmentLinkFilter === 'all' ? 'Tổng Hợp' : (equipments.find(e => e.id === equipmentLinkFilter)?.name || 'Máy Đo');
                          showToast(`Đã tải file Template mẫu cấu hình [${eqName}]!`, 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Tải template mẫu cấu hình ngưỡng đo máy"
                      >
                        <Download className="w-3 h-3" />
                        <span>Mẫu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          exportCatalogItemEquipmentsTemplate(catalog, equipments, catalogItemEquipments, { isSampleOnly: false, filterEquipmentId: equipmentLinkFilter });
                          const eqName = equipmentLinkFilter === 'all' ? 'Tất cả' : (equipments.find(e => e.id === equipmentLinkFilter)?.name || 'Máy Đo');
                          showToast(`Đã xuất dữ liệu cấu hình [${eqName}] ra Excel!`, 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Xuất toàn bộ cấu hình ngưỡng máy đo thực tế trong DB"
                      >
                        <Download className="w-3 h-3" />
                        <span>Data</span>
                      </button>

                      <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Nhập</span>
                        <input type="file" accept=".xlsx,.xls" onChange={handleImportEquipmentLinks} className="hidden" />
                      </label>

                      <button
                        type="button"
                        onClick={() => onOpenAiSmartFill?.('CATALOG_ITEM_EQUIPMENTS')}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                        title="AI tự động trích xuất và điền vào mẫu cấu hình máy"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Gói Xét Nghiệm */}
                  <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-purple-400" />
                          Gói Xét Nghiệm
                        </span>
                        <span className="font-mono text-[10px] text-purple-400 bg-purple-950/80 border border-purple-800/80 px-2 py-0.5 rounded">
                          {testPackages.length} gói
                        </span>
                      </div>

                      {/* Relation Dropdown: Gói Xét Nghiệm */}
                      <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px]">
                        <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="text-slate-400 font-bold shrink-0">Gói:</span>
                        <select
                          value={packageExportFilter}
                          onChange={(e) => setPackageExportFilter(e.target.value)}
                          className="bg-transparent text-purple-300 font-bold focus:outline-none cursor-pointer w-full truncate"
                          title="Chọn gói xét nghiệm để tạo mẫu hoặc xuất cấu hình"
                        >
                          <option value="all" className="bg-slate-900 text-slate-200">-- Tất Cả Gói ({testPackages.length}) --</option>
                          {testPackages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id} className="bg-slate-900 text-white">
                              {pkg.name} ({getPkgCodes(pkg).length} chỉ số)
                            </option>
                          ))}
                        </select>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Template mẫu cấu hình nhiều chỉ số thành phần gom chung thành 1 gói khám.
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          exportTestPackagesTemplate(catalog, equipments, testPackages, { isSampleOnly: true, filterPackageId: packageExportFilter });
                          const pkgName = packageExportFilter === 'all' ? 'Tổng Hợp' : (testPackages.find(p => p.id === packageExportFilter)?.name || 'Gói Khám');
                          showToast(`Đã tải file Template mẫu gói [${pkgName}]!`, 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Tải template mẫu tạo gói xét nghiệm"
                      >
                        <Download className="w-3 h-3" />
                        <span>Mẫu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          exportTestPackagesTemplate(catalog, equipments, testPackages, { isSampleOnly: false, filterPackageId: packageExportFilter });
                          const pkgName = packageExportFilter === 'all' ? 'Tất cả' : (testPackages.find(p => p.id === packageExportFilter)?.name || 'Gói Khám');
                          showToast(`Đã xuất dữ liệu gói xét nghiệm [${pkgName}] ra Excel!`, 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Xuất toàn bộ gói xét nghiệm thực tế đang có trong DB"
                      >
                        <Download className="w-3 h-3" />
                        <span>Data</span>
                      </button>

                      <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Nhập</span>
                        <input type="file" accept=".xlsx,.xls" onChange={handleImportPackages} className="hidden" />
                      </label>

                      <button
                        type="button"
                        onClick={() => onOpenAiSmartFill?.('TEST_PACKAGES')}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                        title="AI tự động trích xuất và điền vào mẫu gói xét nghiệm"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 4: Bác Sĩ Chỉ Định */}
                  <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          <Stethoscope className="w-4 h-4 text-teal-400" />
                          Bác Sĩ &amp; Chuyên Gia
                        </span>
                        <span className="font-mono text-[10px] text-teal-400 bg-teal-950/80 border border-teal-800/80 px-2 py-0.5 rounded">
                          {doctorsList.length} bác sĩ
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Quản lý họ tên bác sĩ chỉ định, chuyên khoa phòng khám, chức vụ và số điện thoại liên hệ.
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          exportDoctorsTemplate(doctorsList, true);
                          showToast('Đã tải file Template mẫu Bác sĩ về máy!', 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Tải template mẫu Bác sĩ kèm hướng dẫn"
                      >
                        <Download className="w-3 h-3" />
                        <span>Mẫu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          exportDoctorsTemplate(doctorsList, false);
                          showToast(`Đã xuất ${doctorsList.length} bác sĩ từ cơ sở dữ liệu ra Excel!`, 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Xuất danh sách bác sĩ thực tế đang có trong DB"
                      >
                        <Download className="w-3 h-3" />
                        <span>Data</span>
                      </button>

                      <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Nhập</span>
                        <input type="file" accept=".xlsx,.xls" onChange={handleImportDoctors} className="hidden" />
                      </label>

                      <button
                        type="button"
                        onClick={() => onOpenAiSmartFill?.('DOCTORS')}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                        title="AI tự động trích xuất và điền vào mẫu bác sĩ"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 5: Thiết Bị & Máy Đo */}
                  <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          Thiết Bị &amp; Máy Đo
                        </span>
                        <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded">
                          {equipments.length} thiết bị
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Quản lý mã máy đo, tên đầy đủ thiết bị phân tích y khoa, ghi chú chuyên khoa phòng máy.
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          exportEquipmentsTemplate(equipments, true);
                          showToast('Đã tải file Template mẫu Thiết bị về máy!', 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Tải template mẫu Thiết bị máy đo kèm hướng dẫn"
                      >
                        <Download className="w-3 h-3" />
                        <span>Mẫu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          exportEquipmentsTemplate(equipments, false);
                          showToast(`Đã xuất ${equipments.length} thiết bị từ cơ sở dữ liệu ra Excel!`, 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Xuất danh sách thiết bị máy đo thực tế trong DB"
                      >
                        <Download className="w-3 h-3" />
                        <span>Data</span>
                      </button>

                      <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Nhập</span>
                        <input type="file" accept=".xlsx,.xls" onChange={handleImportEquipments} className="hidden" />
                      </label>

                      <button
                        type="button"
                        onClick={() => onOpenAiSmartFill?.('EQUIPMENTS')}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                        title="AI tự động trích xuất và điền vào mẫu thiết bị"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 6: Nhóm Xét Nghiệm */}
                  <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          <FolderTree className="w-4 h-4 text-amber-400" />
                          Nhóm Xét Nghiệm
                        </span>
                        <span className="font-mono text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded">
                          {testGroups.length} nhóm
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Quản lý danh mục các chuyên khoa: Sinh hóa, Huyết học, Nước tiểu, Dị nguyên, Miễn dịch...
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          exportTestGroupsTemplate(testGroups, true);
                          showToast('Đã tải file Template mẫu Nhóm xét nghiệm về máy!', 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Tải template mẫu Nhóm xét nghiệm kèm hướng dẫn"
                      >
                        <Download className="w-3 h-3" />
                        <span>Mẫu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          exportTestGroupsTemplate(testGroups, false);
                          showToast(`Đã xuất ${testGroups.length} nhóm xét nghiệm từ cơ sở dữ liệu ra Excel!`, 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Xuất danh mục nhóm xét nghiệm thực tế trong DB"
                      >
                        <Download className="w-3 h-3" />
                        <span>Data</span>
                      </button>

                      <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Nhập</span>
                        <input type="file" accept=".xlsx,.xls" onChange={handleImportGroups} className="hidden" />
                      </label>

                      <button
                        type="button"
                        onClick={() => onOpenAiSmartFill?.('TEST_GROUPS')}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                        title="AI tự động trích xuất và điền vào mẫu nhóm"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 7: Thang Đo & Phân Độ */}
                  <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-amber-400" />
                          Thang Đo Phân Độ
                        </span>
                        <span className="font-mono text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded">
                          {allergenScales.length} thang đo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Quản lý các mức phân độ bán định lượng (0-6, âm/dương tính, ngưỡng min-max, màu chỉ thị).
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          exportScalesTemplate(allergenScales, true);
                          showToast('Đã tải file Template mẫu Thang đo về máy!', 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Tải template mẫu Thang đo phân độ kèm hướng dẫn"
                      >
                        <Download className="w-3 h-3" />
                        <span>Mẫu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          exportScalesTemplate(allergenScales, false);
                          showToast(`Đã xuất ${allergenScales.length} thang đo từ cơ sở dữ liệu ra Excel!`, 'success');
                        }}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                        title="Xuất danh mục thang đo thực tế trong DB"
                      >
                        <Download className="w-3 h-3" />
                        <span>Data</span>
                      </button>

                      <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Nhập</span>
                        <input type="file" accept=".xlsx,.xls" onChange={handleImportScales} className="hidden" />
                      </label>

                      <button
                        type="button"
                        onClick={() => onOpenAiSmartFill?.('ALLERGEN_SCALES')}
                        className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                        title="AI tự động trích xuất và điền vào mẫu thang đo"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>AI</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 3: XUẤT SỔ SÁCH & BÁO CÁO DOANH THU ── */}
              <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 md:p-5 space-y-4">
                <div className="border-b border-slate-700/60 pb-3">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>3. Xuất Sổ Sách Xét Nghiệm &amp; Báo Cáo Doanh Thu Ra Excel</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Trích xuất toàn bộ dữ liệu lịch sử phiếu xét nghiệm và hóa đơn tài chính sang định dạng bảng tính Excel
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-white">Sổ Lưu Phiếu Xét Nghiệm</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Tổng hợp {reports.length} ca khám, kết quả, bác sĩ, link PDF
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        exportReportsExcel(reports);
                        showToast('Đã xuất toàn bộ Sổ lưu xét nghiệm ra file Excel!', 'success');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition cursor-pointer active:scale-95 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xuất Sổ Lưu</span>
                    </button>
                  </div>

                  <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-white">Báo Cáo Doanh Thu Theo Bác Sĩ</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Tổng hợp {invoices.length} hóa đơn thu phí và thống kê doanh số
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const doctorStats = doctorsList.map((d) => {
                          const docInvoices = invoices.filter((i) => i.doctorName === d.name);
                          const totalRev = docInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
                          const allTotal = invoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
                          return {
                            doctor: d,
                            totalRevenue: totalRev,
                            invoiceCount: docInvoices.length,
                            percentage: allTotal > 0 ? (totalRev / allTotal) * 100 : 0
                          };
                        });
                        exportRevenueExcel(invoices, doctorStats);
                        showToast('Đã xuất Báo cáo doanh thu ra file Excel!', 'success');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs transition cursor-pointer active:scale-95 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xuất Doanh Thu</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════ TAB 2: EXPORT PDF ĐỒNG LOẠT ══════════════ */}
          {activeTab === 'EXPORT' && (
            <div className="space-y-4">

              {/* Export Progress Panel (khi đang chạy hoặc đã xong) */}
              {(isBatchExporting || progress.status === 'done' || progress.status === 'cancelled') && (
                <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950/50">
                  <div className="p-4 space-y-3">
                    {/* Progress bar */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">
                        {progress.status === 'running' ? '🚀 Đang xuất PDF đồng loạt...' :
                         progress.status === 'done' ? '✅ Hoàn tất!' :
                         progress.status === 'cancelled' ? '⏹️ Đã hủy' : ''}
                      </span>
                      <span className="font-mono font-bold text-sky-400">
                        {progress.completed}/{progress.total} ({progressPercent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          progress.status === 'done' ? 'bg-emerald-500' :
                          progress.status === 'cancelled' ? 'bg-amber-500' : 'bg-sky-500 animate-pulse'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Current item */}
                    {progress.current && (
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        Đang xử lý: {progress.current}
                      </p>
                    )}

                    {/* Action buttons during/after export */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {isBatchExporting && (
                        <button
                          onClick={onCancelBatch}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Hủy Quá Trình</span>
                        </button>
                      )}

                      {progress.status === 'done' && (
                        <button
                          onClick={onDownloadZip}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition"
                        >
                          <Archive className="w-4 h-4" />
                          <span>Tải File .ZIP ({progress.completed} PDFs)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Toolbar: Filter + Select All + Start Export */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                {/* Filter chips */}
                <div className="flex items-center gap-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  {(['ALL', 'TODAY', 'NOT_EXPORTED', 'EXPORTED'] as ExportFilterType[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setExportFilter(f)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                        exportFilter === f
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {f === 'ALL' ? 'Tất cả' :
                       f === 'TODAY' ? 'Hôm nay' :
                       f === 'NOT_EXPORTED' ? 'Chưa xuất' : 'Đã xuất'}
                    </button>
                  ))}
                </div>

                {/* Selection & Export actions */}
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-white font-bold cursor-pointer"
                  >
                    {selectedIds.size === filteredReports.length && filteredReports.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                    <span>
                      {selectedIds.size === filteredReports.length && filteredReports.length > 0
                        ? 'Bỏ chọn tất cả'
                        : `Chọn tất cả (${filteredReports.length})`}
                    </span>
                  </button>

                  <button
                    onClick={handleStartBatchExport}
                    disabled={isBatchExporting || selectedIds.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Bắt đầu xuất PDF ({selectedIds.size})</span>
                  </button>
                </div>
              </div>

              {/* Reports Table for selection */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-800 text-slate-300 font-bold sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 w-10 text-center">
                          <button onClick={handleSelectAll} className="p-0.5">
                            {selectedIds.size === filteredReports.length && filteredReports.length > 0 ? (
                              <CheckSquare className="w-4 h-4 text-sky-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                        </th>
                        <th className="p-2.5">Mã BN</th>
                        <th className="p-2.5">Họ và Tên</th>
                        <th className="p-2.5">Thời gian tạo</th>
                        <th className="p-2.5 text-center">Loại phiếu</th>
                        <th className="p-2.5 text-center">Số chỉ số</th>
                        <th className="p-2.5 text-center">Trạng thái PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                            <p className="font-semibold">Không có phiếu nào khớp với bộ lọc</p>
                          </td>
                        </tr>
                      ) : (
                        filteredReports.map((r) => {
                          const isSelected = selectedIds.has(r.id);
                          return (
                            <tr
                              key={r.id}
                              onClick={() => handleToggleSelect(r.id)}
                              className={`hover:bg-slate-800/40 transition cursor-pointer ${
                                isSelected ? 'bg-sky-950/20' : ''
                              }`}
                            >
                              <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => handleToggleSelect(r.id)} className="p-0.5">
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-sky-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-500" />
                                  )}
                                </button>
                              </td>
                              <td className="p-2.5 font-mono font-bold text-sky-400">{r.patient.code}</td>
                              <td className="p-2.5 font-bold text-white uppercase">{r.patient.name}</td>
                              <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                                {new Date(r.createdAt).toLocaleString('vi-VN')}
                              </td>
                              <td className="p-2.5 text-center">
                                {r.isAllergen ? (
                                  <span className="text-[10px] bg-red-950/80 text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-800/60">
                                    Panel 91
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-800/60">
                                    Chuẩn A4
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-slate-300">
                                {r.selectedTests?.length || r.testCount || 0}
                              </td>
                              <td className="p-2.5 text-center">
                                {r.cloudPdfUrl ? (
                                  <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-800/60">
                                    Đã xuất Cloud
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                                    Chưa xuất
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
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
