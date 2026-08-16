import React, { useState } from 'react';
import { X, Sliders, Database, Save, Upload, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { CatalogItem, TestPackage, TestGroup, TestEquipment, Doctor, ClinicInfo, CloudDbConfig } from '@domain/types';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicInfo;
  setClinicInfo: React.Dispatch<React.SetStateAction<ClinicInfo>>;
  cloudDbConfig: CloudDbConfig;
  setCloudDbConfig: React.Dispatch<React.SetStateAction<CloudDbConfig>>;
  catalog?: CatalogItem[];
  testPackages?: TestPackage[];
  testGroups?: TestGroup[];
  equipments?: TestEquipment[];
  doctorsList?: Doctor[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  clinicInfo,
  setClinicInfo,
  cloudDbConfig,
  setCloudDbConfig,
  showToast
}: SettingsModalProps) {
  const [localCloudConfig, setLocalCloudConfig] = useState<CloudDbConfig>(cloudDbConfig);

  if (!isOpen) return null;

  const handleClinicChange = (field: keyof ClinicInfo, val: string) => {
    setClinicInfo((prev) => ({ ...prev, [field]: val }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Kích thước ảnh logo không được vượt quá 2MB!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setClinicInfo((prev) => ({ ...prev, logoUrl: dataUrl }));
        showToast('Đã nạp Logo phòng khám mới thành công!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Kích thước ảnh con dấu không được vượt quá 2MB!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setClinicInfo((prev) => ({ ...prev, stampUrl: dataUrl }));
        showToast('Đã nạp Con dấu / Chữ ký Bác sĩ mới thành công!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setClinicInfo((prev) => ({ ...prev, logoUrl: undefined }));
    showToast('Đã đặt lại Logo về biểu trưng GoLab chuẩn!', 'info');
  };

  const handleResetStamp = () => {
    setClinicInfo((prev) => ({ ...prev, stampUrl: undefined }));
    showToast('Đã đặt lại Con dấu về mẫu GoLab chuẩn!', 'info');
  };

  const handleSaveAll = () => {
    setCloudDbConfig(localCloudConfig);
    showToast('Đã lưu thành công thông tin phòng khám và cấu hình hệ thống!', 'success');
    onClose();
  };

  const activeLogo = clinicInfo.logoUrl || golabLogo;
  const activeStamp = clinicInfo.stampUrl || doctorStamp;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Cấu Hình Phòng Khám & Cloud DB</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* PHÒNG KHÁM */}
          <div className="space-y-3 border-b border-slate-100 pb-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
              <span>Thông Tin Phòng Khám (In phiếu A4)</span>
            </h4>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Phòng Khám</label>
              <input
                type="text"
                value={clinicInfo.name}
                onChange={(e) => handleClinicChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ</label>
              <input
                type="text"
                value={clinicInfo.address}
                onChange={(e) => handleClinicChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại Hotline</label>
                <input
                  type="text"
                  value={clinicInfo.phone}
                  onChange={(e) => handleClinicChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website</label>
                <input
                  type="text"
                  value={clinicInfo.website || ''}
                  placeholder="golab.com.vn"
                  onChange={(e) => handleClinicChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* GẮN LOGO VÀ CON DẤU PHÒNG KHÁM */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Box Logo */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center text-center">
                <span className="font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                  <span>Logo Phiếu In (A4)</span>
                </span>
                <div className="h-16 w-full max-w-[140px] bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center mb-2 overflow-hidden shadow-2xs">
                  <img
                    src={activeLogo}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = golabLogo;
                    }}
                  />
                </div>
                <div className="flex items-center space-x-1.5 w-full justify-center">
                  <label className="cursor-pointer px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md font-bold text-[10.5px] flex items-center gap-1 shadow transition active:scale-95">
                    <Upload className="w-3 h-3" />
                    <span>Tải Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {clinicInfo.logoUrl && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      title="Đặt lại về Logo GoLab chuẩn"
                      className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Box Con Dấu */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center text-center">
                <span className="font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-red-600" />
                  <span>Con Dấu / Chữ Ký</span>
                </span>
                <div className="h-16 w-full max-w-[140px] bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center mb-2 overflow-hidden shadow-2xs">
                  <img
                    src={activeStamp}
                    alt="Con Dấu Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = doctorStamp;
                    }}
                  />
                </div>
                <div className="flex items-center space-x-1.5 w-full justify-center">
                  <label className="cursor-pointer px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md font-bold text-[10.5px] flex items-center gap-1 shadow transition active:scale-95">
                    <Upload className="w-3 h-3" />
                    <span>Tải Con Dấu</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStampUpload}
                      className="hidden"
                    />
                  </label>
                  {clinicInfo.stampUrl && (
                    <button
                      type="button"
                      onClick={handleResetStamp}
                      title="Đặt lại về Con Dấu GoLab chuẩn"
                      className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SUPABASE CLOUD DB */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Cấu Hình Supabase Cloud Database</span>
            </h4>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="cloud-enabled"
                checked={localCloudConfig.enabled}
                onChange={(e) => setLocalCloudConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="cloud-enabled" className="font-semibold text-slate-800 cursor-pointer">
                Bật tự động đồng bộ Cloud DB (Local-First + Cloud Sync)
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supabase URL</label>
              <input
                type="text"
                value={localCloudConfig.supabaseUrl}
                onChange={(e) => setLocalCloudConfig((prev) => ({ ...prev, supabaseUrl: e.target.value }))}
                placeholder="https://zfpsgycfqybgqytjmeck.supabase.co"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supabase Anon Key</label>
              <input
                type="password"
                value={localCloudConfig.supabaseAnonKey}
                onChange={(e) => setLocalCloudConfig((prev) => ({ ...prev, supabaseAnonKey: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-medium transition"
          >
            Đóng
          </button>
          <button
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1.5 shadow transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Cấu Hình</span>
          </button>
        </div>

      </div>
    </div>
  );
}
