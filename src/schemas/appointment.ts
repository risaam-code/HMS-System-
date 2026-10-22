import { z } from 'zod';

export const appointmentBookingSchema = z.object({
  patientId: z.string().min(1, 'Please select or register a patient'),
  doctorId: z.string().min(1, 'Please select an attending physician'),
  departmentId: z.string().optional(),
  date: z.string().min(1, 'Appointment date is required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid start time (HH:mm) is required'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid end time (HH:mm) is required'),
  visitReason: z.string().min(3, 'Chief visit reason or symptoms required'),
  priority: z.enum(['low', 'normal', 'urgent']).default('normal'),
  type: z.enum(['consultation', 'follow_up', 'emergency', 'routine_checkup']).default('consultation'),
  notes: z.string().optional(),
}).refine(
  (data) => {
    return data.startTime < data.endTime;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export type AppointmentBookingData = z.infer<typeof appointmentBookingSchema>;

export const appointmentCancellationSchema = z.object({
  cancellationReason: z.string().min(5, 'Mandatory cancellation reason must be at least 5 characters'),
});

export type AppointmentCancellationData = z.infer<typeof appointmentCancellationSchema>;

export const appointmentRescheduleSchema = z.object({
  date: z.string().min(1, 'New appointment date is required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time required'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time required'),
  rescheduleReason: z.string().min(3, 'Reason for rescheduling is required'),
}).refine(
  (data) => data.startTime < data.endTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export type AppointmentRescheduleData = z.infer<typeof appointmentRescheduleSchema>;
