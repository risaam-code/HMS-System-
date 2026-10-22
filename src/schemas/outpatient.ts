import { z } from 'zod';
import { vitalSignsSchema, prescriptionItemSchema } from './medicalRecord';

export const outpatientIntakeSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  doctorId: z.string().min(1, 'Attending doctor is required'),
  departmentId: z.string().min(1, 'Department is required'),
  appointmentId: z.string().optional(),
  priority: z.enum(['Routine', 'Urgent', 'STAT']).default('Routine'),
  isWalkIn: z.boolean().default(true),
  chiefComplaint: z.string().min(3, 'Chief complaint / reason for visit is required'),
  vitals: vitalSignsSchema.optional(),
});

export type OutpatientIntakeData = z.infer<typeof outpatientIntakeSchema>;

export const outpatientConsultationSchema = z.object({
  consultationNotes: z.string().min(5, 'Consultation notes are required'),
  diagnosis: z.string().min(2, 'Provisional diagnosis is required'),
  treatmentPlan: z.string().min(2, 'Treatment plan is required'),
  labRequests: z.array(z.string()).default([]),
  prescriptions: z.array(prescriptionItemSchema).default([]),
  consultationFee: z.coerce.number().min(0).default(100),
});

export type OutpatientConsultationData = z.infer<typeof outpatientConsultationSchema>;
