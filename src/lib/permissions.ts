// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — CENTRALIZED PERMISSION MODEL (RBAC)
// ==============================================================================
// Restricts access to pages, data records, and actions based on the user's role.
// ==============================================================================

import { CanonicalRole, UserRole, PermissionName, ModuleId } from '@/types';

export const CANONICAL_ROLES: CanonicalRole[] = [
  'administrator',
  'doctor',
  'nurse',
  'receptionist',
  'laboratory_staff',
  'pharmacist',
  'accountant',
];

/**
 * Normalizes input role strings (including legacy or shorthand tokens like 'admin')
 * into standardized CanonicalRole identifiers.
 */
export function normalizeRole(role?: string | null): CanonicalRole {
  if (!role) return 'doctor'; // Default safe clinical fallback
  const lower = role.toLowerCase().trim();
  if (
    lower === 'admin' ||
    lower === 'administrator' ||
    lower === 'superadmin' ||
    lower === 'super_admin'
  ) {
    return 'administrator';
  }
  if (lower === 'lab_technician' || lower === 'laboratory_staff' || lower === 'lab') return 'laboratory_staff';
  if (lower === 'doctor' || lower === 'physician') return 'doctor';
  if (lower === 'nurse') return 'nurse';
  if (lower === 'receptionist' || lower === 'frontdesk') return 'receptionist';
  if (lower === 'pharmacist' || lower === 'pharmacy') return 'pharmacist';
  if (lower === 'accountant' || lower === 'billing') return 'accountant';
  return 'doctor';
}

export const ROLE_INFO: Record<
  CanonicalRole,
  { title: string; badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'; description: string }
> = {
  administrator: {
    title: 'Hospital Administrator',
    badgeVariant: 'danger',
    description: 'Full supervisory authority over staff, security policies, and system audit logs.',
  },
  doctor: {
    title: 'Consultant Physician / Doctor',
    badgeVariant: 'default',
    description: 'Patient consultations, clinical diagnoses, medical records, and diagnostic orders.',
  },
  nurse: {
    title: 'Staff Nurse',
    badgeVariant: 'info',
    description: 'Inpatient ward care, vital signs triage, bed census, and medication delivery.',
  },
  receptionist: {
    title: 'Admissions & Receptionist',
    badgeVariant: 'secondary',
    description: 'Front-desk patient check-in, appointment booking, and billing intake.',
  },
  laboratory_staff: {
    title: 'Laboratory Technologist',
    badgeVariant: 'warning',
    description: 'Pathology analyzer processing, result validation, and panic value notifications.',
  },
  pharmacist: {
    title: 'Clinical Pharmacist',
    badgeVariant: 'success',
    description: 'Prescription dispensing, drug interaction evaluation, and formulary inventory.',
  },
  accountant: {
    title: 'Financial Accountant',
    badgeVariant: 'secondary',
    description: 'Patient invoice generation, payment processing, insurance claims, and P&L audits.',
  },
};

/**
 * Full Role-to-Permissions Matrix (Least-Privilege Enforcement)
 */
export const ROLE_PERMISSIONS: Record<CanonicalRole, PermissionName[]> = {
  administrator: [
    'dashboard:view',
    'reports:view',
    'reports:export',
    'patients:view',
    'patients:create',
    'patients:edit',
    'patients:delete',
    'doctors:view',
    'doctors:manage',
    'staff:view',
    'staff:manage',
    'appointments:view',
    'appointments:create',
    'appointments:manage',
    'medical_records:view',
    'medical_records:create',
    'medical_records:amend',
    'inpatient:view',
    'inpatient:admit',
    'inpatient:discharge',
    'laboratory:view',
    'laboratory:request',
    'laboratory:process',
    'laboratory:verify',
    'pharmacy:view',
    'pharmacy:dispense',
    'pharmacy:inventory',
    'billing:view',
    'billing:create_invoice',
    'billing:post_payment',
    'billing:refund',
    'users:view',
    'users:manage',
    'audit_logs:view',
    'settings:manage',
  ],

  doctor: [
    'dashboard:view',
    'reports:view',
    'patients:view',
    'patients:edit',
    'doctors:view',
    'staff:view',
    'appointments:view',
    'appointments:manage',
    'medical_records:view',
    'medical_records:create',
    'medical_records:amend',
    'inpatient:view',
    'inpatient:discharge',
    'laboratory:view',
    'laboratory:request',
    'pharmacy:view',
    'pharmacy:dispense',
  ],

  nurse: [
    'dashboard:view',
    'patients:view',
    'doctors:view',
    'staff:view',
    'appointments:view',
    'medical_records:view',
    'inpatient:view',
    'inpatient:admit',
    'laboratory:view',
    'laboratory:request',
    'pharmacy:view',
  ],

  receptionist: [
    'dashboard:view',
    'patients:view',
    'patients:create',
    'patients:edit',
    'doctors:view',
    'staff:view',
    'appointments:view',
    'appointments:create',
    'appointments:manage',
    'billing:view',
    'billing:create_invoice',
  ],

  laboratory_staff: [
    'dashboard:view',
    'patients:view',
    'staff:view',
    'laboratory:view',
    'laboratory:process',
    'laboratory:verify',
  ],

  pharmacist: [
    'dashboard:view',
    'patients:view',
    'staff:view',
    'pharmacy:view',
    'pharmacy:dispense',
    'pharmacy:inventory',
  ],

  accountant: [
    'dashboard:view',
    'reports:view',
    'reports:export',
    'patients:view',
    'staff:view',
    'billing:view',
    'billing:create_invoice',
    'billing:post_payment',
    'billing:refund',
  ],
};

/**
 * Maps each ModuleId to its required permission
 */
export const MODULE_PERMISSION_MAP: Record<ModuleId, PermissionName> = {
  dashboard: 'dashboard:view',
  patients: 'patients:view',
  doctors: 'doctors:view',
  departments: 'dashboard:view', // General operational catalog
  appointments: 'appointments:view',
  'medical-records': 'medical_records:view',
  outpatient: 'appointments:view',
  inpatient: 'inpatient:view',
  laboratory: 'laboratory:view',
  pharmacy: 'pharmacy:view',
  billing: 'billing:view',
  staff: 'staff:view',
  reports: 'reports:view',
  notifications: 'dashboard:view',
  users: 'users:view',
  'audit-logs': 'audit_logs:view',
  settings: 'settings:manage',
};

/**
 * Checks if a given role has a specific granular permission
 */
export function hasPermission(role: UserRole | undefined | null, permission: PermissionName): boolean {
  if (!role) return false;
  const canonical = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[canonical];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Checks if a given role has access to a specific hospital navigation module
 */
export function canAccessModule(role: UserRole | undefined | null, moduleId: ModuleId): boolean {
  if (!role) return false;
  const canonical = normalizeRole(role);
  if (canonical === 'administrator') return true; // Administrator has universal access
  const requiredPermission = MODULE_PERMISSION_MAP[moduleId];
  if (!requiredPermission) return true;
  return hasPermission(canonical, requiredPermission);
}

/**
 * Returns the list of all module IDs accessible by the user's role
 */
export function getAccessibleModules(role: UserRole | undefined | null): ModuleId[] {
  const allModules: ModuleId[] = [
    'dashboard',
    'patients',
    'doctors',
    'departments',
    'appointments',
    'medical-records',
    'outpatient',
    'inpatient',
    'laboratory',
    'pharmacy',
    'billing',
    'staff',
    'reports',
    'notifications',
    'users',
    'audit-logs',
    'settings',
  ];
  return allModules.filter((mod) => canAccessModule(role, mod));
}
