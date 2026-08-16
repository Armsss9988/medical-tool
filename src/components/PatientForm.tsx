import React, { useState } from 'react';
import { User, Hash, Calendar, Phone, Stethoscope, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Patient, Doctor, Gender } from '@domain/types';

interface PatientFormProps {
  patient: Patient;
  onPatientChange: (field: keyof Patient, value: any) => void;
  doctorsList: Doctor[];
  onOpenDoctorModal?: () => void;
}

export default function PatientForm({
  patient,
  onPatientChange,
  doctorsList,
  onOpenDoctorModal
}: PatientFormProps) {
  const [showMoreTimeFields, setShowMoreTimeFields] = useState(false);

  const handleChange = (field: keyof Patient, value: string) => {
    onPatientChange(field, value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 transition-all">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <h2 className="text-sm font-bold text-sky-900 flex items-center gap-1.5">
          <User className="w-4 h-4 text-sky-600" />
          I. THÔNG TIN BỆNH NHÂN & PHIẾU XÉT NGHIỆM
        </h2>
        <button
          type="button"
          onClick={() => setShowMoreTimeFields(!showMoreTimeFields)}
          className="text-[11px] text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1 bg-sky-50 px-2.5 py-1 rounded transition"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>T/G & Mẫu XN</span>
          {showMoreTimeFields ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        
        {/* Họ và Tên */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-sky-600" /> Họ & Tên bệnh nhân <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="VÍ DỤ: HOÀNG BẢO NGỌC"
            value={patient.name}
            onChange={(e) => handleChange('name', e.target.value.toUpperCase())}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-3 py-1.5 text-xs text-slate-900 font-bold uppercase tracking-wide focus:outline-none transition-all placeholder:normal-case placeholder:font-normal"
          />
        </div>

        {/* Mã Phiếu / Số Bệnh Phẩm */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-red-600" /> Mã phiếu XN / Số bệnh phẩm:
          </label>
          <input
            type="text"
            value={patient.code}
            onChange={(e) => handleChange('code', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-3 py-1.5 text-xs font-mono font-extrabold text-red-600 focus:outline-none transition-all"
          />
        </div>

        {/* Năm Sinh / Tuổi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-sky-600" /> Năm sinh / Tuổi:
          </label>
          <input
            type="text"
            placeholder="22/06/2018 hoặc 32"
            value={patient.dob}
            onChange={(e) => handleChange('dob', e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none transition-all"
          />
        </div>

        {/* Giới Tính */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính:</label>
          <select
            value={patient.gender}
            onChange={(e) => handleChange('gender', e.target.value as Gender)}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none transition-all"
          >
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        {/* Số Điện Thoại */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-sky-600" /> Số điện thoại:
          </label>
          <input
            type="text"
            placeholder="098 3633677"
            value={patient.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none transition-all"
          />
        </div>

        {/* Bác Sĩ Chỉ Định */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" /> Bác sĩ chỉ định:
            </label>
            {onOpenDoctorModal && (
              <button
                type="button"
                onClick={onOpenDoctorModal}
                className="text-[10px] text-sky-600 hover:text-sky-800 font-bold hover:underline"
              >
                + Thêm BS
              </button>
            )}
          </div>
          <select
            value={patient.address || 'BS. Trần Hoài Long'}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none transition-all"
          >
            {doctorsList.map((doc) => (
              <option key={doc.id} value={doc.name}>
                {doc.name} {doc.specialty ? `(${doc.specialty})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Địa Chỉ Bệnh Nhân */}
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-sky-600" /> Địa chỉ bệnh nhân:
          </label>
          <input
            type="text"
            placeholder="Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị"
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
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-0.5">T/G đóng phí:</label>
              <input
                type="text"
                value={patient.paidAt || ''}
                onChange={(e) => handleChange('paidAt', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-0.5">T/G nhận mẫu:</label>
              <input
                type="text"
                value={patient.receivedAt || ''}
                onChange={(e) => handleChange('receivedAt', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-0.5">T/G trả kết quả:</label>
              <input
                type="text"
                value={patient.returnedAt || ''}
                onChange={(e) => handleChange('returnedAt', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-0.5">Tình trạng mẫu:</label>
              <select
                value={patient.sampleStatus || 'Đạt'}
                onChange={(e) => handleChange('sampleStatus', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-emerald-700"
              >
                <option value="Đạt">Đạt chất lượng</option>
                <option value="Tán huyết">Tán huyết nhẹ</option>
                <option value="Đông dây">Mẫu có đông dây</option>
                <option value="Không đạt">Không đạt tiêu chuẩn</option>
              </select>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
