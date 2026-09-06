'use client';

import React, { useState, useEffect, Component, type ReactNode, type ErrorInfo } from 'react';
import dynamic from 'next/dynamic';
import AdminPasskeyScreen from '../src/components/AdminPasskeyScreen';
import { getPassword } from '@infra/apiClient';

// Class ErrorBoundary để bắt lỗi ChunkLoadError hoặc lỗi render
class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('chunk_retry_count');
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">Phiên làm việc cần làm mới</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Mã nguồn hệ thống vừa được cập nhật hoặc kết nối bị gián đoạn khi tải gói ứng dụng (ChunkLoadError).
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold rounded-xl transition shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tải lại trang ngay
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Tự động retry và refresh phiên khi webpack chunk bị thay đổi do HMR / Rebuild
const loadAppWithRetry = async (retries = 2, delay = 400): Promise<typeof import('../src/App')> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await import('../src/App');
    } catch (err: unknown) {
      const isChunkError = err instanceof Error && (
        err.name === 'ChunkLoadError' ||
        err.message.includes('Loading chunk') ||
        err.message.includes('failed')
      );

      if (isChunkError && typeof window !== 'undefined') {
        const retryCount = Number(sessionStorage.getItem('chunk_retry_count') || '0');
        if (retryCount < 2) {
          sessionStorage.setItem('chunk_retry_count', String(retryCount + 1));
          window.location.reload();
          return new Promise(() => {});
        }
      }

      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return import('../src/App');
};

const App = dynamic(() => loadAppWithRetry(), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-slate-300">Đang khởi tạo GoLab Medical Tool...</span>
      </div>
    </div>
  )
});

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Xóa cờ retry khi đã vào ứng dụng thành công
    sessionStorage.removeItem('chunk_retry_count');
    // Kiểm tra xem trong phiên làm việc hiện tại đã có passkey hợp lệ chưa
    const existing = getPassword();
    if (existing) {
      setIsAuthenticated(true);
    }

    const handleLock = () => {
      setIsAuthenticated(false);
    };

    window.addEventListener('app-lock', handleLock);
    return () => {
      window.removeEventListener('app-lock', handleLock);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-300">Đang tải hệ thống...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminPasskeyScreen onUnlock={() => setIsAuthenticated(true)} />;
  }

  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
