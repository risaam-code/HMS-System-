import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { sampleCollectionSchema, SampleCollectionFormData } from '@/schemas/laboratory';
import { LaboratoryService } from '@/services/laboratoryService';
import { LabRequest } from '@/types';
import { QrCode, TestTube2, AlertCircle } from 'lucide-react';

interface SampleCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LabRequest | null;
  onSuccess?: () => void;
}

export function SampleCollectionModal({
  isOpen,
  onClose,
  request,
  onSuccess,
}: SampleCollectionModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SampleCollectionFormData>({
    resolver: zodResolver(sampleCollectionSchema),
    defaultValues: {
      requestId: request?.id || '',
      sampleType: 'Whole Blood (EDTA)',
      containerType: 'Lavender Top Vacutainer',
    },
  });

  if (!request) return null;

  const onSubmit = async (data: SampleCollectionFormData) => {
    setLoading(true);
    try {
      await LaboratoryService.collectLabSample(request.id, {
        sampleType: data.sampleType,
        collectorName: 'Tech Michael Brody, MLS',
        collectorNotes: data.collectorNotes,
      });

      addToast({
        title: 'Specimen Accessioned',
        message: `Sample collected and barcode assigned for ${request.testName}.`,
        type: 'success',
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast({
        title: 'Sample Collection Error',
        message: err.message || 'Failed to record specimen collection.',
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
      title="Specimen Accessioning & Collection"
      description={`Collect diagnostic specimen for ${request.patientName} (${request.requestNumber}).`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Test Summary */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
          <div className="flex justify-between font-semibold text-slate-900">
            <span>{request.testName}</span>
            <span className="font-mono text-blue-700">{request.testCode}</span>
          </div>
          <div className="text-slate-500">
            Patient: {request.patientName} ({request.patientMrn}) — Priority: <span className="font-bold text-amber-700">{request.priority}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Specimen Type <span className="text-rose-500">*</span>
          </label>
          <select
            className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            {...register('sampleType')}
          >
            <option value="Whole Blood (EDTA)">Whole Blood (EDTA Lavender Top)</option>
            <option value="Serum (SST)">Serum (SST Gold Top Clot Activator)</option>
            <option value="Plasma (Lithium Heparin)">Plasma (Lithium Heparin Green Top)</option>
            <option value="Plasma (Sodium Citrate)">Plasma (Sodium Citrate Light Blue Top)</option>
            <option value="Clean Catch Midstream Urine">Clean Catch Midstream Urine (Sterile Cup)</option>
            <option value="Nasopharyngeal Swab">Nasopharyngeal Swab (Viral Transport Media)</option>
            <option value="Cerebrospinal Fluid (CSF)">Cerebrospinal Fluid (CSF)</option>
          </select>
        </div>

        <Input
          label="Collection Tube / Container Type"
          placeholder="e.g. 4mL Lavender K2-EDTA Vacutainer"
          {...register('containerType')}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phlebotomist / Collector Notes</label>
          <textarea
            rows={2}
            placeholder="Specimen integrity check, collection site (e.g. left antecubital fossa), fasting state confirmed..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            {...register('collectorNotes')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Generate Barcode & Accession
          </Button>
        </div>
      </form>
    </Modal>
  );
}
