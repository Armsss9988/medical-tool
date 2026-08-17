import { 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  FileText, 
  CloudUpload, 
  QrCode, 
  Database, 
  BellRing 
} from 'lucide-react';
import { 
  ExportStepName, 
  EXPORT_STEP_LABELS, 
  EXPORT_STEP_ORDER 
} from '@domain/exportTransaction';
import { Patient } from '@domain/types';

interface TransactionLoadingModalProps {
  isOpen: boolean;
  currentStep?: ExportStepName | null;
  patient?: Patient;
}

const STEP_ICONS: Record<ExportStepName, React.ElementType> = {
  render_pdf: FileText,
  upload_cloud: CloudUpload,
  generate_qr: QrCode,
  save_metadata: Database,
  notify_complete: BellRing
};

const STEP_DESCRIPTIONS: Record<ExportStepName, string> = {
  render_pdf: 'Đang chụp giao diện Lossless Canvas và mã hóa PDF chuẩn y khoa...',
  upload_cloud: 'Đang tải file PDF an toàn lên hệ thống Cloud Storage (3 tầng chịu lỗi)...',
  generate_qr: 'Đang tạo mã QR bảo mật liên kết trực tiếp tới file PDF...',
  save_metadata: 'Đang ghi nhận phiên bản vào sổ lưu trữ và dọn dẹp các bản PDF cũ...',
  notify_complete: 'Hoàn tất quá trình xuất phiếu và đồng bộ toàn hệ thống!'
};

export default function TransactionLoadingModal({
  isOpen,
  currentStep = null,
  patient
}: TransactionLoadingModalProps) {
  if (!isOpen) return null;

  const currentIdx = currentStep ? EXPORT_STEP_ORDER.indexOf(currentStep) : 0;
  const progressPercent = Math.min(100, Math.round(((currentIdx + 1) / EXPORT_STEP_ORDER.length) * 100));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-sky-800/60 rounded-2xl shadow-2xl w-full max-w-md p-6 text-white flex flex-col space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="relative p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              Đang Thực Thi Tiến Trình Transaction
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bệnh nhân: <strong className="text-slate-200">{patient?.name || 'Bệnh nhân'}</strong> ({patient?.code || '---'})
            </p>
          </div>
        </div>

        {/* Thanh Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-sky-300">
              {currentStep ? EXPORT_STEP_LABELS[currentStep] : 'Đang xử lý...'}
            </span>
            <span className="font-mono text-sky-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 italic">
            {currentStep ? STEP_DESCRIPTIONS[currentStep] : 'Vui lòng đợi trong giây lát...'}
          </p>
        </div>

        {/* Danh sách 5 bước Transaction */}
        <div className="space-y-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs">
          {EXPORT_STEP_ORDER.map((step, idx) => {
            const isPassed = currentIdx > idx;
            const isCurrent = currentStep === step;
            const Icon = STEP_ICONS[step];

            return (
              <div
                key={step}
                className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-sky-500/15 border border-sky-400/30 text-sky-200 font-bold shadow-sm'
                    : isPassed
                    ? 'bg-emerald-950/30 text-emerald-300 font-medium'
                    : 'text-slate-500'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {isPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono text-slate-400">
                      {idx + 1}
                    </span>
                  )}
                  <div className="flex items-center space-x-1.5">
                    <Icon className="w-3.5 h-3.5 opacity-80" />
                    <span>{EXPORT_STEP_LABELS[step]}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono">
                  {isPassed ? 'Hoàn tất' : isCurrent ? 'Đang chạy...' : 'Chờ'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Cam kết Rollback an toàn */}
        <div className="flex items-center space-x-2 p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Bảo vệ Transaction: Nếu xảy ra sự cố mạng, dữ liệu sẽ tự động Rollback an toàn, không tạo file rác.
          </span>
        </div>

      </div>
    </div>
  );
}
