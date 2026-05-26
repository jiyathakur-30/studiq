import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
  delay?: number;
  id?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  onClick,
  delay = 0,
  id
}) => {
  const motionProps = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: delay * 0.05, ease: [0.16, 1, 0.3, 1] as number[] }
  };

  const cardStyles = `
    premium-glass-card rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/5
    ${hoverEffect ? 'hover:scale-[1.005] hover:border-slate-300 dark:hover:border-white/10 hover:shadow-md' : ''}
    ${onClick ? 'cursor-pointer active:scale-98' : ''}
    transition-all duration-300 ${className}
  `;

  if (onClick) {
    return (
      <motion.div
        {...motionProps}
        onClick={onClick}
        className={cardStyles}
        id={id}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      {...motionProps}
      className={cardStyles}
      id={id}
    >
      {children}
    </motion.div>
  );
};
