import React from 'react';
import {
  Download,
  QrCode,
  Share2,
  Phone,
  MapPin,
  Stethoscope,
  Calendar,
  User
} from 'lucide-react';
import { ClinicalBadge } from './ClinicalBadge';
import { ClinicalButton } from './ClinicalButton';

export interface ClinicalPatientCardProps {
  patientName: string;
  code: string;
  sampleCode?: string;
  dob?: string;
  gender?: string;
  address?: string;
  diagnosis?: string;
  doctorName?: string;
  createdAt?: string;
  cloudPdfUrl?: string;
  isPaid?: boolean;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  paymentAmount?: number | null;
  invoiceCode?: string | null;
  onOpenQr: () => void;
  onShare: () => void;
  isShared?: boolean;
  className?: string;
}

function formatAgeDisplay(dob?: string, dateStr?: string): string {
  if (!dob) return '---';
  const match = dob.match(/\b(19\d{2}|20\d{2})\b/);
  if (!match) return dob;
  const birthYear = parseInt(match[1], 10);
  const currentYear = dateStr ? new Date(dateStr).getFullYear() : new Date().getFullYear();
  const age = currentYear - birthYear;
  if (age >= 0 && age <= 125) {
    return `${dob} (${age} tuổi)`;
  }
  return dob;
}

const isPhone = (val?: string | null) => Boolean(val && /^(0|\+84)\d{8,11}$/.test(val.replace(/[\s.-]/g, '')));

export const ClinicalPatientCard: React.FC<ClinicalPatientCardProps> = ({
  patientName,
  code,
  sampleCode,
  dob,
  gender,
  address,
  diagnosis,
  doctorName,
  createdAt,
  cloudPdfUrl,
  isPaid,
  paymentMethod,
  paymentStatus,
  paymentAmount,
  invoiceCode,
  onOpenQr,
  onShare,
  isShared = false,
  className = ''
}) => {
  return (
    <div
      className={`relative bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs overflow-hidden space-y-4 ${className}`}
      data-testid="clinical-patient-card"
    >
      {/* Vạch nhận diện y khoa cao cấp trên đầu thẻ */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600" />

      {/* Hàng 1: Danh tính bệnh nhân & Bộ 3 nút tác vụ y khoa */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Mã BN: {code}
            </span>
            {sampleCode && sampleCode !== code && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200">
                Mẫu: {sampleCode}
              </span>
            )}
            <ClinicalBadge variant="verified" size="sm">
              Kết Quả Chính Thức
            </ClinicalBadge>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase truncate">
            {patientName}
          </h2>
        </div>

        {/* Action Toolbar */}
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
          {cloudPdfUrl ? (
            <a
              href={cloudPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition active:scale-[0.98] text-center"
              title="Tải tệp tin PDF gốc có dấu mộc và chữ ký số"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Tải PDF</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium text-center cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Chờ PDF</span>
            </button>
          )}

          <ClinicalButton
            variant="secondary"
            size="md"
            onClick={onOpenQr}
            icon={<QrCode className="w-3.5 h-3.5 text-teal-700" />}
          >
            Mã QR
          </ClinicalButton>

          <ClinicalButton
            variant="secondary"
            size="md"
            onClick={onShare}
            icon={<Share2 className="w-3.5 h-3.5 text-teal-700" />}
          >
            {isShared ? 'Đã chép' : 'Chia sẻ'}
          </ClinicalButton>
        </div>
      </div>

      {/* Hàng 2: Lưới thông số hành chính */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <Calendar className="w-3 h-3" />
            <span>Năm sinh / Tuổi</span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
            {formatAgeDisplay(dob, createdAt)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <User className="w-3 h-3" />
            <span>Giới tính</span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
            {gender || '---'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <Stethoscope className="w-3 h-3" />
            <span>Bác sĩ chỉ định</span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5" title={doctorName}>
            {doctorName || '---'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <Calendar className="w-3 h-3" />
            <span>Thời gian tiếp nhận</span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
            {createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : '---'}
          </span>
        </div>
      </div>

      {/* Hàng 3: Địa chỉ/SĐT & Chẩn đoán */}
      {(address || diagnosis) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {address && (
            <div className="bg-slate-50/80 px-3 py-2.5 rounded-xl border border-slate-200/70 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isPhone(address) ? (
                  <>
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-700 font-mono font-medium truncate">
                      SĐT: {address}
                    </span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-700 truncate">{address}</span>
                  </>
                )}
              </div>
              {isPhone(address) && (
                <a
                  href={`tel:${address.replace(/[^\d+]/g, '')}`}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 shrink-0"
                >
                  Gọi
                </a>
              )}
            </div>
          )}

          {diagnosis && (
            <div className="bg-slate-50/80 px-3 py-2.5 rounded-xl border border-slate-200/70 flex items-center gap-2">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="text-slate-800 truncate">
                Chẩn đoán:{' '}
                <strong className="font-semibold text-slate-900">{diagnosis}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Hàng 4: Tài chính & Viện phí */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {isPaid ? (
            <ClinicalBadge variant="paid" size="sm">
              ĐÃ THANH TOÁN {paymentMethod ? `(${paymentMethod})` : ''}
            </ClinicalBadge>
          ) : (
            <ClinicalBadge variant="pending" size="sm">
              {paymentStatus || 'CHƯA THANH TOÁN'}
            </ClinicalBadge>
          )}

          {invoiceCode && (
            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Số HĐ: {invoiceCode}
            </span>
          )}
        </div>

        {paymentAmount !== undefined && paymentAmount !== null && paymentAmount > 0 && (
          <div className="flex items-baseline justify-between sm:justify-end gap-2 font-mono pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <span className="text-slate-400 text-xs">Tổng viện phí:</span>
            <span className={`text-sm sm:text-base font-bold ${isPaid ? 'text-teal-800' : 'text-slate-900'}`}>
              {new Intl.NumberFormat('vi-VN').format(paymentAmount)}{' '}
              <span className="text-xs font-normal text-slate-500">VNĐ</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
