'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  User,
  Activity,
  ShieldCheck,
  Building2,
  Phone,
  Globe
} from 'lucide-react';

interface TestItem {
  testCode: string;
  testName: string;
  category?: string;
  result: string;
  unit?: string;
  refText?: string;
  evaluation?: string;
}

interface ReportData {
  id: string;
  code: string;
  sampleCode: string;
  status: string;
  patientName: string;
  patientDob?: string;
  patientGender?: string;
  patientAddress?: string;
  patientDiagnosis?: string;
  doctorName?: string;
  conclusion?: string;
  isAllergen?: boolean;
  cloudPdfUrl?: string;
  pdfGeneratedAt?: string;
  createdAt: string;
  tests: TestItem[];
}

interface ClinicData {
  name: string;
  address: string;
  phone: string;
  website: string;
  logoUrl?: string;
}

function TraCuuContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const initialSample = searchParams.get('sample') || '';

  const [searchCode, setSearchCode] = useState(initialCode || initialSample);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [error, setError] = useState<string>('');

  const fetchLookup = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tra-cuu?code=${encodeURIComponent(codeToSearch)}&sample=${encodeURIComponent(codeToSearch)}`);
      const data = await res.json();
      if (data.found && data.report) {
        setReport(data.report);
        if (data.clinic) setClinic(data.clinic);
      } else {
        setReport(null);
        setError(data.message || 'Không tìm thấy kết quả xét nghiệm phù hợp.');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode || initialSample) {
      fetchLookup(initialCode || initialSample);
    }
  }, [initialCode, initialSample]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLookup(searchCode);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-black text-base shadow-sm">
              GL
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide uppercase">
                {clinic?.name || 'HỆ THỐNG XÉT NGHIỆM GOLAB'}
              </h1>
              <p className="text-[11px] text-slate-400">Cổng Tra Cứu Kết Quả Xét Nghiệm Điện Tử</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Xác Thực Điện Tử</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex-1">
        {/* Search Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nhập mã bệnh nhân (BN-...) hoặc mã mẫu..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-sm px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Tra Cứu</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* State: Error */}
        {error && !loading && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-5 mb-6 text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Không tìm thấy thông tin</h3>
              <p className="text-xs text-rose-300/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* State: Report Details */}
        {report && (
          <div className="space-y-6">
            {/* Patient Header Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Mã BN: {report.code}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Mã Mẫu: {report.sampleCode}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
                    <User className="w-5 h-5 text-sky-400" />
                    <span>{report.patientName}</span>
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">{report.status || 'Đã có kết quả'}</span>
                  </div>

                  {report.cloudPdfUrl && (
                    <a
                      href={report.cloudPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xem File PDF Gốc</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Patient Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Năm sinh:</span>
                  <span className="font-medium text-white">{report.patientDob || '---'}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Giới tính:</span>
                  <span className="font-medium text-white">{report.patientGender || '---'}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Bác sĩ chỉ định / Ký:</span>
                  <span className="font-medium text-white">{report.doctorName || '---'}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Ngày lập phiếu:</span>
                  <span className="font-medium text-white">
                    {report.createdAt ? new Date(report.createdAt).toLocaleDateString('vi-VN') : '---'}
                  </span>
                </div>
              </div>

              {report.patientDiagnosis && (
                <div className="mt-3 text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-slate-400">Chẩn đoán: </span>
                  <span className="text-slate-200">{report.patientDiagnosis}</span>
                </div>
              )}
            </div>

            {/* Test Results Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span>Danh Sách Chỉ Số Xét Nghiệm ({report.tests.length} chỉ số)</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Tên Chỉ Số</th>
                      <th className="py-2.5 px-3 text-center">Kết Quả</th>
                      <th className="py-2.5 px-3 text-center">Đơn Vị</th>
                      <th className="py-2.5 px-3">Khoảng Tham Chiếu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {report.tests.map((t, idx) => {
                      const isAbnormal = t.evaluation && t.evaluation !== 'NORMAL';
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-200">
                            {t.testName}
                            {t.category && (
                              <span className="block text-[10px] text-slate-500">{t.category}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">
                            <span
                              className={
                                isAbnormal
                                  ? 'text-rose-400 font-black'
                                  : 'text-emerald-400 font-semibold'
                              }
                            >
                              {t.result || '---'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                            {t.unit || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                            {t.refText || '---'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {report.conclusion && (
                <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs">
                  <span className="font-bold text-sky-400 block mb-1">Kết Luận Bác Sĩ:</span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{report.conclusion}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State when no search code */}
        {!report && !error && !loading && (
          <div className="text-center py-16 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Tra cứu phiếu kết quả xét nghiệm</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Quét mã QR trên phiếu kết quả hoặc nhập mã bệnh nhân / mã mẫu xét nghiệm vào ô tìm kiếm ở trên.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-4">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{clinic?.name || 'Hệ Thống Xét Nghiệm Y Khoa GoLab'}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            {clinic?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-sky-400" /> {clinic.phone}
              </span>
            )}
            {clinic?.website && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-sky-400" /> {clinic.website}
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function TraCuuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Đang nạp cổng tra cứu...
        </div>
      }
    >
      <TraCuuContent />
    </Suspense>
  );
}
