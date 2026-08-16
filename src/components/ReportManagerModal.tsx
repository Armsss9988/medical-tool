import React, { useState, useMemo } from 'react';
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
  AlertCircle 
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

      // Lọc theo ngày
      const repDate = new Date(rep.createdAt);
      if (dateFilter === 'TODAY' && repDate.toDateString() !== todayStr) {
        return false;
      }
      if (dateFilter === 'YESTERDAY' && repDate.toDateString() !== yesterdayStr) {
        return false;
      }
      if (dateFilter === 'LAST_7_DAYS' && repDate < sevenDaysAgo) {
        return false;
      }
      if (dateFilter === 'THIS_MONTH') {
        if (repDate.getMonth() !== now.getMonth() || repDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      // Lọc theo Bác sĩ
      if (selectedDoctor !== 'ALL' && rep.doctorName !== selectedDoctor) {
        return false;
      }

      // Lọc theo Loại phiếu
      if (selectedType === 'STANDARD' && rep.isAllergen) {
        return false;
      }
      if (selectedType === 'ALLERGEN' && !rep.isAllergen) {
        return false;
      }

      // Lọc theo Trạng thái
      if (selectedStatus !== 'ALL' && rep.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [reports, searchTerm, dateFilter, selectedDoctor, selectedType, selectedStatus]);

  // 3. Xử lý xuất Excel
  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      showToast('Không có dữ liệu phiếu để xuất Excel!', 'info');
      return;
    }
    try {
      exportReportsExcel(filteredReports);
      showToast(`Đã xuất file Excel cho ${filteredReports.length} phiếu xét nghiệm!`, 'success');
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      showToast('Có lỗi xảy ra khi tạo file Excel!', 'error');
    }
  };

  // 4. Tải trực tiếp mã QR
  const handleDownloadQr = (rep: MedicalReport) => {
    if (!rep.qrCodeDataUrl) {
      showToast('Phiếu này chưa được tạo mã QR!', 'info');
      return;
    }
    const safeName = (rep.patient.name || 'BenhNhan').replace(/\s+/g, '_');
    const qrFilename = `QRCode_PhieuKham_${safeName}_${rep.code}.png`;
    downloadDataUrlAsImage(rep.qrCodeDataUrl, qrFilename);
    showToast('Đã tải ảnh mã QR Code về máy!', 'success');
  };

  // 5. Xóa an toàn
  const handleDelete = (id: string, code: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phiếu của bệnh nhân ${name} (Mã: ${code}) khỏi sổ lưu?`)) {
      onDeleteReport(id);
      showToast(`Đã xóa phiếu ${code}!`, 'info');
    }
  };

  // 6. Xóa toàn bộ
  const handleClearAll = () => {
    if (window.confirm('CẢNH BÁO: Thao tác này sẽ xóa toàn bộ lịch sử các phiếu xét nghiệm đã lưu trong sổ. Bạn có chắc chắn không?')) {
      onClearAllReports();
      showToast('Đã xóa toàn bộ lịch sử phiếu xét nghiệm!', 'info');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-bold border border-sky-400/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm md:text-base tracking-tight flex items-center gap-2">
                Sổ Quản Lý & Lưu Trữ Phiếu Xét Nghiệm
                <span className="text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  {filteredReports.length} / {reports.length} phiếu
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Tra cứu, nạp lại dữ liệu, in lại phiếu A4 hoặc xuất báo cáo Excel
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              disabled={filteredReports.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold shadow transition-all active:scale-95"
              title="Xuất danh sách phiếu ra file Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-5 overflow-y-auto flex-grow text-xs space-y-4 bg-slate-50/50">
          
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Tổng Số Phiếu</span>
                <span className="text-xl font-black font-mono text-slate-900">{stats.total}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white border border-sky-100 rounded-xl p-3 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-sky-600 uppercase block">Hôm Nay</span>
                <span className="text-xl font-black font-mono text-sky-900">{stats.today}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white border border-purple-100 rounded-xl p-3 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-purple-600 uppercase block">Panel Dị Nguyên</span>
                <span className="text-xl font-black font-mono text-purple-900">{stats.allergen}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white border border-emerald-100 rounded-xl p-3 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase block">Đã Lưu Cloud</span>
                <span className="text-xl font-black font-mono text-emerald-900">{stats.cloud}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Cloud className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Search & Filters Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3">
            {/* Live Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm nhanh theo Họ tên, Mã BN, Số bệnh phẩm, SĐT, Chẩn đoán hoặc Kết luận..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 rounded-xl text-slate-900 font-semibold focus:outline-none transition-all text-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
              {/* Date Filter Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-slate-400 font-bold mr-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Ngày:
                </span>
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'TODAY', label: 'Hôm nay' },
                  { key: 'YESTERDAY', label: 'Hôm qua' },
                  { key: 'LAST_7_DAYS', label: '7 ngày qua' },
                  { key: 'THIS_MONTH', label: 'Tháng này' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setDateFilter(item.key as DateFilterType)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      dateFilter === item.key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Doctor Filter */}
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">-- Tất cả Bác sĩ --</option>
                  {doctorsList.map((doc, idx) => (
                    <option key={`${doc.id || 'doc'}-${idx}`} value={doc.name}>
                      {doc.name}
                    </option>
                  ))}
                </select>

                {/* Type Filter */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as 'ALL' | 'STANDARD' | 'ALLERGEN')}
                  className="bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">-- Tất cả loại phiếu --</option>
                  <option value="STANDARD">Xét nghiệm chuẩn A4</option>
                  <option value="ALLERGEN">Panel Dị Nguyên 91</option>
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">-- Tất cả trạng thái --</option>
                  <option value="Đã xuất Cloud">Đã xuất Cloud</option>
                  <option value="Đã có kết quả">Đã có kết quả</option>
                  <option value="Chờ xét nghiệm">Chờ xét nghiệm</option>
                  <option value="Đã trả kết quả">Đã trả kết quả</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-800 text-white font-bold">
                  <tr>
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3">Mã BN & Bệnh Phẩm</th>
                    <th className="p-3">Bệnh Nhân</th>
                    <th className="p-3">Chỉ Số / Loại Phiếu</th>
                    <th className="p-3">Bác Sĩ Chỉ Định</th>
                    <th className="p-3">Trạng Thái</th>
                    <th className="p-3">Thời Gian</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <AlertCircle className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-500">
                            {reports.length === 0
                              ? 'Chưa có phiếu xét nghiệm nào được lưu trong sổ.'
                              : 'Không tìm thấy phiếu nào phù hợp với bộ lọc hiện tại.'}
                          </p>
                          {searchTerm && (
                            <button
                              onClick={() => {
                                setSearchTerm('');
                                setDateFilter('ALL');
                                setSelectedDoctor('ALL');
                                setSelectedType('ALL');
                                setSelectedStatus('ALL');
                              }}
                              className="text-sky-600 hover:underline font-bold text-xs"
                            >
                              Xóa bộ lọc để xem tất cả
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((rep, idx) => (
                      <tr key={rep.id} className="hover:bg-slate-50 transition-colors group">
                        {/* STT */}
                        <td className="p-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>

                        {/* Mã BN & Số bệnh phẩm */}
                        <td className="p-3">
                          <div className="font-mono font-bold text-rose-600 text-xs">{rep.code}</div>
                          {rep.sampleCode && rep.sampleCode !== rep.code && (
                            <div className="font-mono text-[10.5px] text-slate-500">BP: {rep.sampleCode}</div>
                          )}
                        </td>

                        {/* Bệnh Nhân */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{rep.patient.name || '---'}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium">{rep.patient.gender}</span>
                            <span>•</span>
                            <span>{rep.patient.dob || '---'}</span>
                            {rep.patient.phone && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-600">{rep.patient.phone}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Chỉ Số / Loại Phiếu */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {rep.isAllergen ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                                Panel Dị Nguyên 91
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                {rep.testCount || rep.selectedTests.length} chỉ số
                              </span>
                            )}
                          </div>
                          {rep.conclusion && (
                            <p className="text-[10.5px] text-slate-500 truncate max-w-[200px] mt-0.5" title={rep.conclusion}>
                              KL: {rep.conclusion}
                            </p>
                          )}
                        </td>

                        {/* Bác Sĩ Chỉ Định */}
                        <td className="p-3">
                          <span className="font-semibold text-slate-700">{rep.doctorName || '---'}</span>
                        </td>

                        {/* Trạng Thái & Cloud Link */}
                        <td className="p-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                rep.status === 'Đã xuất Cloud'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : rep.status === 'Đã có kết quả'
                                  ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {rep.status}
                            </span>
                            {rep.cloudPdfUrl && (
                              <a
                                href={rep.cloudPdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10.5px] text-sky-600 hover:text-sky-800 font-medium inline-flex items-center gap-1 underline"
                                title="Mở file PDF trên Cloud"
                              >
                                <Cloud className="w-3 h-3 text-sky-500" />
                                <span>PDF Cloud</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Thời Gian */}
                        <td className="p-3 text-slate-500 whitespace-nowrap text-[11px]">
                          <div>{new Date(rep.createdAt).toLocaleDateString('vi-VN')}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(rep.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Thao Tác Action Buttons */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            {/* Nạp lại vào màn hình chính */}
                            <button
                              onClick={() => {
                                onLoadReport(rep);
                                onClose();
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 rounded-lg transition-colors"
                              title="Nạp lại vào màn hình chính để sửa / cập nhật"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>

                            {/* Xem trước & In */}
                            <button
                              onClick={() => onPreviewReport(rep)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition-colors"
                              title="Mở màn hình xem trước & in ấn"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Tải QR Code */}
                            {rep.qrCodeDataUrl && (
                              <button
                                onClick={() => handleDownloadQr(rep)}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-900 rounded-lg transition-colors"
                                title="Tải ảnh mã QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                            )}

                            {/* Nhân bản phiếu */}
                            <button
                              onClick={() => onDuplicateReport(rep)}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 rounded-lg transition-colors"
                              title="Nhân bản tạo phiếu mới cho bệnh nhân này"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {/* Xóa phiếu */}
                            <button
                              onClick={() => handleDelete(rep.id, rep.code, rep.patient.name)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                              title="Xóa phiếu khỏi sổ lưu"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {reports.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition-all text-xs flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Sạch Lịch Sử Sổ Lưu</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all active:scale-95"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
