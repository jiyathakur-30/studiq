import React from 'react';
import { Loader2 } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  warning?: string;
  loading?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  warning,
  loading = false,
  multiline = false,
  rows = 4,
  className = '',
  helperText,
  id,
  disabled,
  ...props
}) => {
  // Determine standard validation state colors
  let statusBorderClass = 'border-slate-300 dark:border-white/10';
  let statusBgClass = 'bg-white dark:bg-slate-900';
  let focusClass = 'focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none';

  if (error) {
    statusBorderClass = 'border-red-500/40';
    statusBgClass = 'bg-red-500/[0.03] dark:bg-red-950/10';
    focusClass = 'focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 focus:outline-none';
  } else if (warning) {
    statusBorderClass = 'border-amber-500/40';
    statusBgClass = 'bg-amber-500/[0.03] dark:bg-amber-950/10';
    focusClass = 'focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 focus:outline-none';
  } else if (success) {
    statusBorderClass = 'border-emerald-500/40';
    statusBgClass = 'bg-emerald-500/[0.03] dark:bg-emerald-950/10';
    focusClass = 'focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none';
  }

  const baseInputClass = `
    w-full px-4 text-sm rounded-xl text-slate-800 dark:text-slate-100
    border ${statusBorderClass} ${statusBgClass}
    hover:border-black/[0.15] dark:hover:border-white/[0.15]
    shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]
    transition-all duration-200 ease-out
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    focus:outline-none ${focusClass}
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Standard height for standard inputs to ensure exact h-12 comfort
  const inputHeightClass = multiline ? 'py-3' : 'h-12';

  return (
    <div className={`flex flex-col w-full text-left ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          {label}
        </label>
      )}

      <div className="relative w-full">
        {multiline ? (
          <textarea
            id={id}
            rows={rows}
            disabled={disabled || loading}
            className={`${baseInputClass} ${inputHeightClass} resize-none`}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            id={id}
            disabled={disabled || loading}
            className={`${baseInputClass} ${inputHeightClass} pr-10`}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <Loader2 size={16} className="text-brand-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Validation and Helper Metadata Panel */}
      {error && (
        <span className="text-xs font-medium text-red-500 tracking-wide animate-slide-up mt-1.5 block">
          {error}
        </span>
      )}
      {!error && warning && (
        <span className="text-xs font-medium text-amber-500 tracking-wide animate-slide-up mt-1.5 block">
          {warning}
        </span>
      )}
      {!error && !warning && success && (
        <span className="text-xs font-medium text-emerald-500 tracking-wide animate-slide-up mt-1.5 block">
          {success}
        </span>
      )}
      {!error && !warning && !success && helperText && (
        <span className="text-xs text-muted-foreground mt-1.5 leading-relaxed block">
          {helperText}
        </span>
      )}
    </div>
  );
};
