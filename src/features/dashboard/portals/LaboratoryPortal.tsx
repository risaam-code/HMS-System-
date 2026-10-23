import React, { useState } from 'react';
import {
  TestTube2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Microscope,
  FileCheck,
  Search,
  Flame,
  Activity,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface LabOrder {
  id: string;
  token: string;
  patientName: string;
  mrn: string;
  testName: string;
  specimenType: string;
  tubeColor: string;
  orderedBy: string;
  priority: 'STAT' | 'Urgent' | 'Routine';
  status: 'Pending Collection' | 'Processing' | 'Ready for Signoff' | 'Completed';
  orderedTime: string;
  resultValue?: string;
  referenceRange?: string;
}

const initialLabOrders: LabOrder[] = [
  {
    id: 'LAB-2026-8801',
    token: 'T-01',
    patientName: 'Kanthi Jayasuriya',
    mrn: 'MRN-2026-00101',
    testName: 'Lipid Profile (TC, HDL, LDL, Triglycerides)',
    specimenType: 'Serum (Venous Blood)',
    tubeColor: 'bg-amber-500',
    orderedBy: 'Dr. Janaka Senaratne (Cardiology)',
    priority: 'Routine',
    status: 'Ready for Signoff',
    orderedTime: '08:45 AM',
    resultValue: 'TC: 218 mg/dL | LDL: 142 mg/dL | HDL: 44 mg/dL',
    referenceRange: 'TC < 200, LDL < 100 mg/dL',
  },
  {
    id: 'LAB-2026-8802',
    token: 'T-04',
    patientName: 'Nimal Bandara',
    mrn: 'MRN-2026-00105',
    testName: 'Dengue NS1 Antigen + Full Blood Count',
    specimenType: 'Whole Blood EDTA',
    tubeColor: 'bg-purple-600',
    orderedBy: 'Dr. Priyantha Jayasuriya (OPD)',
    priority: 'STAT',
    status: 'Processing',
    orderedTime: '09:15 AM',
    resultValue: 'Platelets: 108,000 /uL | NS1: Positive',
    referenceRange: 'PLT 150,000 - 450,000',
  },
  {
    id: 'LAB-2026-8803',
    token: 'T-06',
    patientName: 'Siti Fathima',
    mrn: 'MRN-2026-00112',
    testName: 'Serum Creatinine & Blood Urea (eGFR)',
    specimenType: 'Serum (Plain Tube)',
    tubeColor: 'bg-red-500',
    orderedBy: 'Dr. Ruwan Ekanayake (Ward 04)',
    priority: 'Urgent',
    status: 'Pending Collection',
    orderedTime: '09:30 AM',
  },
  {
    id: 'LAB-2026-8804',
    token: 'T-09',
    patientName: 'Dinesh Wickramaratne',
    mrn: 'MRN-2026-00103',
    testName: 'Cardiac Troponin I (High Sensitivity)',
    specimenType: 'Lithium Heparin Plasma',
    tubeColor: 'bg-emerald-600',
    orderedBy: 'Dr. Janaka Senaratne (Cardiology)',
    priority: 'STAT',
    status: 'Completed',
    orderedTime: '08:10 AM',
    resultValue: '< 0.01 ng/mL (Negative)',
    referenceRange: '< 0.04 ng/mL',
  },
];

export const LaboratoryPortal: React.FC = () => {
  const { addToast } = useToast();
  const [orders, setOrders] = useState<LabOrder[]>(initialLabOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'All' | 'STAT' | 'Routine'>('All');

  const handleSignoff = (id: string, testName: string, patient: string) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status: 'Completed' } : order))
    );
    addToast({
      type: 'success',
      title: 'Lab Report Authorized & Released',
      message: `${testName} result for ${patient} digitally sent to consulting doctor.`,
    });
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterPriority === 'STAT') return o.priority === 'STAT' || o.priority === 'Urgent';
    if (filterPriority === 'Routine') return o.priority === 'Routine';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium text-purple-100 mb-2 border border-white/20">
              <Microscope className="w-3.5 h-3.5 text-purple-300" />
              ISO 15189 Accredited Clinical Pathology Laboratory • Section B
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clinical Laboratory Portal</h1>
            <p className="text-purple-100 text-sm mt-1">
              Logged in as <span className="font-semibold text-white">Anita Fernando</span> (Senior Medical Lab Scientist • SLMC #MLT-2091)
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs h-10 sm:h-9 justify-center"
              onClick={() => {
                addToast({
                  type: 'info',
                  title: 'Barcode Scanner Enabled',
                  message: 'Ready to scan vacutainer tube specimen barcode.',
                });
              }}
            >
              <TestTube2 className="w-4 h-4 mr-1.5" />
              Scan Tube
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-purple-500 hover:bg-purple-600 text-white shadow-md border-0 text-xs h-10 sm:h-9 justify-center"
              onClick={() => {
                addToast({
                  type: 'success',
                  title: 'Batch Quality Control',
                  message: 'Sysmex Hematology & Roche Cobas analyzers calibrated OK.',
                });
              }}
            >
              <FileCheck className="w-4 h-4 mr-1.5" />
              Daily QC Check
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Simple Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Samples Pending</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {orders.filter((o) => o.status !== 'Completed').length}
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">In collection or analyzer</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">STAT Urgent Tests</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">2 STAT</div>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">Target turnaround: 30 mins</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reports Signed Off</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">142</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">100% digital verification</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Analyzer Uptime</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">99.8%</div>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">All 4 analyzers online</p>
        </div>
      </div>

      {/* Lab Orders Queue Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Microscope className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Laboratory Test Orders & Specimen Processing
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time specimen pipeline from OPD channeling, Emergency, and Inpatient Wards
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
              {(['All', 'STAT', 'Routine'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterPriority(tab)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    filterPriority === tab
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search test name, patient, MRN or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Order Cards */}
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600/60 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                    {order.token}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {order.patientName}
                  </span>
                  <span className="text-xs text-slate-500">({order.mrn})</span>
                  <Badge
                    variant={
                      order.priority === 'STAT'
                        ? 'danger'
                        : order.priority === 'Urgent'
                        ? 'warning'
                        : 'secondary'
                    }
                  >
                    {order.priority}
                  </Badge>
                  <Badge
                    variant={
                      order.status === 'Completed'
                        ? 'success'
                        : order.status === 'Ready for Signoff'
                        ? 'info'
                        : 'outline'
                    }
                  >
                    {order.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-900 dark:text-white">{order.testName}</span>
                  <span className="flex items-center gap-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${order.tubeColor} inline-block`} />
                    {order.specimenType}
                  </span>
                </div>

                {order.resultValue && (
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Entered Value: </span>
                    <span className="font-mono text-purple-700 dark:text-purple-300 font-semibold">{order.resultValue}</span>
                    {order.referenceRange && (
                      <span className="text-slate-400 text-[11px] ml-2">| Ref: {order.referenceRange}</span>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-slate-400">
                  Requested by {order.orderedBy} • {order.orderedTime}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 md:flex-col md:items-end justify-between pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0 w-full md:w-auto">
                {order.status === 'Ready for Signoff' ? (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-10 sm:h-9 px-4 shadow-sm font-semibold justify-center w-full md:w-auto"
                    onClick={() => handleSignoff(order.id, order.testName, order.patientName)}
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Verify & Release
                  </Button>
                ) : order.status === 'Completed' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-10 sm:h-9 px-4 justify-center w-full md:w-auto font-medium"
                    onClick={() => {
                      addToast({
                        type: 'info',
                        title: 'Lab Report PDF',
                        message: `Printing official lab report for ${order.patientName}.`,
                      });
                    }}
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Print Report
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-10 sm:h-9 px-4 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 justify-center w-full md:w-auto font-medium"
                    onClick={() => {
                      addToast({
                        type: 'info',
                        title: 'Analyzer Input',
                        message: `Enter test values for ${order.id}.`,
                      });
                    }}
                  >
                    Enter Result
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
