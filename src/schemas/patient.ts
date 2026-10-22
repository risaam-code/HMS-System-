import { z } from 'zod';

export const patientFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select a gender according to hospital policy' }),
  }),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  phone: z.string().min(7, 'A valid contact phone number is required'),
  email: z.string().email('Invalid email address format').optional().or(z.literal('')),
  address: z.string().min(3, 'Residential address is required'),
  emergencyContactName: z.string().min(2, 'Emergency contact full name is required'),
  emergencyContactRelationship: z.string().min(2, 'Relationship is required (e.g., Spouse, Parent)'),
  emergencyContactPhone: z.string().min(7, 'Emergency contact phone number is required'),
  allergies: z.string().optional(), // Comma-separated or text
  status: z.enum(['active', 'archived', 'admitted', 'critical', 'discharged']).default('active'),
  assignedDoctorId: z.string().optional().or(z.literal('')),
  profilePhotoUrl: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientFormSchema>;

export const patientDocumentUploadSchema = z.object({
  title: z.string().min(2, 'Document title is required'),
  category: z.enum([
    'ID Card',
    'Insurance',
    'Previous Discharge',
    'Lab Report',
    'Imaging',
    'Consent Form',
  ]),
  fileType: z.string().default('PDF'),
  notes: z.string().optional(),
});

export type PatientDocumentUploadData = z.infer<typeof patientDocumentUploadSchema>;
