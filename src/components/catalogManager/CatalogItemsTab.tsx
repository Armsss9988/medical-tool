import { useState, useMemo } from 'react';
import { Plus, Trash2, Search, Download, Upload, RotateCcw, Dna, FlaskConical, Layers } from 'lucide-react';
import { CatalogItem, TestGroup, TestEquipment, ReferenceRangeItem } from '@domain/types';
import { DEFAULT_CATALOG } from '@data/defaultCatalog';
import { ALLERGEN_91_DATABASE } from '@data/allergenCatalog';
import { CODE_TO_REFERENCE_RANGE_MAP } from '@data/referenceRangesCatalog';
import { getAllergenScaleById } from '@domain/constants/allergenScales';
import { exportSampleExcelCatalog, parseExcelCatalog } from '@infra/excelService';
import GroupSearchCombobox from './GroupSearchCombobox';
import EquipmentSearchCombobox from './EquipmentSearchCombobox';

const ALLERGEN_ORDER_MAP = new Map(ALLERGEN_91_DATABASE.map((item) => [item.code.toLowerCase(), item.tt]));

interface CatalogItemsTabProps {
  items: CatalogItem[];
  setItems: React.Dispatch<React.SetStateAction<CatalogItem[]>>;
  groups: TestGroup[];
  onCreateGroup: (name: string) => void;
  onDeleteGroup?: (id: string) => void;
  equipments: TestEquipment[];
  onCreateEquipment: (name: string) => void;
  onDeleteEquipment?: (id: string) => void;
  referenceRanges?: ReferenceRangeItem[];
}

type ViewFilterType = 'all' | 'general' | 'allergen';

export default function CatalogItemsTab({
  items,
  setItems,
  groups,
  onCreateGroup,
  onDeleteGroup,
  equipments,
  onCreateEquipment,
  onDeleteEquipment,
  referenceRanges = []
}: CatalogItemsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<ViewFilterType>('all');
  const [showAddForm, setShowAddForm] = useState(false);

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

  const isAllergenItem = (item: CatalogItem) =>
    (item.category && item.category.includes('Dị Nguyên')) || item.unit === 'IU/mL' || !!item.scaleId;

  const allergenCount = useMemo(() => items.filter(isAllergenItem).length, [items]);
  const generalCount = useMemo(() => items.filter((i) => !isAllergenItem(i)).length, [items]);

  const filteredItems = useMemo(() => {
    const list = items.filter((i) => {
      const isAllergen = isAllergenItem(i);
      if (viewFilter === 'general' && isAllergen) return false;
      if (viewFilter === 'allergen' && !isAllergen) return false;

      const matchSearch =
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.scientific && i.scientific.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchGroup = selectedGroup === 'all' || i.category === selectedGroup;

      return matchSearch && matchGroup;
    });

    if (viewFilter === 'allergen') {
      return [...list].sort((a, b) => {
        const orderA = ALLERGEN_ORDER_MAP.get(a.code.toLowerCase()) ?? 999;
        const orderB = ALLERGEN_ORDER_MAP.get(b.code.toLowerCase()) ?? 999;
        return orderA - orderB;
      });
    }

    return list;
  }, [items, viewFilter, searchTerm, selectedGroup]);

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
    if (window.confirm(`Bạn có chắc muốn xóa chỉ số [${code}] khỏi danh mục?`)) {
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
    setShowAddForm(false);
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

  return (
    <div className="p-4 flex-grow overflow-y-auto flex flex-col space-y-3">
      {/* Thanh Bộ Lọc Phân Loại & Thao Tác Nhanh */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
        {/* Pills Filter */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setViewFilter('all')}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewFilter === 'all'
                ? 'bg-white text-sky-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tất Cả ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewFilter('general')}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewFilter === 'general'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
            <span>Chỉ Số Thường ({generalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewFilter('allergen')}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewFilter === 'allergen'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Dna className="w-3.5 h-3.5 text-red-600" />
            <span>Panel Dị Nguyên ({allergenCount})</span>
          </button>
        </div>

        {/* Search & Group Filter */}
        <div className="flex items-center gap-2 flex-grow max-w-md">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm mã, tên chỉ số..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-sky-500 max-w-[150px]"
          >
            <option value="all">Tất cả nhóm ({items.length})</option>
            {groups.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons: Add New & Excel */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Đóng Form' : 'Thêm Chỉ Số'}</span>
          </button>

          <button
            type="button"
            onClick={() => exportSampleExcelCatalog()}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
            title="Xuất Excel danh mục"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <label
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white font-bold px-2.5 py-1.5 rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
            title="Nhập Excel danh mục"
          >
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Khôi phục danh mục chỉ số về mặc định?')) {
                setItems(DEFAULT_CATALOG);
              }
            }}
            className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
            title="Khôi phục mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Form Thêm Chỉ Số Nhanh (Collapsible) */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 text-xs space-y-2 animate-in fade-in duration-100">
          <div className="font-extrabold text-sky-900 flex items-center justify-between">
            <span>Thêm Chỉ Số Xét Nghiệm Mới</span>
            <span className="text-[11px] font-normal text-sky-700">Điền thông tin và bấm Lưu</span>
          </div>

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-0.5">MÃ CODE *</label>
              <input
                type="text"
                value={newItem.code}
                onChange={(e) => setNewItem({ ...newItem, code: e.target.value.toUpperCase() })}
                placeholder="VD: GLU"
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold uppercase"
                required
              />
            </div>
            <div className="col-span-3">
              <label className="block font-bold text-slate-700 mb-0.5">TÊN CHỈ SỐ *</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="VD: Glucose máu"
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-semibold"
                required
              />
            </div>
            <div className="col-span-3">
              <label className="block font-bold text-slate-700 mb-0.5">NHÓM XÉT NGHIỆM</label>
              <GroupSearchCombobox
                value={newItem.category}
                onChange={(name) => setNewItem({ ...newItem, category: name })}
                groups={groups}
                onCreateGroup={onCreateGroup}
                onDeleteGroup={onDeleteGroup}
                compact
              />
            </div>
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-0.5">ĐƠN VỊ</label>
              <input
                type="text"
                value={newItem.unit || ''}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="VD: mmol/L"
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-0.5">GIÁ THU (Đ)</label>
              <input
                type="number"
                value={newItem.price || ''}
                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                placeholder="VD: 35000"
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-sky-200/60">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold shadow-xs cursor-pointer"
            >
              Lưu Chỉ Số
            </button>
          </div>
        </form>
      )}

      {/* Bảng Danh Sách Chỉ Số Thống Nhất */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex-grow">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10">
              <tr>
                <th className="p-2.5 w-10 text-center">STT</th>
                <th className="p-2.5 w-20">MÃ CODE</th>
                <th className="p-2.5 min-w-[160px]">TÊN CHỈ SỐ</th>
                <th className="p-2.5 min-w-[130px]">TÊN KHOA HỌC / ALLERGEN</th>
                <th className="p-2.5 w-36">NHÓM XÉT NGHIỆM</th>
                <th className="p-2.5 w-36 text-center">LIÊN KẾT (THAM CHIẾU / THANG ĐO)</th>
                <th className="p-2.5 w-20 text-center">ĐƠN VỊ</th>
                <th className="p-2.5 w-28 text-center">HIỂN THỊ (TEXT)</th>
                <th className="p-2.5 w-24 text-right">GIÁ THU (Đ)</th>
                <th className="p-2.5 w-36">MÁY XỬ LÝ</th>
                <th className="p-2.5 w-10 text-center">XÓA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                    Không tìm thấy chỉ số xét nghiệm phù hợp
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isAllergen = isAllergenItem(item);
                  const effectiveScaleId = item.scaleId || (isAllergen ? 'scale_protia_91' : undefined);
                  const effectiveRangeId = item.referenceRangeId || CODE_TO_REFERENCE_RANGE_MAP[item.code.toUpperCase()] || '';

                  const linkedRange = referenceRanges?.find((r) => r.id === effectiveRangeId);
                  const linkedScale = effectiveScaleId ? getAllergenScaleById(effectiveScaleId) : undefined;
                  const normalGrade0 = linkedScale?.levels.find((l) => l.grade === 0);

                  const displayUnit = isAllergen
                    ? (linkedScale?.unit || item.unit || 'IU/mL')
                    : (linkedRange?.unit || item.unit || '---');

                  const displayRefText = isAllergen
                    ? (normalGrade0 ? `${normalGrade0.rangeText} (Độ 0)` : item.refText || '< 0,35 (Độ 0)')
                    : (linkedRange?.refText || item.refText || '---');

                  return (
                    <tr key={item.code} className="hover:bg-slate-50">
                      <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className={`p-2 font-mono font-bold ${isAllergen ? 'text-red-900' : 'text-sky-900'}`}>
                        {item.code}
                      </td>
                      <td className="p-2 font-bold text-slate-800">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(item.code, 'name', e.target.value)}
                          className="w-full bg-transparent border-0 font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                        />
                      </td>
                      <td className="p-2 italic text-slate-600">
                        <input
                          type="text"
                          value={item.scientific || ''}
                          onChange={(e) => handleItemChange(item.code, 'scientific', e.target.value)}
                          placeholder="---"
                          className="w-full bg-transparent border-0 italic text-slate-600 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                        />
                      </td>
                      <td className="p-2">
                        <GroupSearchCombobox
                          value={item.category}
                          onChange={(name) => handleItemChange(item.code, 'category', name)}
                          groups={groups}
                          onCreateGroup={onCreateGroup}
                          onDeleteGroup={onDeleteGroup}
                          compact
                        />
                      </td>
                      
                      {/* LIÊN KẾT 1 TRONG 2: DỊ NGUYÊN -> THANG ĐO | THƯỜNG -> THAM CHIẾU */}
                      <td className="p-2 text-center">
                        {isAllergen ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1 rounded">
                              Thang
                            </span>
                            <select
                              value={effectiveScaleId || 'scale_protia_91'}
                              onChange={(e) => {
                                const scaleId = e.target.value;
                                setItems((prev) =>
                                  prev.map((it) =>
                                    it.code === item.code
                                      ? {
                                          ...it,
                                          scaleId,
                                          referenceRangeId: undefined,
                                          evaluationType: 'scale'
                                        }
                                      : it
                                  )
                                );
                              }}
                              className="bg-red-50/50 border border-red-200 rounded px-1 py-0.5 text-red-900 font-semibold text-[11px] focus:outline-none focus:border-red-500 flex-grow"
                            >
                              <option value="scale_protia_91">Protia 91 (Độ 0-6)</option>
                              <option value="scale_allergen_44">Gói 44 (Độ 0-6)</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1 rounded">
                              Ref
                            </span>
                            <select
                              value={effectiveRangeId}
                              onChange={(e) => {
                                const rangeId = e.target.value;
                                if (!rangeId) {
                                  handleItemChange(item.code, 'referenceRangeId', undefined);
                                } else {
                                  const range = referenceRanges?.find((r) => r.id === rangeId);
                                  if (range) {
                                    setItems((prev) =>
                                      prev.map((it) =>
                                        it.code === item.code
                                          ? {
                                              ...it,
                                              referenceRangeId: range.id,
                                              scaleId: undefined,
                                              evaluationType: 'range',
                                              refMin: range.refMin,
                                              refMax: range.refMax,
                                              unit: range.unit || it.unit,
                                              refText: range.refText || it.refText
                                            }
                                          : it
                                      )
                                    );
                                  }
                                }
                              }}
                              className="bg-sky-50/50 border border-sky-200 rounded px-1 py-0.5 text-slate-800 font-semibold text-[11px] focus:outline-none focus:border-sky-500 flex-grow"
                            >
                              <option value="">-- Tùy chỉnh --</option>
                              {referenceRanges?.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name} ({r.refText})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>

                      <td className="p-2 text-center font-mono">
                        {isAllergen || linkedRange ? (
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded">
                            {displayUnit}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={item.unit || ''}
                            onChange={(e) => handleItemChange(item.code, 'unit', e.target.value)}
                            placeholder="Đơn vị..."
                            className="w-full bg-transparent border-0 text-center font-mono text-slate-700 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                          />
                        )}
                      </td>
                      <td className="p-2 text-center font-mono">
                        {isAllergen || linkedRange ? (
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded">
                            {displayRefText}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={item.refText || ''}
                            onChange={(e) => handleItemChange(item.code, 'refText', e.target.value)}
                            placeholder="Tham chiếu..."
                            className="w-full bg-transparent border-0 text-center font-mono text-slate-700 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                          />
                        )}
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
                          value={item.equipment || (isAllergen ? 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer' : 'Máy Sinh Hóa Tự Động Mindray BS-240')}
                          onChange={(name) => handleItemChange(item.code, 'equipment', name)}
                          equipments={equipments}
                          onCreateEquipment={onCreateEquipment}
                          onDeleteEquipment={onDeleteEquipment}
                          compact
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.code)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
