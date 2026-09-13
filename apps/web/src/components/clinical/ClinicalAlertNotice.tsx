import React from 'react';
import { AlertCircle, CheckCircle2, Filter } from 'lucide-react';

interface ClinicalAlertNoticeProps {
  total: number;
  abnormal: number;
  isPending?: boolean;
  showAbnormalOnly: boolean;
  onToggleFilter: () => void;
  className?: string;
}

export const ClinicalAlertNotice: React.FC<ClinicalAlertNoticeProps> = ({
  total,
  abnormal,
  isPending = false,
  showAbnormalOnly,
  onToggleFilter,
  className = ''
}) => {
  const isAllNormal = abnormal === 0;

  if (isPending) {
    return (
      <div
        className={`border-l-4 border-l-amber-500 bg-amber-50/70 text-amber-950 rounded-r-lg p-3.5 sm:p-4 flex items-start gap-2.5 text-xs sm:text-sm ${className}`}
        data-testid="clinical-alert-notice"
      >
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold leading-snug">
            Hồ sơ gồm {total} chỉ định xét nghiệm đang trong quá trình phân tích kỹ thuật.
          </p>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            Mẫu bệnh phẩm đã được tiếp nhận an toàn tại phòng xét nghiệm. Kết quả chính thức sẽ hiển thị ngay sau khi Bác sĩ chuyên môn duyệt và ký số.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-l-4 rounded-r-lg p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm ${
        isAllNormal
          ? 'border-l-teal-700 bg-teal-50/60 text-teal-950'
          : 'border-l-amber-600 bg-amber-50/60 text-amber-950'
      } ${className}`}
      data-testid="clinical-alert-notice"
    >
      <div className="flex items-start gap-2.5">
        {isAllNormal ? (
          <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        )}

        <div className="space-y-0.5">
          <p className="font-semibold leading-snug">
            {isAllNormal
              ? `Tất cả ${total} chỉ số xét nghiệm đều nằm trong khoảng tham chiếu bình thường.`
              : `Ghi nhận ${abnormal}/${total} chỉ số nằm ngoài khoảng tham chiếu chuẩn.`}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            {isAllNormal
              ? 'Dữ liệu xét nghiệm an toàn. Vui lòng lưu trữ hồ sơ và tái khám theo chỉ định nếu có.'
              : 'Các chỉ số bất thường đã được phân loại trong bảng chi tiết. Người bệnh cần tham khảo ý kiến bác sĩ điều trị để có đánh giá lâm sàng đầy đủ.'}
          </p>
        </div>
      </div>

      {abnormal > 0 && (
        <button
          type="button"
          onClick={onToggleFilter}
          className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs transition border cursor-pointer ${
            showAbnormalOnly
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-3 h-3" />
          <span>{showAbnormalOnly ? 'Xem tất cả chỉ số' : `Chỉ xem ${abnormal} chỉ số vượt ngưỡng`}</span>
        </button>
      )}
    </div>
  );
};
