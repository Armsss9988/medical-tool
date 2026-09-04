import React, { useState } from 'react';
import { 
  Trash2, 
  Stethoscope, 
  UserPlus, 
  Download, 
  Upload, 
  Phone, 
  Save, 
  Loader2, 
  Search,
  Briefcase
} from 'lucide-react';
import { Doctor } from '@domain/types';
import { exportDoctorsTemplate, parseExcelDoctors } from '@infra/excelService';

interface DoctorsTabProps {
  docsList: Doctor[];
  setDocsList: React.Dispatch<React.SetStateAction<Doctor[]>>;
  onSaveDoctors?: (newDoctors: Doctor[]) => void;
  onSaveAllData?: (data: { doctorsList?: Doctor[] }) => Promise<void>;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function DoctorsTab({ 
  docsList, 
  setDocsList,
  onSaveDoctors,
  onSaveAllData,
  showToast
}: DoctorsTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State form thêm mới bác sĩ inline
  const [newName, setNewName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('Bác sĩ Đa khoa / Xét nghiệm');
  const [newPhone, setNewPhone] = useState('');

  const handleAddDoctor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) {
      if (showToast) showToast('Vui lòng nhập họ và tên Bác sĩ!', 'warning');
      else alert('Vui lòng nhập họ và tên Bác sĩ!');
      return;
    }

    const newDoc: Doctor = {
      id: `doc_${Date.now()}`,
      name: trimmedName,
      specialty: newSpecialty.trim() || 'Bác sĩ Đa khoa / Xét nghiệm',
      phone: newPhone.trim() || undefined
    };

    setDocsList((prev) => [newDoc, ...prev]);
    setNewName('');
    setNewPhone('');
    if (showToast) showToast(`Đã thêm ${trimmedName} vào danh sách! Nhấn "Lưu Bác Sĩ" để đồng bộ.`, 'info');
  };

  const handleSaveDoctorsNow = async () => {
    try {
      setIsSaving(true);
      if (onSaveDoctors) {
        onSaveDoctors(docsList);
      }
      if (onSaveAllData) {
        await onSaveAllData({ doctorsList: docsList });
      }
      if (showToast) {
        showToast('Đã lưu và đồng bộ danh sách Bác Sĩ thành công!', 'success');
      } else {
        alert('Đã lưu và đồng bộ danh sách Bác Sĩ thành công!');
      }
    } catch (err) {
      console.error('[DoctorsTab] Lỗi lưu bác sĩ:', err);
      if (showToast) {
        showToast('Có lỗi xảy ra khi lưu danh sách bác sĩ!', 'error');
      } else {
        alert('Có lỗi xảy ra khi lưu danh sách bác sĩ!');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportDoctorsExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelDoctors(file).then((parsed) => {
        if (parsed.length > 0) {
          setDocsList((prev) => {
            const map = new Map(prev.map((d) => [d.name.toLowerCase().trim(), d]));
            let updatedCount = 0;
            let addedCount = 0;
            parsed.forEach((d) => {
              const key = d.name.toLowerCase().trim();
              if (map.has(key)) {
                map.set(key, { ...map.get(key)!, ...d });
                updatedCount++;
              } else {
                map.set(key, {
                  ...d,
                  id: d.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
                });
                addedCount++;
              }
            });
            const updatedList = Array.from(map.values());
            const msg = `Đã cập nhật ${updatedCount} bác sĩ cũ và thêm mới ${addedCount} bác sĩ từ Excel (tổng ${updatedList.length} bác sĩ)! Nhớ bấm "Lưu Danh Sách Bác Sĩ".`;
            if (showToast) showToast(msg, 'success');
            else alert(msg);
            return updatedList;
          });
        } else {
          const msg = 'Không tìm thấy dữ liệu hợp lệ trong file Excel.';
          if (showToast) showToast(msg, 'warning');
          else alert(msg);
        }
      });
      e.target.value = '';
    }
  };

  const filteredDocs = docsList.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      doc.name.toLowerCase().includes(q) ||
      (doc.specialty && doc.specialty.toLowerCase().includes(q)) ||
      (doc.phone && doc.phone.includes(q))
    );
  });

  return (
    <div className="p-6 flex-grow overflow-y-auto space-y-5">
      {/* BANNER & ACTION BAR */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 text-xs shadow-2xs">
        <div>
          <h4 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-700" />
            <span>Danh Sách Bác Sĩ Chỉ Định & Chuyên Gia</span>
          </h4>
          <p className="text-emerald-700 mt-0.5">
            Dữ liệu này được lưu trực tiếp vào Cơ sở dữ liệu và dùng cho danh sách Bác sĩ chỉ định / người đọc kết quả.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl">
            {docsList.length} Bác Sĩ
          </span>
          <button
            type="button"
            onClick={handleSaveDoctorsNow}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-xs"
            title="Lưu danh sách bác sĩ trực tiếp vào Cơ Sở Dữ Liệu"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Danh Sách Bác Sĩ'}</span>
          </button>
          <button
            type="button"
            onClick={() => exportDoctorsTemplate(docsList)}
            className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-xs"
            title="Xuất danh sách bác sĩ ra file Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
          <label
            className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-xs"
            title="Nhập danh sách bác sĩ từ file Excel"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Nhập Excel</span>
            <input type="file" accept=".xlsx,.xls" onChange={handleImportDoctorsExcel} className="hidden" />
          </label>
        </div>
      </div>

      {/* FORM THÊM MỚI BÁC SĨ INLINE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <h5 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-emerald-600" />
          <span>Thêm Bác Sĩ Mới</span>
        </h5>
        <form onSubmit={handleAddDoctor} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Họ & Tên Bác sĩ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: BS. CKII Lê Văn A"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Chuyên khoa
            </label>
            <input
              type="text"
              placeholder="VD: Bác sĩ Đa khoa / Xét nghiệm"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              className="w-full text-xs text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Số điện thoại
            </label>
            <input
              type="text"
              placeholder="0912.xxx.xxx"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full text-xs text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow transition active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Thêm Mới</span>
            </button>
          </div>
        </form>
      </div>

      {/* TÌM KIẾM BÁC SĨ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, chuyên khoa, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Hiển thị {filteredDocs.length}/{docsList.length} bác sĩ
        </span>
      </div>

      {/* DANH SÁCH BÁC SĨ CARDS */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Stethoscope className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Chưa có bác sĩ nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocs.map((doc) => (
            <div 
              key={doc.id} 
              className="p-4 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-2xs hover:shadow-xs transition space-y-2.5 group"
            >
              {/* Card Header: Icon + Name + Delete */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-grow min-w-0">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={doc.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDocsList((prev) => prev.map((d) => (d.id === doc.id ? { ...d, name: val } : d)));
                    }}
                    placeholder="Họ tên Bác sĩ"
                    className="font-bold text-slate-900 text-xs border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1 w-full focus:bg-emerald-50/30 focus:outline-none transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Xóa bác sĩ ${doc.name}?`)) {
                      setDocsList((prev) => prev.filter((d) => d.id !== doc.id));
                    }
                  }}
                  className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0 cursor-pointer"
                  title="Xóa bác sĩ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Specialty Input */}
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-2.5 py-1 border border-slate-100">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={doc.specialty || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDocsList((prev) => prev.map((d) => (d.id === doc.id ? { ...d, specialty: val } : d)));
                  }}
                  placeholder="Chuyên khoa..."
                  className="w-full text-slate-600 text-[11px] bg-transparent border-none focus:outline-none"
                />
              </div>

              {/* Phone Input */}
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-2.5 py-1 border border-slate-100">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={doc.phone || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDocsList((prev) => prev.map((d) => (d.id === doc.id ? { ...d, phone: val } : d)));
                  }}
                  placeholder="Số điện thoại..."
                  className="w-full text-slate-600 text-[11px] bg-transparent border-none focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
