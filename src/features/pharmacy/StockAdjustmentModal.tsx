import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { stockAdjustmentSchema, StockAdjustmentFormData } from '@/schemas/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { Medicine, MedicineBatch } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { SlidersHorizontal, AlertCircle } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMedicineId?: string;
  onSuccess?: () => void;
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  preselectedMedicineId,
  onSuccess,
}: StockAdjustmentModalProps) {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      medicineId: preselectedMedicineId || '',
      adjustmentType: 'adjustment',
      quantity: 0,
      reason: '',
    },
  });

  const selectedMedicineId = watch('medicineId');
  const adjustmentType = watch('adjustmentType');

  useEffect(() => {
    if (isOpen) {
      PharmacyService.getMedicines().then((meds) => {
        setMedicines(meds);
        const targetId = preselectedMedicineId || (meds[0]?.id ?? '');
        setValue('medicineId', targetId);
      });
    }
  }, [isOpen, preselectedMedicineId, setValue]);

  useEffect(() => {
    if (selectedMedicineId) {
      PharmacyService.getMedicineBatches(selectedMedicineId).then((batchList) => {
        setBatches(batchList);
      });
    } else {
      setBatches([]);
    }
  }, [selectedMedicineId]);

  const selectedMedObj = medicines.find((m) => m.id === selectedMedicineId);

  const onSubmit = async (data: StockAdjustmentFormData) => {
    if (data.quantity === 0) {
      addToast('Adjustment quantity cannot be zero', 'error');
      return;
    }
    setLoading(true);
    try {
      await PharmacyService.adjustMedicineStock({
        medicineId: data.medicineId,
        batchId: data.batchId || undefined,
        adjustmentType: data.adjustmentType,
        quantity: Number(data.quantity),
        reason: data.reason,
        performedBy: user?.id || 'usr-pharm-01',
        performedByName: profile?.fullName || user?.email || 'Pharmacist Administrator',
      });

      addToast('Inventory adjusted and audit transaction logged successfully', 'success');
      reset();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to adjust medicine stock';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inventory Stock Adjustment & Disposal" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Medicine / Formulary Item *
          </label>
          <Select
            options={medicines.map((m) => ({
              value: m.id,
              label: `${m.brandName} (${m.genericName} - ${m.strength}) • Qty: ${m.stockQuantity}`,
            }))}
            value={selectedMedicineId}
            onChange={(e) => setValue('medicineId', e.target.value)}
          />
          {errors.medicineId && <p className="text-xs text-rose-500 mt-1">{errors.medicineId.message}</p>}
        </div>

        {selectedMedObj && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-500">Current On-Hand:</span>{' '}
              <span className="font-bold text-slate-900">{selectedMedObj.stockQuantity} units</span>
            </div>
            <div>
              <span className="text-slate-500">Reorder Threshold:</span>{' '}
              <span className="font-medium text-slate-700">{selectedMedObj.reorderLevel} units</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Target Batch (Optional)
          </label>
          <Select
            options={[
              { value: '', label: 'General Formulary Stock (No specific batch)' },
              ...batches.map((b) => ({
                value: b.id,
                label: `Batch #${b.batchNumber} (Exp: ${b.expiryDate}) • Qty: ${b.quantityAvailable}`,
              })),
            ]}
            onChange={(e) => setValue('batchId', e.target.value)}
          />
          <span className="text-[11px] text-slate-500">
            For returns or disposal of expired lots, selecting the specific batch is recommended.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Adjustment Operation *
          </label>
          <Select
            options={[
              { value: 'adjustment', label: 'Inventory Correction / Count Discrepancy' },
              { value: 'return', label: 'Return to Vendor / Supplier' },
              { value: 'disposal', label: 'Safe Clinical Disposal (Expired / Damaged)' },
            ]}
            value={adjustmentType}
            onChange={(e) => setValue('adjustmentType', e.target.value as 'adjustment' | 'return' | 'disposal')}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Quantity Delta (+ for receipt/find, - for write-off/disposal) *
          </label>
          <Input
            type="number"
            placeholder="e.g. -10 for disposal or +5 for found stock"
            {...register('quantity', { valueAsNumber: true })}
            error={errors.quantity?.message}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Use negative numbers (e.g. -15) to deduct expired or returned stock; positive numbers (e.g. 20) to add stock.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Clinical / Administrative Reason *
          </label>
          <Input
            placeholder="e.g. Lot past expiration date; segregated for incineration"
            {...register('reason')}
            error={errors.reason?.message}
          />
        </div>

        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-xs flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Every inventory adjustment creates an immutable transaction entry in the pharmacy inventory ledger and triggers an audit log.
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading} className="gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            {loading ? 'Adjusting Stock...' : 'Confirm Stock Adjustment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
