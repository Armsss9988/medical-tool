'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  AlertCircle,
  Phone,
  Globe,
  History,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  QrCode
} from 'lucide-react';
import {
  ClinicalDemographicsStrip,
  ClinicalAlertNotice,
  ClinicalResultsTable,
  ClinicalDoctorNote,
  ClinicalLegalNotice,
  ClinicalButton
} from '@components/clinical';
import { PortalClinicData, PortalReportData, PortalTestItem, RecentLookupItem } from '../types';
import { generateQrCodeDataUrl, downloadQrCodeImage } from '@infra/qrService';
import golabLogo from '@assets/golabLogoDataUrl';

const RECENT_KEY = 'golab_recent_lookups';

// Regex lọc bỏ các trường hành chính bị lẫn vào bảng xét nghiệm khi import Excel (khớp toàn từ, không làm mất xét nghiệm "Giới tính thai nhi", "Tuổi thai")
const ADMIN_FIELD_REGEX = /^(giới\s*tính|gender|sex|số\s*điện\s*thoại|sđt|phone|tel|địa\s*chỉ|address|công\s*ty|company|bác\s*sĩ|bs\s*chỉ\s*định|doctor|họ\s*và\s*tên|họ\s*tên|patient\s*name|năm\s*sinh|ngày\s*sinh|dob|tuổi|age|ghi\s*chú\s*chung)$/i;

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
  // Theo quy chuẩn GoLab: Mã QR trên màn hình tra cứu online ("phiếu này") trỏ trực tiếp tới Cloud PDF chính thức
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
        setError(data.message || 'Không tìm thấy hồ sơ xét nghiệm phù hợp với mã đã nhập.');
      }
    } catch {
      setError('Không thể kết nối đến hệ thống máy chủ y tế. Vui lòng kiểm tra lại kết nối mạng.');
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
    if (!report?.tests) return { total: 0, abnormal: 0, normal: 0, pending: 0, isPendingReport: false };
    const total = report.tests.length;
    const pending = report.tests.filter((t) => t.evaluation === 'PENDING' || !t.result || t.result.trim() === '').length;
    const abnormal = report.tests.filter((t) => t.evaluation === 'ABNORMAL').length;
    const isPendingReport =
      report.status === 'Chờ xét nghiệm' ||
      report.status === 'Đang xét nghiệm' ||
      report.status === 'DRAFT' ||
      (total > 0 && pending === total);

    return {
      total,
      abnormal,
      pending,
      normal: Math.max(0, total - abnormal - pending),
      isPendingReport,
    };
  }, [report]);

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col justify-between font-sans antialiased selection:bg-teal-700 selection:text-white">
      {/* ── 1. HEADER BỆNH VIỆN / PHÒNG XÉT NGHIỆM CHUẨN LÂM SÀNG ── */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Logo Thương Hiệu GoLab & Tên Cơ Sở Y Tế */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0 p-1 shadow-2xs">
              <img
                src={clinic?.logoUrl || golabLogo}
                alt={clinic?.name || 'GoLab Logo'}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = golabLogo;
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-tight line-clamp-1">
                {clinic?.name || 'HỆ THỐNG XÉT NGHIỆM Y KHOA GOLAB'}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                <span>Cổng Tra Cứu Hồ Sơ Bệnh Án &amp; Kết Quả Xét Nghiệm Điện Tử</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar Header */}
          <div className="flex items-center gap-2 shrink-0">
            {report && (
              <button
                type="button"
                onClick={() => setIsSearchDrawerOpen(!isSearchDrawerOpen)}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-teal-800 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 transition cursor-pointer"
                title="Tra cứu hồ sơ khác"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tra mã khác</span>
                {isSearchDrawerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {clinic?.phone && (
              <a
                href={`tel:${clinic.phone.replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center gap-1.5 text-xs text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-2.5 py-1.5 rounded-lg transition font-medium"
                title={`Hotline chuyên môn: ${clinic.phone}`}
              >
                <Phone className="w-3.5 h-3.5 text-teal-700" />
                <span className="hidden sm:inline">Hotline:</span>
                <span className="font-mono font-semibold text-xs">{clinic.phone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Khung tìm kiếm mở rộng trên Header */}
        {report && isSearchDrawerOpen && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 animate-in slide-in-from-top-2 duration-150">
            <div className="max-w-5xl mx-auto">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Nhập mã bệnh nhân hoặc mã mẫu khác (VD: BN-20260905-001)..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-teal-700 rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal-700"
                    autoFocus
                  />
                  {searchCode && (
                    <button
                      type="button"
                      onClick={() => setSearchCode('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <ClinicalButton
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={loading}
                  disabled={!searchCode.trim()}
                >
                  Tra Cứu
                </ClinicalButton>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. NỘI DUNG CHÍNH ── */}
      <main className="max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-6 flex-1 space-y-4">
        {/* KHỐI TÌM KIẾM HERO (HIỂN THỊ KHI CHƯA MỞ HỒ SƠ) */}
        {!report && (
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-xs text-center max-w-lg mx-auto my-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-xs">
              <img
                src={clinic?.logoUrl || golabLogo}
                alt={clinic?.name || 'GoLab Logo'}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = golabLogo;
                }}
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Tra Cứu Kết Quả Xét Nghiệm Trực Tuyến
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Nhập mã bệnh nhân ghi trên phiếu tiếp nhận (Ví dụ:{' '}
                <strong className="font-mono text-slate-800">BN-20260905-001</strong>) để xem kết quả chính thức.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nhập mã bệnh nhân hoặc mã mẫu..."
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-teal-700 rounded-lg pl-9 pr-8 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 font-mono"
                  autoFocus
                />
                {searchCode && (
                  <button
                    type="button"
                    onClick={() => setSearchCode('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <ClinicalButton
                variant="primary"
                size="md"
                type="submit"
                loading={loading}
                disabled={!searchCode.trim()}
                icon={<Search className="w-3.5 h-3.5" />}
              >
                Tra Cứu
              </ClinicalButton>
            </form>

            {/* Lịch sử tra cứu gần đây trên thiết bị */}
            {recentLookups.length > 0 && (
              <div className="pt-3 border-t border-slate-100 text-left">
                <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mb-2">
                  <History className="w-3 h-3 text-slate-400" />
                  Đã tra cứu gần đây:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recentLookups.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setSearchCode(item.code);
                        fetchLookup(item.code);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-teal-600 text-slate-700 hover:text-teal-900 transition text-xs font-mono group cursor-pointer"
                    >
                      <span className="font-semibold">{item.code}</span>
                      <span className="text-slate-400 max-w-[100px] truncate">{item.patientName}</span>
                      <X
                        className="w-3 h-3 text-slate-400 hover:text-rose-600 transition ml-0.5"
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
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5 flex items-start gap-2.5 text-rose-900 text-xs sm:text-sm max-w-lg mx-auto">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Không tìm thấy dữ liệu xét nghiệm</p>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* KHI ĐÃ CÓ KẾT QUẢ HỒ SƠ */}
        {report && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* 1. DẢI HỒ SƠ BỆNH NHÂN (EPIC MYCHART CLINICAL BANNER) */}
            <ClinicalDemographicsStrip
              patientName={report.patientName}
              code={report.code}
              sampleCode={report.sampleCode}
              dob={report.patientDob}
              gender={report.patientGender}
              address={report.patientAddress}
              diagnosis={report.patientDiagnosis}
              doctorName={report.doctorName}
              createdAt={report.createdAt}
              status={report.status}
              isPending={stats.isPendingReport}
              cloudPdfUrl={report.cloudPdfUrl}
              isPaid={report.isPaid}
              paymentMethod={report.paymentMethod}
              paymentStatus={report.paymentStatus}
              paymentAmount={report.paymentAmount}
              invoiceCode={report.invoiceCode}
              onOpenQr={() => setShowQrModal(true)}
              onShare={handleCopyLink}
              isShared={copied}
            />

            {/* 2. DẢI THÔNG BÁO LÂM SÀNG & BỘ LỌC CHỈ SỐ BẤT THƯỜNG */}
            <ClinicalAlertNotice
              total={stats.total}
              abnormal={stats.abnormal}
              isPending={stats.isPendingReport}
              showAbnormalOnly={showAbnormalOnly}
              onToggleFilter={() => setShowAbnormalOnly(!showAbnormalOnly)}
            />

            {/* 3. ĐIỀU HƯỚNG THEO CHUYÊN KHOA (NẾU CÓ TRÊN 1 CHUYÊN KHOA) */}
            {categories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  Tất cả chuyên khoa ({report.tests.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* 4. BẢNG DANH MỤC XÉT NGHIỆM THEO PANEL CHUẨN BỆNH VIỆN */}
            <ClinicalResultsTable tests={filteredTests} />

            {/* 5. Ý KIẾN CHUYÊN MÔN & DẶN DÒ CỦA BÁC SĨ (NẾU CÓ VÀ ĐÃ HOÀN TẤT XÉT NGHIỆM) */}
            {!stats.isPendingReport && (
              <ClinicalDoctorNote
                conclusion={report.conclusion}
                doctorName={report.doctorName}
              />
            )}

            {/* 6. XÁC THỰC PHÁP LÝ BỆNH ÁN ĐIỆN TỬ (THÔNG TƯ 46/2018/TT-BYT) */}
            <ClinicalLegalNotice
              clinicName={clinic?.name}
              clinicAddress={clinic?.address}
              clinicPhone={clinic?.phone}
              hasCloudPdf={Boolean(report.cloudPdfUrl)}
            />
          </div>
        )}
      </main>

      {/* ── 3. MODAL MÃ QR XÁC THỰC TOÀN MÀN HÌNH ── */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-teal-700" />
                <span className="font-bold text-xs uppercase tracking-wide text-slate-900">
                  {report?.cloudPdfUrl ? 'Mã QR File PDF Ký Số' : 'Mã QR Tra Cứu Hồ Sơ'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {qrDataUrl ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <img src={qrDataUrl} alt="Mã QR Phiếu" className="w-44 h-44 object-contain" />
                </div>
                <p className="font-mono text-xs font-semibold text-slate-800 mt-2.5">
                  Mã BN: {report?.code}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[240px] leading-relaxed">
                  {report?.cloudPdfUrl
                    ? 'Quét mã để mở và tải trực tiếp tệp PDF gốc có dấu mộc lưu trữ trên Cloud y tế'
                    : 'Quét mã bằng Camera điện thoại hoặc Zalo để mở ngay phiếu kết quả trực tuyến'}
                </p>
              </div>
            ) : (
              <div className="py-8 text-slate-400 text-xs">Đang khởi tạo mã QR...</div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <ClinicalButton
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handleDownloadQr}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Lưu Ảnh QR
              </ClinicalButton>

              <ClinicalButton
                variant="secondary"
                size="sm"
                onClick={handleCopyLink}
              >
                {copied ? 'Đã chép link' : 'Chép Link'}
              </ClinicalButton>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. FOOTER BẢO TRỢ & PHÁP LÝ Y TẾ ── */}
      <footer className="border-t border-slate-200 bg-white py-3.5 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <img
              src={clinic?.logoUrl || golabLogo}
              alt="GoLab Logo"
              className="w-4 h-4 object-contain shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = golabLogo;
              }}
            />
            <span className="font-medium text-slate-700 truncate">
              {clinic?.name || 'Hệ Thống Xét Nghiệm Y Khoa GoLab'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            {clinic?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {clinic.phone}
              </span>
            )}
            {clinic?.website && (
              <a
                href={clinic.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-500 hover:text-teal-800 transition"
              >
                <Globe className="w-3 h-3 text-slate-400 shrink-0" /> {clinic.website}
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
