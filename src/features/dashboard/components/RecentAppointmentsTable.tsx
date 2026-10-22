import React from 'react';
import { DataTable } from '@/components/common/DataTable';
import { ColumnDef, Appointment } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { getStatusColor, formatDateTime } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentAppointmentsTableProps {
  appointments: Appointment[];
}

export function RecentAppointmentsTable({
  appointments,
}: RecentAppointmentsTableProps) {
  const columns: ColumnDef<Appointment>[] = [
    {
      key: 'appointmentNumber',
      header: 'Appt #',
      sortable: true,
      render: (apt) => (
        <span className="font-mono font-semibold text-blue-600">
          {apt.appointmentNumber}
        </span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient Name',
      sortable: true,
      render: (apt) => (
        <div>
          <span className="font-semibold text-slate-900 block">{apt.patientName}</span>
          <span className="text-[10px] text-slate-400 font-mono">ID: {apt.patientId}</span>
        </div>
      ),
    },
    {
      key: 'doctorName',
      header: 'Attending Doctor',
      sortable: true,
      render: (apt) => (
        <div>
          <span className="font-medium text-slate-800 block">{apt.doctorName}</span>
          <span className="text-[11px] text-teal-700 font-medium">{apt.department}</span>
        </div>
      ),
    },
    {
      key: 'scheduledAt',
      header: 'Schedule Time',
      sortable: true,
      render: (apt) => (
        <span className="text-slate-600 font-medium">
          {formatDateTime(apt.scheduledAt)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (apt) => (
        <span className="capitalize text-slate-600">
          {apt.type.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (apt) => (
        <span
          className={`inline-flex items-center text-[11px] font-bold uppercase ${
            apt.priority === 'urgent'
              ? 'text-rose-600'
              : apt.priority === 'normal'
              ? 'text-slate-600'
              : 'text-slate-400'
          }`}
        >
          {apt.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (apt) => {
        const color = getStatusColor(apt.status);
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${color.bg} ${color.text} ${color.border}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
            <span className="capitalize">{apt.status.replace('_', ' ')}</span>
          </span>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Patient Consultations</CardTitle>
            <CardDescription>
              Live queue of registered patient check-ins and scheduled doctor appointments
            </CardDescription>
          </div>
          <Link
            to="/appointments"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>View All</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          data={appointments}
          columns={columns}
          searchPlaceholder="Filter recent appointments..."
          searchableKeys={['patientName', 'doctorName', 'appointmentNumber', 'department']}
          defaultPageSize={5}
          pageSizeOptions={[5, 10]}
        />
      </CardContent>
    </Card>
  );
}
