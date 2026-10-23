import React, { useState } from 'react';
import {
  Pill,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  PackageCheck,
  Search,
  BadgeAlert,
  TrendingUp,
  FileText,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface PrescriptionOrder {
  id: string;
  token: string;
  patientName: string;
  mrn: string;
  prescribedBy: string;
  medications: string[];
  totalLKR: number;
  status: 'Pending Dispense' | 'Dispensing' | 'Dispensed';
  time: string;
}

const initialPrescriptions: PrescriptionOrder[] = [
  {
    id: 'RX-2026-4401',
    token: 'T-01',
    patientName: 'Kanthi Jayasuriya',
    mrn: 'MRN-2026-00101',
    prescribedBy: 'Dr. Janaka Senaratne (Cardiology)',
    medications: ['Atorvastatin 20mg (30 tabs)', 'Losartan Potassium 50mg (60 tabs)', 'Aspirin 75mg (30 tabs)'],
    totalLKR: 3850,
    status: 'Pending Dispense',
    time: '09:25 AM',
  },
  {
    id: 'RX-2026-4402',
    token: 'T-02',
    patientName: 'Mohamed Rizwan',
    mrn: 'MRN-2026-00104',
    prescribedBy: 'Dr. Priyantha Jayasuriya (General OPD)',
    medications: ['Amoxicillin 500mg (21 caps)', 'Paracetamol 500mg (20 tabs)', 'Cetirizine 10mg (10 tabs)'],
    totalLKR: 1650,
    status: 'Dispensing',
    time: '09:30 AM',
  },
  {
    id: 'RX-2026-4403',
    token: 'T-05',
    patientName: 'Anura Kumara Dissanayake',
    mrn: 'MRN-2026-00109',
    prescribedBy: 'Dr. Chaminda Weerasinghe (Endocrinology)',
    medications: ['Metformin 500mg (90 tabs)', 'Glimepiride 2mg (30 tabs)'],
    totalLKR: 2400,
    status: 'Pending Dispense',
    time: '09:42 AM',
  },
  {
    id: 'RX-2026-4399',
    token: 'T-88',
    patientName: 'Chitra Rathnayake',
    mrn: 'MRN-2026-00088',
    prescribedBy: 'Dr. Harsha Alwis (Orthopaedics)',
    medications: ['Calcium Carbonate + Vit D3 (60 tabs)', 'Aceclofenac 100mg (14 tabs)'],
    totalLKR: 2850,
    status: 'Dispensed',
    time: '08:50 AM',
  },
];

const lowStockItems = [
  { name: 'Amoxicillin 500mg Capsules', brand: 'SPMC Lanka', currentStock: 48, minRequired: 200, unit: 'caps', urgency: 'Critical' },
  { name: 'Insulin Human Regular 100IU/ml', brand: 'Actrapid', currentStock: 6, minRequired: 25, unit: 'vials', urgency: 'Critical' },
  { name: 'Atorvastatin 20mg Tablets', brand: 'Lipitor/Torvast', currentStock: 110, minRequired: 300, unit: 'tabs', urgency: 'Low' },
  { name: 'IV Normal Saline 0.9% 500ml', brand: 'Astron Lanka', currentStock: 35, minRequired: 100, unit: 'bottles', urgency: 'Warning' },
];

export const PharmacyPortal: React.FC = () => {
  const { addToast } = useToast();
  const [prescriptions, setPrescriptions] = useState<PrescriptionOrder[]>(initialPrescriptions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Dispensed'>('All');

  const handleDispense = (id: string, patientName: string) => {
    setPrescriptions((prev) =>
      prev.map((rx) => (rx.id === id ? { ...rx, status: 'Dispensed' } : rx))
    );
    addToast({
      type: 'success',
      title: 'Prescription Dispensed',
      message: `Medicines issued and label generated for ${patientName} (${id}).`,
    });
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesSearch =
      rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.mrn.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'Pending') return rx.status !== 'Dispensed';
    if (filter === 'Dispensed') return rx.status === 'Dispensed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Portal Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium text-emerald-100 mb-2 border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              NMRA Reg # PH-LK-4821 • MedPulse Central Dispensary
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pharmacy Dispensary Portal</h1>
            <p className="text-emerald-100 text-sm mt-1">
              Logged in as <span className="font-semibold text-white">Malith Silva</span> (Chief Pharmacist) • Counter #02 Active
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
                  title: 'Daily Dispense Log',
                  message: 'Generated pharmacy audit printout for today.',
                });
              }}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Daily Log
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md border-0 text-xs h-10 sm:h-9 justify-center"
              onClick={() => {
                addToast({
                  type: 'success',
                  title: 'Direct Dispense Ready',
                  message: 'Scan barcode or enter prescription number.',
                });
              }}
            >
              <PackageCheck className="w-4 h-4 mr-1.5" />
              Quick Dispense
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Simple Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Queue To Dispense</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {prescriptions.filter((p) => p.status !== 'Dispensed').length}
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Avg dispense time: 4 mins</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dispensed Today</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">87</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">+14% vs yesterday</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Low Stock Warnings</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <BadgeAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">4 Items</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">2 critical restocks required</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pharmacy Sales</span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Rs. 384,500</div>
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 font-medium">Sri Lankan LKR cash & card</p>
        </div>
      </div>

      {/* Main Grid: Prescription Queue + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescription Queue (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Active Prescription Queue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct OPD & Ward e-prescriptions sent from Doctors
              </p>
            </div>
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
              {(['All', 'Pending', 'Dispensed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    filter === tab
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Quick search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient name, MRN, or RX ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Prescription list */}
          <div className="space-y-3">
            {filteredPrescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600/60 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      {rx.token}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                      {rx.patientName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">({rx.mrn})</span>
                    <Badge
                      variant={
                        rx.status === 'Dispensed'
                          ? 'success'
                          : rx.status === 'Dispensing'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {rx.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{rx.prescribedBy}</span> • {rx.time}
                  </div>
                  {/* Medications Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rx.medications.map((med, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {med}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Rs. {rx.totalLKR.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Bill Amount</div>
                  </div>
                  {rx.status !== 'Dispensed' ? (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 sm:h-9 px-4 shadow-sm font-semibold justify-center"
                      onClick={() => handleDispense(rx.id, rx.patientName)}
                    >
                      <PackageCheck className="w-4 h-4 mr-1.5" />
                      Dispense Now
                    </Button>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 py-1">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Issued
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock & Fast Reorder (1 col) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                NMRA Low Stock Warnings
              </h3>
              <Badge variant="danger">4 Urgent</Badge>
            </div>

            <div className="space-y-3">
              {lowStockItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.urgency === 'Critical'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {item.urgency}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 flex justify-between">
                    <span>Mfr: {item.brand}</span>
                    <span>
                      Stock: <strong className="text-rose-600 dark:text-rose-400">{item.currentStock}</strong> / {item.minRequired} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (item.currentStock / item.minRequired) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold h-10 sm:h-9 border-slate-300 dark:border-slate-700 justify-center"
              onClick={() => {
                addToast({
                  type: 'info',
                  title: 'Purchase Order Drafted',
                  message: 'Automated requisition sent to SPC (State Pharmaceuticals Corporation).',
                });
              }}
            >
              Generate SPC Reorder PO
            </Button>
          </div>

          {/* Quick Dispensing Tools */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-sm space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Pharmacist Quick Tools
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => addToast({ type: 'info', title: 'Drug Interaction Tool', message: 'Enter 2 drugs to verify contraindications.' })}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/15 text-left border border-white/10 transition-colors min-h-[48px] active:scale-[0.98]"
              >
                <div className="font-semibold text-xs">Check Interactions</div>
                <div className="text-[10px] text-slate-300">Drug-drug alert</div>
              </button>
              <button
                onClick={() => addToast({ type: 'info', title: 'Batch & Expiry', message: 'NMRA compliance verification active.' })}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/15 text-left border border-white/10 transition-colors min-h-[48px] active:scale-[0.98]"
              >
                <div className="font-semibold text-xs">Batch Expiry Log</div>
                <div className="text-[10px] text-slate-300">FIFO verification</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
