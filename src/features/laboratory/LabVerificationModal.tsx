import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { LaboratoryService } from '@/services/laboratoryService';
import { LabRequest } from '@/types';
import { CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

interface LabVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LabRequest | null;
  onSuccess?: () => void;
}

export function LabVerificationModal({
  isOpen,
  onClose,
  request,
  onSuccess,
}: LabVerificationModalProps) {
  const { addToast } = useToast();
  const [verificationNotes, setVerificationNotes] = useState(
    'Quality control calibration acceptable. Reference range values verified within physiological variance.'
  );
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await LaboratoryService.verifyLabResults(request.id, {
        verifiedBy: 'prof-pathologist-01',
        verifiedByName: 'Dr. David Marcus, MD (Pathologist)',
        verifiedByRole: 'laboratory_staff',
        verificationNotes,
      });

      addToast({
        title: 'Diagnostic Report Verified',
        message: `Results for ${request.testName} verified and released for clinical view.`,
        type: 'success',
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast({
        title: 'Verification Failed',
        message: err.message || 'Failed to verify laboratory results.',
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
      title="Verify Diagnostic Laboratory Results"
      description={`Authorized clinical sign-off for ${request.patientName} (${request.requestNumber}).`}
      size="lg"
    >
      <form onSubmit={handleVerify} className="space-y-4">
        {/* Verification Authority Banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-emerald-950 block">Attending Pathologist Review</span>
            <span className="text-emerald-800">
              Signing off as <span className="font-semibold">Dr. David Marcus, MD (Consultant Pathologist)</span>
            </span>
          </div>
        </div>

        {/* Results Preview */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 font-semibold text-xs text-slate-700 flex justify-between items-center">
            <span>{request.testName} ({request.testCode})</span>
            <span className="font-mono text-slate-500">Barcode: {request.sampleBarcode || 'SMP-N/A'}</span>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 px-3">Parameter</th>
                <th className="py-2 px-3">Value</th>
                <th className="py-2 px-3">Unit</th>
                <th className="py-2 px-3">Ref Range</th>
                <th className="py-2 px-3">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(request.resultItems || []).map((it, idx) => (
                <tr key={idx} className={it.flag === 'critical' ? 'bg-rose-50/50' : ''}>
                  <td className="py-2 px-3 font-medium text-slate-800">{it.parameter}</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">{it.value}</td>
                  <td className="py-2 px-3 text-slate-600">{it.unit}</td>
                  <td className="py-2 px-3 text-slate-500">{it.referenceRange}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        it.flag === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : it.flag === 'high' || it.flag === 'low'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {it.flag.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {request.interpretation && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <span className="font-semibold text-slate-700 block">Technologist Impression:</span>
            <p className="text-slate-600">{request.interpretation}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Pathologist Verification Notes & Sign-off Endorsement <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Sign & Release Official Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
