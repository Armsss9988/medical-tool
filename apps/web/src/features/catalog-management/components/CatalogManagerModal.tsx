import { useState, useEffect, useRef } from 'react';
import { X, Save, Layers, Stethoscope, FlaskConical, Activity, Cpu, FolderTree, Sliders } from 'lucide-react';
import { autoResolveItemLinks } from '@data';
import {
  CatalogItem,
  CatalogItemEquipmentLink,
  TestPackage,
  TestGroup,
  TestEquipment,
  Doctor,
  AllergenGradingScale,
  ReferenceRangeItem,
  CATALOG_TAB,
  CatalogTabType,
  normalizeTestPackage
} from '@domain';
import { IndicatorTable } from './indicators/IndicatorTable';
import { PackageTable } from './packages/PackageTable';
import { DoctorTable } from './doctors/DoctorTable';
import { ScalesTable } from './scales/ScalesTable';
import { EquipmentTable } from './equipments/EquipmentTable';
import { GroupTable } from './groups/GroupTable';
import { ReferenceRangeTable } from './ranges/ReferenceRangeTable';

interface CatalogManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTab?: CatalogTabType | null;
  catalog: CatalogItem[];
  onSaveCatalog: (newCatalog: CatalogItem[]) => void;
  testPackages: TestPackage[];
  onSavePackages: (newPackages: TestPackage[]) => void;
  testGroups?: TestGroup[];
  onSaveTestGroups?: (newGroups: TestGroup[]) => void;
  equipments?: TestEquipment[];
  onSaveEquipments?: (newEquipments: TestEquipment[]) => void;
  doctorsList?: Doctor[];
  onSaveDoctors?: (newDoctors: Doctor[]) => void;
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  onSaveCatalogItemEquipments?: (links: CatalogItemEquipmentLink[]) => void;
  allergenScales?: AllergenGradingScale[];
  onSaveScales?: (scales: AllergenGradingScale[]) => void;
  referenceRanges?: ReferenceRangeItem[];
  onSaveReferenceRanges?: (ranges: ReferenceRangeItem[]) => void;
  onSaveAllData?: (data: {
    catalog?: CatalogItem[];
    testPackages?: TestPackage[];
    testGroups?: TestGroup[];
    equipments?: TestEquipment[];
    doctorsList?: Doctor[];
    catalogItemEquipments?: CatalogItemEquipmentLink[];
    allergenScales?: AllergenGradingScale[];
    referenceRanges?: ReferenceRangeItem[];
  }) => Promise<void>;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function CatalogManagerModal({ 
  isOpen, 
  onClose, 
  targetTab = null,
  catalog, 
  onSaveCatalog,
  testPackages,
  onSavePackages,
  testGroups = [],
  onSaveTestGroups,
  equipments = [],
  onSaveEquipments,
  doctorsList = [],
  onSaveDoctors,
  catalogItemEquipments = [],
  onSaveCatalogItemEquipments,
  allergenScales = [],
  onSaveScales,
  referenceRanges = [],
  onSaveReferenceRanges,
  onSaveAllData,
  showToast
}: CatalogManagerModalProps) {
  const [activeTab, setActiveTab] = useState<CatalogTabType>(targetTab || CATALOG_TAB.INDICATORS);
  const [items, setItems] = useState<CatalogItem[]>(() => catalog.map(autoResolveItemLinks));
  const [packages, setPackages] = useState<TestPackage[]>(() => testPackages.map(normalizeTestPackage));
  const [groups, setGroups] = useState<TestGroup[]>(testGroups);
  const [eqList, setEqList] = useState<TestEquipment[]>(equipments);
  const [docsList, setDocsList] = useState<Doctor[]>(doctorsList);
  const [itemEquipments, setItemEquipments] = useState<CatalogItemEquipmentLink[]>(catalogItemEquipments);
  const [scalesList, setScalesList] = useState<AllergenGradingScale[]>(allergenScales);
  const [rangesList, setRangesList] = useState<ReferenceRangeItem[]>(referenceRanges);
  const [isSaving, setIsSaving] = useState(false);

  const prevIsOpenRef = useRef(false);

  // Chỉ khởi tạo/đồng bộ dữ liệu khi modal chuyển từ đóng sang mở
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setItems(catalog.map(autoResolveItemLinks));
      setPackages(testPackages.map(normalizeTestPackage));
      setGroups(testGroups);
      setEqList(equipments);
      setDocsList(doctorsList);
      setItemEquipments(catalogItemEquipments);
      setScalesList(allergenScales || []);
      setRangesList(referenceRanges || []);
      setActiveTab(targetTab || CATALOG_TAB.INDICATORS);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, catalog, testPackages, testGroups, equipments, doctorsList, catalogItemEquipments, allergenScales, referenceRanges, targetTab]);

  // Nếu targetTab thay đổi từ bên ngoài khi modal đang mở, cập nhật activeTab tương ứng
  const prevTargetTabRef = useRef(targetTab);
  useEffect(() => {
    if (isOpen && targetTab && targetTab !== prevTargetTabRef.current) {
      setActiveTab(targetTab);
    }
    prevTargetTabRef.current = targetTab;
  }, [isOpen, targetTab]);



  // Xác định chính xác những bảng có dữ liệu thay đổi thực sự
  const hasCatalogChanged = JSON.stringify(items) !== JSON.stringify(catalog);
  const hasPackagesChanged = JSON.stringify(packages) !== JSON.stringify(testPackages);
  const hasGroupsChanged = JSON.stringify(groups) !== JSON.stringify(testGroups);
  const hasEqChanged = JSON.stringify(eqList) !== JSON.stringify(equipments);
  const hasDocsChanged = JSON.stringify(docsList) !== JSON.stringify(doctorsList);
  const hasItemEqChanged = JSON.stringify(itemEquipments) !== JSON.stringify(catalogItemEquipments);
  const hasScalesChanged = JSON.stringify(scalesList) !== JSON.stringify(allergenScales);
  const hasRangesChanged = JSON.stringify(rangesList) !== JSON.stringify(referenceRanges);

  const hasUnsavedChanges = (
    hasCatalogChanged ||
    hasPackagesChanged ||
    hasGroupsChanged ||
    hasEqChanged ||
    hasDocsChanged ||
    hasItemEqChanged ||
    hasScalesChanged ||
    hasRangesChanged
  );

  const unsavedCount = (
    (hasCatalogChanged ? 1 : 0) +
    (hasPackagesChanged ? 1 : 0) +
    (hasGroupsChanged ? 1 : 0) +
    (hasEqChanged ? 1 : 0) +
    (hasDocsChanged ? 1 : 0) +
    (hasItemEqChanged ? 1 : 0) +
    (hasScalesChanged ? 1 : 0) +
    (hasRangesChanged ? 1 : 0)
  );

  // Đóng an toàn: Cảnh báo nếu có dữ liệu chưa lưu để tránh mất mát công sức nhập liệu
  const handleSafeClose = () => {
    if (hasUnsavedChanges) {
      if (!confirm(`Bạn đang có thay đổi chưa lưu trong danh mục (${unsavedCount} mục)! Bạn có chắc chắn muốn đóng mà không lưu không?`)) {
        return;
      }
    }
    onClose();
  };

  // Cảnh báo beforeunload khi người dùng vô tình F5 hoặc đóng trình duyệt
  useEffect(() => {
    if (!isOpen || !hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, hasUnsavedChanges]);

  const handleSaveAll = async () => {
    // 1. Kiểm tra dữ liệu hợp lệ: chỉ kiểm tra gói xét nghiệm nếu người dùng có thay đổi gói
    if (hasPackagesChanged) {
      const invalidPkg = packages.find((p) => !p.name || !p.name.trim());
      if (invalidPkg) {
        alert('Tên gói xét nghiệm không được để trống! Vui lòng nhập tên cho tất cả các gói trước khi lưu.');
        return;
      }
    }

    try {
      setIsSaving(true);
      if (showToast) {
        showToast('Đang lưu danh mục vào cơ sở dữ liệu...', 'info');
      }

      const changedData: Parameters<NonNullable<typeof onSaveAllData>>[0] = {};
      if (hasCatalogChanged) changedData.catalog = items;
      if (hasPackagesChanged) changedData.testPackages = packages;
      if (hasGroupsChanged) changedData.testGroups = groups;
      if (hasEqChanged) changedData.equipments = eqList;
      if (hasDocsChanged) changedData.doctorsList = docsList;
      if (hasItemEqChanged) changedData.catalogItemEquipments = itemEquipments;
      if (hasScalesChanged) changedData.allergenScales = scalesList;
      if (hasRangesChanged) changedData.referenceRanges = rangesList;

      // Cập nhật state ở tầng cha ngay lập tức
      if (hasCatalogChanged) onSaveCatalog(items);
      if (hasPackagesChanged) onSavePackages(packages);
      if (hasGroupsChanged && onSaveTestGroups) onSaveTestGroups(groups);
      if (hasEqChanged && onSaveEquipments) onSaveEquipments(eqList);
      if (hasDocsChanged && onSaveDoctors) onSaveDoctors(docsList);
      if (hasItemEqChanged && onSaveCatalogItemEquipments) onSaveCatalogItemEquipments(itemEquipments);
      if (hasScalesChanged && onSaveScales) onSaveScales(scalesList);
      if (hasRangesChanged && onSaveReferenceRanges) onSaveReferenceRanges(rangesList);

      // Nếu có dữ liệu thay đổi và có onSaveAllData, đồng bộ đúng các bảng thay đổi
      if (onSaveAllData) {
        if (Object.keys(changedData).length > 0) {
          await onSaveAllData(changedData);
        }
      }

      if (showToast) {
        showToast('Đã lưu danh mục thành công!', 'success');
      }
      onClose();
    } catch (err: unknown) {
      console.error('[CatalogManager] Lỗi khi lưu danh mục:', err);
      const msg = err instanceof Error ? err.message : 'Không thể kết nối đến cơ sở dữ liệu';
      if (showToast) {
        showToast(`Lỗi khi lưu vào Database: ${msg}`, 'error');
      } else {
        alert(`Lỗi khi lưu vào Database: ${msg}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Phím tắt Ctrl+S lưu toàn bộ danh mục & phím Escape đóng an toàn
  const handleSaveAllRef = useRef(handleSaveAll);
  handleSaveAllRef.current = handleSaveAll;
  const handleSafeCloseRef = useRef(handleSafeClose);
  handleSafeCloseRef.current = handleSafeClose;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveAllRef.current();
      } else if (e.key === 'Escape') {
        // Chỉ đóng nếu không đang gõ trong input text hoặc textarea
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        handleSafeCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl h-[92vh] max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER MODAL */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span>Quản Lý Danh Mục</span>
                <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded">
                  {items.length} Chỉ Số • {packages.length} Gói • {eqList.length} Máy
                </span>
                {hasUnsavedChanges && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded animate-pulse">
                    ● Có thay đổi chưa lưu
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 hidden sm:block">
                Tùy biến chỉ số, gói xét nghiệm, máy đo, nhóm, thang đo, khoảng tham chiếu và bác sĩ chỉ định (Ctrl+S để lưu)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAll}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-900 shadow-amber-500/30 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/20'
              }`}
              title="Phím tắt: Ctrl + S để lưu"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isSaving ? 'Đang Lưu...' : hasUnsavedChanges ? `Lưu Thay Đổi (${unsavedCount}) • Ctrl+S` : 'Lưu Danh Mục (Ctrl+S)'}
              </span>
              <span className="sm:hidden">
                {hasUnsavedChanges ? `Lưu (${unsavedCount})` : 'Lưu'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleSafeClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 7 MAIN TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 px-2 sm:px-4 pt-2 gap-1 text-xs font-bold shrink-0 overflow-x-auto no-scrollbar touch-pan-x">
          <button
            type="button"
            onClick={() => setActiveTab('INDICATORS')}
            className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap text-[11px] sm:text-xs relative ${
              activeTab === 'INDICATORS' || activeTab === 'ALLERGENS'
                ? 'bg-white border-slate-200 text-sky-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>1. Chỉ Số ({items.length})</span>
            {hasCatalogChanged && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Có thay đổi chưa lưu" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PACKAGES')}
            className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap text-[11px] sm:text-xs relative ${
              activeTab === 'PACKAGES' || activeTab === 'PACKAGES_INDICATOR' || activeTab === 'PACKAGES_ALLERGEN'
                ? 'bg-white border-slate-200 text-sky-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Gói ({packages.length})</span>
            {hasPackagesChanged && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Có thay đổi chưa lưu" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EQUIPMENTS')}
            className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap text-[11px] sm:text-xs relative ${
              activeTab === 'EQUIPMENTS'
                ? 'bg-white border-slate-200 text-sky-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>3. Thiết Bị ({eqList.length})</span>
            {hasEqChanged && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Có thay đổi chưa lưu" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GROUPS')}
            className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap text-[11px] sm:text-xs relative ${
              activeTab === 'GROUPS'
                ? 'bg-white border-slate-200 text-emerald-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>4. Nhóm ({groups.length})</span>
            {hasGroupsChanged && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Có thay đổi chưa lưu" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SCALES')}
            className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap text-[11px] sm:text-xs relative ${
              activeTab === 'SCALES'
                ? 'bg-white border-slate-200 text-amber-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>5. Thang Đo ({scalesList.length})</span>
            {hasScalesChanged && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Có thay đổi chưa lưu" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RANGES')}
            className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap text-[11px] sm:text-xs relative ${
              activeTab === 'RANGES'
                ? 'bg-white border-slate-200 text-indigo-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>6. Tham Chiếu ({rangesList.length})</span>
            {hasRangesChanged && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Có thay đổi chưa lưu" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DOCTORS')}
            className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap text-[11px] sm:text-xs relative ${
              activeTab === 'DOCTORS'
                ? 'bg-white border-slate-200 text-emerald-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>7. Bác Sĩ ({docsList.length})</span>
            {hasDocsChanged && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Có thay đổi chưa lưu" />}
          </button>
        </div>

        {/* TAB CONTENT WRAPPER */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative bg-slate-50">
          {/* TAB 1: TOÀN BỘ CHỈ SỐ XÉT NGHIỆM */}
          {(activeTab === 'INDICATORS' || activeTab === 'ALLERGENS') && (
            <IndicatorTable
              items={items}
              setItems={setItems}
              groups={groups}
              equipments={eqList}
              catalogItemEquipments={itemEquipments}
              setCatalogItemEquipments={setItemEquipments}
              scales={scalesList}
              showToast={showToast}
            />
          )}

          {/* TAB 2: TOÀN BỘ GÓI XÉT NGHIỆM */}
          {(activeTab === 'PACKAGES' || activeTab === 'PACKAGES_INDICATOR' || activeTab === 'PACKAGES_ALLERGEN') && (
            <PackageTable
              items={items}
              packages={packages}
              setPackages={setPackages}
              equipments={eqList}
              catalogItemEquipments={itemEquipments}
              referenceRanges={rangesList}
              allergenScales={scalesList}
              groups={groups}
              showToast={showToast}
            />
          )}

          {/* TAB 3: THIẾT BỊ XÉT NGHIỆM */}
          {activeTab === 'EQUIPMENTS' && (
            <EquipmentTable
              equipments={eqList}
              setEquipments={setEqList}
              catalog={items}
              catalogItemEquipments={itemEquipments}
              onSaveEquipments={onSaveEquipments}
              showToast={showToast}
            />
          )}

          {/* TAB 4: NHÓM CHỈ SỐ */}
          {activeTab === 'GROUPS' && (
            <GroupTable
              groups={groups}
              setGroups={setGroups}
              catalog={items}
              onSaveGroups={onSaveTestGroups}
              showToast={showToast}
            />
          )}

          {/* TAB 5: THANG ĐO PHÂN ĐỘ */}
          {activeTab === 'SCALES' && (
            <ScalesTable
              scales={scalesList}
              setScales={setScalesList}
              equipments={eqList}
            />
          )}

          {/* TAB 6: KHOẢNG THAM CHIẾU NÂNG CAO */}
          {activeTab === 'RANGES' && (
            <ReferenceRangeTable
              referenceRanges={rangesList}
              setReferenceRanges={setRangesList}
              showToast={showToast}
            />
          )}

          {/* TAB 7: DANH SÁCH BÁC SĨ */}
          {activeTab === 'DOCTORS' && (
            <DoctorTable 
              docsList={docsList} 
              setDocsList={setDocsList} 
              onSaveDoctors={onSaveDoctors}
              onSaveAllData={onSaveAllData}
              showToast={showToast}
            />
          )}
        </div>

        {/* FOOTER MODAL */}
        <div className="bg-slate-50 px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 shrink-0">
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium text-center sm:text-left">
            Mẹo: Nhấn <strong>"Lưu Toàn Bộ Thay Đổi"</strong> để áp dụng dữ liệu mới ngay lập tức.
          </span>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-700/20 transition active:scale-95 cursor-pointer"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Đang lưu DB...' : 'Lưu Toàn Bộ'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

