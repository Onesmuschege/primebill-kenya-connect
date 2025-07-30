
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  'aria-label'?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
  'aria-label': ariaLabel,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const finalAriaLabel = ariaLabel || text || 'Loading...';

  return (
    <div className="flex items-center gap-2" role="status" aria-label={finalAriaLabel}>
      <Loader2 
        className={cn('animate-spin', sizeClasses[size], className)} 
        aria-hidden="true"
      />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
      <span className="sr-only">{finalAriaLabel}</span>
    </div>
  );
};
