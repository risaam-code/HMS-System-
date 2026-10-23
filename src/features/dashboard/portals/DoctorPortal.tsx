import React, { useState } from 'react';
import {
  Stethoscope,
  Users,
  Clock,
  FileText,
  Pill,
  TestTube2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Bed,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';

interface PatientQueueItem {
  token: string;
  mrn: string;
  name: string;
  age: number;
  gender: string;
  visitReason: string;
  status: 'In Consultation' | 'Waiting' | 'Completed';
  vitals: string;
  time: string;
}

const mockDoctorQueue: PatientQueueItem[] = [
  {
    token: 'T-01',
    mrn: 'MRN-2026-00101',
    name: 'Kanthi Jayasuriya',
    age: 44,
    gender: 'Female',
    visitReason: 'Hypertension review & resting ECG evaluation',
    status: 'In Consultation',
    vitals: 'BP: 140/88 mmHg • HR: 74 bpm',
    time: '09:00 AM',
  },
  {
    token: 'T-02',
    mrn: 'MRN-2026-00103',
    name: 'Dinesh Wickramaratne',
    age: 35,
    gender: 'Male',
    visitReason: 'Post-angioplasty routine cardiac follow-up',
    status: 'Waiting',
    vitals: 'BP: 122/78 mmHg • HR: 68 bpm',
    time: '09:20 AM',
  },
  {
    token: 'T-03',
    mrn: 'MRN-2026-00108',
    name: 'Malkanthi Silva',
    age: 52,
    gender: 'Female',
    visitReason: 'Exertional dyspnea & lipid profile check',
    status: 'Waiting',
    vitals: 'BP: 138/85 mmHg • HR: 82 bpm',
    time: '09:40 AM',
  },
  {
    token: 'T-04',
    mrn: 'MRN-2026-00112',
    name: 'Sunil Weerakkody',
    age: 61,
    gender: 'Male',
    visitReason: 'Medication refill & echocardiogram review',
    status: 'Waiting',
    vitals: 'BP: 130/80 mmHg • HR: 70 bpm',
    time: '10:00 AM',
  },
];

export function DoctorPortal() {
  const { success, info } = useToast();
  const navigate = useNavigate();
  const [activeQueue, setActiveQueue] = useState(mockDoctorQueue);

  const completeConsultation = (token: string, name: string) => {
    setActiveQueue((prev) =>
      prev.map((item) => (item.token === token ? { ...item, status: 'Completed' } : item))
    );
    success(`Consultation completed for ${name}. Digital encounter record saved.`, 'Encounter Finalized');
  };

  return (
    <div className="space-y-6">
      {/* Doctor Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#011e36] to-[#033b66] p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#049bdb]/25 text-[#93ceff] border border-[#049bdb]/40">
              SLMC Reg: 18492
            </span>
            <span className="text-xs text-teal-300 font-medium">Cardiology Clinic • Consultation Room 402</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Welcome, Dr. Janaka Senaratne, MBBS, MD, FRCP
          </h2>
          <p className="text-xs text-white/75">
            Your clinical channeling queue is active. 3 patients currently waiting in OPD Reception.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/medical-records')}
            className="bg-[#049bdb] hover:bg-[#0388c1] text-white font-semibold text-xs h-10 sm:h-9 shadow-md justify-center"
            leftIcon={<FileText className="w-3.5 h-3.5" />}
          >
            Open EMR Charts
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/appointments')}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs h-10 sm:h-9 justify-center"
            leftIcon={<Calendar className="w-3.5 h-3.5" />}
          >
            My Schedule
          </Button>
        </div>
      </div>

      {/* 4 Clean Clinical KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Queue Waiting</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {activeQueue.filter((p) => p.status !== 'Completed').length} Patients
          </h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Average wait: 12 mins
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-400 dark:hover:border-teal-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Today</span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {activeQueue.filter((p) => p.status === 'Completed').length + 6} Consults
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            Target: 16 channeling appointments
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-cyan-400 dark:hover:border-cyan-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Inpatient Rounds</span>
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">4 Patients</h3>
          <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium mt-1">
            Ward 04 Cardiology Wing Bed B-02, B-04
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Channeling Fees</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">Rs. 49,000</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            Rs. 3,500/consultation (14 slots booked)
          </p>
        </div>
      </div>

      {/* Active Consultation Queue Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#049bdb]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active OPD Consultation Queue</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
              Live Token Flow
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Channeling Date: 23/10/2026</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activeQueue.map((patient) => {
            const isCompleted = patient.status === 'Completed';
            const inConsult = patient.status === 'In Consultation';

            return (
              <div
                key={patient.token}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  inConsult
                    ? 'bg-blue-50/50 dark:bg-blue-950/30 border-l-4 border-l-[#049bdb]'
                    : isCompleted
                    ? 'bg-slate-50/60 dark:bg-slate-800/20 opacity-60'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center font-mono shrink-0 shadow-xs ${
                      inConsult
                        ? 'bg-[#049bdb] text-white font-bold'
                        : isCompleted
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold'
                    }`}
                  >
                    <span className="text-[9px] uppercase leading-none opacity-80">TOKEN</span>
                    <span className="text-sm font-bold leading-tight">{patient.token}</span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{patient.name}</h4>
                      <span className="text-xs text-slate-400 font-mono">({patient.mrn})</span>
                      <Badge
                        variant={inConsult ? 'info' : isCompleted ? 'success' : 'default'}
                        className="text-[10px]"
                      >
                        {patient.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{patient.visitReason}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Age: {patient.age}y ({patient.gender})</span>
                      <span>•</span>
                      <span className="text-teal-600 dark:text-teal-400 font-semibold">{patient.vitals}</span>
                      <span>•</span>
                      <span>Time: {patient.time}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Doctor Actions: Responsive touch layout */}
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/80 w-full md:w-auto">
                  {!isCompleted && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/pharmacy')}
                        className="text-xs h-10 sm:h-9 w-full sm:w-auto justify-center"
                        leftIcon={<Pill className="w-3.5 h-3.5 text-emerald-500" />}
                      >
                        Prescribe Rx
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/laboratory')}
                        className="text-xs h-10 sm:h-9 w-full sm:w-auto justify-center"
                        leftIcon={<TestTube2 className="w-3.5 h-3.5 text-amber-500" />}
                      >
                        Order Lab
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => completeConsultation(patient.token, patient.name)}
                        className="col-span-2 sm:col-span-1 text-xs h-10 sm:h-9 w-full sm:w-auto bg-[#049bdb] hover:bg-[#0388c1] text-white font-semibold shadow-sm justify-center"
                      >
                        Finish Consult
                      </Button>
                    </>
                  )}
                  {isCompleted && (
                    <div className="col-span-2 sm:col-span-1 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Consultation Complete
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
