import type { ReactNode } from 'react';
import { Providers } from './providers';
import '../src/index.css';

export const metadata = {
  title: 'GoLab – Phần Mềm Quản Lý Xét Nghiệm',
  description: 'Hệ thống quản lý kết quả xét nghiệm y khoa'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-slate-100 text-slate-800 font-sans antialiased overflow-x-hidden selection:bg-sky-500 selection:text-white"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
