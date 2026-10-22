import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Invoice, Payment } from '@/types';
import { BillingService } from '@/services/billingService';
import { formatCurrency } from '@/lib/utils';
import { Printer, ShieldCheck, AlertCircle, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface PrintableInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

export function PrintableInvoiceModal({
  isOpen,
  onClose,
  invoice,
}: PrintableInvoiceModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (isOpen) {
      BillingService.getPayments(invoice.id).then((pList) => {
        setPayments(pList);
      });
    }
  }, [isOpen, invoice.id]);

  const isPaid = invoice.status === 'paid' && invoice.balanceDue <= 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hospital Superbill & Financial Statement" size="xl">
      <div className="space-y-6">
        {/* Printable Superbill Document */}
        <div id="printable-superbill" className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 text-teal-700">
                <Building2 className="w-6 h-6" />
                <span className="text-xl font-black tracking-tight text-slate-900">
                  MedPulse <span className="text-teal-600 font-bold">HEALTHCARE</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Academic Medical Center • JCI Accredited Hospital
              </p>
              <p className="text-xs text-slate-500">
                100 Medical Center Blvd, Metro City • Phone: +1 (555) 019-2831
              </p>
              <p className="text-[11px] text-slate-400">
                Tax ID: US-EIN-992104-MED • License: HOSP-2026-NY-8812
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Official Superbill
              </span>
              <h2 className="text-xl font-mono font-bold text-teal-700 mt-0.5">{invoice.invoiceNumber}</h2>
              <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                <p>Issued: <span className="font-medium text-slate-900">{new Date(invoice.createdAt).toLocaleDateString()}</span></p>
                <p>Due Date: <span className="font-medium text-slate-900">{invoice.dueDate}</span></p>
              </div>
            </div>
          </div>

          {/* Patient Details & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block uppercase font-semibold text-[10px] tracking-wider mb-1">
                Patient Information
              </span>
              <p className="font-bold text-sm text-slate-900">{invoice.patientName}</p>
              <p className="font-mono text-slate-600">MRN: {invoice.patientMrn}</p>
              <p className="text-slate-500 mt-1">Account ID: {invoice.patientId}</p>
            </div>

            <div className="sm:text-right flex flex-col justify-between items-start sm:items-end">
              <div>
                <span className="text-slate-500 block uppercase font-semibold text-[10px] tracking-wider mb-1">
                  Settlement Status
                </span>
                <Badge
                  variant={isPaid ? 'success' : invoice.status === 'partially_paid' ? 'warning' : 'destructive'}
                  className="text-xs py-1 px-3 uppercase tracking-wider font-bold"
                >
                  {isPaid ? 'PAID IN FULL' : invoice.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {invoice.admissionId && (
                <p className="text-[11px] text-teal-700 font-medium mt-2">
                  Inpatient Admission Encounter: {invoice.admissionId}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Services Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/75 text-slate-700 font-semibold uppercase tracking-wider">
                  <th className="p-3 pl-4">Service Category</th>
                  <th className="p-3">Clinical Description</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 pr-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-slate-50/50">
                    <td className="p-3 pl-4">
                      <span className="font-semibold text-teal-700 uppercase text-[10px] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {it.serviceType}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-800">
                      {it.description}
                      {it.referenceType && it.referenceType !== 'manual' && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          Ref: {it.referenceType} ({it.referenceId || 'Linked'})
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700">
                      {formatCurrency(it.unitPrice)}
                    </td>
                    <td className="p-3 text-center font-medium text-slate-700">
                      {it.quantity}
                    </td>
                    <td className="p-3 pr-4 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(it.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Calculation */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="w-full sm:w-1/2 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Terms & Conditions:</p>
              <p>
                All medical diagnostic, inpatient, and pharmacy charges are subject to hospital credit policy.
                Disputed charges must be filed within 30 days of the invoice issuance date.
              </p>
              {invoice.notes && (
                <p className="text-slate-700 mt-2 italic bg-slate-50 p-2 rounded-md border border-slate-200">
                  Notes: {invoice.notes}
                </p>
              )}
            </div>

            <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Hospital Tax (5%):</span>
                <span className="font-mono font-medium">{formatCurrency(invoice.taxAmount)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Courtesy Discount:</span>
                  <span className="font-mono font-medium">-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {invoice.insuranceCoveredAmount > 0 && (
                <div className="flex justify-between text-teal-700">
                  <span>Insurance Coverage:</span>
                  <span className="font-mono font-medium">-{formatCurrency(invoice.insuranceCoveredAmount)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                <span>Net Invoiced Total:</span>
                <span className="font-mono">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Total Amount Paid:</span>
                <span className="font-mono">{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-base text-rose-600">
                <span>Patient Balance Due:</span>
                <span className="font-mono">{formatCurrency(invoice.balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Payments Receipt History */}
          {payments.length > 0 && (
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Payment Transactions & Receipts ({payments.length})
              </h4>
              <div className="space-y-1.5">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800">{p.receiptNumber}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-600 uppercase font-medium">{p.paymentMethod.replace('_', ' ')}</span>
                      {p.transactionReference && (
                        <span className="text-slate-500 font-mono ml-1.5">({p.transactionReference})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-600 font-mono">
                        {formatCurrency(p.amount)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature Line */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <div className="border-b border-slate-300 pb-8 mb-1" />
              <span>Hospital Authorized Finance Officer</span>
            </div>
            <div className="text-right">
              <div className="border-b border-slate-300 pb-8 mb-1" />
              <span>Patient / Guarantor Signature</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print Official Superbill
          </Button>
        </div>
      </div>
    </Modal>
  );
}
