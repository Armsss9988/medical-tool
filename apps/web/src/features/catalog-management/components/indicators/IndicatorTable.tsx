import { useState, useMemo, useRef, useEffect } from 'react';
import { CatalogItem, CatalogItemEquipmentLink, TestGroup, TestEquipment, AllergenGradingScale, removeVietnameseTones } from '@domain';
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
  const [isQuickEditMode, setIsQuickEditMode] = useState(false);

  // Search input ref for quick keyboard focus (/ or Ctrl+F)
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [configItem, setConfigItem] = useState<CatalogItem | null>(null);

  // Keyboard shortcut Ctrl+F / '/' để nhảy vào ô tìm kiếm nhanh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.tagName === 'SELECT';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isAllergenItem = (item: CatalogItem) =>
    Boolean((item.category && item.category.includes('Dị Nguyên')) || item.unit === 'IU/mL' || item.scaleId);

  const allergenCount = useMemo(() => items.filter(isAllergenItem).length, [items]);
  const generalCount = useMemo(() => items.filter((i) => !isAllergenItem(i)).length, [items]);

  // Tìm kiếm thông minh hỗ trợ cả tiếng Việt có dấu và không dấu
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const termClean = removeVietnameseTones(term);

    const list = items.filter((i) => {
      const isAllergen = isAllergenItem(i);
      if (viewFilter === 'general' && isAllergen) return false;
      if (viewFilter === 'allergen' && !isAllergen) return false;

      const matchGroup = selectedGroup === 'all' || i?.category === selectedGroup;
      if (!matchGroup) return false;

      if (!term) return true;

      const codeLower = String(i?.code || '').toLowerCase();
      const nameLower = String(i?.name || '').toLowerCase();
      const nameClean = removeVietnameseTones(nameLower);
      const sciLower = String(i?.scientific || '').toLowerCase();
      const sciClean = removeVietnameseTones(sciLower);
      const catLower = String(i?.category || '').toLowerCase();
      const catClean = removeVietnameseTones(catLower);

      return (
        codeLower.includes(term) ||
        nameLower.includes(term) ||
        nameClean.includes(termClean) ||
        sciLower.includes(term) ||
        sciClean.includes(termClean) ||
        catLower.includes(term) ||
        catClean.includes(termClean)
      );
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
      const raw = link.catalogCode || (link as unknown as { catalog_code?: string }).catalog_code;
      if (!raw) continue;
      const key = raw.toUpperCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [catalogItemEquipments]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (item: CatalogItem) => {
    const itemLinks = catalogItemEquipments.filter(
      (cie) => ((cie.catalogCode || (cie as unknown as { catalog_code?: string }).catalog_code || '')).toUpperCase() === item.code.toUpperCase()
    );
    const defaultLink = itemLinks.find((l) => l.isDefault) || itemLinks[0];
    const matchedEq = defaultLink ? equipments.find((e) => e.id === defaultLink.equipmentId) : null;

    const enrichedItem: CatalogItem = {
      ...item,
      equipment: item.equipment || matchedEq?.name || undefined,
      evaluationType: item.evaluationType || defaultLink?.evaluationType || undefined,
      unit: item.unit || defaultLink?.unit || '',
      refMin: item.refMin !== undefined && item.refMin !== null ? item.refMin : (defaultLink?.refMin ?? null),
      refMax: item.refMax !== undefined && item.refMax !== null ? item.refMax : (defaultLink?.refMax ?? null),
      refText: item.refText || defaultLink?.refText || '',
      scaleId: item.scaleId || defaultLink?.scaleId || undefined
    };
    setEditingItem(enrichedItem);
    setFormModalOpen(true);
  };

  // Nhân bản nhanh chỉ số để tạo xét nghiệm tương tự mà không cần gõ lại
  const handleDuplicateItem = (item: CatalogItem) => {
    let newCode = `${item.code}_COPY`;
    let counter = 1;
    while (items.some((i) => i.code.toUpperCase() === newCode.toUpperCase())) {
      counter++;
      newCode = `${item.code}_COPY${counter}`;
    }
    const dupItem: CatalogItem = {
      ...item,
      code: newCode,
      name: `${item.name} (Bản sao)`
    };
    setEditingItem(dupItem);
    setFormModalOpen(true);
    showToast?.(`Đang nhân bản từ chỉ số [${item.code}]. Vui lòng điều chỉnh thông tin nếu cần.`, 'info');
  };

  // Sửa nhanh trực tiếp tại ô trên bảng
  const handleQuickUpdateItem = (code: string, updates: Partial<CatalogItem>) => {
    const upperCode = code.toUpperCase();
    setItems((prev) =>
      prev.map((it) => {
        if (it.code.toUpperCase() === upperCode) {
          return { ...it, ...updates };
        }
        return it;
      })
    );

    // Đồng bộ sang liên kết thiết bị mặc định trong catalogItemEquipments
    if (setCatalogItemEquipments) {
      const hasDeviceFields = 'unit' in updates || 'refMin' in updates || 'refMax' in updates || 'refText' in updates || 'scaleId' in updates;
      if (hasDeviceFields) {
        setCatalogItemEquipments((prev) =>
          prev.map((cie) => {
            if (cie.catalogCode.toUpperCase() === upperCode && cie.isDefault) {
              return {
                ...cie,
                unit: 'unit' in updates ? (updates.unit || null) : cie.unit,
                refMin: 'refMin' in updates ? (updates.refMin ?? null) : cie.refMin,
                refMax: 'refMax' in updates ? (updates.refMax ?? null) : cie.refMax,
                refText: 'refText' in updates ? (updates.refText || null) : cie.refText,
                scaleId: 'scaleId' in updates ? (updates.scaleId || null) : cie.scaleId
              };
            }
            return cie;
          })
        );
      }
    }
  };

  // Đổi nhanh máy đo trên bảng
  const handleQuickUpdateEquipment = (code: string, equipId: string | null) => {
    const upperCode = code.toUpperCase();
    const currentItem = items.find((i) => i.code.toUpperCase() === upperCode);
    const eq = equipments.find((e) => e.id === equipId);
    
    // Cập nhật tên thiết bị trên item
    handleQuickUpdateItem(code, {
      equipment: eq?.name || ''
    });

    if (setCatalogItemEquipments) {
      setCatalogItemEquipments((prev) => {
        if (!equipId) {
          // Gỡ bỏ cờ mặc định của tất cả link thiết bị thuộc chỉ số này
          return prev.map((cie) =>
            cie.catalogCode.toUpperCase() === upperCode ? { ...cie, isDefault: false } : cie
          );
        }

        const isScale = currentItem?.evaluationType === 'scale' || Boolean(currentItem?.scaleId);
        const exists = prev.some(
          (cie) => cie.catalogCode.toUpperCase() === upperCode && cie.equipmentId === equipId
        );

        if (exists) {
          // Link đã có -> bật isDefault, đồng thời cập nhật dải đo từ item nếu link đó chưa có dải đo
          return prev.map((cie) => {
            if (cie.catalogCode.toUpperCase() !== upperCode) return cie;
            if (cie.equipmentId === equipId) {
              return {
                ...cie,
                refMin: cie.refMin ?? (!isScale ? (currentItem?.refMin ?? null) : null),
                refMax: cie.refMax ?? (!isScale ? (currentItem?.refMax ?? null) : null),
                unit: cie.unit || currentItem?.unit || null,
                refText: cie.refText || currentItem?.refText || null,
                scaleId: cie.scaleId || currentItem?.scaleId || null,
                isDefault: true
              };
            }
            return { ...cie, isDefault: false };
          });
        }

        // Link chưa có -> tạo mới với dải đo kế thừa từ item hiện tại
        const newLink: CatalogItemEquipmentLink = {
          id: `cie_${code.toLowerCase()}_${equipId}`,
          catalogCode: upperCode,
          equipmentId: equipId,
          evaluationType: currentItem?.evaluationType || (isScale ? 'scale' : 'range'),
          refMin: !isScale ? (currentItem?.refMin ?? null) : null,
          refMax: !isScale ? (currentItem?.refMax ?? null) : null,
          unit: currentItem?.unit || null,
          refText: currentItem?.refText || null,
          scaleId: currentItem?.scaleId || null,
          isDefault: true
        };

        const resetOld = prev.map((cie) =>
          cie.catalogCode.toUpperCase() === upperCode ? { ...cie, isDefault: false } : cie
        );
        return [...resetOld, newLink];
      });
    }
  };

  // Cập nhật trường dữ liệu (unit, refMin, refMax, refText, evaluationType) của đúng một liên kết máy đo
  const handleUpdateEquipmentLink = (linkId: string, updates: Partial<CatalogItemEquipmentLink>) => {
    if (!setCatalogItemEquipments) return;
    let targetCatalogCode = '';
    let isTargetDefault = false;

    setCatalogItemEquipments((prev) =>
      prev.map((cie) => {
        if (cie.id === linkId) {
          targetCatalogCode = cie.catalogCode;
          isTargetDefault = Boolean(cie.isDefault);
          return { ...cie, ...updates };
        }
        return cie;
      })
    );

    // Nếu liên kết này là mặc định, đồng bộ các trường hiển thị sang items
    if (targetCatalogCode && isTargetDefault) {
      setItems((prev) =>
        prev.map((it) => {
          if (it.code.toUpperCase() === targetCatalogCode.toUpperCase()) {
            return {
              ...it,
              evaluationType: 'evaluationType' in updates ? (updates.evaluationType || it.evaluationType) : it.evaluationType,
              unit: 'unit' in updates ? (updates.unit || '') : it.unit,
              refMin: 'refMin' in updates ? (updates.refMin ?? null) : it.refMin,
              refMax: 'refMax' in updates ? (updates.refMax ?? null) : it.refMax,
              refText: 'refText' in updates ? (updates.refText || '') : it.refText,
              scaleId: 'scaleId' in updates ? (updates.scaleId || undefined) : it.scaleId
            };
          }
          return it;
        })
      );
    }
  };

  // Đặt một liên kết máy đo làm mặc định cho chỉ số
  const handleSetDefaultEquipmentLink = (code: string, linkId: string) => {
    const upperCode = code.toUpperCase();
    let selectedLink: CatalogItemEquipmentLink | undefined;

    if (setCatalogItemEquipments) {
      setCatalogItemEquipments((prev) =>
        prev.map((cie) => {
          if (cie.catalogCode.toUpperCase() !== upperCode) return cie;
          const isDef = cie.id === linkId;
          if (isDef) selectedLink = { ...cie, isDefault: true };
          return { ...cie, isDefault: isDef };
        })
      );
    }

    if (selectedLink) {
      const eq = equipments.find((e) => e.id === selectedLink!.equipmentId);
      setItems((prev) =>
        prev.map((it) => {
          if (it.code.toUpperCase() === upperCode) {
            return {
              ...it,
              equipment: eq?.name || it.equipment,
              evaluationType: selectedLink!.evaluationType || it.evaluationType,
              unit: selectedLink!.unit || it.unit,
              refMin: selectedLink!.refMin !== undefined ? selectedLink!.refMin : it.refMin,
              refMax: selectedLink!.refMax !== undefined ? selectedLink!.refMax : it.refMax,
              refText: selectedLink!.refText || it.refText,
              scaleId: selectedLink!.scaleId || it.scaleId
            };
          }
          return it;
        })
      );
    }
  };

  // Gán thêm một máy đo mới cho chỉ số
  const handleAddEquipmentLink = (code: string, equipmentId: string) => {
    if (!setCatalogItemEquipments) return;
    const upperCode = code.toUpperCase();
    const currentItem = items.find((i) => i.code.toUpperCase() === upperCode);
    const eq = equipments.find((e) => e.id === equipmentId);
    if (!eq) return;

    setCatalogItemEquipments((prev) => {
      const existing = prev.filter((cie) => cie.catalogCode.toUpperCase() === upperCode);
      if (existing.some((cie) => cie.equipmentId === equipmentId)) {
        showToast?.(`Máy đo "${eq.name}" đã được gán cho chỉ số ${code}`, 'warning');
        return prev;
      }

      const isFirst = existing.length === 0;
      const isScale = currentItem?.evaluationType === 'scale' || Boolean(currentItem?.scaleId);
      const newLink: CatalogItemEquipmentLink = {
        id: `cie_${code.toLowerCase()}_${equipmentId}_${Date.now()}`,
        catalogCode: upperCode,
        equipmentId: equipmentId,
        evaluationType: currentItem?.evaluationType || (isScale ? 'scale' : 'range'),
        refMin: !isScale ? (currentItem?.refMin ?? null) : null,
        refMax: !isScale ? (currentItem?.refMax ?? null) : null,
        unit: currentItem?.unit || null,
        refText: currentItem?.refText || null,
        scaleId: currentItem?.scaleId || null,
        isDefault: isFirst
      };

      if (isFirst) {
        setItems((p) =>
          p.map((it) => (it.code.toUpperCase() === upperCode ? { ...it, equipment: eq.name } : it))
        );
      }

      showToast?.(`Đã gán thêm máy "${eq.name}" cho chỉ số ${code}`, 'success');
      return [...prev, newLink];
    });
  };

  // Hủy gán một máy đo khỏi chỉ số
  const handleRemoveEquipmentLink = (linkId: string) => {
    if (!setCatalogItemEquipments) return;
    let targetCode = '';
    let wasDefault = false;

    setCatalogItemEquipments((prev) => {
      const target = prev.find((cie) => cie.id === linkId);
      if (!target) return prev;
      targetCode = target.catalogCode.toUpperCase();
      wasDefault = Boolean(target.isDefault);

      const next = prev.filter((cie) => cie.id !== linkId);

      // Nếu xóa link mặc định và còn các link khác cho chỉ số này -> đặt link đầu tiên làm mặc định
      if (wasDefault) {
        const remainingForCode = next.filter((cie) => cie.catalogCode.toUpperCase() === targetCode);
        if (remainingForCode.length > 0) {
          remainingForCode[0].isDefault = true;
          const newDefEq = equipments.find((e) => e.id === remainingForCode[0].equipmentId);
          setItems((p) =>
            p.map((it) =>
              it.code.toUpperCase() === targetCode
                ? {
                    ...it,
                    equipment: newDefEq?.name || '',
                    unit: remainingForCode[0].unit || it.unit,
                    refMin: remainingForCode[0].refMin !== undefined ? remainingForCode[0].refMin : it.refMin,
                    refMax: remainingForCode[0].refMax !== undefined ? remainingForCode[0].refMax : it.refMax,
                    refText: remainingForCode[0].refText || it.refText
                  }
                : it
            )
          );
        } else {
          setItems((p) =>
            p.map((it) => (it.code.toUpperCase() === targetCode ? { ...it, equipment: '' } : it))
          );
        }
      }

      return next;
    });
    showToast?.('Đã gỡ máy đo khỏi chỉ số', 'info');
  };

  const handleOpenConfigEquipment = (item: CatalogItem) => {
    setConfigItem(item);
    setEquipmentModalOpen(true);
  };

  const handleSaveItem = (saved: CatalogItem, initialEquipId?: string) => {
    const isEdit = items.some((i) => i.code === saved.code);
    const isScale = saved.evaluationType === 'scale';
    const isRange = saved.evaluationType === 'range';

    if (isEdit) {
      setItems((prev) => prev.map((i) => (i.code === saved.code ? saved : i)));
      if (setCatalogItemEquipments && initialEquipId) {
        setCatalogItemEquipments((prev) => {
          const upper = saved.code.toUpperCase();
          const exists = prev.some((l) => l.catalogCode.toUpperCase() === upper && l.equipmentId === initialEquipId);
          if (exists) {
            return prev.map((l) => {
              if (l.catalogCode.toUpperCase() !== upper) return l;
              if (l.equipmentId === initialEquipId) {
                return {
                  ...l,
                  evaluationType: saved.evaluationType,
                  refMin: isRange ? (saved.refMin ?? null) : null,
                  refMax: isRange ? (saved.refMax ?? null) : null,
                  unit: saved.unit || undefined,
                  refText: saved.refText || undefined,
                  scaleId: isScale ? saved.scaleId : undefined,
                  isDefault: true
                };
              }
              return { ...l, isDefault: false };
            });
          } else {
            const resetOld = prev.map((l) => (l.catalogCode.toUpperCase() === upper ? { ...l, isDefault: false } : l));
            const newLink: CatalogItemEquipmentLink = {
              id: `cie_${saved.code.toLowerCase()}_${initialEquipId}`,
              catalogCode: upper,
              equipmentId: initialEquipId,
              evaluationType: saved.evaluationType,
              refMin: isRange ? (saved.refMin ?? null) : null,
              refMax: isRange ? (saved.refMax ?? null) : null,
              unit: saved.unit || undefined,
              refText: saved.refText || undefined,
              scaleId: isScale ? saved.scaleId : undefined,
              isDefault: true
            };
            return [...resetOld, newLink];
          }
        });
      }
      showToast?.(`Đã cập nhật chỉ số [${saved.code}]`, 'success');
    } else {
      setItems((prev) => [saved, ...prev]);
      if (setCatalogItemEquipments && initialEquipId) {
        const newLink: CatalogItemEquipmentLink = {
          id: `cie_${saved.code.toLowerCase()}_${initialEquipId}`,
          catalogCode: saved.code.toUpperCase(),
          equipmentId: initialEquipId,
          evaluationType: saved.evaluationType,
          refMin: isRange ? (saved.refMin ?? null) : null,
          refMax: isRange ? (saved.refMax ?? null) : null,
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
        setCatalogItemEquipments((prev) => prev.filter((cie) => ((cie.catalogCode || (cie as unknown as { catalog_code?: string }).catalog_code || '')).toUpperCase() !== code.toUpperCase()));
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
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50 overflow-hidden">
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
        isQuickEditMode={isQuickEditMode}
        onToggleQuickEditMode={() => setIsQuickEditMode((prev) => !prev)}
        searchInputRef={searchInputRef}
        onAddNew={handleOpenAdd}
        onExportExcel={exportCatalogItemsTemplate}
        onImportExcel={handleImportExcel}
        onDownloadTemplate={exportCatalogItemsTemplate}
      />

      <div className="flex-1 min-h-0 overflow-auto p-2 sm:p-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px]">
              <tr>
                <th className="p-2 text-center w-10">#</th>
                <th className="p-2 w-24">Mã Chỉ Số</th>
                <th className="p-2">Tên Chỉ Số & Tên Khoa Học</th>
                <th className="p-2 w-28">Nhóm</th>
                <th className="p-2 text-center w-24">Đơn Vị</th>
                <th className="p-2 w-40">Khoảng Tham Chiếu</th>
                <th className="p-2 text-right w-32">Đơn Giá (VNĐ)</th>
                <th className="p-2 w-44">Máy Đo Gán</th>
                <th className="p-2 text-center w-24">Thao Tác</th>
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
                    isQuickEditMode={isQuickEditMode}
                    groups={groups}
                    equipments={equipments}
                    catalogItemEquipments={catalogItemEquipments}
                    onEdit={handleOpenEdit}
                    onDuplicate={handleDuplicateItem}
                    onConfigEquipment={handleOpenConfigEquipment}
                    onDelete={handleDeleteItem}
                    onQuickUpdate={handleQuickUpdateItem}
                    onQuickUpdateEquipment={handleQuickUpdateEquipment}
                    onUpdateEquipmentLink={handleUpdateEquipmentLink}
                    onSetDefaultEquipmentLink={handleSetDefaultEquipmentLink}
                    onAddEquipmentLink={handleAddEquipmentLink}
                    onRemoveEquipmentLink={handleRemoveEquipmentLink}
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
        catalogItemEquipments={catalogItemEquipments}
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
