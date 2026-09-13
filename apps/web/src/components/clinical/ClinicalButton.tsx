import React from 'react';

export type ClinicalButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost';
export type ClinicalButtonSize = 'sm' | 'md' | 'lg';

interface ClinicalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ClinicalButtonVariant;
  size?: ClinicalButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<ClinicalButtonVariant, string> = {
  primary:
    'bg-slate-900 hover:bg-slate-800 text-white border border-transparent shadow-xs focus:ring-slate-900/20',
  secondary:
    'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs hover:border-slate-300 focus:ring-slate-400/20',
  accent:
    'bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent shadow-xs focus:ring-emerald-500/20',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-700 border border-transparent focus:ring-slate-400/20'
};

const SIZE_STYLES: Record<ClinicalButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-lg',
  md: 'text-xs sm:text-sm px-3.5 py-2 gap-2 rounded-xl',
  lg: 'text-sm px-4 py-2.5 gap-2.5 rounded-xl'
};

export const ClinicalButton = React.forwardRef<HTMLButtonElement, ClinicalButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      icon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-semibold font-sans transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus:ring-2 select-none ${
          VARIANT_STYLES[variant]
        } ${SIZE_STYLES[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        <span>{children}</span>
      </button>
    );
  }
);

ClinicalButton.displayName = 'ClinicalButton';
