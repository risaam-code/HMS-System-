import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title = 'An error occurred',
  message,
  onRetry,
  className,
}: ErrorMessageProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-rose-900',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <h4 className="text-xs font-semibold text-rose-800">{title}</h4>
        <p className="text-xs text-rose-700 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          className="shrink-0 bg-white border-rose-300 text-rose-700 hover:bg-rose-50"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
