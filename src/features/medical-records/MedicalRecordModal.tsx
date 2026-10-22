import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { medicalRecordFormSchema, MedicalRecordFormData } from '@/schemas/medicalRecord';
import { MedicalRecordService } from '@/services/medicalRecordService';
import { PatientService } from '@/services/patientService';
import { DoctorService } from '@/services/doctorService';
import { Patient, Doctor, MedicalRecord, PrescriptionItem } from '@/types';
import { Plus, Trash2, HeartPulse, Pill, FileText, Stethoscope } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: MedicalRecord) => void;
  preselectedPatientId?: string;
  preselectedDoctorId?: string;
}

export function MedicalRecordModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedPatientId,
  preselectedDoctorId,
}: MedicalRecordModalProps) {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordFormSchema),
    defaultValues: {
      patientId: preselectedPatientId || '',
      doctorId: preselectedDoctorId || '',
      visitType: 'outpatient',
      chiefComplaint: '',
      clinicalNotes: `SUBJECTIVE:\nPatient presents with...\n\nOBJECTIVE:\nAlert & oriented. Heart regular, lungs clear.\n\nASSESSMENT:\nClinical diagnosis...\n\nPLAN:\nPrescriptions and follow-up...`,
      diagnosisTitle: '',
      diagnosisCode: '',
      treatmentPlan: '',
      vitalSigns: {
        temperature: 36.8,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        weightKg: 70,
        heightCm: 175,
      },
      prescriptions: [
        {
          medicineName: 'Amoxicillin Clavulanate',
          dosage: '625mg',
          frequency: 'Twice daily',
          duration: '7 Days',
          instructions: 'Take after meals',
        },
      ],
      followUpDate: '',
      isConfidential: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'prescriptions',
  });

  const watchWeight = watch('vitalSigns.weightKg');
  const watchHeight = watch('vitalSigns.heightCm');

  // Auto-calculated BMI
  const bmi = React.useMemo(() => {
    if (watchWeight && watchHeight && watchHeight > 0) {
      const heightInM = watchHeight / 100;
      return (watchWeight / (heightInM * heightInM)).toFixed(1);
    }
    return null;
  }, [watchWeight, watchHeight]);

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
        visitType: 'outpatient',
        chiefComplaint: '',
        clinicalNotes: `SUBJECTIVE:\nPatient presents with...\n\nOBJECTIVE:\nVital signs evaluated. Normal heart sounds.\n\nASSESSMENT:\nPrimary diagnosis...\n\nPLAN:\nRecommended therapy and follow-up...`,
        diagnosisTitle: '',
        diagnosisCode: '',
        treatmentPlan: '',
        vitalSigns: {
          temperature: 36.8,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          heartRate: 72,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          weightKg: 70,
          heightCm: 175,
        },
        prescriptions: [],
        followUpDate: '',
        isConfidential: false,
      });
    }
  }, [isOpen, preselectedPatientId, preselectedDoctorId, reset]);

  const onSubmit = async (data: MedicalRecordFormData) => {
    setIsSubmitting(true);
    try {
      const patient = patients.find((p) => p.id === data.patientId);
      const doctor = doctors.find((d) => d.id === data.doctorId);

      if (!patient || !doctor) {
        throw new Error('Please select a valid patient and attending doctor.');
      }

      const rec = await MedicalRecordService.createMedicalRecord({
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientMrn: patient.medicalRecordNumber,
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        encounterDate: new Date().toISOString().split('T')[0],
        visitType: data.visitType,
        chiefComplaint: data.chiefComplaint.trim(),
        clinicalNotes: data.clinicalNotes.trim(),
        diagnosisTitle: data.diagnosisTitle.trim(),
        diagnosisCode: data.diagnosisCode?.trim() || undefined,
        treatmentPlan: data.treatmentPlan.trim(),
        vitalSigns: data.vitalSigns
          ? {
              ...data.vitalSigns,
              recordedAt: new Date().toISOString(),
              recordedBy: profile?.fullName || 'Attending Physician',
            }
          : undefined,
        prescriptions: data.prescriptions || [],
        followUpDate: data.followUpDate || undefined,
        isConfidential: Boolean(data.isConfidential),
        isSigned: false, // Created as unsigned draft; doctor signs digitally
      });

      onSuccess(rec);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to file medical record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Clinical Chart & EMR Encounter" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {/* Header selects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select
            label="Patient"
            error={errors.patientId?.message}
            {...register('patientId')}
            options={[
              { value: '', label: '-- Select Patient --' },
              ...patients.map((p) => ({
                value: p.id,
                label: `${p.firstName} ${p.lastName} (${p.medicalRecordNumber})`,
              })),
            ]}
            required
          />

          <Select
            label="Attending Physician"
            error={errors.doctorId?.message}
            {...register('doctorId')}
            options={[
              { value: '', label: '-- Select Physician --' },
              ...doctors.map((d) => ({
                value: d.id,
                label: `${d.fullName} (${d.department})`,
              })),
            ]}
            required
          />

          <Select
            label="Encounter Type"
            error={errors.visitType?.message}
            {...register('visitType')}
            options={[
              { value: 'outpatient', label: 'Outpatient (Ambulatory)' },
              { value: 'inpatient', label: 'Inpatient (Ward Round)' },
              { value: 'emergency', label: 'Emergency / Acute' },
              { value: 'telehealth', label: 'Telehealth Consult' },
            ]}
          />
        </div>

        {/* Vital Signs Recorder Strip */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-600" /> Triage Vital Signs
            </span>
            {bmi && (
              <span className="bg-blue-100 text-blue-900 font-mono text-[11px] px-2 py-0.5 rounded font-bold">
                Calculated BMI: {bmi} kg/m²
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            <Input label="Temp (°C)" type="number" step="0.1" {...register('vitalSigns.temperature')} />
            <Input label="BP Sys" type="number" {...register('vitalSigns.bloodPressureSystolic')} />
            <Input label="BP Dia" type="number" {...register('vitalSigns.bloodPressureDiastolic')} />
            <Input label="HR (bpm)" type="number" {...register('vitalSigns.heartRate')} />
            <Input label="RR (/min)" type="number" {...register('vitalSigns.respiratoryRate')} />
            <Input label="SpO2 (%)" type="number" {...register('vitalSigns.oxygenSaturation')} />
            <Input label="Weight (kg)" type="number" step="0.1" {...register('vitalSigns.weightKg')} />
            <Input label="Height (cm)" type="number" step="0.5" {...register('vitalSigns.heightCm')} />
          </div>
        </div>

        {/* Chief complaint & Diagnosis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <Input
              label="Chief Complaint"
              placeholder="e.g. Severe headache for 3 days"
              error={errors.chiefComplaint?.message}
              {...register('chiefComplaint')}
              required
            />
          </div>
          <div className="md:col-span-1">
            <Input
              label="Primary Diagnosis"
              placeholder="e.g. Acute Migraine without Aura"
              error={errors.diagnosisTitle?.message}
              {...register('diagnosisTitle')}
              required
            />
          </div>
          <div className="md:col-span-1">
            <Input
              label="ICD-10 Code"
              placeholder="e.g. G43.009"
              error={errors.diagnosisCode?.message}
              {...register('diagnosisCode')}
            />
          </div>
        </div>

        {/* SOAP Clinical Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Clinical SOAP Notes (Subjective, Objective, Assessment, Plan)
          </label>
          <textarea
            rows={5}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            {...register('clinicalNotes')}
            required
          />
          {errors.clinicalNotes && (
            <span className="text-[11px] text-rose-600">{errors.clinicalNotes.message}</span>
          )}
        </div>

        <Input
          label="Treatment Plan / Discharge Instructions"
          placeholder="Prescription instructions, hydration, physical therapy"
          error={errors.treatmentPlan?.message}
          {...register('treatmentPlan')}
          required
        />

        {/* Prescriptions Builder */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-teal-600" /> Prescriptions & Medications
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                append({
                  medicineName: '',
                  dosage: '500mg',
                  frequency: 'TDS (3 times daily)',
                  duration: '5 Days',
                  instructions: 'Take after meals',
                })
              }
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Medication
            </Button>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-5 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <input
                  placeholder="Medicine Name"
                  {...register(`prescriptions.${index}.medicineName` as const)}
                  className="px-2 py-1 border border-slate-300 rounded bg-white font-medium col-span-2"
                  required
                />
                <input
                  placeholder="Dosage (500mg)"
                  {...register(`prescriptions.${index}.dosage` as const)}
                  className="px-2 py-1 border border-slate-300 rounded bg-white"
                  required
                />
                <input
                  placeholder="Frequency / Duration"
                  {...register(`prescriptions.${index}.frequency` as const)}
                  className="px-2 py-1 border border-slate-300 rounded bg-white"
                  required
                />
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Clinical Record Draft
          </Button>
        </div>
      </form>
    </Modal>
  );
}
