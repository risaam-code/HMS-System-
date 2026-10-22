import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { MedicalRecord, MedicalRecordAmendment } from '@/types';
import { MedicalRecordService } from '@/services/medicalRecordService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import {
  FileText,
  CheckCircle2,
  Lock,
  HeartPulse,
  Pill,
  User,
  Clock,
  History,
  AlertTriangle,
  Edit3,
  ShieldCheck,
} from 'lucide-react';

interface MedicalRecordDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecord | null;
  onRecordUpdated?: (updated: MedicalRecord) => void;
}

export function MedicalRecordDetailsModal({
  isOpen,
  onClose,
  record,
  onRecordUpdated,
}: MedicalRecordDetailsModalProps) {
  const { user, profile, hasPermission, role } = useAuth();
  const { toast } = useToast();

  const [isSigning, setIsSigning] = useState(false);
  const [isAmending, setIsAmending] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState('');
  const [newNotes, setNewNotes] = useState('');

  if (!record) return null;

  const canSign = (role === 'doctor' || role === 'administrator') && !record.isSigned;
  const canAmend = hasPermission('medical_records:amend') || role === 'doctor' || role === 'administrator';

  const handleSign = async () => {
    setIsSigning(true);
    try {
      const signed = await MedicalRecordService.signRecord(
        record.id,
        user?.id || 'doc-1',
        profile?.fullName || 'Dr. Robert Vance, MD'
      );
      toast({
        title: 'Chart Digitally Signed',
        message: `Clinical record ${record.recordNumber} has been signed and locked from silent modification.`,
        type: 'success',
      });
      onRecordUpdated?.(signed);
    } catch (err: any) {
      toast({
        title: 'Signing Failed',
        message: err.message,
        type: 'danger',
      });
    } finally {
      setIsSigning(false);
    }
  };

  const handleAmend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendmentReason.trim() || !newNotes.trim()) return;

    try {
      const amended = await MedicalRecordService.amendRecord({
        recordId: record.id,
        authorId: user?.id || 'usr-doc',
        authorName: profile?.fullName || 'Dr. Robert Vance, MD',
        authorRole: role,
        amendmentReason: amendmentReason.trim(),
        newNotes: newNotes.trim(),
      });

      toast({
        title: 'Amendment Recorded',
        message: `Official addendum added to signed chart ${record.recordNumber}.`,
        type: 'success',
      });

      setIsAmending(false);
      setAmendmentReason('');
      setNewNotes('');
      onRecordUpdated?.(amended);
    } catch (err: any) {
      toast({
        title: 'Amendment Failed',
        message: err.message,
        type: 'danger',
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="-mt-3 space-y-4 text-xs">
        {/* Header Strip */}
        <div className="bg-slate-900 text-white p-5 -mx-6 -mt-6 rounded-t-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-blue-500/30 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded font-bold">
                  {record.recordNumber}
                </span>
                <span className="text-lg font-bold text-white">{record.diagnosisTitle}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-xs mt-1">
                <span className="font-semibold text-white">{record.patientName}</span>
                <span>({record.patientMrn})</span>
                <span>•</span>
                <span>Physician: {record.doctorName}</span>
                <span>•</span>
                <span>Date: {record.encounterDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {record.isSigned ? (
                <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Digitally Signed
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-bold">
                  <Clock className="w-4 h-4 text-amber-400" /> Unsigned Draft
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vital Signs Snapshot */}
        {record.vitalSigns && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-bold text-slate-800 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" /> Encounter Vital Signs
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center">
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Temperature</span>
                <span className="font-bold text-slate-800">{record.vitalSigns.temperature || 'N/A'} °C</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                <span className="font-bold text-slate-800">
                  {record.vitalSigns.bloodPressureSystolic}/{record.vitalSigns.bloodPressureDiastolic}
                </span>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Heart Rate</span>
                <span className="font-bold text-slate-800">{record.vitalSigns.heartRate || 'N/A'} bpm</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Resp. Rate</span>
                <span className="font-bold text-slate-800">{record.vitalSigns.respiratoryRate || 'N/A'} /min</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">SpO2</span>
                <span className="font-bold text-slate-800">{record.vitalSigns.oxygenSaturation || 'N/A'} %</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Weight</span>
                <span className="font-bold text-slate-800">{record.vitalSigns.weightKg || 'N/A'} kg</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Height</span>
                <span className="font-bold text-slate-800">{record.vitalSigns.heightCm || 'N/A'} cm</span>
              </div>
            </div>
          </div>
        )}

        {/* Clinical SOAP Notes Display */}
        <div className="space-y-1.5">
          <span className="font-bold text-slate-800 uppercase tracking-wider block">
            Clinical SOAP Notes & Findings
          </span>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed">
            {record.clinicalNotes}
          </div>
        </div>

        {/* Prescriptions */}
        {record.prescriptions && record.prescriptions.length > 0 && (
          <div className="space-y-1.5">
            <span className="font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-teal-600" /> Prescribed Medicines
            </span>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {record.prescriptions.map((p, i) => (
                <div key={i} className="p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{p.medicineName}</span>
                    <span className="text-slate-600 ml-2">({p.dosage} • {p.frequency} • {p.duration})</span>
                    {p.instructions && <p className="text-[10px] text-slate-400 italic mt-0.5">{p.instructions}</p>}
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amendments Log */}
        {record.amendments && record.amendments.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Immutable Clinical Amendments ({record.amendments.length})
            </span>
            <div className="border border-amber-200 bg-amber-50/50 rounded-lg divide-y divide-amber-100">
              {record.amendments.map((a) => (
                <div key={a.id} className="p-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">
                      Author: {a.authorName} ({a.authorRole})
                    </span>
                    <span className="font-mono text-slate-500">{a.amendedAt}</span>
                  </div>
                  <p className="text-slate-700"><strong>Rationale:</strong> {a.amendmentReason}</p>
                  <div className="p-2 bg-white rounded border border-amber-200 font-mono text-[10px] text-slate-700">
                    {a.newNotes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amendment Sub-form */}
        {isAmending && (
          <form onSubmit={handleAmend} className="p-3 bg-amber-50 border border-amber-300 rounded-lg space-y-3">
            <span className="font-bold text-amber-900 block flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Record Official Clinical Amendment (Immutable)
            </span>
            <p className="text-[11px] text-amber-800">
              In accordance with hospital policy, signed charts cannot be silently overwritten. You must declare the clinical rationale for adding this addendum.
            </p>

            <Input
              label="Clinical Amendment Reason"
              placeholder="e.g. Added patient lab clarification, revised medication regimen"
              value={amendmentReason}
              onChange={(e) => setAmendmentReason(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Addendum Note Content
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white font-mono"
                placeholder="Enter new clinical observations or notes..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setIsAmending(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary">
                Seal & Save Amendment
              </Button>
            </div>
          </form>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            {canSign && (
              <Button size="sm" variant="primary" onClick={handleSign} isLoading={isSigning}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Digitally Sign & Seal Record
              </Button>
            )}

            {record.isSigned && canAmend && !isAmending && (
              <Button size="sm" variant="outline" onClick={() => setIsAmending(true)}>
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Add Clinical Amendment
              </Button>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
