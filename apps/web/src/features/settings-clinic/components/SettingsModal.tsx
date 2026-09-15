import { useState } from 'react';
import {
  X,
  Sliders,
  Save
} from 'lucide-react';
import {
  ClinicInfo,
  CloudDbConfig,
  ZaloZnsConfig,
  ToastType
} from '@domain/types';
import { AiProviderType } from '@infra/aiService';
import { ClinicInfoSettings, VIETNAM_BANKS } from './ClinicInfoSettings';
import { CloudDatabaseSettings } from './CloudDatabaseSettings';
import { AiAssistantSettings } from './AiAssistantSettings';
import { ZaloZnsSettings } from './ZaloZnsSettings';
import { CloudApiPasswordSettings } from './CloudApiPasswordSettings';

export { VIETNAM_BANKS };

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicInfo;
  setClinicInfo: React.Dispatch<React.SetStateAction<ClinicInfo>>;
  cloudDbConfig: CloudDbConfig;
  setCloudDbConfig: React.Dispatch<React.SetStateAction<CloudDbConfig>>;
  zaloConfig: ZaloZnsConfig;
  setZaloConfig: React.Dispatch<React.SetStateAction<ZaloZnsConfig>>;
  showToast: (message: string, type?: ToastType) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  clinicInfo,
  setClinicInfo,
  cloudDbConfig,
  setCloudDbConfig,
  zaloConfig,
  setZaloConfig,
  showToast
}: SettingsModalProps) {
  const [localCloudConfig, setLocalCloudConfig] = useState<CloudDbConfig>({ ...cloudDbConfig });
  const [localZaloConfig, setLocalZaloConfig] = useState<ZaloZnsConfig>({ ...zaloConfig });
  
  // AI Settings State (Gemini & OpenAI)
  const [localAiProvider, setLocalAiProvider] = useState<AiProviderType>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('GOLAB_AI_PROVIDER') as AiProviderType) || 'GEMINI' : 'GEMINI';
  });
  const [localAiKey, setLocalAiKey] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('GOLAB_GEMINI_API_KEY') || '' : '';
  });
  const [localAiModel, setLocalAiModel] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('GOLAB_AI_MODEL') : null;
    return saved === 'gemini-2.5-flash' || !saved ? 'gemini-2.0-flash' : saved;
  });
  const [localOpenAiKey, setLocalOpenAiKey] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('GOLAB_OPENAI_API_KEY') || '' : '';
  });
  const [localOpenAiModel, setLocalOpenAiModel] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('GOLAB_OPENAI_MODEL') || 'gpt-4o-mini' : 'gpt-4o-mini';
  });

  if (!isOpen) return null;

  const handleSaveAll = () => {
    setCloudDbConfig(localCloudConfig);
    setZaloConfig(localZaloConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem('GOLAB_AI_PROVIDER', localAiProvider);
      localStorage.setItem('GOLAB_GEMINI_API_KEY', localAiKey.trim());
      localStorage.setItem('GOLAB_AI_MODEL', localAiModel);
      localStorage.setItem('GOLAB_OPENAI_API_KEY', localOpenAiKey.trim());
      localStorage.setItem('GOLAB_OPENAI_MODEL', localOpenAiModel);
    }
    showToast('Đã lưu thành công cấu hình phòng khám, Supabase, Zalo ZNS và Trợ lý AI (Gemini & OpenAI)!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white sm:rounded-2xl shadow-2xl max-w-xl w-full h-full sm:h-auto flex flex-col sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Cấu Hình Phòng Khám & Cloud DB</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* 1. THÔNG TIN PHÒNG KHÁM & VIETQR */}
          <ClinicInfoSettings
            clinicInfo={clinicInfo}
            setClinicInfo={setClinicInfo}
            showToast={showToast}
          />

          {/* 2. SUPABASE CLOUD DB */}
          <CloudDatabaseSettings
            localCloudConfig={localCloudConfig}
            setLocalCloudConfig={setLocalCloudConfig}
            showToast={showToast}
          />

          {/* 3. CLOUD API PASSWORD */}
          <CloudApiPasswordSettings />

          {/* 4. TRỢ LÝ AI (GEMINI & OPENAI) */}
          <AiAssistantSettings
            localAiProvider={localAiProvider}
            setLocalAiProvider={setLocalAiProvider}
            localAiKey={localAiKey}
            setLocalAiKey={setLocalAiKey}
            localAiModel={localAiModel}
            setLocalAiModel={setLocalAiModel}
            localOpenAiKey={localOpenAiKey}
            setLocalOpenAiKey={setLocalOpenAiKey}
            localOpenAiModel={localOpenAiModel}
            setLocalOpenAiModel={setLocalOpenAiModel}
            showToast={showToast}
          />

          {/* 5. CẤU HÌNH ZALO ZNS API */}
          <ZaloZnsSettings
            localZaloConfig={localZaloConfig}
            setLocalZaloConfig={setLocalZaloConfig}
            showToast={showToast}
          />
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition flex items-center space-x-1.5 shadow cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Toàn Bộ Cấu Hình</span>
          </button>
        </div>

      </div>
    </div>
  );
}
