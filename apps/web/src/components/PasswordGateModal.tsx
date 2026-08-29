import { useSyncExternalStore, useState } from 'react';
import { getPassword, setPassword, getApiBase, setApiBase } from '@infra/apiClient';
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
  const [apiBaseValue, setApiBaseValue] = useState(getApiBase());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setError('');
    setPassword(passwordValue.trim());
    setApiBase(apiBaseValue.trim());

    setSubmitting(true);
    try {
      const res = await testSupabaseConnection(DEFAULT_CLOUD_DB_CONFIG);
      if (res.success) {
        closePasswordGate();
      } else {
        setError(res.message || 'Không thể kết nối API!');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
        <h3 className="font-bold text-slate-800 text-base">Xác Thực API GoLab</h3>
        <p className="text-xs text-slate-500">Nhập mật khẩu API để kết nối với Cloud Database.</p>

        <div>
          <label className="block font-semibold text-slate-700 mb-1 text-xs">Mật khẩu API</label>
          <input
            type="password"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            placeholder="Nhập mật khẩu API"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1 text-xs">
            API Base URL (mặc định /api)
          </label>
          <input
            type="text"
            value={apiBaseValue}
            onChange={(e) => setApiBaseValue(e.target.value)}
            placeholder="API base URL (mặc định /api)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition disabled:opacity-50"
        >
          {submitting ? 'Đang kiểm tra...' : 'Lưu mật khẩu'}
        </button>
      </div>
    </div>
  );
}
