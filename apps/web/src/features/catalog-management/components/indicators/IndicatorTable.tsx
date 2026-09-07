import { useState, useMemo } from 'react';
import { CatalogItem, CatalogItemEquipmentLink, TestGroup, TestEquipment, AllergenGradingScale } from '@domain/types';
import { exportCatalogItemsTemplate, parseExcelCatalog } from '@infra/excelService';
import { IndicatorFilterBar } from './IndicatorFilterBar';
import { IndicatorTableRow } from './IndicatorTableRow';
import { IndicatorFormModal } from './IndicatorFormModal';
import { IndicatorEquipmentModal } from './IndicatorEquipmentModal';

function parseAllergenOrder(code: string): number {
  const m = code.match(/\d+/);
  return m ? parseInt(m[0], 10) : 999;
}

interface IndicatorTableProps {
  items: CatalogItem[];
  setItems: React.Dispatch<React.SetStateAction<CatalogItem[]>>;
  groups: TestGroup[];
  equipments: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  setCatalogItemEquipments?: React.Dispatch<React.SetStateAction<CatalogItemEquipmentLink[]>>;
  scales?: AllergenGradingScale[];
  showToast?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function IndicatorTable({
  items,
  setItems,
  groups,
  equipments,
  catalogItemEquipments = [],
  setCatalogItemEquipments,
  scales = [],
  showToast
}: IndicatorTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<'all' | 'general' | 'allergen'>('all');

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [configItem, setConfigItem] = useState<CatalogItem | null>(null);

  const isAllergenItem = (item: CatalogItem) =>
    Boolean((item.category && item.category.includes('Dị Nguyên')) || item.unit === 'IU/mL' || item.scaleId);

  const allergenCount = useMemo(() => items.filter(isAllergenItem).length, [items]);
  const generalCount = useMemo(() => items.filter((i) => !isAllergenItem(i)).length, [items]);

  const filteredItems = useMemo(() => {
    const list = items.filter((i) => {
      const isAllergen = isAllergenItem(i);
      if (viewFilter === 'general' && isAllergen) return false;
      if (viewFilter === 'allergen' && !isAllergen) return false;

      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        String(i?.name || '').toLowerCase().includes(term) ||
        String(i?.code || '').toLowerCase().includes(term) ||
        (i?.scientific && String(i.scientific).toLowerCase().includes(term));
      const matchGroup = selectedGroup === 'all' || i?.category === selectedGroup;

      return matchSearch && matchGroup;
    });

    if (viewFilter === 'allergen') {
      return [...list].sort((a, b) => parseAllergenOrder(a.code) - parseAllergenOrder(b.code));
    }
    return list;
  }, [items, viewFilter, searchTerm, selectedGroup]);

  // Đếm số máy đo đang gán cho từng chỉ số
  const equipmentCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const link of catalogItemEquipments) {
      const key = link.catalogCode.toUpperCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [catalogItemEquipments]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleOpenConfigEquipment = (item: CatalogItem) => {
    setConfigItem(item);
    setEquipmentModalOpen(true);
  };

  const handleSaveItem = (saved: CatalogItem, initialEquipId?: string) => {
    const isEdit = items.some((i) => i.code === saved.code);
    if (isEdit) {
      setItems((prev) => prev.map((i) => (i.code === saved.code ? saved : i)));
      showToast?.(`Đã cập nhật chỉ số [${saved.code}]`, 'success');
    } else {
      setItems((prev) => [saved, ...prev]);
      if (setCatalogItemEquipments && initialEquipId) {
        const isScale = saved.evaluationType === 'scale';
        const newLink: CatalogItemEquipmentLink = {
          id: `cie_${saved.code.toLowerCase()}_${initialEquipId}`,
          catalogCode: saved.code.toUpperCase(),
          equipmentId: initialEquipId,
          refMin: !isScale ? (saved.refMin ?? null) : undefined,
          refMax: !isScale ? (saved.refMax ?? null) : undefined,
          unit: saved.unit || undefined,
          refText: saved.refText || undefined,
          scaleId: isScale ? saved.scaleId : undefined,
          isDefault: true
        };
        setCatalogItemEquipments((prev) => [...prev, newLink]);
      }
      showToast?.(`Đã thêm mới chỉ số [${saved.code}]`, 'success');
    }
  };

  const handleDeleteItem = (code: string) => {
    if (confirm(`Bạn có chắc muốn xóa chỉ số [${code}] khỏi danh mục?`)) {
      setItems((prev) => prev.filter((i) => i.code !== code));
      if (setCatalogItemEquipments) {
        setCatalogItemEquipments((prev) => prev.filter((cie) => cie.catalogCode !== code));
      }
      showToast?.(`Đã xóa chỉ số [${code}]`, 'info');
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelCatalog(file).then((parsed) => {
        if (parsed.length > 0) {
          setItems((prev) => {
            const map = new Map(prev.map((item) => [item.code.toUpperCase(), item]));
            parsed.forEach((newItem) => {
              const codeKey = newItem.code.toUpperCase();
              const existing = map.get(codeKey);
              map.set(codeKey, existing ? { ...existing, ...newItem } : newItem);
            });
            return Array.from(map.values());
          });
          showToast?.(`Đã nạp thành công ${parsed.length} chỉ số từ file Excel!`, 'success');
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <IndicatorFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedGroup={selectedGroup}
        onGroupChange={setSelectedGroup}
        groups={groups}
        viewFilter={viewFilter}
        onViewFilterChange={setViewFilter}
        totalCount={items.length}
        generalCount={generalCount}
        allergenCount={allergenCount}
        onAddNew={handleOpenAdd}
        onExportExcel={exportCatalogItemsTemplate}
        onImportExcel={handleImportExcel}
        onDownloadTemplate={exportCatalogItemsTemplate}
      />

      <div className="flex-1 overflow-auto p-3 sm:p-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
              <tr>
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5 w-24">Mã Chỉ Số</th>
                <th className="p-2.5">Tên Chỉ Số & Tên Khoa Học</th>
                <th className="p-2.5 w-32">Nhóm</th>
                <th className="p-2.5 text-center w-20">Đơn Vị</th>
                <th className="p-2.5 w-36">Khoảng Tham Chiếu</th>
                <th className="p-2.5 text-right w-28">Đơn Giá</th>
                <th className="p-2.5 w-40">Máy Đo Gán</th>
                <th className="p-2.5 text-center w-20">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Không tìm thấy chỉ số xét nghiệm nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <IndicatorTableRow
                    key={item.code}
                    index={idx}
                    item={item}
                    linkedCount={equipmentCountMap.get(item.code.toUpperCase()) || 0}
                    onEdit={handleOpenEdit}
                    onConfigEquipment={handleOpenConfigEquipment}
                    onDelete={handleDeleteItem}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <IndicatorFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        initialData={editingItem}
        existingItems={items}
        groups={groups}
        equipments={equipments}
        scales={scales}
        onSave={handleSaveItem}
      />

      <IndicatorEquipmentModal
        isOpen={equipmentModalOpen}
        onClose={() => setEquipmentModalOpen(false)}
        item={configItem}
        equipments={equipments}
        scales={scales}
        catalogItemEquipments={catalogItemEquipments}
        onSaveLinks={(links) => setCatalogItemEquipments?.(links)}
        showToast={showToast}
      />
    </div>
  );
}
