import { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Settings2,
  AlertCircle,
  FlaskConical,
  Scale,
  Hash,
  Sliders,
  Filter,
  CheckCircle2,
  Circle,
  ListOrdered
} from 'lucide-react';
import {
  CatalogItem,
  CatalogItemEquipmentLink,
  TestEquipment,
  TestGroup,
  ALLERGEN_SCALES,
  REFERENCE_RANGES,
  computeItemEquipmentLinkKey
} from '@domain';

interface CatalogItemsTabProps {
  items: CatalogItem[];
  setItems: (items: CatalogItem[]) => void;
  groups: TestGroup[];
  onCreateGroup?: (name: string) => void;
  onDeleteGroup?: (id: string) => void;
  equipments?: TestEquipment[];
  onCreateEquipment?: (name: string) => void;
  onDeleteEquipment?: (id: string) => void;
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  setCatalogItemEquipments?: (links: CatalogItemEquipmentLink[]) => void;
}

export default function CatalogItemsTab({
  items,
  setItems,
  groups,
  onCreateGroup,
  onDeleteGroup,
  equipments = [],
  onCreateEquipment,
  onDeleteEquipment,
  catalogItemEquipments = [],
  setCatalogItemEquipments
}: CatalogItemsTabProps) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [newGroupName, setNewGroupName] = useState('');
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CatalogItem>>({});
  
  // Selected item for configuring multiple equipment links
  const [configItemCode, setConfigItemCode] = useState<string | null>(null);

  // New item draft state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemForm, setNewItemForm] = useState<Partial<CatalogItem>>({
    code: '',
    name: '',
    category: groups[0]?.name || 'Sinh hóa',
    refMin: undefined,
    refMax: undefined,
    unit: '',
    refText: '',
    price: 0,
    scientific: '',
    evaluationType: 'RANGE'
  });

  // Filtered list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(search.toLowerCase()));
      const matchGroup = selectedGroup === 'ALL' || item.category === selectedGroup;
      return matchSearch && matchGroup;
    });
  }, [items, search, selectedGroup]);

  // Selected item being configured with equipments
  const activeConfigItem = useMemo(() => {
    return items.find((i) => i.code === configItemCode) || null;
  }, [items, configItemCode]);

  // Links for active config item
  const activeItemEquipments = useMemo(() => {
    if (!configItemCode) return [];
    return catalogItemEquipments.filter((l) => l.catalogCode === configItemCode);
  }, [catalogItemEquipments, configItemCode]);

  // Handle Edit Item
  const handleStartEdit = (item: CatalogItem) => {
    setEditingCode(item.code);
    setEditForm({ ...item });
  };

  const handleSaveEdit = () => {
    if (!editingCode || !editForm.name) return;
    const updated = items.map((item) =>
      item.code === editingCode ? ({ ...item, ...editForm } as CatalogItem) : item
    );
    setItems(updated);
    setEditingCode(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingCode(null);
    setEditForm({});
  };

  // Handle Delete Item
  const handleDeleteItem = (code: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa chỉ số [${code}] không?`)) {
      setItems(items.filter((i) => i.code !== code));
      if (setCatalogItemEquipments) {
        setCatalogItemEquipments(catalogItemEquipments.filter((l) => l.catalogCode !== code));
      }
      if (configItemCode === code) setConfigItemCode(null);
    }
  };

  // Handle Add Item
  const handleSaveNewItem = () => {
    if (!newItemForm.code || !newItemForm.name) {
      alert('Vui lòng nhập mã và tên chỉ số!');
      return;
    }
    if (items.some((i) => i.code.toLowerCase() === newItemForm.code!.toLowerCase())) {
      alert('Mã chỉ số này đã tồn tại!');
      return;
    }
    const itemToAdd: CatalogItem = {
      code: newItemForm.code.trim().toUpperCase(),
      name: newItemForm.name.trim(),
      category: newItemForm.category || 'Sinh hóa',
      refMin: newItemForm.refMin ?? null,
      refMax: newItemForm.refMax ?? null,
      unit: newItemForm.unit || '',
      refText: newItemForm.refText || '',
      price: newItemForm.price || 0,
      scientific: newItemForm.scientific || '',
      evaluationType: newItemForm.evaluationType || 'RANGE',
      scaleId: newItemForm.scaleId,
      referenceRangeId: newItemForm.referenceRangeId
    };
    setItems([...items, itemToAdd]);
    setIsAddingNew(false);
    setNewItemForm({
      code: '',
      name: '',
      category: groups[0]?.name || 'Sinh hóa',
      refMin: undefined,
      refMax: undefined,
      unit: '',
      refText: '',
      price: 0,
      scientific: '',
      evaluationType: 'RANGE'
    });
  };

  // ── EQUIPMENT CONFIG HELPERS ──
  const handleToggleEquipmentForActiveItem = (eqId: string) => {
    if (!configItemCode || !setCatalogItemEquipments) return;
    const existing = catalogItemEquipments.find(
      (l) => l.catalogCode === configItemCode && l.equipmentId === eqId
    );

    if (existing) {
      // Remove
      setCatalogItemEquipments(
        catalogItemEquipments.filter(
          (l) => !(l.catalogCode === configItemCode && l.equipmentId === eqId)
        )
      );
    } else {
      // Add with item default values
      const isFirst = activeItemEquipments.length === 0;
      const newLink: CatalogItemEquipmentLink = {
        id: computeItemEquipmentLinkKey(configItemCode, eqId),
        catalogCode: configItemCode,
        equipmentId: eqId,
        refMin: activeConfigItem?.refMin ?? null,
        refMax: activeConfigItem?.refMax ?? null,
        unit: activeConfigItem?.unit || '',
        refText: activeConfigItem?.refText || '',
        scaleId: activeConfigItem?.scaleId,
        isDefault: isFirst
      };
      setCatalogItemEquipments([...catalogItemEquipments, newLink]);
    }
  };

  const handleUpdateEquipmentLink = (
    eqId: string,
    updates: Partial<CatalogItemEquipmentLink>
  ) => {
    if (!configItemCode || !setCatalogItemEquipments) return;
    setCatalogItemEquipments(
      catalogItemEquipments.map((l) => {
        if (l.catalogCode === configItemCode && l.equipmentId === eqId) {
          return { ...l, ...updates };
        }
        return l;
      })
    );
  };

  const handleSetDefaultEquipment = (eqId: string) => {
    if (!configItemCode || !setCatalogItemEquipments) return;
    setCatalogItemEquipments(
      catalogItemEquipments.map((l) => {
        if (l.catalogCode === configItemCode) {
          return { ...l, isDefault: l.equipmentId === eqId };
        }
        return l;
      })
    );
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
      {/* LEFT COLUMN: GROUPS & EQUIPMENT LISTS (Sidebar) */}
      <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
        {/* Groups Management */}
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-sky-600" />
              Nhóm Xét Nghiệm
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
              {groups.length}
            </span>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setSelectedGroup('ALL')}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                selectedGroup === 'ALL'
                  ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Tất Cả Chỉ Số</span>
              <span className="text-[10px] text-slate-400">{items.length}</span>
            </button>

            {groups.map((grp) => {
              const count = items.filter((i) => i.category === grp.name).length;
              return (
                <div key={grp.id} className="group/grp flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedGroup(grp.name)}
                    className={`flex-1 text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition truncate cursor-pointer ${
                      selectedGroup === grp.name
                        ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {grp.name}
                  </button>
                  <span className="text-[10px] text-slate-400 px-1.5">{count}</span>
                  {onDeleteGroup && (
                    <button
                      type="button"
                      onClick={() => onDeleteGroup(grp.id)}
                      className="opacity-0 group-hover/grp:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      title="Xóa nhóm này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Group */}
          {onCreateGroup && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex gap-1">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Tên nhóm mới..."
                className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => {
                  if (newGroupName.trim()) {
                    onCreateGroup(newGroupName.trim());
                    setNewGroupName('');
                  }
                }}
                className="px-2 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-500 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Equipments Management */}
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-600" />
              Danh Sách Máy Đo
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
              {equipments.length}
            </span>
          </div>

          <div className="space-y-1">
            {equipments.map((eq) => (
              <div key={eq.id} className="group/eq flex items-center justify-between px-2 py-1 rounded-lg bg-slate-50 text-xs">
                <span className="font-medium text-slate-700 truncate">{eq.name}</span>
                {onDeleteEquipment && (
                  <button
                    type="button"
                    onClick={() => onDeleteEquipment(eq.id)}
                    className="opacity-0 group-hover/eq:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                    title="Xóa máy này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Equipment */}
          {onCreateEquipment && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex gap-1">
              <input
                type="text"
                value={newEquipmentName}
                onChange={(e) => setNewEquipmentName(e.target.value)}
                placeholder="Tên máy đo mới..."
                className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => {
                  if (newEquipmentName.trim()) {
                    onCreateEquipment(newEquipmentName.trim());
                    setNewEquipmentName('');
                  }
                }}
                className="px-2 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-500 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE & RIGHT AREA: MAIN ITEMS TABLE & EQUIPMENT POPUP/DRAWER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã hoặc tên chỉ số..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Chỉ Số Mới</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4">
          <table className="w-full text-left text-xs border-collapse bg-white rounded-xl shadow-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                <th className="py-2.5 px-3 w-28">Mã</th>
                <th className="py-2.5 px-3 min-w-[180px]">Tên Chỉ Số</th>
                <th className="py-2.5 px-3 w-32">Nhóm</th>
                <th className="py-2.5 px-3 w-20 text-center">Đơn Vị</th>
                <th className="py-2.5 px-3 w-36 text-center">Tham Chiếu</th>
                <th className="py-2.5 px-3 w-24 text-right">Giá Tiền</th>
                <th className="py-2.5 px-3 w-28 text-center">Máy Đo</th>
                <th className="py-2.5 px-3 w-24 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => {
                const isEditing = editingCode === item.code;
                const eqCount = catalogItemEquipments.filter((l) => l.catalogCode === item.code).length;
                const isConfiguring = configItemCode === item.code;

                if (isEditing) {
                  return (
                    <tr key={item.code} className="bg-sky-50/50">
                      <td className="py-2 px-3 text-center font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold font-mono text-slate-800">{item.code}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={editForm.category || ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                        >
                          {groups.map((g) => (
                            <option key={g.id} value={g.name}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={editForm.unit || ''}
                          onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-center"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex gap-1">
                          <input
                            type="number"
                            step="any"
                            placeholder="Min"
                            value={editForm.refMin ?? ''}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                refMin: e.target.value === '' ? null : parseFloat(e.target.value)
                              })
                            }
                            className="w-1/2 px-1 py-1 border border-slate-300 rounded text-xs text-center"
                          />
                          <input
                            type="number"
                            step="any"
                            placeholder="Max"
                            value={editForm.refMax ?? ''}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                refMax: e.target.value === '' ? null : parseFloat(e.target.value)
                              })
                            }
                            className="w-1/2 px-1 py-1 border border-slate-300 rounded text-xs text-center"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={editForm.price ?? 0}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              price: e.target.value === '' ? 0 : parseFloat(e.target.value)
                            })
                          }
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-right"
                        />
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-400">--</td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="p-1 text-emerald-600 hover:bg-emerald-100 rounded cursor-pointer"
                            title="Lưu"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="p-1 text-slate-400 hover:bg-slate-200 rounded cursor-pointer"
                            title="Hủy"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={item.code}
                    className={`hover:bg-slate-50 transition ${
                      isConfiguring ? 'bg-sky-50/80 border-l-4 border-l-sky-600' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{item.category}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-medium">{item.unit || '-'}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {item.refMin !== null && item.refMax !== null
                        ? `${item.refMin} - ${item.refMax}`
                        : item.refText || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                      {item.price ? item.price.toLocaleString('vi-VN') + ' đ' : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setConfigItemCode(isConfiguring ? null : item.code)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                          eqCount > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Sliders className="w-3 h-3" />
                        <span>{eqCount} máy</span>
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.code)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Xóa chỉ số"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* EQUIPMENT CONFIG DRAWER (When an item is selected for machine config) */}
        {activeConfigItem && (
          <div className="border-t-2 border-sky-500 bg-white p-4 shadow-lg shrink-0 max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-sm text-slate-800">
                  Cấu Hình Máy Đo Cho Chỉ Số: <span className="font-mono text-sky-700">{activeConfigItem.code}</span> - {activeConfigItem.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConfigItemCode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {equipments.map((eq) => {
                const link = activeItemEquipments.find((l) => l.equipmentId === eq.id);
                const isLinked = !!link;
                const isDefault = link?.isDefault || false;

                // Mode: SCALE if scaleId is present, else RANGE
                const currentMode = link?.scaleId ? 'SCALE' : 'RANGE';

                return (
                  <div
                    key={eq.id}
                    className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isLinked ? 'bg-sky-50/40 border-sky-200' : 'bg-slate-50 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <input
                        type="checkbox"
                        checked={isLinked}
                        onChange={() => handleToggleEquipmentForActiveItem(eq.id)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-800">{eq.name}</span>
                        {isDefault && (
                          <span className="ml-2 px-1.5 py-0.2 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded">
                            Mặc định
                          </span>
                        )}
                      </div>
                    </div>

                    {isLinked && link && (
                      <div className="flex-1 flex flex-wrap items-center gap-3">
                        {/* Switcher Mode: Khoảng Số (Min-Max) vs Thang Đo Dương Tính (Scale) */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateEquipmentLink(eq.id, { scaleId: undefined })}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                              currentMode === 'RANGE'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Hash className="w-3 h-3" />
                            <span>Min-Max</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateEquipmentLink(eq.id, {
                                scaleId: ALLERGEN_SCALES[0]?.id || 'scale_allergen_default'
                              })
                            }
                            className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                              currentMode === 'SCALE'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Scale className="w-3 h-3" />
                            <span>Thang Độ</span>
                          </button>
                        </div>

                        {currentMode === 'RANGE' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="any"
                              placeholder="Min"
                              value={link.refMin ?? ''}
                              onChange={(e) =>
                                handleUpdateEquipmentLink(eq.id, {
                                  refMin: e.target.value === '' ? null : parseFloat(e.target.value)
                                })
                              }
                              className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                              type="number"
                              step="any"
                              placeholder="Max"
                              value={link.refMax ?? ''}
                              onChange={(e) =>
                                handleUpdateEquipmentLink(eq.id, {
                                  refMax: e.target.value === '' ? null : parseFloat(e.target.value)
                                })
                              }
                              className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                            />
                            <input
                              type="text"
                              placeholder="Đơn vị"
                              value={link.unit || ''}
                              onChange={(e) => handleUpdateEquipmentLink(eq.id, { unit: e.target.value })}
                              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={link.scaleId || ''}
                              onChange={(e) => handleUpdateEquipmentLink(eq.id, { scaleId: e.target.value })}
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                            >
                              {ALLERGEN_SCALES.map((sc) => (
                                <option key={sc.id} value={sc.id}>
                                  {sc.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          {!isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultEquipment(eq.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
                            >
                              Đặt làm mặc định
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD NEW ITEM */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                Thêm Chỉ Số Xét Nghiệm Mới
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã Chỉ Số *</label>
                  <input
                    type="text"
                    value={newItemForm.code || ''}
                    onChange={(e) => setNewItemForm({ ...newItemForm, code: e.target.value.toUpperCase() })}
                    placeholder="VD: GLU, UREA, TIGE..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nhóm Xét Nghiệm</label>
                  <select
                    value={newItemForm.category || ''}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Chỉ Số *</label>
                <input
                  type="text"
                  value={newItemForm.name || ''}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="VD: Glucose, Định lượng Ure máu..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngưỡng Min</label>
                  <input
                    type="number"
                    step="any"
                    value={newItemForm.refMin ?? ''}
                    onChange={(e) =>
                      setNewItemForm({
                        ...newItemForm,
                        refMin: e.target.value === '' ? undefined : parseFloat(e.target.value)
                      })
                    }
                    placeholder="VD: 3.9"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngưỡng Max</label>
                  <input
                    type="number"
                    step="any"
                    value={newItemForm.refMax ?? ''}
                    onChange={(e) =>
                      setNewItemForm({
                        ...newItemForm,
                        refMax: e.target.value === '' ? undefined : parseFloat(e.target.value)
                      })
                    }
                    placeholder="VD: 6.4"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Đơn Vị</label>
                  <input
                    type="text"
                    value={newItemForm.unit || ''}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    placeholder="mmol/L..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giá Tiền (VNĐ)</label>
                  <input
                    type="number"
                    value={newItemForm.price ?? ''}
                    onChange={(e) =>
                      setNewItemForm({
                        ...newItemForm,
                        price: e.target.value === '' ? 0 : parseFloat(e.target.value)
                      })
                    }
                    placeholder="VD: 40000"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên Khoa Học (nếu có)</label>
                  <input
                    type="text"
                    value={newItemForm.scientific || ''}
                    onChange={(e) => setNewItemForm({ ...newItemForm, scientific: e.target.value })}
                    placeholder="VD: Dermatophagoides pteronyssinus"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveNewItem}
                className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                Lưu Chỉ Số
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
