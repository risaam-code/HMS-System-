-- ==============================================================================
-- MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — PART 2 COMPLETE SCHEMA & SECURITY
-- ==============================================================================
-- Migration: 00002_hms_core_database_and_security.sql
-- Covers:
-- 1. Roles, Permissions, Role_Permissions
-- 2. Profiles, Departments, Employees, Doctors
-- 3. Patients, Appointments, Medical_Records
-- 4. Admissions, Laboratory_Tests, Laboratory_Requests
-- 5. Medicines, Invoices, Payments
-- 6. Notifications, Immutable Audit_Logs
-- 7. Full Row Level Security (RLS) Policies on Every Table
-- 8. Triggers for Automatic Auditing, Role Escalation Prevention, and User Provisioning
-- 9. Storage Buckets and Access Control Policies
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ROLES & PERMISSIONS SYSTEM (RBAC)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY, -- 'administrator', 'doctor', 'nurse', 'receptionist', 'laboratory_staff', 'pharmacist', 'accountant'
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Standard Hospital Roles
INSERT INTO public.roles (id, name, description) VALUES
  ('administrator', 'Administrator', 'Full system access, staff management, and security governance'),
  ('doctor', 'Doctor', 'Clinical orders, patient diagnosis, prescription issuance, and EMR records'),
  ('nurse', 'Nurse', 'Patient vitals, inpatient ward rounding, medicine administration, and triage'),
  ('receptionist', 'Receptionist', 'Patient intake demographics, appointment scheduling, and front-desk flow'),
  ('laboratory_staff', 'Laboratory Staff', 'Diagnostic test processing, analyzer results entry, and report validation'),
  ('pharmacist', 'Pharmacist', 'Prescription dispensing, formulary management, and inventory batch tracking'),
  ('accountant', 'Accountant', 'Patient billing, insurance claim submissions, payment posting, and financial audits')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

CREATE TABLE IF NOT EXISTS public.permissions (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Granular Permissions
INSERT INTO public.permissions (id, module, description) VALUES
  -- Dashboard & Reporting
  ('dashboard:view', 'dashboard', 'View hospital overview metrics and analytics'),
  ('reports:view', 'reports', 'View operational and clinical reports'),
  ('reports:export', 'reports', 'Export sensitive clinical and financial reports'),

  -- Patients & Registry
  ('patients:view', 'patients', 'View patient master index demographics'),
  ('patients:create', 'patients', 'Register new patients'),
  ('patients:edit', 'patients', 'Update patient contact and demographics'),
  ('patients:delete', 'patients', 'Archive or delete patient records'),

  -- Doctors & Staff
  ('doctors:view', 'doctors', 'View physician directory and availability'),
  ('doctors:manage', 'doctors', 'Manage doctor credentials, specialties, and schedules'),
  ('staff:view', 'staff', 'View hospital employee directory'),
  ('staff:manage', 'staff', 'Manage staff hiring, shift assignments, and credentials'),

  -- Appointments & OPD
  ('appointments:view', 'appointments', 'View consultation calendar and waiting queues'),
  ('appointments:create', 'appointments', 'Schedule consultations and allocate doctor slots'),
  ('appointments:manage', 'appointments', 'Cancel, reschedule, or triage appointments'),

  -- Clinical Records (EHR / EMR)
  ('medical_records:view', 'medical_records', 'Read patient clinical history, notes, and diagnoses'),
  ('medical_records:create', 'medical_records', 'Write consultation notes and diagnostic summaries'),
  ('medical_records:amend', 'medical_records', 'Amend and sign clinical observation records'),

  -- Inpatient & Admissions (IPD)
  ('inpatient:view', 'inpatient', 'View ward occupancy and bed census matrix'),
  ('inpatient:admit', 'inpatient', 'Admit patients to wards and assign hospital beds'),
  ('inpatient:discharge', 'inpatient', 'Process inpatient medical discharge and bed turnover'),

  -- Laboratory (LIS)
  ('laboratory:view', 'laboratory', 'View laboratory orders and status'),
  ('laboratory:request', 'laboratory', 'Order diagnostic laboratory tests for patients'),
  ('laboratory:process', 'laboratory', 'Enter test results and specimen analysis data'),
  ('laboratory:verify', 'laboratory', 'Verify and sign-off on laboratory reports and panic values'),

  -- Pharmacy
  ('pharmacy:view', 'pharmacy', 'View medicines formulary and stock levels'),
  ('pharmacy:dispense', 'pharmacy', 'Dispense prescriptions to patients'),
  ('pharmacy:inventory', 'pharmacy', 'Adjust inventory stock, log batches, and manage orders'),

  -- Billing & Payments
  ('billing:view', 'billing', 'View patient invoices and financial statements'),
  ('billing:create_invoice', 'billing', 'Generate invoices and itemized hospital fee sheets'),
  ('billing:post_payment', 'billing', 'Receive payments and post receipts'),
  ('billing:refund', 'billing', 'Authorize and process patient transaction refunds'),

  -- Security, Users & Audit
  ('users:view', 'users', 'View user accounts and active logins'),
  ('users:manage', 'users', 'Create users, assign roles, and revoke sessions'),
  ('audit_logs:view', 'audit_logs', 'Inspect immutable HIPAA audit log trail'),
  ('settings:manage', 'settings', 'Configure hospital entity settings and clinical policies')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Seed Mapping of Role -> Permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
  -- Administrator: All Permissions
  ('administrator', 'dashboard:view'),
  ('administrator', 'reports:view'),
  ('administrator', 'reports:export'),
  ('administrator', 'patients:view'),
  ('administrator', 'patients:create'),
  ('administrator', 'patients:edit'),
  ('administrator', 'patients:delete'),
  ('administrator', 'doctors:view'),
  ('administrator', 'doctors:manage'),
  ('administrator', 'staff:view'),
  ('administrator', 'staff:manage'),
  ('administrator', 'appointments:view'),
  ('administrator', 'appointments:create'),
  ('administrator', 'appointments:manage'),
  ('administrator', 'medical_records:view'),
  ('administrator', 'medical_records:create'),
  ('administrator', 'medical_records:amend'),
  ('administrator', 'inpatient:view'),
  ('administrator', 'inpatient:admit'),
  ('administrator', 'inpatient:discharge'),
  ('administrator', 'laboratory:view'),
  ('administrator', 'laboratory:request'),
  ('administrator', 'laboratory:process'),
  ('administrator', 'laboratory:verify'),
  ('administrator', 'pharmacy:view'),
  ('administrator', 'pharmacy:dispense'),
  ('administrator', 'pharmacy:inventory'),
  ('administrator', 'billing:view'),
  ('administrator', 'billing:create_invoice'),
  ('administrator', 'billing:post_payment'),
  ('administrator', 'billing:refund'),
  ('administrator', 'users:view'),
  ('administrator', 'users:manage'),
  ('administrator', 'audit_logs:view'),
  ('administrator', 'settings:manage'),

  -- Doctor
  ('doctor', 'dashboard:view'),
  ('doctor', 'reports:view'),
  ('doctor', 'patients:view'),
  ('doctor', 'patients:edit'),
  ('doctor', 'doctors:view'),
  ('doctor', 'appointments:view'),
  ('doctor', 'appointments:manage'),
  ('doctor', 'medical_records:view'),
  ('doctor', 'medical_records:create'),
  ('doctor', 'medical_records:amend'),
  ('doctor', 'inpatient:view'),
  ('doctor', 'inpatient:discharge'),
  ('doctor', 'laboratory:view'),
  ('doctor', 'laboratory:request'),
  ('doctor', 'pharmacy:view'),
  ('doctor', 'pharmacy:dispense'),

  -- Nurse
  ('nurse', 'dashboard:view'),
  ('nurse', 'patients:view'),
  ('nurse', 'doctors:view'),
  ('nurse', 'appointments:view'),
  ('nurse', 'medical_records:view'),
  ('nurse', 'inpatient:view'),
  ('nurse', 'inpatient:admit'),
  ('nurse', 'laboratory:view'),
  ('nurse', 'laboratory:request'),
  ('nurse', 'pharmacy:view'),

  -- Receptionist
  ('receptionist', 'dashboard:view'),
  ('receptionist', 'patients:view'),
  ('receptionist', 'patients:create'),
  ('receptionist', 'patients:edit'),
  ('receptionist', 'doctors:view'),
  ('receptionist', 'appointments:view'),
  ('receptionist', 'appointments:create'),
  ('receptionist', 'appointments:manage'),
  ('receptionist', 'billing:view'),
  ('receptionist', 'billing:create_invoice'),

  -- Laboratory Staff
  ('laboratory_staff', 'dashboard:view'),
  ('laboratory_staff', 'patients:view'),
  ('laboratory_staff', 'laboratory:view'),
  ('laboratory_staff', 'laboratory:process'),
  ('laboratory_staff', 'laboratory:verify'),

  -- Pharmacist
  ('pharmacist', 'dashboard:view'),
  ('pharmacist', 'patients:view'),
  ('pharmacist', 'pharmacy:view'),
  ('pharmacist', 'pharmacy:dispense'),
  ('pharmacist', 'pharmacy:inventory'),

  -- Accountant
  ('accountant', 'dashboard:view'),
  ('accountant', 'reports:view'),
  ('accountant', 'reports:export'),
  ('accountant', 'patients:view'),
  ('accountant', 'billing:view'),
  ('accountant', 'billing:create_invoice'),
  ('accountant', 'billing:post_payment'),
  ('accountant', 'billing:refund')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- 2. DEPARTMENTS & PROFILES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  building_wing TEXT,
  floor_number INT DEFAULT 1,
  total_beds INT DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Departments
INSERT INTO public.departments (name, code, building_wing, floor_number, total_beds) VALUES
  ('Cardiology', 'CARD', 'Tower A', 4, 28),
  ('Neurology', 'NEUR', 'Tower B', 3, 22),
  ('Orthopedics', 'ORTH', 'West Pavilion', 2, 34),
  ('Pediatrics', 'PED', 'Children Wing', 1, 30),
  ('General Surgery', 'SURG', 'Surgical Block', 5, 24),
  ('Emergency & Trauma', 'ER', 'Ground Level A', 1, 40),
  ('Diagnostic Laboratory', 'LAB', 'East Basement', 0, 0),
  ('Central Pharmacy', 'PHARM', 'Main Lobby', 1, 0)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES public.roles(id) DEFAULT 'doctor',
  phone TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent check: Ensure role_id column exists if table was created in an earlier migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role_id TEXT REFERENCES public.roles(id) DEFAULT 'doctor';
    
    -- Migrate data from legacy 'role' column if present
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
      UPDATE public.profiles SET role_id = CASE 
        WHEN role::text IN ('admin', 'administrator') THEN 'administrator'
        WHEN role::text IN ('doctor', 'physician') THEN 'doctor'
        WHEN role::text = 'nurse' THEN 'nurse'
        WHEN role::text IN ('lab_technician', 'laboratory_staff') THEN 'laboratory_staff'
        WHEN role::text = 'pharmacist' THEN 'pharmacist'
        WHEN role::text = 'accountant' THEN 'accountant'
        WHEN role::text = 'receptionist' THEN 'receptionist'
        ELSE 'doctor'
      END;
    END IF;
  END IF;
END $$;

-- Index on profile email and role
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ==============================================================================
-- 3. EMPLOYEES & DOCTORS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_number TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  shift TEXT DEFAULT 'Morning' CHECK (shift IN ('Morning', 'Evening', 'Night', 'Rotating')),
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  salary NUMERIC(12,2) DEFAULT 0.00,
  emergency_contact JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL UNIQUE,
  specialization TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  experience_years INT DEFAULT 0,
  biography TEXT,
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'in_consultation', 'on_leave', 'emergency')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_dept_id ON public.doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept_id ON public.employees(department_id);

-- ==============================================================================
-- 4. PATIENTS & APPOINTMENTS & MEDICAL RECORDS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medical_record_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE NOT NULL,
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  emergency_contact_relationship TEXT NOT NULL,
  assigned_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'admitted', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_mrn ON public.patients(medical_record_number);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'consultation' CHECK (type IN ('consultation', 'follow_up', 'emergency', 'routine_checkup')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent', 'stat')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
  clinical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_patient ON public.appointments(doctor_id, patient_id);

CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  diagnosis_code TEXT, -- ICD-10
  diagnosis_title TEXT NOT NULL,
  symptoms TEXT,
  physical_examination TEXT,
  treatment_plan TEXT,
  prescription JSONB,
  is_confidential BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON public.medical_records(doctor_id);

-- ==============================================================================
-- 5. ADMISSIONS (IPD)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  attending_doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  ward_name TEXT NOT NULL,
  bed_code TEXT NOT NULL,
  admitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharged_at TIMESTAMPTZ,
  admission_reason TEXT NOT NULL,
  discharge_summary TEXT,
  status TEXT NOT NULL DEFAULT 'admitted' CHECK (status IN ('admitted', 'discharged', 'transferred')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admissions_patient ON public.admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_admissions_bed ON public.admissions(bed_code, status);

-- ==============================================================================
-- 6. LABORATORY TESTS & REQUESTS (LIS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.laboratory_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Hematology', 'Biochemistry', 'Microbiology', 'Pathology', 'Radiology', 'Immunology')),
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  normal_range TEXT,
  turnaround_hours INT DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.laboratory_tests (test_code, name, category, price, normal_range, turnaround_hours) VALUES
  ('CBC-01', 'Complete Blood Count (CBC)', 'Hematology', 45.00, 'WBC: 4.5-11.0, RBC: 4.3-5.9', 4),
  ('LIP-01', 'Lipid Profile Panel', 'Biochemistry', 65.00, 'Total Chol < 200 mg/dL, Trig < 150', 12),
  ('HBA1C-01', 'Hemoglobin A1c (HbA1c)', 'Biochemistry', 55.00, '< 5.7% Normal', 6),
  ('TROP-STAT', 'Troponin-I STAT', 'Biochemistry', 95.00, '< 0.04 ng/mL', 1),
  ('CXR-01', 'Chest X-Ray Posteroanterior (PA)', 'Radiology', 85.00, 'Clear lung fields', 2),
  ('MRI-BRN', 'Brain MRI with Contrast', 'Radiology', 450.00, 'Normal brain parenchyma', 24)
ON CONFLICT (test_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.laboratory_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  test_id UUID NOT NULL REFERENCES public.laboratory_tests(id) ON DELETE RESTRICT,
  technician_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'Routine' CHECK (priority IN ('Routine', 'Urgent', 'STAT')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  result_value TEXT,
  result_notes TEXT,
  is_abnormal BOOLEAN DEFAULT FALSE,
  is_panic_value BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_requests_patient ON public.laboratory_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_status ON public.laboratory_requests(status);

-- ==============================================================================
-- 7. MEDICINES & PHARMACY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku_code TEXT NOT NULL UNIQUE,
  generic_name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  dosage_form TEXT NOT NULL,
  strength TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  stock_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 50,
  batch_number TEXT,
  expiry_date DATE NOT NULL,
  is_prescription_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.medicines (sku_code, generic_name, brand_name, dosage_form, strength, unit_price, stock_quantity, reorder_level, batch_number, expiry_date) VALUES
  ('MED-AMX-500', 'Amoxicillin Trihydrate', 'Amoxil', 'Capsule', '500mg', 0.85, 18, 50, 'BT-9901', '2027-08-31'),
  ('MED-ATV-20', 'Atorvastatin Calcium', 'Lipitor', 'Tablet', '20mg', 1.20, 420, 100, 'BT-8821', '2028-02-15'),
  ('MED-INS-GLR', 'Insulin Glargine', 'Lantus SoloStar', 'Injectable Pen', '100 units/mL', 28.50, 14, 25, 'BT-7712', '2026-12-10'),
  ('MED-PCT-500', 'Paracetamol', 'Tylenol Extra', 'Tablet', '500mg', 0.25, 1200, 300, 'BT-6641', '2028-06-30'),
  ('MED-MOR-10', 'Morphine Sulfate Inj', 'Duramorph', 'Ampoule', '10mg/mL', 8.75, 8, 20, 'BT-5519', '2027-01-20')
ON CONFLICT (sku_code) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_medicines_stock ON public.medicines(stock_quantity, reorder_level);
CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON public.medicines(expiry_date);

-- ==============================================================================
-- 8. INVOICES & PAYMENTS (FINANCE)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  admission_id UUID REFERENCES public.admissions(id) ON DELETE SET NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  insurance_covered_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  balance_due NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded')),
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_patient ON public.invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number TEXT NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'insurance', 'check')),
  transaction_reference TEXT,
  received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_refund BOOLEAN DEFAULT FALSE,
  refund_reason TEXT,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);

-- ==============================================================================
-- 9. NOTIFICATIONS & ALERTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT REFERENCES public.roles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Info' CHECK (severity IN ('Info', 'Warning', 'Critical')),
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(target_role, is_read);

-- ==============================================================================
-- 10. IMMUTABLE AUDIT LOGS (HIPAA COMPLIANT)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL, -- 'USER_LOGIN', 'USER_ROLE_CHANGED', 'PATIENT_RECORD_CHANGED', 'MEDICAL_RECORD_AMENDED', 'PRESCRIPTION_CHANGED', 'LAB_RESULT_VERIFIED', 'INVENTORY_ADJUSTED', 'INVOICE_CREATED', 'PAYMENT_POSTED', 'REFUND_ISSUED'
  target_table TEXT NOT NULL,
  record_id TEXT,
  ip_address TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(target_table, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- STRICT IMMUTABILITY: Prevent any update, delete, or truncate on audit_logs
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM public, authenticated, anon;

-- ==============================================================================
-- 11. SECURITY DEFINER HELPER FUNCTIONS FOR RLS
-- ==============================================================================

-- Current user role helper
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Current user has permission helper
CREATE OR REPLACE FUNCTION public.current_user_has_permission(perm_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.role_permissions rp ON p.role_id = rp.role_id
    WHERE p.id = auth.uid() AND rp.permission_id = perm_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Quick role checkers
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'administrator';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_clinical_staff()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('administrator', 'doctor', 'nurse');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 12. ROLE ESCALATION PREVENTION TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If role_id is being changed
  IF OLD.role_id IS DISTINCT FROM NEW.role_id THEN
    -- Check if the modifier is an administrator
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Security Violation: Only system administrators can alter user roles.';
    END IF;

    -- Automatically log role changes to audit_logs
    INSERT INTO public.audit_logs (
      actor_id,
      actor_email,
      actor_role,
      action,
      target_table,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      COALESCE((SELECT email FROM public.profiles WHERE id = auth.uid()), 'system'),
      COALESCE(public.current_user_role(), 'system'),
      'USER_ROLE_CHANGED',
      'profiles',
      NEW.id::TEXT,
      jsonb_build_object('role_id', OLD.role_id),
      jsonb_build_object('role_id', NEW.role_id)
    );
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- ==============================================================================
-- 13. USER REGISTRATION TRIGGER (auth.users -> public.profiles)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role TEXT := 'doctor';
BEGIN
  -- Extract role from user metadata if provided, otherwise default to 'doctor'
  IF (NEW.raw_user_meta_data->>'role') IS NOT NULL AND EXISTS (SELECT 1 FROM public.roles WHERE id = NEW.raw_user_meta_data->>'role') THEN
    default_role := NEW.raw_user_meta_data->>'role';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    default_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES ON ALL APPLICATION TABLES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratory_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratory_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. Roles & Permissions (Read-only for authenticated, manageable by Admin)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Roles readable by authenticated staff" ON public.roles;
CREATE POLICY "Roles readable by authenticated staff"
  ON public.roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permissions readable by authenticated staff" ON public.permissions;
CREATE POLICY "Permissions readable by authenticated staff"
  ON public.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Role_permissions readable by authenticated staff" ON public.role_permissions;
CREATE POLICY "Role_permissions readable by authenticated staff"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- ------------------------------------------------------------------------------
-- B. Profiles RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles readable by authenticated staff" ON public.profiles;
CREATE POLICY "Profiles readable by authenticated staff"
  ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own non-role profile fields" ON public.profiles;
CREATE POLICY "Users can update own non-role profile fields"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- C. Departments RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Departments readable by authenticated staff" ON public.departments;
CREATE POLICY "Departments readable by authenticated staff"
  ON public.departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Departments manageable by administrators" ON public.departments;
CREATE POLICY "Departments manageable by administrators"
  ON public.departments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- D. Employees & Doctors Directory
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Employees readable by authenticated staff" ON public.employees;
CREATE POLICY "Employees readable by authenticated staff"
  ON public.employees FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Employees manageable by administrator" ON public.employees;
CREATE POLICY "Employees manageable by administrator"
  ON public.employees FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Doctors readable by authenticated staff" ON public.doctors;
CREATE POLICY "Doctors readable by authenticated staff"
  ON public.doctors FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Doctors manageable by admin and self" ON public.doctors;
CREATE POLICY "Doctors manageable by admin and self"
  ON public.doctors FOR UPDATE TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin())
  WITH CHECK (profile_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- E. Patients RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Patients readable by authenticated staff" ON public.patients;
CREATE POLICY "Patients readable by authenticated staff"
  ON public.patients FOR SELECT TO authenticated
  USING (public.current_user_has_permission('patients:view') OR public.is_admin());

DROP POLICY IF EXISTS "Patients insertable by receptionist and clinical staff" ON public.patients;
CREATE POLICY "Patients insertable by receptionist and clinical staff"
  ON public.patients FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_permission('patients:create') OR public.is_admin());

DROP POLICY IF EXISTS "Patients updatable by receptionist and clinical staff" ON public.patients;
CREATE POLICY "Patients updatable by receptionist and clinical staff"
  ON public.patients FOR UPDATE TO authenticated
  USING (public.current_user_has_permission('patients:edit') OR public.is_admin())
  WITH CHECK (public.current_user_has_permission('patients:edit') OR public.is_admin());

-- ------------------------------------------------------------------------------
-- F. Appointments RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Appointments readable by authenticated staff" ON public.appointments;
CREATE POLICY "Appointments readable by authenticated staff"
  ON public.appointments FOR SELECT TO authenticated
  USING (public.current_user_has_permission('appointments:view') OR public.is_admin());

DROP POLICY IF EXISTS "Appointments insertable by receptionist and doctors" ON public.appointments;
CREATE POLICY "Appointments insertable by receptionist and doctors"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_permission('appointments:create') OR public.is_admin());

DROP POLICY IF EXISTS "Appointments updatable by authorized staff" ON public.appointments;
CREATE POLICY "Appointments updatable by authorized staff"
  ON public.appointments FOR UPDATE TO authenticated
  USING (public.current_user_has_permission('appointments:manage') OR public.is_admin())
  WITH CHECK (public.current_user_has_permission('appointments:manage') OR public.is_admin());

-- ------------------------------------------------------------------------------
-- G. Medical Records (EMR/EHR) RLS — Strictly Clinical Least Privilege
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Medical records readable by doctors and nurses" ON public.medical_records;
CREATE POLICY "Medical records readable by doctors and nurses"
  ON public.medical_records FOR SELECT TO authenticated
  USING (
    -- Non-confidential records readable by clinical staff
    (NOT is_confidential AND public.current_user_has_permission('medical_records:view'))
    -- Confidential records only readable by attending doctor or administrator
    OR (is_confidential AND (
      doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
      OR public.is_admin()
    ))
  );

DROP POLICY IF EXISTS "Medical records insertable by doctors" ON public.medical_records;
CREATE POLICY "Medical records insertable by doctors"
  ON public.medical_records FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_has_permission('medical_records:create')
    AND doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid() OR public.is_admin())
  );

DROP POLICY IF EXISTS "Medical records updatable only by authoring doctor or admin" ON public.medical_records;
CREATE POLICY "Medical records updatable only by authoring doctor or admin"
  ON public.medical_records FOR UPDATE TO authenticated
  USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- H. Admissions (IPD) RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admissions readable by clinical staff" ON public.admissions;
CREATE POLICY "Admissions readable by clinical staff"
  ON public.admissions FOR SELECT TO authenticated
  USING (public.current_user_has_permission('inpatient:view') OR public.is_admin());

DROP POLICY IF EXISTS "Admissions insertable by nurses and doctors" ON public.admissions;
CREATE POLICY "Admissions insertable by nurses and doctors"
  ON public.admissions FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_permission('inpatient:admit') OR public.is_admin());

DROP POLICY IF EXISTS "Admissions updatable by authorized clinical staff" ON public.admissions;
CREATE POLICY "Admissions updatable by authorized clinical staff"
  ON public.admissions FOR UPDATE TO authenticated
  USING (public.current_user_has_permission('inpatient:discharge') OR public.is_admin())
  WITH CHECK (public.current_user_has_permission('inpatient:discharge') OR public.is_admin());

-- ------------------------------------------------------------------------------
-- I. Laboratory Tests & Requests RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Laboratory tests catalog readable by all staff" ON public.laboratory_tests;
CREATE POLICY "Laboratory tests catalog readable by all staff"
  ON public.laboratory_tests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Laboratory requests readable by clinical and lab staff" ON public.laboratory_requests;
CREATE POLICY "Laboratory requests readable by clinical and lab staff"
  ON public.laboratory_requests FOR SELECT TO authenticated
  USING (
    public.current_user_has_permission('laboratory:view')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Laboratory requests orderable by doctors" ON public.laboratory_requests;
CREATE POLICY "Laboratory requests orderable by doctors"
  ON public.laboratory_requests FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_has_permission('laboratory:request')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Laboratory requests updatable by lab staff and doctors" ON public.laboratory_requests;
CREATE POLICY "Laboratory requests updatable by lab staff and doctors"
  ON public.laboratory_requests FOR UPDATE TO authenticated
  USING (
    public.current_user_has_permission('laboratory:process')
    OR public.current_user_has_permission('laboratory:verify')
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- J. Pharmacy & Medicines RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Medicines catalog readable by clinical and pharmacy staff" ON public.medicines;
CREATE POLICY "Medicines catalog readable by clinical and pharmacy staff"
  ON public.medicines FOR SELECT TO authenticated
  USING (public.current_user_has_permission('pharmacy:view') OR public.is_admin());

DROP POLICY IF EXISTS "Medicines manageable by pharmacists and administrators" ON public.medicines;
CREATE POLICY "Medicines manageable by pharmacists and administrators"
  ON public.medicines FOR ALL TO authenticated
  USING (
    public.current_user_has_permission('pharmacy:inventory')
    OR public.is_admin()
  )
  WITH CHECK (
    public.current_user_has_permission('pharmacy:inventory')
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- K. Billing, Invoices & Payments RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Invoices readable by accountants, receptionists, and admins" ON public.invoices;
CREATE POLICY "Invoices readable by accountants, receptionists, and admins"
  ON public.invoices FOR SELECT TO authenticated
  USING (public.current_user_has_permission('billing:view') OR public.is_admin());

DROP POLICY IF EXISTS "Invoices insertable by accountants and receptionists" ON public.invoices;
CREATE POLICY "Invoices insertable by accountants and receptionists"
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_permission('billing:create_invoice') OR public.is_admin());

DROP POLICY IF EXISTS "Payments readable by accountants and receptionists" ON public.payments;
CREATE POLICY "Payments readable by accountants and receptionists"
  ON public.payments FOR SELECT TO authenticated
  USING (public.current_user_has_permission('billing:view') OR public.is_admin());

DROP POLICY IF EXISTS "Payments insertable by authorized accountants" ON public.payments;
CREATE POLICY "Payments insertable by authorized accountants"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_permission('billing:post_payment') OR public.is_admin());

-- ------------------------------------------------------------------------------
-- L. Notifications RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read their own or role-targeted notifications" ON public.notifications;
CREATE POLICY "Users can read their own or role-targeted notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    recipient_id = auth.uid()
    OR target_role = public.current_user_role()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.notifications;
CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid() OR target_role = public.current_user_role() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- M. Audit Logs RLS (Strictly Immutable, Viewable only by Admin/Auditors)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Audit logs viewable only by administrators" ON public.audit_logs;
CREATE POLICY "Audit logs viewable only by administrators"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.current_user_has_permission('audit_logs:view') OR public.is_admin());

DROP POLICY IF EXISTS "Audit logs insertable by system triggers and authenticated" ON public.audit_logs;
CREATE POLICY "Audit logs insertable by system triggers and authenticated"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- ==============================================================================
-- 15. SUPABASE STORAGE BUCKETS & POLICIES
-- ==============================================================================

-- Create buckets for hospital private attachments
INSERT INTO storage.buckets (id, name, public) VALUES
  ('medical-documents', 'medical-documents', false),
  ('lab-reports', 'lab-reports', false),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies:
-- Avatars: Public read, user upload self
DROP POLICY IF EXISTS "Avatar images publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

-- Medical Documents: Clinical staff only
DROP POLICY IF EXISTS "Medical documents restricted to clinical staff" ON storage.objects;
CREATE POLICY "Medical documents restricted to clinical staff"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'medical-documents' AND public.is_clinical_staff());

DROP POLICY IF EXISTS "Clinical staff can upload medical documents" ON storage.objects;
CREATE POLICY "Clinical staff can upload medical documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-documents' AND public.is_clinical_staff());

-- Lab Reports: Clinical and Lab staff
DROP POLICY IF EXISTS "Lab reports restricted to lab and clinical staff" ON storage.objects;
CREATE POLICY "Lab reports restricted to lab and clinical staff"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'lab-reports' AND (
      public.current_user_role() IN ('administrator', 'doctor', 'nurse', 'laboratory_staff')
    )
  );
