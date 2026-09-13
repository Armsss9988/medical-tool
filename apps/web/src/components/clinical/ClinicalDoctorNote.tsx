import React from 'react';
import { Stethoscope, CheckCircle2 } from 'lucide-react';

interface ClinicalDoctorNoteProps {
  conclusion?: string;
  doctorName?: string;
  className?: string;
}

export const ClinicalDoctorNote: React.FC<ClinicalDoctorNoteProps> = ({
  conclusion,
  doctorName,
  className = ''
}) => {
  if (!conclusion && !doctorName) return null;

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3 shadow-2xs ${className}`}
      data-testid="clinical-doctor-note"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <Stethoscope className="w-4 h-4 text-teal-700 shrink-0" />
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
          Ý Kiến Chuyên Môn &amp; Dặn Dò Của Bác Sĩ
        </h3>
      </div>

      {conclusion && (
        <div className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pl-0.5">
          {conclusion}
        </div>
      )}

      {doctorName && (
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Bác sĩ phụ trách chuyên môn:</span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <span>BS. {doctorName}</span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-normal text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Ký điện tử
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
