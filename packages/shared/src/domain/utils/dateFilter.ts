import { DATE_FILTER, DateFilterType } from '../constants/uiConstants';

export interface DateFilterRangeOptions {
  customStartDate?: string;
  customEndDate?: string;
}

/**
 * Kiểm tra một ngày có nằm trong bộ lọc thời gian trên UI (TODAY / YESTERDAY / LAST_7_DAYS / THIS_MONTH / LAST_MONTH / CUSTOM).
 * Thuần — không phụ thuộc React/DOM, dùng chung cho mọi slice cần lọc theo ngày.
 */
export function matchesDateFilter(
  date: Date,
  filter: DateFilterType,
  options: DateFilterRangeOptions = {}
): boolean {
  if (filter === DATE_FILTER.ALL || Number.isNaN(date.getTime())) {
    return filter === DATE_FILTER.ALL;
  }

  const now = new Date();
  const todayStr = now.toDateString();

  if (filter === DATE_FILTER.TODAY) {
    return date.toDateString() === todayStr;
  }

  if (filter === DATE_FILTER.YESTERDAY) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }

  if (filter === DATE_FILTER.LAST_7_DAYS) {
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    return date >= sevenDaysAgo;
  }

  if (filter === DATE_FILTER.THIS_MONTH) {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  if (filter === DATE_FILTER.LAST_MONTH) {
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  }

  if (filter === DATE_FILTER.CUSTOM) {
    if (options.customStartDate && new Date(options.customStartDate) > date) return false;
    if (options.customEndDate) {
      const end = new Date(options.customEndDate);
      end.setHours(23, 59, 59, 999);
      if (date > end) return false;
    }
    return true;
  }

  return true;
}