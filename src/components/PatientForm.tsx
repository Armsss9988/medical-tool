import React from 'react';
import { User, Hash, RefreshCw, Clock, Stethoscope, FileText } from 'lucide-react';
import DoctorSelectCombobox from './DoctorSelectCombobox';
import { Patient, Doctor, Gender } from '@domain/types';

interface PatientFormProps {
  patient: Patient;
  setPatient: React.Dispatch<React.SetStateAction<Patient>>;
  onGenerateNewCode: () => void;
  doctorsList?: Doctor[];
}

export default function PatientForm({ 
  patient, 
  setPatient, 
  onGenerateNewCode,
  doctorsList = []
}: PatientFormProps) {
  const handleChange = (field: keyof Patient, value: string) => {
    setPatient((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
          <User className="w-5 h-5 text-emerald-600" />
          <span>Thông Tin Bệnh Nhân</span>
        </h2>
        <button
          onClick={onGenerateNewCode}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
          title="Tạo mã bệnh nhân mới"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tạo Mã Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Mã Bệnh Nhân</label>
          <div className="relative">
            <Hash className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={patient.code}
              onChange={(e) => handleChange('code', e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="BN-YYYYMMDD-001"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Token Tra Cứu</label>
          <input
            type="text"
            value={patient.secretToken}
            onChange={(e) => handleChange('secretToken', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
            placeholder="ABC123"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">Họ và Tên (*)</label>
          <input
            type="text"
            value={patient.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="NGUYỄN VĂN A"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Năm Sinh / Giới Tính</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={patient.dob}
              onChange={(e) => handleChange('dob', e.target.value)}
              className="w-1/2 px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="1990"
            />
            <select
              value={patient.gender}
              onChange={(e) => handleChange('gender', e.target.value as Gender)}
              className="w-1/2 px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
          <input
            type="text"
            value={patient.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="0912345678"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ</label>
          <input
            type="text"
            value={patient.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="Số 10, Quận Đống Đa, Hà Nội"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">Chẩn Đoán Lâm Sàng</label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={patient.diagnosis}
              onChange={(e) => handleChange('diagnosis', e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Kiểm tra sức khỏe định kỳ / Nghi dị ứng"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
