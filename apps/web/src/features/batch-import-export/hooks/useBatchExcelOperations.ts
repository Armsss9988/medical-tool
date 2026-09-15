import { useState, useRef } from 'react';
import {
  CatalogItem, BatchImportRow, ToastType,
  TestGroup, TestEquipment, TestPackage, Doctor, CatalogItemEquipmentLink,
  AllergenGradingScale, STORAGE_KEYS
} from '@domain';
import { saveState } from '@infra/storage';
import { putTable } from '@infra/apiClient';
import {
  exportBatchTemplateExcel,
  parseExcelBatchPatients,
  parseExcelCatalog,
  parseExcelCatalogItemEquipments,
  parseExcelTestPackages,
  parseExcelDoctors,
  parseExcelEquipments,
  parseExcelTestGroups,
  parseExcelScales
} from '@infra/excelService';

interface UseBatchExcelOperationsProps {
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
  onBatchImport: (rows: BatchImportRow[]) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export function useBatchExcelOperations({
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
  onBatchImport,
  showToast
}: UseBatchExcelOperationsProps) {
  const [importedRows, setImportedRows] = useState<BatchImportRow[]>([]);
  const [importError, setImportError] = useState<string>('');
  const [selectedBatchPackageId, setSelectedBatchPackageId] = useState<string>('all');
  const [catalogGroupFilter, setCatalogGroupFilter] = useState<string>('all');
  const [equipmentLinkFilter, setEquipmentLinkFilter] = useState<string>('all');
  const [packageExportFilter, setPackageExportFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ─── CATALOG & CONFIG EXCEL HANDLERS ───────────────────────────────────────

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
        saveState(STORAGE_KEYS.CATALOG, merged);
        putTable('catalog', merged).catch((err) => console.warn('[BatchExportModal] Lỗi lưu catalog lên server:', err));
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
        saveState(STORAGE_KEYS.CATALOG_ITEM_EQUIPMENTS, merged);
        putTable('catalog-item-equipments', merged).catch((err) => console.warn('[BatchExportModal] Lỗi lưu equipment links lên server:', err));
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
            const finalItems = (newPkg.items && newPkg.items.length > 0) ? newPkg.items : existing.items;
            map.set(key, {
              ...existing,
              ...newPkg,
              id: existing.id,
              name: newPkg.name || existing.name,
              defaultEquipmentId: newPkg.defaultEquipmentId ?? existing.defaultEquipmentId,
              price: newPkg.price > 0 ? newPkg.price : existing.price,
              items: finalItems
            });
            updatedCount++;
          } else {
            map.set(key, newPkg);
            addedCount++;
          }
        });
        const merged = Array.from(map.values());
        setTestPackages(merged);
        saveState(STORAGE_KEYS.TEST_PACKAGES, merged);
        putTable('test-packages', merged).catch((err) => console.warn('[BatchExportModal] Lỗi lưu packages lên server:', err));
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
        saveState(STORAGE_KEYS.DOCTORS, merged);
        putTable('doctors', merged).catch((err) => console.warn('[BatchExportModal] Lỗi lưu doctors lên server:', err));
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
        saveState(STORAGE_KEYS.EQUIPMENTS, merged);
        putTable('equipments', merged).catch((err) => console.warn('[BatchExportModal] Lỗi lưu equipments lên server:', err));
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
        saveState(STORAGE_KEYS.TEST_GROUPS, merged);
        putTable('test-groups', merged).catch((err) => console.warn('[BatchExportModal] Lỗi lưu test groups lên server:', err));
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
        saveState(STORAGE_KEYS.ALLERGEN_SCALES, merged);
        putTable('allergen-scales', merged).catch((err) => console.warn('[BatchExportModal] Lỗi lưu allergen scales lên server:', err));
        showToast(`Đã cập nhật ${updatedCount} thang đo cũ và thêm mới ${addedCount} thang đo (tổng ${merged.length} thang đo)!`, 'success');
      } else {
        showToast('Không tìm thấy dữ liệu hợp lệ trong file Excel.', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi đọc file Excel', 'error');
    }
    e.target.value = '';
  };

  return {
    importedRows,
    setImportedRows,
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
  };
}
