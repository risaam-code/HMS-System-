import { z } from 'zod';

export const labRequestSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  doctorId: z.string().min(1, 'Ordering doctor is required'),
  testId: z.string().min(1, 'Test selection is required'),
  priority: z.enum(['Routine', 'Urgent', 'STAT']),
  clinicalNotes: z.string().optional(),
  medicalRecordId: z.string().optional(),
  visitId: z.string().optional(),
});

export type LabRequestFormData = z.infer<typeof labRequestSchema>;

export const sampleCollectionSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  sampleType: z.string().min(1, 'Sample type is required'),
  containerType: z.string().optional(),
  collectorNotes: z.string().optional(),
});

export type SampleCollectionFormData = z.infer<typeof sampleCollectionSchema>;

export const labResultItemSchema = z.object({
  parameter: z.string().min(1, 'Parameter name is required'),
  value: z.union([z.string(), z.number()]),
  unit: z.string(),
  referenceRange: z.string(),
  flag: z.enum(['normal', 'low', 'high', 'critical']),
});

export const labResultEntrySchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  resultItems: z.array(labResultItemSchema).min(1, 'At least one result parameter is required'),
  interpretation: z.string().optional(),
  isPanicValue: z.boolean().default(false),
});

export type LabResultEntryFormData = z.infer<typeof labResultEntrySchema>;

export const labVerificationSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  verificationNotes: z.string().optional(),
});

export type LabVerificationFormData = z.infer<typeof labVerificationSchema>;
