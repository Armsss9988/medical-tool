import React from 'react';
import { FileSpreadsheet, Download, Settings, Activity, ListChecks, TrendingUp, FolderOpen } from 'lucide-react';
import { exportSampleExcelCatalog } from '@infra/excelService';
import { ClinicInfo, CatalogItem } from '@domain/types';

interface HeaderProps {
  clinicInfo: ClinicInfo;
  setClinicInfo: React.Dispatch<React.SetStateAction<ClinicInfo>>;
  onLoadExcelFile: (fileOrBuffer: Blob | ArrayBuffer) => void;
  catalog: CatalogItem[];
  onOpenSettings: () => void;
  onOpenCatalogModal: () => void;
  onOpenRevenueModal: () => void;
  onOpenDataFolder: () => void;
  invoiceCount?: number;
}

export default function Header({ 
  clinicInfo, 
  onLoadExcelFile, 
  catalog,
  onOpenSettings,
  onOpenCatalogModal,
  onOpenRevenueModal,
  onOpenDataFolder,
  invoiceCount = 0
}: HeaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadExcelFile(file);
    }
  };

  const handleNativeExcelSelect = async () => {
    if (window.electronAPI && window.electronAPI.selectExcelFile) {
      try {
        const fileObj = await window.electronAPI.selectExcelFile();
        if (fileObj && fileObj.buffer) {
          onLoadExcelFile(new Blob([fileObj.buffer]));
        }
      } catch (err) {
        console.error('Lỗi chọn file Electron:', err);
      }
    } else {
      const input = document.getElementById('excel-file-input') as HTMLInputElement | null;
      if (input) input.click();
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b-2 border-sky-600 px-5 py-3 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Logo & Clinic Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-md font-bold">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">{clinicInfo.name}</h1>
              <span className="text-[10px] uppercase font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded">
                GOLAB Edition
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {clinicInfo.address} • Hotline: <strong className="text-sky-300">{clinicInfo.phone}</strong>
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Button Sổ Sách & Doanh Thu */}
          <button
            onClick={onOpenRevenueModal}
            title="Xem báo cáo tổng kết doanh thu, cộng sổ và doanh số từng Bác sĩ chỉ định"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow transition-all active:scale-95 relative"
          >
            <TrendingUp className="w-4 h-4 text-emerald-100" />
            <span>Sổ Sách & Doanh Thu</span>
            {invoiceCount > 0 && (
              <span className="bg-white text-emerald-900 font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-300 ml-1">
                {invoiceCount}
              </span>
            )}
          </button>

          {/* Button Quản Lý Danh Mục Trực Tiếp */}
          <button
            onClick={onOpenCatalogModal}
            title="Quản lý và chỉnh sửa bảng giá, tên chỉ số trực tiếp trong App"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow transition-all active:scale-95"
          >
            <ListChecks className="w-4 h-4 text-sky-100" />
            <span>Quản Lý Danh Mục</span>
          </button>

          {/* Button Nạp File Excel */}
          <button
            onClick={handleNativeExcelSelect}
            title="Đọc file Excel danh mục từ máy tính"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Nạp Excel</span>
          </button>

          {/* Button Mở Thư Mục Dữ Liệu */}
          {window.electronAPI?.openDataFolder && (
            <button
              onClick={onOpenDataFolder}
              title="Mở thư mục GoLabData – nơi lưu toàn bộ dữ liệu phòng khám (Documents/GoLabData/)"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-amber-100 border border-amber-600 text-xs font-semibold shadow transition-all active:scale-95"
            >
              <FolderOpen className="w-4 h-4 text-amber-200" />
              <span>Dữ Liệu</span>
            </button>
          )}

          {/* Button Tải File Excel Mẫu */}
          <button
            onClick={() => exportSampleExcelCatalog(catalog)}
            title="Tải file Excel mẫu để chỉnh sửa danh mục"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span>Tải Excel Mẫu</span>
          </button>

          {/* Button Settings */}
          <button
            onClick={onOpenSettings}
            title="Cấu hình hệ thống & thông tin phòng khám"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
}
