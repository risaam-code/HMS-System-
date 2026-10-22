import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { patientFormSchema, PatientFormData } from '@/schemas/patient';
import { PatientService } from '@/services/patientService';
import { DoctorService } from '@/services/doctorService';
import { Patient, Doctor } from '@/types';
import { AlertCircle, CheckCircle2, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { calculateAge } from '@/lib/utils';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: Patient) => void;
  patientToEdit?: Patient | null;
}

export function PatientRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  patientToEdit,
}: PatientRegistrationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [generatedMrn, setGeneratedMrn] = useState<string>('');
  const isEditing = Boolean(patientToEdit);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: 'male',
      dateOfBirth: '',
      bloodGroup: 'O+',
      phone: '',
      email: '',
      address: '',
      emergencyContactName: '',
      emergencyContactRelationship: 'Spouse',
      emergencyContactPhone: '',
      allergies: '',
      status: 'active',
      assignedDoctorId: '',
      notes: '',
    },
  });

  const watchPhone = watch('phone');
  const watchEmail = watch('email');
  const watchDob = watch('dateOfBirth');
  const watchFirst = watch('firstName');
  const watchLast = watch('lastName');

  // Load doctors and next MRN
  useEffect(() => {
    if (isOpen) {
      DoctorService.getDoctors({ status: 'active' }).then(setDoctors);
      if (!isEditing) {
        PatientService.generateNextMrn().then(setGeneratedMrn);
        reset({
          firstName: '',
          lastName: '',
          gender: 'male',
          dateOfBirth: '',
          bloodGroup: 'O+',
          phone: '',
          email: '',
          address: '',
          emergencyContactName: '',
          emergencyContactRelationship: 'Spouse',
          emergencyContactPhone: '',
          allergies: '',
          status: 'active',
          assignedDoctorId: '',
          notes: '',
        });
      } else if (patientToEdit) {
        setGeneratedMrn(patientToEdit.medicalRecordNumber);
        reset({
          firstName: patientToEdit.firstName,
          lastName: patientToEdit.lastName,
          gender: patientToEdit.gender,
          dateOfBirth: patientToEdit.dateOfBirth,
          bloodGroup: patientToEdit.bloodGroup || 'O+',
          phone: patientToEdit.phone,
          email: patientToEdit.email || '',
          address: patientToEdit.address || '',
          emergencyContactName: patientToEdit.emergencyContact?.name || '',
          emergencyContactRelationship: patientToEdit.emergencyContact?.relationship || 'Spouse',
          emergencyContactPhone: patientToEdit.emergencyContact?.phone || '',
          allergies: (patientToEdit.allergies || []).join(', '),
          status: patientToEdit.status,
          assignedDoctorId: patientToEdit.assignedDoctorId || '',
          notes: patientToEdit.notes || '',
        });
      }
      setDuplicateWarning(null);
    }
  }, [isOpen, patientToEdit, isEditing, reset]);

  // Real-time Duplicate Check
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      if (watchPhone?.length >= 7 || watchEmail?.includes('@') || (watchFirst && watchLast && watchDob)) {
        const dup = await PatientService.checkDuplicate({
          phone: watchPhone,
          email: watchEmail,
          firstName: watchFirst,
          lastName: watchLast,
          dateOfBirth: watchDob,
          excludeId: patientToEdit?.id,
        });
        if (dup.isDuplicate) {
          setDuplicateWarning(dup.reason || 'Potential duplicate patient detected in master registry.');
        } else {
          setDuplicateWarning(null);
        }
      } else {
        setDuplicateWarning(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [watchPhone, watchEmail, watchFirst, watchLast, watchDob, isOpen, patientToEdit]);

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      const assignedDoc = doctors.find((d) => d.id === data.assignedDoctorId);
      const allergiesList = data.allergies
        ? data.allergies.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        age: calculateAge(data.dateOfBirth),
        bloodGroup: data.bloodGroup,
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        address: data.address.trim(),
        emergencyContact: {
          name: data.emergencyContactName.trim(),
          relationship: data.emergencyContactRelationship.trim(),
          phone: data.emergencyContactPhone.trim(),
        },
        allergies: allergiesList,
        status: data.status,
        assignedDoctorId: data.assignedDoctorId || undefined,
        assignedDoctor: assignedDoc ? assignedDoc.fullName : undefined,
        notes: data.notes?.trim() || undefined,
      };

      let result: Patient;
      if (isEditing && patientToEdit) {
        result = await PatientService.updatePatient(patientToEdit.id, payload);
      } else {
        result = await PatientService.createPatient({
          ...payload,
          medicalRecordNumber: generatedMrn,
        });
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setDuplicateWarning(err.message || 'Failed to save patient record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Patient Master Record' : 'Register New Hospital Patient'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* MRN System Header */}
        <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-900">Assigned Medical Record Number (MRN):</span>
            <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
              {generatedMrn || 'Auto-Generating...'}
            </span>
          </div>
          <span className="text-slate-500 font-medium">Hospital Master Patient Index (MPI)</span>
        </div>

        {/* Duplicate Warning Alert */}
        {duplicateWarning && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-xs text-amber-900 animate-fadeIn">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Patient Index Validation Alert</span>
              <p>{duplicateWarning}</p>
            </div>
          </div>
        )}

        {/* Section 1: Demographics */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-teal-600" /> 1. Personal Identification & Demographics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="e.g. Eleanor"
              error={errors.firstName?.message}
              {...register('firstName')}
              required
            />
            <Input
              label="Last Name"
              placeholder="e.g. Vance"
              error={errors.lastName?.message}
              {...register('lastName')}
              required
            />
            <Select
              label="Sex / Gender (Hospital Policy)"
              error={errors.gender?.message}
              {...register('gender')}
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'other', label: 'Other / Non-Binary' },
              ]}
              required
            />
            <Input
              label="Date of Birth"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth')}
              required
            />
            <Select
              label="Blood Group (Optional)"
              error={errors.bloodGroup?.message}
              {...register('bloodGroup')}
              options={[
                { value: 'O+', label: 'O Positive (O+)' },
                { value: 'O-', label: 'O Negative (O-)' },
                { value: 'A+', label: 'A Positive (A+)' },
                { value: 'A-', label: 'A Negative (A-)' },
                { value: 'B+', label: 'B Positive (B+)' },
                { value: 'B-', label: 'B Negative (B-)' },
                { value: 'AB+', label: 'AB Positive (AB+)' },
                { value: 'AB-', label: 'AB Negative (AB-)' },
              ]}
            />
            <Select
              label="Registration Status"
              error={errors.status?.message}
              {...register('status')}
              options={[
                { value: 'active', label: 'Active Outpatient' },
                { value: 'admitted', label: 'Inpatient Admitted' },
                { value: 'critical', label: 'Critical Care' },
                { value: 'archived', label: 'Archived File' },
              ]}
            />
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            2. Contact Details & Residential Address
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Primary Phone Number"
              placeholder="e.g. +1 (555) 234-5678"
              error={errors.phone?.message}
              {...register('phone')}
              required
            />
            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="patient@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <div className="md:col-span-2">
              <Input
                label="Residential Street Address"
                placeholder="Street address, apartment/suite, city, state, postal code"
                error={errors.address?.message}
                {...register('address')}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Contact */}
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            3. Emergency Contact (Mandatory)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Contact Full Name"
              placeholder="e.g. Arthur Vance"
              error={errors.emergencyContactName?.message}
              {...register('emergencyContactName')}
              required
            />
            <Input
              label="Relationship"
              placeholder="e.g. Spouse / Parent"
              error={errors.emergencyContactRelationship?.message}
              {...register('emergencyContactRelationship')}
              required
            />
            <Input
              label="Emergency Phone"
              placeholder="+1 (555) 234-5679"
              error={errors.emergencyContactPhone?.message}
              {...register('emergencyContactPhone')}
              required
            />
          </div>
        </div>

        {/* Section 4: Clinical Background & Assigned Physician */}
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            4. Clinical Background & Physician Assignment
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Assigned Primary Physician"
              error={errors.assignedDoctorId?.message}
              {...register('assignedDoctorId')}
              options={[
                { value: '', label: '-- None Assigned / Unassigned --' },
                ...doctors.map((d) => ({
                  value: d.id,
                  label: `${d.fullName} (${d.department})`,
                })),
              ]}
            />
            <Input
              label="Relevant Allergies (Comma separated)"
              placeholder="e.g. Penicillin, Latex, Peanuts"
              error={errors.allergies?.message}
              {...register('allergies')}
            />
            <div className="md:col-span-2">
              <Input
                label="Clinical Notes / Medical Alerts"
                placeholder="Chronic conditions, baseline observations, or precautions"
                error={errors.notes?.message}
                {...register('notes')}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Patient Record' : 'Register Patient & Create Chart'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
