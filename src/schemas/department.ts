import { z } from 'zod';

export const departmentFormSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  code: z.string().min(2, 'Department code is required (e.g., CARD, NEURO)').toUpperCase(),
  description: z.string().optional(),
  location: z.string().min(2, 'Location description is required'),
  buildingWing: z.string().min(1, 'Building wing is required'),
  floorNumber: z.coerce.number().min(0, 'Floor number must be 0 or higher'),
  contactNumber: z.string().min(7, 'Contact phone number is required'),
  departmentHead: z.string().optional(),
  headDoctorId: z.string().optional(),
  totalBeds: z.coerce.number().min(0, 'Total beds must be 0 or higher'),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
});

export type DepartmentFormData = z.infer<typeof departmentFormSchema>;
