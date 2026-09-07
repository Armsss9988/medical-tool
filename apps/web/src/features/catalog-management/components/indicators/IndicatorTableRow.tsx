import { Edit2, Trash2, Cpu, Dna, FlaskConical } from 'lucide-react';
import { CatalogItem } from '@domain/types';

interface IndicatorTableRowProps {
  index: number;
  item: CatalogItem;
  linkedCount: number;
  onEdit: (item: CatalogItem) => void;
  onConfigEquipment: (item: CatalogItem) => void;
  onDelete: (code: string) => void;
}

export function IndicatorTableRow({
  index,
  item,
  linkedCount,
  onEdit,
  onConfigEquipment,
  onDelete
}: IndicatorTableRowProps) {
  const isScale = item.evaluationType === 'scale' || Boolean(item.scaleId);

  return (
    <tr className="hover:bg-slate-50/80 transition text-xs">
      <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">{index + 1}</td>

      {/* Code */}
      <td className="p-2.5 font-mono font-bold text-sky-600 whitespace-nowrap">
        {item.code}
      </td>

      {/* Name & Scientific */}
      <td className="p-2.5">
        <span className="font-semibold text-slate-800 block">{item.name}</span>
        {item.scientific && (
          <span className="text-[10.5px] text-slate-400 italic block">{item.scientific}</span>
        )}
      </td>

      {/* Category / Group */}
      <td className="p-2.5 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold ${
          isScale
            ? 'bg-purple-50 text-purple-700 border border-purple-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}>
          {isScale ? <Dna className="w-3 h-3" /> : <FlaskConical className="w-3 h-3 text-slate-400" />}
          <span>{item.category || 'Sinh Hóa'}</span>
        </span>
      </td>

      {/* Unit */}
      <td className="p-2.5 text-center font-mono text-slate-600">
        {item.unit || '---'}
      </td>

      {/* Reference range / Scale */}
      <td className="p-2.5 font-mono text-slate-700">
        {item.refText ? (
          <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
            {item.refText}
          </span>
        ) : item.refMin != null && item.refMax != null ? (
          <span className="text-[11px]">{item.refMin} - {item.refMax}</span>
        ) : (
          <span className="text-slate-400 text-[11px]">Chưa đặt</span>
        )}
      </td>

      {/* Price */}
      <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
        {(item.price ?? 0) > 0 ? (
          <span>{(item.price ?? 0).toLocaleString('vi-VN')} đ</span>
        ) : (
          <span className="text-slate-400 text-[11px]">0 đ</span>
        )}
      </td>

      {/* Equipment & Multi-device binding */}
      <td className="p-2.5">
        <button
          type="button"
          onClick={() => onConfigEquipment(item)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-medium transition cursor-pointer ${
            linkedCount > 0
              ? 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          title="Cấu hình thiết bị đo cho chỉ số này"
        >
          <Cpu className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[110px]">{item.equipment || 'Gán máy đo'}</span>
          {linkedCount > 1 && (
            <span className="bg-sky-600 text-white rounded-full px-1 text-[9px] font-bold">
              +{linkedCount - 1}
            </span>
          )}
        </button>
      </td>

      {/* Actions */}
      <td className="p-2.5 text-center whitespace-nowrap">
        <div className="flex items-center justify-center space-x-1">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
            title="Sửa thông tin"
          >
            <Edit2 className="w-3.5 h-3.5" />
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
  );
}
