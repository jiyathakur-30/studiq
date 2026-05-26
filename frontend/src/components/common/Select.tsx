import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string | number;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  error,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find active option label
  const activeOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`flex flex-col gap-1.5 w-full text-left relative ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`
            w-full h-11 px-4 flex items-center justify-between text-sm rounded-xl
            bg-card/70 border border-black/[0.06] dark:border-white/[0.08]
            hover:border-black/[0.09] dark:hover:border-white/[0.12]
            shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]
            transition-all duration-200 ease-out text-foreground
            focus:outline-none focus:border-brand-500/30 focus:ring-4 focus:ring-brand-500/10
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500/40 focus:border-red-500/50 focus:ring-red-500/10' : ''}
            ${isOpen ? 'border-brand-500/30 ring-4 ring-brand-500/10' : ''}
          `}
        >
          <span className={activeOption ? 'text-foreground' : 'text-muted-foreground/60'}>
            {activeOption ? activeOption.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`text-muted-foreground/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.14 }}
              className="absolute z-50 w-full mt-1.5 left-0 rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-card/95 backdrop-blur-md shadow-2xl p-1 max-h-60 overflow-y-auto"
            >
              {options.length > 0 ? (
                options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-150
                        ${isSelected ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium' : 'hover:bg-brand-500/[0.06] text-foreground'}
                      `}
                    >
                      {opt.label}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                  No options available
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <span className="text-xs text-red-500 font-medium tracking-wide animate-slide-up mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};
