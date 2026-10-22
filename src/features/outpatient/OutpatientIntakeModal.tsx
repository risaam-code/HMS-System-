import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { outpatientIntakeSchema, OutpatientIntakeData } from '@/schemas/outpatient';
import { OutpatientService } from '@/services/outpatientService';
import { PatientService } from '@/services/patientService';
import { DoctorService } from '@/services/doctorService';
import { DepartmentService } from '@/services/departmentService';
import { AppointmentService } from '@/services/appointmentService';
import { Patient, Doctor, Department, Appointment, OutpatientVisit } from '@/types';
import { Stethoscope, User, Ticket, AlertCircle } from 'lucide-react';

interface OutpatientIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (visit: OutpatientVisit) => void;
  preselectedPatientId?: string;
  linkedAppointmentId?: string;
}

export function OutpatientIntakeModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedPatientId,
  linkedAppointmentId,
}: OutpatientIntakeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OutpatientIntakeData>({
    resolver: zodResolver(outpatientIntakeSchema),
    defaultValues: {
      patientId: preselectedPatientId || '',
      doctorId: '',
      departmentId: '',
      appointmentId: linkedAppointmentId || '',
      priority: 'Routine',
      isWalkIn: true,
      chiefComplaint: '',
    },
  });

  const watchDoctorId = watch('doctorId');
  const watchPatientId = watch('patientId');
  const watchIsWalkIn = watch('isWalkIn');

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        PatientService.getPatients({ status: 'active' }),
        DoctorService.getDoctors({ status: 'active' }),
        DepartmentService.getDepartments({ status: 'active' }),
        AppointmentService.getAppointments({ status: 'Scheduled' }),
      ]).then(([pList, dList, deptList, aptList]) => {
        setPatients(pList);
        setDoctors(dList);
        setDepartments(deptList);
        setAppointments(aptList);
      });

      reset({
        patientId: preselectedPatientId || '',
        doctorId: '',
        departmentId: '',
        appointmentId: linkedAppointmentId || '',
        priority: 'Routine',
        isWalkIn: !linkedAppointmentId,
        chiefComplaint: '',
      });
    }
  }, [isOpen, preselectedPatientId, linkedAppointmentId, reset]);

  // Auto-sync department when doctor is selected
  useEffect(() => {
    if (watchDoctorId) {
      const doc = doctors.find((d) => d.id === watchDoctorId);
      if (doc && doc.departmentId) {
        setValue('departmentId', doc.departmentId);
      }
    }
  }, [watchDoctorId, doctors, setValue]);

  // Auto-populate when linking appointment
  const handleAppointmentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const aptId = e.target.value;
    setValue('appointmentId', aptId);
    if (aptId) {
      const apt = appointments.find((a) => a.id === aptId);
      if (apt) {
        setValue('patientId', apt.patientId);
        setValue('doctorId', apt.doctorId);
        setValue('departmentId', apt.departmentId || '');
        setValue('chiefComplaint', apt.visitReason);
        setValue('isWalkIn', false);
      }
    }
  };

  const onSubmit = async (data: OutpatientIntakeData) => {
    setIsSubmitting(true);
    try {
      const visit = await OutpatientService.createVisit({
        patientId: data.patientId,
        doctorId: data.doctorId,
        departmentId: data.departmentId,
        appointmentId: data.appointmentId || undefined,
        priority: data.priority,
        isWalkIn: data.isWalkIn,
        chiefComplaint: data.chiefComplaint.trim(),
      });

      onSuccess(visit);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create outpatient intake.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Outpatient (OPD) Patient Intake" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {/* Step 1-3 Info Box */}
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-teal-900">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-teal-600" />
            <div>
              <span className="font-bold block">Step 1-3: Identify Patient & Generate Queue Token</span>
              <span className="text-[11px] text-teal-700">Token will be automatically indexed into the outpatient queue.</span>
            </div>
          </div>
          <span className="bg-white text-teal-800 font-mono font-bold px-2.5 py-1 rounded border border-teal-300 text-xs shadow-xs">
            Auto Token T-10X
          </span>
        </div>

        {/* Link Existing Appointment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Link Scheduled Appointment (Optional)
          </label>
          <select
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            value={watch('appointmentId') || ''}
            onChange={handleAppointmentSelect}
          >
            <option value="">-- Walk-in Patient (No Pre-booked Appointment) --</option>
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.appointmentNumber} — {a.patientName} with {a.doctorName} ({a.startTime})
              </option>
            ))}
          </select>
        </div>

        {/* Patient Selection */}
        <Select
          label="Registered Patient"
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

        {/* Doctor and Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Attending Physician"
            error={errors.doctorId?.message}
            {...register('doctorId')}
            options={[
              { value: '', label: '-- Select Attending Doctor --' },
              ...doctors.map((d) => ({
                value: d.id,
                label: `${d.fullName} (${d.specialization})`,
              })),
            ]}
            required
          />

          <Select
            label="Clinical Department"
            error={errors.departmentId?.message}
            {...register('departmentId')}
            options={[
              { value: '', label: '-- Select Clinic Department --' },
              ...departments.map((dept) => ({
                value: dept.id,
                label: `${dept.name} (${dept.code})`,
              })),
            ]}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Triage Priority Level"
            error={errors.priority?.message}
            {...register('priority')}
            options={[
              { value: 'Routine', label: 'Routine (Standard Care)' },
              { value: 'Urgent', label: 'Urgent (Priority Assessment)' },
              { value: 'STAT', label: 'STAT (Immediate Resuscitation)' },
            ]}
          />

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isWalkIn"
              {...register('isWalkIn')}
              className="w-4 h-4 text-teal-600 rounded border-slate-300"
            />
            <label htmlFor="isWalkIn" className="text-xs font-semibold text-slate-700">
              Walk-in Patient (No Pre-booked Appointment)
            </label>
          </div>
        </div>

        <Input
          label="Chief Complaint / Initial Intake Symptoms"
          placeholder="e.g. Acute fever, productive cough for 2 days"
          error={errors.chiefComplaint?.message}
          {...register('chiefComplaint')}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Issue OPD Token & Register Visit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
