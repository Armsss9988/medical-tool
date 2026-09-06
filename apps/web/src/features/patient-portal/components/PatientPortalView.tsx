'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  AlertCircle,
  Download,
  Share2,
  Building2,
  Phone,
  Globe,
  AlertTriangle,
  History,
  X,
  Stethoscope,
  QrCode,
  MapPin,
  Check,
  FileCheck,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { PortalClinicData, PortalReportData, PortalTestItem, RecentLookupItem } from '../types';
import TestResultGauge from './TestResultGauge';
import { generateQrCodeDataUrl, downloadQrCodeImage } from '@infra/qrService';

const RECENT_KEY = 'golab_recent_lookups';

// Regex lọc bỏ các trường hành chính bị lẫn vào bảng xét nghiệm khi import Excel
const ADMIN_FIELD_REGEX = /^(giới\s*tính|gender|sex|số\s*điện\s*thoại|sđt|phone|tel|địa\s*chỉ|address|công\s*ty|company|bác\s*sĩ|bs\s*chỉ\s*định|doctor|họ\s*và\s*tên|họ\s*tên|patient\s*name|năm\s*sinh|ngày\s*sinh|dob|tuổi|age|ghi\s*chú\s*chung)/i;

const isPhoneNumber = (val?: string | null) => Boolean(val && /^(0|\+84)\d{8,11}$/.test(val.replace(/[\s.-]/g, '')));

// Tính toán tuổi hiển thị tự nhiên (ví dụ: "06/01/2022 (4 tuổi)" hoặc "1988 (38 tuổi)")
function formatPatientAge(dob?: string, reportDate?: string): string {
  if (!dob) return '---';
  const yearMatch = dob.match(/\b(19\d{2}|20\d{2})\b/);
  if (!yearMatch) return dob;
  const birthYear = parseInt(yearMatch[1], 10);
  const refYear = reportDate ? new Date(reportDate).getFullYear() : new Date().getFullYear();
  const age = refYear - birthYear;
  if (age >= 0 && age <= 125) {
    return `${dob} (${age} tuổi)`;
  }
  return dob;
}

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
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);

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
        setIsSearchDrawerOpen(false);

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
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col justify-between font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* ── HEADER PHÒNG KHÁM CHUẨN Y KHOA ── */}
      <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-2xs">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Logo & Tên Phòng Khám - Đảm bảo hiển thị đầy đủ, không bị cắt cụt */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xs font-black text-xs sm:text-sm tracking-wider shrink-0">
              GL
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-tight line-clamp-2">
                {clinic?.name || 'TRUNG TÂM XÉT NGHIỆM Y KHOA GOLAB'}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Cổng Tra Cứu Kết Quả Điện Tử</span>
              </p>
            </div>
          </div>

          {/* Nhóm nút tác vụ Header */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {report && (
              <button
                type="button"
                onClick={() => setIsSearchDrawerOpen(!isSearchDrawerOpen)}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-xl text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 transition cursor-pointer"
                title="Tra cứu mã phiếu khác"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tra mã</span>
                {isSearchDrawerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {clinic?.phone && (
              <a
                href={`tel:${clinic.phone.replace(/[^\d+]/g, '')}`}
                className="flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-2 sm:px-3 sm:py-1.5 rounded-xl transition font-medium shadow-2xs"
                title={`Hotline tư vấn: ${clinic.phone}`}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Hotline:</span>
                <span className="hidden sm:inline font-bold font-mono text-[11px] sm:text-xs">{clinic.phone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Khung tìm kiếm trượt xuống khi bấm Tra Mã Khác trên Header */}
        {report && isSearchDrawerOpen && (
          <div className="border-t border-slate-100 bg-slate-50/95 px-3.5 sm:px-6 py-3 animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Nhập mã bệnh nhân mới (VD: BN-20260905-001)..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    autoFocus
                  />
                  {searchCode && (
                    <button
                      type="button"
                      onClick={() => setSearchCode('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !searchCode.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Đang tìm...' : 'Tra Cứu'}
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* ── NỘI DUNG CHÍNH ── */}
      <main className="max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 flex-1 space-y-4 sm:space-y-5">
        
        {/* KHỐI TÌM KIẾM HERO (CHỈ HIỂN THỊ KHI CHƯA CÓ KẾT QUẢ) */}
        {!report && (
          <section className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-sm text-center max-w-xl mx-auto my-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Tra Cứu Kết Quả Xét Nghiệm
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Nhập mã bệnh nhân (Ví dụ: <strong className="font-mono text-emerald-700 font-bold">BN-20260905-001</strong>) hoặc mã mẫu ghi trên phiếu tiếp nhận
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nhập mã bệnh nhân hoặc mã mẫu..."
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl pl-10 pr-9 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                  autoFocus
                />
                {searchCode && (
                  <button
                    type="button"
                    onClick={() => setSearchCode('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !searchCode.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang tìm...</span>
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
              <div className="pt-3 border-t border-slate-100 text-left">
                <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mb-2">
                  <History className="w-3.5 h-3.5 text-emerald-600" />
                  Đã tra cứu gần đây trên máy:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recentLookups.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setSearchCode(item.code);
                        fetchLookup(item.code);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 transition text-xs font-mono group cursor-pointer"
                    >
                      <span className="font-bold">{item.code}</span>
                      <span className="text-slate-500 max-w-[100px] truncate">{item.patientName}</span>
                      <X
                        className="w-3 h-3 text-slate-400 hover:text-red-600 transition ml-0.5"
                        onClick={(e) => removeRecent(item.code, e)}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* THÔNG BÁO LỖI (NẾU CÓ) */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-sm max-w-xl mx-auto shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Không tìm thấy dữ liệu phiếu xét nghiệm</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* KHI CÓ KẾT QUẢ XÉT NGHIỆM */}
        {report && (
          <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
            
            {/* 1. THẺ HỒ SƠ BỆNH NHÂN (PREMIUM MEDICAL CARD) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden space-y-3.5">
              {/* Dải gradient nhận diện trên nóc thẻ */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

              {/* Hàng 1: Tên bệnh nhân & Bộ 3 nút thao tác (Cân đối tuyệt đối 100% trên cả Mobile và Desktop) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 pb-3 border-b border-slate-100">
                <div className="min-w-0">
                  {/* Huy hiệu mã hồ sơ & trạng thái */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                      Mã BN: {report.code}
                    </span>
                    {report.sampleCode && report.sampleCode !== report.code && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200">
                        Mã mẫu: {report.sampleCode}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FileCheck className="w-3 h-3 text-emerald-600" />
                      Đã có kết quả chính thức
                    </span>
                  </div>

                  {/* Họ tên bệnh nhân */}
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase truncate">
                    {report.patientName}
                  </h3>
                </div>

                {/* Bộ 3 nút thao tác: Tải PDF - Mã QR - Chia sẻ */}
                <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
                  {/* Nút Tải PDF */}
                  {report.cloudPdfUrl ? (
                    <a
                      href={report.cloudPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 text-center"
                      title="Tải tệp tin PDF gốc có dấu mộc"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>Tải PDF</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold text-center cursor-not-allowed opacity-75"
                      title="Phiếu chưa xuất tệp Cloud PDF"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>Chờ PDF</span>
                    </button>
                  )}

                  {/* Nút xem QR Code */}
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition active:scale-95 text-center cursor-pointer"
                    title={report.cloudPdfUrl ? 'Mở mã QR liên kết file PDF gốc trên Cloud' : 'Mở mã QR hồ sơ'}
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Mã QR</span>
                  </button>

                  {/* Nút sao chép liên kết */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition active:scale-95 text-center cursor-pointer"
                    title="Sao chép đường dẫn phiếu"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{copied ? 'Đã chép' : 'Chia sẻ'}</span>
                  </button>
                </div>
              </div>

              {/* Hàng 2: Lưới thông số hành chính & nhân khẩu học */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-500 font-medium">Năm sinh / Tuổi</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                    {formatPatientAge(report.patientDob, report.createdAt)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-500 font-medium">Giới tính</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">{report.patientGender || '---'}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-500 font-medium">Bác sĩ chỉ định</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5" title={report.doctorName}>
                    {report.doctorName || '---'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-500 font-medium">Thời gian thực hiện</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                    {report.createdAt ? new Date(report.createdAt).toLocaleDateString('vi-VN') : '---'}
                  </span>
                </div>
              </div>

              {/* Hàng 3: SĐT / Địa chỉ & Chẩn đoán */}
              {(report.patientAddress || report.patientDiagnosis) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {report.patientAddress && (
                    <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isPhoneNumber(report.patientAddress) ? (
                          <>
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="text-slate-700 font-mono font-medium truncate">
                              SĐT: {report.patientAddress}
                            </span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="text-slate-700 truncate">{report.patientAddress}</span>
                          </>
                        )}
                      </div>
                      {isPhoneNumber(report.patientAddress) && (
                        <a
                          href={`tel:${report.patientAddress.replace(/[^\d+]/g, '')}`}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0"
                        >
                          Gọi
                        </a>
                      )}
                    </div>
                  )}

                  {report.patientDiagnosis && (
                    <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 flex items-center gap-2">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-slate-800 truncate font-medium">Chẩn đoán: <strong>{report.patientDiagnosis}</strong></span>
                    </div>
                  )}
                </div>
              )}

              {/* Hàng 4: Viện phí & Trạng thái thanh toán tích hợp */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {report.isPaid ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>ĐÃ THANH TOÁN {report.paymentMethod ? `(${report.paymentMethod})` : ''}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{report.paymentStatus || 'CHƯA THANH TOÁN'}</span>
                    </span>
                  )}

                  {report.invoiceCode && (
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                      HĐ: {report.invoiceCode}
                    </span>
                  )}
                </div>

                {report.paymentAmount !== undefined && report.paymentAmount !== null && report.paymentAmount > 0 && (
                  <div className="flex items-baseline justify-between sm:justify-end gap-2 font-mono pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-slate-400 text-xs">Tổng viện phí:</span>
                    <span className={`text-sm sm:text-base font-black ${report.isPaid ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {new Intl.NumberFormat('vi-VN').format(report.paymentAmount)} <span className="text-xs font-semibold">đ</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. KHỐI TỔNG QUAN LÂM SÀNG */}
            <div className="space-y-3">
              {/* Dải Banner Tóm Tắt Tình Trạng Lâm Sàng */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                stats.abnormal > 0
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                    stats.abnormal > 0 ? 'bg-rose-600 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-xs'
                  }`}>
                    {stats.abnormal > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold leading-snug">
                      {stats.abnormal > 0
                        ? `Có ${stats.abnormal}/${stats.total} chỉ số cần lưu ý hoặc vượt ngưỡng`
                        : `Tất cả ${stats.total} chỉ số xét nghiệm đều nằm trong giới hạn chuẩn`}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                      {stats.abnormal > 0
                        ? 'Quý khách vui lòng đối chiếu bảng chi tiết và tham khảo ý kiến bác sĩ chuyên khoa.'
                        : 'Kết quả xét nghiệm tổng thể an toàn và trong giới hạn bình thường.'}
                    </p>
                  </div>
                </div>

                {stats.abnormal > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAbnormalOnly(!showAbnormalOnly)}
                    className={`self-start sm:self-center px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 ${
                      showAbnormalOnly
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    {showAbnormalOnly ? 'Xem tất cả chỉ số' : 'Chỉ xem chỉ số vượt ngưỡng'}
                  </button>
                )}
              </div>

              {/* Nhóm Tabs chuyên khoa (Chỉ hiển thị khi có từ 2 chuyên khoa trở lên) */}
              {categories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      activeCategory === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
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
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. DANH SÁCH THẺ KẾT QUẢ XÉT NGHIỆM CHI TIẾT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-bold">
                <span className="uppercase tracking-wider">KẾT QUẢ XÉT NGHIỆM CHI TIẾT ({filteredTests.length})</span>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Đối chiếu theo chuẩn tham chiếu</span>
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
                    const isLow = !isNaN(numVal) && t.refMin !== null && t.refMin !== undefined && numVal < t.refMin;
                    const isHigh = !isNaN(numVal) && t.refMax !== null && t.refMax !== undefined && numVal > t.refMax;

                    return (
                      <div
                        key={idx}
                        className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-2xs hover:shadow-sm ${
                          isAbnormal
                            ? 'border-rose-200 bg-rose-50/10 border-l-4 border-l-rose-500'
                            : 'border-slate-200/90 border-l-4 border-l-emerald-500'
                        }`}
                      >
                        {/* Header dòng chỉ số: Tên + Mã + Badge trạng thái */}
                        <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100">
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                              {t.testName}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                {t.testCode}
                              </span>
                              {t.category && (
                                <span className="text-slate-500 font-medium">{t.category}</span>
                              )}
                            </div>
                          </div>

                          {/* Badge đánh giá y khoa */}
                          <div className="shrink-0">
                            {isAbnormal ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>{isHigh ? 'VƯỢT NGƯỠNG' : isLow ? 'DƯỚI NGƯỠNG' : 'BẤT THƯỜNG'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>BÌNH THƯỜNG</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Giá trị kết quả to rõ & Định tính */}
                        <div className="flex items-baseline justify-between gap-2 py-3">
                          <div className="flex items-baseline gap-2">
                            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                              isAbnormal ? 'text-rose-600' : 'text-slate-900'
                            }`}>
                              {t.result || '---'}
                            </span>
                            {t.unit && (
                              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase font-mono">
                                {t.unit}
                              </span>
                            )}
                          </div>

                          {t.note && (
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                              isAbnormal
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {t.note}
                            </span>
                          )}
                        </div>

                        {/* Thước đo y khoa trực quan chuẩn mực */}
                        <div className="pt-2 border-t border-slate-100">
                          <TestResultGauge test={t} />

                          {/* Dòng hiển thị khoảng tham chiếu văn bản */}
                          {t.refText && (
                            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                              <span className="font-medium text-slate-400">Khoảng tham chiếu an toàn:</span>
                              <span className="font-mono text-slate-700 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                {t.refText} {t.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. KẾT LUẬN & DẶN DÒ CỦA BÁC SĨ (NẾU CÓ) */}
            {report.conclusion && (
              <div className="bg-emerald-50/50 border border-emerald-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm mb-2.5">
                  <Stethoscope className="w-4 h-4 text-emerald-700" />
                  <span className="uppercase tracking-wider">KẾT LUẬN &amp; TƯ VẤN CỦA BÁC SĨ CHUYÊN KHOA</span>
                </div>

                <div className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium pl-0.5">
                  {report.conclusion}
                </div>

                {report.doctorName && (
                  <div className="mt-3.5 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Bác sĩ phụ trách chuyên môn:</span>
                    <span className="font-bold text-slate-900">{report.doctorName}</span>
                  </div>
                )}
              </div>
            )}

            {/* 5. LIÊN HỆ PHÒNG KHÁM & HỖ TRỢ BỆNH NHÂN */}
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3.5 shadow-2xs">
              <div className="text-center sm:text-left">
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">{clinic?.name || 'Hệ Thống Phòng Xét Nghiệm GoLab'}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{clinic?.address || 'Quảng Trị'}</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {clinic?.phone && (
                  <a
                    href={`tel:${clinic.phone.replace(/[^\d+]/g, '')}`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
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
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer"
                >
                  Tra cứu mã khác
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ── MODAL MÃ QR TOÀN MÀN HÌNH (CHUẨN SẮC NÉT) ── */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span className="font-extrabold text-sm text-slate-900">
                  {report?.cloudPdfUrl ? 'Mã QR Tải Phiếu PDF Gốc' : 'Mã QR Tra Cứu Kết Quả'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrDataUrl ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                  <img src={qrDataUrl} alt="Mã QR Phiếu" className="w-48 h-48 sm:w-52 sm:h-52 object-contain" />
                </div>
                <p className="font-mono text-xs font-bold text-emerald-700 mt-3">
                  Mã hồ sơ: {report?.code}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[240px]">
                  {report?.cloudPdfUrl
                    ? 'Quét mã để xem hoặc tải trực tiếp tệp PDF gốc có dấu mộc lưu trữ trên Cloud'
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
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
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

      {/* ── FOOTER TRANG NÃI BẢN QUYỀN ── */}
      <footer className="border-t border-slate-200/90 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{clinic?.name || 'Hệ Thống Xét Nghiệm Y Khoa GoLab'}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            {clinic?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600 shrink-0" /> {clinic.phone}
              </span>
            )}
            {clinic?.website && (
              <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-emerald-700 transition">
                <Globe className="w-3 h-3 text-emerald-600 shrink-0" /> {clinic.website}
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
