import React from 'react';
import { CheckCircle2, AlertTriangle, Filter } from 'lucide-react';
import { ClinicalButton } from './ClinicalButton';

interface ClinicalHealthSummaryProps {
  total: number;
  abnormal: number;
  normal: number;
  showAbnormalOnly: boolean;
  onToggleFilter: () => void;
  className?: string;
}

export const ClinicalHealthSummary: React.FC<ClinicalHealthSummaryProps> = ({
  total,
  abnormal,
  showAbnormalOnly,
  onToggleFilter,
  className = ''
}) => {
  const isAllNormal = abnormal === 0;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
        isAllNormal
          ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950'
          : 'bg-rose-50/40 border-rose-200/80 text-rose-950'
      } ${className}`}
      data-testid="clinical-health-summary"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
              isAllNormal ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {isAllNormal ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>

          <div className="space-y-0.5">
            <h3 className="text-sm sm:text-base font-bold tracking-tight">
              {isAllNormal
                ? `Toàn bộ ${total} chỉ số đều nằm trong giới hạn chuẩn`
                : `Phát hiện ${abnormal}/${total} chỉ số cần lưu ý hoặc vượt ngưỡng`}
            </h3>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              {isAllNormal
                ? 'Dữ liệu xét nghiệm cho thấy các chỉ số sinh học đạt mức an toàn. Quý khách vui lòng duy trì lối sống lành mạnh và tái khám định kỳ.'
                : 'Các chỉ số vượt ngưỡng tham chiếu đã được bác sĩ ghi nhận. Quý khách nên trao đổi trực tiếp với bác sĩ điều trị để có phác đồ phù hợp.'}
            </p>
          </div>
        </div>

        {abnormal > 0 && (
          <div className="shrink-0 self-start sm:self-center">
            <ClinicalButton
              variant={showAbnormalOnly ? 'primary' : 'secondary'}
              size="sm"
              onClick={onToggleFilter}
              icon={<Filter className="w-3.5 h-3.5" />}
            >
              {showAbnormalOnly ? 'Xem tất cả chỉ số' : `Chỉ xem ${abnormal} chỉ số vượt ngưỡng`}
            </ClinicalButton>
          </div>
        )}
      </div>
    </div>
  );
};
