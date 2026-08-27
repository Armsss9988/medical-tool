import React from 'react';
import { Trash2, Stethoscope, UserPlus } from 'lucide-react';
import { Doctor } from '@domain/types';

interface DoctorsTabProps {
  docsList: Doctor[];
  setDocsList: React.Dispatch<React.SetStateAction<Doctor[]>>;
}

export default function DoctorsTab({ docsList, setDocsList }: DoctorsTabProps) {
  return (
    <div className="p-6 flex-grow overflow-y-auto space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs">
        <div>
          <h4 className="font-extrabold text-emerald-900 text-sm">
            Danh Sách Bác Sĩ Chỉ Định & Người Đọc Kết Quả
          </h4>
          <p className="text-emerald-700 mt-0.5">
            Dữ liệu này sẽ xuất hiện trong dropdown chọn Bác sĩ và hiển thị trên chữ ký của Phiếu Trả Kết Quả
          </p>
        </div>
        <span className="font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg">
          {docsList.length} Bác Sĩ
        </span>
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
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
      >
        <UserPlus className="w-4 h-4" />
        <span>Thêm Bác Sĩ Mới</span>
      </button>
    </div>
  );
}
