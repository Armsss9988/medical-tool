import { useSyncExternalStore, useState } from 'react';
import { KeyRound, ShieldCheck, Loader2, X, AlertCircle } from 'lucide-react';
import { getPassword, setPassword } from '@infra/apiClient';
import { testSupabaseConnection, DEFAULT_CLOUD_DB_CONFIG } from '@infra/cloudDbService';

interface GateState {
  open: boolean;
  closable: boolean;
}

let gateState: GateState = {
  open: !getPassword(),
  closable: true
};

const gateListeners = new Set<() => void>();

function emitGate() {
  gateListeners.forEach((l) => l());
}

function subscribeGate(cb: () => void): () => void {
  gateListeners.add(cb);
  return () => {
    gateListeners.delete(cb);
  };
}

function getGateSnapshot(): GateState {
  return gateState;
}

export function openPasswordGate(closable: boolean = true): void {
  gateState = { open: true, closable };
  emitGate();
}

export function closePasswordGate(): void {
  gateState = { open: false, closable: true };
  emitGate();
}

// Tự động lắng nghe sự kiện khóa hệ thống từ Header hoặc phím tắt
if (typeof window !== 'undefined') {
  window.addEventListener('app-lock', () => {
    openPasswordGate(false);
  });
}

export default function PasswordGateModal() {
  const { open, closable } = useSyncExternalStore(subscribeGate, getGateSnapshot);
  const [passwordValue, setPasswordValue] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setError('');
    setPassword(passwordValue.trim());

    setSubmitting(true);
    try {
      const res = await testSupabaseConnection(DEFAULT_CLOUD_DB_CONFIG);
      if (res.success) {
        closePasswordGate();
        window.dispatchEvent(new CustomEvent('password-unlocked'));
      } else {
        setError(res.message || 'Passkey không đúng hoặc không thể kết nối!');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-900/10 max-w-sm w-full p-6 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/20">
              <KeyRound className="size-5 stroke-[1.75]" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base leading-tight">
                {closable ? 'Nhập Passkey' : 'Hệ Thống Đang Khóa'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {closable ? 'Bảo mật kết nối Cloud Database' : 'Vui lòng nhập Passkey để mở khóa làm việc'}
              </p>
            </div>
          </div>
          {closable && (
            <button
              type="button"
              onClick={() => closePasswordGate()}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors active:scale-95"
              aria-label="Đóng"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide">
            Passkey bảo mật
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <KeyRound className="size-4" />
            </div>
            <input
              type="password"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Nhập passkey..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              autoFocus
            />
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs shadow-emerald-500/25 transition-all duration-150 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-sm hover:shadow-emerald-500/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                <span>Xác nhận</span>
              </>
            )}
          </button>

          {closable && (
            <button
              type="button"
              onClick={() => closePasswordGate()}
              className="w-full inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 transition-all duration-150 hover:bg-slate-200/80 hover:text-slate-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Bỏ qua
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
