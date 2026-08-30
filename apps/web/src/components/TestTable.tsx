import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { TestTube, Plus, Trash2, Search, Layers, Sparkles, X, ClipboardPaste, Clock, Keyboard } from 'lucide-react';
import { evaluateTestIndicator } from '@domain/testResult';
import { getAllergenScaleById } from '@domain/constants/allergenScales';
import { getReferenceRangeById, autoResolveItemLinks } from '@data';
import { CatalogItem, SelectedTest, TestPackage, TestGroup, ToastType, getPkgCodes } from '@domain/types';
import { computePricingWithPackages } from '@domain/pricing';
import NoteCombobox from './NoteCombobox';

interface RecentTestItem {
  code: string;
  name: string;
  category: string;
}

interface TestTableProps {
  catalog: CatalogItem[];
  testPackages?: TestPackage[];
  testGroups?: TestGroup[];
  selectedTests: SelectedTest[];
  setSelectedTests: React.Dispatch<React.SetStateAction<SelectedTest[]>>;\n  showToast?: (message: string, type?: ToastType) => void;
  onOpenInvoiceModal?: () => void;
  /** Recent tests for quick-add chips */
  recentTests?: RecentTestItem[];
  onAddToRecent?: (item: RecentTestItem) => void;
  onAddMultipleToRecent?: (items: RecentTestItem[]) => void;
}

export default function TestTable({ 
  catalog, 
  testPackages = [],
  selectedTests, 
  setSelectedTests,
  showToast,
  onOpenInvoiceModal,
  recentTests = [],
  onAddToRecent,
  onAddMultipleToRecent
}: TestTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const bulkTextAreaRef = useRef<HTMLTextAreaElement>(null);

  // Reset highlighted index when search term changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  const setResultInputRef = useCallback((code: string, el: HTMLInputElement | null) => {
    if (el) {
      resultInputRefs.current.set(code, el);
    } else {
      resultInputRefs.current.delete(code);
    }
  }, []);

  const handleAddTest = useCallback((item: CatalogItem) => {
    if (selectedTests.some((t) => t.code === item.code)) return;

    const resolved = autoResolveItemLinks(item);
    const isTIgE = resolved.code.toLowerCase() === 'tige';
    const isAllergenItem = !isTIgE && (resolved.category?.includes('Dị Nguyên') || resolved.unit === 'IU/mL' || !!resolved.scaleId);
    const defaultNote = isTIgE ? 'Bình thường' : isAllergenItem ? 'Âm tính (Độ 0)' : 'Bình thường';

    setSelectedTests((prev) => [
      ...prev,
      {
        ...resolved,
        result: '',
        note: defaultNote
      }
    ]);

    // Track in recent tests
    if (onAddToRecent) {
      onAddToRecent({ code: resolved.code, name: resolved.name, category: resolved.category || '' });
    }
  }, [selectedTests, setSelectedTests, onAddToRecent]);

  const handleRemoveTest = (code: string) => {
    setSelectedTests((prev) => prev.filter((t) => t.code !== code));
  };

  const handleClearAllTests = () => {
    if (selectedTests.length === 0) return;
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ danh sách chỉ số xét nghiệm đang chọn?')) {
      setSelectedTests([]);
    }
  };

  // Auto-fill typical normal values for quick test/demo
  const handleAutoFillNormalValues = () => {
    setSelectedTests((prev) =>
      prev.map((t) => {
        const resolved = autoResolveItemLinks(t);
        const isTIgE = resolved.code.toLowerCase() === 'tige';
        if (isTIgE) {
          return {
            ...t,
            result: '<15,0',
            note: 'Bình thường'
          };
        }

        const isAllergenItem = (resolved.category?.includes('Dị Nguyên') || resolved.unit === 'IU/mL' || !!resolved.scaleId);
        if (isAllergenItem) {
          const isScale44 = resolved.scaleId === 'scale_allergen_44';
          return {
            ...t,
            result: isScale44 ? '<0.35' : '<0.34',
            note: 'Âm tính (Độ 0)'
          };
        }

        let normalVal = '';
        if (t.refMin !== null && t.refMin !== undefined && t.refMax !== null && t.refMax !== undefined) {
          const mid = (t.refMin + t.refMax) / 2;
          normalVal = Number.isInteger(mid) ? String(mid) : mid.toFixed(1);
        } else if (t.refMax !== null && t.refMax !== undefined) {
          normalVal = (t.refMax * 0.7).toFixed(1);
        } else {
          normalVal = 'Âm tính';
        }

        return {
          ...t,
          result: normalVal,
          note: 'Bình thường'
        };
      })
    );
  };

  const handleResultChange = (code: string, rawVal: string) => {
    setSelectedTests((prev) =>
      prev.map((t) => {
        if (t.code !== code) return t;

        const resolved = autoResolveItemLinks(t);
        const scale = resolved.scaleId ? getAllergenScaleById(resolved.scaleId) : undefined;
        const refRange = resolved.referenceRangeId ? getReferenceRangeById(resolved.referenceRangeId) : undefined;
        const evalRes = evaluateTestIndicator(t.code, t.category, t.unit, rawVal, t.refMin, t.refMax, scale, refRange);
        const autoNote = evalRes.label || t.note;

        return {
          ...t,
          result: rawVal,
          note: autoNote
        };
      })
    );
  };

  const handleNoteChange = (code: string, noteVal: string) => {
    setSelectedTests((prev) =>
      prev.map((t) => (t.code === code ? { ...t, note: noteVal } : t))
    );
  };

  const handleCustomRefTextChange = (code: string, customText: string) => {
    setSelectedTests((prev) =>
      prev.map((t) => (t.code === code ? { ...t, customRefText: customText } : t))
    );
  };

  const filteredCatalog = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return catalog
      .filter((item) => {
        return (
          item.code.toLowerCase().includes(term) ||
          item.name.toLowerCase().includes(term) ||
          (item.category && item.category.toLowerCase().includes(term))
        );
      })
      .slice(0, 10);
  }, [catalog, searchTerm]);

  // Bulk paste parser
  const handleProcessBulkPaste = () => {
    if (!bulkPasteText.trim()) return;
    const lines = bulkPasteText.split('\n');
    const addedItems: CatalogItem[] = [];
    const recentToAdd: RecentTestItem[] = [];

    lines.forEach((line) => {
      const parts = line.split(/[\t,;]+/).map((s) => s.trim());
      if (parts.length === 0 || !parts[0]) return;

      const codeOrName = parts[0].toLowerCase();
      const matched = catalog.find(
        (c) =>
          c.code.toLowerCase() === codeOrName ||
          c.name.toLowerCase() === codeOrName ||
          c.name.toLowerCase().includes(codeOrName)
      );

      if (matched && !selectedTests.some((t) => t.code === matched.code) && !addedItems.some((a) => a.code === matched.code)) {
        const val = parts[1] || '';
        const note = parts[2] || '';
        const resolved = autoResolveItemLinks(matched);
        
        let calculatedNote = note;
        if (!note && val) {
          const scale = resolved.scaleId ? getAllergenScaleById(resolved.scaleId) : undefined;
          const refRange = resolved.referenceRangeId ? getReferenceRangeById(resolved.referenceRangeId) : undefined;
          const evalRes = evaluateTestIndicator(matched.code, matched.category, matched.unit, val, matched.refMin, matched.refMax, scale, refRange);
          calculatedNote = evalRes.label || (resolved.scaleId ? 'Âm tính (Độ 0)' : 'Bình thường');
        }

        addedItems.push(matched);
        recentToAdd.push({ code: matched.code, name: matched.name, category: matched.category || '' });
        
        setSelectedTests((prev) => [
          ...prev,
          {
            ...resolved,
            result: val,
            note: calculatedNote || (resolved.scaleId ? 'Âm tính (Độ 0)' : 'Bình thường')
          }
        ]);
      }
    });

    if (onAddMultipleToRecent && recentToAdd.length > 0) {
      onAddMultipleToRecent(recentToAdd);
    }

    if (addedItems.length > 0) {
      if (showToast) showToast(`Đã thêm nhanh ${addedItems.length} chỉ số từ dữ liệu dán!`, 'success');
      setBulkPasteText('');
      setShowBulkPaste(false);
    } else {
      if (showToast) showToast('Không tìm thấy chỉ số phù hợp trong danh mục!', 'warning');
    }
  };

  // Keyboard navigation inside search dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredCatalog.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredCatalog.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredCatalog.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCatalog[highlightedIndex];
      if (selected) {
        handleAddTest(selected);
        setSearchTerm('');
      }
    } else if (e.key === 'Escape') {
      setSearchTerm('');
    }
  };

  const pricingBreakdown = useMemo(() => {
    return computePricingWithPackages(selectedTests, testPackages);
  }, [selectedTests, testPackages]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
            <TestTube className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              Chỉ Số Xét Nghiệm Đã Chọn
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                {selectedTests.length} chỉ số
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Nhập kết quả xét nghiệm, đánh giá kết quả tự động và tính viện phí
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoFillNormalValues}
            disabled={selectedTests.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-semibold transition border border-sky-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Điền giá trị bình thường mẫu cho tất cả chỉ số đang chọn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Điền Mẫu Bình Thường</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBulkPaste((prev) => !prev)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition border border-slate-200 cursor-pointer"
            title="Nhập nhanh nhiều chỉ số bằng cách dán văn bản / Excel"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dán Hàng Loạt</span>
          </button>

          <button
            type="button"
            onClick={handleClearAllTests}
            disabled={selectedTests.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold transition border border-rose-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Xóa tất cả chỉ số xét nghiệm đã chọn"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xóa Hết</span>
          </button>
        </div>
      </div>

      {/* Bulk Paste Modal / Expandable Panel */}
      {showBulkPaste && (
        <div className="p-4 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ClipboardPaste className="w-4 h-4 text-sky-600" />
              Dán dữ liệu chỉ số từ Excel hoặc bảng văn bản (Định dạng: Mã/Tên [Tab/Phẩy] Kết quả [Tab/Phẩy] Đánh giá)
            </span>
            <button
              type="button"
              onClick={() => setShowBulkPaste(false)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            ref={bulkTextAreaRef}
            rows={3}
            value={bulkPasteText}
            onChange={(e) => setBulkPasteText(e.target.value)}
            placeholder="Ví dụ:&#10;GLU	5.4	Bình thường&#10;UREA	4.8&#10;CHOLESTEROL	5.2"
            className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBulkPaste(false)}
              className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleProcessBulkPaste}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Áp Dụng Dán Hàng Loạt
            </button>
          </div>
        </div>
      )}

      {/* Search & Quick-Add Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/30">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm chỉ số xét nghiệm theo tên, mã viết tắt, nhóm (hoặc nhấn phím tắt để tìm)..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent focus:outline-hidden transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Search Dropdown */}
          {filteredCatalog.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden max-h-72 overflow-y-auto">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 flex justify-between">
                <span>Gợi ý ({filteredCatalog.length}) - Dùng phím ↑ ↓ Enter để chọn nhanh</span>
                <span className="flex items-center gap-1"><Keyboard className="w-3 h-3" /> Enter</span>
              </div>
              {filteredCatalog.map((item, index) => {
                const isSelected = selectedTests.some((t) => t.code === item.code);
                const isHighlighted = index === highlightedIndex;
                return (
                  <div
                    key={item.code}
                    onClick={() => {
                      handleAddTest(item);
                      setSearchTerm('');
                    }}
                    className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer border-b border-slate-50 last:border-b-0 transition ${
                      isHighlighted ? 'bg-sky-50 text-sky-900' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                        {item.code}
                      </span>
                      <span className="font-medium">{item.name}</span>
                      {item.category && (
                        <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded-full bg-slate-100">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500">
                        {item.unit || '-'} | {item.refMin !== null && item.refMax !== null ? `${item.refMin} - ${item.refMax}` : item.refText || '-'}
                      </span>
                      {isSelected ? (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Đã chọn
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Recent Chips */}
        {recentTests.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" /> Gần đây:
            </span>
            {recentTests.slice(0, 8).map((rec) => {
              const fullItem = catalog.find((c) => c.code === rec.code);
              const isSelected = selectedTests.some((t) => t.code === rec.code);
              return (
                <button
                  key={rec.code}
                  type="button"
                  onClick={() => fullItem && handleAddTest(fullItem)}
                  disabled={isSelected || !fullItem}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium shrink-0 transition flex items-center gap-1 ${
                    isSelected
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-700 hover:bg-sky-50 cursor-pointer shadow-2xs'
                  }`}
                >
                  <span className="font-mono font-bold">{rec.code}</span>
                  <span className="truncate max-w-[120px]">{rec.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[300px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold sticky top-0 z-10 text-[11px] border-b border-slate-200 backdrop-blur-xs">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">STT</th>
              <th className="py-2.5 px-3 w-28">Mã</th>
              <th className="py-2.5 px-3">Tên Chỉ Số</th>
              <th className="py-2.5 px-3 w-32 text-center">Kết Quả</th>
              <th className="py-2.5 px-3 w-20 text-center">Đơn Vị</th>
              <th className="py-2.5 px-3 w-40 text-center">Tham Chiếu</th>
              <th className="py-2.5 px-3 w-44">Đánh Giá / Ghi Chú</th>
              <th className="py-2.5 px-3 w-12 text-center">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {selectedTests.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <TestTube className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                    <p className="font-medium text-sm text-slate-600">Chưa có chỉ số xét nghiệm nào</p>
                    <p className="text-xs text-slate-400">Tìm kiếm chỉ số ở trên hoặc chọn gói xét nghiệm từ danh mục bên phải để bắt đầu.</p>
                  </div>
                </td>
              </tr>
            ) : (
              selectedTests.map((t, idx) => {
                const isTIgE = t.code.toLowerCase() === 'tige';
                const isAllergenItem = !isTIgE && (t.category?.includes('Dị Nguyên') || t.unit === 'IU/mL' || !!t.scaleId);
                const hasAbnormalNote = t.note && !t.note.includes('Bình thường') && !t.note.includes('Âm tính') && !t.note.includes('Độ 0');

                return (
                  <tr
                    key={t.code}
                    className={`hover:bg-slate-50/80 transition ${
                      hasAbnormalNote ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {t.code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{t.name}</div>
                      {t.scientific && (
                        <div className="text-[10px] italic text-slate-400">{t.scientific}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        ref={(el) => setResultInputRef(t.code, el)}
                        type="text"
                        value={t.result || ''}
                        onChange={(e) => handleResultChange(t.code, e.target.value)}
                        placeholder="--"
                        className={`w-full text-center py-1 px-2 text-xs font-bold rounded-lg border focus:ring-2 focus:outline-hidden transition ${
                          hasAbnormalNote
                            ? 'border-rose-400 bg-rose-50/50 text-rose-800 focus:ring-rose-400'
                            : 'border-slate-200 bg-white text-slate-800 focus:ring-sky-500'
                        }`}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                      {t.unit || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {t.customRefText ? (
                        <span className="font-medium text-slate-700">{t.customRefText}</span>
                      ) : t.refMin !== null && t.refMin !== undefined && t.refMax !== null && t.refMax !== undefined ? (
                        <span className="font-medium text-slate-700">{t.refMin} - {t.refMax}</span>
                      ) : (
                        <span className="font-medium text-slate-700">{t.refText || '-'}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <NoteCombobox
                        value={t.note || ''}
                        onChange={(val) => handleNoteChange(t.code, val)}
                        isAllergen={isAllergenItem}
                        scaleId={t.scaleId}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveTest(t.code)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Xóa chỉ số này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pricing Summary Bar */}
      {selectedTests.length > 0 && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <span>
              Tổng số chỉ số: <strong>{selectedTests.length}</strong>
            </span>
            {pricingBreakdown.appliedPackages.length > 0 && (
              <span className="flex items-center gap-1 text-sky-700 font-medium">
                <Layers className="w-3.5 h-3.5" />
                Gói áp dụng: {pricingBreakdown.appliedPackages.map((p) => p.name).join(', ')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-slate-500 mr-2">Tổng viện phí tạm tính:</span>
              <span className="text-base font-extrabold text-emerald-700">
                {pricingBreakdown.totalFee.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {onOpenInvoiceModal && (
              <button
                type="button"
                onClick={onOpenInvoiceModal}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
              >
                Tạo Hóa Đơn
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
