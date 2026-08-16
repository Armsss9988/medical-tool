import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  MessageSquare, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  User, 
  FileText, 
  ShieldCheck, 
  Loader2, 
  Sparkles,
  Info
} from 'lucide-react';
import { MedicalReport, ClinicInfo, ZaloZnsConfig, ToastType } from '@domain/types';
import { 
  formatZaloPhone, 
  formatZaloMePhone, 
  generateZaloTextMessage, 
  openZaloChat, 
  sendZaloZnsNotification 
} from '@infra/zaloService';

interface SendZaloModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MedicalReport;
  clinicInfo: ClinicInfo;
  zaloConfig: ZaloZnsConfig;
  showToast: (msg: string, type?: ToastType) => void;
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
  const [recipientPhone, setRecipientPhone] = useState<string>(report.patient.phone || '');
  const [customNote, setCustomNote] = useState<string>('');
  const [isSendingZns, setIsSendingZns] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentReportWithPhone: MedicalReport = {
    ...report,
    patient: {
      ...report.patient,
      phone: recipientPhone
    }
  };

  const previewMessage = generateZaloTextMessage(currentReportWithPhone, clinicInfo, customNote);
  const formattedZnsPhone = formatZaloPhone(recipientPhone);
  const isZnsReady = !!(zaloConfig.enabled && zaloConfig.accessToken && zaloConfig.templateId);

  // 1. Sao chép nội dung tin nhắn
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(previewMessage);
      setCopied(true);
      showToast('Đã sao chép nội dung tin nhắn Zalo!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Không thể truy cập Clipboard!', 'error');
    }
  };

  // 2. Mở chat Zalo 1-Click
  const handleOpenDirectChat = async () => {
    if (!recipientPhone.trim()) {
      showToast('Vui lòng nhập số điện thoại người nhận!', 'error');
      return;
    }
    const success = await openZaloChat(recipientPhone, previewMessage);
    if (success) {
      showToast(`Đã sao chép tin nhắn & mở cuộc trò chuyện Zalo với ${recipientPhone}!`, 'success');
    } else {
      showToast('Số điện thoại không hợp lệ!', 'error');
    }
  };

  // 3. Gửi tự động qua Zalo ZNS API
  const handleSendZns = async () => {
    if (!recipientPhone.trim()) {
      showToast('Vui lòng nhập số điện thoại nhận tin ZNS!', 'error');
      return;
    }

    setIsSendingZns(true);
    try {
      const result = await sendZaloZnsNotification(zaloConfig, currentReportWithPhone, clinicInfo, customNote);
      if (result.success) {
        showToast(result.message || 'Đã gửi thông báo Zalo ZNS thành công tới Bệnh nhân!', 'success');
        if (onZnsSuccess && result.msgId) {
          onZnsSuccess(result.msgId);
        }
        onClose();
      } else {
        showToast(result.message || 'Gửi Zalo ZNS không thành công!', 'error');
      }
    } catch (err: any) {
      showToast(`Lỗi gửi Zalo ZNS: ${err.message || 'Lỗi không xác định'}`, 'error');
    } finally {
      setIsSendingZns(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="bg-[#0068FF] text-white px-5 py-3.5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-sm border border-white/30">
              Z
            </div>
            <div>
              <h3 className="font-extrabold text-sm md:text-base tracking-tight flex items-center gap-2">
                Gửi Kết Quả Xét Nghiệm Qua Zalo
                {isZnsReady ? (
                  <span className="text-[10px] font-bold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3 h-3" />
                    Zalo ZNS OA Sẵn Sàng
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded-full">
                    1-Click Direct Chat
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-blue-100">
                Gửi tự động qua Zalo ZNS hoặc mở cuộc trò chuyện trực tiếp 1-Click
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-blue-100 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-5 overflow-y-auto flex-grow text-xs space-y-4 bg-slate-50/50">
          
          {/* Card Thông Tin Bệnh Nhân & Số Điện Thoại */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Họ tên bệnh nhân */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>Bệnh nhân:</span>
                </label>
                <div className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                  {report.patient.name || '---'}
                </div>
              </div>

              {/* Số điện thoại nhận Zalo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Số điện thoại nhận Zalo:</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="098 3633677"
                  className="w-full bg-white border border-slate-300 focus:border-[#0068FF] focus:ring-2 focus:ring-blue-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none transition-all shadow-2xs"
                />
                {formattedZnsPhone && (
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    Định dạng ZNS: +{formattedZnsPhone}
                  </span>
                )}
              </div>
            </div>

            {/* Trạng thái Link PDF Cloud */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-600">Trạng thái file PDF:</span>
              </div>
              {report.cloudPdfUrl ? (
                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Đã tải lên Cloud
                </span>
              ) : (
                <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Chưa tải lên Cloud (Khuyên dùng 1-Click trước)
                </span>
              )}
            </div>
          </div>

          {/* Lời Dặn Dò Bổ Sung Của Bác Sĩ */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Lời dặn dò bổ sung của Bác sĩ (tùy chọn):</span>
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ví dụ: Nhớ uống nhiều nước và tái khám sau 1 tuần..."
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-[#0068FF] focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Khung Xem Trước Tin Nhắn Zalo */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="font-extrabold text-slate-700 text-[11px] flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#0068FF]" />
                Xem Trước Tin Nhắn Gửi Bệnh Nhân
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-bold text-[#0068FF] hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Đã chép!' : 'Sao chép'}</span>
              </button>
            </div>
            <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-all">
              {previewMessage}
            </div>
          </div>

          {/* Thông báo trạng thái ZNS */}
          {!isZnsReady && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start space-x-2 text-blue-900 text-[11px]">
              <Info className="w-4 h-4 text-[#0068FF] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Chưa kích hoạt Zalo ZNS trong .env / Cài Đặt</p>
                <p className="text-blue-700 mt-0.5">
                  Bạn có thể bấm nút <strong>"Mở Chat Zalo (1-Click)"</strong> bên dưới để gửi tin nhắn hoàn toàn <strong>miễn phí 100%</strong> qua ứng dụng Zalo.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 px-4 md:px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center space-x-1 w-full sm:w-auto active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Đã sao chép' : 'Sao chép tin nhắn'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {/* Nút 1-Click Zalo.me */}
            <button
              type="button"
              onClick={handleOpenDirectChat}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center space-x-1.5"
              title="Tự động copy nội dung và mở chat Zalo trực tiếp"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-300" />
              <span>Mở Chat Zalo (1-Click)</span>
            </button>

            {/* Nút Gửi Zalo ZNS Tự Động */}
            {isZnsReady && (
              <button
                type="button"
                onClick={handleSendZns}
                disabled={isSendingZns}
                className="px-4 py-2 bg-gradient-to-r from-[#0068FF] to-blue-700 hover:from-blue-600 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center justify-center space-x-1.5"
              >
                {isSendingZns ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi ZNS...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-blue-200" />
                    <span>Gửi Zalo ZNS (OA)</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
