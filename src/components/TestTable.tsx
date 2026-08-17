import React, { useState } from 'react';
import { TestTube, Plus, Trash2, Search, Layers, Sparkles, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { evaluateResult } from '@domain/testResult';
import { calculateAllergenGrade } from '@domain/allergen';
import { CatalogItem, SelectedTest, TestPackage } from '@domain/types';

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

interface TestTableProps {
  catalog: CatalogItem[];
  testPackages?: TestPackage[];
  testGroups?: any[];
  selectedTests: SelectedTest[];
  setSelectedTests: React.Dispatch<React.SetStateAction<SelectedTest[]>>;
  showToast?: (message: string, type?: any) => void;
  onOpenInvoiceModal?: () => void;
}

export default function TestTable({ 
  catalog, 
  testPackages = [],
  selectedTests, 
  setSelectedTests,
  showToast,
  onOpenInvoiceModal
}: TestTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddTest = (item: CatalogItem) => {
    if (selectedTests.some((t) => t.code === item.code)) return;

    const isAllergenItem = item.category?.includes('Dị Nguyên') || item.unit === 'IU/mL';
    const defaultNote = isAllergenItem ? 'Âm tính (Độ 0)' : 'Bình thường';

    setSelectedTests((prev) => [
      ...prev,
      {
        ...item,
        result: '',
        note: defaultNote
      }
    ]);
  };

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

        const isAllergen = t.category?.includes('Dị Nguyên') || t.unit === 'IU/mL';
        let autoNote = t.note;

        if (isAllergen) {
          const gradeRes = calculateAllergenGrade(rawVal);
          autoNote = gradeRes.label;
        } else {
          const evalRes = evaluateResult(rawVal, t.refMin, t.refMax);
          autoNote = evalRes.label;
        }

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

    const itemsToAdd = catalog.filter((item) => pkg.testCodes.includes(item.code));

    setSelectedTests((prev) => {
      const existingCodes = new Set(prev.map((t) => t.code));
      const newOnes = itemsToAdd
        .filter((item) => !existingCodes.has(item.code))
        .map((item) => {
          const isAllergenItem = item.category?.includes('Dị Nguyên') || item.unit === 'IU/mL';
          return {
            ...item,
            result: '',
            note: isAllergenItem ? 'Âm tính (Độ 0)' : 'Bình thường'
          };
        });
      return [...prev, ...newOnes];
    });

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

  const totalFee = selectedTests.reduce((sum, item) => sum + (item.price || 0), 0);

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
              Đang chọn: <strong className="text-emerald-700 font-bold">{selectedTests.length}</strong> chỉ số • Tổng phí:{' '}
              <strong className="text-emerald-700 font-bold font-mono">{totalFee.toLocaleString('vi-VN')} đ</strong>
            </p>
          </div>
        </div>

        {/* Quick Tools Header */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleAutoFillNormalValues}
            disabled={selectedTests.length === 0}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-lg text-xs border border-emerald-200 transition-all flex items-center space-x-1"
            title="Điền tự động kết quả bình thường"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Điền Mẫu Nhanh</span>
          </button>

          {onOpenInvoiceModal && (
            <button
              type="button"
              onClick={onOpenInvoiceModal}
              disabled={selectedTests.length === 0}
              className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-lg text-xs border border-teal-200 transition-all"
            >
              Thu Phí ({totalFee.toLocaleString('vi-VN')} đ)
            </button>
          )}

          <button
            type="button"
            onClick={handleClearAllTests}
            disabled={selectedTests.length === 0}
            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-lg text-xs border border-rose-200 transition-all flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa Hết</span>
          </button>
        </div>
      </div>

      {/* Package Quick Chips */}
      {testPackages.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 px-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" /> Gói nhanh:
          </span>
          {testPackages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => handleSelectPackage(pkg.id)}
              className="text-[11px] font-bold bg-white hover:bg-emerald-600 text-slate-700 hover:text-white px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-600 transition-all shadow-2xs active:scale-95"
            >
              + {pkg.name} ({pkg.testCodes.length})
            </button>
          ))}
        </div>
      )}

      {/* Catalog Search & Add Dropdown */}
      <div className="relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm chỉ số xét nghiệm để thêm (gõ tên, mã, nhóm sinh hóa, huyết học, dị nguyên...)"
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
          <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto p-1 space-y-1">
            {filteredCatalog.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 font-medium">
                Không tìm thấy chỉ số xét nghiệm nào khớp với từ khóa "{searchTerm}"
              </div>
            ) : (
              filteredCatalog.map((item) => {
                const isSelected = selectedTests.some((t) => t.code === item.code);
                return (
                  <div
                    key={item.code}
                    onClick={() => {
                      handleAddTest(item);
                      setSearchTerm('');
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
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
                <th className="py-2.5 px-2.5 w-28 text-center">KẾT QUẢ</th>
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
                  const evalRes = evaluateResult(t.result, t.refMin, t.refMax);
                  const isAbnormal = evalRes.status !== 'normal';

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

                      {/* Ô nhập kết quả */}
                      <td className="py-2 px-2.5">
                        <input
                          type="text"
                          value={t.result}
                          onChange={(e) => handleResultChange(t.code, e.target.value)}
                          placeholder="Nhập KQ..."
                          className={`w-full px-2 py-1 text-center font-mono font-bold rounded-lg border text-xs focus:outline-none transition-all shadow-2xs ${
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
                            className={`w-full px-2 py-1 rounded-lg border text-[11px] font-semibold focus:outline-none transition-all ${
                              isAbnormal
                                ? 'border-red-300 bg-red-50/60 text-red-700 font-bold'
                                : 'border-slate-300 text-slate-700'
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
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
