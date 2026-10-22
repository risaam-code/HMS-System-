import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { createInvoiceSchema, CreateInvoiceFormData } from '@/schemas/billing';
import { BillingService } from '@/services/billingService';
import { PatientService } from '@/services/patientService';
import { Patient, InvoiceItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, Receipt, AlertCircle, Calculator } from 'lucide-react';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatientId?: string;
  onSuccess?: () => void;
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  preselectedPatientId,
  onSuccess,
}: CreateInvoiceModalProps) {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      patientId: preselectedPatientId || '',
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      discountAmount: 0,
      insuranceCoveredAmount: 0,
      notes: '',
      items: [
        {
          serviceType: 'consultation',
          description: 'Specialist Physician Consultation & Assessment',
          unitPrice: 150,
          quantity: 1,
          referenceType: 'manual',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items') || [];
  const discount = watch('discountAmount') || 0;
  const insurance = watch('insuranceCoveredAmount') || 0;

  // Real-time client-side preview estimate (server enforces final calculations)
  const previewSubtotal = items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0);
  const previewTax = Math.round(previewSubtotal * 0.05 * 100) / 100;
  const previewTotal = Math.max(0, Math.round((previewSubtotal + previewTax - discount - insurance) * 100) / 100);

  useEffect(() => {
    if (isOpen) {
      PatientService.getPatients().then((pList) => {
        setPatients(pList.filter((p) => p.status === 'active'));
        if (preselectedPatientId) {
          setValue('patientId', preselectedPatientId);
        } else if (pList.length > 0) {
          setValue('patientId', pList[0].id);
        }
      });
    }
  }, [isOpen, preselectedPatientId, setValue]);

  const onSubmit = async (data: CreateInvoiceFormData) => {
    setLoading(true);
    try {
      await BillingService.createInvoice({
        patientId: data.patientId,
        dueDate: data.dueDate,
        notes: data.notes,
        discountAmount: Number(data.discountAmount) || 0,
        insuranceCoveredAmount: Number(data.insuranceCoveredAmount) || 0,
        items: data.items.map((it) => ({
          serviceType: it.serviceType,
          description: it.description,
          unitPrice: Number(it.unitPrice),
          quantity: Number(it.quantity),
          referenceType: it.referenceType || 'manual',
          referenceId: it.referenceId,
        })),
        createdBy: user?.id || 'usr-acc-01',
        createdByName: profile?.fullName || user?.email || 'Hospital Financial Officer',
      });

      addToast('Invoice generated with server-verified calculations', 'success');
      reset();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate invoice';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Patient Billing Invoice" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Patient Account *
            </label>
            <Select
              options={patients.map((p) => ({
                value: p.id,
                label: `${p.firstName} ${p.lastName} (${p.medicalRecordNumber}) • ${p.phone}`,
              }))}
              value={watch('patientId')}
              onChange={(e) => setValue('patientId', e.target.value)}
            />
            {errors.patientId && <p className="text-xs text-rose-500 mt-1">{errors.patientId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Due Date *
            </label>
            <Input type="date" {...register('dueDate')} error={errors.dueDate?.message} />
          </div>
        </div>

        {/* Itemized Services Table */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Itemized Services & Charges ({fields.length})
              </h4>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  serviceType: 'procedure',
                  description: 'Clinical Nursing Procedure & Dressing',
                  unitPrice: 65,
                  quantity: 1,
                  referenceType: 'manual',
                })
              }
              className="gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Line Item
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-teal-700">Item #{idx + 1}</span>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Service Category *</label>
                    <Select
                      options={[
                        { value: 'consultation', label: 'Doctor Consultation' },
                        { value: 'laboratory', label: 'Laboratory Diagnostics' },
                        { value: 'pharmacy', label: 'Pharmacy & Medication' },
                        { value: 'admission', label: 'Room & Inpatient Bed' },
                        { value: 'procedure', label: 'Clinical Procedure / Surgery' },
                        { value: 'other', label: 'Other Ancillary Service' },
                      ]}
                      {...register(`items.${idx}.serviceType` as const)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Description *</label>
                    <Input
                      placeholder="e.g. Ward Round Daily Physician Fee"
                      {...register(`items.${idx}.description` as const)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Unit Price ($) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register(`items.${idx}.unitPrice` as const, { valueAsNumber: true })}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Quantity *</label>
                    <Input
                      type="number"
                      placeholder="1"
                      {...register(`items.${idx}.quantity` as const, { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Adjustments: Discount & Insurance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Discounts / Courtesy Waiver ($)
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('discountAmount', { valueAsNumber: true })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Insurance Covered / Copay Deductible ($)
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('insuranceCoveredAmount', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Billing Notes / Payment Terms
          </label>
          <Input placeholder="e.g. Net 14 days, insured under BlueCross policy #9012" {...register('notes')} />
        </div>

        {/* Summary Card */}
        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Subtotal:</span>
            <span className="font-mono">{formatCurrency(previewSubtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Hospital Tax (5% standard rate):</span>
            <span className="font-mono">{formatCurrency(previewTax)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-amber-300">
              <span>Authorized Discount:</span>
              <span className="font-mono">-{formatCurrency(discount)}</span>
            </div>
          )}
          {insurance > 0 && (
            <div className="flex justify-between text-teal-300">
              <span>Insurance Coverage:</span>
              <span className="font-mono">-{formatCurrency(insurance)}</span>
            </div>
          )}
          <div className="border-t border-slate-700 pt-2 flex justify-between items-center text-sm font-bold text-white">
            <span className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-teal-400" />
              Net Patient Balance Due:
            </span>
            <span className="text-base text-teal-300 font-mono">{formatCurrency(previewTotal)}</span>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-blue-800 text-xs flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Server-side verification guarantees financial integrity: totals and taxes are calculated securely in the backend, preventing client-side price tampering.
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading} className="gap-2">
            <Receipt className="w-4 h-4" />
            {loading ? 'Generating Invoice...' : 'Create & Issue Invoice'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
