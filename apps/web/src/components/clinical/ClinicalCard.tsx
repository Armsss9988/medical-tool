import React from 'react';

export type ClinicalCardAccent = 'none' | 'emerald' | 'sky' | 'amber' | 'rose' | 'slate';

interface ClinicalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: ClinicalCardAccent;
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const ACCENT_STYLES: Record<ClinicalCardAccent, string> = {
  none: '',
  emerald: 'border-t-2 border-t-emerald-600',
  sky: 'border-t-2 border-t-sky-600',
  amber: 'border-t-2 border-t-amber-500',
  rose: 'border-t-2 border-t-rose-600',
  slate: 'border-t-2 border-t-slate-500'
};

const PADDING_STYLES = {
  none: 'p-0',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8'
};

export const ClinicalCard: React.FC<ClinicalCardProps> = ({
  accent = 'none',
  padding = 'md',
  interactive = false,
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      {...props}
      className={`relative bg-white border border-slate-200/80 rounded-2xl shadow-xs transition-all ${ACCENT_STYLES[accent]} ${PADDING_STYLES[padding]} ${
        interactive ? 'hover:border-slate-300 hover:shadow-sm cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
