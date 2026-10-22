import { z } from 'zod';

export const vitalSignsSchema = z.object({
  temperature: z.coerce.number().min(30).max(45).optional(),
  bloodPressureSystolic: z.coerce.number().min(50).max(280).optional(),
  bloodPressureDiastolic: z.coerce.number().min(30).max(180).optional(),
  heartRate: z.coerce.number().min(30).max(250).optional(),
  respiratoryRate: z.coerce.number().min(6).max(60).optional(),
  oxygenSaturation: z.coerce.number().min(50).max(100).optional(),
  weightKg: z.coerce.number().min(1).max(400).optional(),
  heightCm: z.coerce.number().min(30).max(250).optional(),
});

export const prescriptionItemSchema = z.object({
  medicineName: z.string().min(2, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g., 500mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g., TDS / Twice Daily)'),
  duration: z.string().min(1, 'Duration is required (e.g., 7 Days)'),
  instructions: z.string().optional(),
});

export const medicalRecordFormSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  appointmentId: z.string().optional(),
  visitType: z.enum(['outpatient', 'inpatient', 'emergency', 'telehealth']).default('outpatient'),
  chiefComplaint: z.string().min(3, 'Chief complaint is required'),
  clinicalNotes: z.string().min(5, 'Clinical notes (SOAP observations) are required'),
  diagnosisTitle: z.string().min(2, 'Primary diagnosis is required'),
  diagnosisCode: z.string().optional(), // ICD-10
  treatmentPlan: z.string().min(3, 'Treatment plan is required'),
  vitalSigns: vitalSignsSchema.optional(),
  prescriptions: z.array(prescriptionItemSchema).default([]),
  followUpDate: z.string().optional(),
  reportReferences: z.string().optional(), // Comma-separated list
  isConfidential: z.boolean().default(false),
});

export type MedicalRecordFormData = z.infer<typeof medicalRecordFormSchema>;

export const amendmentFormSchema = z.object({
  amendmentReason: z.string().min(5, 'Mandatory clinical rationale for amending signed chart is required'),
  newNotes: z.string().min(5, 'Updated clinical note text is required'),
});

export type AmendmentFormData = z.infer<typeof amendmentFormSchema>;
