import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { medicineSchema, MedicineFormData } from '@/schemas/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { Medicine } from '@/types';
import { Pill } from 'lucide-react';

interface MedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine?: Medicine | null;
  onSuccess?: () => void;
}

export function MedicineModal({
  isOpen,
  onClose,
  medicine,
  onSuccess,
}: MedicineModalProps) {
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      skuCode: '',
      brandName: '',
      genericName: '',
      category: 'Antibiotics',
      dosageForm: 'Tablet',
      strength: '',
      unitPrice: 1.0,
      stockQuantity: 0,
      reorderLevel: 50,
      manufacturer: '',
      isPrescriptionRequired: true,
    },
  });

  useEffect(() => {
    if (medicine) {
      reset({
        skuCode: medicine.skuCode,
        brandName: medicine.brandName,
        genericName: medicine.genericName,
        category: medicine.category,
        dosageForm: medicine.dosageForm,
        strength: medicine.strength,
        unitPrice: medicine.unitPrice,
        stockQuantity: medicine.stockQuantity,
        reorderLevel: medicine.reorderLevel,
        manufacturer: medicine.manufacturer,
        isPrescriptionRequired: medicine.isPrescriptionRequired,
      });
    } else {
      reset({
        skuCode: '',
        brandName: '',
        genericName: '',
        category: 'Antibiotics',
        dosageForm: 'Tablet',
        strength: '',
        unitPrice: 1.0,
        stockQuantity: 0,
        reorderLevel: 50,
        manufacturer: '',
        isPrescriptionRequired: true,
      });
    }
  }, [medicine, reset, isOpen]);

  const onSubmit = async (data: MedicineFormData) => {
    try {
      if (medicine) {
        await PharmacyService.updateMedicine(medicine.id, data);
        addToast({ title: 'Medicine Updated', message: `${data.brandName} formulary details updated.`, type: 'success' });
      } else {
        await PharmacyService.addMedicine({
          ...data,
          status: 'active',
        });
        addToast({ title: 'Medicine Registered', message: `${data.brandName} added to hospital formulary.`, type: 'success' });
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast({ title: 'Formulary Error', message: err.message || 'Failed to save medication.', type: 'danger' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={medicine ? 'Edit Formulary Medication' : 'Register New Formulary Medication'}
      description="Add pharmaceutical item to central hospital catalog with SKU and stock reorder parameters."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="SKU / Barcode Identifier"
            placeholder="e.g. MED-AMX-500"
            required
            error={errors.skuCode?.message}
            {...register('skuCode')}
          />
          <Input
            label="Strength & Formulation"
            placeholder="e.g. 500mg, 100 units/mL"
            required
            error={errors.strength?.message}
            {...register('strength')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Brand Name"
            placeholder="e.g. Amoxil, Lipitor"
            required
            error={errors.brandName?.message}
            {...register('brandName')}
          />
          <Input
            label="Generic / International Nonproprietary Name (INN)"
            placeholder="e.g. Amoxicillin Trihydrate"
            required
            error={errors.genericName?.message}
            {...register('genericName')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Therapeutic Category</label>
            <select
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              {...register('category')}
            >
              <option value="Antibiotics">Antibiotics & Antimicrobials</option>
              <option value="Analgesics">Analgesics & Pain Management</option>
              <option value="Cardiovascular">Cardiovascular & Antihypertensives</option>
              <option value="Antidiabetic">Antidiabetic & Endocrinology</option>
              <option value="Respiratory">Respiratory & Bronchodilators</option>
              <option value="Psychiatric">Psychiatric & Neurological</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
              <option value="Emergency">Emergency & Critical Care</option>
              <option value="Other">Other Specialty Medications</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dosage Form</label>
            <select
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              {...register('dosageForm')}
            >
              <option value="Tablet">Tablet (Oral)</option>
              <option value="Capsule">Capsule (Oral)</option>
              <option value="Syrup">Syrup / Suspension (Oral Liquid)</option>
              <option value="Injection">Injection (IV / IM Ampoule / Vial)</option>
              <option value="Inhaler">Inhaler / MDI Canister</option>
              <option value="Cream">Topical Cream / Ointment</option>
              <option value="Drops">Eye / Ear Drops</option>
              <option value="Suppository">Suppository (Rectal)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Dispensing Unit Price ($)"
            type="number"
            step="0.01"
            required
            error={errors.unitPrice?.message}
            {...register('unitPrice', { valueAsNumber: true })}
          />
          <Input
            label="Initial Stock Quantity"
            type="number"
            disabled={Boolean(medicine)}
            error={errors.stockQuantity?.message}
            {...register('stockQuantity', { valueAsNumber: true })}
          />
          <Input
            label="Low Stock Reorder Threshold"
            type="number"
            required
            error={errors.reorderLevel?.message}
            {...register('reorderLevel', { valueAsNumber: true })}
          />
        </div>

        <Input
          label="Pharmaceutical Manufacturer"
          placeholder="e.g. Pfizer, Novartis, GlaxoSmithKline"
          required
          error={errors.manufacturer?.message}
          {...register('manufacturer')}
        />

        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <input
            type="checkbox"
            id="rx-req-check"
            className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            {...register('isPrescriptionRequired')}
          />
          <label htmlFor="rx-req-check" className="text-xs text-slate-700 font-medium cursor-pointer">
            Requires authorized physician prescription (Rx-only medication)
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {medicine ? 'Save Changes' : 'Register Medication'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
