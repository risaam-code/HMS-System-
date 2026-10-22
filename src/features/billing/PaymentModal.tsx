import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { paymentSchema, PaymentFormData } from '@/schemas/billing';
import { BillingService } from '@/services/billingService';
import { Invoice, PaymentMethod } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, DollarSign, ShieldCheck, Lock, RefreshCw } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedInvoice?: Invoice;
  onSuccess?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  preselectedInvoice,
  onSuccess,
}: PaymentModalProps) {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [cardLast4, setCardLast4] = useState('');

  const generateIdempotencyKey = () => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: preselectedInvoice?.id || '',
      amount: preselectedInvoice?.balanceDue || 0,
      paymentMethod: 'credit_card',
      transactionReference: '',
      idempotencyKey: generateIdempotencyKey(),
      notes: '',
    },
  });

  const selectedInvoiceId = watch('invoiceId');
  const paymentMethod = watch('paymentMethod');
  const paymentAmount = watch('amount') || 0;

  useEffect(() => {
    if (isOpen) {
      BillingService.getInvoices().then((list) => {
        const unpaidList = list.filter((inv) => inv.status !== 'paid' && inv.balanceDue > 0);
        setInvoices(unpaidList);
        if (preselectedInvoice) {
          setValue('invoiceId', preselectedInvoice.id);
          setValue('amount', preselectedInvoice.balanceDue);
        } else if (unpaidList.length > 0) {
          setValue('invoiceId', unpaidList[0].id);
          setValue('amount', unpaidList[0].balanceDue);
        }
        setValue('idempotencyKey', generateIdempotencyKey());
      });
    }
  }, [isOpen, preselectedInvoice, setValue]);

  const currentInvoice =
    preselectedInvoice?.id === selectedInvoiceId
      ? preselectedInvoice
      : invoices.find((inv) => inv.id === selectedInvoiceId);

  // When invoice selection changes, update amount default to balance due
  const handleInvoiceChange = (id: string) => {
    setValue('invoiceId', id);
    const target = invoices.find((i) => i.id === id);
    if (target) {
      setValue('amount', target.balanceDue);
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (!currentInvoice) {
      addToast('No active invoice selected', 'error');
      return;
    }

    if (data.amount > currentInvoice.balanceDue) {
      addToast(`Payment amount ($${data.amount}) cannot exceed outstanding balance ($${currentInvoice.balanceDue})`, 'error');
      return;
    }

    setLoading(true);
    try {
      // PCI Compliance: Never store raw card details. Mask transaction reference.
      let finalRef = data.transactionReference;
      if (data.paymentMethod === 'credit_card' || data.paymentMethod === 'debit_card') {
        const safeLast4 = cardLast4.replace(/\D/g, '').slice(-4) || '9012';
        finalRef = `CARD-AUTH-****-****-****-${safeLast4}`;
      }

      await BillingService.recordPayment({
        invoiceId: data.invoiceId,
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod as PaymentMethod,
        transactionReference: finalRef,
        idempotencyKey: data.idempotencyKey,
        receivedBy: user?.id || 'usr-acc-01',
        receivedByName: profile?.fullName || user?.email || 'Hospital Cashier',
        notes: data.notes,
      });

      addToast('Payment processed and official receipt issued', 'success');
      reset();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment transaction failed';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Process Patient Payment & Issue Receipt" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Invoice selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Target Invoice & Patient *
          </label>
          <Select
            options={invoices.map((inv) => ({
              value: inv.id,
              label: `${inv.invoiceNumber} - ${inv.patientName} • Total: ${formatCurrency(inv.totalAmount)} | Balance: ${formatCurrency(inv.balanceDue)}`,
            }))}
            value={selectedInvoiceId}
            onChange={(e) => handleInvoiceChange(e.target.value)}
          />
          {errors.invoiceId && <p className="text-xs text-rose-500 mt-1">{errors.invoiceId.message}</p>}
        </div>

        {currentInvoice && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-500 block">Total Invoiced</span>
              <span className="font-bold text-slate-900 text-sm">{formatCurrency(currentInvoice.totalAmount)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Already Paid</span>
              <span className="font-bold text-emerald-600 text-sm">{formatCurrency(currentInvoice.paidAmount)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Remaining Due</span>
              <span className="font-bold text-rose-600 text-sm">{formatCurrency(currentInvoice.balanceDue)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Amount ($) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8"
                {...register('amount', { valueAsNumber: true })}
                error={errors.amount?.message}
              />
            </div>
            {currentInvoice && paymentAmount < currentInvoice.balanceDue && paymentAmount > 0 && (
              <p className="text-[11px] text-amber-600 font-medium mt-1">
                Partial payment. Remaining balance will be {formatCurrency(currentInvoice.balanceDue - paymentAmount)}.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Channel / Tender *
            </label>
            <Select
              options={[
                { value: 'credit_card', label: 'Credit Card (POS Terminal)' },
                { value: 'debit_card', label: 'Debit Card' },
                { value: 'cash', label: 'Cash Tender' },
                { value: 'bank_transfer', label: 'Bank Wire / ACH' },
                { value: 'insurance', label: 'Third-Party Insurer Direct' },
                { value: 'check', label: 'Cashier Check / Cheque' },
              ]}
              value={paymentMethod}
              onChange={(e) => setValue('paymentMethod', e.target.value as PaymentMethod)}
            />
          </div>
        </div>

        {/* Card info or reference details */}
        {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') ? (
          <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                PCI-DSS Compliant POS Gateway
              </span>
              <span className="text-[11px] text-slate-500">Zero Raw Card Storage Policy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Card Last 4 Digits (For Receipt)
                </label>
                <Input
                  maxLength={4}
                  placeholder="e.g. 4242"
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Terminal Authorization Code
                </label>
                <Input
                  placeholder="e.g. AUTH-893122"
                  {...register('transactionReference')}
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Transaction Reference / Check # / Transfer ID
            </label>
            <Input
              placeholder="e.g. WIRE-2026-9912 or CHK-55102"
              {...register('transactionReference')}
            />
          </div>
        )}

        {/* Idempotency key */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Transaction Idempotency Key *
            </label>
            <button
              type="button"
              onClick={() => setValue('idempotencyKey', generateIdempotencyKey())}
              className="text-[11px] text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Regenerate
            </button>
          </div>
          <Input
            readOnly
            className="font-mono text-xs bg-slate-100 text-slate-600 cursor-not-allowed"
            {...register('idempotencyKey')}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Protects against double billing if network times out or button is pressed multiple times.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Cashier / Settlement Notes
          </label>
          <Input placeholder="Optional receipt remarks" {...register('notes')} />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading} className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            {loading ? 'Processing Payment...' : `Record Payment of ${formatCurrency(paymentAmount)}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
