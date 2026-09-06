'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  AlertCircle,
  Download,
  Share2,
  ShieldCheck,
  Building2,
  Phone,
  Globe,
  AlertTriangle,
  History,
  X,
  Stethoscope,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Check,
  FileCheck,
  CheckCircle2,
  Clock,
  CreditCard
} from 'lucide-react';
import { PortalClinicData, PortalReportData, PortalTestItem, RecentLookupItem } from '../types';
import TestResultGauge from './TestResultGauge';
import { generateQrCodeDataUrl, downloadQrCodeImage } from '@infra/qrService';

const RECENT_KEY = 'golab_recent_lookups';

// Regex lọc bỏ các trường hành chính bị lẫn vào bảng xét nghiệm khi import Excel
const ADMIN_FIELD_REGEX = /^(giới\s*tính|gender|sex|số\s*điện\s*thoại|sđt|phone|tel|địa\s*chỉ|address|công\s*ty|company|bác\s*sĩ|bs\s*chỉ\s*định|doctor|họ\s*và\s*tên|họ\s*tên|patient\s*name|năm\s*sinh|ngày\s*sinh|dob|tuổi|age|ghi\s*chú\s*chung)/i;

export default function PatientPortalView() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || searchParams.get('sample') || '';

  const [searchCode, setSearchCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PortalReportData | null>(null);
  const [clinic, setClinic] = useState<PortalClinicData | null>(null);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showAbnormalOnly, setShowAbnormalOnly] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);

  // Lịch sử tra cứu gần đây trên thiết bị (LocalStorage)
  const [recentLookups, setRecentLookups] = useState<RecentLookupItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) {
        setRecentLookups(JSON.parse(saved));
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  // Tự động tạo mã QR khi có báo cáo:
  // Theo quy chuẩn GoLab: Mã QR trên màn hình tra cứu online ("phiếu này") phải trỏ trực tiếp tới Cloud PDF chính thức
  useEffect(() => {
    if (report?.cloudPdfUrl) {
      generateQrCodeDataUrl(report.cloudPdfUrl).then(setQrDataUrl);
    } else if (typeof window !== 'undefined' && report?.code) {
      // Fallback nếu phiếu chưa xuất bản lên Cloud: trỏ về cổng tra cứu
      const fullUrl = `${window.location.origin}/portal?code=${encodeURIComponent(report.code)}`;
      generateQrCodeDataUrl(fullUrl).then(setQrDataUrl);
    } else {
      setQrDataUrl('');
    }
  }, [report?.code, report?.cloudPdfUrl]);

  const saveRecent = (rep: PortalReportData) => {
    try {
      const item: RecentLookupItem = {
        code: rep.code,
        patientName: rep.patientName,
        date: rep.createdAt ? new Date(rep.createdAt).toLocaleDateString('vi-VN') : '',
        testCount: rep.tests.length
      };

      setRecentLookups((prev) => {
        const filtered = prev.filter((p) => p.code.toUpperCase() !== rep.code.toUpperCase());
        const updated = [item, ...filtered].slice(0, 5);
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Storage unavailable
    }
  };

  const removeRecent = (codeToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = recentLookups.filter((r) => r.code !== codeToRemove);
      setRecentLookups(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // Storage unavailable
    }
  };

  const fetchLookup = async (codeToSearch: string) => {
    const trimmed = codeToSearch.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/tra-cuu?code=${encodeURIComponent(trimmed)}&sample=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (data.found && data.report) {
        const rawReport: PortalReportData = data.report;

        // Tinh lọc dữ liệu: Bóc tách các trường hành chính bị lẫn vào test
        let extractedGender = rawReport.patientGender;
        let extractedDoctor = rawReport.doctorName;
        let extractedAddress = rawReport.patientAddress;

        const cleanTests: PortalTestItem[] = [];
        for (const t of rawReport.tests || []) {
          const name = (t.testName || '').trim();
          const code = (t.testCode || '').trim();

          if (ADMIN_FIELD_REGEX.test(name) || ADMIN_FIELD_REGEX.test(code)) {
            if (/giới\s*tính|gender|sex/i.test(name) && !extractedGender) {
              extractedGender = t.result;
            }
            if (/bác\s*sĩ|bs/i.test(name) && !extractedDoctor) {
              extractedDoctor = t.result;
            }
            if (/địa\s*chỉ|address|công\s*ty/i.test(name) && !extractedAddress) {
              extractedAddress = t.result;
            }
          } else {
            cleanTests.push(t);
          }
        }

        const cleanedReport: PortalReportData = {
          ...rawReport,
          patientGender: extractedGender,
          doctorName: extractedDoctor,
          patientAddress: extractedAddress,
          tests: cleanTests
        };

        setReport(cleanedReport);
        if (data.clinic) setClinic(data.clinic);
        saveRecent(cleanedReport);
        setActiveCategory('all');
        setShowAbnormalOnly(false);

        // Cập nhật URL trình duyệt không reload
        const url = new URL(window.location.href);
        url.searchParams.set('code', trimmed);
        window.history.replaceState({}, '', url.toString());
      } else {
        setReport(null);
        setError(data.message || 'Không tìm thấy phiếu xét nghiệm phù hợp với mã bạn vừa nhập.');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchLookup(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLookup(searchCode);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (qrDataUrl && report?.code) {
      const filename = report.cloudPdfUrl ? `QR_CloudPDF_${report.code}.png` : `QR_TraCuu_${report.code}.png`;
      downloadQrCodeImage(qrDataUrl, filename);
    }
  };

  // Danh sách các chuyên khoa xét nghiệm
  const categories = useMemo(() => {
    if (!report?.tests) return [];
    const set = new Set<string>();
    report.tests.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [report]);

  // Bộ lọc kết quả
  const filteredTests = useMemo(() => {
    if (!report?.tests) return [];
    return report.tests.filter((t) => {
      const matchCat = activeCategory === 'all' || (t.category || 'Xét nghiệm chung') === activeCategory;
      const matchAbnormal = !showAbnormalOnly || t.evaluation === 'ABNORMAL';
      return matchCat && matchAbnormal;
    });
  }, [report, activeCategory, showAbnormalOnly]);

  // Thống kê lâm sàng
  const stats = useMemo(() => {
    if (!report?.tests) return { total: 0, abnormal: 0, normal: 0 };
    const total = report.tests.length;
    const abnormal = report.tests.filter((t) => t.evaluation === 'ABNORMAL').length;
    return {
      total,
      abnormal,
      normal: total - abnormal
    };
  }, [report]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* ── HEADER PHÒNG KHÁM (PHÔNG TRẮNG - XANH LÁ) ── */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 font-black text-sm tracking-wider">
              GL
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                {clinic?.name || 'HỆ THỐNG XÉT NGHIỆM Y KHOA GOLAB'}
              </h1>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Cổng Bệnh Nhân Trực Tuyến
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {clinic?.phone && (
              <a
                href={`tel:${clinic.phone.replace(/[^\d+]/g, '')}`}
                className="flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition font-medium"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Hotline:</span>
                <span className="font-bold font-mono">{clinic.phone}</span>
              </a>
            )}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bảo mật</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── NỘI DUNG CHÍNH (MOBILE-FIRST TRẮNG - XANH LÁ - ĐỎ) ── */}
      <main className="max-w-4xl w-full mx-auto px-4 py-5 sm:py-8 flex-1 space-y-6">
        
        {/* KHỐI TÌM KIẾM BỆNH NHÂN */}
        <section className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="text-center space-y-1 mb-4">
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Tra Cứu Kết Quả Xét Nghiệm
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Nhập mã bệnh nhân hoặc mã mẫu trên phiếu tiếp nhận để xem ngay kết quả
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nhập mã phiếu (Ví dụ: BN-01, GOLAB-14636...)"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-2xl pl-12 pr-10 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
              />
              {searchCode && (
                <button
                  type="button"
                  onClick={() => setSearchCode('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                  title="Xóa mã tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !searchCode.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Tra Cứu</span>
                </>
              )}
            </button>
          </form>

          {/* Lịch sử tra cứu gần đây trên thiết bị */}
          {recentLookups.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold">
                <History className="w-3.5 h-3.5 text-emerald-600" />
                Đã tra cứu gần đây:
              </span>
              {recentLookups.map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    setSearchCode(item.code);
                    fetchLookup(item.code);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 transition text-[11px] font-mono group"
                >
                  <span className="font-bold">{item.code}</span>
                  <span className="text-slate-500 max-w-[120px] truncate">{item.patientName}</span>
                  <X
                    className="w-3 h-3 text-slate-400 hover:text-red-600 transition"
                    onClick={(e) => removeRecent(item.code, e)}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* THÔNG BÁO LỖI (ĐỎ RÕ RÀNG) */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Không tìm thấy kết quả</p>
              <p className="text-xs text-red-600/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* KHI CÓ KẾT QUẢ XÉT NGHIỆM */}
        {report && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* 1. THẺ HỒ SƠ BỆNH NHÂN (PHÔNG TRẮNG - VIỀN XANH LÁ) */}
            <div className="bg-white border-2 border-emerald-500/20 rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                {/* Tên bệnh nhân & huy hiệu xác thực */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Mã BN: {report.code}
                    </span>
                    {report.sampleCode && report.sampleCode !== report.code && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200">
                        Mã mẫu: {report.sampleCode}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
                      <FileCheck className="w-3.5 h-3.5" />
                      Đã có kết quả chính thức
                    </span>

                    {/* Huy hiệu Trạng thái thanh toán (Xanh lá nếu Đã thanh toán, Vàng/Cam nếu Chưa thanh toán) */}
                    {report.isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ĐÃ THANH TOÁN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300 shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {report.paymentStatus || 'CHƯA THANH TOÁN'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {report.patientName}
                  </h3>
                </div>

                {/* Các nút hành động: Gắn QR, Tải PDF, Chia sẻ (Không in phiếu) */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  {/* Nút xem QR Code (Xanh lá) */}
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                    title={report.cloudPdfUrl ? 'Mở mã QR liên kết file PDF gốc trên Cloud' : 'Mở mã QR hồ sơ bệnh nhân'}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{report.cloudPdfUrl ? 'Mã QR Bản PDF' : 'Mã QR Tra Cứu'}</span>
                  </button>

                  {/* Nút tải PDF gốc */}
                  {report.cloudPdfUrl && (
                    <a
                      href={report.cloudPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition active:scale-95"
                      title="Tải tệp tin PDF gốc có dấu mộc"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span className="hidden sm:inline">Tải PDF</span>
                    </a>
                  )}

                  {/* Nút chia sẻ / sao chép link */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition active:scale-95 cursor-pointer"
                    title="Sao chép liên kết phiếu kết quả"
                  >
                    <Share2 className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">{copied ? 'Đã sao chép!' : 'Chia sẻ'}</span>
                  </button>
                </div>
              </div>

              {/* Thông tin nhân khẩu học */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] mb-0.5 font-medium">Năm sinh / Tuổi:</span>
                  <span className="font-bold text-slate-900 text-sm">{report.patientDob || '---'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] mb-0.5 font-medium">Giới tính:</span>
                  <span className="font-bold text-slate-900 text-sm">{report.patientGender || '---'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] mb-0.5 font-medium">Bác sĩ chỉ định / Ký:</span>
                  <span className="font-bold text-slate-900 text-sm truncate block">{report.doctorName || '---'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] mb-0.5 font-medium">Thời gian thực hiện:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {report.createdAt ? new Date(report.createdAt).toLocaleDateString('vi-VN') : '---'}
                  </span>
                </div>
              </div>

              {/* Địa chỉ & Chẩn đoán nếu có */}
              {(report.patientAddress || report.patientDiagnosis) && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {report.patientAddress && (
                    <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-700 truncate">{report.patientAddress}</span>
                    </div>
                  )}
                  {report.patientDiagnosis && (
                    <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-slate-800 truncate font-semibold">Chẩn đoán: {report.patientDiagnosis}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Khối Chi tiết Viện phí & Trạng thái thanh toán */}
              <div className={`mt-3 p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                report.isPaid
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-amber-50/70 border-amber-200'
              }`}>
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                    report.isPaid
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-amber-500 text-white shadow-xs'
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Trạng thái thanh toán:
                      </span>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        report.isPaid
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {report.isPaid ? 'ĐÃ THANH TOÁN ✓' : (report.paymentStatus || 'CHƯA THANH TOÁN')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {report.isPaid ? (
                        <>
                          {report.paymentMethod && <span>Hình thức: <strong className="text-slate-800">{report.paymentMethod}</strong> • </span>}
                          {report.paidAt ? (
                            <span>Ngày thu: <strong className="text-slate-800">{new Date(report.paidAt).toLocaleDateString('vi-VN')}</strong></span>
                          ) : (
                            <span>Đã hoàn tất thanh toán viện phí</span>
                          )}
                          {report.invoiceCode && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-white/80 rounded border border-emerald-200 text-[11px] font-mono text-emerald-800">
                              HĐ: {report.invoiceCode}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-amber-800 font-medium">
                          Phiếu chưa ghi nhận hoàn tất thu phí. Quý khách vui lòng liên hệ quầy thu ngân để hoàn tất.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Tổng tiền viện phí nếu có */}
                {report.paymentAmount !== undefined && report.paymentAmount !== null && report.paymentAmount > 0 && (
                  <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-2 sm:pt-0 sm:pl-4 flex sm:flex-col justify-between items-center sm:items-end">
                    <span className="text-[11px] text-slate-500 font-medium">Tổng viện phí</span>
                    <span className={`text-base sm:text-lg font-black font-mono ${
                      report.isPaid ? 'text-emerald-700' : 'text-amber-900'
                    }`}>
                      {new Intl.NumberFormat('vi-VN').format(report.paymentAmount)} đ
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. TỔNG QUAN KẾT QUẢ & BỘ LỌC CHUYÊN KHOA */}
            <div className="space-y-3">
              {/* Thẻ tóm tắt lâm sàng (Executive Summary) */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
                  <span className="text-[11px] text-slate-500 block font-medium">Tổng số chỉ số</span>
                  <span className="text-lg sm:text-2xl font-black text-slate-900 font-mono">{stats.total}</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 shadow-xs">
                  <span className="text-[11px] text-emerald-800 block font-bold">Trong giới hạn chuẩn</span>
                  <span className="text-lg sm:text-2xl font-black text-emerald-700 font-mono">{stats.normal}</span>
                </div>

                <div className={`border rounded-2xl p-3 shadow-xs transition-colors ${
                  stats.abnormal > 0 ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                }`}>
                  <span className={`text-[11px] block font-bold ${stats.abnormal > 0 ? 'text-red-700' : 'text-slate-500'}`}>
                    Cần lưu ý / Bất thường
                  </span>
                  <span className={`text-lg sm:text-2xl font-black font-mono ${stats.abnormal > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {stats.abnormal}
                  </span>
                </div>
              </div>

              {/* Tabs lọc chuyên khoa & nút xem chỉ số bất thường */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                {/* Nhóm chuyên khoa */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      activeCategory === 'all'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    Tất cả ({report.tests.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        activeCategory === cat
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Toggle bất thường (Đỏ) */}
                {stats.abnormal > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAbnormalOnly(!showAbnormalOnly)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                      showAbnormalOnly
                        ? 'bg-red-600 text-white border-red-500 shadow-sm'
                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>Chỉ xem {stats.abnormal} chỉ số vượt ngưỡng</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. DANH SÁCH CHỈ SỐ XÉT NGHIỆM MOBILE-FIRST (THẺ TRẮNG - CHỈ SỐ BẤT THƯỜNG ĐỎ RÕ RÀNG) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-bold">
                <span className="uppercase tracking-wide">KẾT QUẢ XÉT NGHIỆM CHI TIẾT ({filteredTests.length})</span>
                <span className="text-[11px] text-slate-400">Xem mức độ tham chiếu</span>
              </div>

              {filteredTests.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
                  Không có chỉ số nào phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredTests.map((t, idx) => {
                    const isAbnormal = t.evaluation === 'ABNORMAL';
                    const numVal = parseFloat(t.result.replace(/,/g, '.').replace(/[^\d.-]/g, ''));
                    const isLow = !isNaN(numVal) && t.refMin !== null && numVal < t.refMin;
                    const isHigh = !isNaN(numVal) && t.refMax !== null && numVal > t.refMax;

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                          isAbnormal
                            ? 'bg-red-50/40 border-2 border-red-300 shadow-xs'
                            : 'bg-white border border-slate-200 shadow-xs hover:border-emerald-300'
                        }`}
                      >
                        {/* Dòng tiêu đề chỉ số + Huy hiệu đánh giá */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                              {t.testName}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                              <span className="font-mono font-bold text-emerald-700">{t.testCode}</span>
                              {t.category && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-500">{t.category}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Huy hiệu đánh giá: Đỏ nếu bất thường, Xanh lá nếu trong giới hạn */}
                          <div>
                            {isAbnormal ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white shadow-xs">
                                {isHigh ? (
                                  <>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    <span>VƯỢT NGƯỠNG</span>
                                  </>
                                ) : isLow ? (
                                  <>
                                    <ArrowDownRight className="w-3.5 h-3.5" />
                                    <span>DƯỚI NGƯỠNG</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>BẤT THƯỜNG</span>
                                  </>
                                )}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>TRONG GIỚI HẠN</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Giá trị kết quả to rõ: Màu đỏ nếu bất thường, màu đen/slate nếu bình thường */}
                        <div className="flex items-baseline gap-2 my-2.5">
                          <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                            isAbnormal ? 'text-red-600' : 'text-slate-900'
                          }`}>
                            {t.result || '---'}
                          </span>
                          {t.unit && (
                            <span className={`text-sm font-semibold ${isAbnormal ? 'text-red-800' : 'text-slate-500'}`}>
                              {t.unit}
                            </span>
                          )}
                          {t.note && (
                            <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-md ${
                              isAbnormal ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {t.note}
                            </span>
                          )}
                        </div>

                        {/* Thước đo trực quan (Gauge Bar) chiếm toàn chiều ngang card */}
                        <div className="pt-2 border-t border-slate-100">
                          <TestResultGauge test={t} />

                          {/* Khoảng tham chiếu văn bản */}
                          {t.refText && (
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                              <span>Khoảng tham chiếu an toàn:</span>
                              <span className="font-mono text-slate-700 font-bold">{t.refText} {t.unit}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. KẾT LUẬN & DẶN DÒ CỦA BÁC SĨ (VIỀN XANH LÁ) */}
            {report.conclusion && (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
                <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm mb-3">
                  <Stethoscope className="w-5 h-5 text-emerald-700" />
                  <span className="uppercase tracking-wide">KẾT LUẬN &amp; TƯ VẤN CỦA BÁC SĨ CHUYÊN KHOA</span>
                </div>

                <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium pl-1">
                  {report.conclusion}
                </div>

                {report.doctorName && (
                  <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Bác sĩ phụ trách chuyên môn:</span>
                    <span className="font-bold text-slate-900 text-sm">{report.doctorName}</span>
                  </div>
                )}
              </div>
            )}

            {/* 5. LIÊN HỆ PHÒNG KHÁM & HỖ TRỢ BỆNH NHÂN */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{clinic?.name || 'Hệ Thống Phòng Xét Nghiệm GoLab'}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{clinic?.address || 'Quảng Trị'}</p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {clinic?.phone && (
                  <a
                    href={`tel:${clinic.phone.replace(/[^\d+]/g, '')}`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition active:scale-95"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Gọi Bác Sĩ Tư Vấn</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchCode('');
                    setReport(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition"
                >
                  Tra cứu mã khác
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ── MODAL MÃ QR TOÀN MÀN HÌNH (TRẮNG - XANH LÁ) ── */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span className="font-extrabold text-sm text-slate-900">
                  {report?.cloudPdfUrl ? 'Mã QR Tải Phiếu PDF Gốc (Cloud)' : 'Mã QR Tra Cứu Kết Quả'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrDataUrl ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                  <img src={qrDataUrl} alt="Mã QR Phiếu" className="w-52 h-52 object-contain" />
                </div>
                <p className="font-mono text-xs font-bold text-emerald-700 mt-3">
                  Mã hồ sơ: {report?.code}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[240px]">
                  {report?.cloudPdfUrl
                    ? 'Quét mã để xem hoặc tải trực tiếp bản tệp PDF gốc có dấu mộc lưu trữ trên Cloud'
                    : 'Quét mã bằng Camera điện thoại hoặc Zalo để mở ngay phiếu kết quả trực tuyến'}
                </p>
              </div>
            ) : (
              <div className="py-10 text-slate-400 text-xs">Đang khởi tạo mã QR...</div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Lưu Ảnh QR</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition active:scale-95 cursor-pointer"
              >
                {copied ? 'Đã chép link!' : 'Chép Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER CHUYÊN NGHIỆP ── */}
      <footer className="border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{clinic?.name || 'Hệ Thống Xét Nghiệm Y Khoa GoLab'}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            {clinic?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" /> {clinic.phone}
              </span>
            )}
            {clinic?.website && (
              <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-emerald-700 transition">
                <Globe className="w-3 h-3 text-emerald-600" /> {clinic.website}
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
