import React from 'react';
import { Download, QrCode, Share2, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { ClinicalButton } from './ClinicalButton';

export interface ClinicalDemographicsStripProps {
  patientName: string;
  code: string;
  sampleCode?: string;
  dob?: string;
  gender?: string;
  address?: string;
  diagnosis?: string;
  doctorName?: string;
  createdAt?: string;
  status?: string;
  isPending?: boolean;
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

export const ClinicalDemographicsStrip: React.FC<ClinicalDemographicsStripProps> = ({
  patientName,
  code,
  sampleCode,
  dob,
  gender,
  address,
  diagnosis,
  doctorName,
  createdAt,
  status,
  isPending,
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
  const isWaiting = isPending ?? (status === 'Chờ xét nghiệm' || status === 'Đang xét nghiệm' || status === 'DRAFT');

  return (
    <section
      className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs ${className}`}
      data-testid="clinical-demographics-strip"
    >
      {/* 1. DẢI TIÊU ĐỀ HỒ SƠ PHONG CÁCH EPIC MYCHART */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="font-semibold uppercase tracking-wider text-slate-200 text-[11px]">
            Hồ Sơ Xét Nghiệm Điện Tử
          </span>
          <span className="text-slate-500">|</span>
          <span className="font-mono text-teal-300 font-medium">Mã BN: {code}</span>
          {sampleCode && sampleCode !== code && (
            <span className="font-mono text-slate-400 hidden sm:inline">(Mẫu: {sampleCode})</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isWaiting ? (
            <span className="inline-flex items-center gap-1 bg-amber-900/80 text-amber-200 border border-amber-700/60 px-2 py-0.5 rounded text-[11px] font-medium">
              <Clock className="w-3 h-3 text-amber-300" />
              {status || 'Chờ Xét Nghiệm'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-teal-900/80 text-teal-200 border border-teal-700/60 px-2 py-0.5 rounded text-[11px] font-medium">
              <CheckCircle2 className="w-3 h-3 text-teal-300" />
              Đã Phê Duyệt Ký Số
            </span>
          )}
        </div>
      </div>

      {/* 2. KHU VỰC THÔNG TIN BỆNH NHÂN & TÁC VỤ */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Bệnh nhân
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight uppercase">
              {patientName}
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {cloudPdfUrl && !isWaiting ? (
              <a
                href={cloudPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-2xs transition active:scale-[0.98] text-center"
                title="Tải tệp tin PDF gốc có con dấu và chữ ký số"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Bản In Ký Số (PDF)</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium text-center cursor-not-allowed"
                title={isWaiting ? "Phiếu đang chờ phòng xét nghiệm phân tích và duyệt kết quả" : "Chờ xuất file PDF"}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{isWaiting ? "Chờ Kết Quả" : "Chờ File PDF"}</span>
              </button>
            )}

            <ClinicalButton
              variant="secondary"
              size="sm"
              onClick={onOpenQr}
              icon={<QrCode className="w-3.5 h-3.5 text-slate-600" />}
            >
              Mã QR
            </ClinicalButton>

            <ClinicalButton
              variant="secondary"
              size="sm"
              onClick={onShare}
              icon={<Share2 className="w-3.5 h-3.5 text-slate-600" />}
            >
              {isShared ? 'Đã chép' : 'Chia sẻ'}
            </ClinicalButton>
          </div>
        </div>

        {/* 3. LƯỚI THÔNG TIN HÀNH CHÍNH LÂM SÀNG DẠNG BẢNG CHÍNH XÁC */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block">Năm sinh / Tuổi</span>
            <span className="font-semibold text-slate-900">{formatAgeDisplay(dob, createdAt)}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Giới tính</span>
            <span className="font-semibold text-slate-900">{gender || '---'}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Bác sĩ chỉ định</span>
            <span className="font-semibold text-slate-900 truncate block" title={doctorName}>
              {doctorName || '---'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Thời gian lấy mẫu</span>
            <span className="font-semibold text-slate-900">
              {createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : '---'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Chẩn đoán / Lý do khám</span>
            <span className="font-semibold text-slate-900 truncate block" title={diagnosis}>
              {diagnosis || 'Kiểm tra sức khỏe định kỳ'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Địa chỉ / SĐT</span>
            <span className="font-semibold text-slate-900 truncate block" title={address}>
              {address || '---'}
            </span>
          </div>
        </div>

        {/* 4. TRẠNG THÁI VIỆN PHÍ & HÓA ĐƠN ĐIỆN TỬ */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Tài chính viện phí:</span>
            {isPaid ? (
              <span className="inline-flex items-center gap-1 font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                ĐÃ THANH TOÁN {paymentMethod ? `(${paymentMethod})` : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded text-[11px]">
                <Clock className="w-3 h-3 text-amber-600" />
                {paymentStatus || 'CHƯA THANH TOÁN'}
              </span>
            )}

            {invoiceCode && (
              <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                HĐ: {invoiceCode}
              </span>
            )}
          </div>

          {paymentAmount !== undefined && paymentAmount !== null && paymentAmount > 0 && (
            <div className="font-mono text-xs text-slate-700">
              <span>Tổng chi phí: </span>
              <strong className="text-slate-900">
                {new Intl.NumberFormat('vi-VN').format(paymentAmount)} VNĐ
              </strong>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
