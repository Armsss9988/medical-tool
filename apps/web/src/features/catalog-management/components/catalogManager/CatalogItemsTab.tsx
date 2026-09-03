import { useState, useMemo } from 'react';
import { Plus, Trash2, Search, Download, Upload, Dna, FlaskConical, Layers, Settings2, Star, X, FileSpreadsheet, ChevronDown, RotateCcw } from 'lucide-react';
import { CatalogItem, CatalogItemEquipmentLink, TestGroup, TestEquipment, AllergenGradingScale } from '@domain/types';
import { getAllergenScaleById } from '@domain/constants/allergenScales';
import { DEFAULT_CATALOG, autoResolveItemLinks } from '@data';
import { fetchCatalogFromSupabase, DEFAULT_CLOUD_DB_CONFIG } from '@infra/cloudDbService';
import {
  exportCatalogItemsTemplate,
  parseExcelCatalog,
  exportCatalogItemEquipmentsTemplate,
  parseExcelCatalogItemEquipments
} from '@infra/excelService';
import GroupSearchCombobox from './GroupSearchCombobox';
import EquipmentSearchCombobox from './EquipmentSearchCombobox';

function parseAllergenOrder(code: string): number {
  const m = code.match(/\d+/);
  return m ? parseInt(m[0], 10) : 999;
}

interface CatalogItemsTabProps {
  items: CatalogItem[];
  setItems: React.Dispatch<React.SetStateAction<CatalogItem[]>>;
  groups: TestGroup[];
  onCreateGroup: (name: string) => void;
  onDeleteGroup?: (id: string) => void;
  equipments: TestEquipment[];
  onCreateEquipment: (name: string) => void;
  onDeleteEquipment?: (id: string) => void;
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  setCatalogItemEquipments?: React.Dispatch<React.SetStateAction<CatalogItemEquipmentLink[]>>;
  scales?: AllergenGradingScale[];
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
  catalogItemEquipments = [],
  setCatalogItemEquipments,
  scales = []
}: CatalogItemsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<ViewFilterType>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExcelDropdown, setShowExcelDropdown] = useState(false);

  // Modal quản lý máy đo cho chỉ số đang chọn
  const [configItem, setConfigItem] = useState<CatalogItem | null>(null);

  // State cho form gán máy đo mới bên trong modal cấu hình (inline ref ranges)
  const [selectedEquipName, setSelectedEquipName] = useState('');
  const [newEvalMode, setNewEvalMode] = useState<'RANGE' | 'SCALE'>('RANGE');
  const [newLinkRefMin, setNewLinkRefMin] = useState<string>('');
  const [newLinkRefMax, setNewLinkRefMax] = useState<string>('');
  const [newLinkUnit, setNewLinkUnit] = useState<string>('');
  const [newLinkRefText, setNewLinkRefText] = useState<string>('');
  const [selectedScaleId, setSelectedScaleId] = useState('scale_protia_91');
  const [isNewEquipDefault, setIsNewEquipDefault] = useState(false);

  // State cho Form Thêm Nhanh
  const [quickAddEvalMode, setQuickAddEvalMode] = useState<'RANGE' | 'SCALE'>('RANGE');
  const [quickAddScaleId, setQuickAddScaleId] = useState('scale_protia_91');

  const [newItem, setNewItem] = useState<CatalogItem>({
    category: 'Sinh Hóa',
    code: '',
    name: '',
    refMin: null,
    refMax: null,
    unit: '',
    refText: '',
    price: 0,
    equipment: 'MS-360'
  });
  const [initialEquipId, setInitialEquipId] = useState<string>('');

  const isAllergenItem = (item: CatalogItem) =>
    (item.category && item.category.includes('Dị Nguyên')) || item.unit === 'IU/mL' || !!item.scaleId;

  const handleOpenConfigModal = (item: CatalogItem) => {
    setConfigItem(item);
    setSelectedEquipName('');
    const existingLinks = (catalogItemEquipments || []).filter(
      (l) => l.catalogCode.toUpperCase() === item.code.toUpperCase()
    );
    const defaultLink = existingLinks.find((l) => l.isDefault) || existingLinks[0];

    const isScale = Boolean(
      isAllergenItem(item) || item.scaleId || defaultLink?.scaleId || defaultLink?.scaleId !== undefined
    );
    setNewEvalMode(defaultLink?.scaleId ? 'SCALE' : isScale ? 'SCALE' : 'RANGE');
    setSelectedScaleId(defaultLink?.scaleId || item.scaleId || 'scale_protia_91');

    setNewLinkRefMin(defaultLink?.refMin != null ? String(defaultLink.refMin) : (item.refMin != null ? String(item.refMin) : ''));
    setNewLinkRefMax(defaultLink?.refMax != null ? String(defaultLink.refMax) : (item.refMax != null ? String(item.refMax) : ''));
    setNewLinkUnit(defaultLink?.unit || item.unit || '');
    setNewLinkRefText(defaultLink?.refText || item.refText || '');
    setIsNewEquipDefault(false);
  };

  const allergenCount = useMemo(() => items.filter(isAllergenItem).length, [items]);
  const generalCount = useMemo(() => items.filter((i) => !isAllergenItem(i)).length, [items]);

  const filteredItems = useMemo(() => {
    const list = items.filter((i) => {
      const isAllergen = isAllergenItem(i);
      if (viewFilter === 'general' && isAllergen) return false;
      if (viewFilter === 'allergen' && !isAllergen) return false;

      const term = (searchTerm || '').trim().toLowerCase();
      const matchSearch =
        String(i?.name || '').toLowerCase().includes(term) ||
        String(i?.code || '').toLowerCase().includes(term) ||
        (i?.scientific && String(i.scientific).toLowerCase().includes(term));
      const matchGroup = selectedGroup === 'all' || i?.category === selectedGroup;

      return matchSearch && matchGroup;
    });

    if (viewFilter === 'allergen') {
      return [...list].sort((a, b) => {
        const orderA = parseAllergenOrder(a.code);
        const orderB = parseAllergenOrder(b.code);
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
      if (setCatalogItemEquipments) {
        setCatalogItemEquipments((prev) => prev.filter((cie) => cie.catalogCode !== code));
      }
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.code.trim() || !newItem.name.trim()) {
      alert('Vui lòng nhập Mã và Tên chỉ số xét nghiệm!');
      return;
    }
    const cleanCode = newItem.code.trim().toUpperCase();
    if (items.some((i) => i.code.toUpperCase() === cleanCode)) {
      alert(`Mã chỉ số "${cleanCode}" đã tồn tại! Vui lòng chọn mã khác.`);
      return;
    }

    const isScale = quickAddEvalMode === 'SCALE';
    let refText = newItem.refText?.trim() || '';
    if (!refText) {
      if (isScale) {
        refText = quickAddScaleId === 'scale_allergen_44' ? '< 0.35 (Độ 0)' : '< 0.34 (Độ 0)';
      } else if (newItem.refMin !== null && newItem.refMin !== undefined && newItem.refMax !== null && newItem.refMax !== undefined) {
        refText = `${newItem.refMin} - ${newItem.refMax}`;
      } else if (newItem.refMin !== null && newItem.refMin !== undefined) {
        refText = `>= ${newItem.refMin}`;
      } else if (newItem.refMax !== null && newItem.refMax !== undefined) {
        refText = `<= ${newItem.refMax}`;
      }
    }

    const created: CatalogItem = {
      ...newItem,
      code: cleanCode,
      name: newItem.name.trim(),
      category: newItem.category.trim() || 'Sinh Hóa',
      price: Number(newItem.price) || 0,
      scaleId: isScale ? quickAddScaleId : undefined,
      evaluationType: isScale ? 'scale' : 'range',
      refMin: !isScale ? (newItem.refMin ?? null) : null,
      refMax: !isScale ? (newItem.refMax ?? null) : null,
      unit: !isScale ? (newItem.unit || '') : (quickAddScaleId === 'scale_protia_91' || quickAddScaleId === 'scale_allergen_44' ? 'IU/ml' : (newItem.unit || '')),
      refText: refText
    };

    setItems((prev) => [created, ...prev]);

    // Tạo liên kết thiết bị đo ban đầu nếu có chọn
    if (setCatalogItemEquipments && initialEquipId) {
      const newLink: CatalogItemEquipmentLink = {
        id: `cie_${cleanCode.toLowerCase()}_${initialEquipId}`,
        catalogCode: cleanCode,
        equipmentId: initialEquipId,
        refMin: !isScale ? (newItem.refMin ?? null) : undefined,
        refMax: !isScale ? (newItem.refMax ?? null) : undefined,
        unit: !isScale ? (newItem.unit || undefined) : 'IU/ml',
        refText: refText || undefined,
        scaleId: isScale ? (quickAddScaleId || 'scale_protia_91') : undefined,
        isDefault: true
      };
      setCatalogItemEquipments((prev) => [...prev, newLink]);
    }

    setNewItem({
      category: 'Sinh Hóa',
      code: '',
      name: '',
      refMin: null,
      refMax: null,
      unit: '',
      refText: '',
      price: 0,
      equipment: 'MS-360'
    });
    setInitialEquipId('');
    setShowAddForm(false);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelCatalog(file)
        .then((parsed) => {
          if (parsed.length > 0) {
            setItems((prev) => {
              const map = new Map(prev.map((item) => [item.code.toUpperCase(), item]));
              let updatedCount = 0;
              let addedCount = 0;
              parsed.forEach((newItem) => {
                const codeKey = newItem.code.toUpperCase();
                const existing = map.get(codeKey);
                if (existing) {
                  map.set(codeKey, {
                    ...existing,
                    ...newItem,
                    category: newItem.category || existing.category,
                    name: newItem.name || existing.name,
                    scientific: newItem.scientific ?? existing.scientific,
                    unit: newItem.unit || existing.unit,
                    price: (newItem.price !== undefined && newItem.price > 0) ? newItem.price : existing.price,
                    refText: newItem.refText || existing.refText,
                    evaluationType: newItem.evaluationType || existing.evaluationType,
                    scaleId: newItem.scaleId ?? existing.scaleId,
                    refMin: newItem.refMin !== null ? newItem.refMin : (newItem.evaluationType === 'scale' ? null : existing.refMin),
                    refMax: newItem.refMax !== null ? newItem.refMax : (newItem.evaluationType === 'scale' ? null : existing.refMax)
                  });
                  updatedCount++;
                } else {
                  map.set(codeKey, newItem);
                  addedCount++;
                }
              });
              alert(`Đã cập nhật ${updatedCount} chỉ số cũ và thêm mới ${addedCount} chỉ số từ Excel (tổng ${map.size} chỉ số)!`);
              return Array.from(map.values());
            });
          } else {
            alert('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
          }
        })
        .catch((err) => {
          alert(err instanceof Error ? err.message : 'Lỗi nạp file Excel.');
        });
      e.target.value = '';
    }
  };

  const handleRestoreOriginalCatalog = async () => {
    if (!window.confirm(`Bạn có chắc muốn khôi phục lại toàn bộ Danh Mục Chỉ Số Gốc chuẩn (${DEFAULT_CATALOG.length} chỉ số)? Dữ liệu sẽ được nạp lại đầy đủ từ Cloud DB.`)) {
      return;
    }
    try {
      const cloudItems = await fetchCatalogFromSupabase(DEFAULT_CLOUD_DB_CONFIG);
      const validItems = cloudItems && cloudItems.length > 0 ? cloudItems : DEFAULT_CATALOG;
      setItems(validItems.map(autoResolveItemLinks));
      alert(`Đã khôi phục thành công ${validItems.length} chỉ số xét nghiệm chuẩn! Hãy bấm nút "Lưu Toàn Bộ" ở góc dưới để áp dụng.`);
    } catch (err) {
      alert(`Lỗi khi khôi phục danh mục: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleImportEquipmentLinksExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && setCatalogItemEquipments) {
      parseExcelCatalogItemEquipments(file, items, equipments).then((parsed) => {
        if (parsed.length > 0) {
          setCatalogItemEquipments((prev) => {
            const map = new Map(prev.map((l) => [`${l.catalogCode.toUpperCase()}_${l.equipmentId}`, l]));
            let updatedCount = 0;
            let addedCount = 0;
            parsed.forEach((newLink) => {
              const key = `${newLink.catalogCode.toUpperCase()}_${newLink.equipmentId}`;
              const existing = map.get(key);
              if (existing) {
                map.set(key, {
                  ...existing,
                  ...newLink,
                  id: existing.id,
                  unit: newLink.unit ?? existing.unit,
                  refText: newLink.refText ?? existing.refText,
                  scaleId: newLink.scaleId ?? existing.scaleId,
                  refMin: newLink.refMin !== null ? newLink.refMin : (newLink.scaleId ? null : existing.refMin),
                  refMax: newLink.refMax !== null ? newLink.refMax : (newLink.scaleId ? null : existing.refMax)
                });
                updatedCount++;
              } else {
                map.set(key, newLink);
                addedCount++;
              }
            });
            alert(`Đã cập nhật ${updatedCount} cấu hình cũ và thêm mới ${addedCount} cấu hình máy đo từ Excel (tổng ${map.size} liên kết)!`);
            return Array.from(map.values());
          });
        } else {
          alert('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
        }
      });
      e.target.value = '';
    }
  };

  // Helper lấy danh sách liên kết máy đo của 1 chỉ số
  const getLinksForCode = (code: string) => {
    return catalogItemEquipments.filter((cie) => cie.catalogCode.toUpperCase() === code.toUpperCase());
  };

  // Thêm máy đo cho chỉ số đang chọn trong modal
  const handleAddEquipmentLinkToItem = () => {
    if (!configItem || !setCatalogItemEquipments) return;
    if (!selectedEquipName.trim()) {
      alert('Vui lòng chọn hoặc nhập tên máy đo!');
      return;
    }

    let targetEq = equipments.find((e) => e.name.toLowerCase() === selectedEquipName.trim().toLowerCase());
    let eqId = targetEq?.id;

    if (!targetEq) {
      eqId = 'eq_' + Math.random().toString(36).slice(2, 9);
      onCreateEquipment(selectedEquipName.trim());
    }

    if (!eqId) return;

    const isScale = newEvalMode === 'SCALE';
    const existingLinks = getLinksForCode(configItem.code);
    const isFirst = existingLinks.length === 0;

    let linkRefText = !isScale && newLinkRefText ? newLinkRefText.trim() : '';
    if (!linkRefText) {
      if (isScale) {
        linkRefText = selectedScaleId === 'scale_allergen_44' ? '< 0.35 (Độ 0)' : '< 0.34 (Độ 0)';
      } else if (newLinkRefMin !== '' && newLinkRefMax !== '') {
        linkRefText = `${newLinkRefMin} - ${newLinkRefMax}`;
      } else if (newLinkRefMin !== '') {
        linkRefText = `>= ${newLinkRefMin}`;
      } else if (newLinkRefMax !== '') {
        linkRefText = `<= ${newLinkRefMax}`;
      }
    }

    const newLink: CatalogItemEquipmentLink = {
      id: `cie_${configItem.code.toLowerCase()}_${eqId}_${Date.now()}`,
      catalogCode: configItem.code,
      equipmentId: eqId,
      refMin: !isScale && newLinkRefMin !== '' ? parseFloat(newLinkRefMin) : undefined,
      refMax: !isScale && newLinkRefMax !== '' ? parseFloat(newLinkRefMax) : undefined,
      unit: !isScale && newLinkUnit ? newLinkUnit : (isScale ? (selectedScaleId === 'scale_protia_91' || selectedScaleId === 'scale_allergen_44' ? 'IU/ml' : undefined) : undefined),
      refText: linkRefText || undefined,
      scaleId: isScale ? selectedScaleId : undefined,
      isDefault: isFirst || isNewEquipDefault
    };

    setCatalogItemEquipments((prev) => {
      let next = [...prev];
      if (newLink.isDefault) {
        next = next.map((l) => (l.catalogCode.toUpperCase() === configItem.code.toUpperCase() ? { ...l, isDefault: false } : l));
      }
      return [...next, newLink];
    });

    setSelectedEquipName('');
    setIsNewEquipDefault(false);
  };

  const handleRemoveEquipmentLink = (linkId: string) => {
    if (!setCatalogItemEquipments) return;
    if (window.confirm('Bạn có chắc muốn xóa cấu hình máy đo này khỏi chỉ số?')) {
      setCatalogItemEquipments((prev) => prev.filter((l) => l.id !== linkId));
    }
  };

  const handleSetDefaultEquipmentLink = (catalogCode: string, linkId: string) => {
    if (!setCatalogItemEquipments) return;
    setCatalogItemEquipments((prev) =>
      prev.map((l) => {
        if (l.catalogCode.toUpperCase() === catalogCode.toUpperCase()) {
          return { ...l, isDefault: l.id === linkId };
        }
        return l;
      })
    );
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
              className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-sky-500 text-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-sky-500 max-w-[150px] text-xs"
          >
            <option value="all">Tất cả nhóm ({items.length})</option>
            {groups.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>

          {(searchTerm || selectedGroup !== 'all' || viewFilter !== 'all') && (
            <span className="text-[11px] font-mono font-bold text-sky-800 bg-sky-100/90 border border-sky-200 px-2 py-1 rounded-lg shrink-0">
              {filteredItems.length}/{items.length}
            </span>
          )}
        </div>

        {/* Buttons: Add New & Excel Menu */}
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition active:scale-95 cursor-pointer text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Đóng Form' : 'Thêm Chỉ Số'}</span>
          </button>

          {/* Sleek Excel Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExcelDropdown(!showExcelDropdown)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition active:scale-95 cursor-pointer text-xs"
              title="Nhập / Xuất dữ liệu Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thao Tác Excel</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showExcelDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showExcelDropdown && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowExcelDropdown(false)}
                />
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Chỉ Số Xét Nghiệm
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      exportCatalogItemsTemplate(groups, items);
                      setShowExcelDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 transition cursor-pointer font-semibold"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Xuất Mẫu Chỉ Số (.xlsx)</span>
                  </button>
                  <label className="w-full px-3 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 transition cursor-pointer font-semibold">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nhập Chỉ Số Từ Excel</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        handleImportExcel(e);
                        setShowExcelDropdown(false);
                      }}
                      className="hidden"
                    />
                  </label>

                  <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-y border-slate-100 mt-1">
                    Cấu Hình Thiết Bị & Ngưỡng Đo
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      exportCatalogItemEquipmentsTemplate(items, equipments, catalogItemEquipments);
                      setShowExcelDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 flex items-center gap-2 transition cursor-pointer font-semibold"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Xuất Cấu Hình Máy Đo (.xlsx)</span>
                  </button>
                  <label className="w-full px-3 py-2 text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 flex items-center gap-2 transition cursor-pointer font-semibold">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Nhập Cấu Hình Từ Excel</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        handleImportEquipmentLinksExcel(e);
                        setShowExcelDropdown(false);
                      }}
                      className="hidden"
                    />
                  </label>

                  <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-y border-slate-100 mt-1">
                    Khôi Phục & Đồng Bộ
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExcelDropdown(false);
                      handleRestoreOriginalCatalog();
                    }}
                    className="w-full px-3 py-2 text-left text-amber-800 hover:bg-amber-50 flex items-center gap-2 transition cursor-pointer font-semibold"
                    title="Khôi phục lại toàn bộ danh mục chỉ số chuẩn gốc từ Cloud DB"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Khôi Phục 179 Chỉ Số Gốc</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Form Thêm Chỉ Số Nhanh (Collapsible) */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-200 text-xs space-y-2.5 animate-in fade-in duration-100 shadow-xs">
          <div className="font-extrabold text-sky-900 flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-sky-600" />
              Thêm Chỉ Số Xét Nghiệm Mới
            </span>
            <div className="flex items-center bg-sky-200/70 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setQuickAddEvalMode('RANGE')}
                className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                  quickAddEvalMode === 'RANGE'
                    ? 'bg-white text-sky-900 shadow-xs'
                    : 'text-sky-700 hover:text-sky-900'
                }`}
              >
                Khoảng Min - Max
              </button>
              <button
                type="button"
                onClick={() => setQuickAddEvalMode('SCALE')}
                className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                  quickAddEvalMode === 'SCALE'
                    ? 'bg-white text-sky-900 shadow-xs'
                    : 'text-sky-700 hover:text-sky-900'
                }`}
              >
                Thang Đo Phân Độ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2.5">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-0.5">MÃ CODE *</label>
              <input
                type="text"
                value={newItem.code}
                onChange={(e) => setNewItem({ ...newItem, code: e.target.value.toUpperCase() })}
                placeholder="VD: GLU"
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold uppercase text-xs"
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
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-xs"
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
                placeholder={quickAddEvalMode === 'SCALE' ? 'IU/ml' : 'VD: mmol/L'}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-xs"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-0.5">GIÁ THU (Đ)</label>
              <input
                type="number"
                value={newItem.price || ''}
                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                placeholder="VD: 35000"
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-emerald-700 text-xs"
              />
            </div>

            {/* Khởi tạo liên kết máy đo đầu tiên */}
            <div className="col-span-4 bg-white/80 p-2 rounded-lg border border-sky-100">
              <label className="block font-bold text-sky-900 mb-1">MÁY ĐO BAN ĐẦU (TÙY CHỌN)</label>
              <select
                value={initialEquipId}
                onChange={(e) => setInitialEquipId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
              >
                <option value="">-- Chọn máy đo áp dụng --</option>
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                ))}
              </select>
            </div>

            {quickAddEvalMode === 'RANGE' ? (
              <>
                <div className="col-span-2 bg-white/80 p-2 rounded-lg border border-sky-100">
                  <label className="block font-bold text-sky-900 mb-1">NGƯỠNG MIN</label>
                  <input
                    type="number"
                    step="any"
                    value={newItem.refMin ?? ''}
                    onChange={(e) => setNewItem({ ...newItem, refMin: e.target.value !== '' ? parseFloat(e.target.value) : null })}
                    placeholder="VD: 3.9"
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                  />
                </div>
                <div className="col-span-2 bg-white/80 p-2 rounded-lg border border-sky-100">
                  <label className="block font-bold text-sky-900 mb-1">NGƯỠNG MAX</label>
                  <input
                    type="number"
                    step="any"
                    value={newItem.refMax ?? ''}
                    onChange={(e) => setNewItem({ ...newItem, refMax: e.target.value !== '' ? parseFloat(e.target.value) : null })}
                    placeholder="VD: 6.4"
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                  />
                </div>
                <div className="col-span-4 bg-white/80 p-2 rounded-lg border border-sky-100">
                  <label className="block font-bold text-sky-900 mb-1">
                    TEXT THAM CHIẾU <span className="text-[10px] text-slate-500 font-normal">(Tự động tạo - K cần nhập)</span>
                  </label>
                  <input
                    type="text"
                    value={newItem.refText || ''}
                    onChange={(e) => setNewItem({ ...newItem, refText: e.target.value })}
                    placeholder={newItem.refMin != null && newItem.refMax != null ? `Tự động: ${newItem.refMin} - ${newItem.refMax}` : 'Tự động tạo từ Min-Max'}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                  />
                </div>
              </>
            ) : (
              <div className="col-span-8 bg-white/80 p-2 rounded-lg border border-sky-100">
                <label className="block font-bold text-sky-900 mb-1">CHỌN THANG ĐO PHÂN ĐỘ</label>
                <select
                  value={quickAddScaleId}
                  onChange={(e) => setQuickAddScaleId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800 text-xs"
                >
                  {scales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.levels.length} bậc) [{s.unit || 'IU/ml'}]
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-sky-200/60">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold cursor-pointer text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold shadow-xs cursor-pointer text-xs"
            >
              Lưu Chỉ Số
            </button>
          </div>
        </form>
      )}

      {/* Bảng Danh Sách Chỉ Số Thống Nhất */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex-grow bg-white flex flex-col">
        <div className="max-h-[520px] overflow-y-auto flex-grow">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10">
              <tr>
                <th className="p-2.5 w-10 text-center">STT</th>
                <th className="p-2.5 w-20">MÃ CODE</th>
                <th className="p-2.5 min-w-[160px]">TÊN CHỈ SỐ</th>
                <th className="p-2.5 min-w-[130px]">TÊN KHOA HỌC / ALLERGEN</th>
                <th className="p-2.5 w-36">NHÓM XÉT NGHIỆM</th>
                <th className="p-2.5 min-w-[200px]">MÁY ĐO & THAM CHIẾU / THANG ĐO</th>
                <th className="p-2.5 w-20 text-center">ĐƠN VỊ</th>
                <th className="p-2.5 w-24 text-right">GIÁ THU (Đ)</th>
                <th className="p-2.5 w-10 text-center">XÓA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    Không tìm thấy chỉ số xét nghiệm phù hợp
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isAllergen = isAllergenItem(item);
                  const itemLinks = getLinksForCode(item.code);
                  const defaultLink = itemLinks.find((l) => l.isDefault) || itemLinks[0];
                  const defaultScale = defaultLink?.scaleId ? getAllergenScaleById(defaultLink.scaleId, scales) : undefined;

                  const displayUnit = item.unit || defaultLink?.unit || defaultScale?.unit || '---';

                  return (
                    <tr key={item.code} className="hover:bg-slate-50/80 transition">
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

                      {/* Cột Cấu Hình Máy Đo & Ngưỡng Tham Chiếu Đa Thiết Bị */}
                      <td className="p-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {itemLinks.length > 0 ? (
                            itemLinks.slice(0, 2).map((link) => {
                              const eq = equipments.find((e) => e.id === link.equipmentId);
                              const refLabel = link.refText || (link.refMin != null || link.refMax != null ? `${link.refMin ?? '?'} - ${link.refMax ?? '?'}` : null);
                              return (
                                <span
                                  key={link.id}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border ${
                                    link.isDefault
                                      ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                  title={`Máy: ${eq?.name || link.equipmentId} • Ngưỡng: ${refLabel || link.scaleId || 'Mặc định'}`}
                                >
                                  {link.isDefault && <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />}
                                  <span className="truncate max-w-[90px]">{eq?.name || 'Máy đo'}</span>
                                  {refLabel && <span className="text-[10px] text-slate-400 font-mono">[{refLabel}]</span>}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa gán máy đo</span>
                          )}

                          {itemLinks.length > 2 && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1 py-0.5 rounded">
                              +{itemLinks.length - 2}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenConfigModal(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-lg transition active:scale-95 cursor-pointer ml-auto"
                            title="Quản lý các loại máy đo áp dụng cho chỉ số này"
                          >
                            <Settings2 className="w-3 h-3 text-sky-600" />
                            <span>Cấu hình ({itemLinks.length})</span>
                          </button>
                        </div>
                      </td>

                      <td className="p-2 text-center font-mono font-bold text-slate-700">
                        {displayUnit}
                      </td>

                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={item.price || ''}
                          onChange={(e) => handleItemChange(item.code, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent border-0 text-right font-mono font-bold text-emerald-700 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.code)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                          title="Xóa chỉ số"
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

      {/* MODAL CẤU HÌNH THIẾT BỊ ĐO CHO CHỈ SỐ (MULTI-EQUIPMENT MANAGER MODAL) */}
      {configItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm flex items-center gap-2">
                    Cấu Hình Thiết Bị & Ngưỡng Đo
                    <span className="font-mono bg-sky-500/30 text-sky-200 px-1.5 py-0.5 rounded text-xs">
                      [{configItem.code}]
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">{configItem.name}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfigItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nội dung danh sách máy đo hiện có */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs flex-grow">
              <div>
                <span className="font-bold text-slate-700 block mb-2">
                  Danh sách máy đo áp dụng cho chỉ số này ({getLinksForCode(configItem.code).length}):
                </span>

                {getLinksForCode(configItem.code).length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-400">
                    Chỉ số này chưa được gán loại máy đo cụ thể nào. Vui lòng thêm bên dưới.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getLinksForCode(configItem.code).map((link) => {
                      const eq = equipments.find((e) => e.id === link.equipmentId);
                      const scale = link.scaleId ? getAllergenScaleById(link.scaleId, scales) : undefined;
                      const refLabel = link.refText || (link.refMin != null || link.refMax != null
                        ? `${link.refMin ?? '?'} - ${link.refMax ?? '?'} ${link.unit || ''}`.trim()
                        : null);

                      return (
                        <div
                          key={link.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                            link.isDefault
                              ? 'bg-amber-50/60 border-amber-300 shadow-xs ring-1 ring-amber-200'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                {eq?.name || link.equipmentId}
                              </span>
                              {link.isDefault ? (
                                <span className="inline-flex items-center gap-1 bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded shadow-2xs">
                                  <Star className="w-2.5 h-2.5 fill-white" /> Mặc Định
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultEquipmentLink(configItem.code, link.id)}
                                  className="text-[10px] font-bold text-slate-500 hover:text-amber-700 bg-slate-100 hover:bg-amber-100 px-1.5 py-0.5 rounded cursor-pointer transition"
                                >
                                  Đặt làm mặc định
                                </button>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              {scale ? (
                                <span>
                                  Thang đo dị nguyên: <strong className="text-red-800">{scale.name}</strong> ({scale.unit})
                                </span>
                              ) : refLabel ? (
                                <span>
                                  Ngưỡng tham chiếu: <strong className="text-sky-800">{refLabel}</strong>
                                  {link.unit && !link.refText && <span className="ml-1 text-slate-400">({link.unit})</span>}
                                </span>
                              ) : (
                                <span className="italic text-slate-400">Chưa có ngưỡng riêng</span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveEquipmentLink(link.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            title="Xóa máy này khỏi chỉ số"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Gán Thêm Máy Đo */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-slate-800 text-xs">
                    + Gán Thêm Máy Đo Mới Cho Chỉ Số Này
                  </span>

                  {/* Mode Switcher: Khoảng Min-Max vs Thang Đo Phân Độ */}
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setNewEvalMode('RANGE')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                        newEvalMode === 'RANGE'
                          ? 'bg-white text-sky-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Khoảng Đo Min - Max</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewEvalMode('SCALE')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                        newEvalMode === 'SCALE'
                          ? 'bg-white text-sky-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Thang Đo / Phân Độ</span>
                    </button>
                  </div>
                </div>

                {newEvalMode === 'RANGE' ? (
                  <div className="grid grid-cols-12 gap-2.5">
                    <div className="col-span-12 sm:col-span-4">
                      <label className="block font-bold text-slate-700 mb-1">CHỌN HOẶC NHẬP MÁY ĐO *</label>
                      <EquipmentSearchCombobox
                        value={selectedEquipName}
                        onChange={setSelectedEquipName}
                        equipments={equipments}
                        onCreateEquipment={onCreateEquipment}
                        onDeleteEquipment={onDeleteEquipment}
                        placeholder="Chọn máy đo..."
                        compact
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">MIN</label>
                      <input
                        type="number"
                        step="any"
                        value={newLinkRefMin}
                        onChange={(e) => setNewLinkRefMin(e.target.value)}
                        placeholder={configItem.refMin != null ? String(configItem.refMin) : 'VD: 3.9'}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">MAX</label>
                      <input
                        type="number"
                        step="any"
                        value={newLinkRefMax}
                        onChange={(e) => setNewLinkRefMax(e.target.value)}
                        placeholder={configItem.refMax != null ? String(configItem.refMax) : 'VD: 6.4'}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">ĐƠN VỊ</label>
                      <input
                        type="text"
                        value={newLinkUnit}
                        onChange={(e) => setNewLinkUnit(e.target.value)}
                        placeholder={configItem.unit || 'VD: mmol/L'}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="col-span-12 sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        TEXT THAM CHIẾU <span className="text-[10px] text-slate-400 font-normal">(Tự động tạo)</span>
                      </label>
                      <input
                        type="text"
                        value={newLinkRefText}
                        onChange={(e) => setNewLinkRefText(e.target.value)}
                        placeholder={newLinkRefMin && newLinkRefMax ? `Tự động: ${newLinkRefMin} - ${newLinkRefMax}` : 'Tự động'}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-sky-500"
                        title="Tùy chọn: Tự động tính toán từ Min-Max nếu để trống"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-2.5">
                    <div className="col-span-12 sm:col-span-5">
                      <label className="block font-bold text-slate-700 mb-1">CHỌN HOẶC NHẬP MÁY ĐO *</label>
                      <EquipmentSearchCombobox
                        value={selectedEquipName}
                        onChange={setSelectedEquipName}
                        equipments={equipments}
                        onCreateEquipment={onCreateEquipment}
                        onDeleteEquipment={onDeleteEquipment}
                        placeholder="Chọn máy đo..."
                        compact
                      />
                    </div>

                    <div className="col-span-12 sm:col-span-7">
                      <label className="block font-bold text-slate-700 mb-1">CHỌN THANG ĐO PHÂN ĐỘ</label>
                      <select
                        value={selectedScaleId}
                        onChange={(e) => setSelectedScaleId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:outline-none focus:border-sky-500"
                      >
                        {scales.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.levels.length} bậc) [{s.unit || 'IU/ml'}]
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isNewEquipDefault}
                      onChange={(e) => setIsNewEquipDefault(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Đặt máy này làm máy mặc định</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddEquipmentLinkToItem}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-xs transition active:scale-95 cursor-pointer text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Máy Đo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setConfigItem(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
