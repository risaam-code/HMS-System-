import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { labRequestSchema, LabRequestFormData } from '@/schemas/laboratory';
import { LaboratoryService } from '@/services/laboratoryService';
import { PatientService } from '@/services/patientService';
import { DoctorService } from '@/services/doctorService';
import { Patient, Doctor, LabTest } from '@/types';
import { FlaskConical, AlertCircle } from 'lucide-react';

interface LabRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialPatientId?: string;
}

export function LabRequestModal({
  isOpen,
  onClose,
  onSuccess,
  initialPatientId,
}: LabRequestModalProps) {
  const { addToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LabRequestFormData>({
    resolver: zodResolver(labRequestSchema),
    defaultValues: {
      patientId: initialPatientId || '',
      priority: 'Routine',
    },
  });

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        PatientService.getPatients(),
        DoctorService.getDoctors(),
        LaboratoryService.getLabTests(),
      ]).then(([patList, docList, testList]) => {
        setPatients(patList.filter((p) => p.status !== 'archived'));
        setDoctors(docList.filter((d) => d.status === 'active'));
        setLabTests(testList.filter((t) => t.status === 'active'));

        if (initialPatientId) setValue('patientId', initialPatientId);
        if (docList.length > 0) setValue('doctorId', docList[0].id);
        if (testList.length > 0) {
          setValue('testId', testList[0].id);
          setSelectedTest(testList[0]);
        }
      });
    }
  }, [isOpen, initialPatientId, setValue]);

  const handleTestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const testId = e.target.value;
    setValue('testId', testId);
    const t = labTests.find((item) => item.id === testId) || null;
    setSelectedTest(t);
  };

  const onSubmit = async (data: LabRequestFormData) => {
    setLoading(true);
    try {
      await LaboratoryService.requestLabTest(data);
      addToast({
        title: 'Diagnostic Test Ordered',
        message: 'Laboratory request submitted and added to patient billing.',
        type: 'success',
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast({
        title: 'Order Failed',
        message: err.message || 'Failed to submit laboratory order.',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order Diagnostic Laboratory Test"
      description="Create a laboratory work order and link diagnostic specimen to patient EMR and billing ledger."
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Patient Selection */}
        <Select
          label="Patient"
          placeholder="Select patient..."
          required
          options={patients.map((p) => ({
            value: p.id,
            label: `${p.firstName} ${p.lastName} (${p.medicalRecordNumber})`,
          }))}
          error={errors.patientId?.message}
          {...register('patientId')}
        />

        {/* Doctor Selection */}
        <Select
          label="Ordering Physician"
          placeholder="Select ordering physician..."
          required
          options={doctors.map((d) => ({
            value: d.id,
            label: `${d.fullName} — ${d.specialization}`,
          }))}
          error={errors.doctorId?.message}
          {...register('doctorId')}
        />

        {/* Test Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Diagnostic Test <span className="text-rose-500">*</span>
          </label>
          <select
            onChange={handleTestChange}
            className="flex h-9 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {labTests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.testCode}) — ${t.price.toFixed(2)}
              </option>
            ))}
          </select>
          {errors.testId && <p className="text-xs text-rose-500 mt-1">{errors.testId.message}</p>}
        </div>

        {/* Selected Test Info Box */}
        {selectedTest && (
          <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-xl text-xs space-y-1">
            <div className="flex justify-between font-semibold text-blue-900">
              <span>Category: {selectedTest.category}</span>
              <span>Fee: ${selectedTest.price.toFixed(2)}</span>
            </div>
            <div className="text-slate-600">Specimen: {selectedTest.specimenType}</div>
            <div className="text-slate-500 text-[11px]">Turnaround Time: ~{selectedTest.turnaroundHours} hours</div>
          </div>
        )}

        {/* Priority Level */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority Urgency</label>
          <select
            className="flex h-9 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            {...register('priority')}
          >
            <option value="Routine">Routine (Standard Turnaround)</option>
            <option value="Urgent">Urgent (Priority Batch Processing)</option>
            <option value="STAT">STAT (Immediate Emergency Analysis)</option>
          </select>
        </div>

        {/* Clinical Indication */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Clinical Indication & Notes</label>
          <textarea
            rows={3}
            placeholder="Reason for test order, suspected differential diagnosis, clinical history..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            {...register('clinicalNotes')}
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Submit Lab Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
