import React, { useState } from 'react';
import { TestTube, Plus, Trash2, Search, Layers } from 'lucide-react';
import { evaluateResult } from '@domain/testResult';
import { calculateAllergenGrade } from '@domain/allergen';
import { CatalogItem, SelectedTest, TestPackage } from '@domain/types';

const QUICK_NOTE_OPTIONS = [
  'Bình thường',
  'Âm tính',
  'Dương tính',
  'L (Giảm)',
  'H (Tăng)',
  'Độ 0 (Âm tính)',
  'Độ 1 (Yếu)',
  'Độ 2 (Trung bình)',
  'Độ 3 (Khá)',
  'Độ 4 (Mạnh)',
  'Độ 5 (Rất mạnh)',
  'Độ 6 (Cực mạnh)'
];

const GRADE_SAMPLE_VALUES: Record<string, string> = {
  '0': '<0.35',
  '1': '0.55',
  '2': '1.25',
  '3': '4.50',
  '4': '25.0',
  '5': '75.0',
  '6': '120.0'
};

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

  const filteredCatalog = catalog.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 flex-grow flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
          <TestTube className="w-5 h-5 text-emerald-600" />
          <span>Danh Sách Chỉ Số & Kết Quả ({selectedTests.length})</span>
        </h2>

        {testPackages.length > 0 && (
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-600 shrink-0" />
            <select
              onChange={(e) => onSelectPackage(e.target.value)}
              className="text-xs bg-cyan-50 border border-cyan-200 text-cyan-900 font-semibold px-2.5 py-1.5 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="all">-- Chọn Gói Xét Nghiệm Nhanh --</option>
              {testPackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({pkg.codes?.length || 0} chỉ số) - {pkg.price ? pkg.price.toLocaleString('vi-VN') + ' đ' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm chỉ số xét nghiệm theo tên, mã hoặc nhóm..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />

        {searchTerm && (
          <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto p-2 space-y-1">
            {filteredCatalog.length === 0 ? (
              <p className="text-xs text-slate-500 p-2 text-center">Không tìm thấy chỉ số phù hợp</p>
            ) : (
              filteredCatalog.map((item) => {
                const isAdded = selectedTests.some((t) => t.code === item.code);
                return (
                  <div
                    key={item.code}
                    onClick={() => {
                      if (!isAdded) {
                        handleAddTest(item);
                        setSearchTerm('');
                      }
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                      isAdded
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'hover:bg-emerald-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {item.code}
                      </span>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({item.category})</span>
                    </div>
                    <button
                      disabled={isAdded}
                      className={`px-2 py-1 rounded font-semibold text-[11px] flex items-center space-x-1 ${
                        isAdded
                          ? 'bg-slate-200 text-slate-500'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAdded ? 'Đã Chọn' : 'Thêm'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg flex-grow min-h-[300px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800 text-slate-200 font-semibold border-b border-slate-700">
              <th className="py-2.5 px-3 w-12 text-center">STT</th>
              <th className="py-2.5 px-3 w-28">Mã Xét Nghiệm</th>
              <th className="py-2.5 px-3">Tên Chỉ Số Xét Nghiệm</th>
              <th className="py-2.5 px-3 w-36">Kết Quả Đo</th>
              <th className="py-2.5 px-3 w-24">Đơn Vị</th>
              <th className="py-2.5 px-3 w-36">Tham Chiếu</th>
              <th className="py-2.5 px-3 w-40">Đánh Giá / Ghi Chú</th>
              <th className="py-2.5 px-3 w-12 text-center">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {selectedTests.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  Chưa có chỉ số nào được chọn. Nhập ô tìm kiếm ở trên hoặc chọn Gói Xét Nghiệm.
                </td>
              </tr>
            ) : (
              selectedTests.map((test, index) => {
                const isAllergenItem = test.category?.includes('Dị Nguyên') || test.unit === 'IU/mL';
                const isHighOrLow = test.note.includes('Tăng') || test.note.includes('Giảm') || test.note.includes('Mạnh') || test.note.includes('Dương tính');

                return (
                  <tr key={test.code} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 text-center font-medium text-slate-500">{index + 1}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-700">{test.code}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {test.name}
                      {test.scientific && (
                        <span className="block text-[10px] text-slate-400 font-normal italic">
                          {test.scientific}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={test.result}
                          onChange={(e) => handleResultChange(test.code, e.target.value)}
                          placeholder={isAllergenItem ? "vd: 0.55 hoặc Độ 1" : "vd: 5.2"}
                          className={`w-full px-2.5 py-1.5 border rounded font-semibold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                            isHighOrLow
                              ? 'border-rose-300 bg-rose-50/50 text-rose-900 font-bold'
                              : 'border-slate-300 bg-white text-slate-900'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-600">{test.unit || '-'}</td>
                    <td className="py-2 px-3 text-slate-500 font-medium">{test.refText || '-'}</td>
                    <td className="py-2 px-3">
                      <select
                        value={test.note}
                        onChange={(e) => handleNoteChange(test.code, e.target.value)}
                        className={`w-full px-2 py-1 border rounded text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                          isHighOrLow
                            ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        <option value={test.note}>{test.note}</option>
                        {QUICK_NOTE_OPTIONS.filter((opt) => opt !== test.note).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleRemoveTest(test.code)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Xóa chỉ số"
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
    </div>
  );
}
