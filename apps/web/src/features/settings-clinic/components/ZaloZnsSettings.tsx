import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ZaloZnsConfig, ToastType } from '@domain/types';
import { testZaloConnection } from '@infra/zaloService';

interface ZaloZnsSettingsProps {
  localZaloConfig: ZaloZnsConfig;
  setLocalZaloConfig: React.Dispatch<React.SetStateAction<ZaloZnsConfig>>;
  showToast: (message: string, type?: ToastType) => void;
}

export const ZaloZnsSettings: React.FC<ZaloZnsSettingsProps> = ({
  localZaloConfig,
  setLocalZaloConfig,
  showToast
}) => {
  const [isTestingZalo, setIsTestingZalo] = useState(false);

  return (
    <div className="space-y-3 border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
          <MessageCircle className="w-4 h-4 text-blue-600" />
          <span>Cấu Hình Zalo Official Account & ZNS</span>
        </h4>
        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
          Chăm sóc khách hàng
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="zalo-enabled"
          checked={localZaloConfig.enabled}
          onChange={(e) => setLocalZaloConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label htmlFor="zalo-enabled" className="font-semibold text-slate-700">
          Bật tính năng gửi kết quả qua Zalo ZNS / OA
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">App ID (Zalo Developer)</label>
          <input
            type="text"
            placeholder="Ví dụ: 123456789012345"
            value={localZaloConfig.appId}
            onChange={(e) => setLocalZaloConfig((prev) => ({ ...prev, appId: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">OA ID (Official Account)</label>
          <input
            type="text"
            placeholder="Ví dụ: 987654321098765"
            value={localZaloConfig.oaId}
            onChange={(e) => setLocalZaloConfig((prev) => ({ ...prev, oaId: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">Template ID (Mẫu tin ZNS đã duyệt)</label>
        <input
          type="text"
          placeholder="Ví dụ: 284729"
          value={localZaloConfig.templateId}
          onChange={(e) => setLocalZaloConfig((prev) => ({ ...prev, templateId: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">Access Token</label>
        <input
          type="password"
          placeholder="Nhập Access Token Zalo OA..."
          value={localZaloConfig.accessToken}
          onChange={(e) => setLocalZaloConfig((prev) => ({ ...prev, accessToken: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">
          Proxy CORS Server (Tùy chọn)
        </label>
        <input
          type="text"
          placeholder="https://cors-anywhere.herokuapp.com/ (Để trống nếu gọi trực tiếp)"
          value={localZaloConfig.proxyUrl || ''}
          onChange={(e) => setLocalZaloConfig((prev) => ({ ...prev, proxyUrl: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <input
          type="checkbox"
          id="zalo-auto-send"
          checked={localZaloConfig.autoSendOnExport}
          onChange={(e) => setLocalZaloConfig((prev) => ({ ...prev, autoSendOnExport: e.target.checked }))}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label htmlFor="zalo-auto-send" className="text-slate-700">
          Tự động gửi thông báo Zalo khi Xuất file PDF lên Cloud thành công
        </label>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <button
          type="button"
          disabled={isTestingZalo}
          onClick={async () => {
            setIsTestingZalo(true);
            const res = await testZaloConnection(localZaloConfig);
            setIsTestingZalo(false);
            showToast(res.message, res.success ? 'success' : 'error');
          }}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition disabled:opacity-50 cursor-pointer"
        >
          {isTestingZalo ? 'Đang Kiểm Tra...' : 'Kiểm Tra Kết Nối Zalo'}
        </button>
      </div>
    </div>
  );
};
