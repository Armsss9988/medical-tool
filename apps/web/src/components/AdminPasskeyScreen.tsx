'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Activity,
  FileSearch
} from 'lucide-react';
import { setPassword } from '@infra/apiClient';

interface AdminPasskeyScreenProps {
  onUnlock: () => void;
}

export default function AdminPasskeyScreen({ onUnlock }: AdminPasskeyScreenProps) {
  const [passkey, setPasskeyValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = passkey.trim();
    if (!trimmed) {
      setError('Vui lòng nhập Passkey quản trị hệ thống!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: trimmed })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        // Lưu passkey vào sessionStorage thông qua setPassword của apiClient
        setPassword(trimmed);
        onUnlock();
      } else {
        setError(data.message || 'Passkey không chính xác. Vui lòng kiểm tra lại!');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white relative overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar: Clinic Security Tag */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 font-bold border border-sky-400/30">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">GoLab Medical</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                Admin Zone
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Hệ thống xét nghiệm & quản lý bệnh phẩm</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full backdrop-blur-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bảo mật nội bộ</span>
        </div>
      </header>

      {/* Main Container: Fullscreen Passkey Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Header Icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-sky-500/25 mb-4 border border-sky-400/30">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Xác Thực Quản Trị
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
              Vui lòng nhập Passkey hệ thống để mở khóa bàn làm việc và dữ liệu bệnh nhân.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Passkey Hệ Thống
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passkey}
                  onChange={(e) => {
                    setPasskeyValue(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Nhập passkey quản trị..."
                  autoFocus
                  disabled={loading}
                  className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showPassword ? 'Ẩn passkey' : 'Hiện passkey'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Mở Khóa Quản Trị</span>
                </>
              )}
            </button>
          </form>

          {/* Patient Redirect Section */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <FileSearch className="w-4 h-4 text-sky-400" />
                <span>Bạn là bệnh nhân tra cứu kết quả?</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Khu vực này chỉ dành cho nhân viên y tế. Bệnh nhân không cần Passkey và có thể xem kết quả trực tuyến tại Cổng Tra Cứu.
              </p>
              <Link
                href="/portal"
                className="mt-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 hover:underline py-1 transition-all"
              >
                <span>Đi đến Cổng Tra Cứu Bệnh Nhân</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs text-slate-500 relative z-10">
        GoLab Medical Laboratory System • Bảo mật đa lớp & Xác thực Passkey
      </footer>
    </div>
  );
}
