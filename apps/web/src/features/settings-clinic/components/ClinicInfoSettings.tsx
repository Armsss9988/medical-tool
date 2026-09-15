import React from 'react';
import { 
  RotateCcw, Upload, Image as ImageIcon, CreditCard 
} from 'lucide-react';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import { ClinicInfo, ToastType, DEFAULT_CLINIC_INFO } from '@domain/types';

export const VIETNAM_BANKS = [
  { id: 'VBA', name: 'Agribank (VBA)' },
  { id: 'ICB', name: 'VietinBank (ICB)' },
  { id: 'VCB', name: 'Vietcombank (VCB)' },
  { id: 'MB', name: 'MBBank (MB)' },
  { id: 'TCB', name: 'Techcombank (TCB)' },
  { id: 'BIDV', name: 'BIDV' },
  { id: 'ACB', name: 'ACB' },
  { id: 'VPB', name: 'VPBank (VPB)' },
  { id: 'TPB', name: 'TPBank (TPB)' },
  { id: 'STB', name: 'Sacombank (STB)' },
  { id: 'HDB', name: 'HDBank (HDB)' },
  { id: 'VIB', name: 'VIB' },
  { id: 'SHB', name: 'SHB' },
  { id: 'MSB', name: 'MSB' },
  { id: 'LPB', name: 'LPBank (LPB)' },
  { id: 'OCB', name: 'OCB' },
  { id: 'SEAB', name: 'SeABank' }
];

interface ClinicInfoSettingsProps {
  clinicInfo: ClinicInfo;
  setClinicInfo: React.Dispatch<React.SetStateAction<ClinicInfo>>;
  showToast: (message: string, type?: ToastType) => void;
}

export const ClinicInfoSettings: React.FC<ClinicInfoSettingsProps> = ({
  clinicInfo,
  setClinicInfo,
  showToast
}) => {
  const handleClinicChange = (field: keyof ClinicInfo, val: string) => {
    setClinicInfo((prev) => ({ ...prev, [field]: val }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setClinicInfo((prev) => ({ ...prev, logoUrl: dataUrl }));
        showToast('Đã tải lên Logo mới thành công!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setClinicInfo((prev) => ({ ...prev, stampUrl: dataUrl }));
        showToast('Đã tải lên Con dấu / Chữ ký mới thành công!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setClinicInfo((prev) => ({ ...prev, logoUrl: undefined }));
    showToast('Đã đặt lại Logo về biểu trưng GoLab chuẩn!', 'info');
  };

  const handleResetStamp = () => {
    setClinicInfo((prev) => ({ ...prev, stampUrl: undefined }));
    showToast('Đã đặt lại Con dấu về mẫu GoLab chuẩn!', 'info');
  };

  const activeLogo = clinicInfo.logoUrl || golabLogo;
  const activeStamp = clinicInfo.stampUrl || doctorStamp;

  return (
    <>
      {/* PHÒNG KHÁM */}
      <div className="space-y-3 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
            <span>Thông Tin Phòng Khám (In phiếu A4)</span>
          </h4>
          <button
            type="button"
            onClick={() => {
              setClinicInfo((prev) => ({
                ...DEFAULT_CLINIC_INFO,
                logoUrl: prev.logoUrl,
                stampUrl: prev.stampUrl
              }));
              showToast('Đã khôi phục thông tin phòng khám GoLab chuẩn!', 'info');
            }}
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-md flex items-center gap-1 transition active:scale-95 cursor-pointer"
            title="Khôi phục tên phòng khám, địa chỉ, hotline, website mặc định"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Khôi phục mặc định</span>
          </button>
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Tên Phòng Khám</label>
          <input
            type="text"
            value={clinicInfo.name}
            onChange={(e) => handleClinicChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Chi Nhánh / Điểm Tiếp Nhận</label>
          <input
            type="text"
            value={clinicInfo.address}
            onChange={(e) => handleClinicChange('address', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Trụ Sở Chính Hệ Thống</label>
          <input
            type="text"
            value={clinicInfo.headquartersAddress || ''}
            placeholder="Số 36 BT5, Khu đô thị Pháp Vân, phường Hoàng Liệt, thành phố Hà Nội"
            onChange={(e) => handleClinicChange('headquartersAddress', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại Hotline</label>
            <input
              type="text"
              value={clinicInfo.phone}
              onChange={(e) => handleClinicChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Website</label>
            <input
              type="text"
              value={clinicInfo.website || ''}
              placeholder="golab.com.vn"
              onChange={(e) => handleClinicChange('website', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Phụ Trách Chuyên Môn (Người Ký Phiếu & Đóng Dấu)
          </label>
          <input
            type="text"
            value={clinicInfo.defaultDoctor || ''}
            placeholder="Nguyễn Thị Thành Trung"
            onChange={(e) => handleClinicChange('defaultDoctor', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <p className="text-[10.5px] text-slate-400 mt-1 font-medium">
            Tên này sẽ hiển thị ở khối chữ ký <strong className="text-slate-700">"PHỤ TRÁCH CHUYÊN MÔN"</strong> dưới con dấu trên phiếu trả kết quả
          </p>
        </div>

        {/* GẮN LOGO VÀ CON DẤU PHÒNG KHÁM */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Box Logo */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center text-center">
            <span className="font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>Logo Phiếu In (A4)</span>
            </span>
            <div className="h-16 w-full max-w-[140px] bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center mb-2 overflow-hidden shadow-2xs">
              <img
                src={activeLogo}
                alt="Logo Preview"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null;
                  target.src = golabLogo;
                }}
              />
            </div>
            <div className="flex items-center space-x-1.5 w-full justify-center">
              <label className="cursor-pointer px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md font-bold text-[10.5px] flex items-center gap-1 shadow transition active:scale-95">
                <Upload className="w-3 h-3" />
                <span>Tải Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {clinicInfo.logoUrl && (
                <button
                  type="button"
                  onClick={handleResetLogo}
                  title="Đặt lại về Logo GoLab chuẩn"
                  className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Box Con Dấu */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center text-center">
            <span className="font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-red-600" />
              <span>Con Dấu / Chữ Ký</span>
            </span>
            <div className="h-16 w-full max-w-[140px] bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center mb-2 overflow-hidden shadow-2xs">
              <img
                src={activeStamp}
                alt="Con Dấu Preview"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null;
                  target.src = doctorStamp;
                }}
              />
            </div>
            <div className="flex items-center space-x-1.5 w-full justify-center">
              <label className="cursor-pointer px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md font-bold text-[10.5px] flex items-center gap-1 shadow transition active:scale-95">
                <Upload className="w-3 h-3" />
                <span>Tải Con Dấu</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStampUpload}
                  className="hidden"
                />
              </label>
              {clinicInfo.stampUrl && (
                <button
                  type="button"
                  onClick={handleResetStamp}
                  title="Đặt lại về Con Dấu GoLab chuẩn"
                  className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CẤU HÌNH TÀI KHOẢN NGÂN HÀNG & VIETQR */}
      <div className="space-y-3 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Tài Khoản Ngân Hàng & Thanh Toán VietQR</span>
          </h4>
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
            In Trên Phiếu Thu & Thanh Toán Online
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          Thông tin nhận tiền sẽ được in trực tiếp vào khung chuyển khoản trên Phiếu Thu và tự động tạo mã VietQR Napas 247.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ngân Hàng Nhận Tiền</label>
            <select
              value={clinicInfo.bankId || 'VBA'}
              onChange={(e) => {
                const selected = VIETNAM_BANKS.find((b) => b.id === e.target.value);
                setClinicInfo((prev) => ({
                  ...prev,
                  bankId: e.target.value,
                  bankName: selected?.name.split(' (')[0] || e.target.value
                }));
              }}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {VIETNAM_BANKS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Số Tài Khoản (STK)</label>
            <input
              type="text"
              placeholder="Ví dụ: 8888876781225"
              value={clinicInfo.bankAccountNo || ''}
              onChange={(e) => handleClinicChange('bankAccountNo', e.target.value.trim())}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên Chủ Tài Khoản</label>
            <input
              type="text"
              placeholder="Ví dụ: LE PHAN ANH"
              value={clinicInfo.bankAccountName || ''}
              onChange={(e) => handleClinicChange('bankAccountName', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-bold uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Chi Nhánh Ngân Hàng / Ghi Chú Tài Khoản</label>
          <input
            type="text"
            placeholder="Ví dụ: Agribank - Chi nhánh Lý Thái Tổ - Quảng Bình"
            value={clinicInfo.bankBranch || ''}
            onChange={(e) => handleClinicChange('bankBranch', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* CẤU HÌNH NGƯỜI KÝ PHIẾU THU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Người Lập Phiếu Thu (Mặc định)</label>
            <input
              type="text"
              placeholder="Ví dụ: Lê Phan Anh"
              value={clinicInfo.cashierName || ''}
              onChange={(e) => handleClinicChange('cashierName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kế Toán Xác Nhận (Mặc định)</label>
            <input
              type="text"
              placeholder="Ví dụ: Trần Thị Thanh Hương"
              value={clinicInfo.accountantName || ''}
              onChange={(e) => handleClinicChange('accountantName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* TÙY CHỌN ẢNH QR RIÊNG / XEM TRƯỚC VIETQR */}
        <div className="pt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mã QR In Trên Phiếu Thu</span>
            </span>
            <p className="text-[11px] text-slate-500">
              {clinicInfo.bankQrImageUrl ? 'Đang dùng ảnh QR tùy chỉnh bạn đã tải lên.' : 'Đang dùng hệ thống sinh mã VietQR Napas 247 tự động.'}
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <label className="cursor-pointer px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-bold text-[10.5px] flex items-center gap-1 shadow transition active:scale-95">
                <Upload className="w-3 h-3" />
                <span>{clinicInfo.bankQrImageUrl ? 'Đổi Ảnh QR' : 'Tải Ảnh QR Riêng'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const dataUrl = event.target?.result as string;
                      if (dataUrl) {
                        setClinicInfo((prev) => ({ ...prev, bankQrImageUrl: dataUrl }));
                        showToast('Đã tải lên ảnh QR Code thanh toán thành công!', 'success');
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
              </label>
              {clinicInfo.bankQrImageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setClinicInfo((prev) => ({ ...prev, bankQrImageUrl: undefined }));
                    showToast('Đã chuyển về mã VietQR Napas 247 tự động!', 'info');
                  }}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-semibold text-[10.5px] transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Dùng VietQR Tự Động</span>
                </button>
              )}
            </div>
          </div>

          {/* QR Preview Box */}
          <div className="w-20 h-20 bg-white border border-slate-300 rounded-lg p-1 shrink-0 flex items-center justify-center shadow-2xs">
            <img
              src={
                clinicInfo.bankQrImageUrl ||
                `https://img.vietqr.io/image/${clinicInfo.bankId || 'VBA'}-${clinicInfo.bankAccountNo || '8888876781225'}-compact2.png?amount=0&accountName=${encodeURIComponent(clinicInfo.bankAccountName || 'LE PHAN ANH')}`
              }
              alt="QR Code"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GoLab';
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
