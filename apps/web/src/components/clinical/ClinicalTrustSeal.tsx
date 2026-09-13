import React from 'react';
import { ShieldCheck, Award, Lock, FileCheck2 } from 'lucide-react';

interface ClinicalTrustSealProps {
  doctorName?: string;
  clinicName?: string;
  verifiedAt?: string;
  hasCloudPdf?: boolean;
  className?: string;
}

export const ClinicalTrustSeal: React.FC<ClinicalTrustSealProps> = ({
  doctorName,
  clinicName,
  verifiedAt,
  hasCloudPdf = false,
  className = ''
}) => {
  return (
    <div
      className={`relative bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5 overflow-hidden ${className}`}
      data-testid="clinical-trust-seal"
    >
      {/* Nền hoa văn chứng thực mờ */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-emerald-500/5 pointer-events-none flex items-center justify-center">
        <Award className="w-20 h-20 text-emerald-900/10" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-1">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Chứng Thực Điện Tử Y Khoa
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <FileCheck2 className="w-3 h-3" />
                Đã Thẩm Định Chuyên Môn
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bản kết quả xét nghiệm được phát hành chính thức bởi{' '}
              <strong className="text-slate-800">{clinicName || 'Trung Tâm Xét Nghiệm GoLab'}</strong>
              {doctorName && (
                <>
                  {' '}dưới sự giám sát và phê duyệt của{' '}
                  <strong className="text-slate-800">BS. {doctorName}</strong>
                </>
              )}
              .
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 text-xs text-slate-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
            <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>{hasCloudPdf ? 'Đã lưu trữ an toàn trên Cloud PDF' : 'Dữ liệu y khoa mã hóa'}</span>
          </div>
          {verifiedAt && (
            <span className="text-[11px] text-slate-400">
              Thời gian: {verifiedAt}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
