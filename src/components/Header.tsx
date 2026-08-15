import React from 'react';
import { Stethoscope, FileSpreadsheet, Settings, Database, FolderOpen, CreditCard } from 'lucide-react';
import { ClinicInfo, CatalogItem } from '@domain/types';

interface HeaderProps {
  clinicInfo: ClinicInfo;
  setClinicInfo: (info: ClinicInfo) => void;
  onLoadExcelFile: (fileOrBuffer: Blob | ArrayBuffer) => void;
  catalog: CatalogItem[];
  onOpenSettings: () => void;
  onOpenCatalogModal: () => void;
  onOpenRevenueModal: () => void;
  onOpenDataFolder?: () => void;
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

  return (
    <header className="bg-slate-900 text-white shadow-md">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg">
            <Stethoscope className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {clinicInfo.name || 'PHÒNG KHÁM XÉT NGHIỆM Y KHOA AN BÌNH'}
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                GoLab v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {clinicInfo.address} • SĐT: {clinicInfo.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {onOpenDataFolder && (
            <button
              onClick={onOpenDataFolder}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition shadow-sm"
              title="Mở thư mục lưu trữ dữ liệu đĩa C:"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Dữ Liệu JSON</span>
            </button>
          )}

          <label
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer transition shadow-sm"
            title="Tải bảng giá từ file Excel (.xlsx, .xls)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Nhập Excel</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={onOpenCatalogModal}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition shadow-sm"
            title="Quản lý danh mục chỉ số xét nghiệm"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Bảng Giá ({catalog.length})</span>
          </button>

          <button
            onClick={onOpenRevenueModal}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition shadow-sm relative"
            title="Xem báo cáo doanh thu & hóa đơn"
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Doanh Thu</span>
            {invoiceCount > 0 && (
              <span className="bg-emerald-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                {invoiceCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition"
            title="Cấu hình hệ thống"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
