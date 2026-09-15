'use client';

import { useIsFetching, useIsMutating } from '@tanstack/react-query';

/**
 * Thanh tiến trình tải dữ liệu TanStack Query toàn cục.
 * Tự động hiển thị ở mép trên cùng của màn hình khi có bất kỳ query nào đang fetch (in-flight)
 * hoặc mutation nào đang ghi dữ liệu lên máy chủ.
 */
export function GlobalQueryProgress() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isBusy = isFetching > 0 || isMutating > 0;

  if (!isBusy) return null;

  return (
    <div
      role="progressbar"
      aria-label="Hệ thống đang đồng bộ dữ liệu với máy chủ"
      aria-busy="true"
      data-testid="global-query-progress"
      className="fixed top-0 left-0 right-0 z-[99999] h-[3px] bg-slate-900/30 overflow-hidden pointer-events-none"
    >
      <div className="h-full w-full bg-gradient-to-r from-sky-500 via-emerald-400 to-indigo-500 animate-query-progress shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
    </div>
  );
}
