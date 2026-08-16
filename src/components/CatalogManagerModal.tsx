import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Save, Search, Download, Upload, RotateCcw, Edit3, Layers, CheckSquare, Square, Stethoscope, UserPlus, ChevronDown, Check, Copy, Tag } from 'lucide-react';
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
                        <Trash2 className="w-3.5 h-3.5" />
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
                        <Trash2 className="w-3.5 h-3.5" />
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

// ── PackageEditorModal: Master-Detail 2-column editor for Packages ──
interface PackageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: TestPackage | null;
  catalogItems: CatalogItem[];
  isAllergenMode?: boolean;
  onSave: (pkg: TestPackage) => void;
}

function PackageEditorModal({
  isOpen,
  onClose,
  packageData,
  catalogItems,
  isAllergenMode = false,
  onSave
}: PackageEditorModalProps) {
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState<string>('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SELECTED' | 'UNSELECTED'>('ALL');

  useEffect(() => {
    if (isOpen) {
      if (packageData) {
        setPkgName(packageData.name || '');
        setPkgPrice(packageData.price !== undefined && packageData.price !== null ? String(packageData.price) : '');
        setSelectedCodes(packageData.codes || []);
      } else {
        setPkgName('');
        setPkgPrice('');
        setSelectedCodes([]);
      }
      setSearchQuery('');
      setSelectedCategory('ALL');
      setStatusFilter('ALL');
    }
  }, [isOpen, packageData]);

  if (!isOpen) return null;

  // Filter relevant base catalog
  const relevantItems = catalogItems.filter((i) =>
    isAllergenMode
      ? i.category.includes('Dị Nguyên') || i.code.startsWith('f') || i.code.startsWith('d') || i.code.startsWith('e') || i.code.startsWith('m')
      : !i.category.includes('Dị Nguyên')
  );

  // Extract list of categories
  const categories = ['ALL', ...Array.from(new Set(relevantItems.map((i) => i.category).filter(Boolean)))];

  // Filtered items based on category, status, and search query
  const filteredItems = relevantItems.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    
    const isSelected = selectedCodes.includes(item.code);
    if (statusFilter === 'SELECTED' && !isSelected) return false;
    if (statusFilter === 'UNSELECTED' && isSelected) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = item.code.toLowerCase().includes(q);
      const matchName = item.name.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchSci = item.scientific?.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchCat && !matchSci) return false;
    }
    return true;
  });

  const handleToggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectAllFiltered = () => {
    const codesToAdd = filteredItems.map((i) => i.code);
    setSelectedCodes((prev) => Array.from(new Set([...prev, ...codesToAdd])));
  };

  const handleDeselectAllFiltered = () => {
    const codesToRemove = new Set(filteredItems.map((i) => i.code));
    setSelectedCodes((prev) => prev.filter((c) => !codesToRemove.has(c)));
  };

  const handleRemoveCode = (code: string) => {
    setSelectedCodes((prev) => prev.filter((c) => !c || c !== code));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) {
      alert('Vui lòng nhập tên gói xét nghiệm!');
      return;
    }
    if (selectedCodes.length === 0) {
      alert('Vui lòng chọn ít nhất 1 chỉ số cho gói!');
      return;
    }

    const savedPkg: TestPackage = {
      id: packageData?.id || (isAllergenMode ? `pkg_di_nguyen_${Date.now()}` : `pkg_custom_${Date.now()}`),
      name: pkgName.trim(),
      codes: selectedCodes,
      price: parseFloat(pkgPrice || '0')
    };

    onSave(savedPkg);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 md:p-6 overflow-hidden">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${isAllergenMode ? 'border-red-200 bg-red-50/80' : 'border-sky-200 bg-sky-50/80'} flex-shrink-0`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${isAllergenMode ? 'bg-red-600 text-white shadow-red-200' : 'bg-sky-600 text-white shadow-sky-200'} shadow-md`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-extrabold ${isAllergenMode ? 'text-red-950' : 'text-sky-950'}`}>
                {packageData ? `Chỉnh Sửa ${isAllergenMode ? 'Gói Dị Nguyên' : 'Gói Xét Nghiệm'}` : `Tạo Mới ${isAllergenMode ? 'Gói Dị Nguyên' : 'Gói Xét Nghiệm'}`}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tìm kiếm, lọc danh mục theo nhóm và chọn các chỉ số thuộc gói xét nghiệm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: 2 Columns */}
        <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* CỘT TRÁI (35%): Thông tin gói + Danh sách đã chọn */}
          <div className="lg:col-span-5 xl:col-span-4 border-r border-slate-200 bg-slate-50/70 p-4 flex flex-col overflow-hidden space-y-3.5">
            {/* Input Tên gói */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Tên Gói Xét Nghiệm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pkgName}
                onChange={(e) => setPkgName(e.target.value)}
                placeholder={isAllergenMode ? "Gói Dị Nguyên Hô Hấp..." : "Gói Sinh Hóa Cơ Bản..."}
                className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none shadow-sm"
                required
              />
            </div>

            {/* Input Giá gói tự điền */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Đơn Giá Gói (VNĐ) <span className="text-slate-400 font-normal">(tự điền)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={pkgPrice}
                  onChange={(e) => setPkgPrice(e.target.value)}
                  placeholder="280000"
                  className="w-full bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded-lg pl-3 pr-10 py-2 text-xs font-mono font-bold text-emerald-700 placeholder:text-slate-400 focus:outline-none shadow-sm"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">VNĐ</span>
              </div>
            </div>

            {/* Header Danh sách đã chọn */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Chỉ số trong gói</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${selectedCodes.length > 0 ? (isAllergenMode ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700') : 'bg-slate-200 text-slate-600'}`}>
                  {selectedCodes.length}
                </span>
              </span>
              {selectedCodes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCodes([])}
                  className="text-[11px] text-red-600 hover:text-red-800 hover:underline font-semibold"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Danh sách cuộn các chỉ số đã chọn */}
            <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-xl p-2 divide-y divide-slate-100 shadow-inner">
              {selectedCodes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <Square className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
                  <p className="text-xs font-medium">Chưa có chỉ số nào trong gói.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Chọn chỉ số từ kho bên phải để thêm vào gói.</p>
                </div>
              ) : (
                selectedCodes.map((code, index) => {
                  const item = catalogItems.find((i) => i.code === code);
                  return (
                    <div
                      key={code}
                      className="py-1.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg group transition-colors"
                    >
                      <div className="flex items-center space-x-2 min-w-0 pr-2">
                        <span className="text-[11px] font-mono text-slate-400 w-4 text-right shrink-0">{index + 1}.</span>
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 ${isAllergenMode ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-sky-50 text-sky-700 border border-sky-200'}`}>
                          {code}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={item?.name || code}>
                            {item?.name || code}
                          </p>
                          {item?.category && (
                            <p className="text-[10px] text-slate-400 truncate">{item.category}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCode(code)}
                        className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-70 group-hover:opacity-100 shrink-0"
                        title="Xóa khỏi gói"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg ${isAllergenMode ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-sky-600 hover:bg-sky-700 shadow-sky-200'} text-white text-xs font-bold shadow-md transition-all`}
              >
                <Save className="w-4 h-4" />
                <span>Lưu Gói Xét Nghiệm</span>
              </button>
            </div>
          </div>

          {/* CỘT PHẢI (65%): Kho danh mục chỉ số để chọn */}
          <div className="lg:col-span-7 xl:col-span-8 p-4 flex flex-col overflow-hidden space-y-3 bg-white">
            
            {/* Toolbar: Tìm kiếm + Lọc trạng thái */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {/* Live Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={isAllergenMode ? "Tìm tên dị nguyên hoặc mã (f1, d1, tôm, mạt bụi...)" : "Tìm chỉ số theo tên hoặc mã (GLU, URE, men gan, mỡ máu...)"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-500 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 font-medium focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Status Pills */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-stretch sm:self-auto shrink-0 text-[11px] font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'}`}
                >
                  Tất cả ({relevantItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('SELECTED')}
                  className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'SELECTED' ? (isAllergenMode ? 'bg-red-600 text-white shadow-sm' : 'bg-sky-600 text-white shadow-sm') : 'hover:text-slate-900'}`}
                >
                  Đã chọn ({relevantItems.filter(i => selectedCodes.includes(i.code)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('UNSELECTED')}
                  className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'UNSELECTED' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'}`}
                >
                  Chưa chọn
                </button>
              </div>
            </div>

            {/* Category Filter Pills (Horizontal Scroll) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-shrink-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Nhóm:</span>
              {categories.map((cat) => {
                const count = cat === 'ALL' ? relevantItems.length : relevantItems.filter((i) => i.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                      isSelected
                        ? (isAllergenMode ? 'bg-red-100 text-red-800 border-red-300 font-bold shadow-sm' : 'bg-sky-100 text-sky-800 border-sky-300 font-bold shadow-sm')
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'Tất cả nhóm' : cat}
                    <span className={`ml-1.5 text-[10px] opacity-75 font-mono`}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Batch actions bar */}
            <div className="flex items-center justify-between py-1 px-1 bg-slate-50 rounded-lg border border-slate-200 text-xs flex-shrink-0">
              <span className="text-slate-500 font-medium pl-1 text-[11px]">
                Hiển thị <strong className="text-slate-800 font-bold">{filteredItems.length}</strong> chỉ số
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold ${isAllergenMode ? 'text-red-700 hover:bg-red-100' : 'text-sky-700 hover:bg-sky-100'} transition-colors`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Chọn tất cả đang lọc</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAllFiltered}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Bỏ chọn nhóm đang lọc</span>
                </button>
              </div>
            </div>

            {/* List / Grid of indicators */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-2 grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-50/30 shadow-inner">
              {filteredItems.length === 0 ? (
                <div className="col-span-full h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <Search className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">Không tìm thấy chỉ số phù hợp</p>
                  <p className="text-[11px] text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc chọn nhóm khác.</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isChecked = selectedCodes.includes(item.code);
                  return (
                    <div
                      key={item.code}
                      onClick={() => handleToggleCode(item.code)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start space-x-2.5 select-none ${
                        isChecked
                          ? (isAllergenMode ? 'bg-red-50/90 border-red-300 shadow-sm text-red-950' : 'bg-sky-50/90 border-sky-300 shadow-sm text-sky-950')
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckSquare className={`w-4 h-4 ${isAllergenMode ? 'text-red-600' : 'text-sky-600'}`} />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5 mb-0.5">
                          <span className={`px-1.5 py-0.2 rounded font-mono font-extrabold text-[11px] shrink-0 ${
                            isChecked
                              ? (isAllergenMode ? 'bg-red-600 text-white' : 'bg-sky-600 text-white')
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {item.code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate">
                            {item.category}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold leading-snug line-clamp-1">
                          {item.name}
                        </h5>
                        {item.scientific && (
                          <p className="text-[10px] text-slate-500 italic truncate font-sans">
                            {item.scientific}
                          </p>
                        )}
                        {item.unit && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Đơn vị: <span className="font-mono font-medium">{item.unit}</span> {item.refText ? `• ${item.refText}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </form>

      </div>
    </div>
  );
}

// ── CatalogManagerModal ──
export type CatalogTabType = 'INDICATORS' | 'PACKAGES_INDICATOR' | 'ALLERGENS' | 'PACKAGES_ALLERGEN' | 'DOCTORS';

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
  const [activeTab, setActiveTab] = useState<CatalogTabType>('INDICATORS');
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Khi modal vừa được mở lên:
      // Nếu có targetTab đặc thù được yêu cầu (ví dụ: 'DOCTORS' khi click + Thêm BS), chuyển sang tab đó
      if (targetTab) {
        setActiveTab(targetTab);
      }
      // Nếu mở bình thường (targetTab là null/undefined), GIỮ NGUYÊN activeTab mà người dùng đang mở trước đó
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, targetTab]);
  
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
  const [isPackageEditorOpen, setIsPackageEditorOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TestPackage | null>(null);
  const [isAllergenPackageMode, setIsAllergenPackageMode] = useState(false);
  const [pkgSearchTerm, setPkgSearchTerm] = useState('');
  const [allergenPkgSearchTerm, setAllergenPkgSearchTerm] = useState('');

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

  const handleOpenCreatePackage = (isAllergen: boolean = false) => {
    setEditingPackage(null);
    setIsAllergenPackageMode(isAllergen);
    setIsPackageEditorOpen(true);
  };

  const handleOpenEditPackage = (pkg: TestPackage, isAllergen: boolean = false) => {
    setEditingPackage(pkg);
    setIsAllergenPackageMode(isAllergen);
    setIsPackageEditorOpen(true);
  };

  const handleSavePackageFromEditor = (savedPkg: TestPackage) => {
    setPackages((prev) => {
      const exists = prev.some((p) => p.id === savedPkg.id);
      if (exists) {
        return prev.map((p) => (p.id === savedPkg.id ? savedPkg : p));
      }
      return [...prev, savedPkg];
    });
    setIsPackageEditorOpen(false);
    setEditingPackage(null);
  };

  const handleDuplicatePackage = (pkg: TestPackage) => {
    const copyPkg: TestPackage = {
      id: `${pkg.id}_copy_${Date.now()}`,
      name: `${pkg.name} (Bản sao)`,
      codes: [...pkg.codes],
      price: pkg.price
    };
    setPackages((prev) => [...prev, copyPkg]);
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
            <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-slate-200 gap-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm gói xét nghiệm..."
                    value={pkgSearchTerm}
                    onChange={(e) => setPkgSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-sky-600 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-900 focus:outline-none font-medium"
                  />
                  {pkgSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setPkgSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                  Tổng: <strong className="text-sky-700 font-bold">{packages.filter((p) => p.id !== 'all' && !p.id.includes('di_nguyen') && !p.name.includes('Dị Nguyên') && !p.name.includes('IgE')).length}</strong> gói
                </span>
              </div>

              <button
                onClick={() => handleOpenCreatePackage(false)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md hover:shadow transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Gói Mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages
                .filter((p) => p.id !== 'all' && !p.id.includes('di_nguyen') && !p.name.includes('Dị Nguyên') && !p.name.includes('IgE'))
                .filter((p) => !pkgSearchTerm.trim() || p.name.toLowerCase().includes(pkgSearchTerm.toLowerCase().trim()))
                .map((pkg) => (
                  <div key={pkg.id} className="border border-slate-200 hover:border-sky-300 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 group">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <h5 className="text-sm font-extrabold text-slate-900 group-hover:text-sky-900 transition-colors">
                            {pkg.name}
                          </h5>
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            {pkg.codes.length} chỉ số trong gói
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 font-medium block">Giá trọn gói:</span>
                          <span className="text-sm font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                            {pkg.price ? `${Number(pkg.price).toLocaleString('vi-VN')} đ` : '0 đ'}
                          </span>
                        </div>
                      </div>

                      {/* Danh sách chỉ số preview tóm tắt */}
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Các chỉ số trong gói:</div>
                        <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-100">
                          {pkg.codes.map((code) => {
                            const it = items.find((i) => i.code === code);
                            return (
                              <span
                                key={code}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-white border border-slate-200 text-slate-700 shadow-2xs"
                                title={it?.name || code}
                              >
                                <strong className="font-mono text-sky-700 mr-1">{code}</strong>
                                <span className="truncate max-w-[120px]">{it?.name || ''}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleDuplicatePackage(pkg)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold text-slate-600 hover:text-sky-700 hover:bg-slate-100 transition-colors"
                        title="Tạo bản sao gói này"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Nhân bản</span>
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Xóa gói"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditPackage(pkg, false)}
                          className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 hover:border-sky-600 text-xs font-bold transition-all shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa & Chọn Chỉ Số</span>
                        </button>
                      </div>
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
                  Tổng số: <strong className="text-red-700 font-bold">{items.filter((i) => i.category.includes('Dị Nguyên') || i.code.startsWith('f') || i.code.startsWith('d') || i.code.startsWith('e') || i.code.startsWith('m') || i.code.startsWith('g') || i.code.startsWith('w') || i.code.startsWith('k')).length}</strong> dị nguyên
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
                      onChange={(name) => handleItemChange(item.code, 'equipment', name)}
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
            <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-slate-200 gap-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm gói dị nguyên..."
                    value={allergenPkgSearchTerm}
                    onChange={(e) => setAllergenPkgSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-red-600 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-900 focus:outline-none font-medium"
                  />
                  {allergenPkgSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setAllergenPkgSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                  Tổng: <strong className="text-red-700 font-bold">{packages.filter((p) => p.id !== 'all' && (p.id.includes('di_nguyen') || p.name.includes('Dị Nguyên') || p.name.includes('IgE'))).length}</strong> gói
                </span>
              </div>

              <button
                onClick={() => handleOpenCreatePackage(true)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md hover:shadow transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Gói Dị Nguyên Mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages
                .filter((p) => p.id !== 'all' && (p.id.includes('di_nguyen') || p.name.includes('Dị Nguyên') || p.name.includes('IgE')))
                .filter((p) => !allergenPkgSearchTerm.trim() || p.name.toLowerCase().includes(allergenPkgSearchTerm.toLowerCase().trim()))
                .map((pkg) => (
                  <div key={pkg.id} className="border border-red-200 hover:border-red-400 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 group">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2 border-red-100 pb-2.5 border-b">
                        <div>
                          <h5 className="text-sm font-extrabold text-slate-900 group-hover:text-red-950 transition-colors">
                            {pkg.name}
                          </h5>
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            {pkg.codes.length} dị nguyên trong gói
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 font-medium block">Giá trọn gói:</span>
                          <span className="text-sm font-mono font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-block">
                            {pkg.price ? `${Number(pkg.price).toLocaleString('vi-VN')} đ` : '0 đ'}
                          </span>
                        </div>
                      </div>

                      {/* Danh sách dị nguyên preview tóm tắt */}
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Dị nguyên trong gói:</div>
                        <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-2 bg-red-50/50 rounded-lg border border-red-100">
                          {pkg.codes.map((code) => {
                            const it = items.find((i) => i.code === code);
                            return (
                              <span
                                key={code}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-white border border-red-200 text-slate-700 shadow-2xs"
                                title={it?.name || code}
                              >
                                <strong className="font-mono text-red-700 mr-1">{code}</strong>
                                <span className="truncate max-w-[120px]">{it?.name || ''}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleDuplicatePackage(pkg)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-slate-100 transition-colors"
                        title="Tạo bản sao gói này"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Nhân bản</span>
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Xóa gói"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditPackage(pkg, true)}
                          className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 text-xs font-bold transition-all shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa & Chọn Dị Nguyên</span>
                        </button>
                      </div>
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
            {activeTab === 'INDICATORS' && `Tổng cộng: ${items.length} chỉ số xét nghiệm`}
            {activeTab === 'PACKAGES_INDICATOR' && `Tổng cộng: ${packages.filter((p) => !p.id?.startsWith('pkg-allergen') && p.id !== 'all').length} gói xét nghiệm`}
            {activeTab === 'ALLERGENS' && `Tổng cộng: ${items.filter((i) => i.category.includes('Dị Nguyên')).length} dị nguyên PROTIA`}
            {activeTab === 'PACKAGES_ALLERGEN' && `Tổng cộng: ${packages.filter((p) => p.id?.startsWith('pkg-allergen')).length} gói dị nguyên`}
            {activeTab === 'DOCTORS' && `Tổng cộng: ${doctors.length} Bác sĩ & Kỹ thuật viên`}
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

      {/* MODAL BIÊN TẬP GÓI XÉT NGHIỆM 2 CỘT */}
      <PackageEditorModal
        isOpen={isPackageEditorOpen}
        onClose={() => {
          setIsPackageEditorOpen(false);
          setEditingPackage(null);
        }}
        packageData={editingPackage}
        catalogItems={items}
        isAllergenMode={isAllergenPackageMode}
        onSave={handleSavePackageFromEditor}
      />
    </div>
  );
}
