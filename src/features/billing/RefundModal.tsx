import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { refundSchema, RefundFormData } from '@/schemas/billing';
import { BillingService } from '@/services/billingService';
import { Payment } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { Undo2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  onSuccess?: () => void;
}

export function RefundModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: RefundModalProps) {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      reason: '',
    },
  });

  const onSubmit = async (data: RefundFormData) => {
    if (data.amount > payment.amount) {
      addToast(`Refund amount cannot exceed original payment of ${formatCurrency(payment.amount)}`, 'error');
      return;
    }

    setLoading(true);
    try {
      await BillingService.processRefund({
        paymentId: data.paymentId,
        invoiceId: data.invoiceId,
        amount: Number(data.amount),
        reason: data.reason,
        authorizedBy: user?.id || 'usr-acc-01',
        authorizedByName: profile?.fullName || user?.email || 'Financial Director',
      });

      addToast('Authorized refund processed; invoice balance restored', 'success');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process refund';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Authorize Financial Refund & Reopen Balance" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Payment info card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Original Receipt:</span>
            <span className="font-mono font-bold text-slate-800">{payment.receiptNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Invoice Reference:</span>
            <span className="font-mono font-bold text-teal-700">{payment.invoiceNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Patient:</span>
            <span className="font-medium text-slate-900">{payment.patientName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Original Payment Amount:</span>
            <span className="font-bold text-slate-900 text-sm">{formatCurrency(payment.amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Payment Channel:</span>
            <span className="font-medium text-slate-700 uppercase">{payment.paymentMethod.replace('_', ' ')}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Refund Amount ($) *
          </label>
          <Input
            type="number"
            step="0.01"
            max={payment.amount}
            placeholder="0.00"
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Maximum refundable amount for this receipt is {formatCurrency(payment.amount)}.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Administrative / Clinical Justification *
          </label>
          <Input
            placeholder="e.g. Service cancelled, duplicate payment, insurance retroactive coverage"
            {...register('reason')}
            error={errors.reason?.message}
          />
        </div>

        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-xs flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Processing a refund will mark the original receipt as refunded and automatically restore the corresponding balance on invoice <strong>{payment.invoiceNumber}</strong>.
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="destructive" disabled={loading} className="gap-2">
            <Undo2 className="w-4 h-4" />
            {loading ? 'Processing...' : 'Authorize & Process Refund'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
