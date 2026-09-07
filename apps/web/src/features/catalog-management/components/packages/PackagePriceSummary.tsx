import { Tag, TrendingDown } from 'lucide-react';
import { CatalogItem, PackageItem } from '@domain/types';

interface PackagePriceSummaryProps {
  packagePrice: number;
  items: PackageItem[];
  catalogItems: CatalogItem[];
}

export function PackagePriceSummary({
  packagePrice,
  items,
  catalogItems
}: PackagePriceSummaryProps) {
  const catalogMap = new Map(catalogItems.map((c) => [c.code.toUpperCase(), c]));

  const totalRetailPrice = items.reduce((sum, item) => {
    const cat = catalogMap.get(item.code.toUpperCase());
    return sum + (cat?.price ?? 0);
  }, 0);

  const savings = totalRetailPrice > packagePrice ? totalRetailPrice - packagePrice : 0;
  const savingsPercent = totalRetailPrice > 0 ? Math.round((savings / totalRetailPrice) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-sky-600 text-white rounded-lg shadow-sm">
          <Tag className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">Giá gói niêm yết:</span>
            <span className="font-mono font-extrabold text-sky-700 text-sm">
              {packagePrice.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Tổng giá lẻ ({items.length} chỉ số):{' '}
            <span className="font-mono line-through text-slate-400">
              {totalRetailPrice.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>
      </div>

      {savingsPercent > 0 && (
        <div className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-100/80 text-emerald-800 border border-emerald-300/80 rounded-lg text-[11px] font-bold">
          <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tiết kiệm {savingsPercent}% (-{savings.toLocaleString('vi-VN')} đ)</span>
        </div>
      )}
    </div>
  );
}
