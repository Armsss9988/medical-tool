import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Save, Search, Download, Upload, RotateCcw, Layers, CheckSquare, Square, Stethoscope, UserPlus, ChevronDown, Copy } from 'lucide-react';
import { exportSampleExcelCatalog, parseExcelCatalog } from '@infra/excelService';
import { DEFAULT_CATALOG, DEFAULT_TEST_GROUPS, DEFAULT_EQUIPMENTS } from '@data/defaultCatalog';
import { CatalogItem, TestPackage, TestGroup, TestEquipment, Doctor, CATALOG_TAB, CatalogTabType } from '@domain';

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
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-1 text-slate-400 hover:text-slate-600 p-0.5"
            tabIndex={-1}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-2 text-center text-slate-400 text-xs">
                {searchTerm.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingName(searchTerm.trim());
                      setShowCreateDialog(true);
                      setIsOpen(false);
                    }}
                    className="text-sky-600 hover:underline font-bold"
                  >
                    + Tạo nhóm mới "{searchTerm.trim()}"
                  </button>
                ) : (
                  'Không có nhóm nào'
                )}
              </div>
            ) : (
              <div className="p-1 space-y-0.5">
                {filtered.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between px-2.5 py-1.5 hover:bg-sky-50 rounded cursor-pointer group"
                    onClick={() => handleSelect(g.name)}
                  >
                    <span className="text-slate-800 font-medium text-xs">{g.name}</span>
                    {onDeleteGroup && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Xóa nhóm "${g.name}"?`)) onDeleteGroup(g.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-600 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {searchTerm.trim() && !exactMatch && (
                  <div
                    className="border-t border-slate-100 px-2.5 py-1.5 hover:bg-emerald-50 rounded cursor-pointer text-emerald-700 font-bold text-xs"
                    onClick={() => {
                      setPendingName(searchTerm.trim());
                      setShowCreateDialog(true);
                      setIsOpen(false);
                    }}
                  >
                    + Tạo nhóm mới "{searchTerm.trim()}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateDialog && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm p-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Tạo Nhóm Xét Nghiệm Mới</h4>
            <input
              type="text"
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              placeholder="Tên nhóm xét nghiệm..."
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 font-bold text-xs focus:bg-white focus:border-sky-600 focus:outline-none"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="px-3 py-1 text-slate-600 font-medium text-xs hover:bg-slate-100 rounded"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={!pendingName.trim()}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded disabled:opacity-50"
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

// ── EquipmentSearchCombobox: Dropdown search thiết bị + tạo mới khi Enter ──
interface EquipmentSearchComboboxProps {
  value: string;
  onChange: (equipName: string) => void;
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
  placeholder = 'Chọn hoặc nhập máy...',
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

  const filtered = equipments.filter((eq) =>
    eq.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const exactMatch = equipments.some((eq) => eq.name.toLowerCase() === (searchTerm || '').toLowerCase());

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
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-1 text-slate-400 hover:text-slate-600 p-0.5"
            tabIndex={-1}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-2 text-center text-slate-400 text-xs">
                {searchTerm.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingName(searchTerm.trim());
                      setShowCreateDialog(true);
                      setIsOpen(false);
                    }}
                    className="text-sky-600 hover:underline font-bold"
                  >
                    + Thêm máy mới "{searchTerm.trim()}"
                  </button>
                ) : (
                  'Không có máy nào'
                )}
              </div>
            ) : (
              <div className="p-1 space-y-0.5">
                {filtered.map((eq) => (
                  <div
                    key={eq.id}
                    className="flex items-center justify-between px-2.5 py-1.5 hover:bg-sky-50 rounded cursor-pointer group"
                    onClick={() => handleSelect(eq.name)}
                  >
                    <span className="text-slate-800 font-medium text-xs">{eq.name}</span>
                    {onDeleteEquipment && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Xóa máy "${eq.name}"?`)) onDeleteEquipment(eq.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-600 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {searchTerm.trim() && !exactMatch && (
                  <div
                    className="border-t border-slate-100 px-2.5 py-1.5 hover:bg-emerald-50 rounded cursor-pointer text-emerald-700 font-bold text-xs"
                    onClick={() => {
                      setPendingName(searchTerm.trim());
                      setShowCreateDialog(true);
                      setIsOpen(false);
                    }}
                  >
                    + Thêm máy mới "{searchTerm.trim()}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateDialog && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm p-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Thêm Thiết Bị Xét Nghiệm Mới</h4>
            <input
              type="text"
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              placeholder="Tên máy xét nghiệm..."
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 font-bold text-xs focus:bg-white focus:border-sky-600 focus:outline-none"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="px-3 py-1 text-slate-600 font-medium text-xs hover:bg-slate-100 rounded"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={!pendingName.trim()}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded disabled:opacity-50"
              >
                Thêm Máy
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
}

export default function CatalogManagerModal({ 
  isOpen, 
  onClose, 
  targetTab = null,
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
  const [activeTab, setActiveTab] = useState<CatalogTabType>(CATALOG_TAB.INDICATORS);
  const [items, setItems] = useState<CatalogItem[]>(catalog);
  const [packages, setPackages] = useState<TestPackage[]>(testPackages);
  const [groups, setGroups] = useState<TestGroup[]>(testGroups);
  const [eqList, setEqList] = useState<TestEquipment[]>(equipments);
  const [docsList, setDocsList] = useState<Doctor[]>(doctorsList);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [packageSearch, setPackageSearch] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [newItem, setNewItem] = useState<CatalogItem>({
    category: 'Sinh Hóa Máu',
    code: '',
    name: '',
    refMin: null,
    refMax: null,
    unit: '',
    refText: '',
    price: 0,
    equipment: 'Máy Sinh Hóa Tự Động Mindray BS-240'
  });

  useEffect(() => {
    if (isOpen) {
      setItems(catalog);
      setPackages(testPackages);
      setGroups(testGroups);
      setEqList(equipments);
      setDocsList(doctorsList);
      if (targetTab) {
        setActiveTab(targetTab);
      }
    }
  }, [isOpen, catalog, testPackages, testGroups, equipments, doctorsList, targetTab]);

  if (!isOpen) return null;

  // Filter items: Separate Allergen items from General Indicator items
  const isAllergenItem = (item: CatalogItem) =>
    (item.category && item.category.includes('Dị Nguyên')) || item.unit === 'IU/mL';

  const isAllergenPkg = (pkg: TestPackage) =>
    pkg.id.includes('di_nguyen') || pkg.name.toLowerCase().includes('dị nguyên');

  // Indicators Tab Filter
  const indicatorItems = items.filter((i) => !isAllergenItem(i));
  const filteredIndicators = indicatorItems.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGroup = selectedGroup === 'all' || i.category === selectedGroup;
    return matchSearch && matchGroup;
  });

  // Allergens Tab Filter
  const allergenItems = items.filter(isAllergenItem);
  const filteredAllergens = allergenItems.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.scientific && i.scientific.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchGroup = selectedGroup === 'all' || i.category === selectedGroup;
    return matchSearch && matchGroup;
  });

  // Packages Filter
  const indicatorPackages = packages.filter((p) => !isAllergenPkg(p));
  const allergenPackages = packages.filter(isAllergenPkg);

  const activePackages = activeTab === 'PACKAGES_INDICATOR' ? indicatorPackages : allergenPackages;
  const currentSelectedPkg = packages.find((p) => p.id === selectedPackageId) || activePackages[0];

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

  // Item change handlers
  const handleItemChange = <K extends keyof CatalogItem>(code: string, field: K, value: CatalogItem[K]) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.code === code) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (code: string) => {
    if (confirm(`Bạn có chắc muốn xóa chỉ số [${code}] khỏi danh mục?`)) {
      setItems((prev) => prev.filter((i) => i.code !== code));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.code.trim() || !newItem.name.trim()) {
      alert('Vui lòng nhập Mã và Tên chỉ số xét nghiệm!');
      return;
    }
    if (items.some((i) => i.code.toLowerCase() === newItem.code.trim().toLowerCase())) {
      alert(`Mã chỉ số "${newItem.code}" đã tồn tại! Vui lòng chọn mã khác.`);
      return;
    }
    const created: CatalogItem = {
      ...newItem,
      code: newItem.code.trim().toUpperCase(),
      name: newItem.name.trim()
    };
    setItems((prev) => [created, ...prev]);
    setNewItem({
      category: activeTab === 'ALLERGENS' ? 'Dị Nguyên Thực Phẩm' : 'Sinh Hóa Máu',
      code: '',
      name: '',
      refMin: null,
      refMax: null,
      unit: activeTab === 'ALLERGENS' ? 'IU/mL' : '',
      refText: activeTab === 'ALLERGENS' ? '< 0.35 (Độ 0)' : '',
      price: 0,
      equipment: activeTab === 'ALLERGENS' ? 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer' : 'Máy Sinh Hóa Tự Động Mindray BS-240'
    });
  };

  // Package handlers
  const handleToggleTestInPackage = (pkgId: string, testCode: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === pkgId) {
          const has = pkg.codes.includes(testCode);
          const nextCodes = has ? pkg.codes.filter((c) => c !== testCode) : [...pkg.codes, testCode];
          return { ...pkg, codes: nextCodes };
        }
        return pkg;
      })
    );
  };

  const handleCreatePackage = () => {
    const isAlg = activeTab === 'PACKAGES_ALLERGEN';
    const name = prompt('Nhập tên gói xét nghiệm mới:');
    if (!name || !name.trim()) return;

    const newPkg: TestPackage = {
      id: `${isAlg ? 'di_nguyen_' : 'pkg_'}${Date.now()}`,
      name: name.trim(),
      codes: [],
      price: 0
    };

    setPackages((prev) => [...prev, newPkg]);
    setSelectedPackageId(newPkg.id);
  };

  const handleDuplicatePackage = (pkg: TestPackage) => {
    const copyPkg: TestPackage = {
      ...pkg,
      id: `${pkg.id}_copy_${Date.now()}`,
      name: `${pkg.name} (Bản sao)`
    };
    setPackages((prev) => [...prev, copyPkg]);
  };

  const handleDeletePackage = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa gói xét nghiệm này?')) {
      setPackages((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelCatalog(file).then((parsed) => {
        if (parsed.length > 0) {
          setItems(parsed);
          alert(`Đã nhập thành công ${parsed.length} chỉ số từ Excel!`);
        } else {
          alert('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
        }
      });
    }
  };

  const handleSaveAll = () => {
    onSaveCatalog(items);
    onSavePackages(packages);
    if (onSaveTestGroups) onSaveTestGroups(groups);
    if (onSaveEquipments) onSaveEquipments(eqList);
    if (onSaveDoctors) onSaveDoctors(docsList);
    onClose();
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
                Quản Lý Danh Mục & Gói Xét Nghiệm Toàn Diện
                <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded">
                  {items.length} Chỉ Số • {packages.length} Gói
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tự do tùy biến chỉ số, khoảng tham chiếu, đơn vị, giá tiền, thiết bị máy móc và bác sĩ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-700/20 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Toàn Bộ Thay Đổi</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 5 MAIN TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 px-4 pt-2 gap-1 text-xs font-bold shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('INDICATORS')}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-2 ${
              activeTab === 'INDICATORS'
                ? 'bg-white border-slate-200 text-sky-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>1. Danh Mục Chỉ Số Xét Nghiệm ({indicatorItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PACKAGES_INDICATOR')}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-2 ${
              activeTab === 'PACKAGES_INDICATOR'
                ? 'bg-white border-slate-200 text-sky-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Gói Xét Nghiệm Thường ({indicatorPackages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALLERGENS')}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-2 ${
              activeTab === 'ALLERGENS'
                ? 'bg-white border-slate-200 text-red-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>3. Danh Mục Dị Nguyên 91 Chỉ Số ({allergenItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PACKAGES_ALLERGEN')}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-2 ${
              activeTab === 'PACKAGES_ALLERGEN'
                ? 'bg-white border-slate-200 text-red-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. Gói Dị Nguyên Phân Nhóm ({allergenPackages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DOCTORS')}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x flex items-center gap-2 ${
              activeTab === 'DOCTORS'
                ? 'bg-white border-slate-200 text-emerald-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>5. Danh Sách Bác Sĩ & Chuyên Gia ({docsList.length})</span>
          </button>
        </div>

        {/* TAB 1: DANH MỤC CHỈ SỐ XÉT NGHIỆM */}
        {activeTab === 'INDICATORS' && (
          <div className="p-4 flex-grow overflow-y-auto flex flex-col space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 flex-grow max-w-lg">
                <div className="relative flex-grow">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên, mã xét nghiệm..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-sky-500"
                >
                  <option value="all">Tất cả nhóm ({indicatorItems.length})</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <label className="cursor-pointer px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 shadow-2xs transition flex items-center space-x-1">
                  <Upload className="w-3.5 h-3.5 text-sky-600" />
                  <span>Nhập Excel</span>
                  <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={() => exportSampleExcelCatalog(items)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 shadow-2xs transition flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xuất Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Khôi phục danh mục chỉ số về mặc định ban đầu?')) {
                      setItems(DEFAULT_CATALOG);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 shadow-2xs transition flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mặc Định</span>
                </button>
              </div>
            </div>

            {/* Form Thêm Chỉ Số Mới */}
            <form onSubmit={handleAddItem} className="bg-sky-50/60 border border-sky-200 rounded-xl p-3 text-xs space-y-2">
              <div className="font-bold text-sky-900 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-sky-600" />
                <span>Thêm Chỉ Số Xét Nghiệm Mới:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-8 gap-2">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nhóm:</label>
                  <GroupSearchCombobox
                    value={newItem.category}
                    onChange={(name) => setNewItem((prev) => ({ ...prev, category: name }))}
                    groups={groups}
                    onCreateGroup={handleCreateGroup}
                    onDeleteGroup={handleDeleteGroup}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã (Code):</label>
                  <input
                    type="text"
                    value={newItem.code}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="VD: GLU"
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 uppercase font-mono font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tên chỉ số:</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="VD: Glucose máu"
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn vị:</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, unit: e.target.value }))}
                    placeholder="mmol/L"
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá thu (đ):</label>
                  <input
                    type="number"
                    value={newItem.price || ''}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="35000"
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tham chiếu:</label>
                  <input
                    type="text"
                    value={newItem.refText}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, refText: e.target.value }))}
                    placeholder="3.9 - 6.4"
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow transition active:scale-95 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Vào Danh Mục</span>
                </button>
              </div>
            </form>

            {/* Bảng Danh Sách Chỉ Số */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex-grow">
              <div className="max-h-[480px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">STT</th>
                      <th className="p-2.5 w-24">MÃ CODE</th>
                      <th className="p-2.5 min-w-[150px]">TÊN CHỈ SỐ</th>
                      <th className="p-2.5 w-36">NHÓM XÉT NGHIỆM</th>
                      <th className="p-2.5 w-20 text-center">ĐƠN VỊ</th>
                      <th className="p-2.5 w-28 text-center">THAM CHIẾU</th>
                      <th className="p-2.5 w-28 text-right">GIÁ THU (Đ)</th>
                      <th className="p-2.5 w-40">THIẾT BỊ / MÁY</th>
                      <th className="p-2.5 w-12 text-center">XÓA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredIndicators.map((item, idx) => (
                      <tr key={item.code} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => handleItemChange(item.code, 'code', e.target.value.toUpperCase())}
                            className="w-full bg-transparent border-0 font-mono font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(item.code, 'name', e.target.value)}
                            className="w-full bg-transparent border-0 font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                          />
                        </td>
                        <td className="p-2">
                          <GroupSearchCombobox
                            value={item.category}
                            onChange={(name) => handleItemChange(item.code, 'category', name)}
                            groups={groups}
                            onCreateGroup={handleCreateGroup}
                            onDeleteGroup={handleDeleteGroup}
                            compact
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            value={item.unit || ''}
                            onChange={(e) => handleItemChange(item.code, 'unit', e.target.value)}
                            className="w-full bg-transparent border-0 text-center font-mono text-slate-700 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            value={item.refText || ''}
                            onChange={(e) => handleItemChange(item.code, 'refText', e.target.value)}
                            className="w-full bg-transparent border-0 text-center font-mono text-slate-700 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            value={item.price || ''}
                            onChange={(e) => handleItemChange(item.code, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full bg-transparent border-0 text-right font-mono font-bold text-emerald-700 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                          />
                        </td>
                        <td className="p-2">
                          <EquipmentSearchCombobox
                            value={item.equipment || 'Máy Sinh Hóa Tự Động Mindray BS-240'}
                            onChange={(name) => handleItemChange(item.code, 'equipment', name)}
                            equipments={eqList}
                            onCreateEquipment={handleCreateEquipment}
                            onDeleteEquipment={handleDeleteEquipment}
                            compact
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.code)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition"
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
          </div>
        )}

        {/* TAB 2 & TAB 4: GÓI XÉT NGHIỆM */}
        {(activeTab === 'PACKAGES_INDICATOR' || activeTab === 'PACKAGES_ALLERGEN') && (
          <div className="p-4 flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Cột Trái: Danh Sách Gói */}
            <div className="md:col-span-4 border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase">
                  {activeTab === 'PACKAGES_INDICATOR' ? 'Gói Xét Nghiệm Thường' : 'Gói Dị Nguyên'} ({activePackages.length})
                </h4>
                <button
                  type="button"
                  onClick={handleCreatePackage}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tạo Gói Mới</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {activePackages.map((pkg) => {
                  const isSelected = (currentSelectedPkg?.id || activePackages[0]?.id) === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white border-sky-500 shadow-md ring-2 ring-sky-100'
                          : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{pkg.name}</span>
                        <span className="font-mono font-bold text-xs text-emerald-700">
                          {pkg.price.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                        <span>{pkg.codes.length} chỉ số đã chọn</span>
                        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleDuplicatePackage(pkg)}
                            className="p-1 hover:text-sky-600 rounded"
                            title="Nhân bản gói"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="p-1 hover:text-red-600 rounded"
                            title="Xóa gói"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cột Phải: Tùy Chỉnh Chỉ Số Trong Gói Đang Chọn */}
            {currentSelectedPkg ? (
              <div className="md:col-span-8 border border-slate-200 rounded-xl p-4 bg-white flex flex-col space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-500">Đang chỉnh sửa:</span>
                      <input
                        type="text"
                        value={currentSelectedPkg.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPackages((prev) =>
                            prev.map((p) => (p.id === currentSelectedPkg.id ? { ...p, name: val } : p))
                          );
                        }}
                        className="font-extrabold text-sm text-slate-900 border border-slate-300 rounded px-2 py-0.5"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Mã ID: <strong className="font-mono">{currentSelectedPkg.id}</strong> • Số lượng chỉ số:{' '}
                      <strong className="text-sky-600 font-bold">{currentSelectedPkg.codes.length}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="font-bold text-xs text-slate-700">Giá gói (đ):</label>
                    <input
                      type="number"
                      value={currentSelectedPkg.price || ''}
                      onChange={(e) => {
                        const p = parseFloat(e.target.value) || 0;
                        setPackages((prev) =>
                          prev.map((pkg) => (pkg.id === currentSelectedPkg.id ? { ...pkg, price: p } : pkg))
                        );
                      }}
                      className="w-32 bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-right font-mono font-bold text-emerald-700 text-xs"
                    />
                  </div>
                </div>

                {/* Danh Sách Chỉ Số Có Thể Tick Chọn */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700">Chọn chỉ số thuộc gói này:</span>
                    <input
                      type="text"
                      value={packageSearch}
                      onChange={(e) => setPackageSearch(e.target.value)}
                      placeholder="Lọc chỉ số..."
                      className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg w-48"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[420px] overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                    {(activeTab === 'PACKAGES_INDICATOR' ? indicatorItems : allergenItems)
                      .filter(
                        (i) =>
                          i.name.toLowerCase().includes(packageSearch.toLowerCase()) ||
                          i.code.toLowerCase().includes(packageSearch.toLowerCase())
                      )
                      .map((item) => {
                        const isIncluded = currentSelectedPkg.codes.includes(item.code);
                        return (
                          <div
                            key={item.code}
                            onClick={() => handleToggleTestInPackage(currentSelectedPkg.id, item.code)}
                            className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition ${
                              isIncluded
                                ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isIncluded ? (
                              <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="truncate block">{item.name}</span>
                              <span className="font-mono text-[10px] text-slate-400 block">[{item.code}]</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-8 flex items-center justify-center text-slate-400 text-xs">
                Chưa chọn gói xét nghiệm nào
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DANH MỤC 91 DỊ NGUYÊN */}
        {activeTab === 'ALLERGENS' && (
          <div className="p-4 flex-grow overflow-y-auto flex flex-col space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-red-900 text-xs">
                  Danh Mục Panel 91 Dị Nguyên IgE Chuyên Sâu (PROTIA Smart Analyzer)
                </h4>
                <p className="text-red-700/80 text-[11px] mt-0.5">
                  Bao gồm 3 nhóm chính: Dị nguyên Thực phẩm, Dị nguyên Hô hấp, và Dị nguyên Côn trùng & Khác
                </p>
              </div>
              <span className="font-mono font-bold text-red-800 bg-red-100 border border-red-300 px-2.5 py-1 rounded-lg">
                {allergenItems.length} Dị Nguyên
              </span>
            </div>

            {/* Bảng Dị Nguyên */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex-grow">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">STT</th>
                      <th className="p-2.5 w-20">MÃ CODE</th>
                      <th className="p-2.5 min-w-[160px]">TÊN TIẾNG VIỆT</th>
                      <th className="p-2.5 min-w-[140px]">TÊN KHOA HỌC / ALLERGEN</th>
                      <th className="p-2.5 w-36">PHÂN LOẠI NHÓM</th>
                      <th className="p-2.5 w-24 text-center">ĐƠN VỊ</th>
                      <th className="p-2.5 w-32 text-center">THAM CHIẾU</th>
                      <th className="p-2.5 w-40">MÁY XỬ LÝ</th>
                      <th className="p-2.5 w-10 text-center">XÓA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredAllergens.map((item, idx) => (
                      <tr key={item.code} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-mono font-bold text-red-900">{item.code}</td>
                        <td className="p-2 font-bold text-slate-800">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(item.code, 'name', e.target.value)}
                            className="w-full bg-transparent border-0 font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-red-500 rounded px-1"
                          />
                        </td>
                        <td className="p-2 italic text-slate-600">
                          <input
                            type="text"
                            value={item.scientific || item.name}
                            onChange={(e) => handleItemChange(item.code, 'scientific', e.target.value)}
                            className="w-full bg-transparent border-0 italic text-slate-600 focus:bg-white focus:ring-1 focus:ring-red-500 rounded px-1"
                          />
                        </td>
                        <td className="p-2">
                          <GroupSearchCombobox
                            value={item.category}
                            onChange={(name) => handleItemChange(item.code, 'category', name)}
                            groups={groups}
                            onCreateGroup={handleCreateGroup}
                            onDeleteGroup={handleDeleteGroup}
                            compact
                          />
                        </td>
                        <td className="p-2 text-center font-mono text-slate-600">{item.unit || 'IU/mL'}</td>
                        <td className="p-2 text-center font-mono text-slate-600">{item.refText || '< 0.35 (Độ 0)'}</td>
                        <td className="p-2">
                          <EquipmentSearchCombobox
                            value={item.equipment || 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer'}
                            onChange={(name) => handleItemChange(item.code, 'equipment', name)}
                            equipments={eqList}
                            onCreateEquipment={handleCreateEquipment}
                            onDeleteEquipment={handleDeleteEquipment}
                            compact
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.code)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition"
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
          </div>
        )}

        {/* TAB 5: DANH SÁCH BÁC SĨ */}
        {activeTab === 'DOCTORS' && (
          <div className="p-6 flex-grow overflow-y-auto space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs">
              <div>
                <h4 className="font-extrabold text-emerald-900 text-sm">
                  Danh Sách Bác Sĩ Chỉ Định & Người Đọc Kết Quả
                </h4>
                <p className="text-emerald-700 mt-0.5">
                  Dữ liệu này sẽ xuất hiện trong dropdown chọn Bác sĩ và hiển thị trên chữ ký của Phiếu Trả Kết Quả
                </p>
              </div>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg">
                {docsList.length} Bác Sĩ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {docsList.map((doc) => (
                <div key={doc.id} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={doc.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDocsList((prev) => prev.map((d) => (d.id === doc.id ? { ...d, name: val } : d)));
                        }}
                        className="font-bold text-slate-900 text-xs border border-slate-200 rounded px-2 py-0.5"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Xóa bác sĩ ${doc.name}?`)) {
                          setDocsList((prev) => prev.filter((d) => d.id !== doc.id));
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={doc.specialty || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDocsList((prev) => prev.map((d) => (d.id === doc.id ? { ...d, specialty: val } : d)));
                    }}
                    placeholder="Chuyên khoa..."
                    className="w-full text-slate-600 text-xs border border-slate-200 rounded px-2 py-1"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const name = prompt('Nhập tên Bác sĩ mới:');
                if (name && name.trim()) {
                  setDocsList((prev) => [
                    ...prev,
                    { id: `doc-${Date.now()}`, name: name.trim(), specialty: 'Bác sĩ Đa khoa / Xét nghiệm' }
                  ]);
                }
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Bác Sĩ Mới</span>
            </button>
          </div>
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
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition active:scale-95 flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Toàn Bộ Thay Đổi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
