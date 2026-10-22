import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { bedTransferSchema, BedTransferFormData } from '@/schemas/inpatient';
import { InpatientService } from '@/services/inpatientService';
import { Admission, Ward, Bed } from '@/types';
import { ArrowRightLeft, BedDouble, AlertCircle } from 'lucide-react';

interface BedTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: Admission | null;
  onSuccess?: () => void;
}

export function BedTransferModal({
  isOpen,
  onClose,
  admission,
  onSuccess,
}: BedTransferModalProps) {
  const { addToast } = useToast();
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    register,
    formState: { errors },
  } = useForm<BedTransferFormData>({
    resolver: zodResolver(bedTransferSchema),
    defaultValues: {
      admissionId: admission?.id || '',
      toWardId: '',
      toBedId: '',
      transferReason: '',
    },
  });

  useEffect(() => {
    if (isOpen && admission) {
      setValue('admissionId', admission.id);
      Promise.all([InpatientService.getWards(), InpatientService.getBeds()]).then(([wardList, bedList]) => {
        setWards(wardList.filter((w) => w.status === 'active'));
        setBeds(bedList);
        if (wardList.length > 0) {
          const initialWard = wardList.find((w) => w.id !== admission.wardId) || wardList[0];
          setSelectedWardId(initialWard.id);
          setValue('toWardId', initialWard.id);
        }
      });
    }
  }, [isOpen, admission, setValue]);

  const watchedBedId = watch('toBedId');

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = e.target.value;
    setSelectedWardId(wardId);
    setValue('toWardId', wardId);
    setValue('toBedId', '');
  };

  const onSubmit = async (data: BedTransferFormData) => {
    setLoading(true);
    try {
      await InpatientService.transferBed(
        data.admissionId,
        data.toWardId,
        data.toBedId,
        data.transferReason,
        'Staff Nurse / Attending Physician'
      );
      addToast({
        title: 'Bed Transfer Completed',
        message: 'Patient has been transferred and bed census updated.',
        type: 'success',
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast({
        title: 'Transfer Failed',
        message: err.message || 'Failed to complete bed transfer.',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!admission) return null;

  const availableBeds = beds.filter((b) => b.wardId === selectedWardId && b.status === 'available');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Inpatient Bed"
      description={`Transfer ${admission.patientName} (${admission.patientMrn}) from ${admission.bedNumber}.`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Current Allocation Summary */}
        <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-amber-800 font-semibold block">Current Location</span>
            <span className="text-slate-700">
              {admission.wardName} — Bed <span className="font-mono font-bold">{admission.bedNumber}</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Daily Rate</span>
            <span className="font-semibold text-slate-900">${admission.dailyRate}/day</span>
          </div>
        </div>

        {/* Destination Ward & Bed */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
            <span>Destination Allocation</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Destination Ward <span className="text-rose-500">*</span>
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
              Target Bed <span className="text-rose-500">*</span>
            </label>
            <select
              value={watchedBedId}
              onChange={(e) => setValue('toBedId', e.target.value)}
              className="flex h-9 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="">Select available destination bed...</option>
              {availableBeds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bedNumber} ({b.bedType}) — ${b.dailyRate}/day
                </option>
              ))}
            </select>
            {errors.toBedId && <p className="text-xs text-rose-500 mt-1">{errors.toBedId.message}</p>}
            {availableBeds.length === 0 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                No available beds in this ward. Select another ward.
              </p>
            )}
          </div>
        </div>

        {/* Transfer Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Transfer Justification & Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Clinical step-down from ICU to general medical ward following hemodynamic stabilization..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            {...register('transferReason')}
          />
          {errors.transferReason && (
            <p className="text-xs text-rose-500 mt-1">{errors.transferReason.message}</p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Execute Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
