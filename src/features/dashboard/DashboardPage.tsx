import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SetupModeBanner } from './components/SetupModeBanner';
import { MetricCard } from './components/MetricCard';
import { AppointmentsChart } from './components/AppointmentsChart';
import { RevenueChart } from './components/RevenueChart';
import { PatientTrendsChart } from './components/PatientTrendsChart';
import { RecentAppointmentsTable } from './components/RecentAppointmentsTable';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Download, Calendar } from 'lucide-react';
import {
  mockDashboardMetrics,
  mockAppointmentStats,
  mockRevenueStats,
  mockRegistrationTrends,
  mockRecentAppointments,
} from './mockData';
import { useToast } from '@/components/ui/Toast';

export function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { info, success } = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    info('Syncing hospital telemetry and appointments...', 'Live Sync');
    setTimeout(() => {
      setIsRefreshing(false);
      success('Dashboard data successfully updated.', 'Refreshed');
    }, 600);
  };

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Hospital Overview & Live Operations"
        subtitle="Real-time clinical metrics, inpatient census, laboratory throughput, and financial performance."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5 text-slate-500" />}
              onClick={handleExport}
              className="no-print"
            >
              Print Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={
                <RefreshCw
                  className={`h-3.5 w-3.5 text-slate-500 ${
                    isRefreshing ? 'animate-spin text-blue-600' : ''
                  }`}
                />
              }
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="no-print"
            >
              Refresh
            </Button>
          </>
        }
      />

      {/* Supabase Status Banner */}
      <SetupModeBanner />

      {/* 8 Primary Hospital Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockDashboardMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Primary Analytics Charts (2 columns on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AppointmentsChart data={mockAppointmentStats} />
        <RevenueChart data={mockRevenueStats} />
      </div>

      {/* Patient Trends Chart (Full width) */}
      <div>
        <PatientTrendsChart data={mockRegistrationTrends} />
      </div>

      {/* Live Recent Appointments Data Table */}
      <div>
        <RecentAppointmentsTable appointments={mockRecentAppointments} />
      </div>
    </div>
  );
}
