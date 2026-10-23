import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Receipt,
  Printer,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  QrCode,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  patientName: string;
  mrn: string;
  serviceType: string;
  amountLKR: number;
  status: 'Pending' | 'Paid';
  paymentMethod?: 'Cash' | 'Card' | 'LankaQR' | 'Agrahara / SLIC';
  time: string;
}

const initialInvoices: InvoiceItem[] = [
  {
    id: 'INV-1',
    invoiceNumber: 'INV-2026-0041',
    patientName: 'Kanthi Jayasuriya',
    mrn: 'MRN-2026-00101',
    serviceType: 'Cardiology Consultation + Resting ECG + Echo',
    amountLKR: 9500,
    status: 'Pending',
    time: '09:20 AM',
  },
  {
    id: 'INV-2',
    invoiceNumber: 'INV-2026-0042',
    patientName: 'Mohamed Rizwan',
    mrn: 'MRN-2026-00104',
    serviceType: 'OPD Doctor Fee + Pharmacy Medication',
    amountLKR: 4150,
    status: 'Pending',
    time: '09:35 AM',
  },
  {
    id: 'INV-3',
    invoiceNumber: 'INV-2026-0043',
    patientName: 'Nimal Bandara',
    mrn: 'MRN-2026-00105',
    serviceType: 'Dengue NS1 Antigen + FBC Lab Testing',
    amountLKR: 3200,
    status: 'Pending',
    time: '09:40 AM',
  },
  {
    id: 'INV-4',
    invoiceNumber: 'INV-2026-0038',
    patientName: 'Dinesh Wickramaratne',
    mrn: 'MRN-2026-00103',
    serviceType: 'Troponin I STAT + Ward Bed Observation',
    amountLKR: 18500,
    status: 'Paid',
    paymentMethod: 'Card',
    time: '08:45 AM',
  },
  {
    id: 'INV-5',
    invoiceNumber: 'INV-2026-0037',
    patientName: 'Chitra Rathnayake',
    mrn: 'MRN-2026-00088',
    serviceType: 'Orthopaedic Consultation & X-Ray',
    amountLKR: 7800,
    status: 'Paid',
    paymentMethod: 'Cash',
    time: '08:15 AM',
  },
];

export const BillingPortal: React.FC = () => {
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceItem[]>(initialInvoices);

  const handlePay = (id: string, method: 'Cash' | 'Card' | 'LankaQR', patient: string, amount: number) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: 'Paid', paymentMethod: method } : inv
      )
    );
    addToast({
      type: 'success',
      title: 'Payment Received',
      message: `Rs. ${amount.toLocaleString()} settled via ${method} for ${patient}. Receipt printed.`,
    });
  };

  const totalCollected = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((sum, item) => sum + item.amountLKR, 0) + 816200; // adding day's base collections

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium text-emerald-100 mb-2 border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              MedPulse Cashier & Revenue Section • Sri Lankan Rupee (LKR)
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Billing & Revenue Settlement</h1>
            <p className="text-emerald-100 text-sm mt-1">
              Logged in as <span className="font-semibold text-white">Nadeeka Perera</span> (Senior Cashier) • Drawer #01 Active
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
                  title: 'Drawer Balancing',
                  message: 'Daily cash reconcile statement generated.',
                });
              }}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Reconcile
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md border-0 text-xs h-10 sm:h-9 justify-center"
              onClick={() => {
                addToast({
                  type: 'success',
                  title: 'LankaQR Display Ready',
                  message: 'Customer LankaQR terminal activated on counter.',
                });
              }}
            >
              <QrCode className="w-4 h-4 mr-1.5" />
              Show LankaQR
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Simple Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today's Collections</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            Rs. {totalCollected.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">OPD, Lab & Pharmacy LKR</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unpaid Invoices</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {invoices.filter((i) => i.status === 'Pending').length} Pending
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Awaiting cashier payment</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">LankaQR & Card</span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">58% Digital</div>
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 font-medium">Direct bank settlement</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Insurance & Agrahara</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Rs. 142,000</div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">SLIC & Ceylinco cashless</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Patient Invoices & Payment Settlement
            </h2>
            <p className="text-xs text-slate-500">Collect payments and issue official Sri Lanka hospital receipt</p>
          </div>
          <Badge variant="outline">Today's Batch</Badge>
        </div>

        <div className="space-y-3">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600/60 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
                    {inv.invoiceNumber}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {inv.patientName}
                  </span>
                  <span className="text-xs text-slate-500">({inv.mrn})</span>
                  <Badge variant={inv.status === 'Paid' ? 'success' : 'warning'}>
                    {inv.status}
                  </Badge>
                  {inv.paymentMethod && (
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                      Via {inv.paymentMethod}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Services: <span className="font-medium">{inv.serviceType}</span> • Billed at {inv.time}
                </div>
              </div>

              {/* Amount and Settlement Action */}
              <div className="flex flex-col sm:flex-row sm:items-center md:flex-col md:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                <div className="text-left sm:text-right">
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    Rs. {inv.amountLKR.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400">Total Payable (LKR)</div>
                </div>

                {inv.status === 'Pending' ? (
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 sm:h-9 px-3.5 shadow-sm font-semibold flex-1 sm:flex-none justify-center"
                      onClick={() => handlePay(inv.id, 'Cash', inv.patientName, inv.amountLKR)}
                    >
                      Cash
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-10 sm:h-9 px-3.5 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold flex-1 sm:flex-none justify-center"
                      onClick={() => handlePay(inv.id, 'Card', inv.patientName, inv.amountLKR)}
                    >
                      Card
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-10 sm:h-9 px-3.5 border-teal-500 text-teal-700 dark:text-teal-300 font-semibold flex-1 sm:flex-none justify-center"
                      onClick={() => handlePay(inv.id, 'LankaQR', inv.patientName, inv.amountLKR)}
                    >
                      LankaQR
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-10 sm:h-9 px-4 justify-center w-full sm:w-auto font-medium"
                    onClick={() => {
                      addToast({
                        type: 'info',
                        title: 'Official Receipt',
                        message: `Printed duplicate VAT receipt for ${inv.invoiceNumber}.`,
                      });
                    }}
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Print Receipt
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
