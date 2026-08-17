import { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  Trash2, 
  Calendar, 
  RotateCcw, 
  Eye, 
  Cloud, 
  QrCode, 
  Copy, 
  FileSpreadsheet, 
  Sparkles, 
  Clock, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { MedicalReport, Doctor, ToastType } from '@domain/types';
import { exportReportsExcel } from '@infra/excelService';
import { downloadDataUrlAsImage } from '@infra/qrService';

interface ReportManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: MedicalReport[];
  doctorsList?: Doctor[];
  onLoadReport: (report: MedicalReport) => void;
  onPreviewReport: (report: MedicalReport) => void;
  onDuplicateReport: (report: MedicalReport) => void;
  onOpenSendZaloModal?: (report: MedicalReport) => void;
  onDeleteReport: (id: string) => void;
  onClearAllReports: () => void;
  showToast: (message: string, type?: ToastType) => void;
}

type DateFilterType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH';

export default function ReportManagerModal({
  isOpen,
  onClose,
  reports,
  doctorsList = [],
  onLoadReport,
  onPreviewReport,
  onDuplicateReport,
  onOpenSendZaloModal,
  onDeleteReport,
  onClearAllReports,
  showToast
}: ReportManagerModalProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'STANDARD' | 'ALLERGEN'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // 1. Thống kê KPI tổng quan
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayCount = reports.filter((r) => new Date(r.createdAt).toDateString() === todayStr).length;
    const allergenCount = reports.filter((r) => r.isAllergen).length;
    const cloudCount = reports.filter((r) => !!r.cloudPdfUrl).length;

    return {
      total: reports.length,
      today: todayCount,
      allergen: allergenCount,
      cloud: cloudCount
    };
  }, [reports]);

  // 2. Lọc danh sách phiếu theo các tiêu chí
  const filteredReports = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const now = new Date();
    const todayStr = now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    return reports.filter((rep) => {
      // Tìm kiếm văn bản
      if (term) {
        const matchName = rep.patient.name?.toLowerCase().includes(term);
        const matchCode = rep.code?.toLowerCase().includes(term);
        const matchSample = rep.sampleCode?.toLowerCase().includes(term);
        const matchPhone = rep.patient.phone?.toLowerCase().includes(term);
        const matchDoctor = rep.doctorName?.toLowerCase().includes(term);
        const matchDiagnosis = rep.patient.diagnosis?.toLowerCase().includes(term);
        const matchConclusion = rep.conclusion?.toLowerCase().includes(term);

        if (!matchName && !matchCode && !matchSample && !matchPhone && !matchDoctor && !matchDiagnosis && !matchConclusion) {
          return false;
        }
      }

      // Lọc theo Bác sĩ
      if (selectedDoctor !== 'ALL' && rep.doctorName !== selectedDoctor) {
        return false;
      }

      // Lọc theo Loại phiếu
      if (selectedType === 'ALLERGEN' && !rep.isAllergen) return false;
      if (selectedType === 'STANDARD' && rep.isAllergen) return false;

      // Lọc theo Trạng thái
      if (selectedStatus !== 'ALL' && rep.status !== selectedStatus) {
        return false;
      }

      // Lọc theo Thời gian
      const repDate = new Date(rep.createdAt);
      if (dateFilter === 'TODAY') {
        if (repDate.toDateString() !== todayStr) return false;
      } else if (dateFilter === 'YESTERDAY') {
        if (repDate.toDateString() !== yesterdayStr) return false;
      } else if (dateFilter === 'LAST_7_DAYS') {
        if (repDate < sevenDaysAgo) return false;
      } else if (dateFilter === 'THIS_MONTH') {
        if (repDate.getMonth() !== now.getMonth() || repDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      return true;
    });
  }, [reports, searchTerm, selectedDoctor, selectedType, selectedStatus, dateFilter]);

  // 3. Xuất toàn bộ phiếu đã lọc ra Excel
  const handleExportFilteredExcel = async () => {
    if (filteredReports.length === 0) {
      showToast('Không có dữ liệu phiếu xét nghiệm để xuất Excel!', 'error');
      return;
    }
    try {
      showToast('Đang tạo file Excel danh sách phiếu xét nghiệm...', 'info');
      await exportReportsExcel(filteredReports);
      showToast(`Đã xuất thành công ${filteredReports.length} phiếu ra Excel!`, 'success');
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
      showToast('Đã xảy ra lỗi khi xuất file Excel!', 'error');
    }
  };

  // 4. Tải mã QR Code của phiếu đã lưu
  const handleDownloadQr = (rep: MedicalReport) => {
    if (!rep.qrCodeDataUrl) {
      showToast('Phiếu này chưa được tải lên Cloud hoặc chưa có mã QR!', 'error');
      return;
    }
    const safeName = (rep.patient.name || 'BenhNhan').replace(/\s+/g, '_');
    const qrFilename = `QRCode_PhieuKham_${safeName}_${rep.code}.png`;
    downloadDataUrlAsImage(rep.qrCodeDataUrl, qrFilename);
    showToast('Đã tải ảnh mã QR Code về máy!', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Sổ Lưu Phiếu Kết Quả Xét Nghiệm
                <span className="text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  {reports.length} Hồ Sơ
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tra cứu, nạp lại, nhân bản và quản lý toàn bộ hồ sơ xét nghiệm đã lập
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportFilteredExcel}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Sổ Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* THỐNG KÊ KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800/80 text-xs shrink-0">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Tổng số phiếu</p>
              <p className="text-lg font-black text-white font-mono mt-0.5">{stats.total}</p>
            </div>
            <FileText className="w-5 h-5 text-sky-400/80" />
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Lập hôm nay</p>
              <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">{stats.today}</p>
            </div>
            <Clock className="w-5 h-5 text-emerald-400/80" />
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Phiếu Dị Nguyên</p>
              <p className="text-lg font-black text-purple-400 font-mono mt-0.5">{stats.allergen}</p>
            </div>
            <Sparkles className="w-5 h-5 text-purple-400/80" />
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Đã tải lên Cloud</p>
              <p className="text-lg font-black text-amber-400 font-mono mt-0.5">{stats.cloud}</p>
            </div>
            <Cloud className="w-5 h-5 text-amber-400/80" />
          </div>
        </div>

        {/* BỘ LỌC TÌM KIẾM & PHÂN LOẠI */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3 shrink-0 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Ô tìm kiếm từ khóa */}
            <div className="sm:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm họ tên, mã BN, SĐT, kết luận..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-medium"
              />
            </div>

            {/* Lọc thời gian */}
            <div className="sm:col-span-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="ALL">Mọi thời gian</option>
                <option value="TODAY">Hôm nay</option>
                <option value="YESTERDAY">Hôm qua</option>
                <option value="LAST_7_DAYS">7 ngày qua</option>
                <option value="THIS_MONTH">Tháng này</option>
              </select>
            </div>

            {/* Lọc loại phiếu */}
            <div className="sm:col-span-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="ALL">Tất cả loại phiếu</option>
                <option value="STANDARD">Phiếu thường</option>
                <option value="ALLERGEN">Phiếu Dị nguyên</option>
              </select>
            </div>

            {/* Lọc Bác sĩ */}
            <div className="sm:col-span-2">
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="ALL">Tất cả bác sĩ</option>
                {doctorsList.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc trạng thái */}
            <div className="sm:col-span-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Chờ xét nghiệm">Chờ xét nghiệm</option>
                <option value="Đã có kết quả">Đã có kết quả</option>
                <option value="Đã xuất Cloud">Đã xuất Cloud</option>
                <option value="Đã trả kết quả">Đã trả kết quả</option>
              </select>
            </div>
          </div>
        </div>

        {/* DANH SÁCH BẢNG HỒ SƠ PHIẾU XÉT NGHIỆM */}
        <div className="flex-1 overflow-y-auto p-4 text-xs">
          {filteredReports.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">Không tìm thấy phiếu xét nghiệm nào phù hợp với bộ lọc!</p>
              <p className="text-xs text-slate-500">Hãy thử xóa từ khóa tìm kiếm hoặc chọn "Mọi thời gian"</p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800 text-slate-200 font-bold border-b border-slate-700">
                  <tr>
                    <th className="p-3 w-10 text-center">STT</th>
                    <th className="p-3">Mã Phiếu & Thời Gian</th>
                    <th className="p-3">Bệnh Nhân & Năm Sinh</th>
                    <th className="p-3">Số ĐT & Địa Chỉ</th>
                    <th className="p-3">Bác Sĩ & Loại Phiếu</th>
                    <th className="p-3 text-center">Số Chỉ Số</th>
                    <th className="p-3">Trạng Thái</th>
                    <th className="p-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {filteredReports.map((rep, idx) => {
                    const isAllergen = rep.isAllergen;
                    return (
                      <tr key={rep.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>

                        {/* Mã phiếu & Ngày giờ */}
                        <td className="p-3">
                          <span className="font-mono font-bold text-sky-400 block">{rep.code}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {new Date(rep.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </td>

                        {/* Bệnh nhân */}
                        <td className="p-3">
                          <strong className="text-white text-xs block uppercase font-bold">
                            {rep.patient.name || '---'}
                          </strong>
                          <span className="text-[11px] text-slate-400">
                            {rep.patient.dob || '---'} • {rep.patient.gender}
                          </span>
                        </td>

                        {/* Số ĐT & Địa chỉ */}
                        <td className="p-3 max-w-[180px]">
                          <span className="font-mono text-slate-300 block">{rep.patient.phone || '---'}</span>
                          <span className="text-[10.5px] text-slate-400 truncate block mt-0.5" title={rep.patient.address}>
                            {rep.patient.address || 'Quảng Bình'}
                          </span>
                        </td>

                        {/* Bác sĩ & Loại phiếu */}
                        <td className="p-3">
                          <span className="font-semibold text-slate-200 block">{rep.doctorName || 'BS. Trần Hoài Long'}</span>
                          <span
                            className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded mt-1 ${
                              isAllergen
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {isAllergen ? 'Panel Dị Nguyên' : 'Xét Nghiệm Thường'}
                          </span>
                        </td>

                        {/* Số lượng chỉ số */}
                        <td className="p-3 text-center font-mono font-bold text-slate-300">
                          {rep.testCount || rep.selectedTests.length}
                        </td>

                        {/* Trạng thái */}
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              rep.status === 'Đã trả kết quả'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : rep.status === 'Đã xuất Cloud'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : rep.status === 'Đã có kết quả'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {rep.status}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Nút Xem trước */}
                            <button
                              type="button"
                              onClick={() => onPreviewReport(rep)}
                              className="p-1.5 bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white rounded-lg transition"
                              title="Xem trước mẫu in A4"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Nạp lại lên Form */}
                            <button
                              type="button"
                              onClick={() => onLoadReport(rep)}
                              className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg transition"
                              title="Nạp phiếu này lên màn hình làm việc"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Nhân bản danh mục */}
                            <button
                              type="button"
                              onClick={() => onDuplicateReport(rep)}
                              className="p-1.5 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg transition"
                              title="Nhân bản danh mục chỉ số cho bệnh nhân mới"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Gửi Zalo */}
                            {onOpenSendZaloModal && (
                              <button
                                type="button"
                                onClick={() => onOpenSendZaloModal(rep)}
                                className="p-1.5 bg-slate-800 hover:bg-[#0068FF] text-slate-300 hover:text-white rounded-lg transition"
                                title="Gửi kết quả qua Zalo cho bệnh nhân"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Nút Tải QR Code */}
                            {rep.qrCodeDataUrl && (
                              <button
                                type="button"
                                onClick={() => handleDownloadQr(rep)}
                                className="p-1.5 bg-slate-800 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg transition"
                                title="Tải ảnh QR Code tra cứu kết quả"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Nút Xóa phiếu */}
                            <button
                              type="button"
                              onClick={() => onDeleteReport(rep.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition"
                              title="Xóa phiếu này khỏi Sổ lưu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER MODAL */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0 text-xs text-slate-400">
          <div>
            Hiển thị <strong className="text-white font-mono">{filteredReports.length}</strong> / {reports.length} hồ sơ phiếu xét nghiệm
          </div>

          <div className="flex items-center space-x-3">
            {reports.length > 0 && (
              <button
                type="button"
                onClick={onClearAllReports}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl font-bold transition"
              >
                Xóa Toàn Bộ Sổ Lưu
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
