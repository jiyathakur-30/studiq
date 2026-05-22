import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'slate' | 'danger' | 'warning' | 'success' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  className = ''
}) => {
  const styles = {
    brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20',
    slate: 'bg-muted text-muted-foreground border-border',
    danger: 'bg-red-500/10 text-red-655 text-red-600 dark:text-red-400 border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    info: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
