import { useState, useMemo, useCallback } from 'react';
import { Trash2, Plus, ListChecks } from 'lucide-react';
import { CatalogItem, TestPackage, TestEquipment, CatalogItemEquipmentLink, TestGroup, PackageItem, getPkgItems, getPkgCodes, normalizeTestPackage } from '@domain/types';
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
  groups?: TestGroup[];
  showToast?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function PackageTable({
  items,
  packages,
  setPackages,
  equipments = [],
  catalogItemEquipments: _catalogItemEquipments = [],
  groups = [],
  showToast
}: PackageTableProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [packageSearch, setPackageSearch] = useState('');
  const [pkgFilter, setPkgFilter] = useState<'all' | 'general' | 'allergen'>('all');
  const [subView, setSubView] = useState<'LIST' | 'PICKER'>('LIST');

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

  const handleUpdatePackage = (field: keyof TestPackage, value: unknown) => {
    if (!currentPkg) return;
    setPackages((prev) =>
      prev.map((p) => (p.id === currentPkg.id ? { ...p, [field]: value } : p))
    );
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
      next = currentPkgItems.filter((i) => i.code.toUpperCase() !== clean);
    } else {
      next = [...currentPkgItems, { code: clean, equipmentId: currentPkg.defaultEquipmentId || null }];
    }
    handleUpdatePackage('items', next);
    handleUpdatePackage('codes', next.map((i) => i.code));
  };

  const handleAddWholeGroup = (groupName: string) => {
    if (!currentPkg) return;
    const groupTests = items.filter((i) => i.category === groupName);
    const existingSet = new Set(currentPkgItems.map((i) => i.code.toUpperCase()));
    const toAdd = groupTests
      .filter((t) => !existingSet.has(t.code.toUpperCase()))
      .map((t) => ({ code: t.code.toUpperCase(), equipmentId: currentPkg.defaultEquipmentId || null }));

    const next = [...currentPkgItems, ...toAdd];
    handleUpdatePackage('items', next);
    handleUpdatePackage('codes', next.map((i) => i.code));
    showToast?.(`Đã thêm ${toAdd.length} chỉ số thuộc nhóm "${groupName}" vào gói!`, 'success');
  };

  return (
    <div className="flex flex-1 min-h-0 bg-slate-50 overflow-hidden">
      {/* Left sidebar: Package list */}
      <PackageListSidebar
        packages={filteredPackages}
        selectedId={currentPkg?.id || ''}
        onSelect={setSelectedPackageId}
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Máy đo ưu tiên</label>
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

          {/* SubView toggle */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 shrink-0">
            <div className="flex items-center space-x-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSubView('LIST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  subView === 'LIST' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Chỉ Số Trong Gói ({currentPkgItems.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSubView('PICKER')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  subView === 'PICKER' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Chỉ Số Vào Gói</span>
              </button>
            </div>
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
                ) : (
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100/95 backdrop-blur-xs text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px] sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 text-center w-10">#</th>
                        <th className="p-2.5 w-24">Mã</th>
                        <th className="p-2.5">Tên Chỉ Số</th>
                        <th className="p-2.5 w-28">Nhóm</th>
                        <th className="p-2.5 text-right w-24">Giá Lẻ</th>
                        <th className="p-2.5 w-44">Máy Đo</th>
                        <th className="p-2.5 text-center w-16">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentPkgItems.map((pi, idx) => {
                        const cat = catalogMap.get(pi.code.toUpperCase());
                        return (
                          <tr key={pi.code} className="hover:bg-slate-50 transition">
                            <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-sky-600">{pi.code}</td>
                            <td className="p-2.5 font-semibold text-slate-800">{cat?.name || pi.code}</td>
                            <td className="p-2.5 text-slate-500">{cat?.category || '---'}</td>
                            <td className="p-2.5 text-right font-mono text-slate-600">
                              {(cat?.price ?? 0).toLocaleString('vi-VN')} đ
                            </td>
                            <td className="p-2.5">
                              <select
                                value={pi.equipmentId || ''}
                                onChange={(e) => {
                                  const next = currentPkgItems.map((it) =>
                                    it.code === pi.code ? { ...it, equipmentId: e.target.value || null } : it
                                  );
                                  handleUpdatePackage('items', next);
                                }}
                                className="w-full px-2 py-1 border border-slate-300 rounded-lg text-[11px] bg-white"
                              >
                                <option value="">Mặc định ({cat?.equipment || 'Hệ thống'})</option>
                                {equipments.map((eq) => (
                                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleTest(pi.code)}
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
