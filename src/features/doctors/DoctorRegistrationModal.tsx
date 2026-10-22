import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { doctorFormSchema, DoctorFormData } from '@/schemas/doctor';
import { DoctorService } from '@/services/doctorService';
import { DepartmentService } from '@/services/departmentService';
import { Doctor, Department, DoctorSchedule } from '@/types';
import { Plus, Trash2, Calendar, Stethoscope, Clock } from 'lucide-react';

interface DoctorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (doctor: Doctor) => void;
  doctorToEdit?: Doctor | null;
}

export function DoctorRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  doctorToEdit,
}: DoctorRegistrationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<DoctorSchedule[]>([
    { dayOfWeek: 'Monday', startTime: '09:00', endTime: '16:00', maxPatients: 20 },
    { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '16:00', maxPatients: 20 },
    { dayOfWeek: 'Friday', startTime: '09:00', endTime: '14:00', maxPatients: 15 },
  ]);

  const isEditing = Boolean(doctorToEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      fullName: '',
      specialization: '',
      departmentId: '',
      department: '',
      licenseNumber: '',
      qualifications: '',
      consultationFee: 150,
      contactNumber: '',
      email: '',
      experienceYears: 5,
      biography: '',
      status: 'active',
      availabilityStatus: 'available',
    },
  });

  useEffect(() => {
    if (isOpen) {
      DepartmentService.getDepartments({ status: 'active' }).then(setDepartments);
      if (doctorToEdit) {
        reset({
          fullName: doctorToEdit.fullName,
          specialization: doctorToEdit.specialization,
          departmentId: doctorToEdit.departmentId,
          department: doctorToEdit.department,
          licenseNumber: doctorToEdit.licenseNumber,
          qualifications: (doctorToEdit.qualifications || []).join(', '),
          consultationFee: doctorToEdit.consultationFee,
          contactNumber: doctorToEdit.contactNumber,
          email: doctorToEdit.email,
          experienceYears: doctorToEdit.experienceYears,
          biography: doctorToEdit.biography || '',
          status: doctorToEdit.status,
          availabilityStatus: doctorToEdit.availabilityStatus,
        });
        setScheduleSlots(doctorToEdit.availabilitySchedule || []);
      } else {
        reset({
          fullName: '',
          specialization: '',
          departmentId: '',
          department: '',
          licenseNumber: '',
          qualifications: 'MBBS, MD',
          consultationFee: 150,
          contactNumber: '',
          email: '',
          experienceYears: 5,
          biography: '',
          status: 'active',
          availabilityStatus: 'available',
        });
        setScheduleSlots([
          { dayOfWeek: 'Monday', startTime: '09:00', endTime: '16:00', maxPatients: 20 },
          { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '16:00', maxPatients: 20 },
          { dayOfWeek: 'Friday', startTime: '09:00', endTime: '14:00', maxPatients: 15 },
        ]);
      }
    }
  }, [isOpen, doctorToEdit, reset]);

  const handleAddScheduleSlot = () => {
    setScheduleSlots([
      ...scheduleSlots,
      { dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '17:00', maxPatients: 20 },
    ]);
  };

  const handleRemoveScheduleSlot = (index: number) => {
    setScheduleSlots(scheduleSlots.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (index: number, field: keyof DoctorSchedule, value: any) => {
    const updated = [...scheduleSlots];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleSlots(updated);
  };

  const onSubmit = async (data: DoctorFormData) => {
    setIsSubmitting(true);
    try {
      const selectedDept = departments.find((d) => d.id === data.departmentId);
      const qualArray = data.qualifications
        ? data.qualifications.split(',').map((q) => q.trim()).filter(Boolean)
        : ['MBBS'];

      const payload = {
        fullName: data.fullName.trim(),
        specialization: data.specialization.trim(),
        departmentId: data.departmentId,
        department: selectedDept ? selectedDept.name : data.department || 'General Practice',
        licenseNumber: data.licenseNumber.trim().toUpperCase(),
        qualifications: qualArray,
        consultationFee: Number(data.consultationFee),
        contactNumber: data.contactNumber.trim(),
        email: data.email.trim().toLowerCase(),
        experienceYears: Number(data.experienceYears),
        biography: data.biography?.trim() || undefined,
        status: data.status,
        availabilityStatus: data.availabilityStatus,
        availabilitySchedule: scheduleSlots,
      };

      let result: Doctor;
      if (isEditing && doctorToEdit) {
        result = await DoctorService.updateDoctor(doctorToEdit.id, payload);
      } else {
        result = await DoctorService.createDoctor(payload);
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save doctor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Attending Physician Profile' : 'Register Attending Doctor'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Section 1: Doctor Identity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Full Name with Professional Title"
            placeholder="e.g. Dr. Robert Vance, MD"
            error={errors.fullName?.message}
            {...register('fullName')}
            required
          />
          <Input
            label="License / Medical Registration #"
            placeholder="e.g. MD-88192-CA"
            error={errors.licenseNumber?.message}
            {...register('licenseNumber')}
            required
            disabled={isEditing}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Primary Department"
            error={errors.departmentId?.message}
            {...register('departmentId')}
            options={[
              { value: '', label: '-- Select Clinical Department --' },
              ...departments.map((d) => ({
                value: d.id,
                label: `${d.name} (${d.code})`,
              })),
            ]}
            required
          />
          <Input
            label="Medical Specialization"
            placeholder="e.g. Interventional Cardiology"
            error={errors.specialization?.message}
            {...register('specialization')}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Consultation Fee ($)"
            type="number"
            min="0"
            step="5"
            error={errors.consultationFee?.message}
            {...register('consultationFee')}
            required
          />
          <Input
            label="Experience (Years)"
            type="number"
            min="0"
            error={errors.experienceYears?.message}
            {...register('experienceYears')}
            required
          />
          <Select
            label="Operational Status"
            error={errors.status?.message}
            {...register('status')}
            options={[
              { value: 'active', label: 'Active Staff' },
              { value: 'inactive', label: 'Inactive / On Leave' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Qualifications (Comma separated)"
            placeholder="e.g. MBBS, MD, FRCS, FACC"
            error={errors.qualifications?.message}
            {...register('qualifications')}
            required
          />
          <Input
            label="Contact Phone"
            placeholder="+1 (555) 789-0123"
            error={errors.contactNumber?.message}
            {...register('contactNumber')}
            required
          />
        </div>

        <Input
          label="Hospital Staff Email"
          type="email"
          placeholder="doctor.name@medpulse-hospital.org"
          error={errors.email?.message}
          {...register('email')}
          required
        />

        <Input
          label="Professional Biography & Subspecialty Notes"
          placeholder="Clinical focus, fellowship credentials, or procedural competencies"
          error={errors.biography?.message}
          {...register('biography')}
        />

        {/* Section 2: Weekly Availability Schedules */}
        <div className="pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" /> Weekly Consultation Schedule Slots
              </h4>
              <span className="text-[11px] text-slate-500">Defines operating hours for appointment booking</span>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={handleAddScheduleSlot}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Day Slot
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {scheduleSlots.map((slot, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <select
                  value={slot.dayOfWeek}
                  onChange={(e) => handleScheduleChange(index, 'dayOfWeek', e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded bg-white font-medium text-slate-800"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">From</span>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded bg-white font-mono"
                    required
                  />
                  <span className="text-slate-400">To</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded bg-white font-mono"
                    required
                  />
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-slate-400">Max:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={slot.maxPatients || 20}
                    onChange={(e) => handleScheduleChange(index, 'maxPatients', Number(e.target.value))}
                    className="w-14 px-1.5 py-1 border border-slate-300 rounded bg-white font-mono text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveScheduleSlot(index)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Remove Slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Physician Profile' : 'Register Doctor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
