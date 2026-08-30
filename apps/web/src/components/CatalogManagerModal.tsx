import { useState, useEffect, useRef } from 'react';
import { X, Save, Layers, Stethoscope, FlaskConical } from 'lucide-react';
import { autoResolveItemLinks } from '@data';
import { CatalogItem, CatalogItemEquipmentLink, TestPackage, TestGroup, TestEquipment, Doctor, CATALOG_TAB, CatalogTabType } from '@domain';
import CatalogItemsTab from './catalogManager/CatalogItemsTab';
import TestPackagesTab from './catalogManager/TestPackagesTab';
import DoctorsTab from './catalogManager/DoctorsTab';

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
  onSaveCatalogItemEquipments
}: CatalogManagerModalProps) {
  const [activeTab, setActiveTab] = useState<CatalogTabType>(targetTab || CATALOG_TAB.INDICATORS);
  const [items, setItems] = useState<CatalogItem[]>(catalog);
  const [packages, setPackages] = useState<TestPackage[]>(testPackages);
  const [groups, setGroups] = useState<TestGroup[]>(testGroups);
  const [eqList, setEqList] = useState<TestEquipment[]>(equipments);
  const [docsList, setDocsList] = useState<Doctor[]>(doctorsList);
  const [itemEquipments, setItemEquipments] = useState<CatalogItemEquipmentLink[]>(catalogItemEquipments);

  const prevIsOpenRef = useRef(false);

  // Chỉ khởi tạo/đồng bộ dữ liệu khi modal chuyển từ đóng sang mở
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setItems(catalog.map(autoResolveItemLinks));
      setPackages(testPackages);
      setGroups(testGroups);
      setEqList(equipments);
      setDocsList(doctorsList);
      setItemEquipments(catalogItemEquipments);
      setActiveTab(targetTab || CATALOG_TAB.INDICATORS);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, catalog, testPackages, testGroups, equipments, doctorsList, catalogItemEquipments, targetTab]);

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

  const handleSaveAll = () => {
    onSaveCatalog(items);
    onSavePackages(packages);
    if (onSaveTestGroups) onSaveTestGroups(groups);
    if (onSaveEquipments) onSaveEquipments(eqList);
    if (onSaveDoctors) onSaveDoctors(docsList);
    if (onSaveCatalogItemEquipments) onSaveCatalogItemEquipments(itemEquipments);
    onClose();
  };

  return (\n    <div className=\"fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden\">\n      <div className=\"bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150\">\n        \n        {/* HEADER MODAL */}\n        <div className=\"bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0\">\n          <div className=\"flex items-center space-x-3\">\n            <div className=\"p-2 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400\">\n              <Layers className=\"w-5 h-5\" />\n            </div>\n            <div>\n              <h3 className=\"font-extrabold text-base tracking-wide flex items-center gap-2\">\n                Quản Lý Danh Mục Xét Nghiệm & Bác Sĩ\n                <span className=\"text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded\">\n                  {items.length} Chỉ Số • {packages.length} Gói • {eqList.length} Máy\n                </span>\n              </h3>\n              <p className=\"text-xs text-slate-400\">\n                Tùy biến chỉ số, gói xét nghiệm, thiết bị đo, khoảng tham chiếu, thang đo độ dương tính và bác sĩ chỉ định\n              </p>\n            </div>\n          </div>\n\n          <div className=\"flex items-center space-x-2\">\n            <button\n              type=\"button\"\n              onClick={handleSaveAll}\n              className=\"flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-700/20 transition-all active:scale-95 cursor-pointer\"\n            >\n              <Save className=\"w-4 h-4\" />\n              <span>Lưu Toàn Bộ Thay Đổi</span>\n            </button>\n            <button\n              type=\"button\"\n              onClick={onClose}\n              className=\"p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer\"\n            >\n              <X className=\"w-5 h-5\" />\n            </button>\n          </div>\n        </div>\n\n        {/* 3 MAIN TABS NAVIGATION */}\n        <div className=\"flex border-b border-slate-200 bg-slate-100/80 px-4 pt-2 gap-1 text-xs font-bold shrink-0 overflow-x-auto\">\n          <button\n            type=\"button\"\n            onClick={() => setActiveTab('INDICATORS')}\n            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-2 cursor-pointer ${\n              activeTab === 'INDICATORS' || activeTab === 'ALLERGENS'\n                ? 'bg-white border-slate-200 text-sky-700 shadow-xs'\n                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'\n            }`}\n          >\n            <FlaskConical className=\"w-3.5 h-3.5\" />\n            <span>1. Chỉ Số Xét Nghiệm ({items.length})</span>\n          </button>\n\n          <button\n            type=\"button\"\n            onClick={() => setActiveTab('PACKAGES')}\n            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-2 cursor-pointer ${\n              activeTab === 'PACKAGES' || activeTab === 'PACKAGES_INDICATOR' || activeTab === 'PACKAGES_ALLERGEN'\n                ? 'bg-white border-slate-200 text-sky-700 shadow-xs'\n                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'\n            }`}\n          >\n            <Layers className=\"w-3.5 h-3.5\" />\n            <span>2. Gói Xét Nghiệm ({packages.length})</span>\n          </button>\n\n          <button\n            type=\"button\"\n            onClick={() => setActiveTab('DOCTORS')}\n            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-2 cursor-pointer ${\n              activeTab === 'DOCTORS'\n                ? 'bg-white border-slate-200 text-emerald-700 shadow-xs'\n                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'\n            }`}\n          >\n            <Stethoscope className=\"w-3.5 h-3.5\" />\n            <span>3. Bác Sĩ &amp; Chuyên Gia ({docsList.length})</span>\n          </button>\n        </div>\n\n        {/* TAB 1: TOÀN BỘ CHỈ SỐ XÉT NGHIỆM */}\n        {(activeTab === 'INDICATORS' || activeTab === 'ALLERGENS') && (\n          <CatalogItemsTab\n            items={items}\n            setItems={setItems}\n            groups={groups}\n            onCreateGroup={handleCreateGroup}\n            onDeleteGroup={handleDeleteGroup}\n            equipments={eqList}\n            onCreateEquipment={handleCreateEquipment}\n            onDeleteEquipment={handleDeleteEquipment}\n            catalogItemEquipments={itemEquipments}\n            setCatalogItemEquipments={setItemEquipments}\n          />\n        )}\n\n        {/* TAB 2: TOÀN BỘ GÓI XÉT NGHIỆM */}\n        {(activeTab === 'PACKAGES' || activeTab === 'PACKAGES_INDICATOR' || activeTab === 'PACKAGES_ALLERGEN') && (\n          <TestPackagesTab\n            items={items}\n            packages={packages}\n            setPackages={setPackages}\n            equipments={eqList}\n            catalogItemEquipments={itemEquipments}\n          />\n        )}\n\n        {/* TAB 3: DANH SÁCH BÁC SĨ */}\n        {activeTab === 'DOCTORS' && (\n          <DoctorsTab docsList={docsList} setDocsList={setDocsList} />\n        )}\n\n        {/* FOOTER MODAL */}\n        <div className=\"bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0\">\n          <span className=\"text-xs text-slate-500 font-medium\">\n            Mẹo: Nhấn <strong>\"Lưu Toàn Bộ Thay Đổi\"</strong> để áp dụng dữ liệu mới ngay lập tức.\n          </span>\n          <div className=\"flex items-center space-x-2\">\n            <button\n              type=\"button\"\n              onClick={onClose}\n              className=\"px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer\"\n            >\n              Đóng\n            </button>\n            <button\n              type=\"button\"\n              onClick={handleSaveAll}\n              className=\"flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-700/20 transition active:scale-95 cursor-pointer\"\n            >\n              <Save className=\"w-4 h-4\" />\n              <span>Lưu Toàn Bộ</span>\n            </button>\n          </div>\n        </div>\n\n      </div>\n    </div>\n  );\n}\n