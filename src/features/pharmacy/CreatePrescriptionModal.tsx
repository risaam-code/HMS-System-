import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { prescriptionSchema, PrescriptionFormData } from '@/schemas/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { PatientService } from '@/services/patientService';
import { DoctorService } from '@/services/doctorService';
import { Medicine, Patient, Doctor } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Plus, Trash2, Pill, Stethoscope, AlertTriangle } from 'lucide-react';

interface CreatePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatientId?: string;
  onSuccess?: () => void;
}

export function CreatePrescriptionModal({
  isOpen,
  onClose,
  preselectedPatientId,
  onSuccess,
}: CreatePrescriptionModalProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patientId: preselectedPatientId || '',
      doctorId: '',
      diagnosis: '',
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      notes: '',
      items: [
        {
          medicineId: '',
          dosage: '500mg',
          frequency: 'Every 8 hours',
          duration: '7 Days',
          quantityPrescribed: 21,
          instructions: 'Take after meals with water',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const selectedPatientId = watch('patientId');
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        PatientService.getPatients(),
        DoctorService.getDoctors(),
        PharmacyService.getMedicines(),
      ]).then(([pList, dList, mList]) => {
        setPatients(pList.filter((p) => p.status === 'active'));
        setDoctors(dList.filter((d) => d.status === 'active'));
        setMedicines(mList.filter((m) => m.status === 'active'));

        if (preselectedPatientId) {
          setValue('patientId', preselectedPatientId);
        } else if (pList.length > 0) {
          setValue('patientId', pList[0].id);
        }

        if (dList.length > 0) {
          // If current logged-in user is a doctor, default to their doctor record
          const currentDoc = dList.find((d) => d.email === user?.email);
          setValue('doctorId', currentDoc ? currentDoc.id : dList[0].id);
        }

        if (mList.length > 0) {
          setValue('items.0.medicineId', mList[0].id);
        }
      });
    }
  }, [isOpen, preselectedPatientId, setValue, user?.email]);

  const onSubmit = async (data: PrescriptionFormData) => {
    setLoading(true);
    try {
      await PharmacyService.createPrescription({
        patientId: data.patientId,
        doctorId: data.doctorId,
        diagnosis: data.diagnosis,
        validUntil: data.validUntil,
        notes: data.notes,
        items: data.items.map((item) => {
          const med = medicines.find((m) => m.id === item.medicineId);
          return {
            medicineId: item.medicineId,
            medicineName: med ? `${med.brandName} (${med.genericName})` : 'Medicine',
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantityPrescribed: item.quantityPrescribed,
            instructions: item.instructions,
          };
        }),
      });

      addToast('Prescription issued successfully to Pharmacy Queue', 'success');
      reset();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to issue prescription';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Issue Medical Prescription" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Patient *
            </label>
            <Select
              options={patients.map((p) => ({
                value: p.id,
                label: `${p.firstName} ${p.lastName} (${p.medicalRecordNumber}) • ${p.age}y ${p.gender}`,
              }))}
              value={watch('patientId')}
              onChange={(e) => setValue('patientId', e.target.value)}
            />
            {errors.patientId && <p className="text-xs text-rose-500 mt-1">{errors.patientId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Prescribing Physician *
            </label>
            <Select
              options={doctors.map((d) => ({
                value: d.id,
                label: `${d.fullName} (${d.department})`,
              }))}
              value={watch('doctorId')}
              onChange={(e) => setValue('doctorId', e.target.value)}
            />
            {errors.doctorId && <p className="text-xs text-rose-500 mt-1">{errors.doctorId.message}</p>}
          </div>
        </div>

        {selectedPatient && selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">KNOWN ALLERGY ALERT:</span> Patient is allergic to:{' '}
              <span className="font-semibold underline">{selectedPatient.allergies.join(', ')}</span>. Verify drug
              contraindications before prescribing.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Clinical Diagnosis / Indication
            </label>
            <Input
              placeholder="e.g. Acute Pharyngitis, Type 2 Diabetes"
              {...register('diagnosis')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Prescription Validity Expiry Date *
            </label>
            <Input type="date" {...register('validUntil')} error={errors.validUntil?.message} />
          </div>
        </div>

        {/* Prescription Items */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Prescribed Medications ({fields.length})
              </h4>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  medicineId: medicines[0]?.id || '',
                  dosage: '1 Tab',
                  frequency: 'Twice daily',
                  duration: '5 Days',
                  quantityPrescribed: 10,
                  instructions: 'Take with food',
                })
              }
              className="gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Medication
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-teal-700">Rx #{idx + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(idx)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1 h-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Medicine *</label>
                    <Select
                      options={medicines.map((m) => ({
                        value: m.id,
                        label: `${m.brandName} (${m.genericName} - ${m.dosageForm} ${m.strength}) • In Stock: ${m.stockQuantity}`,
                      }))}
                      {...register(`items.${idx}.medicineId` as const)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Dosage *</label>
                    <Input
                      placeholder="e.g. 500mg, 1 Capsule, 5ml"
                      {...register(`items.${idx}.dosage` as const)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Frequency *</label>
                    <Input
                      placeholder="e.g. Every 8 hrs, Once daily"
                      {...register(`items.${idx}.frequency` as const)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Duration *</label>
                    <Input placeholder="e.g. 7 Days, 30 Days" {...register(`items.${idx}.duration` as const)} />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Quantity to Dispense *
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 21"
                      {...register(`items.${idx}.quantityPrescribed` as const, { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Special Administration Instructions
                  </label>
                  <Input
                    placeholder="e.g. Take 30 mins before breakfast with a full glass of water"
                    {...register(`items.${idx}.instructions` as const)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Additional Clinical Notes / Refill Instructions
          </label>
          <Input placeholder="Optional pharmacist directives or patient counsel" {...register('notes')} />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading} className="gap-2">
            <Stethoscope className="w-4 h-4" />
            {loading ? 'Submitting Rx...' : 'Sign & Submit Prescription'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
