import React, { useState } from 'react';
import { X, Sliders, Database, Save } from 'lucide-react';
import { CatalogItem, TestPackage, TestGroup, TestEquipment, Doctor, ClinicInfo, CloudDbConfig } from '@domain/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicInfo;
  setClinicInfo: React.Dispatch<React.SetStateAction<ClinicInfo>>;
  cloudDbConfig: CloudDbConfig;
  setCloudDbConfig: React.Dispatch<React.SetStateAction<CloudDbConfig>>;
  catalog: CatalogItem[];
  testPackages: TestPackage[];
  testGroups: TestGroup[];
  equipments: TestEquipment[];
  doctorsList: Doctor[];
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

  const handleSaveAll = () => {
    setCloudDbConfig(localCloudConfig);
    showToast('Đã lưu thành công thông tin phòng khám và cấu hình hệ thống!', 'success');
    onClose();
  };

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
