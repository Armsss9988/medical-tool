import React from 'react';
import { Search, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Doctor, DateFilterType } from '@domain';
import { 
  ReportFilterStats, 
  PaymentFilterType, 
  PdfStatusFilterType, 
  ReportTypeFilter 
} from '../hooks/useReportFilterAndStats';

interface ReportFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dateFilter: DateFilterType;
  setDateFilter: (val: DateFilterType) => void;
  selectedType: ReportTypeFilter;
  setSelectedType: (val: ReportTypeFilter) => void;
  selectedDoctor: string;
  setSelectedDoctor: (val: string) => void;
  paymentFilter: PaymentFilterType;
  setPaymentFilter: (val: PaymentFilterType) => void;
  pdfFilter: PdfStatusFilterType;
  setPdfFilter: (val: PdfStatusFilterType) => void;
  doctorsList?: Doctor[];
  stats: ReportFilterStats;
  isMobileFilterOpen: boolean;
  setIsMobileFilterOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  activeFilterCount: number;
  handleResetFilters: () => void;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  selectedType,
  setSelectedType,
  selectedDoctor,
  setSelectedDoctor,
  paymentFilter,
  setPaymentFilter,
  pdfFilter,
  setPdfFilter,
  doctorsList = [],
  stats,
  isMobileFilterOpen,
  setIsMobileFilterOpen,
  activeFilterCount,
  handleResetFilters
}) => {
  return (
    <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800 shrink-0 text-xs">
      {/* Mobile Search Bar + Filter Toggle */}
      <div className="flex sm:hidden items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm tên, mã BN, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-medium"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen((prev) => !prev)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shrink-0 ${
            isMobileFilterOpen || activeFilterCount > 0
              ? 'bg-sky-600/30 text-sky-200 border-sky-500/50'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Lọc</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        {(activeFilterCount > 0 || searchTerm) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-xl text-xs font-bold shrink-0 transition"
            title="Xóa bộ lọc về mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Desktop search + Filter controls (collapsible on mobile) */}
      <div className={`${isMobileFilterOpen ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2.5 pt-1 sm:pt-0`}>
        {/* Desktop search input */}
        <div className="hidden sm:block sm:col-span-3 relative">
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
            onChange={(e) => setSelectedType(e.target.value as ReportTypeFilter)}
            className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
          >
            <option value="ALL">Tất cả loại phiếu</option>
            <option value="STANDARD">Phiếu thường</option>
            <option value="ALLERGEN">Phiếu Dị nguyên</option>
            <option value="HYBRID">Phiếu Hỗn Hợp ({stats.hybrid})</option>
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

        {/* Lọc Tình trạng Thu Phí */}
        <div className="sm:col-span-1.5">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilterType)}
            className="w-full px-2.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
          >
            <option value="ALL">Thu phí (Tất cả)</option>
            <option value="PAID">💳 Đã thu tiền ({stats.paidCount})</option>
            <option value="UNPAID">⏳ Chưa thu ({stats.unpaidCount})</option>
          </select>
        </div>

        {/* Lọc Tình trạng PDF */}
        <div className="sm:col-span-1.5">
          <select
            value={pdfFilter}
            onChange={(e) => setPdfFilter(e.target.value as PdfStatusFilterType)}
            className="w-full px-2.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
          >
            <option value="ALL">PDF (Tất cả)</option>
            <option value="OUTDATED">⚠️ Cần cập nhật ({stats.outdated})</option>
            <option value="LATEST">✅ PDF Mới</option>
            <option value="NOT_EXPORTED">⏳ Chưa xuất</option>
          </select>
        </div>
      </div>
    </div>
  );
};
