import { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Layers,
  Sparkles,
  ChevronRight,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import {
  CatalogItem,
  TestPackage,
  TestEquipment,
  CatalogItemEquipmentLink,
  PackageItemDetail,
  normalizePkgItems
} from '@domain';

interface TestPackagesTabProps {
  items: CatalogItem[];
  packages: TestPackage[];
  setPackages: (packages: TestPackage[]) => void;
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
}

export default function TestPackagesTab({
  items,
  packages,
  setPackages,
  equipments = [],
  catalogItemEquipments = []
}: TestPackagesTabProps) {
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(packages[0]?.id || null);
  const [searchItem, setSearchItem] = useState('');
  const [isAddingPkg, setIsAddingPkg] = useState(false);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState<number>(0);

  const activePackage = useMemo(() => {
    return packages.find((p) => p.id === selectedPkgId) || null;
  }, [packages, selectedPkgId]);

  const activePackageItems = useMemo(() => {
    if (!activePackage) return [];
    return normalizePkgItems(activePackage.items);
  }, [activePackage]);

  // Compute package price suggestion from sum of items
  const suggestedPrice = useMemo(() => {
    return activePackageItems.reduce((sum, it) => {
      const catItem = items.find((i) => i.code === it.code);
      return sum + (catItem?.price || 0);
    }, 0);
  }, [activePackageItems, items]);

  // Add item to active package
  const handleAddItemToPackage = (code: string) => {
    if (!selectedPkgId || !activePackage) return;
    if (activePackageItems.some((i) => i.code === code)) return;

    // Determine default equipment for this item if available
    const itemEqLinks = catalogItemEquipments.filter((l) => l.catalogCode === code);
    const defaultLink = itemEqLinks.find((l) => l.isDefault) || itemEqLinks[0];
    const defaultEqId = defaultLink?.equipmentId || null;

    const newItem: PackageItemDetail = { code, equipmentId: defaultEqId };
    const updatedItems = [...activePackageItems, newItem];

    setPackages(
      packages.map((pkg) =>
        pkg.id === selectedPkgId ? { ...pkg, items: updatedItems } : pkg
      )
    );
  };

  // Remove item from active package
  const handleRemoveItemFromPackage = (code: string) => {
    if (!selectedPkgId || !activePackage) return;
    const updatedItems = activePackageItems.filter((i) => i.code !== code);
    setPackages(
      packages.map((pkg) =>
        pkg.id === selectedPkgId ? { ...pkg, items: updatedItems } : pkg
      )
    );
  };

  // Change equipment assigned to an item inside the package
  const handleChangeItemEquipment = (code: string, equipmentId: string | null) => {
    if (!selectedPkgId || !activePackage) return;
    const updatedItems = activePackageItems.map((it) =>
      it.code === code ? { ...it, equipmentId } : it
    );
    setPackages(
      packages.map((pkg) =>
        pkg.id === selectedPkgId ? { ...pkg, items: updatedItems } : pkg
      )
    );
  };

  // Create new package
  const handleCreatePackage = () => {
    if (!newPkgName.trim()) return;
    const newPkg: TestPackage = {
      id: crypto.randomUUID(),
      name: newPkgName.trim(),
      items: [],
      price: newPkgPrice || 0
    };
    setPackages([...packages, newPkg]);
    setSelectedPkgId(newPkg.id);
    setNewPkgName('');
    setNewPkgPrice(0);
    setIsAddingPkg(false);
  };

  // Delete package
  const handleDeletePackage = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa gói xét nghiệm này không?')) {
      const remaining = packages.filter((p) => p.id !== id);
      setPackages(remaining);
      if (selectedPkgId === id) {
        setSelectedPkgId(remaining[0]?.id || null);
      }
    }
  };

  // Filter catalog items to add
  const filteredCatalogItems = useMemo(() => {
    if (!searchItem.trim()) return items.slice(0, 30);
    const term = searchItem.toLowerCase();
    return items
      .filter(
        (i) =>
          i.code.toLowerCase().includes(term) ||
          i.name.toLowerCase().includes(term) ||
          (i.category && i.category.toLowerCase().includes(term))
      )
      .slice(0, 30);
  }, [items, searchItem]);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
      {/* LEFT COLUMN: PACKAGE LIST */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-600" />
            Danh Sách Gói Xét Nghiệm
          </span>
          <button
            type="button"
            onClick={() => setIsAddingPkg(true)}
            className="p-1 text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
            title="Thêm gói mới"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Add Package Form */}
        {isAddingPkg && (
          <div className="p-3 bg-sky-50/50 border-b border-sky-200 animate-in slide-in-from-top duration-150 space-y-2">
            <input
              type="text"
              value={newPkgName}
              onChange={(e) => setNewPkgName(e.target.value)}
              placeholder="Tên gói xét nghiệm..."
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500"
            />
            <input
              type="number"
              value={newPkgPrice || ''}
              onChange={(e) => setNewPkgPrice(parseFloat(e.target.value) || 0)}
              placeholder="Giá gói (VNĐ)..."
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setIsAddingPkg(false)}
                className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreatePackage}
                className="px-2.5 py-1 text-xs font-bold bg-sky-600 text-white rounded hover:bg-sky-500 cursor-pointer"
              >
                Lưu
              </button>
            </div>
          </div>
        )}

        {/* Package items */}
        <div className="p-2 space-y-1">
          {packages.map((pkg) => {
            const isSelected = selectedPkgId === pkg.id;
            const itemsInPkg = normalizePkgItems(pkg.items);

            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPkgId(pkg.id)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-sky-50 border-sky-300 shadow-2xs'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-bold text-xs text-slate-800 truncate">{pkg.name}</div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span>{itemsInPkg.length} chỉ số</span>
                    <span>•</span>
                    <span className="font-bold text-emerald-600">
                      {pkg.price ? pkg.price.toLocaleString('vi-VN') + ' đ' : '0 đ'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePackage(pkg.id);
                    }}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded transition cursor-pointer"
                    title="Xóa gói này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: PACKAGE EDITOR */}
      {activePackage ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* ITEMS IN PACKAGE */}
          <div className="flex-1 flex flex-col bg-white border-r border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                  Chỉ Số Trong Gói: <span className="text-sky-700">{activePackage.name}</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {activePackageItems.length} chỉ số • Giá gói: {activePackage.price.toLocaleString('vi-VN')} đ (Gợi ý: {suggestedPrice.toLocaleString('vi-VN')} đ)
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activePackageItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Gói này chưa có chỉ số nào. Chọn chỉ số từ cột bên phải để thêm vào gói.
                </div>
              ) : (
                activePackageItems.map((pkgItem) => {
                  const catItem = items.find((i) => i.code === pkgItem.code);
                  const availableEqs = catalogItemEquipments.filter(
                    (l) => l.catalogCode === pkgItem.code
                  );

                  return (
                    <div
                      key={pkgItem.code}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-[160px]">
                        <span className="font-mono font-bold text-slate-800">{pkgItem.code}</span>
                        <span className="font-medium text-slate-700 truncate">{catItem?.name || ''}</span>
                      </div>

                      {/* Equipment Selector for this item */}
                      <div className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={pkgItem.equipmentId || ''}
                          onChange={(e) =>
                            handleChangeItemEquipment(
                              pkgItem.code,
                              e.target.value === '' ? null : e.target.value
                            )
                          }
                          className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
                        >
                          <option value="">Máy mặc định (Tự động)</option>
                          {availableEqs.map((link) => {
                            const eqObj = equipments.find((e) => e.id === link.equipmentId);
                            return (
                              <option key={link.equipmentId} value={link.equipmentId}>
                                {eqObj?.name || link.equipmentId}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-600">
                          {catItem?.price ? catItem.price.toLocaleString('vi-VN') + ' đ' : '-'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromPackage(pkgItem.code)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Xóa khỏi gói"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CATALOG SELECTION POOL */}
          <div className="w-full md:w-80 bg-slate-50 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  placeholder="Tìm chỉ số thêm vào gói..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredCatalogItems.map((item) => {
                const isAlreadyIn = activePackageItems.some((i) => i.code === item.code);

                return (
                  <div
                    key={item.code}
                    className={`p-2 rounded-xl text-xs flex items-center justify-between transition ${
                      isAlreadyIn ? 'bg-slate-100 opacity-60' : 'bg-white border border-slate-100 hover:border-sky-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">{item.code}</span>
                        <span className="truncate text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{item.category}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddItemToPackage(item.code)}
                      disabled={isAlreadyIn}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        isAlreadyIn
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
          Chọn hoặc tạo một gói xét nghiệm để bắt đầu cấu hình.
        </div>
      )}
    </div>
  );
}
