import { useState, useMemo } from 'react';
import { Stethoscope, UserPlus, Download, Upload, Save, Loader2, Search } from 'lucide-react';
import { Doctor } from '@domain/types';
import { exportDoctorsTemplate, parseExcelDoctors } from '@infra/excelService';
import { DoctorCard } from './DoctorCard';
import { DoctorFormModal } from './DoctorFormModal';

interface DoctorTableProps {
  docsList: Doctor[];
  setDocsList: React.Dispatch<React.SetStateAction<Doctor[]>>;
  onSaveDoctors?: (newDoctors: Doctor[]) => void;
  onSaveAllData?: (data: { doctorsList?: Doctor[] }) => Promise<void>;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function DoctorTable({
  docsList,
  setDocsList,
  onSaveDoctors,
  onSaveAllData,
  showToast
}: DoctorTableProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docsList;
    const q = searchQuery.toLowerCase().trim();
    return docsList.filter(
      (doc) =>
        doc.name.toLowerCase().includes(q) ||
        (doc.specialty && doc.specialty.toLowerCase().includes(q)) ||
        (doc.phone && doc.phone.includes(q))
    );
  }, [docsList, searchQuery]);

  const handleOpenAdd = () => {
    setDoctorToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setDoctorToEdit(doc);
    setIsModalOpen(true);
  };

  const handleSaveDoctor = (doc: Doctor) => {
    if (doctorToEdit) {
      setDocsList((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
      showToast?.(`Đã cập nhật thông tin bác sĩ ${doc.name}!`, 'success');
    } else {
      setDocsList((prev) => [doc, ...prev]);
      showToast?.(`Đã thêm bác sĩ ${doc.name}!`, 'success');
    }
  };

  const handleDeleteDoctor = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bác sĩ "${name}" khỏi danh mục?`)) {
      setDocsList((prev) => prev.filter((d) => d.id !== id));
      showToast?.(`Đã xóa bác sĩ ${name}!`, 'info');
    }
  };

  const handleSaveDoctorsNow = async () => {
    try {
      setIsSaving(true);
      if (onSaveDoctors) onSaveDoctors(docsList);
      if (onSaveAllData) await onSaveAllData({ doctorsList: docsList });
      showToast?.('Đã lưu danh sách Bác Sĩ thành công!', 'success');
    } catch (err) {
      console.error('[DoctorTable] Lỗi lưu bác sĩ:', err);
      showToast?.('Có lỗi xảy ra khi lưu danh sách bác sĩ!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportDoctorsExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelDoctors(file);
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
          showToast?.(
            `Đã cập nhật ${updatedCount} bác sĩ cũ và thêm ${addedCount} bác sĩ mới từ Excel!`,
            'success'
          );
          return updatedList;
        });
      } else {
        showToast?.('Không tìm thấy dữ liệu hợp lệ trong file Excel.', 'warning');
      }
    } catch (err) {
      showToast?.('Lỗi khi đọc file Excel: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50 overflow-hidden">
      {/* BANNER & SEARCH SECTION */}
      <div className="p-4 sm:p-6 pb-3 shrink-0 space-y-4">
        {/* BANNER & ACTION BAR */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 text-xs shadow-2xs">
          <div>
            <h4 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-700" />
              <span>Danh Sách Bác Sĩ Chỉ Định & Chuyên Gia</span>
            </h4>
            <p className="text-emerald-700 mt-0.5">
              Dữ liệu bác sĩ được dùng cho phiếu kết quả xét nghiệm, chỉ định lâm sàng và kết luận chuyên gia.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl">
              {docsList.length} Bác Sĩ
            </span>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Thêm Bác Sĩ</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDoctorsNow}
              disabled={isSaving}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-xs"
              title="Lưu danh sách bác sĩ trực tiếp vào Cơ Sở Dữ Liệu"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Danh Sách'}</span>
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
      </div>

      {/* DANH SÁCH BÁC SĨ CARDS (SCROLL AREA) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-6">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Stethoscope className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Chưa có bác sĩ nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredDocs.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteDoctor}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODAL THÊM / SỬA BÁC SĨ */}
      <DoctorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        doctorToEdit={doctorToEdit}
        onSave={handleSaveDoctor}
      />
    </div>
  );
}
