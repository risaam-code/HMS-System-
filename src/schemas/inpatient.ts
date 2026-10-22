import { z } from 'zod';

export const admissionSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  attendingDoctorId: z.string().min(1, 'Attending doctor is required'),
  departmentId: z.string().min(1, 'Department is required'),
  wardId: z.string().min(1, 'Ward selection is required'),
  bedId: z.string().min(1, 'Bed allocation is required'),
  admissionDate: z.string().min(1, 'Admission date is required'),
  admissionReason: z.string().min(5, 'Admission reason must be at least 5 characters'),
  dailyRate: z.number().min(0, 'Daily rate cannot be negative'),
  expectedDischargeDate: z.string().optional(),
  diagnosis: z.string().optional(),
});

export type AdmissionFormData = z.infer<typeof admissionSchema>;

export const bedTransferSchema = z.object({
  admissionId: z.string().min(1, 'Admission record is required'),
  toWardId: z.string().min(1, 'Destination ward is required'),
  toBedId: z.string().min(1, 'Destination bed is required'),
  transferReason: z.string().min(5, 'Transfer reason is required'),
});

export type BedTransferFormData = z.infer<typeof bedTransferSchema>;

export const nursingObservationSchema = z.object({
  admissionId: z.string().min(1, 'Admission record is required'),
  painScore: z.number().min(0).max(10, 'Pain score must be between 0 and 10'),
  consciousness: z.enum(['Alert', 'Verbal', 'Pain', 'Unresponsive']),
  notes: z.string().min(3, 'Observation notes required'),
  temperature: z.number().min(30).max(45).optional(),
  bloodPressureSystolic: z.number().min(50).max(300).optional(),
  bloodPressureDiastolic: z.number().min(30).max(200).optional(),
  heartRate: z.number().min(30).max(250).optional(),
  respiratoryRate: z.number().min(5).max(80).optional(),
  oxygenSaturation: z.number().min(50).max(100).optional(),
  fluidsIntakeMl: z.number().min(0).optional(),
  fluidsOutputMl: z.number().min(0).optional(),
});

export type NursingObservationFormData = z.infer<typeof nursingObservationSchema>;

export const dischargeSummarySchema = z.object({
  admissionId: z.string().min(1, 'Admission record is required'),
  conditionAtDischarge: z.enum(['recovered', 'improved', 'unchanged', 'critical', 'transferred_out', 'deceased']),
  dischargeDiagnosis: z.string().min(3, 'Discharge diagnosis is required'),
  dischargeInstructions: z.string().min(5, 'Discharge instructions are required'),
  dischargeMedications: z.string().min(3, 'Discharge medications are required'),
  followUpDate: z.string().optional(),
  followUpInstructions: z.string().optional(),
});

export type DischargeSummaryFormData = z.infer<typeof dischargeSummarySchema>;
