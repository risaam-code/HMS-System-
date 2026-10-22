import { z } from 'zod';

export const medicineSchema = z.object({
  skuCode: z.string().min(3, 'SKU code is required').regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase alphanumeric and hyphens'),
  brandName: z.string().min(2, 'Brand name is required'),
  genericName: z.string().min(2, 'Generic name is required'),
  category: z.enum([
    'Antibiotics',
    'Analgesics',
    'Cardiovascular',
    'Antidiabetic',
    'Respiratory',
    'Psychiatric',
    'Gastrointestinal',
    'Dermatology',
    'Emergency',
    'Other',
  ]),
  dosageForm: z.enum(['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Inhaler', 'Drops', 'Suppository']),
  strength: z.string().min(1, 'Strength is required (e.g. 500mg, 10mg/mL)'),
  unitPrice: z.number().min(0.01, 'Unit price must be positive'),
  stockQuantity: z.number().int().min(0, 'Stock cannot be negative'),
  reorderLevel: z.number().int().min(1, 'Reorder level must be at least 1'),
  manufacturer: z.string().min(2, 'Manufacturer is required'),
  isPrescriptionRequired: z.boolean().default(true),
});

export type MedicineFormData = z.infer<typeof medicineSchema>;

export const batchReceiptSchema = z.object({
  medicineId: z.string().min(1, 'Medicine selection is required'),
  batchNumber: z.string().min(2, 'Batch number is required').regex(/^[A-Z0-9-]+$/i, 'Invalid batch number'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
  supplier: z.string().min(2, 'Supplier name is required'),
});

export type BatchReceiptFormData = z.infer<typeof batchReceiptSchema>;

export const stockAdjustmentSchema = z.object({
  medicineId: z.string().min(1, 'Medicine selection is required'),
  batchId: z.string().optional(),
  adjustmentType: z.enum(['adjustment', 'return', 'disposal']),
  quantity: z.number().int(), // positive to increase, negative to decrease
  reason: z.string().min(3, 'Reason is required'),
});

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

export const prescriptionItemSchema = z.object({
  medicineId: z.string().min(1, 'Medicine selection is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  quantityPrescribed: z.number().int().min(1, 'Quantity must be at least 1'),
  instructions: z.string().optional(),
});

export const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Prescribing doctor is required'),
  diagnosis: z.string().optional(),
  validUntil: z.string().min(1, 'Validity date is required'),
  notes: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one prescription item is required'),
  medicalRecordId: z.string().optional(),
  visitId: z.string().optional(),
});

export type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

export const dispenseItemSchema = z.object({
  medicineId: z.string().min(1),
  batchId: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
});

export const dispensePrescriptionSchema = z.object({
  prescriptionId: z.string().min(1, 'Prescription ID is required'),
  items: z.array(dispenseItemSchema).min(1, 'At least one item must be dispensed'),
  notes: z.string().optional(),
});

export type DispensePrescriptionFormData = z.infer<typeof dispensePrescriptionSchema>;
