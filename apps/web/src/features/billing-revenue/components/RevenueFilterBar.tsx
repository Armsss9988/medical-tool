import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { Doctor, DateFilterType } from '@domain';

export interface RevenueFilterBarProps {
  searchTerm: string;
  onSearchTermChange: (val: string) => void;
  dateFilter: DateFilterType;
  onDateFilterChange: (val: DateFilterType) => void;
  customStartDate: string;
  onCustomStartDateChange: (val: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (val: string) => void;
  selectedDoctor: string;
  onSelectedDoctorChange: (val: string) => void;
  doctorsList: Doctor[];
  selectedPaymentMethod: string;
  onSelectedPaymentMethodChange: (val: string) => void;
  selectedStatus: string;
  onSelectedStatusChange: (val: string) => void;
  isMobileFilterOpen: boolean;
  onToggleMobileFilter: () => void;
  activeFilterCount: number;
  onResetFilters: () => void;
}

export function RevenueFilterBar({
  searchTerm,
  onSearchTermChange,
  dateFilter,
  onDateFilterChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  selectedDoctor,
  onSelectedDoctorChange,
  doctorsList,
  selectedPaymentMethod,
  onSelectedPaymentMethodChange,
  selectedStatus,
  onSelectedStatusChange,
  isMobileFilterOpen,
  onToggleMobileFilter,
  activeFilterCount,
  onResetFilters
}: RevenueFilterBarProps) {
  return (
    <div className="p-3 sm:p-3.5 bg-slate-900 border-b border-slate-800 space-y-2 shrink-0 text-xs">
      {/* Mobile Search Bar + Filter Toggle */}
      <div className="flex sm:hidden items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm mã HĐ, tên BN, SĐT..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={onToggleMobileFilter}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shrink-0 ${
            isMobileFilterOpen || activeFilterCount > 0
              ? 'bg-amber-600/30 text-amber-200 border-amber-500/50'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Lọc</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        {(activeFilterCount > 0 || searchTerm) && (
          <button
            type="button"
            onClick={onResetFilters}
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-xl text-xs font-bold shrink-0 transition"
            title="Xóa bộ lọc"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Desktop Search + Filter controls (collapsible on mobile) */}
      <div className={`${isMobileFilterOpen ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 sm:pt-0`}>
        {/* Desktop search input */}
        <div className="hidden sm:block sm:col-span-3 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm mã HĐ, tên BN, mã BN, SĐT..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
          />
        </div>

        {/* Lọc thời gian */}
        <div className="sm:col-span-3">
          <select
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value as DateFilterType)}
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
          >
            <option value="ALL">Mọi thời gian</option>
            <option value="TODAY">Hôm nay</option>
            <option value="YESTERDAY">Hôm qua</option>
            <option value="LAST_7_DAYS">7 ngày qua</option>
            <option value="THIS_MONTH">Tháng này</option>
            <option value="LAST_MONTH">Tháng trước</option>
            <option value="CUSTOM">Tùy chọn ngày...</option>
          </select>
        </div>

        {/* Lọc Bác sĩ */}
        <div className="sm:col-span-2">
          <select
            value={selectedDoctor}
            onChange={(e) => onSelectedDoctorChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
          >
            <option value="ALL">Tất cả bác sĩ</option>
            {doctorsList.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lọc Hình thức thanh toán */}
        <div className="sm:col-span-2">
          <select
            value={selectedPaymentMethod}
            onChange={(e) => onSelectedPaymentMethodChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
          >
            <option value="ALL">Tất cả PT thanh toán</option>
            <option value="Tiền mặt">Tiền mặt</option>
            <option value="Chuyển khoản (VietQR)">VietQR</option>
            <option value="Quẹt thẻ">Quẹt thẻ POS</option>
          </select>
        </div>

        {/* Lọc Trạng thái */}
        <div className="sm:col-span-2">
          <select
            value={selectedStatus}
            onChange={(e) => onSelectedStatusChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Đã thanh toán">Đã thanh toán</option>
            <option value="Chưa thanh toán">Chưa thanh toán</option>
            <option value="Đã hủy / Hoàn tiền">Đã hủy / Hoàn tiền</option>
          </select>
        </div>
      </div>

      {/* Dòng tùy chọn ngày nếu chọn CUSTOM */}
      {dateFilter === 'CUSTOM' && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-slate-400 font-semibold">Từ ngày:</span>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => onCustomStartDateChange(e.target.value)}
            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
          />
          <span className="text-slate-400 font-semibold">Đến ngày:</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => onCustomEndDateChange(e.target.value)}
            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
          />
        </div>
      )}
    </div>
  );
}
