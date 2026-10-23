import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, TableFilterConfig } from '@/components/common/DataTable';
import { ColumnDef, Patient } from '@/types';
import { PatientService } from '@/services/patientService';
import { PatientRegistrationModal } from './PatientRegistrationModal';
import { PatientProfileModal, PatientProfileTab } from './PatientProfileModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { mockStore } from '@/services/mockHospitalStore';
import { getStatusColor, formatDate } from '@/lib/utils';
import {
  UserPlus,
  Users,
  BedDouble,
  AlertCircle,
  Archive,
  Edit2,
  Eye,
  Calendar,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PatientsPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<PatientProfileTab>('overview');
  const [archiveTarget, setArchiveTarget] = useState<Patient | null>(null);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const data = await PatientService.getPatients();
      setPatients(data);
    } catch (err) {
      toast({
        title: 'Error Loading Patients',
        message: 'Failed to retrieve records from the hospital patient registry.',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
    // Subscribe to store updates
    const unsubscribe = mockStore.subscribe(() => {
      PatientService.getPatients().then(setPatients);
    });
    return unsubscribe;
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = patients.length;
    const active = patients.filter((p) => p.status === 'active').length;
    const admitted = patients.filter((p) => p.status === 'admitted').length;
    const critical = patients.filter((p) => p.status === 'critical').length;
    return { total, active, admitted, critical };
  }, [patients]);

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    try {
      await PatientService.archivePatient(archiveTarget.id, 'Archived via Master Registry');
      toast({
        title: 'Patient Record Archived',
        message: `Patient ${archiveTarget.firstName} ${archiveTarget.lastName} (${archiveTarget.medicalRecordNumber}) has been archived safely.`,
        type: 'success',
      });
      loadPatients();
    } catch (err: any) {
      toast({
        title: 'Archival Failed',
        message: err.message || 'Could not archive patient record.',
        type: 'danger',
      });
    } finally {
      setArchiveTarget(null);
    }
  };

  const handlePatientSaved = (saved: Patient) => {
    toast({
      title: patientToEdit ? 'Patient Record Updated' : 'Patient Registered Successfully',
      message: `${saved.firstName} ${saved.lastName} (${saved.medicalRecordNumber}) is indexed in the Master Patient Index.`,
      type: 'success',
    });
    setPatientToEdit(null);
    loadPatients();
  };

  // Table Columns
  const columns: ColumnDef<Patient>[] = [
    {
      key: 'medicalRecordNumber',
      header: 'MRN #',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-blue-600 bg-blue-50/70 border border-blue-200 px-2 py-0.5 rounded text-xs">
          {p.medicalRecordNumber}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Patient Demographics',
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs">
            {p.firstName} {p.lastName}
          </span>
          <span className="text-[11px] text-slate-400 capitalize">
            {p.gender} • {p.age} yrs • Blood: {p.bloodGroup || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact Details',
      render: (p) => (
        <div className="text-xs">
          <span className="font-mono text-slate-700 block">{p.phone}</span>
          {p.email && <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">{p.email}</span>}
        </div>
      ),
    },
    {
      key: 'assignedDoctor',
      header: 'Attending Physician',
      sortable: true,
      render: (p) => (
        <span className="font-medium text-slate-700 text-xs">
          {p.assignedDoctor || <span className="text-slate-400 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      key: 'registrationDate',
      header: 'Intake Date',
      sortable: true,
      render: (p) => <span className="text-slate-500 text-xs font-mono">{formatDate(p.registrationDate)}</span>,
    },
    {
      key: 'status',
      header: 'Hospital Status',
      sortable: true,
      render: (p) => {
        const color = getStatusColor(p.status);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${color.bg} ${color.text} ${color.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
            <span className="capitalize">{p.status}</span>
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="View Complete Profile (9 Tabs)"
            onClick={() => {
              setSelectedPatient(p);
              setActiveProfileTab('overview');
            }}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {hasPermission('patients:edit') && (
            <button
              type="button"
              title="Edit Demographics"
              onClick={() => {
                setPatientToEdit(p);
                setIsRegisterOpen(true);
              }}
              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {hasPermission('patients:delete') && p.status !== 'archived' && (
            <button
              type="button"
              title="Archive Patient"
              onClick={() => setArchiveTarget(p)}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filters: TableFilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active Outpatient', value: 'active' },
        { label: 'Inpatient Admitted', value: 'admitted' },
        { label: 'Critical Care', value: 'critical' },
        { label: 'Archived File', value: 'archived' },
      ],
    },
    {
      key: 'gender',
      label: 'Gender',
      options: [
        { label: 'Female', value: 'female' },
        { label: 'Male', value: 'male' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      key: 'bloodGroup',
      label: 'Blood Group',
      options: [
        { label: 'O Positive (O+)', value: 'O+' },
        { label: 'A Positive (A+)', value: 'A+' },
        { label: 'B Positive (B+)', value: 'B+' },
        { label: 'AB Positive (AB+)', value: 'AB+' },
        { label: 'O Negative (O-)', value: 'O-' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Patient Management & Master Patient Index (MPI)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Centralized electronic patient demographics, auto-generated MRNs, duplicate detection, and tabbed medical records.
          </p>
        </div>

        {hasPermission('patients:create') && (
          <Button
            variant="primary"
            size="sm"
            className="h-10 sm:h-9 px-4 text-xs font-semibold justify-center w-full sm:w-auto"
            onClick={() => {
              setPatientToEdit(null);
              setIsRegisterOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Register New Patient
          </Button>
        )}
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Registered</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{metrics.total}</div>
          <span className="text-[10px] text-slate-400">Master Index Total</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active Outpatients</span>
            <HeartPulse className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-xl font-bold text-teal-700 dark:text-teal-400 mt-1">{metrics.active}</div>
          <span className="text-[10px] text-teal-600 dark:text-teal-400">Ambulatory care</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Inpatient Admitted</span>
            <BedDouble className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">{metrics.admitted}</div>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Ward bed census</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Critical Care</span>
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">{metrics.critical}</div>
          <span className="text-[10px] text-rose-600 dark:text-rose-400">ICU monitoring</span>
        </div>
      </div>

      {/* Patients Data Table */}
      <DataTable
        data={patients}
        columns={columns}
        searchPlaceholder="Search by MRN, patient name, phone, or email..."
        searchableKeys={['firstName', 'lastName', 'medicalRecordNumber', 'phone', 'email']}
        filters={filters}
        isLoading={isLoading}
        onRowClick={(patient) => {
          setSelectedPatient(patient);
          setActiveProfileTab('overview');
        }}
        emptyTitle="No Patients Found"
        emptyDescription="No patient records matched the specified filter criteria or search query."
        emptyActionLabel="Register First Patient"
        onEmptyAction={() => {
          setPatientToEdit(null);
          setIsRegisterOpen(true);
        }}
      />

      {/* Patient Registration & Edit Modal */}
      <PatientRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          setPatientToEdit(null);
        }}
        onSuccess={handlePatientSaved}
        patientToEdit={patientToEdit}
      />

      {/* Patient Profile 9-Tab Detail Modal */}
      <PatientProfileModal
        isOpen={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        patient={selectedPatient}
        initialTab={activeProfileTab}
        onEditPatient={(p) => {
          setSelectedPatient(null);
          setPatientToEdit(p);
          setIsRegisterOpen(true);
        }}
        onBookAppointment={(p) => {
          setSelectedPatient(null);
          navigate('/appointments', { state: { preselectedPatientId: p.id } });
        }}
        onStartConsultation={(p) => {
          setSelectedPatient(null);
          navigate('/outpatient', { state: { preselectedPatientId: p.id } });
        }}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
        title="Archive Patient File"
        message={`Are you sure you want to archive ${archiveTarget?.firstName} ${archiveTarget?.lastName} (${archiveTarget?.medicalRecordNumber})? Historical visits and appointments will be safely retained in compliance with healthcare data retention laws.`}
        confirmLabel="Archive File"
        variant="danger"
      />
    </div>
  );
}
