import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label ? (
        <label htmlFor={id} className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
          {label}
        </label>
      ) : null}
      
      <input
        id={id}
        className={`
          w-full glass-input px-4 py-2.5 text-sm placeholder-muted-foreground/50
          focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40
          transition-all duration-200
          ${error ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : 'border-border focus:ring-brand-500/40'}
        `}
        {...props}
      />
      
      {error ? (
        <span className="text-xs text-rose-500 font-medium tracking-wide animate-slide-up">
          {error}
        </span>
      ) : null}
    </div>
  );
};
