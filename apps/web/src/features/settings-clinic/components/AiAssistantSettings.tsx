import React, { useState } from 'react';
import { 
  Sparkles, Sliders, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';
import { ToastType } from '@domain/types';
import { testGeminiConnection, testOpenAiConnection, AiProviderType } from '@infra/aiService';

interface AiAssistantSettingsProps {
  localAiProvider: AiProviderType;
  setLocalAiProvider: (provider: AiProviderType) => void;
  localAiKey: string;
  setLocalAiKey: (key: string) => void;
  localAiModel: string;
  setLocalAiModel: (model: string) => void;
  localOpenAiKey: string;
  setLocalOpenAiKey: (key: string) => void;
  localOpenAiModel: string;
  setLocalOpenAiModel: (model: string) => void;
  showToast: (message: string, type?: ToastType) => void;
}

export const AiAssistantSettings: React.FC<AiAssistantSettingsProps> = ({
  localAiProvider,
  setLocalAiProvider,
  localAiKey,
  setLocalAiKey,
  localAiModel,
  setLocalAiModel,
  localOpenAiKey,
  setLocalOpenAiKey,
  localOpenAiModel,
  setLocalOpenAiModel,
  showToast
}) => {
  const [showAiKey, setShowAiKey] = useState<boolean>(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState<boolean>(false);
  const [isTestingAi, setIsTestingAi] = useState<boolean>(false);
  const [aiTestMessage, setAiTestMessage] = useState<string | null>(null);
  const [aiTestSuccess, setAiTestSuccess] = useState<boolean | null>(null);

  return (
    <div className="space-y-3 border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
          <span>Cấu Hình Trợ Lý AI Y Khoa &amp; Multi-Modal</span>
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          (localAiProvider === 'GEMINI' && localAiKey.trim()) || (localAiProvider === 'OPENAI' && localOpenAiKey.trim())
            ? 'bg-purple-50 text-purple-700 border-purple-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {localAiProvider === 'GEMINI'
            ? localAiKey.trim() ? '🟢 Google Gemini AI' : '🟡 Rule-Based Engine (Ngoại tuyến)'
            : localOpenAiKey.trim() ? '🟢 OpenAI ChatGPT' : '🟡 Rule-Based Engine (Ngoại tuyến)'}
        </span>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Trợ lý AI giúp tự động trích xuất bảng kết quả từ ảnh scan, file PDF, file Excel thô và điền chính xác vào Mẫu GoLab.
      </p>

      {/* Provider Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setLocalAiProvider('GEMINI');
            setAiTestMessage(null);
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            localAiProvider === 'GEMINI'
              ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Google Gemini</span>
          {localAiKey.trim() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setLocalAiProvider('OPENAI');
            setAiTestMessage(null);
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            localAiProvider === 'OPENAI'
              ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
          <span>OpenAI (ChatGPT)</span>
          {localOpenAiKey.trim() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
        </button>
      </div>

      {/* GOOGLE GEMINI FIELDS */}
      {localAiProvider === 'GEMINI' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Google Gemini API Key</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10.5px] font-bold text-purple-700 hover:underline"
              >
                Lấy API Key Miễn Phí Tại Đây ↗
              </a>
            </div>
            <div className="relative">
              <input
                type={showAiKey ? 'text' : 'password'}
                placeholder="AIzaSy... (Để trống để sử dụng bộ quy tắc y khoa ngoại tuyến)"
                value={localAiKey}
                onChange={(e) => {
                  setLocalAiKey(e.target.value);
                  setAiTestMessage(null);
                }}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowAiKey(!showAiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showAiKey ? 'Ẩn API Key' : 'Hiện API Key'}
              >
                {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mô Hình AI (Gemini Model)</label>
              <select
                value={localAiModel}
                onChange={(e) => setLocalAiModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
              >
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Khuyên Dùng - Siêu Nhanh)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Chuyên Sâu - Đọc PDF Lớn)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Tiết Kiệm Quota)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Độ Ngẫu Nhiên (Temperature)</label>
              <input
                type="text"
                disabled
                value="0.1 (Chuẩn Y Khoa - Chính Xác Cao)"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {/* OPENAI FIELDS */}
      {localAiProvider === 'OPENAI' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">OpenAI API Key</label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[10.5px] font-bold text-emerald-700 hover:underline"
              >
                Lấy OpenAI API Key Tại Đây ↗
              </a>
            </div>
            <div className="relative">
              <input
                type={showOpenAiKey ? 'text' : 'password'}
                placeholder="sk-proj-... (Để trống để sử dụng bộ quy tắc y khoa ngoại tuyến)"
                value={localOpenAiKey}
                onChange={(e) => {
                  setLocalOpenAiKey(e.target.value);
                  setAiTestMessage(null);
                }}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showOpenAiKey ? 'Ẩn API Key' : 'Hiện API Key'}
              >
                {showOpenAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mô Hình AI (OpenAI Model)</label>
              <select
                value={localOpenAiModel}
                onChange={(e) => setLocalOpenAiModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="gpt-4o-mini">GPT-4o mini (Mặc Định - Siêu Nhanh &amp; Tiết Kiệm)</option>
                <option value="gpt-4o">GPT-4o (Khuyên Dùng - Đa Phương Thức Cao Cấp)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Độ Ngẫu Nhiên (Temperature)</label>
              <input
                type="text"
                disabled
                value="0.1 (Chuẩn Y Khoa - Định Dạng JSON)"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {aiTestMessage && (
        <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
          aiTestSuccess
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {aiTestSuccess ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
          <span>{aiTestMessage}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={
            isTestingAi ||
            (localAiProvider === 'GEMINI' && !localAiKey.trim()) ||
            (localAiProvider === 'OPENAI' && !localOpenAiKey.trim())
          }
          onClick={async () => {
            setIsTestingAi(true);
            setAiTestMessage(null);
            const res = localAiProvider === 'GEMINI'
              ? await testGeminiConnection(localAiKey, localAiModel)
              : await testOpenAiConnection(localOpenAiKey, localOpenAiModel);
            setIsTestingAi(false);
            setAiTestSuccess(res.success);
            setAiTestMessage(res.message);
            showToast(res.message, res.success ? 'success' : 'error');
          }}
          className={`px-3.5 py-1.5 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs active:scale-95 ${
            localAiProvider === 'GEMINI' ? 'bg-purple-700 hover:bg-purple-600' : 'bg-emerald-700 hover:bg-emerald-600'
          }`}
        >
          {isTestingAi ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang Kiểm Tra...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Kiểm Tra Kết Nối {localAiProvider === 'GEMINI' ? 'Gemini AI' : 'OpenAI'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
