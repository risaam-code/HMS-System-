import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, TableFilterConfig } from '@/components/common/DataTable';
import { ColumnDef, Appointment, AppointmentStatus, Patient } from '@/types';
import { AppointmentService } from '@/services/appointmentService';
import { PatientService } from '@/services/patientService';
import { BookAppointmentModal } from './BookAppointmentModal';
import { AppointmentCalendarView } from './AppointmentCalendarView';
import { PatientProfileModal } from '@/features/patients/PatientProfileModal';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { mockStore } from '@/services/mockHospitalStore';
import { getStatusColor, formatDate } from '@/lib/utils';
import {
  Calendar,
  Clock,
  PlusCircle,
  Table as TableIcon,
  CalendarDays,
  CheckCircle2,
  Play,
  Check,
  XCircle,
  AlertCircle,
  Edit2,
  User,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function AppointmentsPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [patientForProfile, setPatientForProfile] = useState<Patient | null>(null);

  // Cancellation Modal state
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Reschedule Modal state
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [rescheduleConflict, setRescheduleConflict] = useState<string | null>(null);

  const preselectedPatientId = (location.state as any)?.preselectedPatientId;
  const preselectedDoctorId = (location.state as any)?.preselectedDoctorId;

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await AppointmentService.getAppointments();
      setAppointments(data);
    } catch {
      toast({
        title: 'Error Loading Schedule',
        message: 'Failed to retrieve appointments from the database.',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    if (preselectedPatientId || preselectedDoctorId) {
      setIsBookModalOpen(true);
    }
    const unsub = mockStore.subscribe(() => {
      AppointmentService.getAppointments().then(setAppointments);
    });
    return unsub;
  }, [preselectedPatientId, preselectedDoctorId]);

  // Metrics
  const metrics = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((a) => a.status === 'Scheduled' || a.status === 'Confirmed').length;
    const inProgress = appointments.filter((a) => a.status === 'In Progress').length;
    const completed = appointments.filter((a) => a.status === 'Completed').length;
    return { total, scheduled, inProgress, completed };
  }, [appointments]);

  // Quick Status Transitions
  const handleStatusTransition = async (apt: Appointment, nextStatus: AppointmentStatus) => {
    try {
      await AppointmentService.updateStatus(apt.id, nextStatus);
      toast({
        title: `Appointment ${nextStatus}`,
        message: `Consultation ${apt.appointmentNumber} for ${apt.patientName} marked as ${nextStatus}.`,
        type: 'success',
      });
      loadAppointments();
    } catch (err: any) {
      toast({
        title: 'Status Update Failed',
        message: err.message,
        type: 'danger',
      });
    }
  };

  // Open Patient Profile
  const handleOpenPatientProfile = async (patientId: string) => {
    const p = await PatientService.getPatientById(patientId);
    if (p) {
      setPatientForProfile(p);
    }
  };

  // Confirm Cancellation
  const handleConfirmCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) {
      toast({
        title: 'Validation Error',
        message: 'Mandatory cancellation reason is required.',
        type: 'danger',
      });
      return;
    }

    try {
      await AppointmentService.updateStatus(cancelTarget.id, 'Cancelled', {
        cancellationReason: cancelReason.trim(),
      });
      toast({
        title: 'Appointment Cancelled',
        message: `Appointment ${cancelTarget.appointmentNumber} has been cancelled.`,
        type: 'success',
      });
      setCancelTarget(null);
      setCancelReason('');
      loadAppointments();
    } catch (err: any) {
      toast({
        title: 'Cancellation Failed',
        message: err.message,
        type: 'danger',
      });
    }
  };

  // Check Reschedule Conflict in real time
  useEffect(() => {
    if (!rescheduleTarget || !newDate || !newStartTime || !newEndTime) {
      setRescheduleConflict(null);
      return;
    }

    const timer = setTimeout(async () => {
      const conflict = await AppointmentService.checkDoctorSlotConflict({
        doctorId: rescheduleTarget.doctorId,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        excludeAppointmentId: rescheduleTarget.id,
      });

      if (conflict.hasConflict) {
        setRescheduleConflict(conflict.reason || 'Doctor is booked during this time.');
      } else {
        setRescheduleConflict(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [rescheduleTarget, newDate, newStartTime, newEndTime]);

  // Confirm Reschedule
  const handleConfirmReschedule = async () => {
    if (!rescheduleTarget || !newDate || !newStartTime || !newEndTime) return;
    try {
      await AppointmentService.rescheduleAppointment(rescheduleTarget.id, {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        reason: 'Staff reschedule request',
      });
      toast({
        title: 'Appointment Rescheduled',
        message: `New slot confirmed: ${newDate} from ${newStartTime} to ${newEndTime}.`,
        type: 'success',
      });
      setRescheduleTarget(null);
      loadAppointments();
    } catch (err: any) {
      setRescheduleConflict(err.message);
    }
  };

  // Table Columns
  const columns: ColumnDef<Appointment>[] = [
    {
      key: 'appointmentNumber',
      header: 'Appt #',
      sortable: true,
      render: (apt) => (
        <span className="font-mono font-bold text-blue-600 bg-blue-50/70 border border-blue-200 px-2 py-0.5 rounded text-xs">
          {apt.appointmentNumber}
        </span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient Details',
      sortable: true,
      render: (apt) => (
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPatientProfile(apt.patientId);
            }}
            className="font-bold text-slate-900 hover:text-blue-600 hover:underline block text-xs text-left"
          >
            {apt.patientName}
          </button>
          <span className="text-[11px] font-mono text-slate-400">
            {apt.patientMrn || apt.patientId} • {apt.patientPhone || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'doctorName',
      header: 'Attending Doctor & Specialty',
      sortable: true,
      render: (apt) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{apt.doctorName}</span>
          <span className="text-[11px] text-teal-700 font-medium">{apt.department}</span>
        </div>
      ),
    },
    {
      key: 'timeSlot',
      header: 'Consultation Time',
      sortable: true,
      render: (apt) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 block">{apt.date}</span>
          <span className="font-mono text-slate-500 text-[11px]">
            {apt.startTime} - {apt.endTime}
          </span>
        </div>
      ),
    },
    {
      key: 'visitReason',
      header: 'Reason for Visit',
      render: (apt) => (
        <div className="text-xs text-slate-600 max-w-[180px]">
          <span className="line-clamp-1 font-medium">{apt.visitReason}</span>
          <span className="text-[10px] text-slate-400 capitalize">{apt.type.replace('_', ' ')} ({apt.priority})</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (apt) => {
        const color = getStatusColor(apt.status);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${color.bg} ${color.text} ${color.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
            <span>{apt.status}</span>
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Workflow Actions',
      render: (apt) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Status Step Transitions */}
          {apt.status === 'Scheduled' && (
            <button
              type="button"
              title="Confirm Appointment"
              onClick={() => handleStatusTransition(apt, 'Confirmed')}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}

          {(apt.status === 'Scheduled' || apt.status === 'Confirmed') && (
            <button
              type="button"
              title="Check In Patient"
              onClick={() => handleStatusTransition(apt, 'Checked In')}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 rounded hover:bg-teal-100"
            >
              Check In
            </button>
          )}

          {apt.status === 'Checked In' && (
            <button
              type="button"
              title="Start Clinical Consultation (OPD / EMR)"
              onClick={() => {
                handleStatusTransition(apt, 'In Progress');
                navigate('/outpatient', { state: { linkedAppointmentId: apt.id, patientId: apt.patientId } });
              }}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-100 flex items-center gap-1"
            >
              <Play className="w-2.5 h-2.5" /> Consult
            </button>
          )}

          {apt.status === 'In Progress' && (
            <button
              type="button"
              title="Complete Consultation"
              onClick={() => handleStatusTransition(apt, 'Completed')}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100"
            >
              Complete
            </button>
          )}

          {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
            <>
              <button
                type="button"
                title="Reschedule Appointment"
                onClick={() => {
                  setRescheduleTarget(apt);
                  setNewDate(apt.date);
                  setNewStartTime(apt.startTime);
                  setNewEndTime(apt.endTime);
                }}
                className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Cancel Appointment"
                onClick={() => {
                  setCancelTarget(apt);
                  setCancelReason('');
                }}
                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
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
        { label: 'Scheduled', value: 'Scheduled' },
        { label: 'Confirmed', value: 'Confirmed' },
        { label: 'Checked In', value: 'Checked In' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Cancelled', value: 'Cancelled' },
        { label: 'No Show', value: 'No Show' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Appointment Management & Doctor Scheduling
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Book consultations, track patient check-ins, manage cancellations, and prevent physician double-booking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {/* Table / Calendar Toggle */}
          <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all h-8 ${viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all h-8 ${viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}

            >
              <CalendarDays className="w-3.5 h-3.5" /> Calendar View
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="h-10 sm:h-9 px-4 text-xs font-semibold justify-center w-full sm:w-auto"
            onClick={() => setIsBookModalOpen(true)}
          >
            <PlusCircle className="w-4 h-4 mr-1.5" /> Book Appointment
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Bookings</span>
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{metrics.total}</div>
          <span className="text-[10px] text-slate-400">All registered slots</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Upcoming / Confirmed</span>
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-xl font-bold text-teal-700 dark:text-teal-400 mt-1">{metrics.scheduled}</div>
          <span className="text-[10px] text-teal-600 dark:text-teal-400">Pending consultation</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>In Consultation</span>
            <Play className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">{metrics.inProgress}</div>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Active with doctor</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{metrics.completed}</div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Discharged visits</span>
        </div>
      </div>

      {/* View Switcher Output */}
      {viewMode === 'table' ? (
        <DataTable
          data={appointments}
          columns={columns}
          searchPlaceholder="Search appointments by patient, doctor, department, or reason..."
          searchableKeys={['patientName', 'doctorName', 'department', 'appointmentNumber', 'visitReason']}
          filters={filters}
          isLoading={isLoading}
          onRowClick={(apt) => setSelectedAppointment(apt)}
          emptyTitle="No Appointments Scheduled"
          emptyDescription="No appointments match the current filter selection."
          emptyActionLabel="Schedule First Appointment"
          onEmptyAction={() => setIsBookModalOpen(true)}
        />
      ) : (
        <AppointmentCalendarView
          appointments={appointments}
          onSelectAppointment={(apt) => setSelectedAppointment(apt)}
          onBookSlot={(date, time) => {
            setIsBookModalOpen(true);
          }}
        />
      )}

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={(apt) => {
          toast({
            title: 'Appointment Confirmed',
            message: `Booked ${apt.appointmentNumber} for ${apt.patientName} with ${apt.doctorName}.`,
            type: 'success',
          });
          loadAppointments();
        }}
        preselectedPatientId={preselectedPatientId}
        preselectedDoctorId={preselectedDoctorId}
      />

      {/* Cancellation Dialog with Mandatory Reason */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel Patient Appointment"
        size="md"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            You are cancelling consultation <strong>{cancelTarget?.appointmentNumber}</strong> for{' '}
            <strong>{cancelTarget?.patientName}</strong> scheduled with{' '}
            <strong>{cancelTarget?.doctorName}</strong> on {cancelTarget?.date} at {cancelTarget?.startTime}.
          </p>

          <Input
            label="Mandatory Cancellation Reason (Audit Logged)"
            placeholder="e.g. Patient requested cancellation, doctor emergency call"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setCancelTarget(null)}>
              Abort
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmCancel} disabled={!cancelReason.trim()}>
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal with Overlap Check */}
      <Modal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Appointment Slot"
        size="md"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Rescheduling consultation <strong>{rescheduleTarget?.appointmentNumber}</strong> for{' '}
            <strong>{rescheduleTarget?.patientName}</strong> with {rescheduleTarget?.doctorName}.
          </p>

          {rescheduleConflict && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{rescheduleConflict}</span>
            </div>
          )}

          <Input
            label="New Date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              value={newStartTime}
              onChange={(e) => setNewStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmReschedule}
              disabled={Boolean(rescheduleConflict)}
            >
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Patient Profile Modal Shortcut */}
      <PatientProfileModal
        isOpen={Boolean(patientForProfile)}
        onClose={() => setPatientForProfile(null)}
        patient={patientForProfile}
      />
    </div>
  );
}
