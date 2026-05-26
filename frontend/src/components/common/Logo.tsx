import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  iconOnly = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: {
      container: 'gap-2',
      icon: 'h-6 w-6',
      text: 'text-sm'
    },
    md: {
      container: 'gap-2.5',
      icon: 'h-8 w-8',
      text: 'text-lg'
    },
    lg: {
      container: 'gap-3.5',
      icon: 'h-12 w-12',
      text: 'text-2xl'
    }
  };

  const currentSize = sizeClasses[size];
  
  // Create a unique id for this logo instance to prevent SVG gradient conflicts in browser cache
  const uniqueId = useId().replace(/:/g, '');
  const topGradId = `studiq-logo-grad-top-${uniqueId}`;
  const botGradId = `studiq-logo-grad-bot-${uniqueId}`;

  return (
    <div className={`flex items-center ${currentSize.container} group select-none ${className}`}>
      {/* Icon Wrapper with Subtle Atmospheric Glow */}
      <div className={`relative flex-shrink-0 ${currentSize.icon}`}>
        {/* Soft crisp background aura - extremely subtle and clean */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-500 via-indigo-500 to-cyan-500 rounded-lg blur-md opacity-10 group-hover:opacity-20 transition-all duration-300 ease-out" />
        
        {/* Premium Lightweight Geometric SVG */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full h-full transition-transform duration-300 ease-out group-hover:scale-103"
        >
          <defs>
            <linearGradient id={topGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" /> {/* purple-400 */}
              <stop offset="100%" stopColor="#6366f1" /> {/* indigo-500 */}
            </linearGradient>
            <linearGradient id={botGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" /> {/* indigo-500 */}
              <stop offset="100%" stopColor="#22d3ee" /> {/* cyan-400 */}
            </linearGradient>
          </defs>

          {/* Top Geometric Segment - Perfectly Symmetrical & Razor Sharp */}
          <path
            d="M72 23 H40 L28 47 H47"
            stroke={`url(#${topGradId})`}
            strokeWidth="11"
            strokeLinecap="butt"
            strokeLinejoin="miter"
            className="transition-colors duration-300"
          />

          {/* Bottom Geometric Segment - Perfectly Symmetrical & Razor Sharp */}
          <path
            d="M53 53 H72 L60 77 H28"
            stroke={`url(#${botGradId})`}
            strokeWidth="11"
            strokeLinecap="butt"
            strokeLinejoin="miter"
            className="transition-colors duration-300"
          />

          {/* Core Symmetrical Focus Pulsar */}
          <circle
            cx="50"
            cy="50"
            r="3"
            fill="#38bdf8"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Brand Text (Hidden in iconOnly mode) */}
      {!iconOnly && (
        <span className={`font-sans font-black tracking-tight text-foreground ${currentSize.text} leading-none transition-colors duration-300 group-hover:text-brand-400 select-none glow-text`}>
          STUDIQ
        </span>
      )}
    </div>
  );
};

