import { FileText, Printer, RotateCcw, Eye, CloudUpload, QrCode, CreditCard } from 'lucide-react';
import DoctorSelectCombobox from './DoctorSelectCombobox';
import { Doctor } from '@domain/types';

interface ConclusionFormProps {
  conclusion: string;
  setConclusion: (val: string) => void;
  doctorName: string;
  setDoctorName: (val: string) => void;
  cloudLink: string;
  onExportPdfAndUpload: () => void;
  onOpenPreview: () => void;
  onPrintDirect: () => void;
  onResetAll: () => void;
  onDownloadQrCode: () => void;
  onOpenInvoiceModal: () => void;
  doctorsList?: Doctor[];
}

export default function ConclusionForm({ 
  conclusion, 
  setConclusion, 
  doctorName, 
  setDoctorName,
  cloudLink,
  onExportPdfAndUpload,
  onOpenPreview,
  onPrintDirect,
  onResetAll,
  onDownloadQrCode,
  onOpenInvoiceModal,
  doctorsList = []
}: ConclusionFormProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <span>Kết Luận & Bác Sĩ Chỉ Định</span>
        </h2>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Kết Luận Của Bác Sĩ</label>
          <textarea
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="Ví dụ: Các chỉ số sinh hóa máu bình thường / Nghi ngờ dị ứng với bọ bụi nhà..."
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Bác Sĩ Chỉ Định / Xét Nghiệm</label>
          <DoctorSelectCombobox
            doctorsList={doctorsList}
            selectedDoctor={doctorName}
            onSelectDoctor={(name) => setDoctorName(name)}
          />
        </div>

        <div className="pt-2 grid grid-cols-2 gap-2">
          <button
            onClick={onExportPdfAndUpload}
            className="col-span-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition flex items-center justify-center space-x-2 text-xs"
          >
            <CloudUpload className="w-4 h-4" />
            <span>Xuất File PDF & Tải Lên Cloud (1-Click)</span>
          </button>

          <button
            onClick={onOpenPreview}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition flex items-center justify-center space-x-1.5"
          >
            <Eye className="w-4 h-4" />
            <span>Xem Trước PDF</span>
          </button>

          <button
            onClick={onPrintDirect}
            className="py-2 px-3 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded-lg transition flex items-center justify-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>In Phiếu Nhanh</span>
          </button>

          <button
            onClick={onDownloadQrCode}
            disabled={!cloudLink}
            className={`py-2 px-3 font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${
              cloudLink
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Tải QR Code</span>
          </button>

          <button
            onClick={onOpenInvoiceModal}
            className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition flex items-center justify-center space-x-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span>Tạo Hóa Đơn</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 text-right">
          <button
            onClick={onResetAll}
            className="text-xs text-slate-500 hover:text-rose-600 font-semibold inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm Mới Nhập Bệnh Nhân Mới</span>
          </button>
        </div>
      </div>
    </div>
  );
}
