import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { batchReceiptSchema, BatchReceiptFormData } from '@/schemas/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { Medicine } from '@/types';
import { PackageCheck, Calendar, Truck } from 'lucide-react';

interface BatchReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMedicineId?: string;
  onSuccess?: () => void;
}

export function BatchReceiptModal({
  isOpen,
  onClose,
  preselectedMedicineId,
  onSuccess,
}: BatchReceiptModalProps) {
  const { addToast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BatchReceiptFormData>({
    resolver: zodResolver(batchReceiptSchema),
    defaultValues: {
      medicineId: preselectedMedicineId || '',
      quantity: 100,
      unitCost: 1.0,
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      supplier: 'MedAlliance Supply Co.',
    },
  });

  useEffect(() => {
    if (isOpen) {
      PharmacyService.getMedicines().then((meds) => {
        setMedicines(meds.filter((m) => m.status === 'active'));
        if (preselectedMedicineId) setValue('medicineId', preselectedMedicineId);
        else if (meds.length > 0) setValue('medicineId', meds[0].id);
      });
    }
  }, [isOpen, preselectedMedicineId, setValue]);

  const onSubmit = async (data: BatchReceiptFormData) => {
    setLoading(true);
    try {
      await PharmacyService.receiveMedicineBatch({
        ...data,
        receivedBy: 'prof-pharm-active',
        receivedByName: 'Marcus Ward, PharmD',
      });
      addToast({
        title: 'Batch Received',
        message: `Received ${data.quantity} units under batch #${data.batchNumber}. Total stock increased.`,
        type: 'success',
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast({
        title: 'Stock Receipt Error',
        message: err.message || 'Failed to receive medication batch.',
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
      title="Receive Medicine Stock Batch"
      description="Record supplier shipment delivery, track batch expiry date, and automatically update inventory stock."
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Formulary Medication"
          placeholder="Select medication..."
          required
          options={medicines.map((m) => ({
            value: m.id,
            label: `${m.brandName} (${m.genericName}) — ${m.strength} [${m.skuCode}]`,
          }))}
          error={errors.medicineId?.message}
          {...register('medicineId')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Manufacturer Batch Number"
            placeholder="e.g. BT-9941"
            required
            error={errors.batchNumber?.message}
            {...register('batchNumber')}
          />
          <Input
            label="Batch Expiry Date"
            type="date"
            required
            error={errors.expiryDate?.message}
            {...register('expiryDate')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Received Quantity"
            type="number"
            required
            error={errors.quantity?.message}
            {...register('quantity', { valueAsNumber: true })}
          />
          <Input
            label="Unit Cost ($/unit)"
            type="number"
            step="0.01"
            required
            error={errors.unitCost?.message}
            {...register('unitCost', { valueAsNumber: true })}
          />
        </div>

        <Input
          label="Pharmaceutical Supplier / Wholesaler"
          placeholder="e.g. MedAlliance Supply Co., McKesson"
          required
          error={errors.supplier?.message}
          {...register('supplier')}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            <PackageCheck className="h-4 w-4 mr-1.5" />
            Confirm Stock Receipt
          </Button>
        </div>
      </form>
    </Modal>
  );
}
