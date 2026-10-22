import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, TableFilterConfig } from '@/components/common/DataTable';
import { ColumnDef, OutpatientVisit, OutpatientVisitStatus } from '@/types';
import { OutpatientService } from '@/services/outpatientService';
import { OutpatientIntakeModal } from './OutpatientIntakeModal';
import { OutpatientEncounterDrawer } from './OutpatientEncounterDrawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { mockStore } from '@/services/mockHospitalStore';
import { useLocation } from 'react-router-dom';
import {
  Stethoscope,
  Ticket,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Activity,
  HeartPulse,
} from 'lucide-react';

export function OutpatientPage() {
  const { toast } = useToast();
  const location = useLocation();

  const [visits, setVisits] = useState<OutpatientVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<OutpatientVisit | null>(null);

  const preselectedPatientId = (location.state as any)?.preselectedPatientId;
  const linkedAppointmentId = (location.state as any)?.linkedAppointmentId;

  const loadVisits = async () => {
    setIsLoading(true);
    try {
      const data = await OutpatientService.getVisits();
      setVisits(data);
    } catch {
      toast({
        title: 'Error Loading OPD Queue',
        message: 'Failed to retrieve outpatient queue from database.',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
    if (preselectedPatientId || linkedAppointmentId) {
      setIsIntakeOpen(true);
    }
    const unsub = mockStore.subscribe(() => {
      OutpatientService.getVisits().then(setVisits);
    });
    return unsub;
  }, [preselectedPatientId, linkedAppointmentId]);

  // Metrics
  const metrics = useMemo(() => {
    const total = visits.length;
    const waiting = visits.filter((v) => v.status === 'Registered' || v.status === 'Checked In').length;
    const inConsult = visits.filter((v) => v.status === 'In Consultation').length;
    const completed = visits.filter((v) => v.status === 'Completed').length;
    return { total, waiting, inConsult, completed };
  }, [visits]);

  const handleIntakeSuccess = (visit: OutpatientVisit) => {
    toast({
      title: 'Outpatient Token Issued',
      message: `Token ${visit.queueToken} issued to ${visit.patientName}. Assigned to ${visit.doctorName}.`,
      type: 'success',
    });
    setIsIntakeOpen(false);
    loadVisits();
  };

  const columns: ColumnDef<OutpatientVisit>[] = [
    {
      key: 'queueToken',
      header: 'Queue Token',
      sortable: true,
      render: (v) => (
        <span className="font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded text-xs">
          {v.queueToken}
        </span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient Details',
      sortable: true,
      render: (v) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{v.patientName}</span>
          <span className="text-[11px] font-mono text-slate-400">
            {v.patientMrn} {v.isWalkIn ? '• Walk-in' : '• Pre-booked'}
          </span>
        </div>
      ),
    },
    {
      key: 'doctorName',
      header: 'Attending Physician & Clinic',
      sortable: true,
      render: (v) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{v.doctorName}</span>
          <span className="text-[11px] text-teal-700 font-medium">{v.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Triage Level',
      sortable: true,
      render: (v) => {
        const isStat = v.priority === 'STAT';
        const isUrgent = v.priority === 'Urgent';
        return (
          <span
            className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              isStat
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : isUrgent
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {v.priority}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Workflow Stage (11 Steps)',
      sortable: true,
      render: (v) => {
        let variant: 'info' | 'success' | 'warning' | 'default' = 'info';
        if (v.status === 'Completed') variant = 'success';
        if (v.status === 'In Consultation') variant = 'warning';
        return <Badge variant={variant}>{v.status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Workflow Actions',
      render: (v) => (
        <button
          type="button"
          onClick={() => setSelectedVisit(v)}
          className="px-2 py-1 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded hover:bg-teal-100 flex items-center gap-1"
        >
          <Activity className="w-3.5 h-3.5" /> Manage Encounter
        </button>
      ),
    },
  ];

  const filters: TableFilterConfig[] = [
    {
      key: 'status',
      label: 'Stage',
      options: [
        { label: 'Registered', value: 'Registered' },
        { label: 'Checked In', value: 'Checked In' },
        { label: 'In Consultation', value: 'In Consultation' },
        { label: 'Completed', value: 'Completed' },
      ],
    },
    {
      key: 'priority',
      label: 'Triage Priority',
      options: [
        { label: 'Routine', value: 'Routine' },
        { label: 'Urgent', value: 'Urgent' },
        { label: 'STAT', value: 'STAT' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Outpatient Department (OPD) Clinical Encounters
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete 11-step outpatient workflow: Intake & Tokens, Triage Vitals, Physician Notes, Lab Orders, Prescriptions, Billing & Discharge.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsIntakeOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" /> New OPD Patient Intake
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total OPD Tokens</span>
            <Ticket className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{metrics.total}</div>
          <span className="text-[10px] text-slate-400">Issued today</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>In Waiting Room</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1">{metrics.waiting}</div>
          <span className="text-[10px] text-amber-600">Awaiting consultation</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>In Consultation</span>
            <Stethoscope className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-indigo-700 mt-1">{metrics.inConsult}</div>
          <span className="text-[10px] text-indigo-600">Active clinic examination</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Encounter Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{metrics.completed}</div>
          <span className="text-[10px] text-emerald-600">Billed and discharged</span>
        </div>
      </div>

      {/* Queue Data Table */}
      <DataTable
        data={visits}
        columns={columns}
        searchPlaceholder="Search OPD queue by token, patient name, MRN, or doctor..."
        searchableKeys={['queueToken', 'patientName', 'patientMrn', 'doctorName', 'departmentName']}
        filters={filters}
        isLoading={isLoading}
        onRowClick={(v) => setSelectedVisit(v)}
        emptyTitle="OPD Queue Empty"
        emptyDescription="No patients are currently queued in the outpatient waiting area."
        emptyActionLabel="Intake Walk-in Patient"
        onEmptyAction={() => setIsIntakeOpen(true)}
      />

      {/* Intake Modal */}
      <OutpatientIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onSuccess={handleIntakeSuccess}
        preselectedPatientId={preselectedPatientId}
        linkedAppointmentId={linkedAppointmentId}
      />

      {/* 11-Step Clinical Journey Drawer */}
      <OutpatientEncounterDrawer
        isOpen={Boolean(selectedVisit)}
        onClose={() => setSelectedVisit(null)}
        visit={selectedVisit}
        onVisitUpdated={(updated) => {
          setSelectedVisit(updated);
          loadVisits();
        }}
      />
    </div>
  );
}
