import React from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  BedDouble,
  FlaskConical,
  Pill,
  DollarSign,
  FileWarning,
  TrendingUp,
  TrendingDown,
  Minus,
  LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { DashboardMetric } from '@/types';

const iconMap: Record<string, LucideIcon> = {
  Users,
  UserCheck,
  Calendar,
  BedDouble,
  FlaskConical,
  Pill,
  DollarSign,
  FileWarning,
};

const variantStyles: Record<
  DashboardMetric['variant'],
  {
    iconBg: string;
    iconColor: string;
    cardBorder: string;
    subtleRing: string;
  }
> = {
  blue: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    cardBorder: 'hover:border-blue-300',
    subtleRing: 'group-hover:ring-blue-100',
  },
  teal: {
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    cardBorder: 'hover:border-teal-300',
    subtleRing: 'group-hover:ring-teal-100',
  },
  cyan: {
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    cardBorder: 'hover:border-cyan-300',
    subtleRing: 'group-hover:ring-cyan-100',
  },
  indigo: {
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    cardBorder: 'hover:border-indigo-300',
    subtleRing: 'group-hover:ring-indigo-100',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    cardBorder: 'hover:border-amber-300',
    subtleRing: 'group-hover:ring-amber-100',
  },
  rose: {
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    cardBorder: 'hover:border-rose-300',
    subtleRing: 'group-hover:ring-rose-100',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    cardBorder: 'hover:border-emerald-300',
    subtleRing: 'group-hover:ring-emerald-100',
  },
  violet: {
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    cardBorder: 'hover:border-violet-300',
    subtleRing: 'group-hover:ring-violet-100',
  },
};

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const IconComponent = iconMap[metric.icon] || Users;
  const style = variantStyles[metric.variant] || variantStyles.blue;

  return (
    <Card
      className={cn(
        'group transition-all duration-200 hover:shadow-md border-slate-200/90',
        style.cardBorder
      )}
      title={metric.tooltip}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-tight truncate">
            {metric.title}
          </span>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all',
              style.iconBg,
              style.iconColor
            )}
          >
            <IconComponent className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {metric.value}
          </span>
        </div>

        {metric.change && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold text-[11px]',
                metric.change.trend === 'up' && 'bg-emerald-50 text-emerald-700',
                metric.change.trend === 'down' && 'bg-rose-50 text-rose-700',
                metric.change.trend === 'neutral' && 'bg-slate-100 text-slate-600'
              )}
            >
              {metric.change.trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {metric.change.trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {metric.change.trend === 'neutral' && <Minus className="h-3 w-3" />}
              <span>{Math.abs(metric.change.value)}%</span>
            </span>
            <span className="text-slate-400 text-[11px] truncate">
              {metric.change.timeframe}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
