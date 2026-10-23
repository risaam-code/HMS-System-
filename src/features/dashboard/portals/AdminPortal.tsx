import React from 'react';
import {
  Building2,
  Users,
  Bed,
  DollarSign,
  Activity,
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Stethoscope,
  Pill,
  TestTube2,
  PhoneCall,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export const AdminPortal: React.FC = () => {
  const { addToast } = useToast();

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-8 -top-8 w-52 h-52 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium mb-2 border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              MedPulse Healthcare System • Hospital Operations Command
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Executive Director Portal</h1>
            <p className="text-slate-300 text-sm mt-1">
              Logged in as <span className="font-semibold text-white">Dr. Ruwan Ekanayake</span> (Director of Medical Services • MBBS, MD, FRCP)
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-10 sm:h-9 justify-center"
              onClick={() => {
                addToast({
                  type: 'info',
                  title: 'Ministry of Health Export',
                  message: 'Generated MOH Sri Lanka Daily Hospital Census & Morbidity report.',
                });
              }}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Export MOH
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-md border-0 text-xs h-10 sm:h-9 justify-center"
              onClick={() => {
                addToast({
                  type: 'success',
                  title: 'Hospital System Synchronized',
                  message: 'All 7 clinical wings reporting normal operations.',
                });
              }}
            >
              <Activity className="w-4 h-4 mr-1.5" />
              Health Audit
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Primary Executive KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hospital Occupancy</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">142 / 180</div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">78.8% Bed Utilization</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today's Total Patients</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">214 Visits</div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">OPD, ETU & Inpatients</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hospital Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Rs. 1,420,500</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">LKR Day-to-date collection</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Staff On Duty</span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">102 Active</div>
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 font-medium">34 Doctors • 56 Nurses • 12 Techs</p>
        </div>
      </div>

      {/* Departmental Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* OPD & Channeling */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <Stethoscope className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">OPD Channeling</h3>
            </div>
            <Badge variant="success">Normal</Badge>
          </div>
          <p className="text-xs text-slate-500">
            4 Consultant suites running. 118 tokens issued with 89 patients completed.
          </p>
          <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span>Cardiology Suite:</span>
              <strong className="text-slate-900 dark:text-white">Dr. Janaka Senaratne</strong>
            </div>
            <div className="flex justify-between">
              <span>Average wait:</span>
              <span>14 mins</span>
            </div>
          </div>
        </div>

        {/* Pharmacy & NMRA Compliance */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Pill className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Pharmacy & NMRA</h3>
            </div>
            <Badge variant="warning">4 Low Stock</Badge>
          </div>
          <p className="text-xs text-slate-500">
            87 prescriptions dispensed today. 4 critical antibiotics reorder drafted to SPC Lanka.
          </p>
          <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span>Chief Pharmacist:</span>
              <strong className="text-slate-900 dark:text-white">Malith Silva</strong>
            </div>
            <div className="flex justify-between">
              <span>Dispense rate:</span>
              <span>96.2% within 5m</span>
            </div>
          </div>
        </div>

        {/* Laboratory & Pathology */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <TestTube2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Clinical Laboratory</h3>
            </div>
            <Badge variant="success">ISO 15189 OK</Badge>
          </div>
          <p className="text-xs text-slate-500">
            142 reports authorized. 2 STAT urgent cardiac markers signed off with zero delays.
          </p>
          <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span>Senior MLT:</span>
              <strong className="text-slate-900 dark:text-white">Anita Fernando</strong>
            </div>
            <div className="flex justify-between">
              <span>Analyzers:</span>
              <span>All 4 Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Administration Bar */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Emergency Services & 1990 Suwa Seriya Link
            </div>
            <div className="text-xs text-slate-500">Direct hospital dispatch line operational 24/7</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> All Systems Online
          </span>
        </div>
      </div>
    </div>
  );
};
