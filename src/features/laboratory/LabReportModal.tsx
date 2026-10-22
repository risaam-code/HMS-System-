import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LabRequest } from '@/types';
import { Printer, ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

interface LabReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LabRequest | null;
}

export function LabReportModal({ isOpen, onClose, request }: LabReportModalProps) {
  if (!request) return null;

  const isVerified = request.status === 'verified';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Laboratory Diagnostic Report"
      description={`Accession ID: ${request.requestNumber}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Unverified Watermark Warning Banner */}
        {!isVerified && (
          <div className="p-3 bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl flex items-center gap-3 text-xs">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-amber-950 uppercase tracking-wider block">
                Preliminary / Unverified Diagnostic Data
              </span>
              <span className="text-amber-800">
                These laboratory results have NOT been reviewed or validated by an authorized pathologist. Unverified results are not final and must not be used for definitive clinical diagnoses.
              </span>
            </div>
          </div>
        )}

        {/* Printable Report Canvas */}
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-6 text-slate-800 printable-card">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  MP
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">MedPulse Clinical Laboratories</h2>
                  <p className="text-[11px] text-slate-500">CAP & CLIA Accredited Diagnostic Pathology Services</p>
                </div>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-mono font-bold text-slate-900">{request.requestNumber}</div>
              <div className="text-slate-500">Specimen Barcode: <span className="font-mono font-semibold">{request.sampleBarcode || 'N/A'}</span></div>
              <div className="mt-1">
                <Badge variant={isVerified ? 'success' : 'warning'} size="sm">
                  {isVerified ? 'FINAL VERIFIED REPORT' : 'PRELIMINARY RELEASE'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Demographics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-50 rounded-lg text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Patient Name</span>
              <span className="font-bold text-slate-900">{request.patientName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">MRN</span>
              <span className="font-mono font-bold text-blue-700">{request.patientMrn}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ordering Doctor</span>
              <span className="font-semibold text-slate-800">{request.doctorName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Specimen Type</span>
              <span className="font-medium text-slate-800">{request.sampleType || 'Whole Blood'}</span>
            </div>
          </div>

          {/* Test Name & Category */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div>
              <span className="font-bold text-slate-900 text-sm">{request.testName}</span>
              <span className="text-slate-500 ml-2 font-mono">({request.testCode})</span>
            </div>
            <div className="text-slate-500">
              Department: <span className="font-semibold text-slate-700">{request.category}</span>
            </div>
          </div>

          {/* Result Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Test Parameter / Analyte</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Flag</th>
                  <th className="py-2.5 px-3">Reference Interval</th>
                  <th className="py-2.5 px-3">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(request.resultItems || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      No parameters recorded yet for this test.
                    </td>
                  </tr>
                ) : (
                  (request.resultItems || []).map((item, idx) => (
                    <tr key={idx} className={item.flag === 'critical' ? 'bg-rose-50/60 font-semibold' : ''}>
                      <td className="py-2 px-3 font-medium text-slate-800">{item.parameter}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.value}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            item.flag === 'critical'
                              ? 'bg-rose-100 text-rose-800'
                              : item.flag === 'high' || item.flag === 'low'
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-emerald-700'
                          }`}
                        >
                          {item.flag === 'normal' ? 'Normal' : item.flag.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-mono">{item.referenceRange}</td>
                      <td className="py-2 px-3 text-slate-600">{item.unit}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Clinical Interpretation & Notes */}
          {request.interpretation && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Clinical Interpretation:</span>
              <p className="text-slate-600">{request.interpretation}</p>
            </div>
          )}

          {/* Verification Sign-Off Footer */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-3">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Collected / Accessioned</span>
              <span className="text-slate-700 font-medium">
                {request.sampleCollectedAt ? new Date(request.sampleCollectedAt).toLocaleString() : 'Pending'} by{' '}
                {request.sampleCollectedBy || 'Laboratory Accession Desk'}
              </span>
            </div>

            <div className="text-right">
              {isVerified ? (
                <div>
                  <span className="text-emerald-700 font-bold flex items-center justify-end gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Digitally Verified & Released
                  </span>
                  <span className="text-slate-900 font-semibold">{request.verifiedByName}</span>
                  <div className="text-slate-400 text-[10px]">
                    Verified: {request.verifiedAt ? new Date(request.verifiedAt).toLocaleString() : '—'}
                  </div>
                </div>
              ) : (
                <div className="text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Pending Attending Pathologist Review
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" variant="primary" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5" />
            Print Official Report
          </Button>
        </div>
      </div>
    </Modal>
  );
}
