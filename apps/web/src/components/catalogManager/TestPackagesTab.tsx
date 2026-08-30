import { useState, useMemo } from 'react';
import { Plus, Trash2, Copy, CheckSquare, Square, Layers, FlaskConical, Dna, Search, ListChecks, PlusCircle } from 'lucide-react';
import { CatalogItem, CatalogItemEquipmentLink, TestEquipment, TestPackage, PackageItem, getPkgCodes } from '@domain/types';

function parseAllergenOrder(code: string): number {
  const m = code.match(/\d+/);
  return m ? parseInt(m[0], 10) : 999;
}

interface TestPackagesTabProps {
  items: CatalogItem[];
  packages: TestPackage[];
  setPackages: React.Dispatch<React.SetStateAction<TestPackage[]>>;
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
}

type PackageFilterType = 'all' | 'general' | 'allergen';
type PackageDetailSubView = 'SELECTED_LIST' | 'ADD_MORE';

export default function TestPackagesTab({
  items,
  packages,
  setPackages,
  equipments = [],
  catalogItemEquipments = [],
}: TestPackagesTabProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [packageSearch, setPackageSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [pkgFilter, setPkgFilter] = useState<PackageFilterType>('all');
  const [detailSubView, setDetailSubView] = useState<PackageDetailSubView>('SELECTED_LIST');

  const isAllergenPkg = (pkg: TestPackage) =>
    pkg.id.includes('di_nguyen') || pkg.name.toLowerCase().includes('dị nguyên');

  const allergenPkgCount = useMemo(() => packages.filter(isAllergenPkg).length, [packages]);
  const generalPkgCount = useMemo(() => packages.filter((p) => !isAllergenPkg(p)).length, [packages]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))),
    [items]
  );

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const isAllergen = isAllergenPkg(pkg);
      if (pkgFilter === 'general' && isAllergen) return false;
      if (pkgFilter === 'allergen' && !isAllergen) return false;

      const matchSearch =
        pkg.name.toLowerCase().includes(packageSearch.toLowerCase()) ||
        pkg.id.toLowerCase().includes(packageSearch.toLowerCase());

      return matchSearch;
    });
  }, [packages, pkgFilter, packageSearch]);

  const currentSelectedPkg = packages.find((p) => p.id === selectedPackageId) || filteredPackages[0];

  // Helper lấy các thiết bị đo đã cấu hình cho 1 chỉ số
  const getEquipmentsForTestCode = (code: string) => {
    const links = catalogItemEquipments.filter((l) => l.catalogCode.toUpperCase() === code.toUpperCase());
    return links;
  };

  const handleToggleTestInPackage = (pkgId: string, testCode: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === pkgId) {
          const currentCodes = getPkgCodes(pkg);
          const has = currentCodes.includes(testCode);
          if (has) {
            const nextItems = (pkg.items || []).filter((i) => i.code !== testCode);
            return { ...pkg, items: nextItems };
          } else {
            // Tìm máy mặc định nếu có
            const links = getEquipmentsForTestCode(testCode);
            const defaultLink = links.find((l) => l.isDefault) || links[0];
            const nextItems: PackageItem[] = [
              ...(pkg.items || []),
              { code: testCode, equipmentId: defaultLink?.equipmentId || null }
            ];
            return { ...pkg, items: nextItems };
          }
        }
        return pkg;
      })
    );
  };

  const handleUpdateItemEquipmentInPackage = (pkgId: string, testCode: string, equipmentId: string | null) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === pkgId) {
          const nextItems = (pkg.items || []).map((i) =>
            i.code === testCode ? { ...i, equipmentId } : i
          );
          return { ...pkg, items: nextItems };
        }
        return pkg;
      })
    );
  };

  const handleRemoveItemFromPackage = (pkgId: string, testCode: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === pkgId) {
          return { ...pkg, items: (pkg.items || []).filter((i) => i.code !== testCode) };
        }
        return pkg;
      })
    );
  };

  const handleCreatePackage = () => {
    const isAllergenType = pkgFilter === 'allergen';
    const defaultName = isAllergenType ? 'Gói Dị Nguyên Mới' : 'Gói Xét Nghiệm Mới';
    const name = prompt('Nhập tên gói xét nghiệm mới:', defaultName);
    if (!name || !name.trim()) return;

    const newPkg: TestPackage = {
      id: `${isAllergenType ? 'di_nguyen_' : 'pkg_'}${Date.now()}`,
      name: name.trim(),
      items: [],
      price: isAllergenType ? 1400000 : 350000
    };

    setPackages((prev) => [newPkg, ...prev]);
    setSelectedPackageId(newPkg.id);
    setDetailSubView('ADD_MORE');
  };

  const handleDuplicatePackage = (pkg: TestPackage) => {
    const copyPkg: TestPackage = {
      ...pkg,
      id: `${pkg.id}_copy_${Date.now()}`,
      name: `${pkg.name} (Bản sao)`
    };
    setPackages((prev) => [copyPkg, ...prev]);
    setSelectedPackageId(copyPkg.id);
  };

  const handleDeletePackage = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa gói xét nghiệm này?')) {
      setPackages((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSelectAllFiltered = () => {
    if (!currentSelectedPkg) return;
    const filteredCodes = items
      .filter(
        (i) =>
          (selectedCategoryFilter === 'all' || i.category === selectedCategoryFilter) &&
          (i.name.toLowerCase().includes(testSearch.toLowerCase()) ||
            i.code.toLowerCase().includes(testSearch.toLowerCase()) ||
            (i.category && i.category.toLowerCase().includes(testSearch.toLowerCase())))
      )
      .map((i) => i.code);

    const existingCodes = new Set(getPkgCodes(currentSelectedPkg));
    const newItemsToAdd: PackageItem[] = filteredCodes
      .filter((c) => !existingCodes.has(c))
      .map((c) => {
        const links = getEquipmentsForTestCode(c);
        const def = links.find((l) => l.isDefault) || links[0];
        return { code: c, equipmentId: def?.equipmentId || null };
      });

    const merged = [...(currentSelectedPkg.items || []), ...newItemsToAdd];
    setPackages((prev) =>
      prev.map((p) => (p.id === currentSelectedPkg.id ? { ...p, items: merged } : p))
    );
  };

  const handleDeselectAllFiltered = () => {
    if (!currentSelectedPkg) return;
    const filteredCodesSet = new Set(
      items
        .filter(
          (i) =>
            (selectedCategoryFilter === 'all' || i.category === selectedCategoryFilter) &&
            (i.name.toLowerCase().includes(testSearch.toLowerCase()) ||
              i.code.toLowerCase().includes(testSearch.toLowerCase()) ||
              (i.category && i.category.toLowerCase().includes(testSearch.toLowerCase())))
        )
        .map((i) => i.code)
    );

    const remaining = (currentSelectedPkg.items || []).filter((i) => !filteredCodesSet.has(i.code));
    setPackages((prev) =>
      prev.map((p) => (p.id === currentSelectedPkg.id ? { ...p, items: remaining } : p))
    );
  };

  return (
    <div className="p-4 flex-grow overflow-y-auto flex flex-col space-y-3">
      {/* Toolbar lọc gói */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
        {/* Pills Filter Gói */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setPkgFilter('all')}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              pkgFilter === 'all'
                ? 'bg-white text-sky-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tất Cả Gói ({packages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setPkgFilter('general')}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              pkgFilter === 'general'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
            <span>Gói Thường ({generalPkgCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setPkgFilter('allergen')}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              pkgFilter === 'allergen'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Dna className="w-3.5 h-3.5 text-red-600" />
            <span>Gói Dị Nguyên ({allergenPkgCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreatePackage}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Gói Mới</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-grow">
        {/* Cột Trái: Danh Sách Gói */}
        <div className="md:col-span-4 border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={packageSearch}
              onChange={(e) => setPackageSearch(e.target.value)}
              placeholder="Tìm gói xét nghiệm..."
              className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredPackages.map((pkg) => {
              const isSelected = (currentSelectedPkg?.id || filteredPackages[0]?.id) === pkg.id;
              const isAllergen = isAllergenPkg(pkg);

              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? isAllergen
                        ? 'bg-red-50/50 border-red-400 shadow-md ring-2 ring-red-100'
                        : 'bg-white border-sky-500 shadow-md ring-2 ring-sky-100'
                      : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 text-xs truncate">{pkg.name}</span>
                    <span className="font-mono font-bold text-xs text-emerald-700 shrink-0">
                      {pkg.price.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                    <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                      isAllergen ? 'bg-red-100 text-red-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {isAllergen ? 'Dị Nguyên' : 'Gói Thường'} • {getPkgCodes(pkg).length} chỉ số
                    </span>

                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleDuplicatePackage(pkg)}
                        className="p-1 text-slate-400 hover:text-sky-600 rounded cursor-pointer"
                        title="Nhân bản gói"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        title="Xóa gói"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
            {/* Header Gói: Tên, Giá, Tổng Chỉ Số */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex-grow max-w-md">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">TÊN GÓI XÉT NGHIỆM:</label>
                <input
                  type="text"
                  value={currentSelectedPkg.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPackages((prev) =>
                      prev.map((p) => (p.id === currentSelectedPkg.id ? { ...p, name: val } : p))
                    );
                  }}
                  className="w-full font-extrabold text-sm text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">GIÁ GÓI (Đ):</label>
                <input
                  type="number"
                  value={currentSelectedPkg.price || ''}
                  onChange={(e) => {
                    const p = parseFloat(e.target.value) || 0;
                    setPackages((prev) =>
                      prev.map((pkg) => (pkg.id === currentSelectedPkg.id ? { ...pkg, price: p } : pkg))
                    );
                  }}
                  className="w-36 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-right font-mono font-bold text-emerald-700 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Sub-view Navigation: Danh sách đã chọn vs Thêm chỉ số */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailSubView('SELECTED_LIST')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    detailSubView === 'SELECTED_LIST'
                      ? 'bg-sky-100 text-sky-900 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>Chỉ Số Trong Gói ({(currentSelectedPkg.items || []).length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailSubView('ADD_MORE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    detailSubView === 'ADD_MORE'
                      ? 'bg-sky-100 text-sky-900 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Chọn Thêm Chỉ Số</span>
                </button>
              </div>

              {detailSubView === 'SELECTED_LIST' && (
                <button
                  type="button"
                  onClick={() => setDetailSubView('ADD_MORE')}
                  className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm chỉ số</span>
                </button>
              )}
            </div>

            {/* VIEW 1: BẢNG CHỈ SỐ ĐÃ CHỌN TRONG GÓI (KÈM CHỌN MÁY ĐO) */}
            {detailSubView === 'SELECTED_LIST' && (
              <div className="flex-grow flex flex-col space-y-2">
                {(currentSelectedPkg.items || []).length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl">
                    <p className="mb-2">Gói này chưa có chỉ số xét nghiệm nào.</p>
                    <button
                      type="button"
                      onClick={() => setDetailSubView('ADD_MORE')}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Chọn Chỉ Số Ngay</span>
                    </button>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10">
                        <tr>
                          <th className="p-2 w-8 text-center">STT</th>
                          <th className="p-2 w-20">MÃ CODE</th>
                          <th className="p-2 min-w-[150px]">TÊN CHỈ SỐ</th>
                          <th className="p-2 w-28">NHÓM</th>
                          <th className="p-2 min-w-[200px]">MÁY ĐO THỰC HIỆN TRONG GÓI</th>
                          <th className="p-2 w-8 text-center">XÓA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {(currentSelectedPkg.items || []).map((pkgItem, idx) => {
                          const itemInfo = items.find((i) => i.code.toUpperCase() === pkgItem.code.toUpperCase());
                          const availableLinks = getEquipmentsForTestCode(pkgItem.code);

                          return (
                            <tr key={pkgItem.code} className="hover:bg-slate-50/80 transition">
                              <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-2 font-mono font-bold text-sky-900">{pkgItem.code}</td>
                              <td className="p-2 font-semibold text-slate-800">
                                {itemInfo?.name || pkgItem.code}
                              </td>
                              <td className="p-2 text-slate-500 text-[11px]">
                                {itemInfo?.category || '---'}
                              </td>

                              {/* Dropdown Chọn Máy Đo Áp Dụng Cho Chỉ Số Này Trong Gói */}
                              <td className="p-2">
                                {availableLinks.length > 1 ? (
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={pkgItem.equipmentId || ''}
                                      onChange={(e) =>
                                        handleUpdateItemEquipmentInPackage(
                                          currentSelectedPkg.id,
                                          pkgItem.code,
                                          e.target.value || null
                                        )
                                      }
                                      className="bg-amber-50/70 border border-amber-300 rounded px-2 py-1 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 w-full"
                                    >
                                      <option value="">-- Mặc định ({availableLinks.find((l) => l.isDefault)?.equipmentId || 'Hệ thống'}) --</option>
                                      {availableLinks.map((link) => {
                                        const eq = equipments.find((e) => e.id === link.equipmentId);
                                        const refLabel = link.refText || (link.refMin != null || link.refMax != null
                                          ? `${link.refMin ?? '?'}-${link.refMax ?? '?'} ${link.unit || ''}`.trim()
                                          : '');
                                        return (
                                          <option key={link.id} value={link.equipmentId}>
                                            {eq?.name || link.equipmentId} {link.isDefault ? '★ (Mặc định)' : ''} {refLabel ? `[${refLabel}]` : ''}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                ) : availableLinks.length === 1 ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded border border-slate-200 text-xs">
                                      {equipments.find((e) => e.id === availableLinks[0].equipmentId)?.name || availableLinks[0].equipmentId}
                                    </span>
                                  </div>
                                ) : (
                                  <select
                                    value={pkgItem.equipmentId || ''}
                                    onChange={(e) =>
                                      handleUpdateItemEquipmentInPackage(
                                        currentSelectedPkg.id,
                                        pkgItem.code,
                                        e.target.value || null
                                      )
                                    }
                                    className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 text-xs w-full"
                                  >
                                    <option value="">-- Mặc định hệ thống --</option>
                                    {equipments.map((eq) => (
                                      <option key={eq.id} value={eq.id}>{eq.name}</option>
                                    ))}
                                  </select>
                                )}
                              </td>

                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemFromPackage(currentSelectedPkg.id, pkgItem.code)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                                  title="Xóa khỏi gói"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: LƯỚI CHỌN THÊM CHỈ SỐ VÀO GÓI */}
            {detailSubView === 'ADD_MORE' && (
              <div className="space-y-2 flex-grow flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 flex-grow max-w-md">
                    <input
                      type="text"
                      value={testSearch}
                      onChange={(e) => setTestSearch(e.target.value)}
                      placeholder="Tìm mã hoặc tên chỉ số..."
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-full bg-white focus:outline-none focus:border-sky-500"
                    />
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-700 text-xs focus:outline-none focus:border-sky-500 max-w-[140px]"
                    >
                      <option value="all">Tất cả nhóm</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded text-xs border border-sky-200 cursor-pointer"
                    >
                      Chọn tất cả đang lọc
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllFiltered}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded text-xs border border-slate-200 cursor-pointer"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[400px] overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50 flex-grow">
                  {items
                    .filter(
                      (i) =>
                        (selectedCategoryFilter === 'all' || i.category === selectedCategoryFilter) &&
                        (i.name.toLowerCase().includes(testSearch.toLowerCase()) ||
                          i.code.toLowerCase().includes(testSearch.toLowerCase()) ||
                          (i.category && i.category.toLowerCase().includes(testSearch.toLowerCase())))
                    )
                    .sort((a, b) => {
                      const isCurAllergen = isAllergenPkg(currentSelectedPkg);
                      if (isCurAllergen) {
                        const orderA = parseAllergenOrder(a.code);
                        const orderB = parseAllergenOrder(b.code);
                        return orderA - orderB;
                      }
                      return 0;
                    })
                    .map((item) => {
                      const isIncluded = getPkgCodes(currentSelectedPkg).includes(item.code);
                      const links = getEquipmentsForTestCode(item.code);

                      return (
                        <div
                          key={item.code}
                          onClick={() => handleToggleTestInPackage(currentSelectedPkg.id, item.code)}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer select-none transition ${
                            isIncluded
                              ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold shadow-2xs ring-1 ring-sky-200'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            {isIncluded ? (
                              <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="truncate block font-semibold">{item.name}</span>
                              <span className="font-mono text-[10px] text-slate-400 block">[{item.code}]</span>
                            </div>
                          </div>

                          {links.length > 1 && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-1 py-0.5 rounded shrink-0 ml-1">
                              {links.length} máy
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="md:col-span-8 flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl p-8">
            Chưa chọn gói xét nghiệm nào
          </div>
        )}
      </div>
    </div>
  );
}
