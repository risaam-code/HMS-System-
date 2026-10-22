import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { PharmacyService } from '@/services/pharmacyService';
import { Prescription, MedicineBatch } from '@/types';
import { CheckCircle2, AlertTriangle, Pill, ShieldAlert, Sparkles } from 'lucide-react';

interface DispensePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  onSuccess?: () => void;
}

export function DispensePrescriptionModal({
  isOpen,
  onClose,
  prescription,
  onSuccess,
}: DispensePrescriptionModalProps) {
  const { addToast } = useToast();
  const [batchesByMedicine, setBatchesByMedicine] = useState<Record<string, MedicineBatch[]>>({});
  const [selectedBatches, setSelectedBatches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('Prescription verified and counseled on administration.');

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (isOpen && prescription) {
      PharmacyService.getMedicineBatches().then((allBatches) => {
        const mapping: Record<string, MedicineBatch[]> = {};
        const initialPicks: Record<string, string> = {};

        for (const item of prescription.items) {
          // FEFO Sort: Sort by expiryDate ascending
          const medBatches = allBatches
            .filter((b) => b.medicineId === item.medicineId)
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

          mapping[item.medicineId] = medBatches;

          // Pick the first valid (non-expired and available) batch by default (FEFO)
          const firstValid = medBatches.find(
            (b) => b.expiryDate >= todayStr && b.quantityAvailable >= item.quantityPrescribed
          );
          if (firstValid) {
            initialPicks[item.medicineId] = firstValid.id;
          } else if (medBatches.length > 0) {
            initialPicks[item.medicineId] = medBatches[0].id;
          }
        }

        setBatchesByMedicine(mapping);
        setSelectedBatches(initialPicks);
      });
    }
  }, [isOpen, prescription, todayStr]);

  if (!prescription) return null;

  const handleBatchSelect = (medicineId: string, batchId: string) => {
    setSelectedBatches((prev) => ({ ...prev, [medicineId]: batchId }));
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemsToDispense = prescription.items.map((item) => {
        const batchId = selectedBatches[item.medicineId];
        if (!batchId) {
          throw new Error(`Please select an inventory batch for ${item.medicineName}.`);
        }

        const medBatches = batchesByMedicine[item.medicineId] || [];
        const batch = medBatches.find((b) => b.id === batchId);

        if (!batch) {
          throw new Error(`Batch not found for ${item.medicineName}.`);
        }

        if (batch.expiryDate < todayStr) {
          throw new Error(`Safety Violation: Batch ${batch.batchNumber} has expired and cannot be dispensed.`);
        }

        if (batch.quantityAvailable < item.quantityPrescribed) {
          throw new Error(
            `Stock Violation: Insufficient inventory in batch ${batch.batchNumber}. Available: ${batch.quantityAvailable}, Requested: ${item.quantityPrescribed}.`
          );
        }

        return {
          medicineId: item.medicineId,
          batchId,
          quantity: item.quantityPrescribed,
          unitPrice: item.unitPrice || 0,
        };
      });

      await PharmacyService.dispensePrescription({
        prescriptionId: prescription.id,
        pharmacistId: 'prof-pharm-active',
        pharmacistName: 'Marcus Ward, PharmD',
        items: itemsToDispense,
        notes,
      });

      addToast({
        title: 'Prescription Dispensed',
        message: `Medications dispensed and billed for ${prescription.patientName}. Inventory deducted atomically.`,
        type: 'success',
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast({
        title: 'Dispensing Blocked',
        message: err.message || 'Failed to dispense prescription.',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = prescription.items.reduce(
    (sum, item) => sum + (item.unitPrice || 0) * item.quantityPrescribed,
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispense Prescription & Inventory Deduction"
      description={`FEFO batch selection and stock verification for ${prescription.patientName} (${prescription.prescriptionNumber}).`}
      size="xl"
    >
      <form onSubmit={handleDispense} className="space-y-4">
        {/* Prescription Header */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Patient</span>
            <span className="font-bold text-slate-900">{prescription.patientName}</span>
            <div className="font-mono text-[10px] text-slate-500">{prescription.patientMrn}</div>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Prescribing Doctor</span>
            <span className="font-semibold text-slate-800">{prescription.doctorName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Prescribed Date</span>
            <span className="text-slate-700">{prescription.prescribedAt.slice(0, 10)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dispensing Total</span>
            <span className="font-bold text-emerald-700 text-sm">${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Prescription Line Items with FEFO Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            Prescription Line Items & Batch Allocation (First-Expiry-First-Out)
          </label>

          {prescription.items.map((item, idx) => {
            const medBatches = batchesByMedicine[item.medicineId] || [];
            const chosenBatchId = selectedBatches[item.medicineId];
            const chosenBatch = medBatches.find((b) => b.id === chosenBatchId);
            const isBatchExpired = chosenBatch && chosenBatch.expiryDate < todayStr;
            const isStockShortage = chosenBatch && chosenBatch.quantityAvailable < item.quantityPrescribed;

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-colors ${
                  isBatchExpired || isStockShortage
                    ? 'border-rose-300 bg-rose-50/40'
                    : 'border-slate-200 bg-white shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{item.medicineName}</span>
                    <div className="text-xs text-slate-500">
                      Dosage: <span className="font-semibold text-slate-700">{item.dosage}</span> — Frequency:{' '}
                      <span className="font-semibold text-slate-700">{item.frequency}</span> — Duration:{' '}
                      <span className="font-semibold text-slate-700">{item.duration}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500">
                      Prescribed Qty: <span className="font-bold text-slate-900">{item.quantityPrescribed}</span>
                    </span>
                    <div className="text-xs font-semibold text-emerald-700">
                      ${((item.unitPrice || 0) * item.quantityPrescribed).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Batch Selector */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 whitespace-nowrap">Select Batch (FEFO):</span>
                    <select
                      value={chosenBatchId || ''}
                      onChange={(e) => handleBatchSelect(item.medicineId, e.target.value)}
                      className="h-8 rounded-lg border border-slate-300 bg-white px-2 py-0 text-xs text-slate-900 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      {medBatches.map((b) => {
                        const expired = b.expiryDate < todayStr;
                        return (
                          <option key={b.id} value={b.id}>
                            Batch #{b.batchNumber} (Exp: {b.expiryDate}) — {b.quantityAvailable} in stock{' '}
                            {expired ? '⚠️ EXPIRED' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Safety Alerts */}
                  {isBatchExpired && (
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <ShieldAlert className="h-4 w-4" /> Expired Batch! Dispensing prohibited.
                    </span>
                  )}
                  {isStockShortage && !isBatchExpired && (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Shortage: Only {chosenBatch.quantityAvailable} available.
                    </span>
                  )}
                  {!isBatchExpired && !isStockShortage && (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Verified & in stock
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pharmacist Counseling Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Pharmacist Verification & Counseling Record
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Dispense & Deduct Stock
          </Button>
        </div>
      </form>
    </Modal>
  );
}
