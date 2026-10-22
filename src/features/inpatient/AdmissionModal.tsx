import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { admissionSchema, AdmissionFormData } from '@/schemas/inpatient';
import { InpatientService } from '@/services/inpatientService';
import { PatientService } from '@/services/patientService';
import { DoctorService } from '@/services/doctorService';
import { DepartmentService } from '@/services/departmentService';
import { Patient, Doctor, Department, Ward, Bed } from '@/types';
import { BedDouble, AlertCircle, Building2, User, Stethoscope } from 'lucide-react';

interface AdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialPatientId?: string;
  initialBedId?: string;
}

export function AdmissionModal({
  isOpen,
  onClose,
  onSuccess,
  initialPatientId,
  initialBedId,
}: AdmissionModalProps) {
  const { addToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AdmissionFormData>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      patientId: initialPatientId || '',
      bedId: initialBedId || '',
      admissionDate: new Date().toISOString().slice(0, 10),
      dailyRate: 180,
    },
  });

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        PatientService.getPatients(),
        DoctorService.getDoctors(),
        DepartmentService.getDepartments(),
        InpatientService.getWards(),
        InpatientService.getBeds(),
      ]).then(([patList, docList, deptList, wardList, bedList]) => {
        setPatients(patList.filter((p) => p.status !== 'archived'));
        setDoctors(docList.filter((d) => d.status === 'active'));
        setDepartments(deptList.filter((d) => d.status === 'active'));
        setWards(wardList.filter((w) => w.status === 'active'));
        setBeds(bedList);

        if (initialPatientId) setValue('patientId', initialPatientId);

        if (initialBedId) {
          const b = bedList.find((bed) => bed.id === initialBedId);
          if (b) {
            setSelectedWardId(b.wardId);
            setValue('wardId', b.wardId);
            setValue('bedId', b.id);
            setValue('dailyRate', b.dailyRate);
          }
        } else if (wardList.length > 0) {
          setSelectedWardId(wardList[0].id);
          setValue('wardId', wardList[0].id);
        }
      });
    }
  }, [isOpen, initialPatientId, initialBedId, setValue]);

  const watchedBedId = watch('bedId');

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = e.target.value;
    setSelectedWardId(wardId);
    setValue('wardId', wardId);
    setValue('bedId', '');
  };

  const handleBedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bedId = e.target.value;
    setValue('bedId', bedId);
    const selectedBed = beds.find((b) => b.id === bedId);
    if (selectedBed) {
      setValue('dailyRate', selectedBed.dailyRate);
    }
  };

  const onSubmit = async (data: AdmissionFormData) => {
    setLoading(true);
    try {
      await InpatientService.admitPatient(data);
      addToast({
        title: 'Patient Admitted',
        message: 'Patient has been successfully assigned to bed and admitted.',
        type: 'success',
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast({
        title: 'Admission Failed',
        message: err.message || 'Failed to complete inpatient admission.',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const availableBeds = beds.filter(
    (b) => b.wardId === selectedWardId && (b.status === 'available' || b.id === initialBedId)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inpatient Admission & Bed Allocation"
      description="Assign patient to ward and bed, set admitting physician, and initialize inpatient billing."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Patient Selection */}
        <div>
          <Select
            label="Patient to Admit"
            placeholder="Select a registered patient..."
            required
            options={patients.map((p) => ({
              value: p.id,
              label: `${p.firstName} ${p.lastName} (${p.medicalRecordNumber}) - ${p.gender.toUpperCase()}, Age ${p.age}`,
            }))}
            error={errors.patientId?.message}
            {...register('patientId')}
          />
        </div>

        {/* Doctor & Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Attending Physician"
            placeholder="Select attending doctor..."
            required
            options={doctors.map((d) => ({
              value: d.id,
              label: `${d.fullName} — ${d.specialization}`,
            }))}
            error={errors.attendingDoctorId?.message}
            {...register('attendingDoctorId')}
          />

          <Select
            label="Clinical Department"
            placeholder="Select department..."
            required
            options={departments.map((d) => ({
              value: d.id,
              label: `${d.name} (${d.code})`,
            }))}
            error={errors.departmentId?.message}
            {...register('departmentId')}
          />
        </div>

        {/* Ward & Bed Allocation */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <BedDouble className="h-4 w-4 text-blue-600" />
            <span>Bed Census & Ward Allocation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Inpatient Ward <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedWardId}
                onChange={handleWardChange}
                className="flex h-9 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.wardType} - Fl. {w.floorNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Available Bed <span className="text-rose-500">*</span>
              </label>
              <select
                value={watchedBedId}
                onChange={handleBedChange}
                className="flex h-9 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="">Select available bed...</option>
                {availableBeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bedNumber} ({b.bedType}) — ${b.dailyRate}/day
                  </option>
                ))}
              </select>
              {errors.bedId && <p className="text-xs text-rose-500 mt-1">{errors.bedId.message}</p>}
              {availableBeds.length === 0 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  No available beds in this ward. Select another ward or transfer a patient.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <Input
              label="Admission Date"
              type="date"
              required
              error={errors.admissionDate?.message}
              {...register('admissionDate')}
            />

            <Input
              label="Expected Discharge"
              type="date"
              error={errors.expectedDischargeDate?.message}
              {...register('expectedDischargeDate')}
            />

            <Input
              label="Daily Rate ($/day)"
              type="number"
              step="0.01"
              required
              error={errors.dailyRate?.message}
              {...register('dailyRate', { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Reason & Diagnosis */}
        <div className="space-y-3">
          <Input
            label="Admission Diagnosis"
            placeholder="e.g. Acute Appendicitis with localized peritonitis (K35.20)"
            error={errors.diagnosis?.message}
            {...register('diagnosis')}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Admission Reason & Clinical Plan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Clinical indication for inpatient admission, monitoring requirements, and initial management plan..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              {...register('admissionReason')}
            />
            {errors.admissionReason && (
              <p className="text-xs text-rose-500 mt-1">{errors.admissionReason.message}</p>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Confirm Admission & Bed Allocation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
