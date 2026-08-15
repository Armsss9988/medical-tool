import React, { useState } from 'react';
import { User, Hash, Stethoscope, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showMoreTimeFields, setShowMoreTimeFields] = useState(false);

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

        <button
          type="button"
          onClick={() => setShowMoreTimeFields(!showMoreTimeFields)}
          className="flex items-center space-x-1 text-[11px] text-slate-500 hover:text-sky-700 font-semibold focus:outline-none"
        >
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          <span>{showMoreTimeFields ? 'Thu gọn T/G' : 'T/G & Mẫu XN'}</span>
          {showMoreTimeFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        
        {/* Họ và Tên Bệnh Nhân */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-sky-600" /> Họ & Tên bệnh nhân <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ví dụ: HOÀNG BẢO NGỌC"
            value={patient.name}
            onChange={(e) => handleChange('name', e.target.value.toUpperCase())}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-3 py-1.5 text-xs text-red-600 placeholder-slate-400 focus:outline-none transition-all font-extrabold uppercase tracking-wide"
          />
        </div>

        {/* Mã Phiếu Xét Nghiệm */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-sky-600" /> Mã phiếu XN:
          </label>
          <input
            type="text"
            value={patient.code}
            onChange={(e) => handleChange('code', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-sky-900 font-mono font-bold focus:outline-none"
          />
        </div>

        {/* Số Bệnh Phẩm */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-red-500" /> Số bệnh phẩm:
          </label>
          <input
            type="text"
            placeholder="14509"
            value={patient.sampleCode || ''}
            onChange={(e) => handleChange('sampleCode', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-red-600 font-mono font-bold focus:outline-none"
          />
        </div>

        {/* Năm Sinh / Tuổi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Năm sinh / Tuổi:</label>
          <input
            type="text"
            placeholder="22/06/2018 hoặc 1985"
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
            placeholder="098 3633677"
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
            placeholder="BS. Trần Hoài Long..."
          />
        </div>

        {/* Địa Chỉ Bệnh Nhân */}
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-sky-600" /> Địa chỉ bệnh nhân:
          </label>
          <input
            type="text"
            placeholder="P. Đồng Sơn – Quảng Trị"
            value={patient.diagnosis}
            onChange={(e) => handleChange('diagnosis', e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none transition-all font-medium"
          />
        </div>

        {/* Khung Mở Rộng: T/G Chỉ định, Đóng phí, Nhận mẫu, Trả kết quả & Tình trạng mẫu */}
        {showMoreTimeFields && (
          <div className="md:col-span-4 bg-sky-50/60 border border-sky-200 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs animate-in fade-in duration-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-0.5">T/G chỉ định:</label>
              <input
                type="text"
                value={patient.orderedAt || ''}
                onChange={(e) => handleChange('orderedAt', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-0.5">T/G đóng phí:</label>
              <input
                type="text"
                value={patient.paidAt || ''}
                onChange={(e) => handleChange('paidAt', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-0.5">T/G nhận mẫu:</label>
              <input
                type="text"
                value={patient.receivedAt || ''}
                onChange={(e) => handleChange('receivedAt', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-0.5">T/G trả kết quả:</label>
              <input
                type="text"
                value={patient.returnedAt || ''}
                onChange={(e) => handleChange('returnedAt', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-0.5">Tình trạng mẫu:</label>
              <select
                value={patient.sampleStatus || 'Đạt'}
                onChange={(e) => handleChange('sampleStatus', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-[11px] font-bold"
              >
                <option value="Đạt">Đạt</option>
                <option value="Không đạt">Không đạt</option>
                <option value="Cần lấy lại mẫu">Cần lấy lại mẫu</option>
              </select>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
