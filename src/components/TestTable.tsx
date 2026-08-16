import React, { useState } from 'react';
import { TestTube, Plus, Trash2, Search, Layers, Sparkles, CheckSquare, AlertTriangle, CheckCircle, X, ChevronRight } from 'lucide-react';
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
  selectedTests: SelectedTest[];
  setSelectedTests: React.Dispatch<React.SetStateAction<SelectedTest[]>>;
  onSelectPackage: (packageId: string) => void;
}

export default function TestTable({ 
  catalog, 
  testPackages = [],
  selectedTests, 
  setSelectedTests,
  onSelectPackage 
}: TestTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('ALL');

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

  // Auto-fill typical normal results for quick test/demo or standard reference values
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

        const isAllergenItem = t.category?.includes('Dị Nguyên') || t.unit === 'IU/mL';

        if (isAllergenItem) {
          const allergenEval = calculateAllergenGrade(rawVal);
          return {
            ...t,
            result: rawVal,
            note: allergenEval.note
          };
        }

        const evalRes = evaluateResult(rawVal, t.refMin ?? null, t.refMax ?? null);
        return {
          ...t,
          result: rawVal,
          note: evalRes.label
        };
      })
    );
  };

  const handleNoteChange = (code: string, noteVal: string) => {
    setSelectedTests((prev) =>
      prev.map((t) => (t.code === code ? { ...t, note: noteVal } : t))
    );
  };

  // Filter catalog for search dropdown
  const filteredCatalog = catalog.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return false;
    const matchCode = item.code.toLowerCase().includes(q);
    const matchName = item.name.toLowerCase().includes(q);
    const matchCat = item.category?.toLowerCase().includes(q);
    const matchSci = item.scientific?.toLowerCase().includes(q);
    return matchCode || matchName || matchCat || matchSci;
  });

  // Calculate statistics of normal vs abnormal results
  const abnormalCount = selectedTests.filter((t) => {
    const isAbnormal = t.note.includes('Tăng') || t.note.includes('Giảm') || 
                       t.note.includes('CAO') || t.note.includes('THẤP') || 
                       t.note.includes('↑') || t.note.includes('↓') ||
                       t.note.includes('H (') || t.note.includes('L (') ||
                       t.note.includes('Mạnh') || t.note.includes('Dương tính') ||
                       t.note.includes('Độ 2') || t.note.includes('Độ 3') || 
                       t.note.includes('Độ 4') || t.note.includes('Độ 5') || t.note.includes('Độ 6');
    return isAbnormal;
  }).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 lg:p-5 space-y-4 flex-grow flex flex-col transition-all">
      
      {/* 1. Header & Quick Package Switcher */}
      <div className="flex flex-col space-y-3 border-b border-slate-100 pb-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black">
              3
            </span>
            <h2 className="text-xs lg:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
              <TestTube className="w-4 h-4 text-emerald-600" />
              <span>Danh Sách Chỉ Số & Kết Quả Đo</span>
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-full border border-emerald-200">
              {selectedTests.length} chỉ số
            </span>
          </div>

          {/* Quick Dropdown Select */}
          {testPackages.length > 0 && (
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-600 shrink-0" />
              <select
                onChange={(e) => onSelectPackage(e.target.value)}
                className="text-xs bg-sky-50/80 border border-sky-200 text-sky-900 font-bold px-3 py-1.5 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none shadow-2xs"
              >
                <option value="all">-- Chọn Gói Xét Nghiệm Nhanh --</option>
                {testPackages
                  .filter((p) => p.id !== 'all')
                  .map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.codes?.length || 0} chỉ số) {pkg.price ? ` - ${Number(pkg.price).toLocaleString('vi-VN')} đ` : ''}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Quick Package Horizontal Chips */}
        {testPackages.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Gói mẫu:
            </span>
            {testPackages
              .filter((p) => p.id !== 'all')
              .slice(0, 6)
              .map((pkg) => (
                <button
                  type="button"
                  key={pkg.id}
                  onClick={() => onSelectPackage(pkg.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap bg-slate-50 hover:bg-sky-50 hover:text-sky-800 text-slate-700 border border-slate-200 hover:border-sky-300 transition-all shadow-2xs active:scale-95 shrink-0 flex items-center gap-1"
                >
                  <span>{pkg.name}</span>
                  <span className="text-[10px] font-mono opacity-75 text-sky-700 font-extrabold">({pkg.codes?.length || 0})</span>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* 2. Live Search & Quick Add Autocomplete */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm chỉ số xét nghiệm theo tên, mã (GLU, URE, RBC, f1...) để thêm vào bảng..."
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Floating Autocomplete Results */}
        {searchTerm && (
          <div className="absolute left-0 right-0 top-12 bg-white border border-slate-300 rounded-2xl shadow-2xl z-30 max-h-72 overflow-y-auto p-2 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {filteredCatalog.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs font-medium">
                Không tìm thấy chỉ số xét nghiệm nào khớp với "<strong>{searchTerm}</strong>"
              </div>
            ) : (
              filteredCatalog.map((item) => {
                const isAdded = selectedTests.some((t) => t.code === item.code);
                const isAllergen = item.category?.includes('Dị Nguyên') || item.code.startsWith('f') || item.code.startsWith('d');
                return (
                  <div
                    key={item.code}
                    onClick={() => {
                      if (!isAdded) {
                        handleAddTest(item);
                        setSearchTerm('');
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                      isAdded
                        ? 'bg-slate-50 text-slate-400 cursor-default'
                        : isAllergen
                        ? 'hover:bg-red-50 text-slate-800'
                        : 'hover:bg-sky-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <span className={`px-2 py-0.5 rounded-md font-mono font-black text-xs shrink-0 ${
                        isAdded
                          ? 'bg-slate-200 text-slate-500'
                          : isAllergen
                          ? 'bg-red-100 text-red-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}>
                        {item.code}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[10.5px] text-slate-500 flex items-center gap-2">
                          <span>{item.category}</span>
                          {item.unit && <span>• Đơn vị: <strong className="font-mono text-slate-700">{item.unit}</strong></span>}
                          {item.refText && <span>• Tham chiếu: {item.refText}</span>}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAdded}
                      className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 shrink-0 transition-all ${
                        isAdded
                          ? 'bg-slate-200 text-slate-500'
                          : isAllergen
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      {isAdded ? (
                        <span>Đã có</span>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 3. Main Data Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl flex-grow min-h-[340px] bg-slate-50/20 shadow-inner">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 text-[11px] uppercase tracking-wide sticky top-0 z-10">
              <th className="py-3 px-3 w-10 text-center border-r border-slate-800">STT</th>
              <th className="py-3 px-3 w-28 border-r border-slate-800">Mã XN</th>
              <th className="py-3 px-3 border-r border-slate-800">Tên Chỉ Số Xét Nghiệm</th>
              <th className="py-3 px-3 w-36 border-r border-slate-800">Kết Quả Đo</th>
              <th className="py-3 px-3 w-24 border-r border-slate-800">Đơn Vị</th>
              <th className="py-3 px-3 w-36 border-r border-slate-800">Tham Chiếu</th>
              <th className="py-3 px-3 w-40 border-r border-slate-800">Đánh Giá / Ghi Chú</th>
              <th className="py-3 px-3 w-12 text-center">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {selectedTests.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  <TestTube className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Chưa có chỉ số xét nghiệm nào được chọn</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nhập ô tìm kiếm ở trên hoặc click chọn <strong>Gói mẫu</strong> để nạp danh sách nhanh.
                  </p>
                </td>
              </tr>
            ) : (
              selectedTests.map((test, index) => {
                const isAllergenItem = test.category?.includes('Dị Nguyên') || test.unit === 'IU/mL';
                const isHigh = test.note.includes('Tăng') || test.note.includes('CAO') || test.note.includes('↑') || test.note.includes('H (') || test.note.includes('Mạnh') || test.note.includes('Dương tính') || test.note.includes('Độ 2') || test.note.includes('Độ 3') || test.note.includes('Độ 4') || test.note.includes('Độ 5') || test.note.includes('Độ 6');
                const isLow = test.note.includes('Giảm') || test.note.includes('THẤP') || test.note.includes('↓') || test.note.includes('Yếu') || test.note.includes('L (');

                return (
                  <tr 
                    key={test.code} 
                    className={`transition-colors ${
                      isHigh
                        ? 'bg-rose-50/40 hover:bg-rose-50/70'
                        : isLow
                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* STT */}
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-400 border-r border-slate-100">
                      {index + 1}
                    </td>

                    {/* Mã XN */}
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      <span className={`px-2 py-0.5 rounded font-mono font-black text-xs ${
                        isAllergenItem ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-sky-50 text-sky-800 border border-sky-200'
                      }`}>
                        {test.code}
                      </span>
                    </td>

                    {/* Tên chỉ số */}
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      <p className="font-extrabold text-slate-900 leading-snug">{test.name}</p>
                      {test.scientific && (
                        <p className="text-[10px] text-slate-400 italic font-sans">{test.scientific}</p>
                      )}
                      {test.category && (
                        <p className="text-[10px] text-slate-400 font-medium">{test.category}</p>
                      )}
                    </td>

                    {/* Kết Quả Đo Input */}
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={test.result}
                          onChange={(e) => handleResultChange(test.code, e.target.value)}
                          placeholder={isAllergenItem ? "vd: 0.55" : "vd: 5.2"}
                          className={`w-full px-2.5 py-1.5 border rounded-lg font-bold text-xs focus:outline-none transition-all shadow-2xs ${
                            isHigh
                              ? 'border-rose-400 bg-rose-50 text-rose-900 font-black focus:ring-2 focus:ring-rose-200'
                              : isLow
                              ? 'border-amber-400 bg-amber-50 text-amber-900 font-black focus:ring-2 focus:ring-amber-200'
                              : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                          }`}
                        />
                        {isHigh && (
                          <span className="absolute right-2 text-[10px] font-black text-rose-600 uppercase">
                            ↑ CAO
                          </span>
                        )}
                        {isLow && (
                          <span className="absolute right-2 text-[10px] font-black text-amber-600 uppercase">
                            ↓ THẤP
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Đơn vị */}
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 border-r border-slate-100">
                      {test.unit || '-'}
                    </td>

                    {/* Tham chiếu */}
                    <td className="py-2.5 px-3 font-medium text-slate-600 border-r border-slate-100 text-[11px]">
                      {test.refText || '-'}
                    </td>

                    {/* Đánh giá / Ghi chú */}
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      <select
                        value={test.note}
                        onChange={(e) => handleNoteChange(test.code, e.target.value)}
                        className={`w-full px-2 py-1.5 border rounded-lg font-bold text-xs focus:outline-none transition-all ${
                          isHigh
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : isLow
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-50 text-slate-800 border-slate-200'
                        }`}
                      >
                        {QUICK_NOTE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Nút xóa */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveTest(test.code)}
                        title="Xóa chỉ số này khỏi bảng"
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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

      {/* 4. Summary & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-slate-700">
            Tổng số: <strong className="text-slate-900 font-extrabold">{selectedTests.length}</strong> chỉ số
          </span>
          {abnormalCount > 0 ? (
            <span className="flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{abnormalCount} chỉ số bất thường / cần lưu ý</span>
            </span>
          ) : selectedTests.length > 0 ? (
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tất cả chỉ số trong giới hạn</span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center space-x-2">
          {selectedTests.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleAutoFillNormalValues}
                title="Tự động điền giá trị bình thường mẫu cho các chỉ số đang chọn"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 font-bold transition-all shadow-2xs active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Điền giá trị mẫu</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllTests}
                title="Xóa toàn bộ chỉ số đang chọn"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-bold transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa tất cả</span>
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
