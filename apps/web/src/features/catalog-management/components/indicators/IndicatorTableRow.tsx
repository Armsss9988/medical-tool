import { useState } from 'react';
import { Edit2, Trash2, Cpu, Dna, FlaskConical, Copy, ChevronDown, Plus } from 'lucide-react';
import { CatalogItem, TestEquipment, TestGroup, CatalogItemEquipmentLink, EvaluationType, resolveTestEquipmentName } from '@domain/types';

interface IndicatorTableRowProps {
  index: number;
  item: CatalogItem;
  linkedCount: number;
  isQuickEditMode?: boolean;
  groups?: TestGroup[];
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  onEdit: (item: CatalogItem) => void;
  onDuplicate?: (item: CatalogItem) => void;
  onConfigEquipment: (item: CatalogItem) => void;
  onDelete: (code: string) => void;
  onQuickUpdate?: (code: string, updates: Partial<CatalogItem>) => void;
  onQuickUpdateEquipment?: (code: string, equipId: string | null) => void;
  onUpdateEquipmentLink?: (linkId: string, updates: Partial<CatalogItemEquipmentLink>) => void;
  onSetDefaultEquipmentLink?: (code: string, linkId: string) => void;
  onAddEquipmentLink?: (code: string, equipmentId: string) => void;
  onRemoveEquipmentLink?: (linkId: string) => void;
}

export function IndicatorTableRow({
  index,
  item,
  linkedCount,
  isQuickEditMode = false,
  groups = [],
  equipments = [],
  catalogItemEquipments = [],
  onEdit,
  onDuplicate,
  onConfigEquipment,
  onDelete,
  onQuickUpdate,
  onQuickUpdateEquipment,
  onUpdateEquipmentLink,
  onSetDefaultEquipmentLink,
  onAddEquipmentLink,
  onRemoveEquipmentLink
}: IndicatorTableRowProps) {
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedNewEquipId, setSelectedNewEquipId] = useState<string>('');

  // Lọc toàn bộ liên kết máy đo của chỉ số này
  const itemLinks = catalogItemEquipments.filter(
    (cie) => ((cie.catalogCode || (cie as unknown as { catalog_code?: string }).catalog_code || '')).toUpperCase() === (item.code || '').toUpperCase()
  );

  // Xác định máy đo đang được chọn để sửa nhanh trên dòng chính
  const defaultLink = itemLinks.find((cie) => cie.isDefault);
  const activeLink =
    itemLinks.find((l) => l.id === activeLinkId) ||
    defaultLink ||
    (itemLinks.length > 0 ? itemLinks[0] : null);

  const activeEqObj = activeLink ? equipments.find((e) => e.id === activeLink.equipmentId) : null;
  const isMultiDevice = itemLinks.length > 1;

  // Tên máy đo hiển thị ưu tiên:
  // 1. Máy đo từ liên kết activeLink / defaultLink trong catalogItemEquipments
  // 2. Tên máy đo lưu trong item.equipment (hoặc tra cứu theo ID/Code)
  // 3. Phân giải tự động qua resolveTestEquipmentName theo nhóm/danh mục
  const displayEquipmentName =
    activeEqObj?.name ||
    (item.equipment
      ? (equipments.find((e) => e.id === item.equipment || e.name === item.equipment || (e.code && e.code === item.equipment))?.name || item.equipment)
      : null) ||
    (defaultLink ? equipments.find((e) => e.id === defaultLink.equipmentId)?.name : null) ||
    (linkedCount > 0 ? resolveTestEquipmentName(item, equipments, catalogItemEquipments) : null);

  const currentEvalType = activeLink?.evaluationType || item.evaluationType || (activeLink?.scaleId || item.scaleId ? 'scale' : 'range');
  const isScale = currentEvalType === 'scale' || Boolean(activeLink?.scaleId || item.scaleId);
  const isDetection = currentEvalType === 'detection';

  // Dữ liệu đơn vị và tham chiếu theo máy đang chọn (hoặc từ item nếu chưa gán máy)
  const currentUnit = activeLink ? (activeLink.unit ?? item.unit ?? '') : (item.unit ?? '');
  const currentRefMin = activeLink ? (activeLink.refMin ?? item.refMin ?? null) : (item.refMin ?? null);
  const currentRefMax = activeLink ? (activeLink.refMax ?? item.refMax ?? null) : (item.refMax ?? null);
  const currentRefText = activeLink ? (activeLink.refText ?? item.refText ?? '') : (item.refText ?? '');

  const isTextMode =
    currentEvalType === 'text' ||
    (!isDetection && !isScale && currentRefMin == null && currentRefMax == null && Boolean(currentRefText && !currentRefText.includes('-')));

  const handleUpdateUnit = (newUnit: string) => {
    if (activeLink && onUpdateEquipmentLink) {
      onUpdateEquipmentLink(activeLink.id, { unit: newUnit });
    } else {
      onQuickUpdate?.(item.code, { unit: newUnit });
    }
  };

  const handleUpdateRefMin = (val: string) => {
    const newMin = val === '' ? null : Number(val);
    const currentMax = currentRefMax;
    let newText = '';
    if (newMin != null && currentMax != null) newText = `${newMin} - ${currentMax}`;
    else if (newMin != null) newText = `>= ${newMin}`;
    else if (currentMax != null) newText = `<= ${currentMax}`;

    if (activeLink && onUpdateEquipmentLink) {
      onUpdateEquipmentLink(activeLink.id, { refMin: newMin, refText: newText });
    } else {
      onQuickUpdate?.(item.code, { refMin: newMin, refText: newText, evaluationType: 'range' });
    }
  };

  const handleUpdateRefMax = (val: string) => {
    const currentMin = currentRefMin;
    const newMax = val === '' ? null : Number(val);
    let newText = '';
    if (currentMin != null && newMax != null) newText = `${currentMin} - ${newMax}`;
    else if (currentMin != null) newText = `>= ${currentMin}`;
    else if (newMax != null) newText = `<= ${newMax}`;

    if (activeLink && onUpdateEquipmentLink) {
      onUpdateEquipmentLink(activeLink.id, { refMax: newMax, refText: newText });
    } else {
      onQuickUpdate?.(item.code, { refMax: newMax, refText: newText, evaluationType: 'range' });
    }
  };

  const handleUpdateRefText = (val: string) => {
    if (activeLink && onUpdateEquipmentLink) {
      onUpdateEquipmentLink(activeLink.id, { refText: val });
    } else {
      onQuickUpdate?.(item.code, { refText: val, evaluationType: 'text' });
    }
  };

  const fallbackEquipId = defaultLink?.equipmentId || equipments.find((e) => e.name === item.equipment)?.id || '';

  return (
    <>
      <tr
        onDoubleClick={() => {
          if (!isQuickEditMode) onEdit(item);
        }}
        className={`hover:bg-sky-50/50 transition text-xs group cursor-pointer ${
          isExpanded ? 'bg-sky-50/40 border-b-0' : ''
        }`}
        title={isQuickEditMode ? undefined : 'Nháy đúp chuột để mở form sửa chi tiết'}
      >
        <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{index + 1}</td>

        {/* Code */}
        <td className="p-2 font-mono font-bold text-sky-600 whitespace-nowrap">
          {item.code}
        </td>

        {/* Name & Scientific */}
        <td className="p-2" onClick={(e) => isQuickEditMode && e.stopPropagation()}>
          {isQuickEditMode ? (
            <div className="space-y-1">
              <input
                type="text"
                value={item.name}
                onChange={(e) => onQuickUpdate?.(item.code, { name: e.target.value })}
                placeholder="Tên xét nghiệm"
                className="w-full px-2 py-1 text-xs font-semibold border border-amber-300 rounded-lg bg-amber-50/60 focus:bg-white focus:ring-1 focus:ring-amber-500 outline-hidden text-slate-800"
                title="Sửa nhanh tên xét nghiệm"
              />
              {item.scientific && (
                <span className="text-[10px] text-slate-400 italic block truncate max-w-[200px]">
                  {item.scientific}
                </span>
              )}
            </div>
          ) : (
            <>
              <span className="font-semibold text-slate-800 block">{item.name}</span>
              {item.scientific && (
                <span className="text-[10.5px] text-slate-400 italic block">{item.scientific}</span>
              )}
            </>
          )}
        </td>

        {/* Category / Group */}
        <td className="p-2 whitespace-nowrap" onClick={(e) => isQuickEditMode && e.stopPropagation()}>
          {isQuickEditMode && groups.length > 0 ? (
            <select
              value={item.category || 'Sinh Hóa'}
              onChange={(e) => onQuickUpdate?.(item.code, { category: e.target.value })}
              className="px-2 py-1 text-[11px] font-medium border border-amber-300 rounded-lg bg-amber-50/60 focus:bg-white focus:ring-1 focus:ring-amber-500 outline-hidden text-slate-700"
              title="Đổi nhanh nhóm chỉ số"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold ${
                isDetection
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : isScale
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {isDetection ? (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
              ) : isScale ? (
                <Dna className="w-3 h-3" />
              ) : (
                <FlaskConical className="w-3 h-3 text-slate-400" />
              )}
              <span>{item.category || 'Sinh Hóa'}</span>
            </span>
          )}
        </td>

        {/* Unit */}
        <td className="p-2 text-center font-mono text-slate-600" onClick={(e) => e.stopPropagation()}>
          {isQuickEditMode ? (
            <div className="flex flex-col items-center">
              <input
                type="text"
                value={currentUnit}
                onChange={(e) => handleUpdateUnit(e.target.value)}
                placeholder="Đơn vị"
                className="w-16 px-1.5 py-0.5 text-center font-mono text-xs border border-amber-300 rounded bg-amber-50/60 focus:bg-white focus:ring-1 focus:ring-amber-500 outline-hidden"
                title={activeEqObj ? `Sửa đơn vị cho máy ${activeEqObj.name}` : 'Sửa nhanh đơn vị đo'}
              />
              {isMultiDevice && activeEqObj && (
                <span className="text-[9px] text-sky-600 truncate max-w-[70px] mt-0.5" title={activeEqObj.name}>
                  {activeEqObj.code || activeEqObj.name}
                </span>
              )}
            </div>
          ) : (
            item.unit || '---'
          )}
        </td>

        {/* Reference range / Scale */}
        <td className="p-2 font-mono text-slate-700" onClick={(e) => e.stopPropagation()}>
          {isQuickEditMode ? (
            isDetection ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={currentRefText}
                    onChange={(e) => handleUpdateRefText(e.target.value)}
                    placeholder="Tham chiếu text (hoặc trống)"
                    className="w-28 px-2 py-0.5 text-[11px] font-mono border border-teal-300 rounded bg-teal-50/60 focus:bg-white focus:ring-1 focus:ring-teal-500 outline-hidden"
                    title="Sửa tham chiếu hiển thị cho chỉ số phát hiện (Lựa chọn C)"
                  />
                  <span className="px-1.5 py-0.5 text-[9.5px] bg-teal-100 text-teal-800 font-bold rounded" title="Phương thức: Phát Hiện">
                    PH
                  </span>
                </div>
                {isMultiDevice && activeEqObj && (
                  <span className="text-[9px] text-sky-600 truncate max-w-[120px] mt-0.5">
                    ({activeEqObj.name})
                  </span>
                )}
              </div>
            ) : isScale ? (
              <div className="flex items-center gap-1">
                <span
                  className="px-2 py-0.5 text-[10.5px] bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-mono font-medium truncate max-w-[130px]"
                  title="Thang đo dị nguyên (Cấu hình qua nút máy đo)"
                >
                  {currentRefText || item.refText || 'Theo thang đo'}
                </span>
              </div>
            ) : isTextMode ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={currentRefText}
                    onChange={(e) => handleUpdateRefText(e.target.value)}
                    placeholder="Tham chiếu text (VD: Âm tính)"
                    className="w-28 px-2 py-0.5 text-[11px] font-mono border border-amber-300 rounded bg-amber-50/60 focus:bg-white focus:ring-1 focus:ring-amber-500 outline-hidden"
                    title={activeEqObj ? `Sửa tham chiếu cho máy ${activeEqObj.name}` : 'Sửa tham chiếu chữ'}
                  />
                  <button
                    type="button"
                    onClick={() => onQuickUpdate?.(item.code, { evaluationType: 'range' })}
                    className="px-1 py-0.5 text-[9.5px] bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 rounded border border-slate-200 cursor-pointer font-sans"
                    title="Chuyển sang dải số Min - Max"
                  >
                    1-9
                  </button>
                </div>
                {isMultiDevice && activeEqObj && (
                  <span className="text-[9px] text-sky-600 truncate max-w-[120px] mt-0.5">
                    ({activeEqObj.name})
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="any"
                    value={currentRefMin ?? ''}
                    onChange={(e) => handleUpdateRefMin(e.target.value)}
                    placeholder="Min"
                    className="w-12 px-1 py-0.5 text-center font-mono text-[11px] border border-amber-300 rounded bg-amber-50/60 focus:bg-white focus:ring-1 focus:ring-amber-500 outline-hidden"
                    title="Giá trị tối thiểu"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    step="any"
                    value={currentRefMax ?? ''}
                    onChange={(e) => handleUpdateRefMax(e.target.value)}
                    placeholder="Max"
                    className="w-12 px-1 py-0.5 text-center font-mono text-[11px] border border-amber-300 rounded bg-amber-50/60 focus:bg-white focus:ring-1 focus:ring-amber-500 outline-hidden"
                    title="Giá trị tối đa"
                  />
                  <button
                    type="button"
                    onClick={() => onQuickUpdate?.(item.code, { evaluationType: 'text' })}
                    className="px-1 py-0.5 text-[9.5px] bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 rounded border border-slate-200 cursor-pointer font-sans"
                    title="Chuyển sang tham chiếu định tính (Text)"
                  >
                    Aa
                  </button>
                </div>
                {isMultiDevice && activeEqObj && (
                  <span className="text-[9px] text-sky-600 truncate max-w-[120px] mt-0.5">
                    ({activeEqObj.name})
                  </span>
                )}
              </div>
            )
          ) : isDetection ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="px-2 py-0.5 text-[10.5px] bg-teal-50 text-teal-700 border border-teal-200 rounded-md font-sans font-bold"
                title="Quy tắc: 0 (hoặc ≤ 0) là Không Phát Hiện, >0 là Phát Hiện"
              >
                Phát Hiện
              </span>
              {item.refText && (
                <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                  {item.refText}
                </span>
              )}
            </div>
          ) : item.refText ? (
            <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
              {item.refText}
            </span>
          ) : item.refMin != null && item.refMax != null ? (
            <span className="text-[11px]">
              {item.refMin} - {item.refMax}
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">Chưa đặt</span>
          )}
        </td>

        {/* Price */}
        <td className="p-2 text-right font-mono font-semibold text-slate-800" onClick={(e) => e.stopPropagation()}>
          {isQuickEditMode ? (
            <input
              type="number"
              step="1000"
              min="0"
              value={item.price ?? 0}
              onChange={(e) => onQuickUpdate?.(item.code, { price: e.target.value === '' ? 0 : Number(e.target.value) })}
              className="w-24 px-2 py-0.5 text-right font-mono font-bold text-xs border border-amber-300 rounded bg-amber-50/60 focus:bg-white focus:ring-1 focus:ring-amber-500 outline-hidden text-sky-700"
              title="Sửa nhanh giá xét nghiệm"
            />
          ) : (item.price ?? 0) > 0 ? (
            <span>{(item.price ?? 0).toLocaleString('vi-VN')} đ</span>
          ) : (
            <span className="text-slate-400 text-[11px]">0 đ</span>
          )}
        </td>

        {/* Equipment & Multi-device binding */}
        <td className="p-2" onClick={(e) => e.stopPropagation()}>
          {isQuickEditMode ? (
            isMultiDevice ? (
              <div className="space-y-1">
                {/* Device Selector Pills */}
                <div className="flex items-center gap-1 flex-wrap">
                  {itemLinks.map((link) => {
                    const eqObj = equipments.find((e) => e.id === link.equipmentId);
                    const isSelected = activeLink?.id === link.id;
                    return (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => setActiveLinkId(link.id)}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-50'
                        }`}
                        title={`Sửa dải đo của máy: ${eqObj?.name || link.equipmentId}`}
                      >
                        {link.isDefault && <span className="text-amber-300 text-[9px]">★</span>}
                        <span className="truncate max-w-[80px]">{eqObj?.code || eqObj?.name || link.equipmentId}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-row expand button */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] bg-sky-50 hover:bg-sky-100 text-sky-700 rounded border border-sky-200 cursor-pointer"
                    title="Mở rộng chi tiết từng máy đo"
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    <span>{itemLinks.length} máy đo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="p-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded border border-amber-200 cursor-pointer"
                    title="Thêm máy đo cho chỉ số này"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : itemLinks.length === 1 ? (
              <div className="flex items-center gap-1">
                <select
                  value={activeLink?.equipmentId || fallbackEquipId}
                  onChange={(e) => onQuickUpdateEquipment?.(item.code, e.target.value || null)}
                  className="w-full px-2 py-1 text-[11px] border border-amber-300 rounded bg-amber-50/60 focus:bg-white focus:ring-1 focus:ring-amber-500 outline-hidden"
                  title="Đổi nhanh máy đo gán mặc định"
                >
                  <option value="">-- Chưa gán máy đo --</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="p-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded border border-amber-300 cursor-pointer shrink-0"
                  title="Gán thêm máy đo thứ 2 cho chỉ số này"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) onAddEquipmentLink?.(item.code, e.target.value);
                  }}
                  className="w-full px-2 py-1 text-[11px] border border-amber-300 rounded bg-amber-50/60 focus:bg-white focus:ring-1 focus:ring-amber-500 outline-hidden"
                  title="Gán máy đo cho chỉ số này"
                >
                  <option value="">-- Chưa gán máy đo --</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={() => onConfigEquipment(item)}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-medium transition cursor-pointer ${
                displayEquipmentName
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title={displayEquipmentName ? `Thiết bị: ${displayEquipmentName} (Nhấn để cấu hình thiết bị đo)` : 'Cấu hình thiết bị đo cho chỉ số này'}
            >
              <Cpu className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[110px]">{displayEquipmentName || 'Gán máy đo'}</span>
              {linkedCount > 1 && (
                <span className="bg-sky-600 text-white rounded-full px-1 text-[9px] font-bold">
                  +{linkedCount - 1}
                </span>
              )}
            </button>
          )}
        </td>

        {/* Actions */}
        <td className="p-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center space-x-1">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
              title="Sửa thông tin đầy đủ"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDuplicate?.(item)}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
              title="Nhân bản (Sao chép chỉ số này)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.code)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              title="Xóa chỉ số"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* SUB-ROW: Chi tiết cấu hình các máy đo của chỉ số */}
      {isExpanded && isQuickEditMode && (
        <tr className="bg-slate-100/70 border-b border-slate-200 animate-in fade-in duration-100">
          <td colSpan={9} className="p-2.5 pl-6 sm:pl-10">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-600" />
                  <h5 className="font-bold text-xs text-slate-800">
                    Cấu Hình Dải Tham Chiếu Từng Máy Đo — Chỉ Số [{item.code}] ({item.name})
                  </h5>
                  <span className="text-[11px] text-slate-400 font-medium">
                    ({itemLinks.length} máy đã gán)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer underline"
                >
                  Thu gọn
                </button>
              </div>

              {/* Danh sách từng máy */}
              <div className="space-y-2">
                {itemLinks.map((link, lIdx) => {
                  const eqObj = equipments.find((e) => e.id === link.equipmentId);
                  return (
                    <div
                      key={link.id}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition ${
                        link.isDefault
                          ? 'bg-sky-50/50 border-sky-200'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="w-6 text-center font-mono text-[11px] text-slate-400 font-bold">
                        #{lIdx + 1}
                      </div>

                      {/* Tên máy & nút đặt mặc định */}
                      <div className="w-48 sm:w-56 shrink-0">
                        <div className="font-bold text-xs text-slate-800 truncate" title={eqObj?.name || link.equipmentId}>
                          {eqObj?.name || link.equipmentId}
                        </div>
                        <div className="mt-0.5">
                          {link.isDefault ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              ★ Máy đo mặc định
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSetDefaultEquipmentLink?.(item.code, link.id)}
                              className="text-[9.5px] text-sky-600 hover:text-sky-800 hover:underline cursor-pointer"
                            >
                              Đặt làm mặc định
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Phương thức đánh giá trên máy này */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10.5px] text-slate-500">Đánh giá:</span>
                        <select
                          value={link.evaluationType || (link.scaleId ? 'scale' : 'range')}
                          onChange={(e) => onUpdateEquipmentLink?.(link.id, { evaluationType: e.target.value as EvaluationType })}
                          className="px-1.5 py-0.5 text-[11px] font-semibold rounded border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500 outline-hidden"
                        >
                          <option value="range">Tham Chiếu</option>
                          <option value="scale">Thang Đo</option>
                          <option value="detection">Phát Hiện</option>
                        </select>
                      </div>

                      {/* Đơn vị riêng của máy */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10.5px] text-slate-500">Đơn vị:</span>
                        <input
                          type="text"
                          value={link.unit || ''}
                          onChange={(e) => onUpdateEquipmentLink?.(link.id, { unit: e.target.value })}
                          placeholder="Đơn vị"
                          className="w-16 px-1.5 py-0.5 text-center font-mono text-xs border border-amber-300 rounded bg-white focus:ring-1 focus:ring-amber-500 outline-hidden"
                        />
                      </div>

                      {/* Thông số tham chiếu theo phương thức của máy */}
                      {link.evaluationType === 'detection' ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-teal-100 text-teal-800 border border-teal-300 shrink-0">
                            Phát Hiện (0: KPH, &gt;0: PH)
                          </span>
                          <input
                            type="text"
                            value={link.refText || ''}
                            onChange={(e) => onUpdateEquipmentLink?.(link.id, { refText: e.target.value })}
                            placeholder="Mặc định: Không phát hiện"
                            className="flex-1 min-w-[120px] px-2 py-0.5 font-mono text-[11px] border border-teal-300 rounded bg-white focus:ring-1 focus:ring-teal-500 outline-hidden"
                            title="Chuỗi tham chiếu hiển thị cho máy đo này"
                          />
                        </div>
                      ) : link.evaluationType === 'scale' ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-100 text-purple-800 border border-purple-300 shrink-0">
                            Thang Đo Dị Nguyên
                          </span>
                          <input
                            type="text"
                            value={link.refText || ''}
                            onChange={(e) => onUpdateEquipmentLink?.(link.id, { refText: e.target.value })}
                            placeholder="Theo thang đo"
                            className="flex-1 min-w-[120px] px-2 py-0.5 font-mono text-[11px] border border-purple-300 rounded bg-white focus:ring-1 focus:ring-purple-500 outline-hidden"
                            title="Ghi chú thang đo riêng cho máy này"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-[10.5px] text-slate-500">Dải tham chiếu:</span>
                          <input
                            type="number"
                            step="any"
                            value={link.refMin ?? ''}
                            onChange={(e) => {
                              const nMin = e.target.value === '' ? null : Number(e.target.value);
                              const cMax = link.refMax ?? null;
                              const nText =
                                nMin != null && cMax != null
                                  ? `${nMin} - ${cMax}`
                                  : nMin != null
                                  ? `>= ${nMin}`
                                  : cMax != null
                                  ? `<= ${cMax}`
                                  : '';
                              onUpdateEquipmentLink?.(link.id, { refMin: nMin, refText: nText });
                            }}
                            placeholder="Min"
                            className="w-14 px-1 py-0.5 text-center font-mono text-[11px] border border-amber-300 rounded bg-white focus:ring-1 focus:ring-amber-500 outline-hidden"
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            type="number"
                            step="any"
                            value={link.refMax ?? ''}
                            onChange={(e) => {
                              const cMin = link.refMin ?? null;
                              const nMax = e.target.value === '' ? null : Number(e.target.value);
                              const nText =
                                cMin != null && nMax != null
                                  ? `${cMin} - ${nMax}`
                                  : cMin != null
                                  ? `>= ${cMin}`
                                  : nMax != null
                                  ? `<= ${nMax}`
                                  : '';
                              onUpdateEquipmentLink?.(link.id, { refMax: nMax, refText: nText });
                            }}
                            placeholder="Max"
                            className="w-14 px-1 py-0.5 text-center font-mono text-[11px] border border-amber-300 rounded bg-white focus:ring-1 focus:ring-amber-500 outline-hidden"
                          />
                          <input
                            type="text"
                            value={link.refText || ''}
                            onChange={(e) => onUpdateEquipmentLink?.(link.id, { refText: e.target.value })}
                            placeholder="Tham chiếu text (nếu có)"
                            className="flex-1 min-w-[120px] px-2 py-0.5 font-mono text-[11px] border border-slate-200 rounded bg-white focus:ring-1 focus:ring-amber-500 outline-hidden"
                            title="Ghi chú tham chiếu riêng cho máy này"
                          />
                        </div>
                      )}

                      {/* Nút xóa gỡ máy */}
                      <button
                        type="button"
                        onClick={() => onRemoveEquipmentLink?.(link.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Gỡ máy đo này khỏi chỉ số"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Form gán thêm máy mới */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-700">Gán thêm máy đo khác:</span>
                <select
                  value={selectedNewEquipId}
                  onChange={(e) => setSelectedNewEquipId(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-sky-500 outline-hidden"
                >
                  <option value="">-- Chọn máy đo từ danh mục --</option>
                  {equipments
                    .filter((eq) => !itemLinks.some((l) => l.equipmentId === eq.id))
                    .map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedNewEquipId}
                  onClick={() => {
                    if (selectedNewEquipId) {
                      onAddEquipmentLink?.(item.code, selectedNewEquipId);
                      setSelectedNewEquipId('');
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Gán Máy</span>
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
