import React, { useState, useMemo } from 'react';
import { User, Hash, Calendar, Phone, Stethoscope, ChevronDown, ChevronUp, MapPin, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { Patient, Doctor, Gender } from '@domain/types';

interface PatientFormProps {
  patient: Patient;
  setPatient?: React.Dispatch<React.SetStateAction<Patient>>;
  onPatientChange?: (field: keyof Patient, value: any) => void;
  onGenerateNewCode?: () => void;
  doctorsList: Doctor[];
  onOpenDoctorModal?: () => void;
  doctorName?: string;
  setDoctorName?: (val: string) => void;
}

export default function PatientForm({
  patient,
  setPatient,
  onPatientChange,
  onGenerateNewCode,
  doctorsList,
  onOpenDoctorModal,
  doctorName,
  setDoctorName
}: PatientFormProps) {
  const [showMoreTimeFields, setShowMoreTimeFields] = useState(false);

  const handleChange = (field: keyof Patient, value: any) => {
    if (onPatientChange) {
      onPatientChange(field, value);
    } else if (setPatient) {
      setPatient((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Smart Age Calculator from DOB string (supports "1995", "15/08/1995", "1995-08-15", or direct age "32")
  const computedAge = useMemo(() => {
    if (!patient.dob) return null;
    const str = patient.dob.trim();
    if (!str) return null;

    // If pure number < 120, user typed age directly
    const num = parseInt(str, 10);
    if (!isNaN(num) && num > 0 && num <= 120 && !str.includes('/') && !str.includes('-') && str.length <= 3) {
      return `${num} tuổi`;
    }

    const currentYear = new Date().getFullYear();
    // If user typed 4 digits year: "1990"
    if (/^\d{4}$/.test(str)) {
      const year = parseInt(str, 10);
      if (year > 1900 && year <= currentYear) {
        return `${currentYear - year} tuổi`;
      }
    }

    // If user typed DD/MM/YYYY
    const ddmmyyyyMatch = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ddmmyyyyMatch) {
      const year = parseInt(ddmmyyyyMatch[3], 10);
      if (year > 1900 && year <= currentYear) {
        return `${currentYear - year} tuổi`;
      }
    }

    return null;
  }, [patient.dob]);

  // Fill current timestamp for all 4 stages
  const handleFillCurrentTimeForStages = () => {
    const now = new Date();
    const formatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (setPatient) {
      setPatient((prev) => ({
        ...prev,
        orderedAt: formatted,
        paidAt: formatted,
        receivedAt: formatted,
        returnedAt: formatted
      }));
    } else if (onPatientChange) {
      onPatientChange('orderedAt', formatted);
      onPatientChange('paidAt', formatted);
      onPatientChange('receivedAt', formatted);
      onPatientChange('returnedAt', formatted);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 lg:p-5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-100 text-sky-700 text-xs font-black">
            1
          </span>
          <h2 className="text-xs lg:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
            <User className="w-4 h-4 text-sky-600" />
            <span>Thông Tin Bệnh Nhân & Phiếu XN</span>
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowMoreTimeFields(!showMoreTimeFields)}
          className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all border ${
            showMoreTimeFields
              ? 'bg-sky-100 text-sky-800 border-sky-300 shadow-2xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          <span>T/G & Quy Trình Mẫu</span>
          {showMoreTimeFields ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Grid Fields */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        
        {/* Họ và Tên */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-sky-600" />
            <span>Họ & Tên bệnh nhân</span>
            <span className="text-red-500 font-black">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="VÍ DỤ: HOÀNG BẢO NGỌC"
              value={patient.name}
              onChange={(e) => handleChange('name', e.target.value.toUpperCase())}
              className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-extrabold uppercase tracking-wide focus:outline-none transition-all placeholder:normal-case placeholder:font-normal shadow-2xs"
              required
            />
          </div>
        </div>

        {/* Mã Phiếu / Số Bệnh Phẩm */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-red-600" />
              <span>Số bệnh phẩm / Mã phiếu</span>
            </label>
            {onGenerateNewCode && (
              <button
                type="button"
                onClick={onGenerateNewCode}
                title="Tạo mã số bệnh phẩm mới"
                className="text-[10px] text-sky-600 hover:text-sky-800 font-bold flex items-center gap-0.5"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Mã mới</span>
              </button>
            )}
          </div>
          <input
            type="text"
            value={patient.code}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="BN-20260816-001"
            className="w-full bg-red-50/40 hover:bg-red-50/60 focus:bg-white border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 rounded-xl px-3 py-2 text-xs font-mono font-black text-red-600 focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Năm Sinh / Tuổi */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Năm sinh / Tuổi</span>
            </label>
            {computedAge && (
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                {computedAge}
              </span>
            )}
          </div>
          <input
            type="text"
            placeholder="1992 hoặc 22/06/1992"
            value={patient.dob}
            onChange={(e) => handleChange('dob', e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Giới Tính (Segmented Buttons) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính:</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            {(['Nam', 'Nữ', 'Khác'] as Gender[]).map((g) => {
              const isSelected = (patient.gender || 'Nam') === g;
              return (
                <button
                  type="button"
                  key={g}
                  onClick={() => handleChange('gender', g)}
                  className={`py-1.5 text-center text-xs rounded-lg font-bold transition-all ${
                    isSelected
                      ? 'bg-white text-sky-900 shadow-xs border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Số Điện Thoại */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-sky-600" />
            <span>Số điện thoại:</span>
          </label>
          <input
            type="text"
            placeholder="098 3633677"
            value={patient.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-semibold focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Bác Sĩ Chỉ Định */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1 truncate">
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
              <span>BS chỉ định:</span>
            </label>
            {onOpenDoctorModal && (
              <button
                type="button"
                onClick={onOpenDoctorModal}
                className="text-[10px] text-sky-600 hover:text-sky-800 font-bold hover:underline shrink-0"
              >
                + Thêm
              </button>
            )}
          </div>
          <select
            value={doctorName || patient.doctor || (doctorsList[0]?.name || 'BS. Trần Hoài Long')}
            onChange={(e) => {
              const val = e.target.value;
              if (setDoctorName) setDoctorName(val);
              handleChange('doctor', val);
            }}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-bold focus:outline-none transition-all shadow-2xs truncate"
          >
            {doctorsList.map((doc, idx) => (
              <option key={`${doc.id || 'doc'}-${idx}`} value={doc.name}>
                {doc.name} {doc.specialty ? `(${doc.specialty})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Địa Chỉ Bệnh Nhân */}
        <div className="md:col-span-4">
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>Địa chỉ bệnh nhân:</span>
          </label>
          <input
            type="text"
            placeholder="Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị"
            value={patient.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Khung Mở Rộng: T/G Chỉ định, Đóng phí, Nhận mẫu, Trả kết quả */}
        {showMoreTimeFields && (
          <div className="md:col-span-4 bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 space-y-2.5 text-xs animate-in fade-in zoom-in-95 duration-150 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>Quy trình mẫu & Dấu mốc thời gian</span>
              </span>
              <button
                type="button"
                onClick={handleFillCurrentTimeForStages}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10.5px] shadow-xs transition active:scale-95"
              >
                <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                <span>Điền giờ hiện tại cho tất cả</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">1. T/G chỉ định:</label>
                <input
                  type="text"
                  placeholder="dd/mm/yyyy hh:mm"
                  value={patient.orderedAt || ''}
                  onChange={(e) => handleChange('orderedAt', e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-sky-500 rounded-lg px-2 py-1 text-xs font-mono font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">2. T/G đóng phí:</label>
                <input
                  type="text"
                  placeholder="dd/mm/yyyy hh:mm"
                  value={patient.paidAt || ''}
                  onChange={(e) => handleChange('paidAt', e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-sky-500 rounded-lg px-2 py-1 text-xs font-mono font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">3. T/G nhận mẫu:</label>
                <input
                  type="text"
                  placeholder="dd/mm/yyyy hh:mm"
                  value={patient.receivedAt || ''}
                  onChange={(e) => handleChange('receivedAt', e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-sky-500 rounded-lg px-2 py-1 text-xs font-mono font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">4. T/G trả kết quả:</label>
                <input
                  type="text"
                  placeholder="dd/mm/yyyy hh:mm"
                  value={patient.returnedAt || ''}
                  onChange={(e) => handleChange('returnedAt', e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-sky-500 rounded-lg px-2 py-1 text-xs font-mono font-medium"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
