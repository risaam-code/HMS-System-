import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { OutpatientVisit, PrescriptionItem, VitalSigns } from '@/types';
import { OutpatientService } from '@/services/outpatientService';
import { useToast } from '@/components/ui/Toast';
import {
  CheckCircle2,
  Stethoscope,
  HeartPulse,
  Pill,
  FlaskConical,
  DollarSign,
  Ticket,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';

interface OutpatientEncounterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  visit: OutpatientVisit | null;
  onVisitUpdated: (updated: OutpatientVisit) => void;
}

export function OutpatientEncounterDrawer({
  isOpen,
  onClose,
  visit,
  onVisitUpdated,
}: OutpatientEncounterDrawerProps) {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'vitals' | 'consultation' | 'lab' | 'rx' | 'billing'>('vitals');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vitals State
  const [temp, setTemp] = useState<number>(visit?.vitals?.temperature || 36.8);
  const [bpSys, setBpSys] = useState<number>(visit?.vitals?.bloodPressureSystolic || 120);
  const [bpDia, setBpDia] = useState<number>(visit?.vitals?.bloodPressureDiastolic || 80);
  const [hr, setHr] = useState<number>(visit?.vitals?.heartRate || 72);
  const [spo2, setSpo2] = useState<number>(visit?.vitals?.oxygenSaturation || 98);

  // Consultation State
  const [consultNotes, setConsultNotes] = useState(visit?.consultationNotes || '');
  const [diagnosis, setDiagnosis] = useState(visit?.diagnosis || '');
  const [treatmentPlan, setTreatmentPlan] = useState(visit?.treatmentPlan || '');

  // Lab Requests State
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>(visit?.labRequests || []);

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>(visit?.prescriptions || []);
  const [newRxName, setNewRxName] = useState('');
  const [newRxDosage, setNewRxDosage] = useState('500mg');
  const [newRxFrequency, setNewRxFrequency] = useState('Twice daily');
  const [newRxDuration, setNewRxDuration] = useState('7 Days');

  // Billing State
  const [fee, setFee] = useState<number>(visit?.consultationFee || 150);

  if (!visit) return null;

  // Available lab test options
  const availableTests = [
    { code: 'CBC', name: 'Complete Blood Count (CBC)' },
    { code: 'BMP', name: 'Basic Metabolic Panel (BMP)' },
    { code: 'LIPID', name: 'Comprehensive Lipid Profile' },
    { code: 'TROPONIN', name: 'Cardiac Troponin I' },
    { code: 'URINE', name: 'Urinalysis (Microscopic)' },
    { code: 'CXR', name: 'Chest X-Ray PA View' },
  ];

  const handleToggleLab = (code: string) => {
    if (selectedLabTests.includes(code)) {
      setSelectedLabTests(selectedLabTests.filter((c) => c !== code));
    } else {
      setSelectedLabTests([...selectedLabTests, code]);
    }
  };

  const handleAddRx = () => {
    if (!newRxName.trim()) return;
    setPrescriptions([
      ...prescriptions,
      {
        medicineName: newRxName.trim(),
        dosage: newRxDosage.trim(),
        frequency: newRxFrequency.trim(),
        duration: newRxDuration.trim(),
      },
    ]);
    setNewRxName('');
  };

  const handleRemoveRx = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  // Step 4: Check-in Patient
  const handleCheckIn = async () => {
    setIsSubmitting(true);
    try {
      const updated = await OutpatientService.checkInPatient(visit.id, {
        temperature: Number(temp),
        bloodPressureSystolic: Number(bpSys),
        bloodPressureDiastolic: Number(bpDia),
        heartRate: Number(hr),
        oxygenSaturation: Number(spo2),
        recordedAt: new Date().toISOString(),
        recordedBy: 'Triage Nurse',
      });
      toast({
        title: 'Step 4 Completed: Patient Checked In',
        message: `Triage vitals recorded for ${visit.patientName}. Proceed to physician consultation.`,
        type: 'success',
      });
      onVisitUpdated(updated);
      setActiveTab('consultation');
    } catch (err: any) {
      toast({ title: 'Error', message: err.message, type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 6-7: Record Consultation
  const handleSaveConsultation = async () => {
    if (!consultNotes.trim() || !diagnosis.trim()) {
      toast({ title: 'Validation', message: 'Consultation notes and diagnosis are required.', type: 'danger' });
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await OutpatientService.recordConsultation(visit.id, {
        consultationNotes: consultNotes.trim(),
        diagnosis: diagnosis.trim(),
        treatmentPlan: treatmentPlan.trim() || 'Prescription regimen and rest',
      });
      toast({
        title: 'Step 6-7 Completed: Consultation Recorded',
        message: `Diagnosis "${diagnosis}" saved by ${visit.doctorName}.`,
        type: 'success',
      });
      onVisitUpdated(updated);
      setActiveTab('lab');
    } catch (err: any) {
      toast({ title: 'Error', message: err.message, type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 8: Order Labs
  const handleSaveLabs = async () => {
    setIsSubmitting(true);
    try {
      const updated = await OutpatientService.requestLabTests(visit.id, selectedLabTests);
      toast({
        title: 'Step 8 Completed: Lab Tests Requested',
        message: `${selectedLabTests.length} investigations sent to LIS.`,
        type: 'success',
      });
      onVisitUpdated(updated);
      setActiveTab('rx');
    } catch (err: any) {
      toast({ title: 'Error', message: err.message, type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 9: Issue Prescriptions
  const handleSaveRx = async () => {
    setIsSubmitting(true);
    try {
      const updated = await OutpatientService.issuePrescriptions(visit.id, prescriptions);
      toast({
        title: 'Step 9 Completed: Prescriptions Issued',
        message: `${prescriptions.length} medicine orders routed to Pharmacy.`,
        type: 'success',
      });
      onVisitUpdated(updated);
      setActiveTab('billing');
    } catch (err: any) {
      toast({ title: 'Error', message: err.message, type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 10: Generate Charges
  const handleSaveBilling = async () => {
    setIsSubmitting(true);
    try {
      const updated = await OutpatientService.generateBilling(visit.id, Number(fee));
      toast({
        title: 'Step 10 Completed: Charges Generated',
        message: `Invoice generated for $${fee}.00.`,
        type: 'success',
      });
      onVisitUpdated(updated);
    } catch (err: any) {
      toast({ title: 'Error', message: err.message, type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 11: Complete Visit
  const handleCompleteEncounter = async () => {
    setIsSubmitting(true);
    try {
      const updated = await OutpatientService.completeVisit(visit.id);
      toast({
        title: 'Step 11 Completed: Encounter Finished',
        message: `Outpatient visit ${visit.visitNumber} marked as Completed.`,
        type: 'success',
      });
      onVisitUpdated(updated);
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', message: err.message, type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Workflow steps definitions
  const workflowSteps = [
    { num: '1-3', name: 'Intake Token', done: true },
    { num: '4', name: 'Check-in & Vitals', done: visit.status !== 'Registered' },
    { num: '5-7', name: 'Consultation & Dx', done: ['In Consultation', 'Lab Requested', 'Prescription Issued', 'Billed', 'Completed'].includes(visit.status) },
    { num: '8', name: 'Lab Requests', done: ['Lab Requested', 'Prescription Issued', 'Billed', 'Completed'].includes(visit.status) },
    { num: '9', name: 'Prescriptions', done: ['Prescription Issued', 'Billed', 'Completed'].includes(visit.status) },
    { num: '10', name: 'Billing Charge', done: ['Billed', 'Completed'].includes(visit.status) },
    { num: '11', name: 'Complete Visit', done: visit.status === 'Completed' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="-mt-3 space-y-4 text-xs">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-5 -mx-6 -mt-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold bg-teal-500/30 text-teal-300 border border-teal-400/30 px-3 py-1 rounded">
                Token: {visit.queueToken}
              </span>
              <div>
                <h2 className="text-lg font-bold">{visit.patientName}</h2>
                <span className="text-teal-200 text-xs">
                  {visit.patientMrn} • {visit.departmentName} • Attending: {visit.doctorName}
                </span>
              </div>
            </div>
            <Badge variant={visit.status === 'Completed' ? 'success' : 'info'}>
              {visit.status}
            </Badge>
          </div>

          {/* 11-Step Progress Visualizer */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <span className="text-[10px] text-teal-300 uppercase tracking-wider block mb-2 font-bold">
              11-Step Outpatient Clinical Pathway
            </span>
            <div className="grid grid-cols-7 gap-1 text-[10px] text-center">
              {workflowSteps.map((s, idx) => (
                <div
                  key={idx}
                  className={`p-1.5 rounded border transition-colors ${
                    s.done
                      ? 'bg-teal-500/20 text-teal-200 border-teal-400/30 font-bold'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  <div className="text-[9px] font-mono">Step {s.num}</div>
                  <div className="truncate">{s.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'vitals' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" /> 4. Triage Vitals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('consultation')}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'consultation' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" /> 6-7. Consultation & Dx
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lab')}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'lab' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" /> 8. Lab Tests
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rx')}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'rx' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            <Pill className="w-3.5 h-3.5" /> 9. Prescriptions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'billing' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> 10. Billing Charge
          </button>
        </div>

        {/* Tab 1: Vitals */}
        {activeTab === 'vitals' && (
          <div className="space-y-4">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              Step 4: Check-in Patient & Record Triage Vitals
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Input label="Temp (°C)" type="number" step="0.1" value={temp} onChange={(e) => setTemp(Number(e.target.value))} />
              <Input label="BP Systolic" type="number" value={bpSys} onChange={(e) => setBpSys(Number(e.target.value))} />
              <Input label="BP Diastolic" type="number" value={bpDia} onChange={(e) => setBpDia(Number(e.target.value))} />
              <Input label="Heart Rate (bpm)" type="number" value={hr} onChange={(e) => setHr(Number(e.target.value))} />
              <Input label="SpO2 (%)" type="number" value={spo2} onChange={(e) => setSpo2(Number(e.target.value))} />
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="primary" onClick={handleCheckIn} isLoading={isSubmitting}>
                Save Vitals & Complete Check-In <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Consultation & Diagnosis */}
        {activeTab === 'consultation' && (
          <div className="space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              Step 6-7: Record Consultation Notes & Formulate Diagnosis
            </span>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Consultation Notes / Clinical Observations
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs"
                placeholder="Doctor's clinical findings and examination notes..."
                value={consultNotes}
                onChange={(e) => setConsultNotes(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Provisional Diagnosis"
                placeholder="e.g. Acute Pharyngitis / Hypertension"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
              />
              <Input
                label="Treatment Plan"
                placeholder="e.g. Oral antibiotics, warm saline gargles, 5 days rest"
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="primary" onClick={handleSaveConsultation} isLoading={isSubmitting}>
                Save Consultation & Proceed to Tests <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Lab Tests */}
        {activeTab === 'lab' && (
          <div className="space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              Step 8: Request Laboratory Diagnostic Tests (LIS)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableTests.map((t) => (
                <label
                  key={t.code}
                  className={`p-2.5 rounded border flex items-center gap-2 cursor-pointer transition-colors ${
                    selectedLabTests.includes(t.code)
                      ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedLabTests.includes(t.code)}
                    onChange={() => handleToggleLab(t.code)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>{t.name}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="primary" onClick={handleSaveLabs} isLoading={isSubmitting}>
                Confirm Lab Orders & Proceed to Pharmacy <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Tab 4: Prescriptions */}
        {activeTab === 'rx' && (
          <div className="space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              Step 9: Issue Prescriptions to Pharmacy
            </span>

            {/* Quick add box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="grid grid-cols-4 gap-2">
                <input
                  placeholder="Medicine (e.g. Amoxicillin)"
                  value={newRxName}
                  onChange={(e) => setNewRxName(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded col-span-2 bg-white"
                />
                <input
                  placeholder="Dosage (500mg)"
                  value={newRxDosage}
                  onChange={(e) => setNewRxDosage(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded bg-white"
                />
                <Button size="sm" variant="outline" type="button" onClick={handleAddRx}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="border border-slate-200 rounded divide-y divide-slate-100 max-h-36 overflow-y-auto">
              {prescriptions.length === 0 ? (
                <div className="p-4 text-center text-slate-400">No prescriptions added yet.</div>
              ) : (
                prescriptions.map((rx, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{rx.medicineName}</span>
                      <span className="text-slate-500 ml-2">({rx.dosage} • {rx.frequency} • {rx.duration})</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveRx(idx)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="primary" onClick={handleSaveRx} isLoading={isSubmitting}>
                Save Prescriptions & Proceed to Billing <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Tab 5: Billing & Completion */}
        {activeTab === 'billing' && (
          <div className="space-y-4">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              Step 10-11: Generate Consultation Fee & Complete Encounter
            </span>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-emerald-900 font-bold block text-sm">Consultation Charge Fee</span>
                <span className="text-[11px] text-emerald-700">Attending Doctor Standard Specialist Fee</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-900 font-bold text-lg">$</span>
                <input
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-base font-bold text-emerald-900 border border-emerald-300 rounded bg-white text-center"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button size="sm" variant="outline" onClick={handleSaveBilling} isLoading={isSubmitting}>
                Post Billing Invoice
              </Button>

              <Button
                size="sm"
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleCompleteEncounter}
                isLoading={isSubmitting}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Complete Visit & Discharge Patient
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <span className="text-slate-400">Visit Number: {visit.visitNumber}</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Drawer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
