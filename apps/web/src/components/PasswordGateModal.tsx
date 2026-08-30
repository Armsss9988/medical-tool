import { useSyncExternalStore, useState } from 'react';
import { getPassword, setPassword } from '@infra/apiClient';
import { testSupabaseConnection, DEFAULT_CLOUD_DB_CONFIG } from '@infra/cloudDbService';

let gateOpen = !getPassword();
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

function getGateOpen(): boolean {
  return gateOpen;
}

export function openPasswordGate(): void {
  gateOpen = true;
  emitGate();
}

export function closePasswordGate(): void {
  gateOpen = false;
  emitGate();
}

export default function PasswordGateModal() {
  const open = useSyncExternalStore(subscribeGate, getGateOpen);
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
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔑</span>
          <h3 className="font-bold text-slate-800 text-base">Nhập Passkey</h3>
        </div>
        <p className="text-xs text-slate-500">
          Nhập passkey để đồng bộ dữ liệu với Cloud Database. Bỏ qua nếu chỉ dùng offline.
        </p>

        <div>
          <label className="block font-semibold text-slate-700 mb-1 text-xs">Passkey</label>
          <input
            type="password"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Nhập passkey..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            autoFocus
          />
        </div>

        {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition disabled:opacity-50"
        >
          {submitting ? 'Đang kiểm tra...' : 'Xác nhận'}
        </button>

        <button
          type="button"
          onClick={() => closePasswordGate()}
          className="w-full px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg text-xs transition"
        >
          Tiếp tục chế độ Local (Offline)
        </button>
      </div>
    </div>
  );
}
