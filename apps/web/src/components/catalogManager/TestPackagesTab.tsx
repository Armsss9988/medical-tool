import { useState, useMemo } from 'react';
import { Plus, Trash2, Copy, CheckSquare, Square, Layers, FlaskConical, Dna, Search } from 'lucide-react';
import { CatalogItem, TestPackage, getPkgCodes } from '@domain/types';

function parseAllergenOrder(code: string): number {
  const m = code.match(/\d+/);
  return m ? parseInt(m[0], 10) : 999;
}

interface TestPackagesTabProps {
  items: CatalogItem[];
  packages: TestPackage[];
  setPackages: React.Dispatch<React.SetStateAction<TestPackage[]>>;
}

type PackageFilterType = 'all' | 'general' | 'allergen';

export default function TestPackagesTab({
  items,
  packages,
  setPackages
}: TestPackagesTabProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [packageSearch, setPackageSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [pkgFilter, setPkgFilter] = useState<PackageFilterType>('all');

  const isAllergenPkg = (pkg: TestPackage) =>
    pkg.id.includes('di_nguyen') || pkg.name.toLowerCase().includes('dị nguyên');

  const allergenPkgCount = useMemo(() => packages.filter(isAllergenPkg).length, [packages]);
  const generalPkgCount = useMemo(() => packages.filter((p) => !isAllergenPkg(p)).length, [packages]);

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

  const handleToggleTestInPackage = (pkgId: string, testCode: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === pkgId) {
          const currentCodes = getPkgCodes(pkg);
          const has = currentCodes.includes(testCode);
          const nextItems = has
            ? pkg.items.filter((i) => i.code !== testCode)
            : [...pkg.items, { code: testCode, equipmentId: null }];
          return { ...pkg, items: nextItems };
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
          i.name.toLowerCase().includes(testSearch.toLowerCase()) ||
          i.code.toLowerCase().includes(testSearch.toLowerCase()) ||
          (i.category && i.category.toLowerCase().includes(testSearch.toLowerCase()))
      )
      .map((i) => i.code);

    const merged = Array.from(new Set([...getPkgCodes(currentSelectedPkg), ...filteredCodes]));
    setPackages((prev) =>
      prev.map((p) => (p.id === currentSelectedPkg.id ? { ...p, items: merged.map((c) => ({ code: c, equipmentId: p.items.find((i) => i.code === c)?.equipmentId ?? null })) } : p))
    );
  };

  const handleDeselectAllFiltered = () => {
    if (!currentSelectedPkg) return;
    const filteredCodesSet = new Set(
      items
        .filter(
          (i) =>
            i.name.toLowerCase().includes(testSearch.toLowerCase()) ||
            i.code.toLowerCase().includes(testSearch.toLowerCase()) ||
            (i.category && i.category.toLowerCase().includes(testSearch.toLowerCase()))
        )
        .map((i) => i.code)
    );

    const remaining = getPkgCodes(currentSelectedPkg).filter((c) => !filteredCodesSet.has(c));
    setPackages((prev) =>
      prev.map((p) => (p.id === currentSelectedPkg.id ? { ...p, items: remaining.map((c) => ({ code: c, equipmentId: p.items.find((i) => i.code === c)?.equipmentId ?? null })) } : p))
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
                  className="w-full font-extrabold text-sm text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500"
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
                  className="w-36 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-right font-mono font-bold text-emerald-700 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Danh Sách Chỉ Số Có Thể Tick Chọn */}
            <div className="space-y-2 flex-grow flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-xs text-slate-700">
                  Chọn chỉ số thuộc gói ({getPkgCodes(currentSelectedPkg).length} đã chọn):
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    placeholder="Lọc chỉ số..."
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-40 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
                  >
                    Chọn hết
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllFiltered}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[420px] overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
                {items
                  .filter(
                    (i) =>
                      i.name.toLowerCase().includes(testSearch.toLowerCase()) ||
                      i.code.toLowerCase().includes(testSearch.toLowerCase()) ||
                      (i.category && i.category.toLowerCase().includes(testSearch.toLowerCase()))
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
                    return (
                      <div
                        key={item.code}
                        onClick={() => handleToggleTestInPackage(currentSelectedPkg.id, item.code)}
                        className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition ${
                          isIncluded
                            ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
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
                    );
                  })}
              </div>
            </div>
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
