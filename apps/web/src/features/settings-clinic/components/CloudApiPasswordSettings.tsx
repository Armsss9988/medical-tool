import React from 'react';
import { CloudUpload } from 'lucide-react';
import { setPassword } from '@infra/apiClient';
import { openPasswordGate } from '@components/PasswordGateModal';

export const CloudApiPasswordSettings: React.FC = () => {
  return (
    <div className="space-y-3 border-t border-slate-100 pt-4">
      <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
        <CloudUpload className="w-4 h-4 text-sky-600" />
        <span>Cloud API</span>
      </h4>
      <p className="text-[11px] text-slate-500">
        Mật khẩu API dùng để xác thực với GoLab Cloud Database (Hono API).
      </p>
      <button
        type="button"
        onClick={() => {
          setPassword('');
          openPasswordGate();
        }}
        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow active:scale-95 cursor-pointer"
      >
        <CloudUpload className="w-3.5 h-3.5" />
        <span>Đổi mật khẩu Cloud</span>
      </button>
    </div>
  );
};
