import React, { useState, useEffect } from 'react';
import { Settings, Activity, ListChecks, TrendingUp, FolderOpen, Clock, Phone, Globe, ShieldCheck } from 'lucide-react';
import { ClinicInfo, CatalogItem } from '@domain/types';

interface HeaderProps {
  clinicInfo: ClinicInfo;
  setClinicInfo?: React.Dispatch<React.SetStateAction<ClinicInfo>>;
  onLoadExcelFile?: (fileOrBuffer: Blob | ArrayBuffer) => void;
  catalog?: CatalogItem[];
  onOpenSettings: () => void;
  onOpenCatalogModal: () => void;
  onOpenRevenueModal: () => void;
  onOpenDataFolder: () => void;
  invoiceCount?: number;
}

export default function Header({ 
  clinicInfo, 
  onOpenSettings,
  onOpenCatalogModal,
  onOpenRevenueModal,
  onOpenDataFolder,
  invoiceCount = 0
}: HeaderProps) {
  // Live system clock ticker
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

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

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 px-4 lg:px-6 py-2.5 shadow-lg sticky top-0 z-40 backdrop-blur-md bg-slate-900/95">
      <div className="max-w-[1680px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Brand Identity & Clinic Info */}
        <div className="flex items-center space-x-3.5 w-full md:w-auto">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-bold border border-sky-400/30">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Hệ thống đang hoạt động" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-sm lg:text-base font-extrabold text-white tracking-tight truncate">
                {clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-extrabold bg-sky-500/15 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-md shadow-xs">
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                <span>GoLab System</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 font-medium">
              <span className="truncate max-w-[320px] lg:max-w-none">{clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị'}</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Globe className="w-3 h-3 text-sky-400" />
                <strong className="text-sky-300 font-semibold">{clinicInfo.website || 'golab.com.vn'}</strong>
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Phone className="w-3 h-3 text-emerald-400" />
                <strong className="text-emerald-400 font-mono font-bold">{clinicInfo.phone || '032.855.3773'}</strong>
              </span>
            </p>
          </div>
        </div>

        {/* Right: Clock & Action Hub */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end flex-wrap gap-y-2">
          
          {/* Live System Clock */}
          <div className="hidden xl:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <div className="flex items-center space-x-1.5 font-mono">
              <span className="text-slate-200 font-bold">{currentTime || '--:--:--'}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 text-[11px] font-medium">{currentDate || ''}</span>
            </div>
          </div>

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
            <span>Quản Lý Danh Mục</span>
          </button>

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
      </div>
    </header>
  );
}
