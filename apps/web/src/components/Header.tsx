import React, { useState, useEffect } from 'react';
import { Settings, Activity, ListChecks, TrendingUp, FolderOpen, Clock, Phone, ShieldCheck, ClipboardList, Package, Menu, X, Sparkles, Palette } from 'lucide-react';
import { ClinicInfo, CatalogItem, getSafeClinicInfo } from '@domain/types';

interface HeaderProps {
  clinicInfo: ClinicInfo;
  setClinicInfo?: React.Dispatch<React.SetStateAction<ClinicInfo>>;
  onLoadExcelFile?: (fileOrBuffer: Blob | ArrayBuffer) => void;
  catalog?: CatalogItem[];
  onOpenSettings: () => void;
  onOpenCatalogModal: () => void;
  onOpenRevenueModal: () => void;
  onOpenReportManagerModal: () => void;
  onOpenBatchExportModal?: () => void;
  onOpenAiSmartFill?: () => void;
  onOpenTemplateBuilder?: () => void;
  onOpenDataFolder: () => void;
  invoiceCount?: number;
  reportCount?: number;
}

export default function Header({ 
  clinicInfo, 
  onOpenSettings,
  onOpenCatalogModal,
  onOpenRevenueModal,
  onOpenReportManagerModal,
  onOpenBatchExportModal,
  onOpenAiSmartFill,
  onOpenTemplateBuilder,
  onOpenDataFolder,
  invoiceCount = 0,
  reportCount = 0
}: HeaderProps) {
  const safeClinic = getSafeClinicInfo(clinicInfo);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMobileNav = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-4 lg:px-6 py-2 shadow-lg sticky top-0 z-40 backdrop-blur-md bg-slate-900/95">
      <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-2">
        
        {/* Left: Brand Identity & Clinic Info */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-bold border border-sky-400/30">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Hệ thống đang hoạt động" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h1 className="text-xs sm:text-sm lg:text-base font-extrabold text-white tracking-tight truncate">
                {safeClinic.name}
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase font-extrabold bg-sky-500/15 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-md shadow-xs">
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                <span>GoLab</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 font-medium">
              <span className="truncate max-w-[200px] sm:max-w-[320px] lg:max-w-none">{safeClinic.address || 'Quảng Trị'}</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-slate-300">
                <Phone className="w-3 h-3 text-emerald-400" />
                <strong className="text-emerald-400 font-mono font-bold">{safeClinic.phone}</strong>
              </span>
            </p>
          </div>
        </div>

        {/* Desktop Action Hub (hidden on small mobile) */}
        <div className="hidden lg:flex items-center space-x-2 w-auto justify-end flex-wrap gap-y-1.5">
          
          {/* Live System Clock */}
          <div className="hidden xl:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-xs">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <div className="flex items-center space-x-1.5 font-mono">
              <span className="text-slate-200 font-bold">{currentTime || '--:--:--'}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 text-[11px] font-medium">{currentDate || ''}</span>
            </div>
          </div>

          {/* Sổ Lưu Phiếu Xét Nghiệm Button */}
          <button
            type="button"
            onClick={onOpenReportManagerModal}
            title="Xem và quản lý toàn bộ danh sách các phiếu kết quả xét nghiệm đã lưu"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-900/20 border border-indigo-500/50 transition-all active:scale-95 group"
          >
            <ClipboardList className="w-3.5 h-3.5 text-indigo-200 group-hover:scale-110 transition-transform" />
            <span>Sổ Lưu Phiếu XN</span>
            {reportCount > 0 && (
              <span className="bg-white text-indigo-900 font-mono text-[10px] font-black px-1.5 py-0.2 rounded-full border border-indigo-300 ml-0.5 shadow-2xs">
                {reportCount}
              </span>
            )}
          </button>

          {/* AI Smart Fill Button */}
          {onOpenAiSmartFill && (
            <button
              type="button"
              onClick={onOpenAiSmartFill}
              title="Trợ lý AI tự động trích xuất từ ảnh scan, PDF, Excel thô và điền vào mẫu"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-700 via-indigo-700 to-sky-700 hover:from-purple-600 hover:to-sky-600 text-white text-xs font-extrabold shadow-md shadow-purple-900/30 border border-purple-400/50 transition-all active:scale-95 group animate-pulse hover:animate-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>✨ AI Điền Mẫu</span>
            </button>
          )}

          {/* Import Batch & Xuất Đồng Loạt Button */}
          {onOpenBatchExportModal && (
            <button
              type="button"
              onClick={onOpenBatchExportModal}
              title="Import dữ liệu batch từ Excel hoặc xuất PDF đồng loạt"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white text-xs font-bold shadow-md shadow-purple-900/20 border border-purple-500/50 transition-all active:scale-95 group"
            >
              <Package className="w-3.5 h-3.5 text-purple-200 group-hover:scale-110 transition-transform" />
              <span>Batch Export</span>
            </button>
          )}

          {/* Sổ Sách & Doanh Thu Button */}
          <button
            type="button"
            onClick={onOpenRevenueModal}
            title="Xem báo cáo tổng kết doanh thu, cộng sổ và doanh số từng Bác sĩ chỉ định"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/20 border border-emerald-500/50 transition-all active:scale-95 group"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Sổ Sách & Doanh Thu</span>
            {invoiceCount > 0 && (
              <span className="bg-white text-emerald-900 font-mono text-[10px] font-black px-1.5 py-0.2 rounded-full border border-emerald-300 ml-0.5 shadow-2xs">
                {invoiceCount}
              </span>
            )}
          </button>

          {/* Quản Lý Danh Mục Button */}
          <button
            type="button"
            onClick={onOpenCatalogModal}
            title="Quản lý và chỉnh sửa bảng giá, tên chỉ số, gói xét nghiệm và Bác sĩ"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-900/20 border border-sky-500/50 transition-all active:scale-95 group"
          >
            <ListChecks className="w-3.5 h-3.5 text-sky-200 group-hover:scale-110 transition-transform" />
            <span>Danh Mục</span>
          </button>

          {/* Trình Thiết Kế Mẫu In Button */}
          {onOpenTemplateBuilder && (
            <button
              type="button"
              onClick={onOpenTemplateBuilder}
              title="Trình thiết kế và chỉnh sửa mẫu phiếu in A4 kéo thả trực quan"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-sky-300 hover:text-sky-200 text-xs font-bold border border-sky-500/40 shadow transition-all active:scale-95 group"
            >
              <Palette className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform" />
              <span>Mẫu In</span>
            </button>
          )}

          {/* Mở Thư Mục Dữ Liệu Button */}
          {window.electronAPI?.openDataFolder && (
            <button
              type="button"
              onClick={onOpenDataFolder}
              title="Mở thư mục GoLabData – nơi lưu toàn bộ dữ liệu phòng khám (Documents/GoLabData/)"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold shadow transition-all active:scale-95"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">GoLabData</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Cấu hình hệ thống & thông tin phòng khám"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white border border-slate-700/80 transition-all active:scale-95"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>

        {/* Mobile Hamburger & Quick Badges Bar (lg:hidden) */}
        <div className="flex lg:hidden items-center space-x-1.5">
          {/* Sổ Lưu Quick Icon Button */}
          <button
            type="button"
            onClick={onOpenReportManagerModal}
            className="relative p-2 rounded-lg bg-indigo-600 text-white shadow active:scale-95 transition"
            title="Sổ Lưu Phiếu XN"
          >
            <ClipboardList className="w-4 h-4" />
            {reportCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[9px] font-black px-1 rounded-full border border-slate-900 shadow">
                {reportCount}
              </span>
            )}
          </button>

          {/* Doanh Thu Quick Icon Button */}
          <button
            type="button"
            onClick={onOpenRevenueModal}
            className="relative p-2 rounded-lg bg-emerald-600 text-white shadow active:scale-95 transition"
            title="Sổ Sách & Doanh Thu"
          >
            <TrendingUp className="w-4 h-4" />
            {invoiceCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 font-mono text-[9px] font-black px-1 rounded-full border border-slate-900 shadow">
                {invoiceCount}
              </span>
            )}
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white border border-slate-700 active:scale-95 transition"
            title="Menu chức năng"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900/98 px-3 py-3 mt-2 rounded-xl shadow-2xl space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleMobileNav(onOpenReportManagerModal)}
              className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 rounded-xl flex items-center space-x-2 text-left active:scale-95 transition"
            >
              <ClipboardList className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="truncate">
                <span>Sổ Lưu Phiếu XN</span>
                {reportCount > 0 && <span className="ml-1 text-white font-mono">({reportCount})</span>}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav(onOpenRevenueModal)}
              className="p-2.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-200 rounded-xl flex items-center space-x-2 text-left active:scale-95 transition"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span>Sổ Doanh Thu</span>
                {invoiceCount > 0 && <span className="ml-1 text-white font-mono">({invoiceCount})</span>}
              </div>
            </button>

            {onOpenAiSmartFill && (
              <button
                type="button"
                onClick={() => handleMobileNav(onOpenAiSmartFill)}
                className="p-2.5 bg-gradient-to-r from-purple-700/40 to-sky-700/40 border border-purple-400/50 text-purple-200 rounded-xl flex items-center space-x-2 text-left active:scale-95 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
                <span className="truncate font-extrabold text-white">✨ AI Điền Mẫu</span>
              </button>
            )}

            {onOpenBatchExportModal && (
              <button
                type="button"
                onClick={() => handleMobileNav(onOpenBatchExportModal)}
                className="p-2.5 bg-purple-600/20 border border-purple-500/30 text-purple-200 rounded-xl flex items-center space-x-2 text-left active:scale-95 transition"
              >
                <Package className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="truncate">Batch Export / Excel</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleMobileNav(onOpenCatalogModal)}
              className="p-2.5 bg-sky-600/20 border border-sky-500/30 text-sky-200 rounded-xl flex items-center space-x-2 text-left active:scale-95 transition"
            >
              <ListChecks className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="truncate">Quản Lý Danh Mục</span>
            </button>

            {onOpenTemplateBuilder && (
              <button
                type="button"
                onClick={() => handleMobileNav(onOpenTemplateBuilder)}
                className="p-2.5 bg-slate-800 border border-sky-500/40 text-sky-300 rounded-xl flex items-center space-x-2 text-left active:scale-95 transition"
              >
                <Palette className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="truncate">Thiết Kế Mẫu In</span>
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleMobileNav(onOpenSettings)}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition active:scale-95 border border-slate-700"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>Cài Đặt & Cấu Hình Ngân Hàng / VietQR</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

