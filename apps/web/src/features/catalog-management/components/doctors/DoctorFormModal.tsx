import { useState, useEffect } from 'react';
import { X, UserPlus, Save, Stethoscope, Phone, Briefcase } from 'lucide-react';
import { Doctor } from '@domain/types';

interface DoctorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorToEdit: Doctor | null;
  onSave: (doc: Doctor) => void;
}

export function DoctorFormModal({
  isOpen,
  onClose,
  doctorToEdit,
  onSave
}: DoctorFormModalProps) {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('Bác sĩ Đa khoa / Xét nghiệm');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (doctorToEdit) {
      setName(doctorToEdit.name || '');
      setSpecialty(doctorToEdit.specialty || 'Bác sĩ Đa khoa / Xét nghiệm');
      setPhone(doctorToEdit.phone || '');
    } else {
      setName('');
      setSpecialty('Bác sĩ Đa khoa / Xét nghiệm');
      setPhone('');
    }
    setError('');
  }, [doctorToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Vui lòng nhập họ và tên Bác sĩ!');
      return;
    }

    const doc: Doctor = {
      id: doctorToEdit ? doctorToEdit.id : `doc_${Date.now()}`,
      name: trimmedName,
      specialty: specialty.trim() || 'Bác sĩ Đa khoa / Xét nghiệm',
      phone: phone.trim() || undefined
    };

    onSave(doc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              {doctorToEdit ? <Stethoscope className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">
                {doctorToEdit ? 'Chỉnh Sửa Thông Tin Bác Sĩ' : 'Thêm Bác Sĩ Mới'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {doctorToEdit ? `Mã ID: ${doctorToEdit.id}` : 'Thêm bác sĩ chỉ định / người duyệt kết quả'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Họ & Tên Bác Sĩ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="VD: BS. CKII Lê Văn A"
                className="w-full text-xs font-bold pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chuyên Khoa / Chức Danh
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="VD: Bác sĩ Đa khoa / Xét nghiệm"
                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số Điện Thoại Liên Hệ
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0912.xxx.xxx"
                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{doctorToEdit ? 'Lưu Thay Đổi' : 'Tạo Bác Sĩ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
