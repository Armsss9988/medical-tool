import { Loader2, CheckCircle2, ShieldCheck, FileText, Cloud, QrCode, Database, Sparkles } from 'lucide-react';
import { ExportStepName, EXPORT_STEP_LABELS, EXPORT_STEP_ORDER } from '@domain/exportTransaction';
import { Patient } from '@domain/types';

interface TransactionLoadingModalProps {
  isOpen: boolean;
  currentStep: ExportStepName | null;
  patient?: Patient;
  testCount?: number;
}

const STEP_ICONS: Record<ExportStepName, React.ElementType> = {
  render_pdf: FileText,
  upload_cloud: Cloud,
  generate_qr: QrCode,
  save_metadata: Database,
  notify_complete: Sparkles
};

const STEP_DESCRIPTIONS: Record<ExportStepName, string> = {
  render_pdf: 'Render DOM độ phân giải cao 2.5x sang file PDF',
  upload_cloud: 'Tải file lên Cloud Storage (Supabase / Cloudinary)',
  generate_qr: 'Tạo mã QR tra cứu trực tuyến bảo mật',
  save_metadata: 'Ghi sổ cái Ledger và dọn dẹp phiên bản cũ',
  notify_complete: 'Cập nhật trạng thái phiếu và hoàn tất'
};

export default function TransactionLoadingModal({
  isOpen,
  currentStep,
  patient,
  testCount = 0
}: TransactionLoadingModalProps) {
  if (!isOpen) return null;

  const currentIdx = currentStep ? EXPORT_STEP_ORDER.indexOf(currentStep) : 0;
  const progressPercent = Math.min(100, Math.round(((currentIdx + 0.5) / EXPORT_STEP_ORDER.length) * 100));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-sky-500/30 rounded-2xl shadow-2xl w-full max-w-lg p-6 text-white flex flex-col overflow-hidden relative">
        
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Loading */}
        <div className="flex items-center space-x-3 mb-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-sky-500/20 shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                Transaction Pipeline
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {progressPercent}%
              </span>
            </div>
            <h3 className="text-sm font-black text-white mt-1">
              Đang Thực Thi Tiến Trình Xuất File & Lưu Cloud
            </h3>
          </div>
        </div>

        {/* Thông tin bệnh nhân ngắn gọn */}
        {patient && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2 mb-4 text-xs flex items-center justify-between text-slate-300">
            <div>
              <span className="text-slate-400">Bệnh nhân: </span>
              <strong className="text-white uppercase font-bold">{patient.name || '---'}</strong>
            </div>
            <div>
              <span className="text-slate-400">Mã: </span>
              <strong className="text-sky-300 font-mono font-bold">{patient.sampleCode || patient.code}</strong>
            </div>
            {testCount > 0 && (
              <span className="text-[11px] font-semibold text-emerald-400">
                {testCount} chỉ số
              </span>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out shadow-sm shadow-sky-400/50"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Danh sách 5 bước Transaction Stepper */}
        <div className="space-y-2.5 mb-5">
          {EXPORT_STEP_ORDER.map((step, idx) => {
            const isCurrent = currentStep === step;
            const isPassed = currentIdx > idx;
            const StepIcon = STEP_ICONS[step] || FileText;

            return (
              <div
                key={step}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-sky-950/60 border-sky-500/50 shadow-md shadow-sky-950/50'
                    : isPassed
                    ? 'bg-slate-800/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900/30 border-slate-800/60 text-slate-500'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isPassed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isCurrent
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 animate-pulse'
                        : 'bg-slate-800 text-slate-600 border border-slate-700/50'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                    ) : (
                      <StepIcon className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold truncate ${
                        isCurrent
                          ? 'text-sky-200 font-extrabold'
                          : isPassed
                          ? 'text-slate-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {EXPORT_STEP_LABELS[step].replace(/^[^\s]+\s/, '')}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {STEP_DESCRIPTIONS[step]}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-mono shrink-0 ml-2">
                  {isPassed ? (
                    <span className="text-emerald-400 font-bold">Xong</span>
                  ) : isCurrent ? (
                    <span className="text-sky-400 font-bold animate-pulse">Đang chạy...</span>
                  ) : (
                    <span className="text-slate-600">Chờ</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer bảo vệ Rollback an toàn */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10.5px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Tự động Rollback & xóa file rác nếu gián đoạn mạng
          </span>
          <span className="text-slate-500 font-mono">GoLab Engine</span>
        </div>

      </div>
    </div>
  );
}
