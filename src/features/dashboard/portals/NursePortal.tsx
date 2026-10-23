import React, { useState } from 'react';
import {
  Bed,
  Activity,
  HeartPulse,
  Pill,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';

interface WardBedItem {
  bedNumber: string;
  wardName: string;
  patientName: string;
  mrn: string;
  age: number;
  attendingDoctor: string;
  lastVitals: string;
  vitalsStatus: 'Normal' | 'Overdue' | 'Critical';
  medicationDue: string;
}

const mockWardBeds: WardBedItem[] = [
  {
    bedNumber: 'W4-B01',
    wardName: 'Medical Ward 04',
    patientName: 'Sunimal Fernando',
    mrn: 'MRN-2026-00102',
    age: 51,
    attendingDoctor: 'Dr. Chaminda Bandara',
    lastVitals: 'BP 128/82 • HR 72 • SpO2 98%',
    vitalsStatus: 'Normal',
    medicationDue: 'Aspirin 75mg (12:00 PM)',
  },
  {
    bedNumber: 'W4-B02',
    wardName: 'Medical Ward 04',
    patientName: 'Chamara Rajapakse',
    mrn: 'MRN-2026-00105',
    age: 47,
    attendingDoctor: 'Dr. Priyantha Alwis',
    lastVitals: 'BP 145/95 • HR 94 • SpO2 95%',
    vitalsStatus: 'Critical',
    medicationDue: 'IV Cefuroxime 750mg STAT',
  },
  {
    bedNumber: 'W4-B03',
    wardName: 'Medical Ward 04',
    patientName: 'Sarath Gunasekera',
    mrn: 'MRN-2026-00114',
    age: 63,
    attendingDoctor: 'Dr. Janaka Senaratne',
    lastVitals: 'Recorded 4 hrs ago',
    vitalsStatus: 'Overdue',
    medicationDue: 'Metformin 500mg (Post-lunch)',
  },
  {
    bedNumber: 'W4-B04',
    wardName: 'Medical Ward 04',
    patientName: 'Anula Damayanthi',
    mrn: 'MRN-2026-00118',
    age: 39,
    attendingDoctor: 'Dr. Dilani Wijesinghe',
    lastVitals: 'BP 118/76 • HR 68 • SpO2 99%',
    vitalsStatus: 'Normal',
    medicationDue: 'Paracetamol 1g PRN',
  },
];

export function NursePortal() {
  const { success } = useToast();
  const navigate = useNavigate();
  const [beds, setBeds] = useState(mockWardBeds);

  const handleRecordVitals = (bedNum: string, patientName: string) => {
    setBeds((prev) =>
      prev.map((b) =>
        b.bedNumber === bedNum
          ? {
              ...b,
              vitalsStatus: 'Normal',
              lastVitals: 'BP 120/80 • HR 72 • SpO2 99% (Just now)',
            }
          : b
      )
    );
    success(`Vitals recorded and charted for ${patientName} (${bedNum}).`, 'Vitals Logged');
  };

  return (
    <div className="space-y-6">
      {/* Nurse Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#011e36] via-[#022f54] to-teal-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/25 text-teal-300 border border-teal-500/40">
              Nursing In-Charge
            </span>
            <span className="text-xs text-teal-200">Inpatient Medical Ward 04 & Surgical ICU</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Sister Sanduni Jayawardena, RN, BSc Nursing
          </h2>
          <p className="text-xs text-white/75">
            Ward census is at 82% capacity. 4 active patient beds assigned to your shift.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/inpatient')}
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs h-10 sm:h-9 w-full sm:w-auto shadow-md justify-center"
            leftIcon={<Bed className="w-3.5 h-3.5" />}
          >
            Ward & Bed Management
          </Button>
        </div>
      </div>

      {/* 4 Nursing KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl bg-white dark:bg-slate-900 p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-400 dark:hover:border-teal-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Occupancy</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">28 / 34 Beds</h3>
          <p className="text-[10px] sm:text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-1">6 beds available</p>
        </div>

        <div className="rounded-xl bg-white dark:bg-slate-900 p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Vitals Check</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">1 Overdue</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Bed W4-B03 due</p>
        </div>

        <div className="rounded-xl bg-white dark:bg-slate-900 p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Med Rounds</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">4 Doses Due</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">12:00 PM round</p>
        </div>

        <div className="rounded-xl bg-white dark:bg-slate-900 p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Discharges</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">2 Patients</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Summary pending</p>
        </div>
      </div>

      {/* Ward Inpatient Census Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ward 04 Inpatient Bed Census & Vitals</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Shift: Morning (07:00 - 15:00)</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {beds.map((bed) => {
            const isCritical = bed.vitalsStatus === 'Critical';
            const isOverdue = bed.vitalsStatus === 'Overdue';

            return (
              <div
                key={bed.bedNumber}
                className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-11 sm:h-11 sm:w-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-300 flex flex-col items-center justify-center font-mono font-bold shrink-0">
                    <span className="text-[8px] sm:text-[9px] uppercase opacity-75">BED</span>
                    <span className="text-xs font-black">{bed.bedNumber.replace('W4-', '')}</span>
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{bed.patientName}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">({bed.mrn})</span>
                      <Badge
                        variant={isCritical ? 'danger' : isOverdue ? 'warning' : 'success'}
                        className="text-[10px]"
                      >
                        {bed.vitalsStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                      <span>Attending: <strong className="text-slate-800 dark:text-white">{bed.attendingDoctor}</strong></span>
                      <span>•</span>
                      <span>Next Rx: <span className="text-rose-600 dark:text-rose-400 font-semibold">{bed.medicationDue}</span></span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Vitals: {bed.lastVitals}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/80 w-full md:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRecordVitals(bed.bedNumber, bed.patientName)}
                    className="text-xs h-10 sm:h-9 w-full sm:w-auto justify-center text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                    leftIcon={<Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                  >
                    Take Vitals
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => success(`Administered ${bed.medicationDue} to ${bed.patientName}`, 'Medication Charted')}
                    className="text-xs h-10 sm:h-9 w-full sm:w-auto justify-center"
                    leftIcon={<Pill className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  >
                    Give Meds
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
