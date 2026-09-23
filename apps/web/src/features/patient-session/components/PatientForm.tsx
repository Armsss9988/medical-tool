import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { User, Hash, Calendar, Phone, Stethoscope, ChevronDown, ChevronUp, MapPin, Sparkles, RefreshCw, Zap, UserPlus } from 'lucide-react';
import { Patient, Doctor, GENDER, GENDER_LIST, Invoice, formatDisplayDate } from '@domain';

function isValidDobParts(day: number, month: number, year: number): boolean {
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  return true;
}

/**
 * Tự động chuẩn hóa chuỗi ngày sinh:
 * - 8 số liên tiếp: 08121994 -> 08/12/1994 (kiểm tra hợp lệ ngày 1-31, tháng 1-12, năm 1900-hiện tại)
 * - 7 số liên tiếp:
 *   + Dạng 8121994 (ngày 8, tháng 12) -> 08/12/1994
 *   + Dạng 1551994 (ngày 15, tháng 5) -> 15/05/1994
 * - 6 số liên tiếp: 081294 -> 08/12/1994
 * - Dấu ngăn cách ., -, khoảng trắng -> /
 */
function formatDobInput(val: string): string {
  const trimmed = val.trim();
  if (!trimmed) return '';

  // 8 chữ số liên tiếp: DDMMYYYY
  if (/^\d{8}$/.test(trimmed)) {
    const day = parseInt(trimmed.slice(0, 2), 10);
    const month = parseInt(trimmed.slice(2, 4), 10);
    const year = parseInt(trimmed.slice(4), 10);
    if (isValidDobParts(day, month, year)) {
      return `${trimmed.slice(0, 2)}/${trimmed.slice(2, 4)}/${trimmed.slice(4)}`;
    }
    return trimmed;
  }

  // 7 chữ số liên tiếp: DMMYYYY hoặc DDMYYYY
  if (/^\d{7}$/.test(trimmed)) {
    const d1 = parseInt(trimmed.slice(0, 1), 10);
    const m2 = parseInt(trimmed.slice(1, 3), 10);
    const d2 = parseInt(trimmed.slice(0, 2), 10);
    const m1 = parseInt(trimmed.slice(2, 3), 10);
    const year = parseInt(trimmed.slice(3), 10);

    const isCase2Valid = isValidDobParts(d1, m2, year) && m2 >= 10; // DMMYYYY (VD: 8121994 -> 08/12/1994)
    const isCase1Valid = isValidDobParts(d2, m1, year) && d2 >= 10; // DDMYYYY (VD: 1551994 -> 15/05/1994)

    if (isCase2Valid && !isCase1Valid) {
      return `0${d1}/${m2}/${year}`;
    }
    if (isCase1Valid && !isCase2Valid) {
      return `${d2}/0${m1}/${year}`;
    }
    if (isCase2Valid && isCase1Valid) {
      // Mặc định chuẩn DDMYYYY
      return `${d2}/0${m1}/${year}`;
    }
    return trimmed;
  }

  // 6 chữ số liên tiếp: DDMMYY
  if (/^\d{6}$/.test(trimmed)) {
    const day = parseInt(trimmed.slice(0, 2), 10);
    const month = parseInt(trimmed.slice(2, 4), 10);
    const yy = parseInt(trimmed.slice(4), 10);
    const currentYear = new Date().getFullYear();
    const currentYY = currentYear % 100;
    const year = yy <= currentYY ? 2000 + yy : 1900 + yy;
    if (isValidDobParts(day, month, year)) {
      return `${trimmed.slice(0, 2)}/${trimmed.slice(2, 4)}/${year}`;
    }
    return trimmed;
  }

  // Dạng có 1 dấu gạch chéo: DD/MYYYY hoặc D/MMYYYY (ví dụ: 15/51994 -> 15/05/1994)
  const oneSlashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})(\d{4})$/);
  if (oneSlashMatch) {
    const d = parseInt(oneSlashMatch[1], 10);
    const m = parseInt(oneSlashMatch[2], 10);
    const y = parseInt(oneSlashMatch[3], 10);
    if (isValidDobParts(d, m, y)) {
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
  }

  // Thay thế dấu chấm, gạch ngang, khoảng trắng thành gạch chéo
  if (/^\d{1,2}[.\- ]\d{1,2}[.\- ]\d{4}$/.test(trimmed)) {
    return trimmed.replace(/[.\- ]/g, '/');
  }

  return trimmed;
}

interface PatientFormProps {
  patient: Patient;
  setPatient?: React.Dispatch<React.SetStateAction<Patient>>;
  onPatientChange?: <K extends keyof Patient>(field: K, value: Patient[K]) => void;
  onGenerateNewCode?: () => void;
  doctorsList: Doctor[];
  onOpenDoctorModal?: () => void;
  doctorName?: string;
  setDoctorName?: (val: string) => void;
  /** Ref exposed so App can trigger focus from outside */
  nameInputRef?: React.RefObject<HTMLInputElement | null>;
  /** If true, auto-focus name input on mount */
  autoFocusName?: boolean;
  /** Code of the report being edited from Report Manager, if any */
  editingReportCode?: string | null;
  /** Callback to navigate to next tab on mobile */
  onNavigateNext?: () => void;
  /** Trạng thái thu phí thực tế từ Hóa đơn (SSOT) */
  isPaid?: boolean;
  /** Hóa đơn tương ứng với phiếu hiện tại nếu có */
  invoice?: Invoice | null;
  /** Callback mở modal Hóa đơn */
  onOpenInvoiceModal?: () => void;
  /** Callback tạo ca mới (reset thông tin phiếu) */
  onResetAll?: () => void;
  /** Callback lưu nhanh phiếu khám */
  onSaveReport?: () => string | null;
}

export default function PatientForm({
  patient,
  setPatient,
  onPatientChange,
  onGenerateNewCode,
  doctorsList,
  onOpenDoctorModal,
  doctorName,
  setDoctorName,
  nameInputRef: externalNameRef,
  autoFocusName = false,
  editingReportCode = null,
  onNavigateNext,
  isPaid = false,
  invoice = null,
  onOpenInvoiceModal,
  onResetAll,
  onSaveReport
}: PatientFormProps) {
  const [showMoreTimeFields, setShowMoreTimeFields] = useState(false);

  // Refs for Tab-flow / Enter-flow navigation
  const internalNameRef = useRef<HTMLInputElement>(null);
  const nameRef = externalNameRef || internalNameRef;
  const dobRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  // Auto-focus name input on mount or when autoFocusName changes
  useEffect(() => {
    if (autoFocusName && nameRef.current) {
      // Small delay to ensure DOM is ready after reset
      const timer = setTimeout(() => {
        nameRef.current?.focus();
        nameRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoFocusName, nameRef]);

  const handleChange = useCallback(<K extends keyof Patient>(field: K, value: Patient[K]) => {
    if (onPatientChange) {
      onPatientChange(field, value);
    } else if (setPatient) {
      setPatient((prev) => {
        const updated = { ...prev, [field]: value };
        if (field === 'code') {
          updated.sampleCode = value as string;
        } else if (field === 'sampleCode') {
          updated.code = value as string;
        }
        return updated;
      });
    }
  }, [onPatientChange, setPatient]);

  const hasInitializedDoctorRef = useRef(false);

  // Khởi tạo Bác sĩ chỉ định mặc định lúc ban đầu (chỉ chạy 1 lần khi mount hoặc khi chưa khởi tạo)
  useEffect(() => {
    if (!hasInitializedDoctorRef.current) {
      const defaultDoc = (doctorsList && doctorsList.length > 0 && doctorsList[0]?.name) || 'BS. Trần Hoài Long';
      if (!patient.doctor) {
        handleChange('doctor', defaultDoc);
      }
      if (!doctorName && setDoctorName) {
        setDoctorName(patient.doctor || defaultDoc);
      }
      hasInitializedDoctorRef.current = true;
    }
  }, [doctorsList, patient.doctor, doctorName, setDoctorName, handleChange]);

  // Đồng bộ thời gian đóng phí từ hóa đơn đã thanh toán vào hồ sơ bệnh nhân (SSOT)
  useEffect(() => {
    if (isPaid && invoice?.paidAt && !patient.paidAt) {
      handleChange('paidAt', invoice.paidAt);
    }
  }, [isPaid, invoice?.paidAt, patient.paidAt, handleChange]);

  // Enter key handler: move to next field in the fast-entry chain
  const handleKeyDownChain = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef: React.RefObject<HTMLInputElement | null> | null
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
        nextRef.current.select();
      }
    }
  };

  // Smart Age Calculator from DOB string (supports "1995", "15/08/1995", "1995-08-15", "08121994", or direct age "32")
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

    // If user typed 8 digits: "08121994"
    if (/^\d{8}$/.test(str)) {
      const year = parseInt(str.slice(4), 10);
      if (year > 1900 && year <= currentYear) {
        return `${currentYear - year} tuổi`;
      }
    }

    // If user typed 4 digits year: "1990"
    if (/^\d{4}$/.test(str)) {
      const year = parseInt(str, 10);
      if (year > 1900 && year <= currentYear) {
        return `${currentYear - year} tuổi`;
      }
    }

    // If user typed DD/MM/YYYY
    const ddmmyyyyMatch = str.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (ddmmyyyyMatch) {
      const year = parseInt(ddmmyyyyMatch[3], 10);
      if (year > 1900 && year <= currentYear) {
        return `${currentYear - year} tuổi`;
      }
    }

    return null;
  }, [patient.dob]);

  const handleInsertSlash = (e: React.MouseEvent) => {
    e.preventDefault();
    const curVal = patient?.dob || '';
    if (!curVal.endsWith('/')) {
      handleChange('dob', curVal + '/');
    }
    dobRef.current?.focus();
  };

  // Xử lý thông minh khi gõ ngày sinh trên điện thoại và máy tính (hỗ trợ tự chèn / và phím / nhanh)
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Tự động chuyển ký tự ngăn cách ., -, khoảng trắng thành / ngay khi gõ
    if (/[.\- ]/.test(val)) {
      val = val.replace(/[.\- ]/g, '/');
    }

    // Tự động chuyển đổi tức thì khi gõ đủ 8 chữ số liên tiếp nếu các phần hợp lệ
    if (/^\d{8}$/.test(val)) {
      const day = parseInt(val.slice(0, 2), 10);
      const month = parseInt(val.slice(2, 4), 10);
      const year = parseInt(val.slice(4), 10);
      if (isValidDobParts(day, month, year)) {
        handleChange('dob', `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`);
        return;
      }
    }

    handleChange('dob', val);
  };

  const handleDobBlur = () => {
    if (patient?.dob) {
      const formatted = formatDobInput(patient.dob);
      if (formatted !== patient.dob) {
        handleChange('dob', formatted);
      }
    }
  };

  // Fill current timestamp for all 4 stages
  const handleFillCurrentTimeForStages = () => {
    const now = new Date();
    const formatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (setPatient) {
      setPatient((prev) => ({
        ...prev,
        orderedAt: formatted,
        // Chỉ cập nhật paidAt khi phiếu thực sự đã thu phí (SSOT từ hóa đơn)
        paidAt: isPaid ? (prev.paidAt || formatted) : prev.paidAt,
        receivedAt: formatted,
        returnedAt: formatted
      }));
    } else if (onPatientChange) {
      onPatientChange('orderedAt', formatted);
      if (isPaid && !patient.paidAt) {
        onPatientChange('paidAt', formatted);
      }
      onPatientChange('receivedAt', formatted);
      onPatientChange('returnedAt', formatted);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 lg:p-5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-100 text-sky-700 text-xs font-black">
            1
          </span>
          <h2 className="text-xs lg:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
            <User className="w-4 h-4 text-sky-600" />
            <span>Thông Tin Bệnh Nhân & Phiếu XN</span>
          </h2>
          {editingReportCode ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10.5px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 animate-in fade-in duration-150">
                <span>📝 Đang sửa [{editingReportCode}]</span>
              </span>
              {onResetAll && (
                <button
                  type="button"
                  onClick={onResetAll}
                  className="text-[10px] font-bold text-amber-900 bg-amber-200/90 hover:bg-amber-300 px-1.5 py-0.5 rounded border border-amber-400 transition active:scale-95 cursor-pointer"
                  title="Không muốn sửa ca cũ? Bấm để tạo ca mới"
                >
                  + Tạo ca mới
                </button>
              )}
            </div>
          ) : (
            <span className="hidden sm:inline-flex text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md items-center gap-1">
              <span>✨ Phiếu mới</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {onResetAll && (
            <button
              type="button"
              onClick={onResetAll}
              className="text-xs font-extrabold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs transition active:scale-95 cursor-pointer"
              title="Làm mới form, tạo ca khám mới"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Ca Mới</span>
            </button>
          )}

          {/* Toggle time fields */}
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
            <span className="hidden sm:inline">T/G & Quy Trình Mẫu</span>
            <span className="sm:hidden">T/G Mẫu</span>
            {showMoreTimeFields ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* ═══ GRID TOÀN BỘ CÁC TRƯỜNG THÔNG TIN ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        
        {/* Họ và Tên — md:col-span-2, auto-focused */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-sky-600" />
            <span>Họ & Tên bệnh nhân</span>
            <span className="text-red-500 font-black">*</span>
            <kbd className="ml-auto text-[9px] font-mono bg-slate-100 text-slate-500 px-1 py-0.5 rounded border border-slate-200">Enter→</kbd>
          </label>
          <div className="relative">
            <input
              ref={nameRef as React.RefObject<HTMLInputElement>}
              type="text"
              placeholder="VÍ DỤ: HOÀNG BẢO NGỌC"
              value={patient?.name || ''}
              onChange={(e) => handleChange('name', e.target.value.toUpperCase())}
              onKeyDown={(e) => handleKeyDownChain(e, dobRef)}
              tabIndex={1}
              className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-extrabold uppercase tracking-wide focus:outline-none transition-all placeholder:normal-case placeholder:font-normal shadow-2xs"
              required
            />
          </div>
        </div>

        {/* Mã Phiếu / Số Bệnh Phẩm — md:col-span-2 */}
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
            value={patient?.code || ''}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="BN-20260816-001"
            tabIndex={100}
            className="w-full bg-red-50/40 hover:bg-red-50/60 focus:bg-white border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 rounded-xl px-3 py-2 text-xs font-mono font-black text-red-600 focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Năm Sinh / Tuổi — md:col-span-1 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Năm sinh / Ngày sinh</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleInsertSlash}
                className="text-[11px] font-mono font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 active:scale-95 px-2 py-0.5 rounded-md border border-sky-300 transition cursor-pointer flex items-center gap-0.5 shadow-2xs"
                title="Bấm để chèn nhanh dấu gạch chéo (/)"
              >
                <span className="font-extrabold">/</span>
                <span className="text-[9px] font-sans font-medium text-sky-600">Thêm /</span>
              </button>
              {computedAge && (
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  {computedAge}
                </span>
              )}
            </div>
          </div>
          <input
            ref={dobRef}
            type="text"
            inputMode="text"
            placeholder="1992 hoặc 22/06/1992 (hoặc 08121994)"
            value={patient?.dob || ''}
            onChange={handleDobChange}
            onBlur={handleDobBlur}
            onKeyDown={(e) => handleKeyDownChain(e, phoneRef)}
            tabIndex={2}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Giới Tính (Segmented Buttons) — md:col-span-1 */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính:</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            {GENDER_LIST.map((g) => {
              const isSelected = (patient?.gender || GENDER.MALE) === g;
              return (
                <button
                  type="button"
                  key={g}
                  onClick={() => handleChange('gender', g)}
                  tabIndex={-1}
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

        {/* Số Điện Thoại — md:col-span-2 */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-sky-600" />
            <span>Số điện thoại:</span>
            <kbd className="ml-auto text-[9px] font-mono bg-slate-100 text-slate-500 px-1 py-0.5 rounded border border-slate-200">Enter→</kbd>
          </label>
          <input
            ref={phoneRef}
            type="text"
            inputMode="tel"
            placeholder="098 3633677"
            value={patient?.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            onKeyDown={(e) => handleKeyDownChain(e, addressRef)}
            tabIndex={3}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-semibold focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Bác Sĩ Chỉ Định — md:col-span-4 (Rộng toàn bộ chiều ngang) */}
        <div className="md:col-span-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
              <span>Bác Sĩ Chỉ Định / Người Đọc Phiếu:</span>
            </label>
            {onOpenDoctorModal && (
              <button
                type="button"
                onClick={onOpenDoctorModal}
                className="text-[10px] text-sky-600 hover:text-sky-800 font-bold hover:underline shrink-0"
              >
                + Quản lý Bác sĩ
              </button>
            )}
          </div>
          <select
            value={patient.doctor || doctorName || (doctorsList[0]?.name || 'BS. Trần Hoài Long')}
            onChange={(e) => {
              const val = e.target.value;
              if (setDoctorName) setDoctorName(val);
              handleChange('doctor', val);
            }}
            tabIndex={99}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none transition-all shadow-2xs"
          >
            {doctorsList.map((doc, idx) => (
              <option key={`${doc.id || 'doc'}-${idx}`} value={doc.name}>
                {doc.name} {doc.specialty ? `— ${doc.specialty}` : ''} {doc.phone ? `(${doc.phone})` : ''}
              </option>
            ))}
            {(() => {
              const activeDoc = patient.doctor || doctorName;
              if (activeDoc && !doctorsList.some((d) => d.name === activeDoc)) {
                return <option value={activeDoc}>{activeDoc}</option>;
              }
              return null;
            })()}
          </select>
        </div>

        {/* Địa Chỉ Bệnh Nhân — md:col-span-4 */}
        <div className="md:col-span-4">
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>Địa chỉ bệnh nhân:</span>
          </label>
          <input
            ref={addressRef}
            type="text"
            placeholder="Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị"
            value={patient.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            tabIndex={4}
            className="w-full bg-white border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* ═══ COLLAPSIBLE: T/G Chỉ định, Đóng phí, Nhận mẫu, Trả kết quả ═══ */}
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
                  tabIndex={101}
                  className="w-full bg-white border border-slate-300 focus:border-sky-500 rounded-lg px-2 py-1 text-xs font-mono font-medium"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block font-bold text-slate-700 text-[11px]">2. T/G đóng phí:</label>
                  {isPaid ? (
                    <button
                      type="button"
                      onClick={onOpenInvoiceModal}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded px-1.5 py-0.2 transition cursor-pointer"
                      title="Hóa đơn đã thanh toán. Bấm để xem chi tiết hóa đơn"
                    >
                      <span>✓ Đã thu</span>
                      {invoice?.code && <span className="font-mono text-[9px] opacity-80">({invoice.code})</span>}
                    </button>
                  ) : invoice ? (
                    <button
                      type="button"
                      onClick={onOpenInvoiceModal}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded px-1.5 py-0.2 transition cursor-pointer"
                      title="Hóa đơn chưa thanh toán. Bấm để mở thu tiền"
                    >
                      <span>⏳ Chờ thu</span>
                      <span className="font-mono text-[9px] opacity-80">({invoice.code})</span>
                    </button>
                  ) : onOpenInvoiceModal ? (
                    <button
                      type="button"
                      onClick={onOpenInvoiceModal}
                      className="inline-flex items-center text-[10px] font-medium text-slate-500 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 rounded px-1.5 py-0.2 transition cursor-pointer"
                      title="Chưa có hóa đơn. Bấm để tạo hóa đơn thu phí"
                    >
                      + Hóa đơn
                    </button>
                  ) : null}
                </div>
                <input
                  type="text"
                  placeholder="dd/mm/yyyy hh:mm"
                  value={formatDisplayDate(patient.paidAt, isPaid && invoice?.paidAt ? formatDisplayDate(invoice.paidAt, '') : '')}
                  onChange={(e) => handleChange('paidAt', e.target.value)}
                  tabIndex={102}
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
                  tabIndex={103}
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
                  tabIndex={104}
                  className="w-full bg-white border border-slate-300 focus:border-sky-500 rounded-lg px-2 py-1 text-xs font-mono font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* Nút Chuyển Tiếp Sang Bảng Chỉ Số Trên Mobile & Lưu Nhanh */}
        <div className="pt-2 lg:hidden flex gap-2">
          {onSaveReport && (
            <button
              type="button"
              onClick={() => onSaveReport()}
              className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-slate-300 transition-all cursor-pointer shrink-0"
              title="Lưu phiếu hiện tại vào danh sách"
            >
              <span>💾 Lưu Phiếu</span>
            </button>
          )}
          {onNavigateNext && (
            <button
              type="button"
              onClick={onNavigateNext}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md shadow-sky-900/20 transition-all cursor-pointer"
            >
              <span>Tiếp Tục: Chọn Chỉ Số Xét Nghiệm</span>
              <span>→</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
