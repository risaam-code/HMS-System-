import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { dischargeSummarySchema, DischargeSummaryFormData } from '@/schemas/inpatient';
import { InpatientService } from '@/services/inpatientService';
import { Admission } from '@/types';
import { LogOut, Receipt, Calendar, FileText } from 'lucide-react';

interface DischargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: Admission | null;
  onSuccess?: () => void;
}

export function DischargeModal({
  isOpen,
  onClose,
  admission,
  onSuccess,
}: DischargeModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DischargeSummaryFormData>({
    resolver: zodResolver(dischargeSummarySchema),
    defaultValues: {
      admissionId: admission?.id || '',
      conditionAtDischarge: 'recovered',
      dischargeDiagnosis: admission?.diagnosis || '',
      dischargeInstructions: 'Rest for 7 days, keep incision wound dry, monitor temperature daily.',
      dischargeMedications: 'Oral analgesics and completed antibiotic regimen as prescribed.',
      followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    },
  });

  if (!admission) return null;

  const admDate = new Date(admission.admissionDate);
  const today = new Date();
  const daysStayed = Math.max(1, Math.ceil((today.getTime() - admDate.getTime()) / (1000 * 60 * 60 * 24)));
  const estimatedStayCharge = daysStayed * admission.dailyRate;

  const onSubmit = async (data: DischargeSummaryFormData) => {
    setLoading(true);
    try {
      await InpatientService.dischargePatient({
        admissionId: admission.id,
        dischargingDoctorId: admission.attendingDoctorId,
        dischargingDoctorName: admission.attendingDoctorName,
        conditionAtDischarge: data.conditionAtDischarge,
        dischargeDiagnosis: data.dischargeDiagnosis,
        dischargeInstructions: data.dischargeInstructions,
        dischargeMedications: data.dischargeMedications,
        followUpDate: data.followUpDate,
        followUpInstructions: data.followUpInstructions,
      });

      addToast({
        title: 'Patient Discharged',
        message: `${admission.patientName} has been discharged and bed ${admission.bedNumber} released.`,
        type: 'success',
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast({
        title: 'Discharge Failed',
        message: err.message || 'Failed to complete patient discharge.',
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
      title="Inpatient Discharge & Bed Release"
      description={`Generate discharge summary and finalize room charges for ${admission.patientName} (${admission.patientMrn}).`}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Stay Summary Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Admission Date</span>
            <span className="font-semibold text-slate-800">{admission.admissionDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Total Stay Duration</span>
            <span className="font-bold text-blue-700">{daysStayed} Day(s)</span>
          </div>
          <div>
            <span className="text-slate-500 block">Allocated Bed</span>
            <span className="font-mono font-bold text-slate-900">{admission.bedNumber} ({admission.wardName})</span>
          </div>
          <div>
            <span className="text-slate-500 block">Est. Room Total</span>
            <span className="font-bold text-emerald-700">${estimatedStayCharge.toFixed(2)}</span>
          </div>
        </div>

        {/* Discharge Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Condition at Discharge <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              {...register('conditionAtDischarge')}
            >
              <option value="recovered">Recovered (Full clinical resolution)</option>
              <option value="improved">Improved (Stable for home convalescence)</option>
              <option value="unchanged">Unchanged (Chronic management)</option>
              <option value="transferred_out">Transferred Out to External Facility</option>
              <option value="deceased">Deceased</option>
            </select>
          </div>

          <Input
            label="Follow-Up Appointment Date"
            type="date"
            error={errors.followUpDate?.message}
            {...register('followUpDate')}
          />
        </div>

        <Input
          label="Final Discharge Diagnosis"
          placeholder="e.g. Acute uncomplicated appendicitis, fully resolved post-op"
          required
          error={errors.dischargeDiagnosis?.message}
          {...register('dischargeDiagnosis')}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Discharge Instructions & Activity Limits <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            placeholder="Wound dressing care, dietary guidance, exertion restrictions, warning signs requiring immediate return..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            {...register('dischargeInstructions')}
          />
          {errors.dischargeInstructions && (
            <p className="text-xs text-rose-500 mt-1">{errors.dischargeInstructions.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Discharge Medications & Take-Home Rx <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            placeholder="Medication names, dosage schedules, duration, and instructions..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            {...register('dischargeMedications')}
          />
          {errors.dischargeMedications && (
            <p className="text-xs text-rose-500 mt-1">{errors.dischargeMedications.message}</p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" isLoading={loading}>
            Confirm Discharge & Release Bed
          </Button>
        </div>
      </form>
    </Modal>
  );
}
