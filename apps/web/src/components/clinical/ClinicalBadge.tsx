import React from 'react';
import {
  Check,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ShieldCheck,
  Clock,
  CheckCircle2,
  FileCheck2,
  FileText,
  Send,
  XCircle
} from 'lucide-react';

export type ClinicalBadgeVariant =
  | 'normal'
  | 'abnormal'
  | 'low'
  | 'high'
  | 'verified'
  | 'neutral'
  | 'paid'
  | 'unpaid'
  | 'pending'
  | 'draft'
  | 'exported'
  | 'outdated'
  | 'delivered';

export type ClinicalBadgeSize = 'sm' | 'md';

interface ClinicalBadgeProps {
  variant: ClinicalBadgeVariant;
  size?: ClinicalBadgeSize;
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
  title?: string;
}

const VARIANT_CONFIG: Record<
  ClinicalBadgeVariant,
  {
    container: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  normal: {
    container: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    icon: Check
  },
  abnormal: {
    container: 'bg-red-50 text-red-600 border-red-200',
    icon: AlertTriangle
  },
  low: {
    container: 'bg-amber-50 text-amber-600 border-amber-200',
    icon: ArrowDown
  },
  high: {
    container: 'bg-red-50 text-red-600 border-red-200',
    icon: ArrowUp
  },
  verified: {
    container: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: ShieldCheck
  },
  neutral: {
    container: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: FileCheck2
  },
  paid: {
    container: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    icon: CheckCircle2
  },
  unpaid: {
    container: 'bg-red-50 text-red-600 border-red-200',
    icon: XCircle
  },
  pending: {
    container: 'bg-amber-50 text-amber-600 border-amber-200',
    icon: Clock
  },
  draft: {
    container: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    icon: FileText
  },
  exported: {
    container: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    icon: CheckCircle2
  },
  outdated: {
    container: 'bg-red-50 text-red-600 border-red-200',
    icon: AlertTriangle
  },
  delivered: {
    container: 'bg-sky-50 text-sky-600 border-sky-200',
    icon: Send
  }
};

export const ClinicalBadge: React.FC<ClinicalBadgeProps> = ({
  variant,
  size = 'md',
  children,
  icon = true,
  className = '',
  title
}) => {
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.neutral;
  const IconComponent = config.icon;

  const sizeStyles =
    size === 'sm'
      ? 'text-[11px] px-2 py-0.5 gap-1 leading-tight'
      : 'text-xs px-2.5 py-1 gap-1.5 leading-normal';

  const iconSizes = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      title={title}
      data-testid="clinical-badge"
      className={`inline-flex items-center font-medium font-sans border rounded-full shrink-0 tracking-tight transition-colors select-none ${config.container} ${sizeStyles} ${className}`}
    >
      {icon && <IconComponent className={`${iconSizes} shrink-0 opacity-90`} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};
