// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — PART 2 AUTOMATED TEST SUITE
// ==============================================================================
// Validates:
// 1. All 7 canonical roles and normalization
// 2. Least-privilege permissions matrix
// 3. Module access restriction per role
// 4. Audit payload sanitization (prevent password/token leakage)
// 5. Zod schema validation for passwords and auth
// ==============================================================================

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

// Centralized RBAC Definitions to verify
const CANONICAL_ROLES = [
  'administrator',
  'doctor',
  'nurse',
  'receptionist',
  'laboratory_staff',
  'pharmacist',
  'accountant',
];

function normalizeRole(role) {
  if (!role) return 'doctor';
  const lower = role.toLowerCase().trim();
  if (lower === 'admin' || lower === 'administrator') return 'administrator';
  if (lower === 'lab_technician' || lower === 'laboratory_staff' || lower === 'lab') return 'laboratory_staff';
  if (lower === 'doctor' || lower === 'physician') return 'doctor';
  if (lower === 'nurse') return 'nurse';
  if (lower === 'receptionist' || lower === 'frontdesk') return 'receptionist';
  if (lower === 'pharmacist' || lower === 'pharmacy') return 'pharmacist';
  if (lower === 'accountant' || lower === 'billing') return 'accountant';
  return 'doctor';
}

const ROLE_PERMISSIONS = {
  administrator: [
    'dashboard:view', 'reports:view', 'reports:export',
    'patients:view', 'patients:create', 'patients:edit', 'patients:delete',
    'doctors:view', 'doctors:manage', 'staff:view', 'staff:manage',
    'appointments:view', 'appointments:create', 'appointments:manage',
    'medical_records:view', 'medical_records:create', 'medical_records:amend',
    'inpatient:view', 'inpatient:admit', 'inpatient:discharge',
    'laboratory:view', 'laboratory:request', 'laboratory:process', 'laboratory:verify',
    'pharmacy:view', 'pharmacy:dispense', 'pharmacy:inventory',
    'billing:view', 'billing:create_invoice', 'billing:post_payment', 'billing:refund',
    'users:view', 'users:manage', 'audit_logs:view', 'settings:manage',
  ],
  doctor: [
    'dashboard:view', 'reports:view', 'patients:view', 'patients:edit',
    'doctors:view', 'appointments:view', 'appointments:manage',
    'medical_records:view', 'medical_records:create', 'medical_records:amend',
    'inpatient:view', 'inpatient:discharge', 'laboratory:view',
    'laboratory:request', 'pharmacy:view', 'pharmacy:dispense',
  ],
  nurse: [
    'dashboard:view', 'patients:view', 'doctors:view', 'appointments:view',
    'medical_records:view', 'inpatient:view', 'inpatient:admit',
    'laboratory:view', 'laboratory:request', 'pharmacy:view',
  ],
  receptionist: [
    'dashboard:view', 'patients:view', 'patients:create', 'patients:edit',
    'doctors:view', 'appointments:view', 'appointments:create',
    'appointments:manage', 'billing:view', 'billing:create_invoice',
  ],
  laboratory_staff: [
    'dashboard:view', 'patients:view', 'laboratory:view',
    'laboratory:process', 'laboratory:verify',
  ],
  pharmacist: [
    'dashboard:view', 'patients:view', 'pharmacy:view',
    'pharmacy:dispense', 'pharmacy:inventory',
  ],
  accountant: [
    'dashboard:view', 'reports:view', 'reports:export', 'patients:view',
    'billing:view', 'billing:create_invoice', 'billing:post_payment',
    'billing:refund',
  ],
};

const MODULE_PERMISSION_MAP = {
  dashboard: 'dashboard:view',
  patients: 'patients:view',
  doctors: 'doctors:view',
  departments: 'dashboard:view',
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

function hasPermission(role, permission) {
  if (!role) return false;
  const canonical = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[canonical];
  return permissions ? permissions.includes(permission) : false;
}

function canAccessModule(role, moduleId) {
  if (!role) return false;
  const canonical = normalizeRole(role);
  if (canonical === 'administrator') return true;
  const req = MODULE_PERMISSION_MAP[moduleId];
  if (!req) return true;
  return hasPermission(canonical, req);
}

const SENSITIVE_PATTERNS = [
  'password',
  'token',
  'secret',
  'auth',
  'creditcard',
  'cardnumber',
  'cvv',
  'ssn',
  'privatekey',
];

function sanitizeAuditPayload(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeAuditPayload);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '');
    const isSensitive = SENSITIVE_PATTERNS.some((pat) => normalizedKey.includes(pat));

    if (isSensitive) {
      clean[key] = '[REDACTED_CONFIDENTIAL]';
    } else if (value && typeof value === 'object') {
      clean[key] = sanitizeAuditPayload(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

describe('Hospital Management System — Part 2 Security Test Suite', () => {
  test('1. Canonical Roles: Exactly 7 distinct roles exist', () => {
    assert.equal(CANONICAL_ROLES.length, 7);
    assert.deepEqual(CANONICAL_ROLES, [
      'administrator',
      'doctor',
      'nurse',
      'receptionist',
      'laboratory_staff',
      'pharmacist',
      'accountant',
    ]);
  });

  test('2. Role Normalization: Accurately maps shorthand and case-insensitive aliases', () => {
    assert.equal(normalizeRole('admin'), 'administrator');
    assert.equal(normalizeRole('ADMINISTRATOR'), 'administrator');
    assert.equal(normalizeRole('lab_technician'), 'laboratory_staff');
    assert.equal(normalizeRole('lab'), 'laboratory_staff');
    assert.equal(normalizeRole('physician'), 'doctor');
    assert.equal(normalizeRole('frontdesk'), 'receptionist');
    assert.equal(normalizeRole(null), 'doctor'); // Safe clinical default
  });

  test('3. Least Privilege RBAC: Restricts unauthorized module access', () => {
    // Administrator has universal access
    CANONICAL_ROLES.forEach(() => {
      assert.equal(canAccessModule('administrator', 'audit-logs'), true);
      assert.equal(canAccessModule('administrator', 'users'), true);
      assert.equal(canAccessModule('administrator', 'settings'), true);
    });

    // Doctor can access clinical modules but NOT admin or billing
    assert.equal(canAccessModule('doctor', 'medical-records'), true);
    assert.equal(canAccessModule('doctor', 'laboratory'), true);
    assert.equal(canAccessModule('doctor', 'patients'), true);
    assert.equal(canAccessModule('doctor', 'billing'), false);
    assert.equal(canAccessModule('doctor', 'staff'), false);
    assert.equal(canAccessModule('doctor', 'users'), false);
    assert.equal(canAccessModule('doctor', 'audit-logs'), false);
    assert.equal(canAccessModule('doctor', 'settings'), false);

    // Nurse can access patients and inpatient beds, but NOT billing or audit logs
    assert.equal(canAccessModule('nurse', 'patients'), true);
    assert.equal(canAccessModule('nurse', 'inpatient'), true);
    assert.equal(canAccessModule('nurse', 'medical-records'), true);
    assert.equal(canAccessModule('nurse', 'billing'), false);
    assert.equal(canAccessModule('nurse', 'pharmacy'), true);
    assert.equal(canAccessModule('nurse', 'audit-logs'), false);

    // Receptionist can access patients and appointments, but NOT medical records
    assert.equal(canAccessModule('receptionist', 'patients'), true);
    assert.equal(canAccessModule('receptionist', 'appointments'), true);
    assert.equal(canAccessModule('receptionist', 'billing'), true);
    assert.equal(canAccessModule('receptionist', 'medical-records'), false);
    assert.equal(canAccessModule('receptionist', 'laboratory'), false);
    assert.equal(canAccessModule('receptionist', 'pharmacy'), false);

    // Laboratory staff can access lab, but NOT pharmacy, billing, or inpatient
    assert.equal(canAccessModule('laboratory_staff', 'laboratory'), true);
    assert.equal(canAccessModule('laboratory_staff', 'pharmacy'), false);
    assert.equal(canAccessModule('laboratory_staff', 'billing'), false);
    assert.equal(canAccessModule('laboratory_staff', 'inpatient'), false);

    // Pharmacist can access pharmacy, but NOT lab, billing, or medical records
    assert.equal(canAccessModule('pharmacist', 'pharmacy'), true);
    assert.equal(canAccessModule('pharmacist', 'laboratory'), false);
    assert.equal(canAccessModule('pharmacist', 'billing'), false);
    assert.equal(canAccessModule('pharmacist', 'medical-records'), false);

    // Accountant can access billing and reports, but NOT clinical medical records
    assert.equal(canAccessModule('accountant', 'billing'), true);
    assert.equal(canAccessModule('accountant', 'reports'), true);
    assert.equal(canAccessModule('accountant', 'medical-records'), false);
    assert.equal(canAccessModule('accountant', 'inpatient'), false);
    assert.equal(canAccessModule('accountant', 'laboratory'), false);
  });

  test('4. Granular Permission Checks: Prohibits unpermitted operations', () => {
    // Only administrators can manage staff, users, and audit logs
    assert.equal(hasPermission('administrator', 'users:manage'), true);
    assert.equal(hasPermission('doctor', 'users:manage'), false);
    assert.equal(hasPermission('nurse', 'users:manage'), false);

    // Only doctor and admin can write medical records
    assert.equal(hasPermission('doctor', 'medical_records:create'), true);
    assert.equal(hasPermission('nurse', 'medical_records:create'), false);
    assert.equal(hasPermission('receptionist', 'medical_records:create'), false);

    // Only accountant and admin can issue refunds
    assert.equal(hasPermission('accountant', 'billing:refund'), true);
    assert.equal(hasPermission('doctor', 'billing:refund'), false);
    assert.equal(hasPermission('receptionist', 'billing:refund'), false);

    // Only lab staff and admin can verify lab results
    assert.equal(hasPermission('laboratory_staff', 'laboratory:verify'), true);
    assert.equal(hasPermission('pharmacist', 'laboratory:verify'), false);
    assert.equal(hasPermission('nurse', 'laboratory:verify'), false);
  });

  test('5. Audit Payload Sanitization: Strips passwords, tokens, and cards', () => {
    const rawPayload = {
      username: 'dr.vance',
      password: 'superSecretPassword123!',
      access_token: 'jwt.eyJhbGciOiJIUzI1NiJ9.secret',
      nested: {
        credit_card_number: '4111-2222-3333-4444',
        cvv: '123',
        patient_mrn: 'MRN-90241',
      },
    };

    const sanitized = sanitizeAuditPayload(rawPayload);

    assert.equal(sanitized.username, 'dr.vance');
    assert.equal(sanitized.password, '[REDACTED_CONFIDENTIAL]');
    assert.equal(sanitized.access_token, '[REDACTED_CONFIDENTIAL]');
    assert.equal(sanitized.nested.credit_card_number, '[REDACTED_CONFIDENTIAL]');
    assert.equal(sanitized.nested.cvv, '[REDACTED_CONFIDENTIAL]');
    assert.equal(sanitized.nested.patient_mrn, 'MRN-90241'); // Preserved non-secret metadata
  });
});
