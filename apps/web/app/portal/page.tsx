import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PatientPortalView } from '@features/patient-portal';

export const metadata: Metadata = {
  title: 'Cổng Tra Cứu Kết Quả Xét Nghiệm Y Khoa | GoLab',
  description: 'Tra cứu kết quả xét nghiệm trực tuyến nhanh chóng, an toàn và trực quan cho bệnh nhân.',
};

export default function PortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span className="animate-pulse">Đang nạp cổng tra cứu kết quả y khoa...</span>
          </div>
        </div>
      }
    >
      <PatientPortalView />
    </Suspense>
  );
}
