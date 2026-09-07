import { useState, useMemo, useCallback } from 'react';
import { Trash2, Plus, ListChecks, GripVertical, ArrowDownUp, ChevronUp, ChevronDown, Search, Cpu, X, Sparkles } from 'lucide-react';
import { CatalogItem, TestPackage, TestEquipment, CatalogItemEquipmentLink, TestGroup, PackageItem, SelectedTest, ReferenceRangeItem, AllergenGradingScale, getPkgItems, getPkgCodes, normalizeTestPackage } from '@domain/types';
import { computeAutoFillValue } from '@domain/services/itemResolver';
import { isAllergenTest } from '@domain/allergenDetector';
import { PackageListSidebar } from './PackageListSidebar';
import { PackagePriceSummary } from './PackagePriceSummary';
import { PackageItemPicker } from './PackageItemPicker';

interface PackageTableProps {
  items: CatalogItem[];
  packages: TestPackage[];
  setPackages: React.Dispatch<React.SetStateAction<TestPackage[]>>;
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  referenceRanges?: ReferenceRangeItem[];
  allergenScales?: AllergenGradingScale[];
  groups?: TestGroup[];
  showToast?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function PackageTable({
  items,
  packages,
  setPackages,
  equipments = [],
  catalogItemEquipments = [],
  referenceRanges = [],
  allergenScales = [],
  groups = [],
  showToast
}: PackageTableProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [packageSearch, setPackageSearch] = useState('');
  const [pkgFilter, setPkgFilter] = useState<'all' | 'general' | 'allergen'>('all');
  const [subView, setSubView] = useState<'LIST' | 'PICKER'>('LIST');
  const [pkgItemSearch, setPkgItemSearch] = useState('');

  // Drag & drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isAllergenPkg = useCallback((pkg: TestPackage) => {
    if (pkg.id.includes('di_nguyen') || pkg.name.toLowerCase().includes('dị nguyên')) return true;
    const codes = getPkgCodes(pkg);
    return codes.some((c) => {
      const matched = items.find((i) => i.code.toLowerCase() === c.toLowerCase());
      return matched ? isAllergenTest(matched) : false;
    });
  }, [items]);

  const validPackages = useMemo(() => {
    return packages
      .filter((pkg) => pkg && pkg.id !== 'all' && !pkg.name.startsWith('---'))
      .map(normalizeTestPackage);
  }, [packages]);

  const allergenPkgCount = useMemo(() => validPackages.filter(isAllergenPkg).length, [validPackages, isAllergenPkg]);
  const generalPkgCount = useMemo(() => validPackages.filter((p) => !isAllergenPkg(p)).length, [validPackages, isAllergenPkg]);

  const filteredPackages = useMemo(() => {
    return validPackages.filter((pkg) => {
      if (pkgFilter === 'general' && isAllergenPkg(pkg)) return false;
      if (pkgFilter === 'allergen' && !isAllergenPkg(pkg)) return false;
      const term = packageSearch.trim().toLowerCase();
      return !term || pkg.name.toLowerCase().includes(term) || pkg.id.toLowerCase().includes(term);
    });
  }, [validPackages, pkgFilter, packageSearch, isAllergenPkg]);

  const currentPkg = validPackages.find((p) => p.id === selectedPackageId) || filteredPackages[0] || null;
  const currentPkgItems = useMemo(() => (currentPkg ? getPkgItems(currentPkg) : []), [currentPkg]);
  const catalogMap = useMemo(() => new Map(items.map((i) => [i.code.toUpperCase(), i])), [items]);

  // Danh sách chỉ số đã lọc theo từ khóa tìm kiếm trong gói
  const displayedPkgItems = useMemo(() => {
    const term = pkgItemSearch.trim().toLowerCase();
    if (!term) {
      return currentPkgItems.map((item, originalIndex) => ({ item, originalIndex }));
    }
    return currentPkgItems
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        const cat = catalogMap.get(item.code.toUpperCase());
        return (
          item.code.toLowerCase().includes(term) ||
          (cat?.name && cat.name.toLowerCase().includes(term)) ||
          (cat?.category && cat.category.toLowerCase().includes(term))
        );
      });
  }, [currentPkgItems, pkgItemSearch, catalogMap]);

  const handleUpdatePackageBatch = (updates: Partial<TestPackage>) => {
    if (!currentPkg) return;
    setPackages((prev) =>
      prev.map((p) => (p.id === currentPkg.id ? { ...p, ...updates } : p))
    );
  };

  const handleUpdatePackage = (field: keyof TestPackage, value: unknown) => {
    handleUpdatePackageBatch({ [field]: value });
  };

  const handleCreatePackage = () => {
    const isAllergen = pkgFilter === 'allergen';
    const name = prompt('Nhập tên gói xét nghiệm mới:', isAllergen ? 'Gói Dị Nguyên Mới' : 'Gói Xét Nghiệm Mới');
    if (!name?.trim()) return;

    const newPkg: TestPackage = {
      id: `${isAllergen ? 'di_nguyen_' : 'pkg_'}${Date.now()}`,
      name: name.trim(),
      defaultEquipmentId: null,
      items: [],
      codes: [],
      price: isAllergen ? 1400000 : 350000
    };

    setPackages((prev) => [newPkg, ...prev]);
    setSelectedPackageId(newPkg.id);
    setSubView('PICKER');
    showToast?.(`Đã tạo gói mới "${newPkg.name}"`, 'success');
  };

  const handleDuplicatePackage = (pkg: TestPackage) => {
    const dup: TestPackage = {
      ...pkg,
      id: `${pkg.id}_copy_${Date.now()}`,
      name: `${pkg.name} (Bản sao)`,
      items: getPkgItems(pkg),
      codes: getPkgCodes(pkg)
    };
    setPackages((prev) => [dup, ...prev]);
    setSelectedPackageId(dup.id);
    showToast?.(`Đã nhân bản gói "${dup.name}"`, 'info');
  };

  const handleDeletePackage = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa gói xét nghiệm này?')) {
      setPackages((prev) => prev.filter((p) => p.id !== id));
      showToast?.('Đã xóa gói xét nghiệm.', 'info');
    }
  };

  const handleToggleTest = (code: string) => {
    if (!currentPkg) return;
    const clean = code.trim().toUpperCase();
    const has = currentPkgItems.some((i) => i.code.toUpperCase() === clean);
    let next: PackageItem[];
    if (has) {
      next = currentPkgItems
        .filter((i) => i.code.toUpperCase() !== clean)
        .map((it, idx) => ({ ...it, orderIndex: idx + 1 }));
    } else {
      next = [
        ...currentPkgItems,
        {
          code: clean,
          equipmentId: currentPkg.defaultEquipmentId || null,
          orderIndex: currentPkgItems.length + 1
        }
      ];
    }
    handleUpdatePackageBatch({
      items: next,
      codes: next.map((i) => i.code)
    });
  };

  const handleAddWholeGroup = (groupName: string) => {
    if (!currentPkg) return;
    const groupTests = items.filter((i) => i.category === groupName);
    const existingSet = new Set(currentPkgItems.map((i) => i.code.toUpperCase()));
    let nextOrder = currentPkgItems.length;
    const toAdd = groupTests
      .filter((t) => !existingSet.has(t.code.toUpperCase()))
      .map((t) => ({
        code: t.code.toUpperCase(),
        equipmentId: currentPkg.defaultEquipmentId || null,
        orderIndex: ++nextOrder
      }));

    if (toAdd.length === 0) {
      showToast?.(`Tất cả chỉ số trong nhóm "${groupName}" đã có trong gói.`, 'info');
      return;
    }

    const next = [...currentPkgItems, ...toAdd];
    handleUpdatePackageBatch({
      items: next,
      codes: next.map((i) => i.code)
    });
    showToast?.(`Đã thêm ${toAdd.length} chỉ số thuộc nhóm "${groupName}" vào gói!`, 'success');
  };

  // Quick Move Up / Down handlers
  const handleMoveUp = (index: number) => {
    if (index <= 0 || index >= currentPkgItems.length) return;
    const nextItems = [...currentPkgItems];
    const temp = nextItems[index];
    nextItems[index] = nextItems[index - 1];
    nextItems[index - 1] = temp;

    const reindexed = nextItems.map((it, idx) => ({
      ...it,
      orderIndex: idx + 1
    }));

    handleUpdatePackageBatch({
      items: reindexed,
      codes: reindexed.map((i) => i.code)
    });
    showToast?.(`Đã chuyển chỉ số [${temp.code}] lên vị trí #${index}!`, 'info');
  };

  const handleMoveDown = (index: number) => {
    if (index < 0 || index >= currentPkgItems.length - 1) return;
    const nextItems = [...currentPkgItems];
    const temp = nextItems[index];
    nextItems[index] = nextItems[index + 1];
    nextItems[index + 1] = temp;

    const reindexed = nextItems.map((it, idx) => ({
      ...it,
      orderIndex: idx + 1
    }));

    handleUpdatePackageBatch({
      items: reindexed,
      codes: reindexed.map((i) => i.code)
    });
    showToast?.(`Đã chuyển chỉ số [${temp.code}] xuống vị trí #${index + 2}!`, 'info');
  };

  // Direct manual STT jump
  const handleSetCustomOrder = (fromIndex: number, newPos1Based: number) => {
    if (isNaN(newPos1Based) || newPos1Based < 1) newPos1Based = 1;
    if (newPos1Based > currentPkgItems.length) newPos1Based = currentPkgItems.length;
    const targetIndex = newPos1Based - 1;
    if (fromIndex === targetIndex) return;

    const nextItems = [...currentPkgItems];
    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(targetIndex, 0, movedItem);

    const reindexed = nextItems.map((it, idx) => ({
      ...it,
      orderIndex: idx + 1
    }));

    handleUpdatePackageBatch({
      items: reindexed,
      codes: reindexed.map((i) => i.code)
    });
    showToast?.(`Đã chuyển chỉ số [${movedItem.code}] sang STT #${newPos1Based}!`, 'success');
  };

  // Gán thiết bị đo hàng loạt cho toàn bộ chỉ số trong gói (hoặc các chỉ số đang lọc)
  const handleBatchAssignEquipment = (equipmentId: string | null) => {
    if (!currentPkg || currentPkgItems.length === 0) return;
    const isFiltered = Boolean(pkgItemSearch.trim() && displayedPkgItems.length < currentPkgItems.length);
    const targetItems = isFiltered ? displayedPkgItems.map((d) => d.item) : currentPkgItems;
    const targetCodes = new Set(targetItems.map((t) => t.code));

    const eqName = equipmentId
      ? (equipments.find((e) => e.id === equipmentId)?.name || equipmentId)
      : 'Mặc định (theo từng chỉ số)';

    const scopeDesc = isFiltered
      ? `${targetItems.length} chỉ số đang hiển thị (lọc)`
      : `toàn bộ ${currentPkgItems.length} chỉ số trong gói`;

    if (!confirm(`Bạn có chắc muốn đổi máy đo của ${scopeDesc} sang "${eqName}"?`)) {
      return;
    }

    const nextItems = currentPkgItems.map((it) => {
      if (targetCodes.has(it.code)) {
        return { ...it, equipmentId };
      }
      return it;
    });

    handleUpdatePackageBatch({
      items: nextItems,
      codes: nextItems.map((i) => i.code)
    });

    showToast?.(`Đã gán máy đo "${eqName}" cho ${targetItems.length} chỉ số!`, 'success');
  };

  // Điền mẫu kết quả bình thường chuẩn cho toàn bộ chỉ số trong gói
  const handleBatchAutoFillNormal = () => {
    if (!currentPkg || currentPkgItems.length === 0) return;
    const isFiltered = Boolean(pkgItemSearch.trim() && displayedPkgItems.length < currentPkgItems.length);
    const targetItems = isFiltered ? displayedPkgItems.map((d) => d.item) : currentPkgItems;
    const targetCodes = new Set(targetItems.map((t) => t.code));

    const nextItems = currentPkgItems.map((pi) => {
      if (!targetCodes.has(pi.code)) return pi;
      const catItem = catalogMap.get(pi.code.toUpperCase());
      if (!catItem) return pi;

      const testObj: SelectedTest = {
        ...catItem,
        equipmentId: pi.equipmentId || null,
        result: '',
        note: ''
      };

      const autoVal = computeAutoFillValue(testObj, {
        equipmentId: pi.equipmentId || undefined,
        catalogItemEquipments,
        referenceRanges,
        allergenScales,
        equipments
      });

      return {
        ...pi,
        defaultValue: autoVal.result,
        hasDefaultValue: true
      };
    });

    handleUpdatePackageBatch({
      items: nextItems,
      codes: nextItems.map((i) => i.code)
    });

    showToast?.(`Đã tự động điền mẫu KQ chuẩn cho ${targetItems.length} chỉ số trong gói!`, 'success');
  };

  // Bật / tắt tất cả tùy chọn kết quả mặc định trong gói
  const handleToggleAllDefaultValues = () => {
    if (!currentPkg || currentPkgItems.length === 0) return;
    const allChecked = currentPkgItems.every((i) => i.hasDefaultValue);
    const targetChecked = !allChecked;

    const nextItems = currentPkgItems.map((pi) => ({
      ...pi,
      hasDefaultValue: targetChecked
    }));

    handleUpdatePackageBatch({
      items: nextItems,
      codes: nextItems.map((i) => i.code)
    });

    showToast?.(
      targetChecked
        ? `Đã bật áp dụng KQ mặc định cho ${currentPkgItems.length} chỉ số!`
        : `Đã tắt áp dụng KQ mặc định cho toàn bộ chỉ số trong gói.`,
      'info'
    );
  };

  const handleSelectPackage = (id: string) => {
    setSelectedPackageId(id);
    setPkgItemSearch('');
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const nextItems = [...currentPkgItems];
    const [movedItem] = nextItems.splice(draggedIndex, 1);
    nextItems.splice(targetIndex, 0, movedItem);

    // Chuẩn hóa lại orderIndex tuần tự: 1, 2, 3...
    const reindexed = nextItems.map((it, idx) => ({
      ...it,
      orderIndex: idx + 1
    }));

    handleUpdatePackageBatch({
      items: reindexed,
      codes: reindexed.map((i) => i.code)
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
    showToast?.(`Đã chuyển chỉ số [${movedItem.code}] sang vị trí #${targetIndex + 1}!`, 'success');
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleReindex = () => {
    const reindexed = currentPkgItems.map((it, idx) => ({
      ...it,
      orderIndex: idx + 1
    }));
    handleUpdatePackageBatch({
      items: reindexed,
      codes: reindexed.map((i) => i.code)
    });
    showToast?.('Đã chuẩn hóa thứ tự các chỉ số (1..N)!', 'info');
  };

  return (
    <div className="flex flex-1 min-h-0 bg-slate-50 overflow-hidden">
      {/* Left sidebar: Package list */}
      <PackageListSidebar
        packages={filteredPackages}
        selectedId={currentPkg?.id || ''}
        onSelect={handleSelectPackage}
        searchTerm={packageSearch}
        onSearchChange={setPackageSearch}
        filter={pkgFilter}
        onFilterChange={setPkgFilter}
        onAdd={handleCreatePackage}
        onDuplicate={handleDuplicatePackage}
        onDelete={handleDeletePackage}
        totalCount={validPackages.length}
        generalCount={generalPkgCount}
        allergenCount={allergenPkgCount}
        isAllergenPkg={isAllergenPkg}
      />

      {/* Right main area: Package editor */}
      {currentPkg ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-3 sm:p-4 space-y-3">
          {/* Header controls: Name, Price, Default Equipment */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3 shrink-0 text-xs">
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-6">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên gói xét nghiệm</label>
                <input
                  type="text"
                  value={currentPkg.name}
                  onChange={(e) => handleUpdatePackage('name', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-hidden"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Đơn giá trọn gói (VNĐ)</label>
                <input
                  type="number"
                  value={currentPkg.price}
                  onChange={(e) => handleUpdatePackage('price', Number(e.target.value) || 0)}
                  step="10000"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold text-sky-700 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-hidden"
                />
              </div>
              <div className="col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">Máy đo ưu tiên</label>
                  {currentPkg.defaultEquipmentId && currentPkgItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleBatchAssignEquipment(currentPkg.defaultEquipmentId ?? null)}
                      className="text-[10px] font-semibold text-sky-600 hover:text-sky-800 hover:underline cursor-pointer"
                      title="Gán máy đo ưu tiên này cho tất cả chỉ số trong gói"
                    >
                      Áp dụng tất cả
                    </button>
                  )}
                </div>
                <select
                  value={currentPkg.defaultEquipmentId || ''}
                  onChange={(e) => handleUpdatePackage('defaultEquipmentId', e.target.value || null)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                >
                  <option value="">-- Mặc định theo từng chỉ số --</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price comparison summary */}
            <PackagePriceSummary
              packagePrice={currentPkg.price}
              items={currentPkgItems}
              catalogItems={items}
            />
          </div>

          {/* SubView toggle & Toolbar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 shrink-0 flex-wrap gap-2">
            <div className="flex items-center space-x-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSubView('LIST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  subView === 'LIST' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Chỉ Số Trong Gói ({currentPkgItems.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSubView('PICKER')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  subView === 'PICKER' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Chỉ Số Vào Gói</span>
              </button>
            </div>

            {subView === 'LIST' && currentPkgItems.length > 0 && (
              <div className="flex items-center gap-2 text-xs flex-wrap">
                {/* Ô tìm kiếm nhanh chỉ số trong gói */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={pkgItemSearch}
                    onChange={(e) => setPkgItemSearch(e.target.value)}
                    placeholder="Tìm mã, tên chỉ số..."
                    className="pl-8 pr-7 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden w-44 sm:w-56 transition placeholder:text-slate-400"
                  />
                  {pkgItemSearch && (
                    <button
                      type="button"
                      onClick={() => setPkgItemSearch('')}
                      className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                      title="Xóa tìm kiếm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Gán máy đo hàng loạt */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-2xs">
                  <Cpu className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <select
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      handleBatchAssignEquipment(e.target.value === '__DEFAULT__' ? null : e.target.value);
                      e.target.value = '';
                    }}
                    className="text-xs bg-transparent border-none outline-hidden cursor-pointer text-slate-700 font-medium py-0.5"
                    title="Gán thiết bị đo hàng loạt cho các chỉ số trong gói"
                  >
                    <option value="" disabled>
                      ⚙️ Gán máy đo hàng loạt...
                    </option>
                    <option value="__DEFAULT__">🔄 Đặt về mặc định (theo chỉ số)</option>
                    {equipments.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name}
                      </option>
                    ))}
                  </select>
                </div>

                {currentPkgItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBatchAutoFillNormal}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-2xs"
                    title="Tự động tính và điền mẫu giá trị bình thường cho toàn bộ chỉ số trong gói"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mẫu KQ Chuẩn Cho Gói</span>
                  </button>
                )}

                {currentPkgItems.length > 1 && (
                  <button
                    type="button"
                    onClick={handleReindex}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                    title="Chuẩn hóa lại số thứ tự từ 1 đến N"
                  >
                    <ArrowDownUp className="w-3 h-3 text-sky-600" />
                    <span className="hidden md:inline">Chuẩn hóa STT (1..{currentPkgItems.length})</span>
                    <span className="md:hidden">STT 1..N</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Content area: List vs Picker */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {subView === 'PICKER' ? (
              <PackageItemPicker
                catalogItems={items}
                groups={groups}
                selectedItems={currentPkgItems}
                onToggleTest={handleToggleTest}
                onAddWholeGroup={handleAddWholeGroup}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 min-h-0 overflow-y-auto">
                {currentPkgItems.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    Gói này chưa có chỉ số nào. Nhấn <strong>"Thêm Chỉ Số Vào Gói"</strong> để chọn!
                  </div>
                ) : displayedPkgItems.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                    <p>Không tìm thấy chỉ số nào khớp với từ khóa <strong>"{pkgItemSearch}"</strong> trong gói này.</p>
                    <button
                      type="button"
                      onClick={() => setPkgItemSearch('')}
                      className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-medium cursor-pointer transition"
                    >
                      Xóa tìm kiếm
                    </button>
                  </div>
                ) : (
                  <>
                    {pkgItemSearch.trim() && (
                      <div className="px-3 py-1.5 bg-sky-50/80 border-b border-sky-100 flex items-center justify-between text-[11px] text-sky-800">
                        <span>
                          Đang hiển thị <strong>{displayedPkgItems.length}/{currentPkgItems.length}</strong> chỉ số khớp từ khóa &quot;{pkgItemSearch}&quot;.
                          <span className="text-slate-500 ml-1 italic hidden sm:inline">(Tắt tìm kiếm để kéo thả sắp xếp toàn bộ gói)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setPkgItemSearch('')}
                          className="text-sky-600 hover:text-sky-800 font-semibold underline cursor-pointer"
                        >
                          Hiện tất cả
                        </button>
                      </div>
                    )}
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100/95 backdrop-blur-xs text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px] sticky top-0 z-10">
                        <tr>
                          <th className="p-2 text-center w-14" title="Kéo thả hoặc bấm nút mũi tên để đổi thứ tự">Vị Trí</th>
                          <th className="p-2 text-center w-14" title="Thứ tự hiển thị trên phiếu (Nhập số để chuyển nhanh)">STT</th>
                          <th className="p-2.5 w-24">Mã</th>
                          <th className="p-2.5">Tên Chỉ Số</th>
                          <th className="p-2.5 w-28">Nhóm</th>
                          <th className="p-2.5 text-right w-24">Giá Lẻ</th>
                          <th className="p-2.5 w-44">Máy Đo</th>
                          <th className="p-2.5 w-52" title="Giá trị kết quả tự động điền sẵn vào form khi chọn gói">
                            <div className="flex items-center justify-between">
                              <span>KQ Mặc Định</span>
                              {currentPkgItems.length > 0 && (
                                <button
                                  type="button"
                                  onClick={handleToggleAllDefaultValues}
                                  className="text-[9.5px] font-semibold lowercase text-sky-600 hover:text-sky-800 hover:underline cursor-pointer"
                                  title="Bật / Tắt tất cả tùy chọn kết quả mặc định trong gói"
                                >
                                  {currentPkgItems.every((i) => i.hasDefaultValue) ? 'Tắt hết' : 'Bật hết'}
                                </button>
                              )}
                            </div>
                          </th>
                          <th className="p-2.5 text-center w-16">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedPkgItems.map(({ item: pi, originalIndex: idx }) => {
                          const cat = catalogMap.get(pi.code.toUpperCase());
                          const isDragging = draggedIndex === idx;
                          const isDragOver = dragOverIndex === idx && draggedIndex !== null && draggedIndex !== idx;
                          const isDragOverAbove = isDragOver && draggedIndex !== null && draggedIndex > idx;
                          const isDragOverBelow = isDragOver && draggedIndex !== null && draggedIndex < idx;

                          return (
                            <tr
                              key={pi.code}
                              draggable={!pkgItemSearch.trim()}
                              onDragStart={(e) => handleDragStart(e, idx)}
                              onDragOver={(e) => handleDragOver(e, idx)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, idx)}
                              onDragEnd={handleDragEnd}
                              className={`transition-colors duration-150 select-none ${
                                isDragging
                                  ? 'opacity-30 bg-sky-100/60 border-2 border-dashed border-sky-400'
                                  : isDragOverAbove
                                  ? 'border-t-2 border-t-sky-600 bg-sky-50/70'
                                  : isDragOverBelow
                                  ? 'border-b-2 border-b-sky-600 bg-sky-50/70'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              {/* Grip Drag Handle & Quick Up/Down Buttons */}
                              <td className="p-1.5 text-center select-none">
                                <div className="flex items-center justify-center gap-0.5">
                                  <div
                                    className={`p-1 rounded transition ${
                                      pkgItemSearch.trim()
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : 'cursor-grab active:cursor-grabbing text-slate-400 hover:text-sky-600 hover:bg-sky-50'
                                    }`}
                                    title={pkgItemSearch.trim() ? 'Tắt tìm kiếm để kéo thả đổi vị trí hàng' : 'Bấm giữ và kéo thả để đổi vị trí hàng'}
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex flex-col -space-y-1">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveUp(idx)}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      className={`p-0.5 rounded transition ${
                                        idx === 0
                                          ? 'text-slate-200 cursor-not-allowed'
                                          : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50 cursor-pointer'
                                      }`}
                                      title="Chuyển lên 1 vị trí"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === currentPkgItems.length - 1}
                                      onClick={() => handleMoveDown(idx)}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      className={`p-0.5 rounded transition ${
                                        idx === currentPkgItems.length - 1
                                          ? 'text-slate-200 cursor-not-allowed'
                                          : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50 cursor-pointer'
                                      }`}
                                      title="Chuyển xuống 1 vị trí"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* STT Input / Quick Jump */}
                              <td className="p-1.5 text-center font-mono">
                                <input
                                  type="number"
                                  min={1}
                                  max={currentPkgItems.length}
                                  defaultValue={pi.orderIndex !== undefined ? pi.orderIndex : idx + 1}
                                  key={`${pi.code}_${pi.orderIndex ?? idx + 1}`}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = parseInt((e.target as HTMLInputElement).value, 10);
                                      handleSetCustomOrder(idx, val);
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && val !== (pi.orderIndex ?? idx + 1)) {
                                      handleSetCustomOrder(idx, val);
                                    }
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="w-11 text-center font-mono font-extrabold text-[11px] text-sky-700 bg-sky-50 hover:bg-sky-100/80 focus:bg-white border border-sky-200/90 focus:border-sky-500 rounded-md py-0.5 outline-hidden transition cursor-text select-text"
                                  title="Nhập STT mới và nhấn Enter hoặc bấm ra ngoài để chuyển vị trí"
                                />
                              </td>

                              <td className="p-2.5 font-mono font-bold text-sky-600">{pi.code}</td>
                              <td className="p-2.5 font-semibold text-slate-800">{cat?.name || pi.code}</td>
                              <td className="p-2.5 text-slate-500">{cat?.category || '---'}</td>
                              <td className="p-2.5 text-right font-mono text-slate-600">
                                {(cat?.price ?? 0).toLocaleString('vi-VN')} đ
                              </td>
                              <td className="p-2.5">
                                {(() => {
                                  const itemLinks = catalogItemEquipments.filter(
                                    (cie) => ((cie.catalogCode || (cie as unknown as { catalog_code?: string }).catalog_code || '')).toUpperCase() === pi.code.toUpperCase()
                                  );
                                  const defaultLink = itemLinks.find((l) => l.isDefault) || itemLinks[0];
                                  const defaultEqObj = defaultLink ? equipments.find((e) => e.id === defaultLink.equipmentId) : null;
                                  const defaultEqLabel = defaultEqObj?.name || cat?.equipment || 'Hệ thống';

                                  return (
                                    <select
                                      value={pi.equipmentId || ''}
                                      onChange={(e) => {
                                        const next = currentPkgItems.map((it) =>
                                          it.code === pi.code ? { ...it, equipmentId: e.target.value || null } : it
                                        );
                                        handleUpdatePackage('items', next);
                                      }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      className="w-full px-2 py-1 border border-slate-300 rounded-lg text-[11px] bg-white"
                                    >
                                      <option value="">Mặc định ({defaultEqLabel})</option>
                                      {equipments.map((eq) => (
                                        <option key={eq.id} value={eq.id}>{eq.name}</option>
                                      ))}
                                    </select>
                                  );
                                })()}
                              </td>

                               {/* KQ Mặc Định (Checkbox option + Input value) */}
                               <td className="p-2" onMouseDown={(e) => e.stopPropagation()}>
                                 <div className="flex items-center gap-1.5">
                                   <input
                                     type="checkbox"
                                     checked={Boolean(pi.hasDefaultValue)}
                                     onChange={(e) => {
                                       const checked = e.target.checked;
                                       const next = currentPkgItems.map((it) =>
                                         it.code === pi.code ? { ...it, hasDefaultValue: checked } : it
                                       );
                                       handleUpdatePackage('items', next);
                                     }}
                                     className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer shrink-0"
                                     title="Tích để tự động điền giá trị này vào form khi chọn gói"
                                   />

                                   <div className="flex-1 min-w-[95px] relative">
                                     <input
                                       type="text"
                                       value={pi.defaultValue || ''}
                                       onChange={(e) => {
                                         const val = e.target.value;
                                         const next = currentPkgItems.map((it) =>
                                           it.code === pi.code
                                             ? {
                                                 ...it,
                                                 defaultValue: val,
                                                 hasDefaultValue: val.trim() !== '' ? true : it.hasDefaultValue
                                               }
                                             : it
                                         );
                                         handleUpdatePackage('items', next);
                                       }}
                                       placeholder="VD: Âm tính, 0..."
                                       className={`w-full px-2 py-1 text-xs border rounded-lg outline-hidden transition ${
                                         pi.hasDefaultValue
                                           ? 'border-sky-300 bg-sky-50/50 focus:bg-white focus:ring-1 focus:ring-sky-500 font-medium text-slate-800'
                                           : 'border-slate-200 bg-slate-50 text-slate-400 placeholder:text-slate-300 focus:bg-white'
                                       }`}
                                       title="Nhập giá trị kết quả mặc định khi chọn gói"
                                     />
                                   </div>

                                   {/* Quick helper chip for text / negative */}
                                   {cat && (cat.evaluationType === 'text' || (!cat.refMin && !cat.refMax && cat.refText)) && (
                                     <button
                                       type="button"
                                       onClick={() => {
                                         const next = currentPkgItems.map((it) =>
                                           it.code === pi.code
                                             ? { ...it, defaultValue: 'Âm tính', hasDefaultValue: true }
                                             : it
                                         );
                                         handleUpdatePackage('items', next);
                                       }}
                                       className="px-1 py-0.5 text-[9.5px] bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-700 rounded border border-slate-200 shrink-0 cursor-pointer font-sans"
                                       title="Gán nhanh 'Âm tính'"
                                     >
                                       Âm tính
                                     </button>
                                   )}
                                 </div>
                               </td>

                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTest(pi.code)}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
          Vui lòng chọn hoặc tạo gói xét nghiệm ở cột bên trái.
        </div>
      )}
    </div>
  );
}
