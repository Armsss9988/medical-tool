import { useState, useEffect, useRef } from 'react';
import { X, Save, Layers, Stethoscope, FlaskConical, Activity } from 'lucide-react';
import { autoResolveItemLinks } from '@data';
import { CatalogItem, CatalogItemEquipmentLink, TestPackage, TestGroup, TestEquipment, Doctor, AllergenGradingScale, CATALOG_TAB, CatalogTabType, normalizeTestPackage } from '@domain';
import CatalogItemsTab from './catalogManager/CatalogItemsTab';
import TestPackagesTab from './catalogManager/TestPackagesTab';
import DoctorsTab from './catalogManager/DoctorsTab';
import ScalesTab from './catalogManager/ScalesTab';

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
  onSaveAllData?: (data: {
    catalog?: CatalogItem[];
    testPackages?: TestPackage[];
    testGroups?: TestGroup[];
    equipments?: TestEquipment[];
    doctorsList?: Doctor[];
    catalogItemEquipments?: CatalogItemEquipmentLink[];
    allergenScales?: AllergenGradingScale[];
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
      setActiveTab(targetTab || CATALOG_TAB.INDICATORS);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, catalog, testPackages, testGroups, equipments, doctorsList, catalogItemEquipments, allergenScales, targetTab]);

  // Nếu targetTab thay đổi từ bên ngoài khi modal đang mở, cập nhật activeTab tương ứng
  const prevTargetTabRef = useRef(targetTab);
  useEffect(() => {
    if (isOpen && targetTab && targetTab !== prevTargetTabRef.current) {
      setActiveTab(targetTab);
    }
    prevTargetTabRef.current = targetTab;
  }, [isOpen, targetTab]);

  if (!isOpen) return null;

  // Group helpers
  const handleCreateGroup = (name: string) => {
    const newG: TestGroup = { id: crypto.randomUUID(), name };
    const updated = [...groups, newG];
    setGroups(updated);
    if (onSaveTestGroups) onSaveTestGroups(updated);
  };

  const handleDeleteGroup = (id: string) => {
    const updated = groups.filter((g) => g.id !== id);
    setGroups(updated);
    if (onSaveTestGroups) onSaveTestGroups(updated);
  };

  // Equipment helpers
  const handleCreateEquipment = (name: string) => {
    const newEq: TestEquipment = { id: crypto.randomUUID(), name, code: name.toUpperCase().replace(/\s+/g, '_').slice(0, 15) };
    const updated = [...eqList, newEq];
    setEqList(updated);
    if (onSaveEquipments) onSaveEquipments(updated);
  };

  const handleDeleteEquipment = (id: string) => {
    const updated = eqList.filter((eq) => eq.id !== id);
    setEqList(updated);
    if (onSaveEquipments) onSaveEquipments(updated);
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      if (showToast) {
        showToast('Đang lưu danh mục vào cơ sở dữ liệu...', 'info');
      }

      onSaveCatalog(items);
      onSavePackages(packages);
      if (onSaveTestGroups) onSaveTestGroups(groups);
      if (onSaveEquipments) onSaveEquipments(eqList);
      if (onSaveDoctors) onSaveDoctors(docsList);
      if (onSaveCatalogItemEquipments) onSaveCatalogItemEquipments(itemEquipments);
      if (onSaveScales) onSaveScales(scalesList);

      if (onSaveAllData) {
        await onSaveAllData({
          catalog: items,
          testPackages: packages,
          testGroups: groups,
          equipments: eqList,
          doctorsList: docsList,
          catalogItemEquipments: itemEquipments,
          allergenScales: scalesList
        });
      }

      if (showToast) {
        showToast('Đã lưu toàn bộ danh mục thành công!', 'success');
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

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER MODAL */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide flex items-center gap-2">
                Quản Lý Danh Mục Xét Nghiệm & Bác Sĩ
                <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded">
                  {items.length} Chỉ Số • {packages.length} Gói • {scalesList.length} Thang Đo • {eqList.length} Máy
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tùy biến chỉ số, gói xét nghiệm, thiết bị đo, khoảng tham chiếu, thang đo độ dương tính và bác sĩ chỉ định
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-700/20 transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Toàn Bộ Thay Đổi</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 MAIN TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 px-4 pt-2 gap-1 text-xs font-bold shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('INDICATORS')}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-2 cursor-pointer ${
              activeTab === 'INDICATORS' || activeTab === 'ALLERGENS'
                ? 'bg-white border-slate-200 text-sky-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>1. Chỉ Số Xét Nghiệm ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PACKAGES')}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-2 cursor-pointer ${
              activeTab === 'PACKAGES' || activeTab === 'PACKAGES_INDICATOR' || activeTab === 'PACKAGES_ALLERGEN'
                ? 'bg-white border-slate-200 text-sky-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Gói Xét Nghiệm ({packages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SCALES')}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-2 cursor-pointer ${
              activeTab === 'SCALES'
                ? 'bg-white border-slate-200 text-amber-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3. Thang Đo &amp; Phân Độ ({scalesList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DOCTORS')}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-2 cursor-pointer ${
              activeTab === 'DOCTORS'
                ? 'bg-white border-slate-200 text-emerald-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>4. Bác Sĩ &amp; Chuyên Gia ({docsList.length})</span>
          </button>
        </div>

        {/* TAB 1: TOÀN BỘ CHỈ SỐ XÉT NGHIỆM */}
        {(activeTab === 'INDICATORS' || activeTab === 'ALLERGENS') && (
          <CatalogItemsTab
            items={items}
            setItems={setItems}
            groups={groups}
            onCreateGroup={handleCreateGroup}
            onDeleteGroup={handleDeleteGroup}
            equipments={eqList}
            onCreateEquipment={handleCreateEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            catalogItemEquipments={itemEquipments}
            setCatalogItemEquipments={setItemEquipments}
            scales={scalesList}
          />
        )}

        {/* TAB 2: TOÀN BỘ GÓI XÉT NGHIỆM */}
        {(activeTab === 'PACKAGES' || activeTab === 'PACKAGES_INDICATOR' || activeTab === 'PACKAGES_ALLERGEN') && (
          <TestPackagesTab
            items={items}
            packages={packages}
            setPackages={setPackages}
            equipments={eqList}
            catalogItemEquipments={itemEquipments}
          />
        )}

        {/* TAB 3: THANG ĐO PHÂN ĐỘ */}
        {activeTab === 'SCALES' && (
          <ScalesTab
            scales={scalesList}
            setScales={setScalesList}
            equipments={eqList}
          />
        )}

        {/* TAB 4: DANH SÁCH BÁC SĨ */}
        {activeTab === 'DOCTORS' && (
          <DoctorsTab docsList={docsList} setDocsList={setDocsList} />
        )}

        {/* FOOTER MODAL */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Mẹo: Nhấn <strong>"Lưu Toàn Bộ Thay Đổi"</strong> để áp dụng dữ liệu mới ngay lập tức.
          </span>
          <div className="flex items-center space-x-2">
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
              className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-700/20 transition active:scale-95 cursor-pointer"
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

