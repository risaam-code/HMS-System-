import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sparkles, Database, Layers, ArrowRight } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { ColumnDef } from '@/types';
import { useToast } from '@/components/ui/Toast';

export interface ModulePlaceholderProps<T extends Record<string, any>> {
  moduleId: string;
  title: string;
  subtitle: string;
  category: string;
  plannedFeatures: string[];
  previewData?: T[];
  previewColumns?: ColumnDef<T>[];
  searchKey?: string;
  actions?: React.ReactNode;
}

export function ModulePlaceholder<T extends Record<string, any>>({
  moduleId,
  title,
  subtitle,
  category,
  plannedFeatures,
  previewData,
  previewColumns,
  searchKey,
  actions,
}: ModulePlaceholderProps<T>) {
  const { info } = useToast();

  const handleSimulateAction = () => {
    info(
      `${title} module foundation is configured. Full CRUD and database mutations will be connected in Part 2.`,
      'Module Foundation Ready'
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        badge={
          <Badge variant="secondary" className="text-[11px] font-semibold">
            {category}
          </Badge>
        }
        actions={
          actions || (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSimulateAction}
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
            >
              Simulate Action
            </Button>
          )
        }
      />

      {/* Module Readiness Overview Banner */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/70 via-teal-50/40 to-white shadow-2xs">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Part 1 Architectural Foundation Complete
                </h3>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  route: /{moduleId}
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                This module route is registered with active breadcrumb resolution, responsive sidebar integration,
                and layout compliance. In Part 2, real Supabase PostgreSQL tables and mutation hooks will replace this preview state.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 shadow-2xs">
                <Database className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-medium">PostgreSQL Ready</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 shadow-2xs">
                <Layers className="h-3.5 w-3.5 text-teal-600" />
                <span className="font-medium">TanStack Query Ready</span>
              </div>
            </div>
          </div>

          {/* Planned Features Checklist */}
          <div className="mt-4 pt-4 border-t border-slate-200/60">
            <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Planned Scope for Part 2 Integration
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {plannedFeatures.map((feat, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs text-slate-700 bg-white/70 px-2.5 py-1.5 rounded-md border border-slate-200/50"
                >
                  <ArrowRight className="h-3 w-3 text-blue-500 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Foundation Preview Table */}
      {previewData && previewColumns && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{title} Data Directory (Foundation Preview)</CardTitle>
                <CardDescription>
                  Demonstrating reusable DataTable search, sort, pagination, and status badge handling
                </CardDescription>
              </div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Simulated Schema
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={previewData}
              columns={previewColumns}
              searchPlaceholder={`Filter ${title.toLowerCase()}...`}
              searchableKeys={searchKey ? [searchKey] : undefined}
              defaultPageSize={5}
              pageSizeOptions={[5, 10]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
