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
    premium-glass-card rounded-xl shadow-sm
    ${hoverEffect ? 'hover:scale-[1.01] hover:border-brand-500/30 hover:shadow-glow-brand' : ''}
    ${onClick ? 'cursor-pointer active:scale-95' : ''}
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
