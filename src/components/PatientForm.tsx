import React from 'react';
import { User, Hash, Stethoscope, FileText } from 'lucide-react';
import DoctorSelectCombobox from './DoctorSelectCombobox';
import { Patient, Doctor, Gender } from '@domain/types';

interface PatientFormProps {
  patient: Patient;
  setPatient: React.Dispatch<React.SetStateAction<Patient>>;
  onGenerateNewCode?: () => void;
  doctorsList?: Doctor[];
}

export default function PatientForm({ 
  patient, 
  setPatient, 
  doctorsList = []
}: PatientFormProps) {
  const handleChange = (field: keyof Patient, value: string) => {
    setPatient((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
        <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-4 h-4 text-sky-600" />
          <span>I. Thông Tin Bệnh Nhân & Phiếu Xét Nghiệm</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        
        {/* Họ và Tên Bệnh Nhân */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-sky-600" /> Họ & Tên bệnh nhân <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ví dụ: NGUYỄN VĂN A"
            value={patient.name}
            onChange={(e) => handleChange('name', e.target.value.toUpperCase())}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-bold tracking-wide"
          />
        </div>

        {/* Mã Phiếu Xét Nghiệm (Thay thế cho Mã Bệnh Nhân) */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-sky-600" /> Mã phiếu XN (Tự động):
          </label>
          <input
            type="text"
            value={patient.code}
            onChange={(e) => handleChange('code', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-sky-900 font-mono font-bold focus:outline-none"
          />
        </div>

        {/* Năm Sinh / Tuổi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Năm sinh / Tuổi:</label>
          <input
            type="text"
            placeholder="1985 (41t) hoặc 05/10/1990"
            value={patient.dob}
            onChange={(e) => handleChange('dob', e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none transition-all font-medium"
          />
        </div>

        {/* Giới Tính */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính:</label>
          <select
            value={patient.gender}
            onChange={(e) => handleChange('gender', e.target.value as Gender)}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none transition-all font-medium"
          >
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        {/* Số Điện Thoại */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại:</label>
          <input
            type="text"
            placeholder="0912 345 678"
            value={patient.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none transition-all font-medium"
          />
        </div>

        {/* Bác sĩ chỉ định */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5 text-sky-600" /> Bác sĩ chỉ định:
          </label>
          <DoctorSelectCombobox
            value={patient.address || ''}
            onChange={(val) => handleChange('address', val)}
            doctorsList={doctorsList}
            placeholder="Nhập hoặc chọn Bác sĩ chỉ định..."
          />
        </div>

        {/* Chẩn Đoán Lâm Sàng */}
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-sky-600" /> Chẩn đoán lâm sàng / Lý do khám:
          </label>
          <input
            type="text"
            placeholder="Kiểm tra sức khỏe định kỳ, ngứa dị ứng, nghi ngờ viêm gan..."
            value={patient.diagnosis}
            onChange={(e) => handleChange('diagnosis', e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none transition-all font-medium"
          />
        </div>

      </div>
    </div>
  );
}
