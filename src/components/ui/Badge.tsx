import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-blue-50 text-blue-700 border border-blue-200/80',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
        danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
        destructive: 'bg-rose-50 text-rose-700 border border-rose-200/80',
        info: 'bg-sky-50 text-sky-700 border border-sky-200/80',
        secondary: 'bg-teal-50 text-teal-700 border border-teal-200/80',
        neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
        outline: 'border border-slate-300 text-slate-700 bg-white',
      },
      size: {
        sm: 'px-2 py-0.2 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  withDot?: boolean;
  size?: 'sm' | 'md' | 'lg' | any;
}

export function Badge({
  className,
  variant,
  size,
  withDot = false,
  children,
  ...props
}: BadgeProps) {
  const dotColor = {
    default: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    destructive: 'bg-rose-500',
    info: 'bg-sky-500',
    secondary: 'bg-teal-500',
    neutral: 'bg-slate-400',
    outline: 'bg-slate-400',
  }[variant || 'default'];

  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {withDot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor)}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </div>
  );
}
