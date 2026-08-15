import React from 'react';
import { X, Sliders, Database } from 'lucide-react';
import { CatalogItem, TestPackage, TestGroup, TestEquipment, Doctor, ClinicInfo, CloudDbConfig } from '@domain/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicInfo;
  setClinicInfo: React.Dispatch<React.SetStateAction<ClinicInfo>>;
  cloudDbConfig: CloudDbConfig;
  onSaveCloudDbConfig: (config: CloudDbConfig) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  clinicInfo,
  setClinicInfo,
  cloudDbConfig,
  onSaveCloudDbConfig
}: SettingsModalProps) {
  const [localCloudConfig, setLocalCloudConfig] = React.useState<CloudDbConfig>(cloudDbConfig);

  if (!isOpen) return null;

  const handleClinicChange = (field: keyof ClinicInfo, val: string) => {
    setClinicInfo((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    onSaveCloudDbConfig(localCloudConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
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
                placeholder="sb_publishable_eUNn1NWvQhljdd2pirtZtw_sLFDHWy7"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition">
            Hủy
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow transition">
            Lưu Cấu Hình
          </button>
        </div>
      </div>
    </div>
  );
}
