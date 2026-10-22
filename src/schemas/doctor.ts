import { z } from 'zod';

export const doctorScheduleSlotSchema = z.object({
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm (e.g. 09:00)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm (e.g. 17:00)'),
  maxPatients: z.coerce.number().min(1).default(20),
});

export const doctorFormSchema = z.object({
  fullName: z.string().min(2, 'Full name with title is required (e.g., Dr. Robert Vance, MD)'),
  specialization: z.string().min(2, 'Medical specialization is required'),
  departmentId: z.string().min(1, 'Department assignment is required'),
  department: z.string().optional(),
  licenseNumber: z.string().min(3, 'Medical license / registration number is required'),
  qualifications: z.string().min(2, 'Qualifications are required (e.g. MBBS, MD, FACC)'),
  consultationFee: z.coerce.number().min(0, 'Consultation fee must be $0 or greater'),
  contactNumber: z.string().min(7, 'Contact phone number is required'),
  email: z.string().email('Valid institutional email is required'),
  experienceYears: z.coerce.number().min(0).default(0),
  biography: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  availabilityStatus: z.enum(['available', 'in_consultation', 'on_leave', 'emergency']).default('available'),
  profileId: z.string().optional(),
});

export type DoctorFormData = z.infer<typeof doctorFormSchema>;
export type DoctorScheduleSlotData = z.infer<typeof doctorScheduleSlotSchema>;
