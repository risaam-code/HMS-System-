import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { BillingService } from '@/services/billingService';
import { Invoice, Payment, RefundRecord } from '@/types';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { PaymentModal } from './PaymentModal';
import { RefundModal } from './RefundModal';
import { PrintableInvoiceModal } from './PrintableInvoiceModal';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  Receipt,
  CreditCard,
  Undo2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export function BillingPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'refunds'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | undefined>(undefined);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<Payment | null>(null);

  const loadData = () => {
    Promise.all([
      BillingService.getInvoices(),
      BillingService.getPayments(),
      BillingService.getRefunds(),
    ]).then(([invList, payList, refList]) => {
      setInvoices(invList);
      setPayments(payList);
      setRefunds(refList);
    });
  };

  useEffect(() => {
    loadData();
    const unsub = BillingService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, []);

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalCollected = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalBalanceDue = invoices.reduce((sum, i) => sum + i.balanceDue, 0);
  const pendingInvoicesCount = invoices.filter((i) => i.balanceDue > 0).length;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.patientMrn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter((p) => {
    return (
      p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredRefunds = refunds.filter((r) => {
    return (
      r.refundNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Billing, Invoices & Payments</h1>
              <p className="text-sm text-slate-500">
                Itemized invoice generation, secure payment collection, PCI-DSS compliance, and authorized refund management
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedInvoiceForPayment(undefined);
              setIsPaymentModalOpen(true);
            }}
            className="gap-1.5 text-xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Record Payment
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5 text-xs shadow-xs shadow-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Invoiced</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalInvoiced)}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{invoices.length} total patient invoices</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Revenue Collected</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                {totalInvoiced > 0 ? `${Math.round((totalCollected / totalInvoiced) * 100)}% realization rate` : '0%'}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outstanding Balance</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalBalanceDue)}</h3>
              <p className="text-[11px] text-rose-600 font-medium mt-0.5">Accounts receivable pending</p>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Invoices</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingInvoicesCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Unpaid or partially settled</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 bg-white p-1 rounded-xl shadow-xs">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'invoices'
              ? 'bg-emerald-50 text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Patient Invoices Ledger ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'payments'
              ? 'bg-emerald-50 text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Receipts ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'refunds'
              ? 'bg-emerald-50 text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Undo2 className="w-4 h-4" />
          <span>Refunds & Adjustments ({refunds.length})</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'invoices'
                ? 'Search invoice #, patient, MRN...'
                : activeTab === 'payments'
                ? 'Search receipt #, invoice, patient...'
                : 'Search refund #, invoice, reason...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        {activeTab === 'invoices' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Invoices</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid in Full</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Invoices Ledger */}
      {activeTab === 'invoices' && (
        <Card className="overflow-hidden border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-3 pl-4">Invoice #</th>
                  <th className="p-3">Patient & MRN</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Total Invoiced</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No invoices found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 pl-4">
                        <span className="font-mono font-bold text-teal-700">{inv.invoiceNumber}</span>
                        {inv.admissionId && (
                          <span className="block text-[10px] text-slate-400">IPD Encounter</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{inv.patientName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{inv.patientMrn}</span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        {inv.dueDate}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="p-3 text-right font-semibold text-emerald-600 font-mono">
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-600 font-mono">
                        {formatCurrency(inv.balanceDue)}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            inv.status === 'paid'
                              ? 'success'
                              : inv.status === 'partially_paid'
                              ? 'warning'
                              : inv.status === 'unpaid'
                              ? 'destructive'
                              : 'default'
                          }
                        >
                          {inv.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3 pr-4 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoiceForPrint(inv);
                            setIsPrintModalOpen(true);
                          }}
                          className="gap-1 text-[11px] py-1 h-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Superbill
                        </Button>
                        {inv.balanceDue > 0 && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedInvoiceForPayment(inv);
                              setIsPaymentModalOpen(true);
                            }}
                            className="gap-1 text-[11px] py-1 h-auto"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Pay
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Payments & Receipts */}
      {activeTab === 'payments' && (
        <Card className="overflow-hidden border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-3 pl-4">Receipt #</th>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Tender Channel</th>
                  <th className="p-3">Transaction Reference</th>
                  <th className="p-3 text-right">Amount Tendered</th>
                  <th className="p-3">Received By</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 pl-4 font-mono font-bold text-emerald-700">
                        {p.receiptNumber}
                      </td>
                      <td className="p-3 font-mono font-medium text-teal-700">
                        {p.invoiceNumber}
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        {p.patientName}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-700 uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded-md">
                          {p.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600 text-[11px]">
                        {p.transactionReference || 'N/A'}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600 font-mono">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="p-3 text-slate-700">
                        {p.receivedByName}
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 pr-4 text-right">
                        {p.isRefund ? (
                          <Badge variant="destructive">REFUNDED</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPaymentForRefund(p);
                              setIsRefundModalOpen(true);
                            }}
                            className="text-[11px] py-1 h-auto text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                          >
                            <Undo2 className="w-3 h-3 mr-1" />
                            Refund
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Refunds Log */}
      {activeTab === 'refunds' && (
        <Card className="overflow-hidden border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-3 pl-4">Refund #</th>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3 text-right">Refund Amount</th>
                  <th className="p-3">Authorized Justification</th>
                  <th className="p-3">Authorized By</th>
                  <th className="p-3 pr-4">Processed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRefunds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No refund records logged.
                    </td>
                  </tr>
                ) : (
                  filteredRefunds.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 pl-4 font-mono font-bold text-rose-600">
                        {r.refundNumber}
                      </td>
                      <td className="p-3 font-mono font-medium text-teal-700">
                        {r.invoiceNumber}
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        {r.patientName}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-600 font-mono">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="p-3 text-slate-700">
                        {r.reason}
                      </td>
                      <td className="p-3 font-medium text-slate-800">
                        {r.authorizedByName}
                      </td>
                      <td className="p-3 pr-4 text-slate-500">
                        {new Date(r.authorizedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadData}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoiceForPayment(undefined);
        }}
        preselectedInvoice={selectedInvoiceForPayment}
        onSuccess={loadData}
      />

      {selectedInvoiceForPrint && (
        <PrintableInvoiceModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setSelectedInvoiceForPrint(null);
          }}
          invoice={selectedInvoiceForPrint}
        />
      )}

      {selectedPaymentForRefund && (
        <RefundModal
          isOpen={isRefundModalOpen}
          onClose={() => {
            setIsRefundModalOpen(false);
            setSelectedPaymentForRefund(null);
          }}
          payment={selectedPaymentForRefund}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
