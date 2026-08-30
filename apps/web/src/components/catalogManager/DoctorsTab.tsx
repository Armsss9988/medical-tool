import React from 'react';
import { Trash2, Stethoscope, UserPlus, Download, Upload } from 'lucide-react';
import { Doctor } from '@domain/types';
import { exportDoctorsTemplate, parseExcelDoctors } from '@infra/excelService';

interface DoctorsTabProps {
  docsList: Doctor[];
  setDocsList: React.Dispatch<React.SetStateAction<Doctor[]>>;
}

export default function DoctorsTab({ docsList, setDocsList }: DoctorsTabProps) {
  const handleImportDoctorsExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelDoctors(file).then((parsed) => {
        if (parsed.length > 0) {
          setDocsList((prev) => {
            const map = new Map(prev.map((d) => [d.name.toLowerCase(), d]));
            let updatedCount = 0;
            let addedCount = 0;
            parsed.forEach((d) => {
              const key = d.name.toLowerCase();
              if (map.has(key)) {
                map.set(key, { ...map.get(key)!, ...d });
                updatedCount++;
              } else {
                map.set(key, d);
                addedCount++;
              }
            });
            alert(`Đã cập nhật ${updatedCount} bác sĩ cũ và thêm mới ${addedCount} bác sĩ từ Excel (tổng ${map.size} bác sĩ)!`);
            return Array.from(map.values());
          });
        } else {
          alert('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
        }
      });
      e.target.value = '';
    }
  };

  return (
    <div className="p-6 flex-grow overflow-y-auto space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 text-xs">
        <div>
          <h4 className="font-extrabold text-emerald-900 text-sm">
            Danh Sách Bác Sĩ Chỉ Định & Người Đọc Kết Quả
          </h4>
          <p className="text-emerald-700 mt-0.5">
            Dữ liệu này sẽ xuất hiện trong dropdown chọn Bác sĩ và hiển thị trên chữ ký của Phiếu Trả Kết Quả
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg">
            {docsList.length} Bác Sĩ
          </span>
          <button
            type="button"
            onClick={() => exportDoctorsTemplate(docsList)}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition active:scale-95 cursor-pointer text-xs"
            title="Xuất danh sách bác sĩ ra file Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>
          <label
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition active:scale-95 cursor-pointer text-xs"
            title="Nhập danh sách bác sĩ từ file Excel"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Nhập Excel</span>
            <input type="file" accept=".xlsx,.xls" onChange={handleImportDoctorsExcel} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {docsList.map((doc) => (
          <div key={doc.id} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={doc.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDocsList((prev) => prev.map((d) => (d.id === doc.id ? { ...d, name: val } : d)));
                  }}
                  className="font-bold text-slate-900 text-xs border border-slate-200 rounded px-2 py-0.5"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Xóa bác sĩ ${doc.name}?`)) {
                    setDocsList((prev) => prev.filter((d) => d.id !== doc.id));
                  }
                }}
                className="p-1 text-slate-400 hover:text-red-600 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={doc.specialty || ''}
              onChange={(e) => {
                const val = e.target.value;
                setDocsList((prev) => prev.map((d) => (d.id === doc.id ? { ...d, specialty: val } : d)));
              }}
              placeholder="Chuyên khoa..."
              className="w-full text-slate-600 text-xs border border-slate-200 rounded px-2 py-1"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          const name = prompt('Nhập tên Bác sĩ mới:');
          if (name && name.trim()) {
            setDocsList((prev) => [
              ...prev,
              { id: `doc-${Date.now()}`, name: name.trim(), specialty: 'Bác sĩ Đa khoa / Xét nghiệm' }
            ]);
          }
        }}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        <span>Thêm Bác Sĩ Mới</span>
      </button>
    </div>
  );
}

