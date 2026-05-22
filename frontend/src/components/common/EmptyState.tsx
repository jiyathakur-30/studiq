import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <Card hoverEffect={false} className="flex flex-col items-center justify-center text-center py-12 px-6 border border-dashed border-border bg-muted/10">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted border border-border text-brand-400 mb-4 shadow-sm">
        {icon}
      </div>
      
      <h3 className="font-sans font-semibold text-base text-foreground mb-1">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      
      {actionText && onAction ? (
        <Button onClick={onAction} variant="secondary" size="sm">
          {actionText}
        </Button>
      ) : null}
    </Card>
  );
};
