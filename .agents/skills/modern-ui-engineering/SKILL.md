---
name: modern-ui-engineering
description: Use when creating, refactoring, or reviewing React UI components, modals, dialogs, tables, dashboards, forms, toolbars, or designing interactive web features in Next.js & Tailwind CSS.
---

# Modern UI Engineering & Component Craftsmanship

This skill guides the construction of premium, accessible, and responsive UI components for the GoLab application using React 19, Next.js (App Router), Tailwind CSS v4, and Lucide Icons.

---

## 1. Golden Anatomy of a Component

Every UI component must follow a clear 4-tier visual hierarchy:

```
┌────────────────────────────────────────────────────────┐
│ 1. Container (rounded-2xl, border-slate-200, shadow)   │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 2. Header (Icon badge, Title font-semibold, Subtitle│
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 3. Content Body (Rhythmic 4px spacing, data-dense) │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 4. Action Footer (Cancel/Secondary left, CTA right) │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 2. Production-Ready Component Recipes

### Recipe A: Premium Modal / Dialog
```tsx
import { ReactNode } from 'react';
import { X, LucideIcon } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColorClass?: string; // e.g. 'bg-sky-50 text-sky-600 ring-sky-500/10'
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string; // e.g. 'max-w-md'
}

export function PremiumModal({
  isOpen,
  onClose,
  title,
  description,
  icon: Icon,
  iconColorClass = 'bg-sky-50 text-sky-600 ring-sky-500/10',
  children,
  footer,
  maxWidthClass = 'max-w-md'
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className={`w-full ${maxWidthClass} rounded-2xl bg-white border border-slate-200/80 shadow-2xl shadow-slate-900/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`p-2.5 rounded-xl ring-1 ${iconColorClass}`}>
                <Icon className="size-5 stroke-[1.75]" />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-none">{title}</h3>
              {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors active:scale-95"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50/80 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Recipe B: Action Buttons Hierarchy
```tsx
// 1. Primary Action (Subtle gradient + soft shadow + active click)
<button
  type="button"
  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-sky-500 to-sky-600 px-4 py-2 text-sm font-medium text-white shadow-xs shadow-sky-500/20 transition-all duration-150 hover:from-sky-400 hover:to-sky-500 hover:shadow-sm hover:shadow-sky-500/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
>
  <Check className="size-4" />
  <span>Lưu thay đổi</span>
</button>

// 2. Secondary Action
<button
  type="button"
  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs transition-all duration-150 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
>
  Hủy bỏ
</button>

// 3. Destructive Action
<button
  type="button"
  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition-all duration-150 hover:bg-rose-100 hover:text-rose-700 active:scale-[0.98] disabled:opacity-50"
>
  <Trash2 className="size-4" />
  <span>Xóa bản ghi</span>
</button>
```

---

### Recipe C: Status Badges (Pastel Pill System)
```tsx
// Success / Đã thanh toán / Đã xuất
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
  Đã hoàn tất
</span>

// Pending / Chờ kết quả / Chưa thu phí
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-600/20">
  <Clock className="size-3 text-amber-600" />
  Chờ xử lý
</span>

// Abnormal / Cần cập nhật / Cảnh báo
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-rose-600/20">
  <AlertCircle className="size-3 text-rose-600" />
  Bất thường
</span>
```

---

### Recipe D: Form Input with Icon Slot & Validation
```tsx
<div className="space-y-1.5">
  <label className="block text-xs font-semibold text-slate-700 tracking-wide">
    Mã định danh bệnh nhân
  </label>
  <div className="relative">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
      <User className="size-4" />
    </div>
    <input
      type="text"
      placeholder="Nhập mã hoặc số hồ sơ..."
      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50 disabled:text-slate-500"
    />
  </div>
  {error && <p className="text-xs font-medium text-rose-600 mt-1">{error}</p>}
</div>
```

---

### Recipe E: Modern Clinical Metric / Stat Card
```tsx
<div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-sky-200">
  <div className="flex items-center justify-between">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng phiếu hôm nay</span>
    <div className="p-2 rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-500/10 group-hover:bg-sky-600 group-hover:text-white transition-colors">
      <FileText className="size-4" />
    </div>
  </div>
  <div className="mt-3 flex items-baseline gap-2">
    <span className="font-mono-num text-2xl font-bold tracking-tight text-slate-900">128</span>
    <span className="text-xs font-medium text-emerald-600">+12% so với hôm qua</span>
  </div>
</div>
```

---

## 3. Tailwind CSS v4 & Lucide Checklist Before Output
- [ ] Dùng `size-4`, `size-5` thay vì `w-4 h-4`
- [ ] Dùng `rounded-xl` cho control/input/button, `rounded-2xl` cho card/modal
- [ ] Số liệu và mã code dùng `font-mono-num` hoặc `font-mono tracking-tight`
- [ ] Interactive elements có `transition-all duration-150 active:scale-[0.98]`
- [ ] Không dùng raw emoji làm icon
- [ ] Badge trạng thái dùng pastel tone + ring border mờ (`ring-1 ring-.../20`)
