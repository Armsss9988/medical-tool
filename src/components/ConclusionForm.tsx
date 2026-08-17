import { FileText, RotateCcw, Eye, CloudUpload, QrCode, CreditCard, BookmarkCheck, MessageSquare, SlidersHorizontal, Loader2 } from 'lucide-react';
import DoctorSelectCombobox from './DoctorSelectCombobox';
import { Doctor } from '@domain/types';
import { ExportStepName, EXPORT_STEP_LABELS } from '@domain/exportTransaction';

interface ConclusionFormProps {
  conclusion: string;
  setConclusion: (val: string) => void;
  doctorName: string;
  setDoctorName: (val: string) => void;
  cloudLink: string;
  isExporting?: boolean;
  currentStep?: ExportStepName | null;
  onExportPdfAndUpload: () => void;
  onOpenPreview: () => void;
  onSaveReport?: () => void;
  onDirectSendZalo?: () => void;
  onOpenSendZaloModal?: () => void;
  onResetAll: () => void;
  onDownloadQrCode: () => void;
  onOpenInvoiceModal: () => void;
  doctorsList?: Doctor[];
  onOpenDoctorModal?: () => void;
}

const QUICK_CONCLUSION_TEMPLATES = [
  'Các chỉ số sinh hóa máu trong giới hạn bình thường',
  'Đạt tiêu chuẩn sức khỏe hiện tại',
  'Nghi ngờ phản ứng dị ứng, đề nghị kết hợp lâm sàng',
  'Đề nghị xét nghiệm lại và theo dõi sau 1 tháng'
];

export default function ConclusionForm({ 
  conclusion, 
  setConclusion, 
  doctorName, 
  setDoctorName,
  cloudLink,
  isExporting = false,
  currentStep = null,
  onExportPdfAndUpload,
  onOpenPreview,
  onSaveReport,
  onDirectSendZalo,
  onOpenSendZaloModal,
  onResetAll,
  onDownloadQrCode,
  onOpenInvoiceModal,
  doctorsList = [],
  onOpenDoctorModal
}: ConclusionFormProps) {
  const handleApplyTemplate = (template: string) => {
    if (!conclusion.trim()) {
      setConclusion(template);
    } else {
      setConclusion(`${conclusion.trim()}. ${template}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 lg:p-5 space-y-4 transition-all">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-3.5 border-b border-slate-100">
        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black">
          2
        </span>
        <h2 className="text-xs lg:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Kết Luận & Thao Tác Xuất Phiếu</span>
        </h2>
      </div>

      <div className="space-y-3.5 text-xs">
        {/* Kết Luận Của Bác Sĩ */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-slate-700">Kết Luận Của Bác Sĩ:</label>
            <span className="text-[10.5px] text-slate-400 font-medium">Click mẫu nhanh bên dưới</span>
          </div>

          <textarea
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl text-slate-900 font-semibold focus:outline-none transition-all shadow-2xs leading-relaxed"
            placeholder="Ví dụ: Các chỉ số sinh hóa máu trong giới hạn bình thường / Nghi ngờ dị ứng với bọ bụi nhà..."
          />

          {/* Quick template chips */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_CONCLUSION_TEMPLATES.map((tmpl, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleApplyTemplate(tmpl)}
                className="text-[10.5px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-300 transition-all text-left line-clamp-1 active:scale-95"
                title={tmpl}
              >
                + {tmpl}
              </button>
            ))}
          </div>
        </div>

        {/* Bác Sĩ Chỉ Định / Thực Hiện */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5">Bác Sĩ Chỉ Định / Người Đọc Phiếu:</label>
          <DoctorSelectCombobox
            doctorsList={doctorsList}
            selectedDoctor={doctorName}
            onSelectDoctor={(name) => setDoctorName(name)}
            onOpenDoctorModal={onOpenDoctorModal}
          />
        </div>

        {/* Action Grid Buttons */}
        <div className="pt-2 space-y-2">
          {/* Hero Action: 1-Click PDF & Cloud Upload */}
          <button
            type="button"
            onClick={onExportPdfAndUpload}
            disabled={isExporting}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 disabled:opacity-75 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md shadow-emerald-700/20 border border-emerald-500/50 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 text-xs tracking-wide"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{currentStep ? EXPORT_STEP_LABELS[currentStep] : 'Đang xử lý Transaction...'}</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4 text-emerald-100" />
                <span>Xuất File PDF & Tải Lên Cloud (1-Click)</span>
              </>
            )}
          </button>

          {/* Fast Action: Gửi Zalo Cho Bệnh Nhân (1-Click) */}
          {(onDirectSendZalo || onOpenSendZaloModal) && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={onDirectSendZalo || onOpenSendZaloModal}
                className="flex-grow py-2.5 px-3.5 bg-[#0068FF] hover:bg-blue-600 active:bg-blue-700 text-white font-extrabold rounded-xl shadow-md shadow-blue-500/20 border border-blue-400/50 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 text-xs"
                title="Tự động sao chép tin nhắn kèm link PDF và mở cuộc trò chuyện Zalo với bệnh nhân"
              >
                <MessageSquare className="w-4 h-4 text-blue-100" />
                <span>Gửi Zalo Cho Bệnh Nhân (1-Click)</span>
              </button>
              {onOpenSendZaloModal && (
                <button
                  type="button"
                  onClick={onOpenSendZaloModal}
                  className="p-2.5 bg-blue-50 hover:bg-blue-100 text-[#0068FF] rounded-xl border border-blue-200 shadow-2xs transition-all active:scale-95 shrink-0"
                  title="Xem trước hoặc tùy chỉnh nội dung tin nhắn Zalo"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* 4 Secondary Actions in 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenPreview}
              className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-xl border border-sky-200 shadow-2xs transition-all active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-sky-600" />
              <span>Xem Trước Phiếu (A4)</span>
            </button>

            <button
              type="button"
              onClick={onSaveReport}
              className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 shadow-2xs transition-all active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lưu Vào Sổ Lưu</span>
            </button>

            <button
              type="button"
              onClick={onDownloadQrCode}
              disabled={!cloudLink}
              className={`py-2.5 px-3 rounded-xl border shadow-2xs transition-all active:scale-95 flex items-center justify-center space-x-1.5 font-bold ${
                cloudLink
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Tải Ảnh QR Code</span>
            </button>

            <button
              type="button"
              onClick={onOpenInvoiceModal}
              className="py-2.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl border border-teal-200 shadow-2xs transition-all active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-teal-600" />
              <span>Tạo Hóa Đơn Thu Phí</span>
            </button>
          </div>

          {/* Reset Button */}
          <button
            type="button"
            onClick={onResetAll}
            className="w-full py-2 px-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-semibold rounded-xl border border-dashed border-slate-300 transition-all flex items-center justify-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm Mới Toàn Bộ (Bệnh Nhân Mới)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
