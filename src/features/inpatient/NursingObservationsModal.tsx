import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { nursingObservationSchema, NursingObservationFormData } from '@/schemas/inpatient';
import { InpatientService } from '@/services/inpatientService';
import { Admission } from '@/types';
import { Activity, Heart, Thermometer, Wind, Droplets } from 'lucide-react';

interface NursingObservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: Admission | null;
  onSuccess?: () => void;
}

export function NursingObservationsModal({
  isOpen,
  onClose,
  admission,
  onSuccess,
}: NursingObservationsModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<NursingObservationFormData>({
    resolver: zodResolver(nursingObservationSchema),
    defaultValues: {
      admissionId: admission?.id || '',
      painScore: 0,
      consciousness: 'Alert',
      notes: '',
      temperature: 37.0,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      heartRate: 72,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      fluidsIntakeMl: 500,
      fluidsOutputMl: 400,
    },
  });

  const painScore = watch('painScore');

  const onSubmit = async (data: NursingObservationFormData) => {
    if (!admission) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      await InpatientService.addNursingObservation({
        admissionId: admission.id,
        patientId: admission.patientId,
        nurseId: 'prof-nurse-active',
        nurseName: 'Staff Nurse On-Duty, RN',
        notes: data.notes,
        painScore: data.painScore,
        consciousness: data.consciousness,
        fluidsIntakeMl: data.fluidsIntakeMl,
        fluidsOutputMl: data.fluidsOutputMl,
        vitals: {
          temperature: data.temperature,
          bloodPressureSystolic: data.bloodPressureSystolic,
          bloodPressureDiastolic: data.bloodPressureDiastolic,
          heartRate: data.heartRate,
          respiratoryRate: data.respiratoryRate,
          oxygenSaturation: data.oxygenSaturation,
          recordedAt: now,
          recordedBy: 'Staff Nurse On-Duty, RN',
        },
      });

      addToast({
        title: 'Observations Recorded',
        message: `Nursing chart & vital signs updated for ${admission.patientName}.`,
        type: 'success',
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast({
        title: 'Error Saving Observations',
        message: err.message || 'Failed to record nursing observations.',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!admission) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Nursing Rounding & Vitals"
      description={`Clinical observations for ${admission.patientName} (${admission.bedNumber} - ${admission.wardName}).`}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Vital Signs Grid */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Activity className="h-4 w-4 text-emerald-600" />
            <span>Vital Signs & Physiological Parameters</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Input
              label="BP Systolic (mmHg)"
              type="number"
              placeholder="120"
              error={errors.bloodPressureSystolic?.message}
              {...register('bloodPressureSystolic', { valueAsNumber: true })}
            />
            <Input
              label="BP Diastolic (mmHg)"
              type="number"
              placeholder="80"
              error={errors.bloodPressureDiastolic?.message}
              {...register('bloodPressureDiastolic', { valueAsNumber: true })}
            />
            <Input
              label="Heart Rate (bpm)"
              type="number"
              placeholder="72"
              error={errors.heartRate?.message}
              {...register('heartRate', { valueAsNumber: true })}
            />
            <Input
              label="Temp (°C)"
              type="number"
              step="0.1"
              placeholder="37.0"
              error={errors.temperature?.message}
              {...register('temperature', { valueAsNumber: true })}
            />
            <Input
              label="Resp Rate (/min)"
              type="number"
              placeholder="16"
              error={errors.respiratoryRate?.message}
              {...register('respiratoryRate', { valueAsNumber: true })}
            />
            <Input
              label="SpO2 (%)"
              type="number"
              placeholder="98"
              error={errors.oxygenSaturation?.message}
              {...register('oxygenSaturation', { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Assessment & Fluid Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pain Score */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Pain Score (VAS 0–10)</label>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                painScore >= 7 ? 'bg-rose-100 text-rose-800' : painScore >= 4 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Score: {painScore} / 10
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              className="w-full accent-blue-600"
              {...register('painScore', { valueAsNumber: true })}
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 (No Pain)</span>
              <span>5 (Moderate)</span>
              <span>10 (Severe)</span>
            </div>
          </div>

          {/* Consciousness Level */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Consciousness Level (AVPU)</label>
            <select
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              {...register('consciousness')}
            >
              <option value="Alert">Alert (Spontaneous eye opening, oriented)</option>
              <option value="Verbal">Verbal (Responds to verbal commands)</option>
              <option value="Pain">Pain (Responds only to painful stimuli)</option>
              <option value="Unresponsive">Unresponsive (No motor/verbal response)</option>
            </select>
          </div>
        </div>

        {/* Fluids Intake & Output */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fluids Intake (mL)"
            type="number"
            placeholder="e.g. 500"
            error={errors.fluidsIntakeMl?.message}
            {...register('fluidsIntakeMl', { valueAsNumber: true })}
          />
          <Input
            label="Fluids Output (mL)"
            type="number"
            placeholder="e.g. 400"
            error={errors.fluidsOutputMl?.message}
            {...register('fluidsOutputMl', { valueAsNumber: true })}
          />
        </div>

        {/* Observation Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Nurse Rounding Notes & Patient Status <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Wound inspection, mobility status, dietary tolerance, IV cannula site inspection, emotional state..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            {...register('notes')}
          />
          {errors.notes && <p className="text-xs text-rose-500 mt-1">{errors.notes.message}</p>}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Save Rounding Observation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
