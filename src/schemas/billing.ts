import { z } from 'zod';

export const invoiceItemSchema = z.object({
  serviceType: z.enum(['consultation', 'laboratory', 'pharmacy', 'admission', 'procedure', 'other']),
  description: z.string().min(2, 'Description is required'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  referenceId: z.string().optional(),
  referenceType: z.enum(['appointment', 'opd_visit', 'lab_request', 'prescription', 'admission', 'manual']).optional(),
});

export const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  discountAmount: z.number().min(0).default(0),
  insuranceCoveredAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required'),
  admissionId: z.string().optional(),
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().min(0.01, 'Payment amount must be greater than zero'),
  paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'insurance', 'check']),
  transactionReference: z.string().optional(),
  idempotencyKey: z.string().min(8, 'Idempotency key required for safe transaction processing'),
  notes: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

export const refundSchema = z.object({
  paymentId: z.string().min(1, 'Payment selection is required'),
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().min(0.01, 'Refund amount must be greater than zero'),
  reason: z.string().min(5, 'Refund justification reason is required'),
});

export type RefundFormData = z.infer<typeof refundSchema>;
