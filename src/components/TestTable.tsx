import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { TestTube, Plus, Trash2, Search, Layers, Sparkles, X, ClipboardPaste, Clock, Keyboard } from 'lucide-react';
import { evaluateResult, evaluateTestIndicator } from '@domain/testResult';
import { calculateAllergenGrade } from '@domain/allergen';
import { CatalogItem, SelectedTest, TestPackage } from '@domain/types';
import { computePricingWithPackages } from '@domain/pricing';

const QUICK_NOTE_OPTIONS = [
  'Bình thường',
  'CAO ↑',
  'THẤP ↓',
  'Âm tính',
  'Dương tính',
  'H (Tăng)',
  'L (Giảm)',
  'Độ 0 (Âm tính)',
  'Độ 1 (Yếu)',
  'Độ 2 (Trung bình)',
  'Độ 3 (Khá)',
  'Độ 4 (Mạnh)',
  'Độ 5 (Rất mạnh)',
  'Độ 6 (Cực mạnh)'
];

interface RecentTestItem {
  code: string;
  name: string;
  category: string;
}

interface TestTableProps {
  catalog: CatalogItem[];
  testPackages?: TestPackage[];
  testGroups?: any[];
  selectedTests: SelectedTest[];
  setSelectedTests: React.Dispatch<React.SetStateAction<SelectedTest[]>>;
  showToast?: (message: string, type?: any) => void;
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

    const isTIgE = item.code.toLowerCase() === 'tige';
    const isAllergenItem = !isTIgE && (item.category?.includes('Dị Nguyên') || item.unit === 'IU/mL');
    const defaultNote = isTIgE ? 'Bình thường' : isAllergenItem ? 'Âm tính (Độ 0)' : 'Bình thường';

    setSelectedTests((prev) => [
      ...prev,
      {
        ...item,
        result: '',
        note: defaultNote
      }
    ]);

    // Track in recent tests
    if (onAddToRecent) {
      onAddToRecent({ code: item.code, name: item.name, category: item.category || '' });
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
        const isTIgE = t.code.toLowerCase() === 'tige';
        if (isTIgE) {
          return {
            ...t,
            result: '<15,0',
            note: 'Bình thường'
          };
        }

        const isAllergenItem = t.category?.includes('Dị Nguyên') || t.unit === 'IU/mL';
        if (isAllergenItem) {
          return {
            ...t,
            result: '<0.35',
            note: 'Độ 0 (Âm tính)'
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

        const evalRes = evaluateTestIndicator(t.code, t.category, t.unit, rawVal, t.refMin, t.refMax);
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

  const handleSelectPackage = (pkgId: string) => {
    const pkg = testPackages.find((p) => p.id === pkgId);
    if (!pkg) return;

    const itemsToAdd = catalog.filter((item) => pkg.codes.includes(item.code));

    setSelectedTests((prev) => {
      const existingCodes = new Set(prev.map((t) => t.code));
      const newOnes = itemsToAdd
        .filter((item) => !existingCodes.has(item.code))
        .map((item) => {
          const isTIgE = item.code.toLowerCase() === 'tige';
          const isAllergenItem = !isTIgE && (item.category?.includes('Dị Nguyên') || item.unit === 'IU/mL');
          return {
            ...item,
            result: '',
            note: isTIgE ? 'Bình thường' : isAllergenItem ? 'Âm tính (Độ 0)' : 'Bình thường'
          };
        });
      return [...prev, ...newOnes];
    });

    // Track in recent tests
    if (onAddMultipleToRecent) {
      onAddMultipleToRecent(
        itemsToAdd.map((item) => ({ code: item.code, name: item.name, category: item.category || '' }))
      );
    }

    if (showToast) {
      showToast(`Đã thêm ${itemsToAdd.length} chỉ số từ gói "${pkg.name}"!`, 'success');
    }
  };

  const filteredCatalog = catalog.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ─── KEYBOARD: Search dropdown navigation ─────────────────────────
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchTerm) return;

    const available = filteredCatalog.filter((item) => !selectedTests.some((t) => t.code === item.code));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, available.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetItem = available[highlightedIndex];
      if (targetItem) {
        handleAddTest(targetItem);
        // Don't clear search — let user keep adding
        setHighlightedIndex(0);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSearchTerm('');
    }
  };

  // ─── KEYBOARD: Enter in result cell → move to next result ─────────
  const handleResultKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move to next result input
      const nextTest = selectedTests[currentIndex + 1];
      if (nextTest) {
        const nextInput = resultInputRefs.current.get(nextTest.code);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Tab also moves to next result (skip note column)
      const nextTest = selectedTests[currentIndex + 1];
      if (nextTest) {
        e.preventDefault();
        const nextInput = resultInputRefs.current.get(nextTest.code);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
      // If no next test, let Tab naturally leave the table
    }
  };

  // ─── BULK PASTE: Map lines of values to selected tests ────────────
  const handleApplyBulkPaste = () => {
    const lines = bulkPasteText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return;

    setSelectedTests((prev) =>
      prev.map((t, idx) => {
        if (idx >= lines.length) return t;
        const rawVal = lines[idx];

        const evalRes = evaluateTestIndicator(t.code, t.category, t.unit, rawVal, t.refMin, t.refMax);
        const autoNote = evalRes.label || t.note;

        return { ...t, result: rawVal, note: autoNote };
      })
    );

    if (showToast) {
      showToast(`Đã dán ${Math.min(lines.length, selectedTests.length)} kết quả vào bảng!`, 'success');
    }
    setShowBulkPaste(false);
    setBulkPasteText('');
  };

  // Focus first result input
  const handleFocusFirstResult = () => {
    if (selectedTests.length > 0) {
      const firstInput = resultInputRefs.current.get(selectedTests[0].code);
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }
  };

  const pricing = useMemo(() => {
    return computePricingWithPackages(
      selectedTests.map((t) => t.code),
      selectedTests,
      testPackages
    );
  }, [selectedTests, testPackages]);

  const totalFee = pricing.total;

  // ─── RECENT TESTS: Filter out already-selected ─────────────────────
  const availableRecentTests = recentTests.filter(
    (rt) => !selectedTests.some((t) => t.code === rt.code)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 lg:p-5 flex flex-col space-y-4">
      {/* Header Panel Chỉ Số */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black">
            3
          </span>
          <div>
            <h2 className="text-xs lg:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
              <TestTube className="w-4 h-4 text-emerald-600" />
              <span>Chỉ Định & Nhập Kết Quả Xét Nghiệm</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Đang chọn: <strong className="text-emerald-700 font-bold">{selectedTests.length}</strong> chỉ số
              {pricing.activePackages.length > 0 && (
                <span className="text-indigo-600 font-semibold ml-1">
                  ({pricing.activePackages.map((p) => p.name).join(', ')})
                </span>
              )}
              {' '}• Tổng phí:{' '}
              <strong className="text-emerald-700 font-bold font-mono">{totalFee.toLocaleString('vi-VN')} đ</strong>
            </p>
          </div>
        </div>

        {/* Quick Tools Header */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          {/* Focus first result */}
          <button
            type="button"
            onClick={handleFocusFirstResult}
            disabled={selectedTests.length === 0}
            className="px-2 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-lg text-[11px] border border-sky-200 transition-all flex items-center space-x-1"
            title="Focus vào ô kết quả đầu tiên (Enter = dòng tiếp theo)"
          >
            <Keyboard className="w-3.5 h-3.5 text-sky-600" />
            <span>Nhập KQ</span>
          </button>

          {/* Bulk Paste */}
          <button
            type="button"
            onClick={() => {
              setShowBulkPaste(!showBulkPaste);
              setTimeout(() => bulkTextAreaRef.current?.focus(), 50);
            }}
            disabled={selectedTests.length === 0}
            className="px-2 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-lg text-[11px] border border-violet-200 transition-all flex items-center space-x-1"
            title="Dán kết quả hàng loạt (mỗi dòng = 1 giá trị)"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-violet-600" />
            <span>Dán KQ</span>
          </button>

          <button
            type="button"
            onClick={handleAutoFillNormalValues}
            disabled={selectedTests.length === 0}
            className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-lg text-[11px] border border-emerald-200 transition-all flex items-center space-x-1"
            title="Điền tự động kết quả bình thường"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mẫu Nhanh</span>
          </button>

          {onOpenInvoiceModal && (
            <button
              type="button"
              onClick={onOpenInvoiceModal}
              disabled={selectedTests.length === 0}
              className="px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-lg text-[11px] border border-teal-200 transition-all"
            >
              Thu Phí ({totalFee.toLocaleString('vi-VN')} đ)
            </button>
          )}

          <button
            type="button"
            onClick={handleClearAllTests}
            disabled={selectedTests.length === 0}
            className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-lg text-[11px] border border-rose-200 transition-all flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa Hết</span>
          </button>
        </div>
      </div>

      {/* ═══ BULK PASTE PANEL ═══ */}
      {showBulkPaste && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-900 uppercase flex items-center gap-1">
              <ClipboardPaste className="w-3.5 h-3.5 text-violet-600" />
              Dán kết quả hàng loạt ({selectedTests.length} chỉ số)
            </span>
            <button
              type="button"
              onClick={() => { setShowBulkPaste(false); setBulkPasteText(''); }}
              className="text-violet-400 hover:text-violet-700 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            ref={bulkTextAreaRef}
            value={bulkPasteText}
            onChange={(e) => setBulkPasteText(e.target.value)}
            placeholder={`Dán mỗi dòng 1 giá trị kết quả:\n5.2\n140\n98\n...`}
            rows={5}
            className="w-full px-3 py-2 bg-white border border-violet-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-violet-500">
              {bulkPasteText.split('\n').filter((l) => l.trim()).length} dòng → {selectedTests.length} chỉ số
            </span>
            <button
              type="button"
              onClick={handleApplyBulkPaste}
              disabled={!bulkPasteText.trim()}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition active:scale-95"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* ═══ RECENT TESTS CHIPS ═══ */}
      {availableRecentTests.length > 0 && (
        <div className="flex items-center gap-1.5 p-2 bg-amber-50/70 border border-amber-200/80 rounded-xl overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1 px-1 shrink-0">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Gần đây:
          </span>
          {availableRecentTests.slice(0, 12).map((rt) => {
            const catalogItem = catalog.find((c) => c.code === rt.code);
            if (!catalogItem) return null;
            return (
              <button
                key={rt.code}
                type="button"
                onClick={() => handleAddTest(catalogItem)}
                className="text-[10.5px] font-semibold bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 hover:border-amber-400 transition-all shadow-2xs active:scale-95 shrink-0"
                title={`${rt.name} [${rt.code}] — ${rt.category}`}
              >
                + {rt.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Package Quick Chips (Swipeable Horizontal Scroll on Mobile) */}
      {testPackages.length > 0 && (
        <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200/80 rounded-xl overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 px-1 shrink-0">
            <Layers className="w-3.5 h-3.5 text-slate-400" /> Gói nhanh:
          </span>
          {testPackages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => handleSelectPackage(pkg.id)}
              className="text-[11px] font-bold bg-white hover:bg-emerald-600 text-slate-700 hover:text-white px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-600 transition-all shadow-2xs active:scale-95 shrink-0"
            >
              + {pkg.name} ({pkg.codes.length})
            </button>
          ))}
        </div>
      )}

      {/* Catalog Search & Add Dropdown */}
      <div className="relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Tìm chỉ số → Enter thêm nhanh, ↑↓ chọn, Esc đóng"
            className="w-full pl-9 pr-8 py-2 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {searchTerm && (
          <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto p-1 space-y-0.5">
            {filteredCatalog.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 font-medium">
                Không tìm thấy chỉ số xét nghiệm nào khớp với từ khóa "{searchTerm}"
              </div>
            ) : (
              filteredCatalog.map((item, idx) => {
                const isSelected = selectedTests.some((t) => t.code === item.code);
                const isHighlighted = idx === highlightedIndex && !isSelected;
                return (
                  <div
                    key={item.code}
                    onClick={() => {
                      if (!isSelected) {
                        handleAddTest(item);
                        setHighlightedIndex(0);
                      }
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isHighlighted
                        ? 'bg-emerald-100 text-emerald-900 font-bold ring-1 ring-emerald-300'
                        : 'hover:bg-emerald-50 text-slate-800 font-medium'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <span className="ml-2 font-mono text-[10.5px] text-slate-400">[{item.code}]</span>
                      <span className="ml-2 text-[10.5px] text-emerald-700 font-semibold">{item.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-slate-500 font-semibold">
                        {(item.price || 0).toLocaleString('vi-VN')} đ
                      </span>
                      {isSelected ? (
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Đã chọn</span>
                      ) : isHighlighted ? (
                        <kbd className="text-[9px] font-mono bg-emerald-200 text-emerald-800 px-1 py-0.5 rounded">Enter</kbd>
                      ) : (
                        <Plus className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Main Selected Tests Table */}
      <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 w-8 text-center">STT</th>
                <th className="py-2.5 px-3 min-w-[140px]">TÊN CHỈ SỐ</th>
                <th className="py-2.5 px-2.5 w-28 text-center">
                  KẾT QUẢ
                  <span className="block text-[9px] font-normal text-slate-400 mt-0.5">Enter↓ Tab→</span>
                </th>
                <th className="py-2.5 px-2 w-16 text-center">ĐƠN VỊ</th>
                <th className="py-2.5 px-2.5 w-28 text-center">THAM CHIẾU</th>
                <th className="py-2.5 px-2.5 w-32">ĐÁNH GIÁ / GHI CHÚ</th>
                <th className="py-2.5 px-2 w-10 text-center">XÓA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {selectedTests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <TestTube className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">Chưa có chỉ số xét nghiệm nào được chọn</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Chọn gói xét nghiệm nhanh ở trên hoặc gõ tìm kiếm chỉ số để bắt đầu
                    </p>
                  </td>
                </tr>
              ) : (
                selectedTests.map((t, idx) => {
                  const evalRes = evaluateTestIndicator(t.code, t.category, t.unit, t.result, t.refMin, t.refMax);
                  const isAbnormal = evalRes.isAbnormal;

                  return (
                    <tr
                      key={t.code || idx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isAbnormal ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-900 block">{t.name}</span>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400">{t.code}</span>
                          {t.category && (
                            <span className="text-[9.5px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                              {t.category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ô nhập kết quả — Enter = next row, Tab = next row (skip note) */}
                      <td className="py-2 px-2.5">
                        <input
                          ref={(el) => setResultInputRef(t.code, el)}
                          type="text"
                          value={t.result}
                          onChange={(e) => handleResultChange(t.code, e.target.value)}
                          onKeyDown={(e) => handleResultKeyDown(e, idx)}
                          placeholder="Nhập KQ..."
                          className={`w-full px-2 py-1.5 min-h-[36px] text-center font-mono font-bold rounded-lg border text-xs sm:text-xs focus:outline-none transition-all shadow-2xs ${
                            isAbnormal
                              ? 'border-red-400 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-300'
                              : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                          }`}
                        />
                      </td>

                      <td className="py-2 px-2 text-center font-mono text-slate-600">{t.unit || '---'}</td>
                      <td className="py-2 px-2.5 text-center font-mono text-slate-600">
                        {t.refText || (t.refMin !== null && t.refMax !== null ? `${t.refMin} - ${t.refMax}` : '---')}
                      </td>

                      {/* Ghi chú & Đánh giá */}
                      <td className="py-2 px-2.5">
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={t.note || ''}
                            onChange={(e) => handleNoteChange(t.code, e.target.value)}
                            list={`quick-note-${t.code}`}
                            placeholder="Ghi chú / Đánh giá..."
                            className={`w-full px-2 py-1.5 min-h-[36px] border rounded-lg text-[11px] focus:outline-none transition-all ${
                              isAbnormal
                                ? 'bg-red-50/50 border-red-300 text-red-700 font-bold focus:ring-2 focus:ring-red-200'
                                : 'bg-slate-50/50 hover:bg-white focus:bg-white border-slate-300 text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-2xs'
                            }`}
                          />
                          <datalist id={`quick-note-${t.code}`}>
                            {QUICK_NOTE_OPTIONS.map((opt, oIdx) => (
                              <option key={oIdx} value={opt} />
                            ))}
                          </datalist>
                        </div>
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTest(t.code)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
                          title="Xóa chỉ số này"
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
