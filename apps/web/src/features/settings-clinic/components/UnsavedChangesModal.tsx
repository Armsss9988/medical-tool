import { useEffect } from 'react';
import { AlertTriangle, Save, Trash2, X, ArrowRight } from 'lucide-react';
import { Patient } from '@domain/types';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndProceed: () => void;
  onDiscardAndProceed: () => void;
  actionName?: string;
  patient?: Patient;
  isEditingExisting?: boolean;
}

export default function UnsavedChangesModal({
  isOpen,
  onClose,
  onSaveAndProceed,
  onDiscardAndProceed,
  actionName = 'Thao tác mới',
  patient,
  isEditingExisting = false
}: UnsavedChangesModalProps) {
  // Bắt phím tắt trong modal: Enter = Lưu & Tiếp tục, Esc = Hủy
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl w-full max-w-md p-6 text-white flex flex-col space-y-4 animate-in zoom-in-95 duration-150 relative">
        
        {/* Nút đóng góc phải */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Hủy bỏ, quay lại chỉnh sửa"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Tiêu đề cảnh báo */}
        <div className="flex items-start space-x-3.5 pt-1">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
              Dữ Liệu Chưa Được Lưu!
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Bạn đang có các thay đổi chưa được lưu cho bệnh nhân{' '}
              <strong className="text-amber-300 uppercase">
                {patient?.name || 'Chưa đặt tên'}
              </strong>{' '}
              ({patient?.code || 'Phiếu hiện tại'}).
            </p>
          </div>
        </div>

        {/* Nội dung giải thích hành động tiếp theo */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
          <div className="flex items-center space-x-1.5 text-sky-400 font-semibold">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Hành động muốn thực hiện: <strong>{actionName}</strong></span>
          </div>
          <p className="text-[11.5px] text-slate-400">
            {isEditingExisting
              ? 'Nếu không lưu, các thay đổi vừa chỉnh sửa của phiếu này sẽ bị mất.'
              : 'Nếu không lưu, thông tin bệnh nhân và các chỉ số vừa nhập sẽ bị xóa.'}
          </p>
        </div>

        {/* Action Buttons Hub */}
        <div className="pt-2 flex flex-col space-y-2">
          {/* LỰA CHỌN 1: Lưu & Tiếp Tục (Khuyên dùng) */}
          <button
            type="button"
            onClick={onSaveAndProceed}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-extrabold rounded-xl shadow-lg shadow-emerald-700/30 border border-emerald-500/40 transition-all flex items-center justify-center space-x-2 text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Phiếu Hiện Tại & Tiếp Tục</span>
          </button>

          {/* LỰA CHỌN 2: Bỏ Qua Thay Đổi */}
          <button
            type="button"
            onClick={onDiscardAndProceed}
            className="w-full py-2.5 px-4 bg-rose-950/50 hover:bg-rose-900/80 active:scale-[0.98] text-rose-300 hover:text-white font-bold rounded-xl border border-rose-800/60 transition-all flex items-center justify-center space-x-2 text-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Bỏ Qua Thay Đổi (Không Lưu)</span>
          </button>

          {/* LỰA CHỌN 3: Ở lại tiếp tục sửa */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-semibold rounded-xl transition-all flex items-center justify-center text-xs"
          >
            Hủy Bỏ, Tiếp Tục Chỉnh Sửa
          </button>
        </div>

      </div>
    </div>
  );
}
