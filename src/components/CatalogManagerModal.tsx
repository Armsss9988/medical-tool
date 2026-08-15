import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Save, Search, Download, Upload, RotateCcw, Edit3, Layers, CheckSquare, Square, Stethoscope, UserPlus, ChevronDown, Check } from 'lucide-react';
import { exportSampleExcelCatalog, parseExcelCatalog } from '@infra/excelService';
import { DEFAULT_CATALOG, TEST_PACKAGES as INITIAL_PACKAGES, DEFAULT_TEST_GROUPS, DEFAULT_EQUIPMENTS } from '@data/defaultCatalog';
import { CatalogItem, TestPackage, TestGroup, TestEquipment, Doctor } from '@domain/types';
import { ManageCatalogUseCase } from '../usecases/ManageCatalogUseCase';

const manageCatalogUseCase = new ManageCatalogUseCase();

// ── GroupSearchCombobox: Dropdown search nhóm xét nghiệm + tạo mới khi Enter ──
interface GroupSearchComboboxProps {
  value: string;
  onChange: (groupName: string) => void;
  groups: TestGroup[];
  onCreateGroup: (name: string) => void;
  onDeleteGroup?: (id: string) => void;
  placeholder?: string;
  compact?: boolean;
}

function GroupSearchCombobox({
  value = '',
  onChange,
  groups,
  onCreateGroup,
  onDeleteGroup,
  placeholder = 'Tìm hoặc tạo nhóm...',
  compact = false
}: GroupSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const exactMatch = groups.some((g) => g.name.toLowerCase() === (searchTerm || '').toLowerCase());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (name: string) => {
    setSearchTerm(name);
    onChange(name);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = (searchTerm || '').trim();
      if (!trimmed) return;
      if (exactMatch) {
        onChange(trimmed);
        setIsOpen(false);
      } else {
        setPendingName(trimmed);
        setShowCreateDialog(true);
        setIsOpen(false);
      }
    }
  };

  const handleConfirmCreate = () => {
    onCreateGroup(pendingName);
    onChange(pendingName);
    setSearchTerm(pendingName);
    setShowCreateDialog(false);
  };

  const inputCls = compact
    ? 'w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-sky-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-500 rounded px-2 py-1 font-semibold text-slate-800 text-xs transition-all focus:outline-none'
    : 'w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-medium text-xs focus:border-sky-600 focus:outline-none';

  return (
    <>
      <div ref={wrapperRef} className="relative w-full">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={inputCls}
          />
          {!compact && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="absolute right-1.5 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map((g) => {
                const isSelected = g.name === value;
                return (
                  <div
                    key={g.id}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-sky-50 flex items-center justify-between transition-colors group cursor-pointer ${
                      isSelected ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700 font-medium'
                    }`}
                  >
                    <div
                      onClick={() => handleSelect(g.name)}
                      className="flex items-center space-x-1.5 flex-1 min-w-0 pr-2"
                    >
                      <span className="truncate">{g.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-sky-600 shrink-0" />}
                    </div>
                    {onDeleteGroup && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteGroup(g.id);
                        }}
                        title="Xóa nhóm này"
                        className="p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-70 group-hover:opacity-100 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-2 text-xs text-slate-500 italic text-center">
                Không tìm thấy. Nhấn <kbd className="bg-slate-200 px-1 rounded font-mono text-[10px]">Enter</kbd> để tạo nhóm mới.
              </div>
            )}
            {searchTerm && !exactMatch && filtered.length > 0 && (
              <button
                type="button"
                onClick={() => { setPendingName(searchTerm.trim()); setShowCreateDialog(true); setIsOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-sky-700 font-semibold hover:bg-sky-50 flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" />
                <span>Tạo nhóm "{searchTerm.trim()}"</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dialog tạo nhóm mới */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-600" />
              Tạo Nhóm Xét Nghiệm Mới
            </h4>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên nhóm:</label>
              <input
                type="text"
                value={pendingName}
                onChange={(e) => setPendingName(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmCreate(); } }}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow"
              >
                Tạo Nhóm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── EquipmentSearchCombobox: Dropdown search thiết bị xử lý + tạo mới khi Enter ──
interface EquipmentSearchComboboxProps {
  value: string;
  onChange: (eqName: string) => void;
  equipments: TestEquipment[];
  onCreateEquipment: (name: string) => void;
  onDeleteEquipment?: (id: string) => void;
  placeholder?: string;
  compact?: boolean;
}

function EquipmentSearchCombobox({
  value = '',
  onChange,
  equipments,
  onCreateEquipment,
  onDeleteEquipment,
  placeholder = 'Tìm hoặc tạo thiết bị...',
  compact = false
}: EquipmentSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = equipments.filter((e) =>
    e.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const exactMatch = equipments.some((e) => e.name.toLowerCase() === (searchTerm || '').toLowerCase());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (name: string) => {
    setSearchTerm(name);
    onChange(name);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = (searchTerm || '').trim();
      if (!trimmed) return;
      if (exactMatch) {
        onChange(trimmed);
        setIsOpen(false);
      } else {
        setPendingName(trimmed);
        setShowCreateDialog(true);
        setIsOpen(false);
      }
    }
  };

  const handleConfirmCreate = () => {
    onCreateEquipment(pendingName);
    onChange(pendingName);
    setSearchTerm(pendingName);
    setShowCreateDialog(false);
  };

  const inputCls = compact
    ? 'w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-sky-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-500 rounded px-2 py-1 font-semibold text-slate-800 text-xs transition-all focus:outline-none'
    : 'w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-medium text-xs focus:border-sky-600 focus:outline-none';

  return (
    <>
      <div ref={wrapperRef} className="relative w-full">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={inputCls}
          />
          {!compact && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="absolute right-1.5 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map((eq) => {
                const isSelected = eq.name === value;
                return (
                  <div
                    key={eq.id}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-sky-50 flex items-center justify-between transition-colors group cursor-pointer ${
                      isSelected ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700 font-medium'
                    }`}
                  >
                    <div
                      onClick={() => handleSelect(eq.name)}
                      className="flex items-center space-x-1.5 flex-1 min-w-0 pr-2"
                    >
                      <span className="truncate">{eq.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-sky-600 shrink-0" />}
                    </div>
                    {onDeleteEquipment && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEquipment(eq.id);
                        }}
                        title="Xóa thiết bị này"
                        className="p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-70 group-hover:opacity-100 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-2 text-xs text-slate-500 italic text-center">
                Không tìm thấy. Nhấn <kbd className="bg-slate-200 px-1 rounded font-mono text-[10px]">Enter</kbd> để tạo thiết bị mới.
              </div>
            )}
            {searchTerm && !exactMatch && filtered.length > 0 && (
              <button
                type="button"
                onClick={() => { setPendingName(searchTerm.trim()); setShowCreateDialog(true); setIsOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-sky-700 font-semibold hover:bg-sky-50 flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" />
                <span>Tạo thiết bị "{searchTerm.trim()}"</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dialog tạo thiết bị mới */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-600" />
              Tạo Thiết Bị Xử Lý Mới
            </h4>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên thiết bị / Máy xét nghiệm:</label>
              <input
                type="text"
                value={pendingName}
                onChange={(e) => setPendingName(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmCreate(); } }}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow"
              >
                Tạo Thiết Bị
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── CatalogManagerModal ──
interface CatalogManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export default function CatalogManagerModal({ 
  isOpen, 
  onClose, 
  catalog, 
  onSaveCatalog,
  testPackages,
  onSavePackages,
  testGroups = DEFAULT_TEST_GROUPS,
  onSaveTestGroups,
  equipments = DEFAULT_EQUIPMENTS,
  onSaveEquipments,
  doctorsList = [],
  onSaveDoctors
}: CatalogManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'INDICATORS' | 'PACKAGES_INDICATOR' | 'ALLERGENS' | 'PACKAGES_ALLERGEN' | 'DOCTORS'>('INDICATORS');
  
  const [items, setItems] = useState<CatalogItem[]>(catalog || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [newItem, setNewItem] = useState<{
    category: string;
    code: string;
    name: string;
    refMin: string | number;
    refMax: string | number;
    unit: string;
    refText: string;
    price?: number;
    scientific?: string;
    equipment?: string;
  }>({
    category: 'Sinh Hóa Máu',
    code: '',
    name: '',
    refMin: '',
    refMax: '',
    unit: '',
    refText: '',
    equipment: ''
  });

  const [packages, setPackages] = useState<TestPackage[]>(testPackages || INITIAL_PACKAGES);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newPkgCodes, setNewPkgCodes] = useState<string[]>([]);

  // STATE NHÓM XÉT NGHIỆM VÀ THIẾT BỊ XỬ LÝ
  const [groups, setGroups] = useState<TestGroup[]>(testGroups);
  const [eqList, setEqList] = useState<TestEquipment[]>(equipments);

  // STATE DOCTORS CRUD
  const [doctors, setDoctors] = useState<Doctor[]>(doctorsList);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [newDoc, setNewDoc] = useState<Doctor>({ id: '', name: '', specialty: '', phone: '' });

  useEffect(() => {
    if (isOpen) {
      setItems(catalog || []);
      setPackages(testPackages || []);
      setGroups(testGroups || DEFAULT_TEST_GROUPS);
      setEqList(equipments || DEFAULT_EQUIPMENTS);
      setDoctors(doctorsList || []);
    }
  }, [isOpen, catalog, testPackages, testGroups, equipments, doctorsList]);

  if (!isOpen) return null;

  const handleCreateGroup = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (groups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) return;
    setGroups((prev) => [...prev, { id: crypto.randomUUID(), name: trimmed }]);
  };

  const handleDeleteGroup = (id: string) => {
    const check = manageCatalogUseCase.canDeleteGroup(id, groups, items);
    if (!check.canDelete) {
      if (check.message) alert(check.message);
      return;
    }

    const targetGroup = groups.find((g) => g.id === id);
    if (confirm(`Bạn có chắc chắn muốn xóa nhóm xét nghiệm "${targetGroup?.name}" khỏi hệ thống?`)) {
      setGroups((prev) => prev.filter((g) => g.id !== id));
    }
  };

  const handleCreateEquipment = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (eqList.some((e) => e.name.toLowerCase() === trimmed.toLowerCase())) return;
    setEqList((prev) => [...prev, { id: crypto.randomUUID(), name: trimmed }]);
  };

  const handleDeleteEquipment = (id: string) => {
    const check = manageCatalogUseCase.canDeleteEquipment(id, eqList, items);
    if (!check.canDelete) {
      if (check.message) alert(check.message);
      return;
    }

    const targetEq = eqList.find((e) => e.id === id);
    if (confirm(`Bạn có chắc chắn muốn xóa thiết bị xử lý "${targetEq?.name}" khỏi hệ thống?`)) {
      setEqList((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleItemChange = (code: string, field: keyof CatalogItem, value: string | number | null) => {
    setItems((prev) => prev.map((item) => {
      if (item.code === code) {
        let val = value;
        const updatedItem = { ...item, [field]: val };

        if (field === 'refMin' || field === 'refMax') {
          val = value === '' || value === null ? null : parseFloat(String(value));
          updatedItem[field] = val;
        }

        if (field === 'refMin' || field === 'refMax') {
          const min = updatedItem.refMin;
          const max = updatedItem.refMax;
          if (min !== null && min !== undefined && max !== null && max !== undefined) {
            updatedItem.refText = `${min} - ${max}`;
          } else if (max !== null && max !== undefined && (min === null || min === 0)) {
            updatedItem.refText = `< ${max}`;
          }
        }

        return updatedItem;
      }
      return item;
    }));
  };

  const handleDeleteItem = (code: string) => {
    if (confirm(`Bạn có chắc muốn xóa chỉ số ${code} khỏi danh mục?`)) {
      setItems((prev) => prev.filter((i) => i.code !== code));
      setPackages((prev) => prev.map((pkg) => ({
        ...pkg,
        codes: pkg.codes.filter((c) => c !== code)
      })));
    }
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.code.trim()) {
      alert('Vui lòng nhập Tên chỉ số và Mã chỉ số!');
      return;
    }

    if (items.some((i) => i.code.toUpperCase() === newItem.code.trim().toUpperCase())) {
      alert(`Mã chỉ số ${newItem.code} đã tồn tại! Vui lòng chọn mã khác.`);
      return;
    }

    const minVal = newItem.refMin !== '' ? parseFloat(String(newItem.refMin)) : null;
    const maxVal = newItem.refMax !== '' ? parseFloat(String(newItem.refMax)) : null;

    let computedRefText = newItem.refText.trim();
    if (!computedRefText) {
      if (minVal !== null && maxVal !== null) computedRefText = `${minVal} - ${maxVal}`;
      else if (maxVal !== null) computedRefText = `< ${maxVal}`;
      else computedRefText = 'Bình thường';
    }

    const itemToAdd: CatalogItem = {
      category: newItem.category.trim(),
      code: newItem.code.trim().toUpperCase(),
      name: newItem.name.trim(),
      refMin: minVal,
      refMax: maxVal,
      unit: newItem.unit.trim(),
      refText: computedRefText,
      price: newItem.price || 0,
      scientific: newItem.scientific,
      equipment: newItem.equipment ? newItem.equipment.trim() : undefined
    };

    setItems((prev) => [...prev, itemToAdd]);
    setIsAddingNew(false);
    setNewItem({
      category: 'Sinh Hóa Máu',
      code: '',
      name: '',
      refMin: '',
      refMax: '',
      unit: '',
      refText: '',
      equipment: ''
    });
  };

  const handleToggleCodeInNewPkg = (code: string) => {
    setNewPkgCodes((prev) => 
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) {
      alert('Vui lòng nhập tên gói xét nghiệm!');
      return;
    }
    if (newPkgCodes.length === 0) {
      alert('Vui lòng chọn ít nhất 1 chỉ số cho gói!');
      return;
    }

    const pkgToAdd: TestPackage = {
      id: `custom_${Date.now()}`,
      name: newPkgName.trim(),
      codes: newPkgCodes,
      price: parseFloat(newPkgPrice || '0')
    };

    setPackages((prev) => [...prev, pkgToAdd]);
    setIsCreatingPackage(false);
    setNewPkgName('');
    setNewPkgPrice('');
    setNewPkgCodes([]);
  };

  const handlePackagePriceChange = (pkgId: string, priceVal: string) => {
    const p = priceVal === '' ? 0 : parseFloat(priceVal);
    setPackages((prev) => prev.map((pkg) => (pkg.id === pkgId ? { ...pkg, price: p } : pkg)));
  };

  const handleDeletePackage = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa gói xét nghiệm này?')) {
      setPackages((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleToggleCodeInExistingPkg = (pkgId: string, code: string) => {
    setPackages((prev) => prev.map((pkg) => {
      if (pkg.id === pkgId) {
        const hasCode = pkg.codes.includes(code);
        return {
          ...pkg,
          codes: hasCode ? pkg.codes.filter((c) => c !== code) : [...pkg.codes, code]
        };
      }
      return pkg;
    }));
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelCatalog(file).then((newCat) => {
        setItems(newCat);
        alert(`Đã nạp ${newCat.length} chỉ số từ file Excel!`);
      }).catch((_err) => {
        alert('Lỗi đọc file Excel!');
      });
    }
  };

  const handleResetDefault = () => {
    if (confirm('Bạn có chắc muốn khôi phục danh mục và các gói mẫu mặc định ban đầu?')) {
      setItems(DEFAULT_CATALOG);
      setPackages(INITIAL_PACKAGES);
      setGroups(DEFAULT_TEST_GROUPS);
      setEqList(DEFAULT_EQUIPMENTS);
    }
  };

  const handleSaveAll = () => {
    onSaveCatalog(items);
    onSavePackages(packages);
    if (onSaveTestGroups) onSaveTestGroups(groups);
    if (onSaveEquipments) onSaveEquipments(eqList);
    if (onSaveDoctors) onSaveDoctors(doctors);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-xl max-w-6xl w-full my-4 p-5 shadow-2xl relative flex flex-col max-h-[92vh] text-slate-900">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700 border border-sky-200">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Quản Lý Danh Mục (Chỉ Số, Gói & Bác Sĩ)</h3>
              <p className="text-xs text-slate-500">Quản lý danh mục chỉ số, gói xét nghiệm và danh sách Bác sĩ chỉ định toàn hệ thống</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pt-2 flex-shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('INDICATORS')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === 'INDICATORS'
                ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4 text-sky-600" />
            <span>1. Chỉ Số Xét Nghiệm ({items.filter((i) => !i.category.includes('Dị Nguyên')).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PACKAGES_INDICATOR')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === 'PACKAGES_INDICATOR'
                ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-sky-600" />
            <span>2. Gói Xét Nghiệm Chỉ Số ({packages.filter((p) => p.id !== 'all' && !p.id.includes('di_nguyen') && !p.name.includes('Dị Nguyên') && !p.name.includes('IgE')).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ALLERGENS')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === 'ALLERGENS'
                ? 'border-red-600 text-red-700 bg-red-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4 text-red-600" />
            <span>3. Danh Mục Dị Nguyên IgE ({items.filter((i) => i.category.includes('Dị Nguyên')).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PACKAGES_ALLERGEN')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === 'PACKAGES_ALLERGEN'
                ? 'border-red-600 text-red-700 bg-red-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-red-600" />
            <span>4. Gói Dị Nguyên IgE ({packages.filter((p) => p.id !== 'all' && (p.id.includes('di_nguyen') || p.name.includes('Dị Nguyên') || p.name.includes('IgE'))).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DOCTORS')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === 'DOCTORS'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <span>5. Danh Mục Bác Sĩ ({doctors.length})</span>
          </button>
        </div>

        {/* TAB 1: BẢNG CHỈ SỐ */}
        {activeTab === 'INDICATORS' && (
          <>
            <div className="py-3 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-200 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc mã chỉ số..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-sky-600 rounded pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none font-medium"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-700 text-xs rounded px-2.5 py-1.5 focus:outline-none font-medium"
                >
                  <option value="ALL">Tất cả nhóm ({items.length})</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Chỉ Số Mới</span>
                </button>

                <button
                  onClick={() => exportSampleExcelCatalog(items)}
                  title="Xuất file Excel danh mục này"
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Excel</span>
                </button>

                <label className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nhập Excel</span>
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} />
                </label>

                <button
                  onClick={handleResetDefault}
                  title="Khôi phục danh mục mẫu ban đầu"
                  className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isAddingNew && (
              <form onSubmit={handleCreateItem} className="bg-sky-50 border border-sky-300 p-3 rounded-lg my-2 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs flex-shrink-0">
                <div>
                  <label className="block font-bold text-sky-900 mb-1">Nhóm xét nghiệm:</label>
                  <GroupSearchCombobox
                    value={newItem.category}
                    onChange={(name) => setNewItem({ ...newItem, category: name })}
                    groups={groups}
                    onCreateGroup={handleCreateGroup}
                    onDeleteGroup={handleDeleteGroup}
                    placeholder="Tìm hoặc tạo nhóm..."
                  />
                </div>
                <div>
                  <label className="block font-bold text-sky-900 mb-1">Mã chỉ số (Code):</label>
                  <input
                    type="text"
                    placeholder="GOT, URE, RBC..."
                    value={newItem.code}
                    onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-mono font-bold uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-sky-900 mb-1">Tên đầy đủ chỉ số:</label>
                  <input
                    type="text"
                    placeholder="Glucose (Đường huyết)"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-sky-900 mb-1">Thiết bị xử lý:</label>
                  <EquipmentSearchCombobox
                    value={newItem.equipment || ''}
                    onChange={(name) => setNewItem({ ...newItem, equipment: name })}
                    equipments={eqList}
                    onCreateEquipment={handleCreateEquipment}
                    onDeleteEquipment={handleDeleteEquipment}
                    placeholder="Chọn hoặc tạo máy..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-sky-900 mb-1">Đơn vị đo:</label>
                  <input
                    type="text"
                    placeholder="mmol/L, U/L, g/L..."
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-sky-900 mb-1">Giá trị Min:</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="3.9"
                    value={newItem.refMin}
                    onChange={(e) => setNewItem({ ...newItem, refMin: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-sky-900 mb-1">Giá trị Max:</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="6.4"
                    value={newItem.refMax}
                    onChange={(e) => setNewItem({ ...newItem, refMax: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-sky-900 mb-1">Trị số tham chiếu (Chữ):</label>
                  <div className="flex space-x-1">
                    <input
                      type="text"
                      placeholder="Tự động: Min - Max hoặc gõ Âm tính"
                      value={newItem.refText}
                      onChange={(e) => setNewItem({ ...newItem, refText: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded text-xs shadow"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-y-auto border border-slate-300 rounded my-2 bg-slate-50">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-200 text-slate-900 uppercase font-bold sticky top-0 z-10 border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-2.5 w-8 text-center border-r border-slate-300">STT</th>
                    <th className="py-2 px-2.5 w-28 border-r border-slate-300">Nhóm</th>
                    <th className="py-2 px-2.5 w-16 border-r border-slate-300">Mã</th>
                    <th className="py-2 px-2.5 border-r border-slate-300">Tên Chỉ Số Xét Nghiệm</th>
                    <th className="py-2 px-2.5 w-40 border-r border-slate-300">Thiết Bị Xử Lý</th>
                    <th className="py-2 px-2.5 w-16 border-r border-slate-300 text-center">Min</th>
                    <th className="py-2 px-2.5 w-16 border-r border-slate-300 text-center">Max</th>
                    <th className="py-2 px-2.5 w-24 border-r border-slate-300 text-center">Đơn Vị</th>
                    <th className="py-2 px-2.5 border-r border-slate-300 text-center">Trị Số Tham Chiếu (Chữ)</th>
                    <th className="py-2 px-2.5 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredItems.map((item, idx) => (
                    <tr key={item.code} className="hover:bg-sky-50/50">
                      <td className="py-1.5 px-2 text-center text-slate-500 font-mono border-r border-slate-200">{idx + 1}</td>
                      <td className="py-1.5 px-2 border-r border-slate-200">
                        <GroupSearchCombobox
                          value={item.category}
                          onChange={(name) => handleItemChange(item.code, 'category', name)}
                          groups={groups}
                          onCreateGroup={handleCreateGroup}
                          onDeleteGroup={handleDeleteGroup}
                          compact
                        />
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono font-bold text-sky-900">
                        {item.code}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(item.code, 'name', e.target.value)}
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-sky-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-500 rounded px-2 py-1 font-bold text-slate-900 text-xs transition-all focus:outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-200">
                        <EquipmentSearchCombobox
                          value={item.equipment || ''}
                          onChange={(name) => handleItemChange(item.code, 'equipment', name)}
                          equipments={eqList}
                          onCreateEquipment={handleCreateEquipment}
                          onDeleteEquipment={handleDeleteEquipment}
                          compact
                        />
                      </td>

                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-center">
                        <input
                          type="number"
                          step="any"
                          value={item.refMin !== null && item.refMin !== undefined ? item.refMin : ''}
                          onChange={(e) => handleItemChange(item.code, 'refMin', e.target.value)}
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-sky-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-1 text-center text-slate-800 font-semibold text-xs transition-all focus:outline-none"
                        />
                      </td>

                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-center">
                        <input
                          type="number"
                          step="any"
                          value={item.refMax !== null && item.refMax !== undefined ? item.refMax : ''}
                          onChange={(e) => handleItemChange(item.code, 'refMax', e.target.value)}
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-sky-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-1 text-center text-slate-800 font-semibold text-xs transition-all focus:outline-none"
                        />
                      </td>

                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-center">
                        <input
                          type="text"
                          value={item.unit || ''}
                          onChange={(e) => handleItemChange(item.code, 'unit', e.target.value)}
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-sky-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-1 text-center text-slate-800 font-semibold text-xs transition-all focus:outline-none"
                        />
                      </td>

                      <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-center">
                        <input
                          type="text"
                          placeholder="3.9 - 6.4 hoặc Âm tính"
                          value={item.refText || ''}
                          onChange={(e) => handleItemChange(item.code, 'refText', e.target.value)}
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-sky-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-1 text-center text-slate-900 font-semibold text-xs transition-all focus:outline-none"
                        />
                      </td>

                      <td className="py-1.5 px-2 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.code)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 2: GÓI XÉT NGHIỆM CHỈ SỐ */}
        {activeTab === 'PACKAGES_INDICATOR' && (
          <div className="flex-1 overflow-y-auto py-3 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-sky-800 uppercase tracking-wide">Danh Sách Các Gói Xét Nghiệm Chỉ Số</h4>
              <button
                onClick={() => setIsCreatingPackage(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Gói Mới</span>
              </button>
            </div>

            {isCreatingPackage && (
              <form onSubmit={handleCreatePackage} className="bg-sky-50 border border-sky-300 p-4 rounded-xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-sky-900 mb-1">Tên Gói Xét Nghiệm:</label>
                    <input
                      type="text"
                      placeholder="Gói Sinh Hóa Cơ Bản..."
                      value={newPkgName}
                      onChange={(e) => setNewPkgName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-sky-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-sky-900 mb-1">Đơn Giá Gói (VNĐ):</label>
                    <input
                      type="number"
                      placeholder="280000"
                      value={newPkgPrice}
                      onChange={(e) => setNewPkgPrice(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-sky-900 mb-1">Chọn các chỉ số thuộc gói này ({newPkgCodes.length} chỉ số):</label>
                  <div className="max-h-48 overflow-y-auto bg-white border border-slate-300 rounded p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                    {items
                      .filter((i) => !i.category.includes('Dị Nguyên'))
                      .map((item) => {
                        const isChecked = newPkgCodes.includes(item.code);
                        return (
                          <button
                            type="button"
                            key={item.code}
                            onClick={() => handleToggleCodeInNewPkg(item.code)}
                            className={`flex items-center space-x-1.5 px-2 py-1 rounded text-left text-xs transition-colors ${
                              isChecked ? 'bg-sky-100 text-sky-800 font-bold border border-sky-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-sky-600 shrink-0" /> : <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                            <span className="truncate">{item.code} - {item.name}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingPackage(false)}
                    className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow"
                  >
                    Lưu Gói Mới
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages
                .filter((p) => p.id !== 'all' && !p.id.includes('di_nguyen') && !p.name.includes('Dị Nguyên') && !p.name.includes('IgE'))
                .map((pkg) => (
                  <div key={pkg.id} className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-sm hover:shadow transition-all space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h5 className="text-xs font-extrabold text-slate-900">{pkg.name}</h5>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={pkg.price || ''}
                          onChange={(e) => handlePackagePriceChange(pkg.id, e.target.value)}
                          placeholder="Giá VNĐ"
                          className="w-24 bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-600 rounded px-2 py-0.5 text-xs text-right font-mono font-bold text-emerald-700"
                        />
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600">Các chỉ số thuộc gói ({pkg.codes.length}):</div>
                    <div className="max-h-36 overflow-y-auto bg-slate-50 rounded p-2 grid grid-cols-2 gap-1 border border-slate-100">
                      {items
                        .filter((i) => !i.category.includes('Dị Nguyên'))
                        .map((item) => {
                          const isChecked = pkg.codes.includes(item.code);
                          return (
                            <button
                              type="button"
                              key={item.code}
                              onClick={() => handleToggleCodeInExistingPkg(pkg.id, item.code)}
                              className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-left text-[11px] transition-colors ${
                                isChecked ? 'bg-sky-100 text-sky-900 font-bold border border-sky-200' : 'text-slate-500 hover:bg-slate-200/50'
                              }`}
                            >
                              {isChecked ? <CheckSquare className="w-3 h-3 text-sky-600 shrink-0" /> : <Square className="w-3 h-3 text-slate-300 shrink-0" />}
                              <span className="truncate">{item.code}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: DANH MỤC DỊ NGUYÊN IgE */}
        {activeTab === 'ALLERGENS' && (
          <>
            <div className="py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-200 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm tên dị nguyên hoặc mã (f1, d1, e5, f24...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-red-600 rounded pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none font-medium"
                  />
                </div>

                <span className="text-xs text-slate-500 font-medium">
                  Tổng số: <strong className="text-red-700 font-bold">{items.filter((i) => i.category.includes('Dị Nguyên') || i.code.startsWith('f') || i.code.startsWith('d') || i.code.startsWith('e') || i.code.startsWith('m')).length}</strong> dị nguyên
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setNewItem({
                      category: 'Dị Nguyên Thực Phẩm',
                      code: 'f90',
                      name: '',
                      refMin: 0,
                      refMax: 0.34,
                      unit: 'IU/mL',
                      refText: '< 0.35 (Độ 0)',
                      price: 120000,
                      scientific: ''
                    });
                    setIsAddingNew(true);
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Dị Nguyên Mới</span>
                </button>
              </div>
            </div>

            {isAddingNew && (
              <form onSubmit={handleCreateItem} className="bg-red-50 border border-red-300 p-3 rounded-lg my-2 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs flex-shrink-0">
                <div>
                  <label className="block font-bold text-red-900 mb-1">Nhóm dị nguyên:</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-semibold"
                  >
                    <option value="Dị Nguyên Hô Hấp">Dị Nguyên Hô Hấp (Bụi, Lông thú, Phấn hoa)</option>
                    <option value="Dị Nguyên Thực Phẩm">Dị Nguyên Thực Phẩm (Trứng, Sữa, Hải sản...)</option>
                    <option value="Dị Nguyên Côn Trùng & Khác">Dị Nguyên Côn Trùng & Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-red-900 mb-1">Mã Dị Nguyên (f1, d1, e5...):</label>
                  <input
                    type="text"
                    placeholder="ví dụ: f24"
                    value={newItem.code}
                    onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-red-900 mb-1">Tên Dị Nguyên (Tiếng Việt):</label>
                  <input
                    type="text"
                    placeholder="ví dụ: Tôm (Shrimp)"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-red-900 mb-1">Tên Khoa Học (Latin):</label>
                  <input
                    type="text"
                    placeholder="Penaeus aztecus"
                    value={newItem.scientific || ''}
                    onChange={(e) => setNewItem({ ...newItem, scientific: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 italic font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-red-900 mb-1">Thiết bị xử lý:</label>
                  <div className="flex space-x-1">
                    <EquipmentSearchCombobox
                      value={newItem.equipment || 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer'}
                      onChange={(name) => setNewItem({ ...newItem, equipment: name })}
                      equipments={eqList}
                      onCreateEquipment={handleCreateEquipment}
                      onDeleteEquipment={handleDeleteEquipment}
                      placeholder="Chọn hoặc tạo máy..."
                    />
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded text-xs shadow shrink-0"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-y-auto border border-slate-300 rounded my-2 bg-slate-50">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-red-100 text-red-950 uppercase font-bold sticky top-0 z-10 border-b border-red-300">
                  <tr>
                    <th className="py-2 px-2.5 w-8 text-center border-r border-red-200">STT</th>
                    <th className="py-2 px-2.5 w-36 border-r border-red-200">Nhóm Dị Nguyên</th>
                    <th className="py-2 px-2.5 w-16 border-r border-red-200 text-center">Mã</th>
                    <th className="py-2 px-2.5 border-r border-red-200">Tên Dị Nguyên (Tiếng Việt)</th>
                    <th className="py-2 px-2.5 border-r border-red-200">Tên Khoa Học (Latin)</th>
                    <th className="py-2 px-2.5 w-36 border-r border-red-200">Thiết Bị Xử Lý</th>
                    <th className="py-2 px-2.5 w-24 text-center">Đơn Vị</th>
                    <th className="py-2 px-2.5 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items
                    .filter((item) => item.category.includes('Dị Nguyên') || item.code.startsWith('f') || item.code.startsWith('d') || item.code.startsWith('e') || item.code.startsWith('m') || item.code.startsWith('g') || item.code.startsWith('w') || item.code.startsWith('k'))
                    .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((item, idx) => (
                      <tr key={item.code} className="hover:bg-red-50/50">
                        <td className="py-1.5 px-2 text-center text-slate-500 font-mono border-r border-slate-200">{idx + 1}</td>
                        <td className="py-1.5 px-2 border-r border-slate-200 font-semibold text-slate-700">
                          {item.category}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200 font-mono font-extrabold text-red-700 text-center">
                          {item.code}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(item.code, 'name', e.target.value)}
                            className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-500 rounded px-2 py-1 font-bold text-slate-900 text-xs transition-all focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200 italic text-slate-600">
                          <input
                            type="text"
                            value={item.scientific || item.refText || ''}
                            onChange={(e) => handleItemChange(item.code, 'scientific', e.target.value)}
                            placeholder="Tên latin..."
                            className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-500 rounded px-2 py-1 italic text-slate-800 text-xs transition-all focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200">
                          <EquipmentSearchCombobox
                            value={item.equipment || 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer'}
                            onChange={(name) => handleItemChange(item.code, 'equipment', name)}
                            equipments={eqList}
                            onCreateEquipment={handleCreateEquipment}
                            onDeleteEquipment={handleDeleteEquipment}
                            compact
                          />
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-center text-slate-600 font-semibold">
                          {item.unit || 'IU/mL'}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            onClick={() => handleDeleteItem(item.code)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 4: GÓI DỊ NGUYÊN IgE */}
        {activeTab === 'PACKAGES_ALLERGEN' && (
          <div className="flex-1 overflow-y-auto py-3 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide">Danh Sách Các Gói Dị Nguyên IgE</h4>
              <button
                onClick={() => setIsCreatingPackage(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Gói Dị Nguyên Mới</span>
              </button>
            </div>

            {isCreatingPackage && (
              <form onSubmit={handleCreatePackage} className="bg-red-50 border border-red-300 p-4 rounded-xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-red-900 mb-1">Tên Gói Dị Nguyên:</label>
                    <input
                      type="text"
                      placeholder="Gói Dị Nguyên Hô Hấp..."
                      value={newPkgName}
                      onChange={(e) => setNewPkgName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-red-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-red-900 mb-1">Đơn Giá Gói (VNĐ):</label>
                    <input
                      type="number"
                      placeholder="950000"
                      value={newPkgPrice}
                      onChange={(e) => setNewPkgPrice(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-red-900 mb-1">Chọn các dị nguyên thuộc gói ({newPkgCodes.length} dị nguyên):</label>
                  <div className="max-h-48 overflow-y-auto bg-white border border-slate-300 rounded p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                    {items
                      .filter((i) => i.category.includes('Dị Nguyên') || i.code.startsWith('f') || i.code.startsWith('d') || i.code.startsWith('e') || i.code.startsWith('m'))
                      .map((item) => {
                        const isChecked = newPkgCodes.includes(item.code);
                        return (
                          <button
                            type="button"
                            key={item.code}
                            onClick={() => handleToggleCodeInNewPkg(item.code)}
                            className={`flex items-center space-x-1.5 px-2 py-1 rounded text-left text-xs transition-colors ${
                              isChecked ? 'bg-red-100 text-red-800 font-bold border border-red-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-red-600 shrink-0" /> : <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                            <span className="truncate">{item.code} - {item.name}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingPackage(false)}
                    className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
                  >
                    Lưu Gói Dị Nguyên
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages
                .filter((p) => p.id !== 'all' && (p.id.includes('di_nguyen') || p.name.includes('Dị Nguyên') || p.name.includes('IgE')))
                .map((pkg) => (
                  <div key={pkg.id} className="border border-red-200 rounded-xl p-3.5 bg-white shadow-sm hover:shadow transition-all space-y-2">
                    <div className="flex items-center justify-between border-b border-red-100 pb-2">
                      <h5 className="text-xs font-extrabold text-red-950">{pkg.name}</h5>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={pkg.price || ''}
                          onChange={(e) => handlePackagePriceChange(pkg.id, e.target.value)}
                          placeholder="Giá VNĐ"
                          className="w-24 bg-red-50 border border-red-200 focus:bg-white focus:border-red-600 rounded px-2 py-0.5 text-xs text-right font-mono font-bold text-red-700"
                        />
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600">Dị nguyên thuộc gói ({pkg.codes.length}):</div>
                    <div className="max-h-36 overflow-y-auto bg-red-50/50 rounded p-2 grid grid-cols-3 sm:grid-cols-4 gap-1 border border-red-100">
                      {items
                        .filter((i) => i.category.includes('Dị Nguyên') || i.code.startsWith('f') || i.code.startsWith('d') || i.code.startsWith('e') || i.code.startsWith('m'))
                        .map((item) => {
                          const isChecked = pkg.codes.includes(item.code);
                          return (
                            <button
                              type="button"
                              key={item.code}
                              onClick={() => handleToggleCodeInExistingPkg(pkg.id, item.code)}
                              className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-left text-[11px] transition-colors ${
                                isChecked ? 'bg-red-100 text-red-900 font-bold border border-red-200' : 'text-slate-500 hover:bg-slate-200/50'
                              }`}
                            >
                              {isChecked ? <CheckSquare className="w-3 h-3 text-red-600 shrink-0" /> : <Square className="w-3 h-3 text-slate-300 shrink-0" />}
                              <span className="truncate">{item.code}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 5: DANH MỤC BÁC SĨ */}
        {activeTab === 'DOCTORS' && (
          <div className="flex-1 overflow-y-auto py-3 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="relative flex-1 w-full md:w-auto">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm Bác sĩ theo Tên, Mã, Chuyên khoa..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none font-medium"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddingDoctor(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Thêm Bác Sĩ Mới</span>
              </button>
            </div>

            {isAddingDoctor && (
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-emerald-900 uppercase">Thêm Bác Sĩ Chỉ Định Mới</h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Mã Bác Sĩ:</label>
                    <input
                      type="text"
                      placeholder="BS04 (Tự sinh nếu trống)"
                      value={newDoc.id}
                      onChange={(e) => setNewDoc((prev) => ({ ...prev, id: e.target.value }))}
                      className="w-full border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Họ và Tên Bác Sĩ (*):</label>
                    <input
                      type="text"
                      placeholder="BS. CKII. Nguyễn Văn A..."
                      value={newDoc.name}
                      onChange={(e) => setNewDoc((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Chuyên Khoa / Phòng:</label>
                    <input
                      type="text"
                      placeholder="Nội khoa / Dị ứng..."
                      value={newDoc.specialty}
                      onChange={(e) => setNewDoc((prev) => ({ ...prev, specialty: e.target.value }))}
                      className="w-full border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Số Điện Thoại Liên Hệ:</label>
                    <input
                      type="text"
                      placeholder="0912 345 678..."
                      value={newDoc.phone}
                      onChange={(e) => setNewDoc((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingDoctor(false)}
                    className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newDoc.name.trim()) {
                        alert('Vui lòng nhập Tên Bác sĩ!');
                        return;
                      }
                      const docId = newDoc.id.trim() || `BS${String(doctors.length + 1).padStart(2, '0')}`;
                      setDoctors((prev) => [...prev, { ...newDoc, id: docId, name: newDoc.name.trim() }]);
                      setNewDoc({ id: '', name: '', specialty: '', phone: '' });
                      setIsAddingDoctor(false);
                    }}
                    className="px-4 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
                  >
                    Lưu Bác Sĩ
                  </button>
                </div>
              </div>
            )}

            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-900 font-bold uppercase border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center border-r border-slate-200">STT</th>
                    <th className="py-2 px-3 w-24 border-r border-slate-200 font-mono">Mã BS</th>
                    <th className="py-2 px-3 border-r border-slate-200">Họ và Tên Bác Sĩ / KTV</th>
                    <th className="py-2 px-3 border-r border-slate-200">Chuyên Khoa / Đơn Vị</th>
                    <th className="py-2 px-3 w-36 border-r border-slate-200">Số Điện Thoại</th>
                    <th className="py-2 px-3 w-12 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {doctors
                    .filter((d) => 
                      d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
                      d.id.toLowerCase().includes(doctorSearch.toLowerCase()) ||
                      (d.specialty && d.specialty.toLowerCase().includes(doctorSearch.toLowerCase()))
                    )
                    .map((doc, idx) => (
                      <tr key={doc.id || idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-center text-slate-500 font-mono border-r border-slate-200">{idx + 1}</td>
                        
                        <td className="py-1.5 px-3 border-r border-slate-200 font-mono font-bold text-emerald-800">
                          <input
                            type="text"
                            value={doc.id}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDoctors((prev) => prev.map((d, i) => (i === idx ? { ...d, id: val } : d)));
                            }}
                            className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-emerald-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-emerald-800 text-xs px-2 py-1 rounded focus:outline-none"
                          />
                        </td>

                        <td className="py-1.5 px-3 border-r border-slate-200">
                          <input
                            type="text"
                            value={doc.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDoctors((prev) => prev.map((d, i) => (i === idx ? { ...d, name: val } : d)));
                            }}
                            className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-emerald-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 font-bold text-slate-900 text-xs px-2 py-1 rounded focus:outline-none"
                          />
                        </td>

                        <td className="py-1.5 px-3 border-r border-slate-200">
                          <input
                            type="text"
                            value={doc.specialty || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDoctors((prev) => prev.map((d, i) => (i === idx ? { ...d, specialty: val } : d)));
                            }}
                            className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-emerald-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 text-slate-700 text-xs px-2 py-1 rounded focus:outline-none"
                          />
                        </td>

                        <td className="py-1.5 px-3 border-r border-slate-200">
                          <input
                            type="text"
                            value={doc.phone || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDoctors((prev) => prev.map((d, i) => (i === idx ? { ...d, phone: val } : d)));
                            }}
                            className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-emerald-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 font-mono text-slate-700 text-xs px-2 py-1 rounded focus:outline-none"
                          />
                        </td>

                        <td className="py-1.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa Bác sĩ ${doc.name}?`)) {
                                setDoctors((prev) => prev.filter((_, i) => i !== idx));
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 hover:bg-slate-100 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Modal */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            {activeTab === 'INDICATORS' ? `Tổng cộng: ${items.length} chỉ số` : `Tổng cộng: ${packages.filter((p) => p.id !== 'all').length} gói`}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveAll}
              className="flex items-center space-x-1.5 px-5 py-2 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow"
            >
              <Save className="w-4 h-4" />
              <span>LƯU TẤT CẢ THAY ĐỔI</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
