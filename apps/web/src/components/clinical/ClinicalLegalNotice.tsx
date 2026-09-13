import React from 'react';
import { ShieldCheck, Phone, FileText } from 'lucide-react';

interface ClinicalLegalNoticeProps {
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  hasCloudPdf?: boolean;
  className?: string;
}

export const ClinicalLegalNotice: React.FC<ClinicalLegalNoticeProps> = ({
  clinicName,
  clinicAddress,
  clinicPhone,
  hasCloudPdf = false,
  className = ''
}) => {
  return (
    <div
      className={`bg-slate-50 border border-slate-200/90 rounded-xl p-4 sm:p-5 space-y-3 text-xs text-slate-600 ${className}`}
      data-testid="clinical-legal-notice"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Xác Thực Tính Pháp Lý Của Bản Kết Quả Điện Tử
            </h4>
            <p className="leading-relaxed text-slate-600">
              Kết quả được số hóa từ Hệ thống Quản trị Xét nghiệm (LIS) của{' '}
              <strong className="text-slate-800">{clinicName || 'Trung Tâm Xét Nghiệm GoLab'}</strong>
              {clinicAddress ? ` (${clinicAddress})` : ''}.
              Bản ghi có giá trị đối chiếu theo quy định tại{' '}
              <span className="font-medium text-slate-700">Thông tư 46/2018/TT-BYT</span> của Bộ Y tế về hồ sơ bệnh án điện tử.
            </p>
          </div>
        </div>

        {hasCloudPdf && (
          <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80 shrink-0">
            <FileText className="w-3 h-3" />
            PDF Ký Số Hợp Chuẩn
          </span>
        )}
      </div>

      <div className="pt-2.5 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>
          Lưu ý y khoa: Kết quả xét nghiệm cần được bác sĩ lâm sàng đánh giá kết hợp cùng triệu chứng cụ thể và tiền sử bệnh.
        </span>

        {clinicPhone && (
          <a
            href={`tel:${clinicPhone.replace(/[^\d+]/g, '')}`}
            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-medium shrink-0"
          >
            <Phone className="w-3 h-3" />
            <span>Hotline giải đáp: {clinicPhone}</span>
          </a>
        )}
      </div>
    </div>
  );
};
