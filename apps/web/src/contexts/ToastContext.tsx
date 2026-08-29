import { createContext, useState, useContext, useCallback, type ReactNode } from 'react';
import type { ToastType } from '@domain/types';
import { DEFAULTS } from '@domain/constants/defaults';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

// ─── TOAST CONTEXT ──────────────────────────────────────────────────────────
// Quản lý toast notifications tập trung cho toàn ứng dụng.
// RULE: Dùng useToast() hook trong bất kỳ component nào cần hiển thị thông báo.

interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), DEFAULTS.TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* TOAST THÔNG BÁO NỔI GÓC PHẢI */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : 'bg-slate-900/90 text-slate-100 border-slate-700'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
          <span>{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}
