import { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  MessageSquare, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';
import { MedicalReport, ClinicInfo, ZaloZnsConfig, ToastType } from '@domain/types';
import { 
  generateZaloTextMessage, 
  openZaloChat, 
  sendZaloZnsMessage 
} from '@infra/zaloService';

interface SendZaloModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MedicalReport;
  clinicInfo: ClinicInfo;
  zaloConfig: ZaloZnsConfig;
  showToast: (message: string, type?: ToastType) => void;
  onZnsSuccess?: (msgId: string) => void;
}

export default function SendZaloModal({
  isOpen,
  onClose,
  report,
  clinicInfo,
  zaloConfig,
  showToast,
  onZnsSuccess
}: SendZaloModalProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>(report.patient.phone || '');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSendingZns, setIsSendingZns] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'ZNS'>('PERSONAL');

  // Khởi tạo tin nhắn Zalo mẫu
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(report.patient.phone || '');
      const defaultMsg = generateZaloTextMessage(report, clinicInfo, report.cloudPdfUrl);
      setCustomMessage(defaultMsg);
    }
  }, [isOpen, report, clinicInfo]);

  if (!isOpen) return null;

  // 1. Gửi qua Zalo Cá Nhân / Web Chat (1-Click)
  const handleSendPersonalZalo = async () => {
    if (!phoneNumber.trim()) {
      showToast('Vui lòng nhập số điện thoại Zalo của bệnh nhân!', 'error');
      return;
    }

    try {
      const success = await openZaloChat(phoneNumber, customMessage);
      if (success) {
        showToast(`Đã sao chép tin nhắn và mở Zalo gửi tới SĐT ${phoneNumber}!`, 'success');
        onClose();
      } else {
        showToast('Không thể mở liên kết Zalo. Vui lòng kiểm tra lại!', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi mở Zalo Chat:', err);
      showToast('Đã xảy ra lỗi khi mở Zalo!', 'error');
    }
  };

  // 2. Gửi qua Zalo ZNS / Official Account (API)
  const handleSendZns = async () => {
    if (!zaloConfig.enabled || !zaloConfig.accessToken || !zaloConfig.templateId) {
      showToast('Chưa cấu hình Zalo ZNS trong Cài Đặt (Access Token, Template ID)!', 'error');
      return;
    }

    if (!phoneNumber.trim()) {
      showToast('Vui lòng nhập số điện thoại bệnh nhân!', 'error');
      return;
    }

    setIsSendingZns(true);
    showToast('Đang gửi thông báo kết quả qua Zalo ZNS...', 'info');

    try {
      const res = await sendZaloZnsMessage(report, clinicInfo, zaloConfig);
      setIsSendingZns(false);

      if (res.success) {
        showToast(`Gửi Zalo ZNS thành công! Mã tin nhắn: ${res.msgId || 'OK'}`, 'success');
        if (onZnsSuccess && res.msgId) {
          onZnsSuccess(res.msgId);
        }
        onClose();
      } else {
        showToast(`Lỗi gửi ZNS (${res.error || 'Thất bại'}): ${res.message || 'Kiểm tra token/template'}`, 'error');
      }
    } catch (err) {
      setIsSendingZns(false);
      const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
      showToast(`Không thể gửi tin nhắn Zalo ZNS: ${errMsg}`, 'error');
    }
  };

  // 3. Sao chép nội dung tin nhắn
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    showToast('Đã sao chép nội dung tin nhắn vào bộ nhớ tạm!', 'success');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER MODAL */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#0068FF]/20 border border-[#0068FF]/40 text-[#0068FF]">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                Gửi Kết Quả Qua Zalo Cho Bệnh Nhân
              </h3>
              <p className="text-[11px] text-slate-400">
                {report.patient.name} ({report.code})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS CHỌN PHƯƠNG THỨC GỬI */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('PERSONAL')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'PERSONAL'
                ? 'bg-[#0068FF] text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Zalo Cá Nhân / Web Chat (1-Click)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ZNS')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'ZNS'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zalo ZNS / Official Account (API)</span>
          </button>
        </div>

        {/* BODY NỘI DUNG */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Thông tin bệnh nhân & số điện thoại */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bệnh nhân:</span>
              <strong className="text-white font-bold uppercase">{report.patient.name || '---'}</strong>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-slate-300 font-semibold w-24 shrink-0 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                <span>Số ĐT Zalo:</span>
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ví dụ: 0912345678"
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* TAB 1: ZALO CÁ NHÂN / WEB CHAT */}
          {activeTab === 'PERSONAL' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200">
                  Nội Dung Tin Nhắn Tự Động:
                </label>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="flex items-center space-x-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
                >
                  <Copy className="w-3 h-3" />
                  <span>Sao chép tin nhắn</span>
                </button>
              </div>

              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={9}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-mono text-[11.5px] leading-relaxed focus:ring-2 focus:ring-[#0068FF] focus:outline-none resize-none shadow-inner"
              />

              <div className="p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-blue-200 leading-relaxed">
                💡 <strong>Cách hoạt động:</strong> Khi bấm <em>"Mở Zalo Gửi Ngay"</em>, hệ thống sẽ tự động sao chép toàn bộ tin nhắn trên vào bộ nhớ tạm và mở cuộc trò chuyện với SĐT bệnh nhân. Bạn chỉ cần nhấn <strong>Ctrl + V</strong> và gửi!
              </div>
            </div>
          )}

          {/* TAB 2: ZALO ZNS / OFFICIAL ACCOUNT */}
          {activeTab === 'ZNS' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[11.5px] text-emerald-200 space-y-1.5 leading-relaxed">
                <p className="font-bold flex items-center gap-1 text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  Gửi Tin Nhắn Chăm Sóc Khách Hàng Qua Zalo ZNS:
                </p>
                <p>• Tin nhắn sẽ được gửi trực tiếp từ Official Account của phòng khám đến Zalo của bệnh nhân qua API chính thức.</p>
                <p>• Tự động điền các tham số: Tên bệnh nhân, mã số, ngày khám, link xem PDF và kết luận của bác sĩ.</p>
              </div>

              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Trạng thái cấu hình ZNS:</span>
                  <span className={`font-bold ${zaloConfig.enabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {zaloConfig.enabled ? 'Đã bật' : 'Chưa bật'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Template ID:</span>
                  <span className="font-mono text-slate-200">{zaloConfig.templateId || 'Chưa thiết lập'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Đường dẫn Cloud PDF:</span>
                  <span className="font-mono text-sky-400 truncate max-w-[280px]">
                    {report.cloudPdfUrl || 'Chưa xuất PDF lên Cloud'}
                  </span>
                </div>
              </div>

              {!zaloConfig.enabled && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-800/40 rounded-xl text-[11px] text-amber-200 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Vui lòng vào <strong>Cài Đặt (Settings)</strong> để nhập App ID, OA ID, Access Token và Template ID trước khi sử dụng tính năng này.</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* FOOTER MODAL */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-end space-x-2 bg-slate-900/90 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
          >
            Hủy Bỏ
          </button>

          {activeTab === 'PERSONAL' ? (
            <button
              type="button"
              onClick={handleSendPersonalZalo}
              className="px-5 py-2 bg-[#0068FF] hover:bg-blue-600 text-white font-bold rounded-xl text-xs shadow-md transition active:scale-95 flex items-center space-x-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Mở Zalo Gửi Ngay (1-Click)</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSendingZns || !zaloConfig.enabled}
              onClick={handleSendZns}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition active:scale-95 flex items-center space-x-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingZns ? 'Đang Gửi ZNS...' : 'Gửi Qua Zalo ZNS API'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
