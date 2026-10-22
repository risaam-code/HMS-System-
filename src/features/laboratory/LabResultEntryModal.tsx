import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { LaboratoryService } from '@/services/laboratoryService';
import { LabRequest, LabResultItem, ResultFlag } from '@/types';
import { FlaskConical, AlertTriangle, Plus, Trash2 } from 'lucide-react';

interface LabResultEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LabRequest | null;
  onSuccess?: () => void;
}

export function LabResultEntryModal({
  isOpen,
  onClose,
  request,
  onSuccess,
}: LabResultEntryModalProps) {
  const { addToast } = useToast();
  const [resultItems, setResultItems] = useState<LabResultItem[]>([]);
  const [interpretation, setInterpretation] = useState('');
  const [isPanicValue, setIsPanicValue] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && request) {
      if (request.resultItems && request.resultItems.length > 0) {
        setResultItems(request.resultItems);
        setInterpretation(request.interpretation || '');
        setIsPanicValue(Boolean(request.isPanicValue));
      } else {
        // Pre-populate standard parameters based on test code
        if (request.testCode.startsWith('CBC')) {
          setResultItems([
            { parameter: 'White Blood Cell (WBC)', value: '7.5', numericValue: 7.5, unit: '×10³/µL', referenceRange: '4.5 - 11.0', flag: 'normal' },
            { parameter: 'Red Blood Cell (RBC)', value: '4.8', numericValue: 4.8, unit: '×10⁶/µL', referenceRange: '4.3 - 5.9', flag: 'normal' },
            { parameter: 'Hemoglobin (Hgb)', value: '14.2', numericValue: 14.2, unit: 'g/dL', referenceRange: '13.5 - 17.5', flag: 'normal' },
            { parameter: 'Hematocrit (Hct)', value: '42.0', numericValue: 42.0, unit: '%', referenceRange: '38.8 - 50.0', flag: 'normal' },
            { parameter: 'Platelets (PLT)', value: '250', numericValue: 250, unit: '×10³/µL', referenceRange: '150 - 450', flag: 'normal' },
          ]);
        } else if (request.testCode.startsWith('LIP')) {
          setResultItems([
            { parameter: 'Total Cholesterol', value: '190', numericValue: 190, unit: 'mg/dL', referenceRange: '< 200', flag: 'normal' },
            { parameter: 'Triglycerides', value: '130', numericValue: 130, unit: 'mg/dL', referenceRange: '< 150', flag: 'normal' },
            { parameter: 'HDL Cholesterol', value: '52', numericValue: 52, unit: 'mg/dL', referenceRange: '> 40', flag: 'normal' },
            { parameter: 'LDL Cholesterol', value: '112', numericValue: 112, unit: 'mg/dL', referenceRange: '< 100', flag: 'high' },
          ]);
        } else if (request.testCode.startsWith('TROP')) {
          setResultItems([
            { parameter: 'High-Sensitivity Troponin-I', value: '0.02', numericValue: 0.02, unit: 'ng/mL', referenceRange: '< 0.04', flag: 'normal' },
          ]);
        } else {
          setResultItems([
            { parameter: 'Analyte Assay', value: '', unit: 'mg/dL', referenceRange: 'Normal', flag: 'normal' },
          ]);
        }
        setInterpretation('');
        setIsPanicValue(false);
      }
    }
  }, [isOpen, request]);

  if (!request) return null;

  const handleItemChange = (index: number, field: keyof LabResultItem, val: any) => {
    const updated = [...resultItems];
    updated[index] = { ...updated[index], [field]: val };
    setResultItems(updated);
  };

  const addItem = () => {
    setResultItems([
      ...resultItems,
      { parameter: '', value: '', unit: '', referenceRange: '', flag: 'normal' },
    ]);
  };

  const removeItem = (index: number) => {
    setResultItems(resultItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resultItems.length === 0) {
      addToast({ title: 'Validation Error', message: 'At least one result parameter is required.', type: 'danger' });
      return;
    }

    setLoading(true);
    try {
      await LaboratoryService.enterLabResults(request.id, {
        resultItems,
        interpretation,
        isPanicValue,
        enteredBy: 'Tech Michael Brody, MLS',
      });

      addToast({
        title: 'Results Entered',
        message: 'Laboratory results recorded. Request moved to verification queue.',
        type: 'success',
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast({
        title: 'Error Saving Results',
        message: err.message || 'Failed to save diagnostic results.',
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
      title="Enter Laboratory Diagnostic Results"
      description={`Record analyzer parameters for ${request.testName} (${request.requestNumber}).`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sample barcode banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block">Specimen Accession</span>
            <span className="font-mono font-bold text-slate-800">{request.sampleBarcode || 'SMP-MANUAL'}</span> ({request.sampleType || 'Whole Blood'})
          </div>
          <div>
            <span className="text-slate-500 block">Patient</span>
            <span className="font-semibold text-slate-900">{request.patientName} ({request.patientMrn})</span>
          </div>
          <div>
            <span className="text-slate-500 block">Priority</span>
            <span className="font-bold text-amber-700">{request.priority}</span>
          </div>
        </div>

        {/* Result Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Parameter / Analyte</th>
                <th className="py-2.5 px-3 w-32">Measured Value</th>
                <th className="py-2.5 px-3 w-24">Unit</th>
                <th className="py-2.5 px-3 w-36">Reference Range</th>
                <th className="py-2.5 px-3 w-28">Status Flag</th>
                <th className="py-2.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {resultItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.parameter}
                      onChange={(e) => handleItemChange(idx, 'parameter', e.target.value)}
                      placeholder="e.g. Hemoglobin"
                      className="w-full h-8 px-2 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = parseFloat(val);
                        handleItemChange(idx, 'value', val);
                        if (!isNaN(num)) handleItemChange(idx, 'numericValue', num);
                      }}
                      placeholder="e.g. 14.2"
                      className="w-full h-8 px-2 rounded border border-slate-300 font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      placeholder="e.g. g/dL"
                      className="w-full h-8 px-2 rounded border border-slate-300 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.referenceRange}
                      onChange={(e) => handleItemChange(idx, 'referenceRange', e.target.value)}
                      placeholder="e.g. 13.5 - 17.5"
                      className="w-full h-8 px-2 rounded border border-slate-300 text-xs text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={item.flag}
                      onChange={(e) => handleItemChange(idx, 'flag', e.target.value as ResultFlag)}
                      className={`w-full h-8 px-2 rounded border text-xs font-semibold focus:outline-none ${
                        item.flag === 'critical'
                          ? 'border-rose-300 bg-rose-50 text-rose-800'
                          : item.flag === 'high' || item.flag === 'low'
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'border-slate-300 bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      <option value="normal">Normal</option>
                      <option value="low">Low (L)</option>
                      <option value="high">High (H)</option>
                      <option value="critical">CRITICAL (!)</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 bg-slate-50 border-t border-slate-200">
            <Button type="button" size="sm" variant="outline" onClick={addItem} className="text-xs h-7">
              <Plus className="h-3 w-3 mr-1" /> Add Parameter Line
            </Button>
          </div>
        </div>

        {/* Panic Value Alert Toggle */}
        <div className="flex items-center gap-3 p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
          <input
            type="checkbox"
            id="panic-check"
            checked={isPanicValue}
            onChange={(e) => setIsPanicValue(e.target.checked)}
            className="h-4 w-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
          />
          <label htmlFor="panic-check" className="text-xs text-rose-900 cursor-pointer">
            <span className="font-bold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Panic / Critical Telemetry Value Alert
            </span>
            Immediately trigger clinical panic broadcast notification to the ordering physician.
          </label>
        </div>

        {/* Clinical Interpretation */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Pathologist / Technologist Clinical Interpretation
          </label>
          <textarea
            rows={2}
            value={interpretation}
            onChange={(e) => setInterpretation(e.target.value)}
            placeholder="Clinical impression, morphological findings, delta check evaluation..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Save Preliminary Results
          </Button>
        </div>
      </form>
    </Modal>
  );
}
