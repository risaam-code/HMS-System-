import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { appointmentBookingSchema, AppointmentBookingData } from '@/schemas/appointment';
import { AppointmentService } from '@/services/appointmentService';
import { PatientService } from '@/services/patientService';
import { DoctorService } from '@/services/doctorService';
import { Patient, Doctor, Appointment } from '@/types';
import { AlertCircle, Calendar, Clock, UserCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
  preselectedPatientId?: string;
  preselectedDoctorId?: string;
}

export function BookAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedPatientId,
  preselectedDoctorId,
}: BookAppointmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AppointmentBookingData>({
    resolver: zodResolver(appointmentBookingSchema),
    defaultValues: {
      patientId: preselectedPatientId || '',
      doctorId: preselectedDoctorId || '',
      date: todayStr,
      startTime: '09:00',
      endTime: '09:30',
      visitReason: '',
      priority: 'normal',
      type: 'consultation',
      notes: '',
    },
  });

  const watchDoctorId = watch('doctorId');
  const watchDate = watch('date');
  const watchStartTime = watch('startTime');
  const watchEndTime = watch('endTime');

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        PatientService.getPatients({ status: 'active' }),
        DoctorService.getDoctors({ status: 'active' }),
      ]).then(([pList, dList]) => {
        setPatients(pList);
        setDoctors(dList);
      });

      reset({
        patientId: preselectedPatientId || '',
        doctorId: preselectedDoctorId || '',
        date: todayStr,
        startTime: '09:00',
        endTime: '09:30',
        visitReason: '',
        priority: 'normal',
        type: 'consultation',
        notes: '',
      });
      setConflictWarning(null);
    }
  }, [isOpen, preselectedPatientId, preselectedDoctorId, todayStr, reset]);

  // Real-time doctor double-booking check
  useEffect(() => {
    if (!isOpen || !watchDoctorId || !watchDate || !watchStartTime || !watchEndTime) {
      setConflictWarning(null);
      return;
    }

    if (watchStartTime >= watchEndTime) {
      setConflictWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      const conflict = await AppointmentService.checkDoctorSlotConflict({
        doctorId: watchDoctorId,
        date: watchDate,
        startTime: watchStartTime,
        endTime: watchEndTime,
      });

      if (conflict.hasConflict) {
        setConflictWarning(conflict.reason || 'Doctor is already scheduled for another consultation during this slot.');
      } else {
        setConflictWarning(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [watchDoctorId, watchDate, watchStartTime, watchEndTime, isOpen]);

  const selectedDoctor = doctors.find((d) => d.id === watchDoctorId);

  const onSubmit = async (data: AppointmentBookingData) => {
    setIsSubmitting(true);
    try {
      const appt = await AppointmentService.bookAppointment({
        patientId: data.patientId,
        doctorId: data.doctorId,
        departmentId: selectedDoctor?.departmentId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        visitReason: data.visitReason.trim(),
        priority: data.priority,
        type: data.type,
        notes: data.notes?.trim() || undefined,
        bookingUserName: 'Appointment Coordinator',
      });

      onSuccess(appt);
      onClose();
    } catch (err: any) {
      setConflictWarning(err.message || 'Failed to book appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Hospital Consultation" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Concurrency Overlap / Double-Booking Banner */}
        {conflictWarning && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-xs text-rose-900 animate-fadeIn">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Scheduling Conflict Detected</span>
              <p>{conflictWarning}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Select Registered Patient"
            error={errors.patientId?.message}
            {...register('patientId')}
            options={[
              { value: '', label: '-- Select Patient from MPI Registry --' },
              ...patients.map((p) => ({
                value: p.id,
                label: `${p.firstName} ${p.lastName} (${p.medicalRecordNumber}) - ${p.phone}`,
              })),
            ]}
            required
          />

          <Select
            label="Attending Physician"
            error={errors.doctorId?.message}
            {...register('doctorId')}
            options={[
              { value: '', label: '-- Select Attending Doctor --' },
              ...doctors.map((d) => ({
                value: d.id,
                label: `${d.fullName} (${d.specialization} - ${d.department})`,
              })),
            ]}
            required
          />
        </div>

        {/* Doctor Summary Strip */}
        {selectedDoctor && (
          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
            <span>Department: <strong>{selectedDoctor.department}</strong></span>
            <span>Fee: <strong>${selectedDoctor.consultationFee}.00</strong></span>
            <span>Operating Status: <strong>{selectedDoctor.availabilityStatus}</strong></span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Appointment Date"
            type="date"
            min={todayStr}
            error={errors.date?.message}
            {...register('date')}
            required
          />
          <Input
            label="Start Time"
            type="time"
            error={errors.startTime?.message}
            {...register('startTime')}
            required
          />
          <Input
            label="End Time"
            type="time"
            error={errors.endTime?.message}
            {...register('endTime')}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Consultation Priority"
            error={errors.priority?.message}
            {...register('priority')}
            options={[
              { value: 'normal', label: 'Standard Routine' },
              { value: 'urgent', label: 'Urgent Evaluation' },
              { value: 'low', label: 'Elective Follow-up' },
            ]}
          />
          <Select
            label="Visit Classification"
            error={errors.type?.message}
            {...register('type')}
            options={[
              { value: 'consultation', label: 'Initial Consultation' },
              { value: 'follow_up', label: 'Follow-up Review' },
              { value: 'routine_checkup', label: 'Routine Checkup / Wellness' },
              { value: 'emergency', label: 'Urgent / Acute Care' },
            ]}
          />
        </div>

        <Input
          label="Chief Complaint / Reason for Visit"
          placeholder="e.g. Severe hypertension review, intermittent chest palpitations"
          error={errors.visitReason?.message}
          {...register('visitReason')}
          required
        />

        <Input
          label="Scheduling Notes (Optional)"
          placeholder="Referral notes, wheelchair requirement, or translation requests"
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={Boolean(conflictWarning)}
          >
            Confirm & Book Appointment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
