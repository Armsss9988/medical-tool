import { useMemo } from 'react';
import { FileText, RotateCcw, Eye, CloudUpload, QrCode, CreditCard, BookmarkCheck, MessageSquare, SlidersHorizontal, Loader2, Download, Zap } from 'lucide-react';
import { SelectedTest } from '@domain/types';
import { ExportStepName, EXPORT_STEP_LABELS } from '@domain/exportTransaction';
import { evaluateResult } from '@domain/testResult';

interface ConclusionFormProps {
  conclusion: string;
  setConclusion: (val: string) => void;
  cloudLink: string;
  isExporting?: boolean;
  currentStep?: ExportStepName | null;
  onExportPdfAndUpload: () => void;
  onDownloadPdf?: () => void;
  onOpenPreview: () => void;
  onSaveReport?: () => void;
  onDirectSendZalo?: () => void;
  onOpenSendZaloModal?: () => void;
  onResetAll: () => void;
  onDownloadQrCode: () => void;
  onOpenInvoiceModal: () => void;
  /** Selected tests for smart auto-conclusion */
  selectedTests?: SelectedTest[];
  /** Phiếu hiện tại có bị outdated so với bản PDF cũ không */
  isPdfOutdated?: boolean;
  /** Phiên bản PDF hiện tại */
  pdfVersion?: number;
  /** Trạng thái thu phí của phiếu đang mở */
  isPaid?: boolean;
  isReportSaved?: boolean;
  invoiceCode?: string;
  invoiceStatus?: string;
  paidAmount?: number;
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
  cloudLink,
  isExporting = false,
  currentStep = null,
  onExportPdfAndUpload,
  onDownloadPdf,
  onOpenPreview,
  onSaveReport,
  onDirectSendZalo,
  onOpenSendZaloModal,
  onResetAll,
  onDownloadQrCode,
  onOpenInvoiceModal,
  selectedTests = [],
  isPdfOutdated = false,
  pdfVersion,
  isPaid = false,
  isReportSaved = false,
  invoiceCode,
  invoiceStatus,
  paidAmount
}: ConclusionFormProps) {
  const handleApplyTemplate = (template: string) => {
    if (!conclusion.trim()) {
      setConclusion(template);
    } else {
      setConclusion(`${conclusion.trim()}. ${template}`);
    }
  };

  // ─── SMART AUTO-CONCLUSION ─────────────────────────────────────────
  const smartConclusion = useMemo(() => {
    if (selectedTests.length === 0) return null;
    
    // Check if all tests have results
    const testsWithResults = selectedTests.filter((t) => t.result && t.result.trim());
    if (testsWithResults.length === 0) return null;

    const abnormalTests: string[] = [];
    const isAllergenBatch = selectedTests.some(
      (t) => t.category?.includes('Dị Nguyên') || t.unit === 'IU/mL'
    );

    for (const t of testsWithResults) {
      const isAllergen = t.category?.includes('Dị Nguyên') || t.unit === 'IU/mL';
      if (isAllergen) {
        // Skip allergen tests for standard conclusion
        continue;
      }
      const evalRes = evaluateResult(t.result, t.refMin, t.refMax);
      if (evalRes.status !== 'normal') {
        abnormalTests.push(`${t.name} (${evalRes.label})`);
      }
    }

    if (isAllergenBatch) {
      // For allergen panels, check if any positive
      const positiveAllergens = testsWithResults.filter((t) => {
        const isAl = t.category?.includes('Dị Nguyên') || t.unit === 'IU/mL';
        if (!isAl) return false;
        return t.note && t.note.includes('Dương tính');
      });
      if (positiveAllergens.length === 0) {
        return 'Kết quả xét nghiệm dị nguyên: Tất cả các chỉ số đều Âm tính';
      }
      const names = positiveAllergens.map((t) => t.name).join(', ');
      return `Dương tính với: ${names}. Đề nghị kết hợp lâm sàng`;
    }

    if (abnormalTests.length === 0) {
      return 'Các chỉ số xét nghiệm trong giới hạn bình thường';
    }

    if (abnormalTests.length <= 3) {
      return `Chỉ số bất thường: ${abnormalTests.join(', ')}. Đề nghị theo dõi và tái khám`;
    }

    return `Có ${abnormalTests.length} chỉ số bất thường. Đề nghị xét nghiệm lại và theo dõi`;
  }, [selectedTests]);

  const handleApplySmartConclusion = () => {
    if (smartConclusion) {
      setConclusion(smartConclusion);
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
            <div className="flex items-center gap-1.5">
              {/* Smart auto-conclusion button */}
              {smartConclusion && !conclusion.trim() && (
                <button
                  type="button"
                  onClick={handleApplySmartConclusion}
                  className="text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-0.5 rounded-md border border-amber-300 transition-all active:scale-95 flex items-center gap-1 animate-in fade-in duration-200"
                  title={smartConclusion}
                >
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>Tự động</span>
                </button>
              )}
              <span className="text-[10.5px] text-slate-400 font-medium">Click mẫu nhanh bên dưới</span>
            </div>
          </div>

          {/* Smart conclusion suggestion banner */}
          {smartConclusion && !conclusion.trim() && (
            <button
              type="button"
              onClick={handleApplySmartConclusion}
              className="w-full mb-2 p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-left text-[11px] text-amber-800 font-medium transition-all active:scale-[0.99] group"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-700 transition" />
                <span className="font-bold text-amber-900">Gợi ý:</span>
                <span className="truncate">{smartConclusion}</span>
                <kbd className="ml-auto text-[9px] font-mono bg-amber-200 text-amber-700 px-1 py-0.5 rounded shrink-0">Click</kbd>
              </span>
            </button>
          )}

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

        {/* ═══ CẢNH BÁO PDF OUTDATED (NẾU ĐÃ SỬA DỮ LIỆU) ═══ */}
        {isPdfOutdated && (
          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span className="font-semibold">
                Dữ liệu đã sửa so với bản PDF Cloud trước ({pdfVersion ? `v${pdfVersion}` : 'cũ'}).
              </span>
            </div>
            <span className="text-[10.5px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-extrabold shrink-0">
              Cần Cập Nhật PDF
            </span>
          </div>
        )}

        {/* Action Grid Buttons */}
        <div className="pt-2 space-y-2">

          {/* Hero Action: 1-Click PDF & Cloud Upload */}
          <button
            type="button"
            onClick={onExportPdfAndUpload}
            disabled={isExporting}
            className={`w-full py-3 px-4 disabled:opacity-75 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md border transition-all active:scale-[0.98] flex items-center justify-center space-x-2 text-xs tracking-wide ${
              isPdfOutdated
                ? 'bg-gradient-to-r from-amber-600 via-emerald-600 to-teal-600 hover:from-amber-500 hover:to-teal-500 shadow-amber-700/20 border-amber-500/50'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 shadow-emerald-700/20 border-emerald-500/50'
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{currentStep ? EXPORT_STEP_LABELS[currentStep] : 'Đang xử lý Transaction...'}</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4 text-emerald-100" />
                <span>{isPdfOutdated ? 'Cập Nhật Lại File PDF & Tải Lên Cloud (1-Click)' : 'Xuất File PDF & Tải Lên Cloud (1-Click)'}</span>
                <kbd className="text-[9px] font-mono bg-emerald-500/50 text-emerald-100 px-1.5 py-0.5 rounded ml-1">Ctrl+Shift+E</kbd>
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

          {/* Secondary Actions in Grid (2x2) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenPreview}
              className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-xl border border-sky-200 shadow-2xs transition-all active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-sky-600" />
              <span>Xem Trước (A4)</span>
              <kbd className="text-[9px] font-mono bg-sky-100 text-sky-600 px-1 py-0.5 rounded">Ctrl+P</kbd>
            </button>

            {onDownloadPdf ? (
              <button
                type="button"
                onClick={onDownloadPdf}
                disabled={!cloudLink || isExporting}
                className={`py-2.5 px-3 rounded-xl border shadow-2xs transition-all active:scale-95 flex items-center justify-center space-x-1.5 font-bold ${
                  cloudLink && !isExporting
                    ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-300'
                    : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
                title={cloudLink ? "Tải file PDF về máy tính" : "Vui lòng Xuất File PDF & Tải Lên Cloud trước khi tải"}
              >
                <Download className={`w-3.5 h-3.5 ${cloudLink ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>Tải File PDF Về Máy</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={onSaveReport}
              className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 shadow-2xs transition-all active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lưu Sổ Lưu</span>
              <kbd className="text-[9px] font-mono bg-emerald-100 text-emerald-600 px-1 py-0.5 rounded">Ctrl+S</kbd>
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
              title={cloudLink ? "Tải ảnh mã QR Code về máy" : "Vui lòng Xuất File PDF & Tải Lên Cloud trước khi tải QR"}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Tải Ảnh QR Code</span>
            </button>
          </div>

          {/* Trạng thái Viện Phí & Nút Thu Phí */}
          <div className="w-full">
            {invoiceCode && isPaid ? (
              <div 
                onClick={onOpenInvoiceModal}
                className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-xl transition cursor-pointer flex items-center justify-between shadow-2xs group"
                title="Bấm để xem hoặc in lại biên lai thu tiền"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11.5px] font-bold text-emerald-800 flex items-center gap-1">
                      <span>Đã Thu Viện Phí</span>
                      {paidAmount ? <strong className="font-mono text-emerald-700 font-extrabold">({paidAmount.toLocaleString('vi-VN')} đ)</strong> : null}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-600 block">{invoiceCode} • {invoiceStatus || 'Đã thanh toán'}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 group-hover:underline flex items-center gap-0.5">
                  <span>Xem Biên Lai</span>
                  <span>→</span>
                </span>
              </div>
            ) : invoiceCode ? (
              <div 
                onClick={onOpenInvoiceModal}
                className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 rounded-xl transition cursor-pointer flex items-center justify-between shadow-2xs group"
                title="Hóa đơn đã lập nhưng chưa thu tiền. Bấm để thu tiền hoặc in biên lai"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11.5px] font-bold text-amber-900 flex items-center gap-1">
                      <span>Hóa Đơn Chờ Thu</span>
                      {paidAmount ? <strong className="font-mono text-amber-800 font-extrabold">({paidAmount.toLocaleString('vi-VN')} đ)</strong> : null}
                    </span>
                    <span className="font-mono text-[10px] text-amber-700 block">{invoiceCode} • {invoiceStatus || 'Chưa thu phí'}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-800 group-hover:underline flex items-center gap-0.5">
                  <span>Thu Tiền / In</span>
                  <span>→</span>
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenInvoiceModal}
                className={`w-full py-2.5 px-3 font-bold rounded-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center space-x-1.5 ${
                  isReportSaved
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
                title={!isReportSaved ? "Lưu phiếu xét nghiệm (Ctrl+S) trước khi tạo hóa đơn" : "Tạo hóa đơn viện phí cho bệnh nhân"}
              >
                <CreditCard className={`w-4 h-4 ${isReportSaved ? 'text-white' : 'text-slate-500'}`} />
                <span>{isReportSaved ? 'Tạo Hóa Đơn Thu Phí (Chưa Thu)' : 'Tạo Hóa Đơn (Cần Lưu Phiếu)'}</span>
              </button>
            )}
          </div>

          {/* Reset Button */}
          <button
            type="button"
            onClick={onResetAll}
            className="w-full py-2 px-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-semibold rounded-xl border border-dashed border-slate-300 transition-all flex items-center justify-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm Mới Toàn Bộ (BN Mới)</span>
            <kbd className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1 py-0.5 rounded ml-1">Ctrl+N</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
