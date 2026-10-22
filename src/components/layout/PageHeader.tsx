import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  showBreadcrumbs?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  showBreadcrumbs = true,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {showBreadcrumbs && <Breadcrumbs />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
