import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  align?: 'left' | 'center';
  size?: 'sm' | 'md' | 'lg';
  showMockGraph?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  align = 'center',
  size = 'md',
  showMockGraph = false,
  className = '',
  children
}) => {
  const isLeft = align === 'left';
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  // Sizing styles configuration
  const paddingStyle = isSm 
    ? 'p-4' 
    : isLg 
      ? 'p-6 sm:p-10' 
      : 'p-5 sm:p-6';

  const spacingStyle = isSm 
    ? 'space-y-3' 
    : isLg 
      ? 'space-y-5' 
      : 'space-y-4';

  const containerClasses = `
    w-full relative overflow-hidden backdrop-blur-sm transition-all duration-300
    border border-black/[0.06] dark:border-white/[0.06] bg-card/30
    shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]
    ${isLeft ? 'items-start text-left' : 'items-center text-center'}
    ${isSm ? 'rounded-xl' : 'rounded-2xl'}
    ${paddingStyle}
    ${spacingStyle}
    ${className}
  `;

  const iconWrapperClasses = `
    flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105
    rounded-xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 text-brand-500
    ${isLeft ? '' : 'mx-auto'}
    ${isSm ? 'h-9 w-9 text-xs' : isLg ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'}
  `;

  const titleClasses = `
    font-sans font-black tracking-tight text-foreground leading-tight
    ${isSm ? 'text-xs' : isLg ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'}
  `;

  const descClasses = `
    text-muted-foreground leading-relaxed font-medium
    ${isLeft ? '' : 'mx-auto'}
    ${isSm ? 'text-[11px] max-w-xs' : isLg ? 'text-xs sm:text-sm max-w-lg' : 'text-xs max-w-sm'}
  `;

  return (
    <Card hoverEffect={false} className={containerClasses}>
      {/* Background Soft Accent Gradient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.03] to-transparent pointer-events-none" />
      <div className={`absolute top-0 w-32 h-32 bg-brand-500/[0.03] dark:bg-brand-500/[0.05] rounded-full blur-2xl pointer-events-none select-none ${isLeft ? 'right-0' : 'left-1/2 -translate-x-1/2'}`} />

      {/* Subtle Texture Mockup Graph Wireframe */}
      {showMockGraph && (
        <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none select-none overflow-hidden opacity-[0.035] dark:opacity-[0.06] transition-opacity duration-300">
          <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
            <line x1="0" y1="20" x2="400" y2="20" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
            <line x1="0" y1="50" x2="400" y2="50" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2="400" y2="80" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
            <path
              d="M 0 85 Q 50 65 100 75 T 200 45 T 300 55 T 400 25"
              fill="none"
              stroke="var(--color-primary, currentColor)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="100" cy="75" r="2.5" fill="var(--color-primary, currentColor)" />
            <circle cx="200" cy="45" r="2.5" fill="var(--color-primary, currentColor)" />
            <circle cx="300" cy="55" r="2.5" fill="var(--color-primary, currentColor)" />
          </svg>
        </div>
      )}

      {/* Main Content Layout */}
      <div className={`w-full flex relative z-10 ${isLeft ? 'flex-row items-center gap-4' : 'flex-col gap-3'}`}>
        {icon && (
          <div className={iconWrapperClasses}>
            {icon}
          </div>
        )}

        <div className="flex-1 space-y-1">
          <h3 className={titleClasses}>
            {title}
          </h3>
          <p className={descClasses}>
            {description}
          </p>
        </div>
      </div>

      {/* Optional Children slot for skeletal rows, etc. */}
      {children && (
        <div className="w-full relative z-10 animate-fade-in">
          {children}
        </div>
      )}

      {/* Unified Thumb-Friendly CTA Button (Enforcing min 44px height via sizing and styles) */}
      {actionText && onAction && (
        <div className={`pt-1 flex relative z-10 ${isLeft ? 'justify-start' : 'justify-center'}`}>
          <Button 
            onClick={onAction} 
            variant="secondary"
            className="h-11 px-5 rounded-xl font-extrabold text-xs shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
          >
            {actionText}
          </Button>
        </div>
      )}
    </Card>
  );
};
