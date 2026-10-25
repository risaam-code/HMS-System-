-- ==============================================================================
-- MEDPULSE / LANKAHEALTH HOSPITAL MANAGEMENT SYSTEM (HMS)
-- MASTER SUPABASE DATABASE SCHEMA & SECURITY SETUP (ONE-SHOT SCRIPT)
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Click "SQL Editor" in the left navigation sidebar.
-- 3. Click "+ New query", paste this ENTIRE file into the editor, and click "Run".
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. CLEAN RESET (Safely drops old/partial tables from previous prototype runs)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS
  public.hospital_metrics,
  public.notifications,
  public.leave_requests,
  public.attendance,
  public.refund_records,
  public.payments,
  public.invoice_items,
  public.invoices,
  public.dispensing_items,
  public.dispensing_records,
  public.prescription_items,
  public.prescriptions,
  public.inventory_transactions,
  public.medicine_batches,
  public.medicines,
  public.laboratory_requests,
  public.laboratory_tests,
  public.nursing_observations,
  public.bed_assignments,
  public.admissions,
  public.beds,
  public.wards,
  public.outpatient_visits,
  public.medical_record_amendments,
  public.medical_records,
  public.appointments,
  public.patients,
  public.doctors,
  public.employees,
  public.profiles,
  public.departments,
  public.role_permissions,
  public.permissions,
  public.roles,
  public.audit_logs
CASCADE;

-- Drop legacy enum types if present
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.appointment_status CASCADE;
DROP TYPE IF EXISTS public.patient_status CASCADE;
DROP TYPE IF EXISTS public.priority_level CASCADE;

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. ROLES & PERMISSIONS SYSTEM (RBAC)
-- ------------------------------------------------------------------------------
CREATE TABLE public.roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.roles (id, name, description) VALUES
  ('administrator', 'Administrator', 'Full system access, staff management, and security governance'),
  ('doctor', 'Doctor', 'Clinical orders, patient diagnosis, prescription issuance, and EMR records'),
  ('nurse', 'Nurse', 'Patient vitals, inpatient ward rounding, medicine administration, and triage'),
  ('receptionist', 'Receptionist', 'Patient intake demographics, appointment scheduling, and front-desk flow'),
  ('laboratory_staff', 'Laboratory Staff', 'Diagnostic test processing, analyzer results entry, and report validation'),
  ('pharmacist', 'Pharmacist', 'Prescription dispensing, formulary management, and inventory batch tracking'),
  ('accountant', 'Accountant', 'Patient billing, insurance claim submissions, payment posting, and financial audits');

CREATE TABLE public.permissions (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.permissions (id, module, description) VALUES
  ('dashboard:view', 'dashboard', 'View hospital overview metrics and analytics'),
  ('reports:view', 'reports', 'View operational and clinical reports'),
  ('reports:export', 'reports', 'Export sensitive clinical and financial reports'),
  ('patients:view', 'patients', 'View patient master index demographics'),
  ('patients:create', 'patients', 'Register new patients'),
  ('patients:edit', 'patients', 'Update patient contact and demographics'),
  ('patients:delete', 'patients', 'Archive or delete patient records'),
  ('doctors:view', 'doctors', 'View physician directory and availability'),
  ('doctors:manage', 'doctors', 'Manage doctor credentials, specialties, and schedules'),
  ('staff:view', 'staff', 'View hospital employee directory'),
  ('staff:manage', 'staff', 'Manage staff hiring, shift assignments, and credentials'),
  ('appointments:view', 'appointments', 'View consultation calendar and waiting queues'),
  ('appointments:create', 'appointments', 'Schedule consultations and allocate doctor slots'),
  ('appointments:manage', 'appointments', 'Cancel, reschedule, or triage appointments'),
  ('medical_records:view', 'medical_records', 'Read patient clinical history, notes, and diagnoses'),
  ('medical_records:create', 'medical_records', 'Write consultation notes and diagnostic summaries'),
  ('medical_records:amend', 'medical_records', 'Amend and sign clinical observation records'),
  ('inpatient:view', 'inpatient', 'View ward occupancy and bed census matrix'),
  ('inpatient:admit', 'inpatient', 'Admit patients to wards and assign hospital beds'),
  ('inpatient:discharge', 'inpatient', 'Process inpatient medical discharge and bed turnover'),
  ('laboratory:view', 'laboratory', 'View laboratory orders and status'),
  ('laboratory:request', 'laboratory', 'Order diagnostic laboratory tests for patients'),
  ('laboratory:process', 'laboratory', 'Enter test results and specimen analysis data'),
  ('laboratory:verify', 'laboratory', 'Verify and sign-off on laboratory reports'),
  ('pharmacy:view', 'pharmacy', 'View medicines formulary and stock levels'),
  ('pharmacy:dispense', 'pharmacy', 'Dispense prescriptions to patients'),
  ('pharmacy:inventory', 'pharmacy', 'Adjust inventory stock, log batches, and manage orders'),
  ('billing:view', 'billing', 'View patient invoices and financial statements'),
  ('billing:create_invoice', 'billing', 'Generate invoices and itemized hospital fee sheets'),
  ('billing:post_payment', 'billing', 'Receive payments and post receipts'),
  ('billing:refund', 'billing', 'Authorize and process patient refunds'),
  ('users:view', 'users', 'View system user accounts'),
  ('users:manage', 'users', 'Create and deactivate user logins'),
  ('audit_logs:view', 'audit_logs', 'Inspect immutable audit logs'),
  ('settings:manage', 'settings', 'Manage hospital department master rules');

CREATE TABLE public.role_permissions (
  role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

INSERT INTO public.role_permissions (role_id, permission_id) VALUES
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
  ('laboratory_staff', 'dashboard:view'),
  ('laboratory_staff', 'patients:view'),
  ('laboratory_staff', 'laboratory:view'),
  ('laboratory_staff', 'laboratory:process'),
  ('laboratory_staff', 'laboratory:verify'),
  ('pharmacist', 'dashboard:view'),
  ('pharmacist', 'patients:view'),
  ('pharmacist', 'pharmacy:view'),
  ('pharmacist', 'pharmacy:dispense'),
  ('pharmacist', 'pharmacy:inventory'),
  ('accountant', 'dashboard:view'),
  ('accountant', 'reports:view'),
  ('accountant', 'reports:export'),
  ('accountant', 'patients:view'),
  ('accountant', 'billing:view'),
  ('accountant', 'billing:create_invoice'),
  ('accountant', 'billing:post_payment'),
  ('accountant', 'billing:refund');

-- ------------------------------------------------------------------------------
-- 3. DEPARTMENTS & PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  location TEXT,
  building_wing TEXT,
  floor_number INT DEFAULT 1,
  contact_number TEXT,
  contact_phone TEXT,
  department_head TEXT,
  head_doctor_id UUID,
  total_beds INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.departments (id, name, code, description, building_wing, floor_number, total_beds, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Cardiology', 'CARD', 'Comprehensive cardiac diagnosis, ECG, stress tests and heart surgeries', 'Tower A', 4, 28, 'active'),
  ('00000000-0000-0000-0000-000000000002', 'Neurology', 'NEUR', 'Advanced stroke response, EEG diagnostics, and neuro rehabilitation', 'Tower B', 3, 22, 'active'),
  ('00000000-0000-0000-0000-000000000003', 'Orthopedics', 'ORTH', 'Joint replacement, trauma care, sports medicine and rehabilitation', 'West Pavilion', 2, 34, 'active'),
  ('00000000-0000-0000-0000-000000000004', 'Pediatrics', 'PED', 'Comprehensive child healthcare, neonatal care and vaccination clinics', 'Children Wing', 1, 30, 'active'),
  ('00000000-0000-0000-0000-000000000005', 'General Surgery', 'SURG', 'Laparoscopic and minimally invasive general surgeries and post-op care', 'Surgical Block', 5, 24, 'active'),
  ('00000000-0000-0000-0000-000000000006', 'Emergency & Trauma', 'ER', '24/7 Level 1 Emergency Resuscitation and Urgent Triage Suite', 'Ground Level A', 1, 40, 'active'),
  ('00000000-0000-0000-0000-000000000007', 'Diagnostic Laboratory', 'LAB', 'Full-spectrum automated hematology, biochemistry and microbiology testing', 'East Basement', 0, 0, 'active'),
  ('00000000-0000-0000-0000-000000000008', 'Central Pharmacy', 'PHARM', 'Centralized medicinal dispensaries, barcode scanning and inpatient floor carts', 'Main Lobby', 1, 0, 'active');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES public.roles(id) DEFAULT 'doctor',
  phone TEXT,
  avatar_url TEXT,
  department TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ------------------------------------------------------------------------------
-- 4. EMPLOYEES & DOCTORS
-- ------------------------------------------------------------------------------
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_number TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'staff',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  designation TEXT,
  job_title TEXT,
  employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary')),
  shift TEXT DEFAULT 'Morning' CHECK (shift IN ('Morning', 'Evening', 'Night', 'Rotating')),
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  salary NUMERIC(12,2) DEFAULT 0.00,
  emergency_contact JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated', 'suspended')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employees_role ON public.employees(role);
CREATE INDEX idx_employees_dept ON public.employees(department_id);
CREATE INDEX idx_employees_status ON public.employees(status);

CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  specialization TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  department TEXT,
  contact_number TEXT,
  email TEXT,
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 1500.00,
  experience_years INT DEFAULT 5,
  qualifications TEXT[] DEFAULT '{}',
  biography TEXT,
  availability_schedule JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'in_consultation', 'on_leave', 'emergency')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doctors_dept_id ON public.doctors(department_id);
CREATE INDEX idx_doctors_status ON public.doctors(status);

-- Seed Sample Doctors
INSERT INTO public.doctors (id, full_name, license_number, specialization, department_id, department, contact_number, email, consultation_fee, experience_years, qualifications, availability_status, status)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Dr. Sarah Jenkins, MD', 'SLMC-10842', 'Interventional Cardiology', '00000000-0000-0000-0000-000000000001', 'Cardiology', '+94 77 123 4567', 's.jenkins@lankahealth.org', 2500.00, 14, ARRAY['MBBS (Col)', 'MD (Cardiology)', 'FRCP (UK)'], 'available', 'active'),
  ('d0000000-0000-0000-0000-000000000002', 'Dr. Michael Chang, MD', 'SLMC-10955', 'Neurosurgery & Spine', '00000000-0000-0000-0000-000000000002', 'Neurology', '+94 77 234 5678', 'm.chang@lankahealth.org', 3000.00, 18, ARRAY['MBBS (Col)', 'MS (Neuro)', 'FRCS (Edin)'], 'available', 'active'),
  ('d0000000-0000-0000-0000-000000000003', 'Dr. Elena Rostova, MD', 'SLMC-11024', 'Pediatric Medicine', '00000000-0000-0000-0000-000000000004', 'Pediatrics', '+94 77 345 6789', 'e.rostova@lankahealth.org', 2000.00, 10, ARRAY['MBBS', 'DCH', 'MRCPCH (UK)'], 'available', 'active'),
  ('d0000000-0000-0000-0000-000000000004', 'Dr. David Kim, MD', 'SLMC-11330', 'Orthopedic & Trauma Surgery', '00000000-0000-0000-0000-000000000003', 'Orthopedics', '+94 77 456 7890', 'd.kim@lankahealth.org', 2200.00, 12, ARRAY['MBBS', 'MS (Ortho)', 'FACS'], 'available', 'active'),
  ('d0000000-0000-0000-0000-000000000005', 'Dr. Ananya Sharma, MD', 'SLMC-11512', 'General & Laparoscopic Surgery', '00000000-0000-0000-0000-000000000005', 'General Surgery', '+94 77 567 8901', 'a.sharma@lankahealth.org', 2500.00, 11, ARRAY['MBBS', 'MS (Surg)', 'FMAS'], 'available', 'active');

-- ------------------------------------------------------------------------------
-- 5. MASTER PATIENT INDEX (MPI)
-- ------------------------------------------------------------------------------
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medical_record_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  allergies TEXT[] DEFAULT '{}',
  emergency_contact JSONB DEFAULT '{}'::jsonb,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  documents JSONB DEFAULT '[]',
  profile_photo_url TEXT,
  registration_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased')),
  assigned_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_mrn ON public.patients(medical_record_number);
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_patients_name ON public.patients(first_name, last_name);

-- Seed Sample Patients
INSERT INTO public.patients (id, medical_record_number, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, allergies, status)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'MRN-2026-00101', 'Kamal', 'Perera', '1984-06-12', 'Male', '+94 71 234 5678', 'kamal.perera@example.lk', '142 Galle Road, Colombo 03', 'A+', ARRAY['Penicillin'], 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'MRN-2026-00102', 'Nimali', 'Fernando', '1992-11-28', 'Female', '+94 77 345 6789', 'nimali.f@example.lk', '88 Kandy Road, Kiribathgoda', 'O+', ARRAY['Sulfa'], 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'MRN-2026-00103', 'Sunil', 'Jayawardena', '1965-03-24', 'Male', '+94 75 456 7890', 'sunil.j@example.lk', '23 Duplication Road, Kollupitiya', 'B+', ARRAY[]::TEXT[], 'active'),
  ('c0000000-0000-0000-0000-000000000004', 'MRN-2026-00104', 'Sanduni', 'Silva', '2015-08-15', 'Female', '+94 72 567 8901', 'silva.family@example.lk', '45 Negombo Road, Wattala', 'AB+', ARRAY['Peanuts'], 'active');

-- ------------------------------------------------------------------------------
-- 6. APPOINTMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  date DATE,
  start_time TIME,
  end_time TIME,
  scheduled_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'Consultation' CHECK (type IN ('Consultation', 'Follow-up', 'Emergency', 'Routine Checkup', 'Vaccination')),
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'Checked In', 'In Progress', 'Completed', 'Cancelled', 'No Show')),
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'Urgent', 'STAT')),
  visit_reason TEXT,
  clinical_notes TEXT,
  cancellation_reason TEXT,
  booking_user_id UUID,
  check_in_time TIMESTAMPTZ,
  completed_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- ------------------------------------------------------------------------------
-- 7. MEDICAL RECORDS & CLINICAL ENCOUNTERS
-- ------------------------------------------------------------------------------
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  diagnosis_code TEXT,
  diagnosis_title TEXT NOT NULL,
  clinical_notes TEXT,
  treatment_plan TEXT,
  vital_signs JSONB,
  prescriptions JSONB DEFAULT '[]',
  report_references TEXT[] DEFAULT '{}',
  follow_up_date DATE,
  is_signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  signed_by_doctor_id UUID REFERENCES public.doctors(id),
  is_confidential BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_med_records_patient ON public.medical_records(patient_id);
CREATE INDEX idx_med_records_doctor ON public.medical_records(doctor_id);

CREATE TABLE public.medical_record_amendments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  amended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  amendment_reason TEXT NOT NULL,
  previous_notes TEXT NOT NULL,
  new_notes TEXT NOT NULL
);

CREATE INDEX idx_mr_amendments_record ON public.medical_record_amendments(record_id);

-- ------------------------------------------------------------------------------
-- 8. OUTPATIENT (OPD) VISITS
-- ------------------------------------------------------------------------------
CREATE TABLE public.outpatient_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_number TEXT NOT NULL UNIQUE,
  queue_token TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Registered' CHECK (status IN (
    'Registered', 'Checked In', 'Triage Completed', 'In Consultation',
    'Lab Requested', 'Prescription Issued', 'Billed', 'Completed', 'Cancelled'
  )),
  priority TEXT NOT NULL DEFAULT 'Routine' CHECK (priority IN ('Routine', 'Urgent', 'STAT')),
  is_walk_in BOOLEAN DEFAULT FALSE,
  vitals JSONB,
  chief_complaint TEXT,
  consultation_notes TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  lab_requests TEXT[] DEFAULT '{}',
  prescriptions JSONB DEFAULT '[]',
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 1500.00,
  invoice_id UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opd_patient ON public.outpatient_visits(patient_id);
CREATE INDEX idx_opd_doctor ON public.outpatient_visits(doctor_id);
CREATE INDEX idx_opd_status ON public.outpatient_visits(status);

-- ------------------------------------------------------------------------------
-- 9. INPATIENT (IPD): WARDS, BEDS, ADMISSIONS & NURSING OBSERVATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE public.wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  ward_type TEXT NOT NULL CHECK (ward_type IN ('General', 'ICU', 'Maternity', 'Pediatric', 'Surgical', 'Private')),
  floor_number INT NOT NULL DEFAULT 1,
  total_beds INT NOT NULL DEFAULT 0,
  daily_rate NUMERIC(10,2) NOT NULL DEFAULT 2500.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'full')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.wards (id, name, code, ward_type, floor_number, total_beds, daily_rate, status) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Intensive Care Unit (ICU)', 'ICU-MAIN', 'ICU', 3, 12, 12000.00, 'active'),
  ('e0000000-0000-0000-0000-000000000002', 'Medical Ward 3 (West)', 'GW-3W', 'General', 3, 20, 3500.00, 'active'),
  ('e0000000-0000-0000-0000-000000000003', 'Pediatric Inpatient Unit', 'PED-CARE', 'Pediatric', 2, 16, 4500.00, 'active'),
  ('e0000000-0000-0000-0000-000000000004', 'Surgical Post-Op Pavilion', 'SURG-POST', 'Surgical', 4, 18, 5500.00, 'active'),
  ('e0000000-0000-0000-0000-000000000005', 'Maternity & Neonatal Suite', 'MAT-NEO', 'Maternity', 2, 14, 5000.00, 'active');

CREATE TABLE public.beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id UUID NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL UNIQUE,
  bed_type TEXT NOT NULL DEFAULT 'standard' CHECK (bed_type IN ('standard', 'icu', 'ventilator', 'bariatric', 'pediatric')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'cleaning', 'reserved')),
  daily_rate NUMERIC(10,2) NOT NULL DEFAULT 3500.00,
  current_patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  current_admission_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_beds_ward ON public.beds(ward_id);
CREATE INDEX idx_beds_status ON public.beds(status);

-- Seed Sample Hospital Beds
INSERT INTO public.beds (id, ward_id, bed_number, bed_type, daily_rate, status) VALUES
  ('b0000000-0000-0000-0000-000000000101', 'e0000000-0000-0000-0000-000000000001', 'ICU-101', 'icu', 12000.00, 'available'),
  ('b0000000-0000-0000-0000-000000000102', 'e0000000-0000-0000-0000-000000000001', 'ICU-102', 'ventilator', 15000.00, 'available'),
  ('b0000000-0000-0000-0000-000000000201', 'e0000000-0000-0000-0000-000000000002', 'GW-201', 'standard', 3500.00, 'available'),
  ('b0000000-0000-0000-0000-000000000202', 'e0000000-0000-0000-0000-000000000002', 'GW-202', 'standard', 3500.00, 'available'),
  ('b0000000-0000-0000-0000-000000000301', 'e0000000-0000-0000-0000-000000000003', 'PED-301', 'pediatric', 4500.00, 'available');

CREATE TABLE public.admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  admitting_doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
  bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
  admitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharged_at TIMESTAMPTZ,
  admission_reason TEXT NOT NULL,
  initial_diagnosis TEXT,
  discharge_summary TEXT,
  status TEXT NOT NULL DEFAULT 'admitted' CHECK (status IN ('admitted', 'discharged', 'transferred', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admissions_patient ON public.admissions(patient_id);
CREATE INDEX idx_admissions_status ON public.admissions(status);

CREATE TABLE public.bed_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_id UUID NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  bed_id UUID NOT NULL REFERENCES public.beds(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'discharged')),
  primary_nurse_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  notes TEXT
);

CREATE TABLE public.nursing_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_id UUID NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  nurse_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vital_signs JSONB NOT NULL,
  consciousness_level TEXT DEFAULT 'Alert',
  fluid_intake_ml NUMERIC(8,2) DEFAULT 0,
  fluid_output_ml NUMERIC(8,2) DEFAULT 0,
  iv_infusions TEXT,
  nursing_notes TEXT,
  action_taken TEXT
);

-- ------------------------------------------------------------------------------
-- 10. DIAGNOSTIC LABORATORY (LIS)
-- ------------------------------------------------------------------------------
CREATE TABLE public.laboratory_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_code TEXT NOT NULL UNIQUE,
  test_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Hematology', 'Biochemistry', 'Microbiology', 'Immunology', 'Histopathology', 'Radiology', 'Pathology')),
  specimen_type TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 500.00,
  turnaround_time TEXT NOT NULL,
  reference_ranges JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.laboratory_tests (id, test_code, test_name, category, price, turnaround_time, specimen_type) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'CBC-DIFF', 'Complete Full Blood Count with Differential', 'Hematology', 750.00, '2 Hours', 'Whole Blood (EDTA)'),
  ('a0000000-0000-0000-0000-000000000002', 'FBS-GLUC', 'Fasting Blood Sugar (Glucose)', 'Biochemistry', 450.00, '1 Hour', 'Fluoride Plasma'),
  ('a0000000-0000-0000-0000-000000000003', 'LIPID-FULL', 'Comprehensive Lipid Profile (Cholesterol/Triglycerides)', 'Biochemistry', 1800.00, '3 Hours', 'Serum'),
  ('a0000000-0000-0000-0000-000000000004', 'TROP-I-STAT', 'Troponin-I High Sensitivity (Cardiac STAT)', 'Biochemistry', 3500.00, '30 Mins (STAT)', 'Heparinized Plasma'),
  ('a0000000-0000-0000-0000-000000000005', 'URINE-FR', 'Urine Full Report & Microscopy', 'Pathology', 600.00, '1 Hour', 'Clean Catch Midstream Urine');

CREATE TABLE public.laboratory_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  test_id UUID NOT NULL REFERENCES public.laboratory_tests(id) ON DELETE RESTRICT,
  priority TEXT NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
  status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'sample_collected', 'processing', 'completed', 'cancelled')),
  clinical_notes TEXT,
  results JSONB,
  specimen_collected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_requests_patient ON public.laboratory_requests(patient_id);
CREATE INDEX idx_lab_requests_status ON public.laboratory_requests(status);

-- ------------------------------------------------------------------------------
-- 11. PHARMACY & INVENTORY
-- ------------------------------------------------------------------------------
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku_code TEXT NOT NULL UNIQUE,
  brand_name TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  category TEXT NOT NULL,
  dosage_form TEXT NOT NULL,
  strength TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  stock_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 20,
  manufacturer TEXT,
  is_prescription_required BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.medicines (id, sku_code, brand_name, generic_name, category, dosage_form, strength, unit_price, stock_quantity, reorder_level, manufacturer) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'MED-AMX-500', 'Amoxil', 'Amoxicillin Trihydrate', 'Antibiotics', 'Capsule', '500mg', 35.00, 450, 50, 'GlaxoSmithKline'),
  ('f0000000-0000-0000-0000-000000000002', 'MED-PCM-500', 'Panadol', 'Paracetamol', 'Analgesic', 'Tablet', '500mg', 6.00, 1200, 150, 'GSK Healthcare'),
  ('f0000000-0000-0000-0000-000000000003', 'MED-AML-10', 'Norvasc', 'Amlodipine Besylate', 'Cardiovascular', 'Tablet', '10mg', 45.00, 320, 40, 'Pfizer Labs'),
  ('f0000000-0000-0000-0000-000000000004', 'MED-MET-500', 'Glucophage', 'Metformin HCl', 'Antidiabetic', 'Tablet', '500mg', 20.00, 600, 80, 'Merck Santé'),
  ('f0000000-0000-0000-0000-000000000005', 'MED-OMP-20', 'Losec', 'Omeprazole', 'Gastrointestinal', 'Capsule', '20mg', 30.00, 400, 50, 'AstraZeneca');

CREATE TABLE public.medicine_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  manufacture_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  initial_quantity INT NOT NULL CHECK (initial_quantity >= 0),
  current_quantity INT NOT NULL CHECK (current_quantity >= 0),
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  supplier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_medicine_batch UNIQUE (medicine_id, batch_number)
);

CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
  batch_id UUID REFERENCES public.medicine_batches(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'dispense', 'adjustment', 'return', 'expired_loss')),
  quantity INT NOT NULL,
  balance_after INT NOT NULL,
  reference_number TEXT,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  diagnosis TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_dispensed', 'dispensed', 'cancelled'))
);

CREATE TABLE public.prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INT NOT NULL,
  total_quantity INT NOT NULL,
  instructions TEXT,
  is_dispensed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE public.dispensing_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispensing_number TEXT NOT NULL UNIQUE,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  pharmacist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  dispensed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT
);

CREATE TABLE public.dispensing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispensing_id UUID NOT NULL REFERENCES public.dispensing_records(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
  batch_id UUID REFERENCES public.medicine_batches(id) ON DELETE RESTRICT,
  quantity_dispensed INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 12. BILLING, INVOICES & PAYMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  admission_id UUID REFERENCES public.admissions(id) ON DELETE SET NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  tax_amount NUMERIC(10,2) DEFAULT 0.00,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'cancelled', 'refunded')),
  due_date DATE DEFAULT (CURRENT_DATE + 30),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_patient ON public.invoices(patient_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('consultation', 'ward_bed', 'laboratory', 'pharmacy', 'procedure', 'miscellaneous')),
  item_description TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL,
  reference_id UUID
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_number TEXT NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'insurance', 'bank_transfer', 'online')),
  transaction_reference TEXT,
  received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.refund_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  refund_number TEXT NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  payment_id UUID REFERENCES public.payments(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  authorized_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  refund_date TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. HR, ATTENDANCE & LEAVE MANAGEMENT
-- ------------------------------------------------------------------------------
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'half_day', 'absent', 'on_leave')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_employee_attendance_date UNIQUE (employee_id, date)
);

CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_number TEXT NOT NULL UNIQUE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'casual', 'maternity', 'paternity', 'bereavement', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INT NOT NULL CHECK (days_count > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_comments TEXT
);

-- ------------------------------------------------------------------------------
-- 14. NOTIFICATIONS, AUDIT LOGS & METRICS
-- ------------------------------------------------------------------------------
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info', 'success')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_target_role ON public.notifications(target_role);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  record_id TEXT,
  ip_address TEXT,
  old_values JSONB,
  new_values JSONB,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(target_table, record_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- Prevent unauthorized deletion or modification of audit records
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM public, authenticated, anon;

-- Live Metrics Cache Table for fast dashboard responses
CREATE TABLE public.hospital_metrics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  value TEXT NOT NULL,
  change JSONB DEFAULT '{"value": 0, "trend": "up", "timeframe": "vs last month"}'::jsonb,
  icon TEXT,
  variant TEXT,
  tooltip TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.hospital_metrics (id, title, value, change, icon, variant, tooltip) VALUES
  ('total-patients', 'Total Patients', '1,420', '{"value": 8.4, "trend": "up", "timeframe": "vs last month"}'::jsonb, 'Users', 'blue', 'Total active registered patients in hospital registry'),
  ('doctors', 'Active Doctors', '48', '{"value": 2, "trend": "up", "timeframe": "new this quarter"}'::jsonb, 'UserCheck', 'teal', 'Full-time and visiting consultant physicians on duty'),
  ('today-appointments', 'Today''s Appointments', '64', '{"value": 12.5, "trend": "up", "timeframe": "vs yesterday"}'::jsonb, 'Calendar', 'cyan', 'Confirmed consultations across all clinical departments today'),
  ('current-inpatients', 'Current Inpatients', '118', '{"value": 3.2, "trend": "down", "timeframe": "bed occupancy 78%"}'::jsonb, 'BedDouble', 'indigo', 'Admitted patients currently occupying hospital beds'),
  ('pending-lab-requests', 'Pending Lab Requests', '23', '{"value": 5, "trend": "up", "timeframe": "4 STAT priority"}'::jsonb, 'FlaskConical', 'amber', 'Uncompleted diagnostic orders awaiting laboratory processing'),
  ('occupancy-rate', 'Bed Occupancy', '78.5%', '{"value": 4.1, "trend": "up", "timeframe": "capacity threshold safe"}'::jsonb, 'Activity', 'purple', 'Inpatient bed utilization index across all active wards');

-- ------------------------------------------------------------------------------
-- 15. SECURITY DEFINER HELPER FUNCTIONS (FOR RLS)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_has_permission(perm_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.role_permissions rp ON p.role_id = rp.role_id
    WHERE p.id = auth.uid() AND rp.permission_id = perm_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'administrator';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_clinical_staff()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('administrator', 'doctor', 'nurse');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 16. BUSINESS LOGIC & CONCURRENCY TRIGGERS
-- ------------------------------------------------------------------------------

-- A. Auto User Provisioning Trigger (auth.users -> public.profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role TEXT := 'doctor';
BEGIN
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
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role_id = EXCLUDED.role_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- B. Doctor Double-Booking Concurrency Trigger
CREATE OR REPLACE FUNCTION public.prevent_doctor_double_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('cancelled', 'no_show', 'Cancelled', 'No Show') THEN
    IF EXISTS (
      SELECT 1 FROM public.appointments
      WHERE doctor_id = NEW.doctor_id
        AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND status NOT IN ('cancelled', 'no_show', 'Cancelled', 'No Show')
        AND (
          (NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL AND date = NEW.date
           AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time))
          OR (NEW.scheduled_at IS NOT NULL AND scheduled_at = NEW.scheduled_at)
        )
    ) THEN
      RAISE EXCEPTION 'Scheduling Conflict: Doctor already has an active consultation during this time slot.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_doctor_double_booking ON public.appointments;
CREATE TRIGGER trg_prevent_doctor_double_booking
  BEFORE INSERT OR UPDATE OF doctor_id, scheduled_at, date, start_time, end_time, status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_doctor_double_booking();

-- C. Department Deletion Safety Guard
CREATE OR REPLACE FUNCTION public.check_department_has_records()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.doctors WHERE department_id = OLD.id) THEN
    RAISE EXCEPTION 'Constraint Violation: Cannot delete department with active physician assignments.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.appointments WHERE department_id = OLD.id) THEN
    RAISE EXCEPTION 'Constraint Violation: Cannot delete department linked to historical appointments.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_department_deletion ON public.departments;
CREATE TRIGGER trg_prevent_department_deletion
  BEFORE DELETE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_department_has_records();

-- D. Signed Medical Record Immutability Trigger
CREATE OR REPLACE FUNCTION public.enforce_signed_record_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_signed = TRUE AND NEW.clinical_notes IS DISTINCT FROM OLD.clinical_notes THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.medical_record_amendments
      WHERE record_id = OLD.id
        AND amended_at >= NOW() - INTERVAL '10 seconds'
    ) THEN
      RAISE EXCEPTION 'Integrity Error: Signed clinical notes cannot be modified without recording an official clinical amendment.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_signed_record_immutability ON public.medical_records;
CREATE TRIGGER trg_enforce_signed_record_immutability
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_signed_record_immutability();

-- E. Automated Audit Logging Trigger
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id UUID;
  v_actor_email TEXT;
  v_actor_role TEXT;
  v_action TEXT;
  v_record_id TEXT;
  v_old_values JSONB := NULL;
  v_new_values JSONB := NULL;
BEGIN
  v_actor_id := auth.uid();
  SELECT email, role_id INTO v_actor_email, v_actor_role
  FROM public.profiles WHERE id = v_actor_id;

  v_actor_email := COALESCE(v_actor_email, 'system@lankahealth.org');
  v_actor_role := COALESCE(v_actor_role, 'system');

  IF TG_OP = 'INSERT' THEN
    v_action := TG_TABLE_NAME || '_CREATED';
    v_record_id := NEW.id::TEXT;
    v_new_values := to_jsonb(NEW) - 'password' - 'token';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := TG_TABLE_NAME || '_UPDATED';
    v_record_id := NEW.id::TEXT;
    v_old_values := to_jsonb(OLD) - 'password' - 'token';
    v_new_values := to_jsonb(NEW) - 'password' - 'token';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := TG_TABLE_NAME || '_DELETED';
    v_record_id := OLD.id::TEXT;
    v_old_values := to_jsonb(OLD) - 'password' - 'token';
  END IF;

  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, target_table, record_id, old_values, new_values
  ) VALUES (
    v_actor_id, v_actor_email, v_actor_role, v_action, TG_TABLE_NAME, v_record_id, v_old_values, v_new_values
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_patients ON public.patients;
CREATE TRIGGER trg_audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS trg_audit_medical_records ON public.medical_records;
CREATE TRIGGER trg_audit_medical_records
  AFTER INSERT OR UPDATE OR DELETE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS trg_audit_invoices ON public.invoices;
CREATE TRIGGER trg_audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- ------------------------------------------------------------------------------
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
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
ALTER TABLE public.medical_record_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outpatient_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nursing_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratory_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratory_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_metrics ENABLE ROW LEVEL SECURITY;

-- Read-only system catalogues for all authenticated staff
CREATE POLICY "Allow authenticated read roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read metrics" ON public.hospital_metrics FOR SELECT TO authenticated USING (true);

-- User profile updates
CREATE POLICY "Allow users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin());

-- Clinical and Administrative Data Access
CREATE POLICY "Allow staff read patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff manage patients" ON public.patients FOR ALL TO authenticated USING (public.current_user_has_permission('patients:edit') OR public.is_admin());

CREATE POLICY "Allow staff read doctors" ON public.doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage doctors" ON public.doctors FOR ALL TO authenticated USING (public.is_admin() OR public.current_user_has_permission('doctors:manage'));

CREATE POLICY "Allow staff read appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff manage appointments" ON public.appointments FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow clinical read medical records" ON public.medical_records FOR SELECT TO authenticated USING (public.is_clinical_staff() OR public.is_admin());
CREATE POLICY "Allow doctors manage medical records" ON public.medical_records FOR ALL TO authenticated USING (public.is_clinical_staff() OR public.is_admin());

CREATE POLICY "Allow staff read outpatient visits" ON public.outpatient_visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff manage outpatient visits" ON public.outpatient_visits FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow staff read wards and beds" ON public.wards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff read beds list" ON public.beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow clinical read admissions" ON public.admissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow clinical manage admissions" ON public.admissions FOR ALL TO authenticated USING (public.is_clinical_staff() OR public.is_admin());

CREATE POLICY "Allow staff read lab tests" ON public.laboratory_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff manage lab requests" ON public.laboratory_requests FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow staff read medicines" ON public.medicines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow pharmacy manage medicines" ON public.medicines FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow billing staff read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow billing staff manage invoices" ON public.invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow billing staff manage payments" ON public.payments FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow staff read notifications" ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff update notifications" ON public.notifications FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow admin read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin() OR public.current_user_has_permission('audit_logs:view'));
CREATE POLICY "Allow insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 18. SUPABASE STORAGE BUCKETS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES
      ('avatars', 'avatars', true),
      ('medical-documents', 'medical-documents', false),
      ('lab-reports', 'lab-reports', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
