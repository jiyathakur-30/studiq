import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect'
}) => {
  const styles = {
    text: 'h-4 w-3/4 rounded',
    rect: 'h-24 w-full rounded-lg',
    circle: 'h-12 w-12 rounded-full'
  };

  return (
    <div
      className={`
        animate-pulse bg-muted border border-border/20
        ${styles[variant]}
        ${className}
      `}
    />
  );
};
