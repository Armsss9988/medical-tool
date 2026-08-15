import { X } from 'lucide-react';
import PrintReportView from './PrintReportView';
import FullAllergenReportView from './FullAllergenReportView';
import { ClinicInfo, Patient, SelectedTest, ToastType } from '@domain/types';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicInfo;
  patient: Patient;
  selectedTests: SelectedTest[];
  conclusion?: string;
  doctorName?: string;
  qrCodeDataUrl?: string;
  cloudLink?: string;
  showToast: (msg: string, type?: ToastType) => void;
  onExportPdfAndUpload: () => void;
  onPrintDirect: () => void;
  onDownloadQrCode: () => void;
}

export default function PdfPreviewModal({
  isOpen,
  onClose,
  clinicInfo,
  patient,
  selectedTests,
  conclusion,
  doctorName,
  qrCodeDataUrl,
  cloudLink,
  onExportPdfAndUpload,
  onPrintDirect,
  onDownloadQrCode
}: PdfPreviewModalProps) {
  if (!isOpen) return null;

  const isAllergenPackage = selectedTests.some(
    (t) => (t.category && t.category.includes('Dị Nguyên')) || t.unit === 'IU/mL'
  );

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Xem Trước Phiếu Kết Quả In A4</h3>
            <p className="text-xs text-slate-400">
              Bệnh nhân: {patient.name || '---'} ({patient.code})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow flex justify-center bg-slate-200">
          <div className="transform scale-[0.85] origin-top shadow-2xl rounded-lg overflow-hidden bg-white">
            {isAllergenPackage ? (
              <FullAllergenReportView
                elementId="printable-preview-allergen"
                clinicInfo={clinicInfo}
                patient={patient}
                selectedTests={selectedTests}
                conclusion={conclusion}
                doctorName={doctorName}
                qrCodeDataUrl={qrCodeDataUrl}
              />
            ) : (
              <PrintReportView
                elementId="printable-preview-medical"
                clinicInfo={clinicInfo}
                patient={patient}
                selectedTests={selectedTests}
                conclusion={conclusion}
                doctorName={doctorName}
                qrCodeDataUrl={qrCodeDataUrl}
              />
            )}
          </div>
        </div>

        <div className="bg-white px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-medium">
            {cloudLink ? (
              <span className="text-emerald-600 font-bold">✓ Đã tải lên Cloud</span>
            ) : (
              <span>Chưa xuất PDF & Cloud</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition">
              Đóng
            </button>
            <button onClick={onPrintDirect} className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded-lg shadow transition">
              In Trực Tiếp
            </button>
            <button onClick={onExportPdfAndUpload} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition">
              Xuất PDF & Cloud
            </button>
            <button
              onClick={onDownloadQrCode}
              disabled={!cloudLink}
              className={`px-4 py-2 font-bold rounded-lg transition ${
                cloudLink
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Tải QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
